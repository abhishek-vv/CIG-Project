import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const FavouriteSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  media: { type: mongoose.Schema.Types.ObjectId, ref: "Media", required: true },
}, { timestamps: true });

FavouriteSchema.index({ user: 1, media: 1 }, { unique: true });

const Favourite = mongoose.models.Favourite || mongoose.model("Favourite", FavouriteSchema);

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("mediaId");

    if (mediaId) {
      const fav = await Favourite.findOne({ user: session.user.id, media: mediaId });
      return NextResponse.json({ favourited: !!fav }, { status: 200 });
    }

    const favourites = await Favourite.find({ user: session.user.id })
      .populate({
        path:     "media",
        select:   "url type caption tags uploadedBy",
        populate: { path: "uploadedBy", select: "name" },
      })
      .sort({ createdAt: -1 });

    // Filter out favourites where media was deleted
    const validFavourites = favourites.filter((f) => f.media !== null);

    return NextResponse.json({ favourites: validFavourites }, { status: 200 });
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

    const { mediaId } = await req.json();

    const existing = await Favourite.findOne({ user: session.user.id, media: mediaId });

    if (existing) {
      await Favourite.findByIdAndDelete(existing._id);
      return NextResponse.json({ favourited: false }, { status: 200 });
    }

    await Favourite.create({ user: session.user.id, media: mediaId });
    return NextResponse.json({ favourited: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}