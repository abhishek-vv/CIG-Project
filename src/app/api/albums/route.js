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

    // If eventId provided — existing logic
    if (eventId) {
      let isMemberOfClub = false;

      if (session?.user) {
        const event = await Event.findById(eventId);
        if (event) {
          const club = await Club.findById(event.club);
          if (club) {
            const isAdmin = club.createdBy?.toString() === session.user.id;
            const isMember = club.members.some(
              (m) => m.user?.toString() === session.user.id
            );
            isMemberOfClub = isAdmin || isMember;
          }
        }
      }

      const query = { event: eventId };
      if (!isMemberOfClub) query.isPublic = true;

      const albums = await Album.find(query)
        .populate("event", "name date")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 });

      return NextResponse.json({ albums }, { status: 200 });
    }

    // No eventId — return all accessible albums
    if (!session?.user) {
      // Not logged in — only public albums
      const albums = await Album.find({ isPublic: true })
        .populate("event", "name date")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 });

      return NextResponse.json({ albums }, { status: 200 });
    }

    // Logged in — find all clubs user is member of
    const userClubs = await Club.find({
      $or: [
        { createdBy: session.user.id },
        { "members.user": session.user.id },
      ],
    });

    const userClubIds = userClubs.map((c) => c._id.toString());

    // Get all events from user's clubs
    const clubEvents = await Event.find({ club: { $in: userClubIds } });
    const clubEventIds = clubEvents.map((e) => e._id.toString());

    // Get all albums:
    // - public albums from any event
    // - private albums only from events in user's clubs
    const albums = await Album.find({
      $or: [
        { isPublic: true },
        { event: { $in: clubEventIds } },
      ],
    })
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

    if (!name || !eventId) {
      return NextResponse.json(
        { error: "Name and event are required" },
        { status: 400 }
      );
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const club = await Club.findById(event.club);
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const isAdmin  = club.createdBy?.toString() === session.user.id;
    const isMember = club.members.some(
      (m) => m.user?.toString() === session.user.id
    );

    if (!isAdmin && !isMember) {
      return NextResponse.json(
        { error: "You must be a club member to create albums" },
        { status: 403 }
      );
    }

    // If event is private, album must be private too
    const albumIsPublic = event.isPublic ? (isPublic ?? true) : false;

    const album = await Album.create({
      name,
      description,
      event:     eventId,
      isPublic:  albumIsPublic,
      createdBy: session.user.id,
    });

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    console.error("POST album error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}