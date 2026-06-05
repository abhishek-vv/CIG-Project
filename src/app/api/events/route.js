import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Club from "@/models/Club";

export async function GET(req) {
  try {
    await connectDB();
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const clubId   = searchParams.get("clubId");
    const sort     = searchParams.get("sort") || "date";

    const sortOptions = {
      date:   { date: -1 },
      name:   { name: 1 },
      newest: { createdAt: -1 },
    };

    let query = {};
    if (category) query.category = category;
    if (clubId)   query.club = clubId;

    // Check if user is member of the requested club
    let isMemberOfClub = false;
    if (clubId && session?.user) {
      const club = await Club.findById(clubId);
      if (club) {
        const isAdmin  = club.createdBy?.toString() === session.user.id;
        const isMember = club.members.some(
          (m) => m.user?.toString() === session.user.id
        );
        isMemberOfClub = isAdmin || isMember;
      }
    }

    // Non-members only see public events
    if (!isMemberOfClub) {
      query.isPublic = true;
    }

    // If no clubId, everyone only sees public events
    if (!clubId) {
      query.isPublic = true;
    }

    const events = await Event.find(query)
      .populate("createdBy", "name")
      .populate("club", "name")
      .sort(sortOptions[sort] || { date: -1 });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
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

    const { name, description, category, date, isPublic, clubId } = await req.json();

    if (!name || !date || !clubId) {
      return NextResponse.json(
        { error: "Name, date and club are required" },
        { status: 400 }
      );
    }

    // Check if user is member of THIS specific club
    const club = await Club.findById(clubId);
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const isAdmin  = club.createdBy?.toString() === session.user.id;
    const isMember = club.members.some(
      (m) => m.user?.toString() === session.user.id
    );

    if (!isAdmin && !isMember) {
      return NextResponse.json(
        { error: "You must be a member of this club to create events" },
        { status: 403 }
      );
    }

    const event = await Event.create({
      name,
      description,
      category,
      date:      new Date(date),
      isPublic:  isPublic ?? true,
      club:      clubId,
      createdBy: session.user.id,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}