"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ClubDetailPage() {
  const { data: session } = useSession();
  const { id } = useParams();

  const [club,      setClub]      = useState(null);
  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [activeTab, setActiveTab] = useState("events");

  async function fetchClub() {
    try {
      const res  = await fetch(`/api/clubs/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      setClub(data.club);
    } catch (error) {
      console.error("Failed to fetch club:", error);
      setNotFound(true);
    }
  }

  async function fetchEvents() {
    try {
      const res  = await fetch(`/api/events?clubId=${id}`);
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

  async function handleRoleChange(userId, role) {
    const res = await fetch(`/api/clubs/${id}/members`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, role }),
    });
    if (res.ok) fetchClub();
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-24 mb-6"/>
        <div className="h-8 bg-gray-200 rounded w-1/3"/>
        <div className="h-4 bg-gray-100 rounded w-1/2"/>
        <div className="h-32 bg-gray-100 rounded"/>
      </div>
    );
  }

  // --- Not found state ---
  if (notFound || !club) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🏛️</p>
        <p className="font-medium text-gray-700">Club not found</p>
        <p className="text-gray-400 text-sm mt-1">
          This club may have been deleted or the link is incorrect.
        </p>
        <Link
          href="/clubs"
          className="text-purple-600 hover:underline text-sm mt-3 inline-block"
        >
          ← Back to clubs
        </Link>
      </div>
    );
  }

  // --- Role checks ---
  const isAdmin = 
    club.createdBy?._id === session?.user?.id ||
    club.createdBy?._id?.toString() === session?.user?.id ||
    club.createdBy === session?.user?.id;

  const myMember = club.members?.find(
    (m) =>
      m.user?._id === session?.user?.id ||
      m.user?._id?.toString() === session?.user?.id ||
      m.user === session?.user?.id
  );

  const myRole = isAdmin ? "ADMIN" : myMember?.role || null;

  const canCreateEvent = ["ADMIN", "PHOTOGRAPHER", "CLUB_MEMBER"].includes(myRole);

  return (
    <div>
      {/* Back link */}
      <Link href="/clubs" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to clubs
      </Link>

      {/* Club header */}
      <div className="flex items-start justify-between mt-2 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{club.name}</h1>
            {myRole && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                myRole === "ADMIN"        ? "bg-red-100 text-red-700"   :
                myRole === "PHOTOGRAPHER" ? "bg-blue-100 text-blue-700" :
                                           "bg-green-100 text-green-700"
              }`}>
                {myRole}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {club.category} • {club.members?.length || 0} members
          </p>
          {club.description && (
            <p className="text-gray-600 mt-2">{club.description}</p>
          )}
        </div>

        {canCreateEvent && (
          <Link
            href={`/events/new?clubId=${id}`}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition shrink-0 ml-4"
          >
            + Create event
          </Link>
        )}
      </div>

      {/* Invite codes — only visible to club admin */}
      {isAdmin && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">
            🔑 Invite codes — share these with your club members
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Club Member code</p>
              <p className="font-mono font-bold text-purple-700 text-sm tracking-wider">
                {club.memberCode}
              </p>
              <p className="text-xs text-gray-400 mt-1">Gives CLUB_MEMBER role</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Photographer code</p>
              <p className="font-mono font-bold text-blue-700 text-sm tracking-wider">
                {club.photographerCode}
              </p>
              <p className="text-xs text-gray-400 mt-1">Gives PHOTOGRAPHER role</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {["events", "members"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              activeTab === tab
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
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
            <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <p className="text-3xl mb-2">📅</p>
              <p className="font-medium">No events yet</p>
              {canCreateEvent && (
                <Link
                  href={`/events/new?clubId=${id}`}
                  className="text-purple-600 text-sm hover:underline mt-1 inline-block"
                >
                  Create first event
                </Link>
              )}
              {!canCreateEvent && (
                <p className="text-sm mt-1">Only club members can create events</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {events.map((event) => (
                <Link
                  key={event._id}
                  href={`/events/${event._id}`}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{event.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      event.isPublic
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {event.isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 capitalize">
                    {event.category} • {new Date(event.date).toLocaleDateString()}
                  </p>
                  {event.description && (
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">By {event.createdBy?.name}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {activeTab === "members" && (
        <div className="space-y-2">
          {/* Club creator (admin) */}
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{club.createdBy?.name}</p>
              <p className="text-xs text-gray-400">{club.createdBy?.email}</p>
            </div>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              ADMIN
            </span>
          </div>

          {/* Other members */}
          {club.members
            .filter(
              (m) =>
                m.user?._id?.toString() !== club.createdBy?._id?.toString() &&
                m.user !== club.createdBy
            )
            .map((member) => (
              <div
                key={member._id}
                className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.user?.name}</p>
                  <p className="text-xs text-gray-400">{member.user?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.user?._id, e.target.value)
                      }
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="CLUB_MEMBER">Club Member</option>
                      <option value="PHOTOGRAPHER">Photographer</option>
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      member.role === "PHOTOGRAPHER"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))}

          {club.members.length <= 1 && (
            <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <p className="text-2xl mb-2">👥</p>
              <p className="text-sm font-medium">No members yet</p>
              {isAdmin && (
                <p className="text-xs mt-1">
                  Share the invite codes above with your club members
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}