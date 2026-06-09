import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Album from "@/models/Album";
import Media from "@/models/Media";
import Club from "@/models/Club";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  await connectDB();

  const [eventCount, albumCount, mediaCount, clubCount] = await Promise.all([
    Event.countDocuments(),
    Album.countDocuments(),
    Media.countDocuments(),
    Club.countDocuments(),
  ]);

  const recentMedia = await Media.find({ isPublic: true })
    .populate("uploadedBy", "name")
    .populate("album", "name")
    .sort({ createdAt: -1 })
    .limit(8);

  const { name, role } = session.user;

  const stats = [
    { label: "Clubs",  value: clubCount,  href: "/clubs",  color: "text-violet-400",  bg: "bg-violet-500/10",  icon: "🏛️" },
    { label: "Events", value: eventCount, href: "/events", color: "text-purple-400",  bg: "bg-purple-500/10",  icon: "📅" },
    { label: "Albums", value: albumCount, href: "/albums", color: "text-blue-400",    bg: "bg-blue-500/10",    icon: "🗂️" },
    { label: "Media",  value: mediaCount, href: "/my-photos", color: "text-pink-400", bg: "bg-pink-500/10",    icon: "📸" },
  ];

  const quickActions = [
    { label: "Create club",   href: "/clubs",      icon: "🏛️" },
    { label: "Create event",  href: "/events/new", icon: "📅" },
    { label: "Upload media",  href: "/upload",     icon: "📤" },
    { label: "Find my face",  href: "/facial-recognition", icon: "🔍" },
  ];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {name} 👋
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Here's what's happening on your platform
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
          {role}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition group"
          >
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
              {s.icon}
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-zinc-500 text-sm mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wide">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl px-4 py-3 transition"
            >
              <span className="text-xl">{a.icon}</span>
              <span className="text-sm text-zinc-300 font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {recentMedia.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Recent uploads
            </h2>
            <Link href="/events" className="text-xs text-purple-400 hover:text-purple-300">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {recentMedia.map((item) => (
              <Link
                key={item._id}
                href={`/albums/${item.album?._id || item.album}`}
                className="aspect-square rounded-xl overflow-hidden bg-zinc-800 group"
              >
                {item.type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover group-hover:opacity-80 transition"/>
                ) : (
                  <img src={item.url} alt="recent" className="w-full h-full object-cover group-hover:opacity-80 transition"/>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}