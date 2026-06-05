import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Album from "@/models/Album";
import Event from "@/models/Event";
import Club from "@/models/Club";

export async function GET(req) {
  try {
    await connectDB();
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    let query = {};
    if (eventId) query.event = eventId;

    // Check if user is member of the club this event belongs to
    let isMemberOfClub = false;
    if (eventId && session?.user) {
      const event = await Event.findById(eventId);
      if (event) {
        const club = await Club.findById(event.club);
        if (club) {
          const isAdmin  = club.createdBy?.toString() === session.user.id;
          const isMember = club.members.some(
            (m) => m.user?.toString() === session.user.id
          );
          isMemberOfClub = isAdmin || isMember;
        }
      }
    }

    // Non-members only see public albums
    if (!isMemberOfClub) {
      query.isPublic = true;
    }

    const albums = await Album.find(query)
      .populate("event", "name date")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ albums }, { status: 200 });
  } catch (error) {
    console.error("GET albums error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { name, description, eventId, isPublic } = await req.json();

    console.log("Creating album:", { name, eventId, isPublic });

    if (!name || !eventId) {
      return NextResponse.json(
        { error: "Name and event are required" },
        { status: 400 }
      );
    }

    // Check if user is member of the club this event belongs to
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    console.log("Event found:", event.name, "club:", event.club);

    const club = await Club.findById(event.club);
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const isAdmin  = club.createdBy?.toString() === session.user.id;
    const isMember = club.members.some(
      (m) => m.user?.toString() === session.user.id
    );

    console.log("isAdmin:", isAdmin, "isMember:", isMember);

    if (!isAdmin && !isMember) {
      return NextResponse.json(
        { error: "You must be a club member to create albums" },
        { status: 403 }
      );
    }

    const album = await Album.create({
      name,
      description,
      event:     eventId,
      isPublic:  isPublic ?? true,
      createdBy: session.user.id,
    });

    console.log("Album created:", album._id);

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    console.error("POST album error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}