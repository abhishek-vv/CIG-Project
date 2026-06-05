import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import { getUserClubRole, isClubMember } from "@/lib/clubAuth";

// GET all events
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const clubId   = searchParams.get("clubId");
    const sort     = searchParams.get("sort") || "date";

    let query = { isPublic: true };
    if (category) query.category = category;
    if (clubId)   query.club = clubId;

    const sortOptions = {
      date:   { date: -1 },
      name:   { name: 1 },
      newest: { createdAt: -1 },
    };

    const events = await Event.find(query)
      .populate("createdBy", "name")
      .populate("club", "name")
      .sort(sortOptions[sort] || { date: -1 });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create event — must be club admin or photographer
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

    // Check if user is a member of this club
    const clubRole = await getUserClubRole(session.user.id, clubId);
    if (!isClubMember(clubRole)) {
      return NextResponse.json(
        { error: "You must be a club member to create events" },
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