import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";

// PATCH — club admin assigns role to a member
export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const club = await Club.findById(id);
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    if (club.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only club admin can assign roles" }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!["PHOTOGRAPHER", "CLUB_MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const member = club.members.find((m) => m.user.toString() === userId);
    if (!member) {
      return NextResponse.json({ error: "User is not a member" }, { status: 404 });
    }

    member.role = role;
    await club.save();

    return NextResponse.json({ message: "Role updated" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — club admin removes a member
export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const club = await Club.findById(id);
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Only club admin can remove members
    if (club.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only club admin can remove members" }, { status: 403 });
    }

    const { userId } = await req.json();

    // Cannot remove yourself (the admin)
    if (userId === session.user.id) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    const memberExists = club.members.some((m) => m.user.toString() === userId);
    if (!memberExists) {
      return NextResponse.json({ error: "User is not a member" }, { status: 404 });
    }

    // Remove the member
    club.members = club.members.filter((m) => m.user.toString() !== userId);
    await club.save();

    return NextResponse.json({ message: "Member removed" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}