import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Album from "@/models/Album";

// DELETE album
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

    if (album.createdBy.toString() !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Album.findByIdAndDelete(id);

    return NextResponse.json({ message: "Album deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update album
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

    if (album.createdBy.toString() !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await Album.findByIdAndUpdate(id, body, { new: true });

    return NextResponse.json({ album: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}