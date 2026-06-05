"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EventDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();

  const [event,   setEvent]   = useState(null);
  const [albums,  setAlbums]  = useState([]);
  const [loading, setLoading] = useState(true);

  // New album form
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [albumForm, setAlbumForm] = useState({ name: "", description: "", isPublic: true });
  const [albumLoading, setAlbumLoading] = useState(false);

  async function fetchEvent() {
    const res = await fetch(`/api/events/${id}`);
    const data = await res.json();
    if (res.ok) setEvent(data.event);
  }

  async function fetchAlbums() {
    const res = await fetch(`/api/albums?eventId=${id}`);
    const data = await res.json();
    if (res.ok) setAlbums(data.albums || []);
  }

  useEffect(() => {
    async function load() {
      await Promise.all([fetchEvent(), fetchAlbums()]);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleDeleteEvent() {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/events");
  }

  async function handleCreateAlbum(e) {
    e.preventDefault();
    setAlbumLoading(true);

    const res = await fetch("/api/albums", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...albumForm, eventId: id }),
    });

    const data = await res.json();
    setAlbumLoading(false);

    if (res.ok) {
      setAlbums([data.album, ...albums]);
      setAlbumForm({ name: "", description: "", isPublic: true });
      setShowAlbumForm(false);
    }
  }

  async function handleDeleteAlbum(albumId) {
    if (!confirm("Delete this album?")) return;
    const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" });
    if (res.ok) setAlbums(albums.filter((a) => a._id !== albumId));
  }

  const isOwner = session?.user?.id === event?.createdBy?._id?.toString();
  const isAdmin = session?.user?.role === "ADMIN";
  const canEdit = isOwner || isAdmin;
  const canCreateAlbum = ["ADMIN", "PHOTOGRAPHER", "CLUB_MEMBER"].includes(session?.user?.role);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"/>
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-2"/>
        <div className="h-4 bg-gray-100 rounded w-1/4"/>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Event not found</p>
        <Link href="/events" className="text-purple-600 hover:underline text-sm mt-2 inline-block">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Event header */}
      <div className="mb-6">
        <Link href="/events" className="text-sm text-gray-500 hover:text-gray-700">← Back to events</Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{event.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="capitalize">{event.category}</span>
              <span>•</span>
              <span>{new Date(event.date).toLocaleDateString()}</span>
              <span>•</span>
              <span>By {event.createdBy?.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                event.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {event.isPublic ? "Public" : "Private"}
              </span>
            </div>
            {event.description && (
              <p className="text-gray-600 mt-2">{event.description}</p>
            )}
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={handleDeleteEvent}
                className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Albums section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Albums <span className="text-gray-400 font-normal text-base">({albums.length})</span>
        </h2>
        {canCreateAlbum && (
          <button
            onClick={() => setShowAlbumForm(!showAlbumForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
          >
            + Add album
          </button>
        )}
      </div>

      {/* Create album form */}
      {showAlbumForm && (
        <div className="bg-white border border-purple-200 rounded-xl p-5 mb-4">
          <h3 className="font-medium text-gray-900 mb-4">New album</h3>
          <form onSubmit={handleCreateAlbum} className="space-y-3">
            <input
              type="text"
              placeholder="Album name *"
              value={albumForm.name}
              onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={albumForm.description}
              onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="albumPublic"
                checked={albumForm.isPublic}
                onChange={(e) => setAlbumForm({ ...albumForm, isPublic: e.target.checked })}
                className="w-4 h-4 accent-purple-600"
              />
              <label htmlFor="albumPublic" className="text-sm text-gray-700">Public album</label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={albumLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-60"
              >
                {albumLoading ? "Creating..." : "Create album"}
              </button>
              <button
                type="button"
                onClick={() => setShowAlbumForm(false)}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Albums grid */}
      {albums.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-3xl mb-2">🗂️</p>
          <p className="font-medium">No albums yet</p>
          {canCreateAlbum && (
            <button
              onClick={() => setShowAlbumForm(true)}
              className="text-purple-600 text-sm hover:underline mt-1"
            >
              Create first album
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {albums.map((album) => (
            <div
              key={album._id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{album.name}</h3>
                  {album.description && (
                    <p className="text-gray-500 text-sm mt-1">{album.description}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                  album.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {album.isPublic ? "Public" : "Private"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">
                  {new Date(album.createdAt).toLocaleDateString()}
                </p>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteAlbum(album._id)}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}