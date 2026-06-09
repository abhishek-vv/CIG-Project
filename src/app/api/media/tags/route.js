import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { mediaId, tags } = await req.json();

    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.uploadedBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only uploader can edit tags" }, { status: 403 });
    }

    media.tags = tags;
    await media.save();

    return NextResponse.json({ tags: media.tags }, { status: 200 });
  } catch (error) {
    console.error("Edit tags error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}