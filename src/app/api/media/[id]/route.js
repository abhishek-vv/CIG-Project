import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import cloudinary from "@/lib/cloudinary";
import Club from "@/models/Club";
import Event from "@/models/Event";
import Album from "@/models/Album";

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const media = await Media.findById(id);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const album = await Album.findById(media.album);
    const event = await Event.findById(album?.event);
    const club  = await Club.findById(event?.club);

    const isClubAdmin = club?.createdBy?.toString() === session.user.id;
    const isUploader  = media.uploadedBy?.toString() === session.user.id;

    if (!isClubAdmin && !isUploader) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.type === "video" ? "video" : "image",
    });

    await Media.findByIdAndDelete(id);

    return NextResponse.json({ message: "Media deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE media error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}