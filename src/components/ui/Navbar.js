"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const ROLE_COLORS = {
  ADMIN:        "bg-red-100 text-red-700",
  PHOTOGRAPHER: "bg-blue-100 text-blue-700",
  CLUB_MEMBER:  "bg-green-100 text-green-700",
  USER:         "bg-gray-100 text-gray-600",
};

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="text-lg font-semibold text-purple-600 tracking-tight">
        MediaHub
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition">
          Dashboard
        </Link>
        <Link href="/clubs" className="text-sm text-gray-600 hover:text-gray-900 transition">
          Clubs
        </Link>
        <Link href="/events" className="text-sm text-gray-600 hover:text-gray-900 transition">
          Events
        </Link>

        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">{session.user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-red-500 hover:text-red-700 transition"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}