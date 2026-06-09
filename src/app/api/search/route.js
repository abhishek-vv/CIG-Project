import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import Event from "@/models/Event";
import User from "@/models/User";
import Club from "@/models/Club";
import Album from "@/models/Album";

export async function GET(req) {
  try {
    await connectDB();
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const query    = searchParams.get("q");
    const type     = searchParams.get("type") || "all";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo   = searchParams.get("dateTo");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const results = [];

    if (type === "all" || type === "media") {
      const mediaQuery = {
        $or: [
          { tags:    { $elemMatch: { $regex: query, $options: "i" } } },
          { caption: { $regex: query, $options: "i" } },
        ],
        isPublic: true,
      };

      if (dateFrom || dateTo) {
        mediaQuery.createdAt = {};
        if (dateFrom) mediaQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo)   mediaQuery.createdAt.$lte = new Date(dateTo);
      }

      const media = await Media.find(mediaQuery)
        .populate("uploadedBy", "name")
        .populate("album", "name")
        .limit(20)
        .sort({ createdAt: -1 });

      results.push(...media.map((m) => ({ ...m.toObject(), resultType: "media" })));
    }

    if (type === "all" || type === "events") {
      const events = await Event.find({
        $or: [
          { name:        { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { category:    { $regex: query, $options: "i" } },
        ],
        isPublic: true,
      })
        .populate("createdBy", "name")
        .populate("club", "name")
        .limit(10)
        .sort({ date: -1 });

      results.push(...events.map((e) => ({ ...e.toObject(), resultType: "event" })));
    }

    if (type === "all" || type === "users") {
      const users = await User.find({
        name: { $regex: query, $options: "i" },
      })
        .select("name email createdAt")
        .limit(10);

      results.push(...users.map((u) => ({ ...u.toObject(), resultType: "user" })));
    }

    if (type === "all" || type === "clubs") {
      const clubs = await Club.find({
        $or: [
          { name:        { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { category:    { $regex: query, $options: "i" } },
        ],
      })
        .populate("createdBy", "name")
        .limit(10);

      results.push(...clubs.map((c) => ({ ...c.toObject(), resultType: "club" })));
    }

    if (type === "all" || type === "albums") {
      const albums = await Album.find({
        name:     { $regex: query, $options: "i" },
        isPublic: true,
      })
        .populate("createdBy", "name")
        .populate("event", "name")
        .limit(10);

      results.push(...albums.map((a) => ({ ...a.toObject(), resultType: "album" })));
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Search error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}