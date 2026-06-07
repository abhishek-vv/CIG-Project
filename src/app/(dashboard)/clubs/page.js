"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const CATEGORIES = ["technical", "cultural", "sports", "photography", "music", "dance", "other"];

export default function ClubsPage() {
  const { data: session } = useSession();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "other" });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const myClubs = clubs.filter((club) => isAdmin(club) || isMember(club));
  const otherClubs = clubs.filter((club) => !isAdmin(club) && !isMember(club));

  // Join modal state
  const [joinClub, setJoinClub] = useState(null); // which club to join
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState("");

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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

  async function handleJoin(e) {
    e.preventDefault();
    setJoinError("");
    setJoinSuccess("");
    setJoinLoading(true);

    const res = await fetch(`/api/clubs/${joinClub._id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });
    const data = await res.json();
    setJoinLoading(false);

    if (!res.ok) {
      setJoinError(data.error);
    } else {
      setJoinSuccess(data.message);
      await fetchClubs();
      setTimeout(() => {
        setJoinClub(null);
        setInviteCode("");
        setJoinSuccess("");
      }, 1500);
    }
  }

  function isMember(club) {
    return club.members?.some(
      (m) => m.user?._id === session?.user?.id ||
        m.user === session?.user?.id
    );
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

            {error && <p className="text-red-500 text-sm">{error}</p>}

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
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-3 bg-gray-100 rounded mb-2 w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
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
        <div className="space-y-8">

          {myClubs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                My Clubs ({myClubs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {myClubs.map((club) => (
                  <div
                    key={club._id}
                    className="bg-white border border-purple-200 rounded-xl p-5 hover:border-purple-400 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{club.name}</h3>
                        <span className="text-xs text-gray-400 capitalize">{club.category}</span>
                      </div>
                      {isAdmin(club) && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full shrink-0 ml-2">
                          Admin
                        </span>
                      )}
                      {!isAdmin(club) && isMember(club) && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0 ml-2">
                          Joined
                        </span>
                      )}
                    </div>

                    {club.description && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{club.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">
                        {club.members?.length || 0} members
                      </span>
                      <Link
                        href={`/clubs/${club._id}`}
                        className="text-xs text-purple-600 border border-purple-200 px-3 py-1 rounded-lg hover:bg-purple-50 transition"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherClubs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Other Clubs ({otherClubs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {otherClubs.map((club) => (
                  <div
                    key={club._id}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{club.name}</h3>
                        <span className="text-xs text-gray-400 capitalize">{club.category}</span>
                      </div>
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
                        <button
                          onClick={() => {
                            setJoinClub(club);
                            setInviteCode("");
                            setJoinError("");
                            setJoinSuccess("");
                          }}
                          className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Join modal */}
      {joinClub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Join {joinClub.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Enter the invite code given by your club admin.
            </p>

            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. MEM-ABC12345"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <p className="text-xs text-gray-400">
                Codes starting with <span className="font-medium">MEM-</span> give Club Member role.
                Codes starting with <span className="font-medium">PHO-</span> give Photographer role.
              </p>

              {joinError && (
                <p className="text-red-500 text-sm">{joinError}</p>
              )}
              {joinSuccess && (
                <p className="text-green-600 text-sm">{joinSuccess}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={joinLoading}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-60"
                >
                  {joinLoading ? "Joining..." : "Join club"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJoinClub(null);
                    setInviteCode("");
                    setJoinError("");
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}