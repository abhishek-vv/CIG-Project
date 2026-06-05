import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Album from "@/models/Album";

// GET albums (optionally filter by event)
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    let query = {};
    if (eventId) query.event = eventId;

    const albums = await Album.find(query)
      .populate("event", "name date")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ albums }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create album
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "PHOTOGRAPHER", "CLUB_MEMBER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { name, description, eventId, isPublic } = await req.json();

    if (!name || !eventId) {
      return NextResponse.json(
        { error: "Name and event are required" },
        { status: 400 }
      );
    }

    const album = await Album.create({
      name,
      description,
      event: eventId,
      isPublic: isPublic ?? true,
      createdBy: session.user.id,
    });

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}