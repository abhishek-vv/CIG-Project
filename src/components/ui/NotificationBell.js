"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import pusherClient from "@/lib/pusherClient";

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [open,          setOpen]          = useState(false);
  const ref = useRef(null);

  async function fetchNotifications() {
    const res  = await fetch("/api/notifications");
    const data = await res.json();
    if (res.ok) {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  useEffect(() => {
    if (!session?.user || !pusherClient) return;
    fetchNotifications();
    const channel = pusherClient.subscribe(`user-${session.user.id}`);
    channel.bind("pusher:subscription_succeeded", () => {
      console.log("Pusher subscription succeeded!");
    });
    channel.bind("notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    return () => {
      if (pusherClient) pusherClient.unsubscribe(`user-${session.user.id}`);
    };
  }, [session]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ICONS = { like: "❤️", comment: "💬", tag: "🏷️" };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative p-1.5 text-zinc-400 cursor-pointer hover:text-white transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-purple-400 hover:text-purple-300">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                <p className="text-2xl mb-1">🔔</p>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={n._id || i}
                  className={`px-4 py-3 border-b border-zinc-800/50 flex items-start gap-3 ${
                    !n.read ? "bg-purple-500/5" : ""
                  }`}
                >
                  <span className="text-lg shrink-0">{ICONS[n.type] || "🔔"}</span>
                  <div>
                    <p className="text-sm text-zinc-300">{n.message}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Just now"}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-1.5 ml-auto"/>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}