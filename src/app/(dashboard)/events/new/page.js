"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Suspense } from "react";

const CATEGORIES = ["photoshoot", "workshop", "trip", "competition", "fest", "party", "other"];

function NewEventForm() {
  const { data: session } = useSession();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preselectedClub = searchParams.get("clubId");

  const [clubs,   setClubs]   = useState([]);
  const [form,    setForm]    = useState({
    name: "", description: "", category: "other",
    date: "", isPublic: true, clubId: preselectedClub || "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    async function fetchMyClubs() {
      const res  = await fetch("/api/clubs");
      const data = await res.json();
      const myClubs = (data.clubs || []).filter((club) =>
        club.createdBy?._id === session?.user?.id ||
        club.members?.some((m) => m.user === session?.user?.id || m.user?._id === session?.user?.id)
      );
      setClubs(myClubs);
    }
    if (session) fetchMyClubs();
  }, [session]);

  function handleChange(e) {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.clubId) { setError("Please select a club"); return; }
    setLoading(true);
    const res  = await fetch("/api/events", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); } else { router.push(`/events/${data.event._id}`); }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/events" className="text-sm text-zinc-500 hover:text-zinc-300 transition">← Back to events</Link>
        <h1 className="text-2xl font-bold text-white mt-2">Create event</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Club *</label>
            <select
              name="clubId"
              value={form.clubId}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              required
            >
              <option value="" className="bg-zinc-800">Select a club</option>
              {clubs.map((club) => (
                <option key={club._id} value={club._id} className="bg-zinc-800">{club.name}</option>
              ))}
            </select>
            {clubs.length === 0 && (
              <p className="text-xs text-zinc-500 mt-1">
                You must <Link href="/clubs" className="text-purple-400 hover:underline">join a club</Link> first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Event name *</label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="Annual Photography Meet"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="What is this event about?"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
              <select
                name="category" value={form.category} onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-zinc-800 capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Date *</label>
              <input
                type="date" name="date" value={form.date} onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox" name="isPublic" id="isPublic"
              checked={form.isPublic} onChange={handleChange}
              className="w-4 h-4 accent-purple-600"
            />
            <label htmlFor="isPublic" className="text-sm text-zinc-300">Make this event public</label>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create event"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
      <NewEventForm />
    </Suspense>
  );
}