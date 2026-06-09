"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import QRModal from "@/components/ui/QRModal";
import Link from "next/link";

export default function ClubDetailPage() {
  const { data: session } = useSession();
  const { id } = useParams();

  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [showQR, setShowQR] = useState(false);
  // Join modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState("");

  async function fetchClub() {
    try {
      const res = await fetch(`/api/clubs/${id}`);
      const data = await res.json();
      if (!res.ok) { setNotFound(true); return; }
      setClub(data.club);
      setIsAdmin(data.isAdmin);
      setIsMember(data.isMember);
    } catch (error) {
      setNotFound(true);
    }
  }

  async function fetchEvents() {
    try {
      const res = await fetch(`/api/events?clubId=${id}`);
      const data = await res.json();
      if (res.ok) setEvents(data.events || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }

  useEffect(() => {
    async function load() {
      await Promise.all([fetchClub(), fetchEvents()]);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  async function handleJoin(e) {
    e.preventDefault();
    setJoinError("");
    setJoinSuccess("");
    setJoinLoading(true);

    const res = await fetch(`/api/clubs/${id}/join`, {
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
      setInviteCode("");
      // Refresh club and events
      await Promise.all([fetchClub(), fetchEvents()]);
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinSuccess("");
      }, 1500);
    }
  }

  async function handleRoleChange(userId, role) {
    const res = await fetch(`/api/clubs/${id}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) fetchClub();
  }
  async function handleRemoveMember(userId) {
    if (!confirm("Remove this member from the club?")) return;

    const res = await fetch(`/api/clubs/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    if (res.ok) {
      fetchClub();
    } else {
      alert(data.error);
    }
  }

  async function handleToggleEventVisibility(eventId, currentIsPublic) {
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !currentIsPublic }),
    });
    if (res.ok) {
      fetchEvents();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-24 mb-6" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-32 bg-gray-100 rounded" />
      </div>
    );
  }

  if (notFound || !club) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🏛️</p>
        <p className="font-medium text-white-700">Club not found</p>
        <p className="text-white-400 text-sm mt-1">This club may have been deleted or the link is incorrect.</p>
        <Link href="/clubs" className="text-purple-600 hover:underline text-sm mt-3 inline-block">
          ← Back to clubs
        </Link>
      </div>
    );
  }

  const canCreateEvent = isAdmin || isMember;
  const myRole = isAdmin ? "ADMIN" : club.members?.find(
    (m) => m.user?._id?.toString() === session?.user?.id
  )?.role || null;

  return (
    <div>
      {/* Back link */}
      <Link href="/clubs" className="text-sm text-white-500 hover:text-white-700">
        ← Back to clubs
      </Link>

      {/* Club header */}
      <div className="flex items-start justify-between mt-2 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white-900">{club.name}</h1>
            {myRole && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${myRole === "ADMIN" ? "bg-red-100 text-red-700" :
                myRole === "PHOTOGRAPHER" ? "bg-blue-100 text-blue-700" :
                  "bg-green-100 text-green-700"
                }`}>
                {myRole}
              </span>
            )}
            {!myRole && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-white-500">
                Not a member
              </span>
            )}
          </div>
          <p className="text-white-500 text-sm mt-1 capitalize">
            {club.category} • {club.members?.length || 0} members
          </p>
          {club.description && (
            <p className="text-white-600 mt-2">{club.description}</p>
          )}
        </div>

        <div className="flex gap-2 shrink-0 ml-4">
          {/* Join button for non-members */}
          {!myRole && session?.user && (
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
            >
              Join club
            </button>
          )}

          {/* Create event for members */}
          <div className="flex gap-2 shrink-0 ml-4">
            <button
              onClick={() => setShowQR(true)}
              className="text-sm border border-zinc-800 text-white-600 px-3 py-2 rounded-lg hover:bg-zinc-800 transition"
            >
              📷 QR
            </button>
            {canCreateEvent && (
              <Link
                href={`/events/new?clubId=${id}`}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                + Create event
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Invite codes — only visible to club admin */}
      {isAdmin && club.memberCode && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">
            🔑 Invite codes — share these with your club members
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-zinc-700 rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-white-500 mb-1">Club Member code</p>
              <p className="font-mono font-bold text-purple-700 text-sm tracking-wider">
                {club.memberCode}
              </p>
              <p className="text-xs text-white-400 mt-1">Gives CLUB_MEMBER role</p>
            </div>
            <div className="bg-zinc-700 rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-white-500 mb-1">Photographer code</p>
              <p className="font-mono font-bold text-blue-700 text-sm tracking-wider">
                {club.photographerCode}
              </p>
              <p className="text-xs text-white-400 mt-1">Gives PHOTOGRAPHER role</p>
            </div>
          </div>
        </div>
      )}

      {/* Non-member info banner */}
      {!myRole && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">You are not a member of this club</p>
            <p className="text-xs text-yellow-600 mt-0.5">
              You can view public events. Join with an invite code to access all events and create content.
            </p>
          </div>
          {session?.user && (
            <button
              onClick={() => setShowJoinModal(true)}
              className="text-sm text-yellow-700 border border-yellow-300 px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition shrink-0 ml-4"
            >
              Join
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-6">
        {["events", ...(myRole ? ["members"] : [])].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${activeTab === tab
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-white-500 hover:text-white-700"
              }`}
          >
            {tab === "events"
              ? `Events (${events.length})`
              : `Members (${club.members?.length || 0})`}
          </button>
        ))}
      </div>

      {/* Events tab */}
      {activeTab === "events" && (
        <div>
          {events.length === 0 ? (
            <div className="text-center py-16 text-white-400 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-3xl mb-2">📅</p>
              <p className="font-medium">No public events yet</p>
              {canCreateEvent && (
                <Link
                  href={`/events/new?clubId=${id}`}
                  className="text-purple-600 text-sm hover:underline mt-1 inline-block"
                >
                  Create first event
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {events.map((event) => (
                <div key={event._id} className="bg-zinc-700 border border-zinc-800 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition">
                  <div className="flex items-start justify-between mb-2">
                    <Link href={`/events/${event._id}`} className="font-semibold text-white-900 hover:text-purple-600 transition">
                      {event.name}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${event.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-white-600"
                      }`}>
                      {event.isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                  <p className="text-xs text-white-400 capitalize">
                    {event.category} • {new Date(event.date).toLocaleDateString()}
                  </p>
                  {event.description && (
                    <p className="text-white-500 text-sm mt-2 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-white-400">By {event.createdBy?.name}</p>
                    {/* Toggle public/private — only for admin or event creator */}
                    {(isAdmin || event.createdBy?._id?.toString() === session?.user?.id) && (
                      <button
                        onClick={() => handleToggleEventVisibility(event._id, event.isPublic)}
                        className={`text-xs px-2 py-1 rounded-lg border transition ${event.isPublic
                          ? "border-zinc-800 text-white-500 hover:bg-zinc-800"
                          : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                      >
                        {event.isPublic ? "Make private" : "Make public"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members tab — only visible to club members */}
      {activeTab === "members" && myRole && (
        <div className="space-y-2">
          {/* Club creator */}
          <div className="bg-zinc-700 border border-zinc-800 rounded-xl px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white-900">{club.createdBy?.name}</p>
              <p className="text-xs text-white-400">{club.createdBy?.email}</p>
            </div>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              ADMIN
            </span>
          </div>

          {/* Other members */}
          {club.members
            .filter(
              (m) => m.user?._id?.toString() !== club.createdBy?._id?.toString()
            )
            .map((member) => (
              <div
                key={member._id}
                className="bg-zinc-700 border border-zinc-800 rounded-xl px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white-900">{member.user?.name}</p>
                  <p className="text-xs text-white-400">{member.user?.email}</p>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.user?._id, e.target.value)}
                      className="text-xs border border-zinc-800 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="CLUB_MEMBER">Club Member</option>
                      <option value="PHOTOGRAPHER">Photographer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.user?._id)}
                      className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.role === "PHOTOGRAPHER"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                    }`}>
                    {member.role}
                  </span>
                )}
              </div>
            ))}

          {club.members.length <= 1 && (
            <div className="text-center py-10 text-white-400 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-2xl mb-2">👥</p>
              <p className="text-sm font-medium">No other members yet</p>
              {isAdmin && (
                <p className="text-xs mt-1">Share the invite codes with your club members</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Join club modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-white-900 mb-1">Join {club.name}</h2>
            <p className="text-sm text-white-500 mb-4">
              Enter the invite code given by your club admin.
            </p>

            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. MEM-ABC12345"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                required
              />

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
                    setShowJoinModal(false);
                    setInviteCode("");
                    setJoinError("");
                  }}
                  className="flex-1 border border-zinc-800 text-white-600 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showQR && (
        <QRModal
          url={`${window.location.origin}/clubs/${id}`}
          title={club?.name}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}