import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Album from "@/models/Album";
import Event from "@/models/Event";
import Club from "@/models/Club";

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const album = await Album.findById(id);
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Check if user is creator OR club admin
    const event = await Event.findById(album.event);
    const club  = await Club.findById(event?.club);

    const isClubAdmin = club?.createdBy?.toString() === session.user.id;
    const isCreator   = album.createdBy?.toString() === session.user.id;

    if (!isClubAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body    = await req.json();
    const updated = await Album.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    return NextResponse.json({ album: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH album error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const album = await Album.findById(id);
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const event = await Event.findById(album.event);
    const club  = await Club.findById(event?.club);

    const isClubAdmin = club?.createdBy?.toString() === session.user.id;
    const isCreator   = album.createdBy?.toString() === session.user.id;

    if (!isClubAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Album.findByIdAndDelete(id);
    return NextResponse.json({ message: "Album deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE album error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}