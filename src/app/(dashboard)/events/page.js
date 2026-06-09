"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const CATEGORIES = ["all", "photoshoot", "workshop", "trip", "competition", "fest", "party", "other"];

export default function EventsPage() {
  const { data: session } = useSession();
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("all");
  const [sort,     setSort]     = useState("date");

  async function fetchEvents() {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    params.set("sort", sort);
    const res  = await fetch(`/api/events?${params}`);
    const data = await res.json();
    setEvents(data.events || []);
    setLoading(false);
  }

  useEffect(() => { fetchEvents(); }, [category, sort]);

  const canCreate = session?.user;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-zinc-500 text-sm mt-1">{events.length} events found</p>
        </div>
        {canCreate && (
          <Link href="/events/new" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            + Create event
          </Link>
        )}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition capitalize ${
                category === c
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-auto bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500"
        >
          <option value="date">Sort by date</option>
          <option value="name">Sort by name</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded mb-3 w-3/4"/>
              <div className="h-3 bg-zinc-800 rounded mb-2 w-1/2"/>
              <div className="h-3 bg-zinc-800 rounded w-1/3"/>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium text-zinc-400">No events found</p>
          {canCreate && (
            <Link href="/events/new" className="text-purple-400 text-sm hover:underline mt-2 inline-block">
              Create your first event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.map((event) => (
            <Link
              key={event._id}
              href={`/events/${event._id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:shadow-lg transition group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition">{event.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                  event.isPublic
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                }`}>
                  {event.isPublic ? "Public" : "Private"}
                </span>
              </div>
              {event.description && (
                <p className="text-zinc-500 text-sm mb-3 line-clamp-2">{event.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span className="capitalize">{event.category}</span>
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">By {event.createdBy?.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}