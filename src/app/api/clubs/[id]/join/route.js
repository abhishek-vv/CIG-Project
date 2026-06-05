import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";

// POST join a club as CLUB_MEMBER
export async function POST(req, { params }) {
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

    // Check if already a member
    const alreadyMember = club.members.find(
      (m) => m.user.toString() === session.user.id
    );

    if (alreadyMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    club.members.push({
      user: session.user.id,
      role: "CLUB_MEMBER",
    });

    await club.save();

    return NextResponse.json({ message: "Joined club successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}