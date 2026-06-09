import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import rekognition from "@/lib/rekognition";
import {
  SearchFacesByImageCommand,
  IndexFacesCommand,
  CreateCollectionCommand,
  ListCollectionsCommand,
} from "@aws-sdk/client-rekognition";

const COLLECTION_ID = "campus-media-hub-faces";

async function ensureCollection() {
  try {
    const list = await rekognition.send(new ListCollectionsCommand({}));
    if (!list.CollectionIds.includes(COLLECTION_ID)) {
      await rekognition.send(
        new CreateCollectionCommand({ CollectionId: COLLECTION_ID })
      );
    }
  } catch (error) {
    console.error("Collection error:", error.message);
  }
}

async function indexFace(imageBytes) {
  const command = new IndexFacesCommand({
    CollectionId:    COLLECTION_ID,
    Image:           { Bytes: imageBytes },
    MaxFaces:        1,
    DetectionAttributes: [],
  });
  return rekognition.send(command);
}

async function searchFaces(imageBytes) {
  const command = new SearchFacesByImageCommand({
    CollectionId:       COLLECTION_ID,
    Image:              { Bytes: imageBytes },
    MaxFaces:           100,
    FaceMatchThreshold: 80,
  });
  return rekognition.send(command);
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await ensureCollection();

    const formData  = await req.formData();
    const selfie    = formData.get("selfie");

    if (!selfie) {
      return NextResponse.json({ error: "No selfie provided" }, { status: 400 });
    }

    const bytes       = await selfie.arrayBuffer();
    const imageBytes  = Buffer.from(bytes);

    let faceId = null;

    try {
      const indexed = await indexFace(imageBytes);
      faceId = indexed.FaceRecords?.[0]?.Face?.FaceId;
    } catch (error) {
      return NextResponse.json(
        { error: "No face detected in the selfie. Please try a clearer photo." },
        { status: 400 }
      );
    }

    if (!faceId) {
      return NextResponse.json(
        { error: "Could not process face. Try a different photo." },
        { status: 400 }
      );
    }

    let matchedFaceIds = [];
    try {
      const searchResult = await searchFaces(imageBytes);
      matchedFaceIds = (searchResult.FaceMatches || []).map(
        (m) => m.Face.FaceId
      );
    } catch (error) {
      console.error("Search faces error:", error.message);
    }

    const allMedia = await Media.find({ isPublic: true, type: "image" })
      .populate("uploadedBy", "name")
      .populate("album", "name")
      .sort({ createdAt: -1 });

    const matchingMedia = [];

    for (const media of allMedia) {
      try {
        const response  = await fetch(media.url);
        const arrayBuf  = await response.arrayBuffer();
        const mediaBytes = Buffer.from(arrayBuf);

        const result = await rekognition.send(
          new SearchFacesByImageCommand({
            CollectionId:       COLLECTION_ID,
            Image:              { Bytes: mediaBytes },
            MaxFaces:           10,
            FaceMatchThreshold: 80,
          })
        );

        const matched = (result.FaceMatches || []).some(
          (m) => m.Face.FaceId === faceId || matchedFaceIds.includes(m.Face.FaceId)
        );

        if (matched) matchingMedia.push(media);
      } catch {
        continue;
      }
    }

    return NextResponse.json(
      { media: matchingMedia, count: matchingMedia.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Facial recognition error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}