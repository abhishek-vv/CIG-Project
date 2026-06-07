import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Media from "@/models/Media";
import Notification from "@/models/Notification";
import { pusherServer } from "@/lib/pusherServer";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("mediaId");

    if (!mediaId) {
      return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
    }

    const comments = await Comment.find({ media: mediaId })
      .populate("user", "name image")
      .sort({ createdAt: 1 });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error("GET comments error:", error.message);
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

    const { mediaId, content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const comment = await Comment.create({
      content: content.trim(),
      user:    session.user.id,
      media:   mediaId,
    });

    const populated = await Comment.findById(comment._id).populate("user", "name image");

    if (media.uploadedBy.toString() !== session.user.id) {
      const notification = await Notification.create({
        type:     "comment",
        message:  `${session.user.name} commented on your photo`,
        user:     media.uploadedBy,
        fromUser: session.user.id,
        media:    mediaId,
      });

      await pusherServer.trigger(
        `user-${media.uploadedBy.toString()}`,
        "notification",
        {
          _id:     notification._id,
          type:    "comment",
          message: notification.message,
        }
      );
    }

    return NextResponse.json({ comment: populated }, { status: 201 });
  } catch (error) {
    console.error("Comment error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}