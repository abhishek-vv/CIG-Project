import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";

// GET single club
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const club = await Club.findById(id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email image");

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    return NextResponse.json({ club }, { status: 200 });
  } catch (error) {
    console.error("GET club error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE club
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

    if (club.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only club admin can delete" }, { status: 403 });
    }

    await Club.findByIdAndDelete(id);
    return NextResponse.json({ message: "Club deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}