import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Album from "@/models/Album";
import Media from "@/models/Media";
import Link from "next/link";

const ROLE_BADGE = {
  USER:        "bg-gray-100 text-gray-600",
  SUPER_ADMIN: "bg-red-100 text-red-700",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Connect BEFORE any DB operations
  await connectDB();

  const [eventCount, albumCount, mediaCount] = await Promise.all([
    Event.countDocuments(),
    Album.countDocuments(),
    Media.countDocuments(),
  ]);

  const { name, role } = session.user;

  const stats = [
    { label: "Events", value: eventCount, href: "/events",  color: "text-purple-600" },
    { label: "Albums", value: albumCount, href: "/events",  color: "text-blue-600"   },
    { label: "Photos", value: mediaCount, href: "/events",  color: "text-green-600"  },
    { label: "Likes",  value: 0,          href: "#",        color: "text-pink-600"   },
  ];

  const quickActions = [
    { label: "Browse clubs",  href: "/clubs",      show: ["USER", "SUPER_ADMIN"] },
    { label: "Browse events", href: "/events",     show: ["USER", "SUPER_ADMIN"] },
    { label: "My photos",     href: "/my-photos",  show: ["USER", "SUPER_ADMIN"] },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {name} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here&apos;s what&apos;s happening on your platform
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${ROLE_BADGE[role] || ROLE_BADGE.USER}`}>
          {role}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition"
          >
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions
            .filter((a) => a.show.includes(role))
            .map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="text-center border border-gray-200 rounded-lg py-3 px-4 text-sm text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition"
              >
                {a.label}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}