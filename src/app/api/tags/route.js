import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { pusherServer } from "@/lib/pusherServer";

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { mediaId, userId } = await req.json();

        console.log("Tagging user:", userId, "in media:", mediaId);
        console.log("Tagged by:", session.user.id);

        const media = await Media.findById(mediaId);
        if (!media) {
            return NextResponse.json({ error: "Media not found" }, { status: 404 });
        }

        const userToTag = await User.findById(userId);
        if (!userToTag) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const alreadyTagged = media.taggedUsers.some(
            (id) => id.toString() === userId
        );

        if (alreadyTagged) {
            return NextResponse.json({ error: "User already tagged" }, { status: 400 });
        }

        media.taggedUsers.push(userId);
        await media.save();

        console.log("User tagged successfully");
        console.log("Same user check:", userId === session.user.id);

        if (userId !== session.user.id) {
            console.log("Creating notification for user:", userId);

            const notification = await Notification.create({
                type: "tag",
                message: `${session.user.name} tagged you in a photo`,
                user: userId,
                fromUser: session.user.id,
                media: mediaId,
            });

            console.log("Notification created:", notification._id);
            console.log("Triggering pusher for channel:", `user-${userId}`);

            try {
                await pusherServer.trigger(
                    `user-${userId}`,
                    "notification",
                    {
                        _id: notification._id,
                        type: "tag",
                        message: notification.message,
                        createdAt: notification.createdAt,
                    }
                );
                console.log("Pusher triggered successfully");
            } catch (pusherError) {
                console.error("Pusher error:", pusherError.message);
            }
        } else {
            console.log("Same user — no notification sent");
        }

        const updated = await Media.findById(mediaId)
            .populate("taggedUsers", "name email");

        return NextResponse.json({ taggedUsers: updated.taggedUsers }, { status: 200 });
    } catch (error) {
        console.error("Tag error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { mediaId, userId } = await req.json();

        const media = await Media.findById(mediaId);
        if (!media) {
            return NextResponse.json({ error: "Media not found" }, { status: 404 });
        }

        const isUploader = media.uploadedBy.toString() === session.user.id;
        const isSelf = userId === session.user.id;

        if (!isUploader && !isSelf) {
            return NextResponse.json(
                { error: "Only uploader or tagged user can remove tag" },
                { status: 403 }
            );
        }

        media.taggedUsers = media.taggedUsers.filter(
            (id) => id.toString() !== userId
        );
        await media.save();

        const updated = await Media.findById(mediaId)
            .populate("taggedUsers", "name email");

        return NextResponse.json({ taggedUsers: updated.taggedUsers }, { status: 200 });
    } catch (error) {
        console.error("Remove tag error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}