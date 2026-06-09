"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "@/components/ui/NotificationBell";
import SearchBar from "@/components/ui/SearchBar";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/dashboard",          label: "Dashboard"   },
    { href: "/clubs",              label: "Clubs"        },
    { href: "/events",             label: "Events"       },
    { href: "/upload",             label: "Upload"       },
    { href: "/my-photos",          label: "My Media"     },
    { href: "/favourites",         label: "Favourites"   },
    { href: "/tagged",             label: "Tagged"       },
    { href: "/facial-recognition", label: "Find Me"      },
  ];

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            M
          </div>
          <span className="font-semibold text-white text-sm hidden sm:block">MediaHub</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <SearchBar />

          {session?.user && (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2 border-l border-zinc-800 pl-3">
                <div className="w-7 h-7 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-zinc-200 hidden md:block">{session.user.name}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-xs text-zinc-200 cursor-pointer hover:text-red-400 transition ml-1 pl-10"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white transition"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 grid grid-cols-2 gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 px-3 py-2 rounded-lg transition"
            >
              {link.label}
            </Link>
          ))}
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-red-200 hover:bg-zinc-800 px-3 py-2 rounded-lg transition text-left col-span-2"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}