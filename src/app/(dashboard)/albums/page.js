"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AlbumsPage() {
  const { data: session } = useSession();
  const [albums,  setAlbums]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlbums() {
      const res  = await fetch("/api/albums");
      const data = await res.json();
      if (res.ok) setAlbums(data.albums || []);
      setLoading(false);
    }
    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse grid grid-cols-3 gap-4">
        {[1,2,3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl"/>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Albums</h1>
        <p className="text-gray-500 text-sm mt-1">{albums.length} albums total</p>
      </div>

      {albums.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl text-gray-400">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="font-medium">No albums yet</p>
          <p className="text-sm mt-1">Create an event first then add albums</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {albums.map((album) => (
            <Link
              key={album._id}
              href={`/albums/${album._id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{album.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                  album.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text.gray-600"
                }`}>
                  {album.isPublic ? "Public" : "Private"}
                </span>
              </div>
              {album.description && (
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{album.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">{album.event?.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(album.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}