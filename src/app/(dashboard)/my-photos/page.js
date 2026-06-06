"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function MyPhotosPage() {
  const { data: session } = useSession();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function fetchMyMedia() {
      const res = await fetch(`/api/media?userId=${session?.user?.id}`);
      const data = await res.json();
      if (res.ok) setMedia(data.media || []);
      setLoading(false);
    }
    if (session?.user?.id) fetchMyMedia();
  }, [session]);

  if (loading) {
    return (
      <div className="animate-pulse grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Media</h1>
          <p className="text-gray-500 text-sm mt-1">{media.length} items uploaded by you</p>
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
          <p className="text-4xl mb-3">🖼️</p>
          <p className="font-medium">No uploads yet</p>
          <Link
            href="/upload"
            className="text-purple-600 text-sm hover:underline mt-1 inline-block"
          >
            Upload your first photo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelected(item)}
              className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100 aspect-square"
            >
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-full object-cover" />
              ) : (
                <img src={item.url} alt="media" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
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
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300"
            >
              ✕ Close
            </button>
            {selected.type === "video" ? (
              <video src={selected.url} controls className="w-full max-h-screen rounded-xl" />
            ) : (
              <img src={selected.url} alt="full" className="w-full max-h-screen object-contain rounded-xl" />
            )}
            <div className="bg-white rounded-xl p-4 mt-2 flex items-center justify-between">
              <div>
                {selected.tags?.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
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