import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import { generateCode } from "@/lib/utils";

// GET all clubs
export async function GET() {
  try {
    await connectDB();
    const clubs = await Club.find({ isActive: true })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ clubs }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create club
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { name, description, category } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 });
    }

    const existing = await Club.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ error: "Club name already taken" }, { status: 400 });
    }

    // Auto generate unique invite codes
    const memberCode       = generateCode("MEM-");
    const photographerCode = generateCode("PHO-");

    const club = await Club.create({
      name,
      description,
      category,
      createdBy:        session.user.id,
      memberCode,
      photographerCode,
      members: [{ user: session.user.id, role: "ADMIN" }],
    });

    return NextResponse.json({ club }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}