import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import Album from "@/models/Album";
import Event from "@/models/Event";
import Club from "@/models/Club";

export async function GET(req) {
  try {
    await connectDB();
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const albumId = searchParams.get("albumId");
    const userId = searchParams.get("userId");

    let query = {};
    if (albumId) query.album = albumId;
    if (userId) query.uploadedBy = userId;

    let isMemberOfClub = false;
    if (albumId && session?.user) {
      const album = await Album.findById(albumId);
      if (album) {
        const event = await Event.findById(album.event);
        if (event) {
          const club = await Club.findById(event.club);
          if (club) {
            const isAdmin = club.createdBy?.toString() === session.user.id;
            const isMember = club.members.some((m) => m.user?.toString() === session.user.id);
            isMemberOfClub = isAdmin || isMember;
          }
        }
      }
    }

    if (!isMemberOfClub) {
      query.isPublic = true;
    }

    const { searchParams: sp } = new URL(req.url);
    const page = parseInt(sp.get("page") || "1");
    const limit = parseInt(sp.get("limit") || "100");
    const skip = (page - 1) * limit;
    const media = await Media.find(query)
      .populate("uploadedBy", "name image")
      .populate("taggedUsers", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ media }, { status: 200 });
  } catch (error) {
    console.error("GET media error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}