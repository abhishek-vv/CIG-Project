import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    const club = await Club.findById(id);
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if already a member — compare as strings to avoid ObjectId mismatch
    const alreadyMember = club.members.some(
      (m) => m.user?.toString() === session.user.id
    );

    // Check if user is the club creator
    const isCreator = club.createdBy?.toString() === session.user.id;

    if (alreadyMember || isCreator) {
      return NextResponse.json(
        { error: "You are already a member of this club" },
        { status: 400 }
      );
    }

    // Validate invite code
    const code = inviteCode.trim().toUpperCase();
    let role = null;

    if (code === club.memberCode) {
      role = "CLUB_MEMBER";
    } else if (code === club.photographerCode) {
      role = "PHOTOGRAPHER";
    } else {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }

    club.members.push({
      user:     session.user.id,
      role,
      joinedAt: new Date(),
    });

    await club.save();

    return NextResponse.json(
      { message: `Joined as ${role}` },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}