"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const CATEGORIES = ["photoshoot", "workshop", "trip", "competition", "fest", "party", "other"];

export default function NewEventPage() {
  const { data: session } = useSession();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preselectedClub = searchParams.get("clubId");

  const [clubs,   setCLubs]   = useState([]);
  const [form,    setForm]    = useState({
    name:        "",
    description: "",
    category:    "other",
    date:        "",
    isPublic:    true,
    clubId:      preselectedClub || "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    async function fetchMyClubs() {
      const res  = await fetch("/api/clubs");
      const data = await res.json();
      // Only show clubs where user is a member
      const myClubs = (data.clubs || []).filter((club) =>
        club.createdBy?._id === session?.user?.id ||
        club.members?.some((m) => m.user === session?.user?.id || m.user?._id === session?.user?.id)
      );
      setCLubs(myClubs);
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

    if (!form.clubId) {
      setError("Please select a club");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/events", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      router.push(`/events/${data.event._id}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/events" className="text-sm text-gray-500 hover:text-gray-700">← Back to events</Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Create event</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Club selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Club *</label>
            <select
              name="clubId"
              value={form.clubId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select a club</option>
              {clubs.map((club) => (
                <option key={club._id} value={club._id}>{club.name}</option>
              ))}
            </select>
            {clubs.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                You must <Link href="/clubs" className="text-purple-600 hover:underline">join a club</Link> first to create events.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Annual Photography Meet"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What is this event about?"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublic"
              id="isPublic"
              checked={form.isPublic}
              onChange={handleChange}
              className="w-4 h-4 accent-purple-600"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Make this event public
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create event"}
          </button>
        </form>
      </div>
    </div>
  );
}