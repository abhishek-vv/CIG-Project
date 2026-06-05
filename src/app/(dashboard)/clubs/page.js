"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ClubsPage() {
  const { data: session } = useSession();
  const [clubs,   setClubs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "other" });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const CATEGORIES = ["technical", "cultural", "sports", "photography", "music", "dance", "other"];

  async function fetchClubs() {
    const res = await fetch("/api/clubs");
    const data = await res.json();
    setClubs(data.clubs || []);
    setLoading(false);
  }

  useEffect(() => { fetchClubs(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const res = await fetch("/api/clubs", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      setClubs([data.club, ...clubs]);
      setForm({ name: "", description: "", category: "other" });
      setShowForm(false);
    }
  }

  async function handleJoin(clubId) {
    const res = await fetch(`/api/clubs/${clubId}/join`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      fetchClubs();
    } else {
      alert(data.error);
    }
  }

  function isMember(club) {
    return club.members?.some((m) => m.user?._id === session?.user?.id || m.user === session?.user?.id);
  }

  function isAdmin(club) {
    return club.createdBy?._id === session?.user?.id ||
           club.createdBy === session?.user?.id;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clubs</h1>
          <p className="text-gray-500 text-sm mt-1">{clubs.length} clubs on campus</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
        >
          + Create club
        </button>
      </div>

      {/* Create club form */}
      {showForm && (
        <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">New club</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Club name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <textarea
              placeholder="What is this club about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create club"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clubs grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"/>
              <div className="h-3 bg-gray-100 rounded mb-2 w-1/2"/>
              <div className="h-3 bg-gray-100 rounded w-1/4"/>
            </div>
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">🏛️</p>
          <p className="font-medium">No clubs yet</p>
          <p className="text-sm mt-1">Be the first to create a club!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <div key={club._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{club.name}</h3>
                  <span className="text-xs text-gray-400 capitalize">{club.category}</span>
                </div>
                {isAdmin(club) && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Admin</span>
                )}
                {!isAdmin(club) && isMember(club) && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Joined</span>
                )}
              </div>

              {club.description && (
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{club.description}</p>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                  {club.members?.length || 0} members
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/clubs/${club._id}`}
                    className="text-xs text-purple-600 border border-purple-200 px-3 py-1 rounded-lg hover:bg-purple-50 transition"
                  >
                    View
                  </Link>
                  {!isMember(club) && !isAdmin(club) && (
                    <button
                      onClick={() => handleJoin(club._id)}
                      className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}