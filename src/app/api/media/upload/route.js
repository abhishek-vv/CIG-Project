import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import Media from "@/models/Media";
import Album from "@/models/Album";
import Event from "@/models/Event";
import Club from "@/models/Club";
import rekognition from "@/lib/rekognition";
import { DetectLabelsCommand } from "@aws-sdk/client-rekognition";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await req.formData();
    const files = formData.getAll("files");
    const albumId = formData.get("albumId");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!albumId) {
      return NextResponse.json({ error: "Album is required" }, { status: 400 });
    }

    const album = await Album.findById(albumId);
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const event = await Event.findById(album.event);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const club = await Club.findById(event.club);
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const isAdmin = club.createdBy?.toString() === session.user.id;
    const member = club.members.find((m) => m.user?.toString() === session.user.id);
    const canUpload = isAdmin || ["PHOTOGRAPHER", "CLUB_MEMBER"].includes(member?.role);

    if (!canUpload) {
      return NextResponse.json({ error: "You don't have permission to upload" }, { status: 403 });
    }

    const uploaded = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const dataUri = `data:${file.type};base64,${base64}`;

      const isVideo = file.type.startsWith("video/");
      const resourceType = isVideo ? "video" : "image";

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: `campus-media-hub/${club._id}/${event._id}/${albumId}`,
        resource_type: resourceType,
        transformation: isVideo ? [] : [{ quality: "auto", fetch_format: "auto" }],
      });

      let aiTags = [];

      if (!isVideo) {
        try {
          const labelResult = await rekognition.send(
            new DetectLabelsCommand({
              Image: {
                Bytes: buffer,
              },
              MaxLabels: 20,
              MinConfidence: 70,
            })
          );

          aiTags = (labelResult.Labels || [])
            .map((label) => label.Name.toLowerCase())
            .filter((tag) => tag.length > 2);

          console.log("AI tags detected:", aiTags);
        } catch (error) {
          console.error("Rekognition tagging error:", error.message);
          aiTags = [];
        }
      }

      const media = await Media.create({
        url: result.secure_url,
        publicId: result.public_id,
        type: isVideo ? "video" : "image",
        width: result.width,
        height: result.height,
        size: result.bytes,
        album: albumId,
        uploadedBy: session.user.id,
        tags: aiTags,
        isPublic: album.isPublic,
      });

      uploaded.push(media);
    }

    return NextResponse.json({ media: uploaded, count: uploaded.length }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}