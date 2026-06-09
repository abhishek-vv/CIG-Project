import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Club from "@/models/Club";
import Media from "@/models/Media";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const session  = await auth();
    const { id }   = await params;

    const user = await User.findById(id).select("name email createdAt");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const clubs = await Club.find({
      $or: [
        { createdBy:      id },
        { "members.user": id },
      ],
    }).select("name category createdBy members");

    // Find shared clubs between viewer and profile user
    let sharedClubIds = [];
    if (session?.user) {
      const viewerClubs = await Club.find({
        $or: [
          { createdBy:      session.user.id },
          { "members.user": session.user.id },
        ],
      }).select("_id");

      const profileClubIds = clubs.map((c) => c._id.toString());
      const viewerClubIds  = viewerClubs.map((c) => c._id.toString());
      sharedClubIds = profileClubIds.filter((id) => viewerClubIds.includes(id));
    }

    // Get all events from shared clubs
    const Event  = (await import("@/models/Event")).default;
    const Album  = (await import("@/models/Album")).default;

    const sharedEvents = await Event.find({ club: { $in: sharedClubIds } });
    const sharedEventIds = sharedEvents.map((e) => e._id.toString());

    const sharedAlbums = await Album.find({ event: { $in: sharedEventIds } });
    const sharedAlbumIds = sharedAlbums.map((a) => a._id.toString());

    // Media query — public always, private only from shared clubs
    const mediaQuery = {
      uploadedBy: id,
      $or: [
        { isPublic: true },
        ...(sharedAlbumIds.length > 0
          ? [{ album: { $in: sharedAlbumIds }, isPublic: false }]
          : []
        ),
      ],
    };

    const media = await Media.find(mediaQuery)
      .populate("album", "name")
      .sort({ createdAt: -1 });

    const clubsWithRole = clubs.map((club) => {
      const isAdmin  = club.createdBy?.toString() === id;
      const member   = club.members?.find((m) => m.user?.toString() === id);
      const role     = isAdmin ? "ADMIN" : member?.role || "MEMBER";
      return { _id: club._id, name: club.name, category: club.category, role };
    });

    return NextResponse.json({ user, clubs: clubsWithRole, media }, { status: 200 });
  } catch (error) {
    console.error("GET user error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}