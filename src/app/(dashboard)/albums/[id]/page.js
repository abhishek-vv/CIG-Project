"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AlbumDetailPage() {
  const { data: session } = useSession();
  const { id } = useParams();

  const [album, setAlbum] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function fetchAlbum() {
    const res = await fetch(`/api/albums/${id}`);
    const data = await res.json();
    if (res.ok) setAlbum(data.album);
  }

  async function fetchMedia() {
    const res = await fetch(`/api/media?albumId=${id}`);
    const data = await res.json();
    if (res.ok) setMedia(data.media || []);
  }

  useEffect(() => {
    async function load() {
      await Promise.all([fetchAlbum(), fetchMedia()]);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  async function handleDelete(mediaId) {
    if (!confirm("Delete this media?")) return;
    const res = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
    if (res.ok) {
      setMedia(media.filter((m) => m._id !== mediaId));
      if (selected?._id === mediaId) setSelected(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/events/${album?.event?._id || album?.event}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to event
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{album?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {media.length} items • {album?.isPublic ? "Public" : "Private"}
          </p>
        </div>
        <Link
          href="/upload"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
        >
          + Upload
        </Link>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl text-gray-400">
          <p className="text-4xl mb-3">📷</p>
          <p className="font-medium">No media yet</p>
          <Link
            href="/upload"
            className="text-purple-600 text-sm hover:underline mt-1 inline-block"
          >
            Upload first photo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((item) => (
            <div
              key={item._id}
              className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100 aspect-square"
              onClick={() => setSelected(item)}
            >
              {item.type === "video" ? (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || "media"}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                {item.uploadedBy?._id === session?.user?.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                    className="opacity-0 group-hover:opacity-100 transition bg-red-500 text-white text-xs px-2 py-1 rounded-lg"
                  >
                    Delete
                  </button>
                )}
              </div>
              {item.type === "video" && (
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  Video
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300"
            >
              ✕ Close
            </button>

            {selected.type === "video" ? (
              <video
                src={selected.url}
                controls
                className="w-full max-h-screen rounded-xl"
              />
            ) : (
              <img
                src={selected.url}
                alt="full size"
                className="w-full max-h-screen object-contain rounded-xl"
              />
            )}

            <div className="bg-white rounded-xl p-4 mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">By {selected.uploadedBy?.name}</p>
                {selected.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <a
                href={selected.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                onClick={(e) => e.stopPropagation()}
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}