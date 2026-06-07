import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Like from "@/models/Like";
import Media from "@/models/Media";
import Notification from "@/models/Notification";
import { pusherServer } from "@/lib/pusherServer";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { mediaId } = await req.json();

    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const existingLike = await Like.findOne({
      user: session.user.id,
      media: mediaId,
    });

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      const likeCount = await Like.countDocuments({ media: mediaId });
      return NextResponse.json({ liked: false, likeCount }, { status: 200 });
    }

    await Like.create({ user: session.user.id, media: mediaId });

    const likeCount = await Like.countDocuments({ media: mediaId });

    if (media.uploadedBy.toString() !== session.user.id) {
      const notification = await Notification.create({
        type: "like",
        message: `${session.user.name} liked your photo`,
        user: media.uploadedBy,
        fromUser: session.user.id,
        media: mediaId,
      });

      console.log("Triggering pusher for user:", media.uploadedBy.toString());

      await pusherServer.trigger(
        `user-${media.uploadedBy.toString()}`,
        "notification",
        {
          _id: notification._id,
          type: "like",
          message: notification.message,
          createdAt: notification.createdAt,
        }
      );

      console.log("Pusher triggered successfully");
    }

    return NextResponse.json({ liked: true, likeCount }, { status: 200 });
  } catch (error) {
    console.error("Like error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await auth();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("mediaId");

    const likeCount = await Like.countDocuments({ media: mediaId });
    const liked = session?.user
      ? !!(await Like.findOne({ user: session.user.id, media: mediaId }))
      : false;

    return NextResponse.json({ liked, likeCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}