import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Club from "@/models/Club";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await auth();

    const event = await Event.findById(id)
      .populate("createdBy", "name")
      .populate("club", "name");

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // If private, check if user is member of the club
    if (!event.isPublic) {
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const club = await Club.findById(event.club);
      const isAdmin  = club?.createdBy?.toString() === session.user.id;
      const isMember = club?.members.some(
        (m) => m.user?.toString() === session.user.id
      );

      if (!isAdmin && !isMember) {
        return NextResponse.json(
          { error: "This event is private" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check club membership
    const club     = await Club.findById(event.club);
    const isAdmin  = club?.createdBy?.toString() === session.user.id;
    const isCreator = event.createdBy?.toString() === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body    = await req.json();
    const updated = await Event.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    return NextResponse.json({ event: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH event error:", error.message);
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

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const club     = await Club.findById(event.club);
    const isAdmin  = club?.createdBy?.toString() === session.user.id;
    const isCreator = event.createdBy?.toString() === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Event.findByIdAndDelete(id);
    return NextResponse.json({ message: "Event deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}