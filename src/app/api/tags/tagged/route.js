import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const media = await Media.find({
      taggedUsers: session.user.id,
      isPublic:    true,
    })
      .populate("uploadedBy", "name")
      .populate("album", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ media }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}