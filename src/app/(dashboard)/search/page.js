"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const TABS = ["all", "users", "events", "clubs", "albums", "media"];

function SearchResults() {
  const searchParams = useSearchParams();
  const query        = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState("all");
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (query.length < 2) return;
    async function fetchResults() {
      setLoading(true);
      const res  = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`
      );
      const data = await res.json();
      setResults(data.results || []);
      setLoading(false);
    }
    fetchResults();
  }, [query, activeTab]);

  const mediaResults = results.filter((r) => r.resultType === "media");
  const eventResults = results.filter((r) => r.resultType === "event");
  const userResults  = results.filter((r) => r.resultType === "user");
  const clubResults  = results.filter((r) => r.resultType === "club");
  const albumResults = results.filter((r) => r.resultType === "album");

  const showUsers  = (activeTab === "all" || activeTab === "users")  && userResults.length > 0;
  const showEvents = (activeTab === "all" || activeTab === "events") && eventResults.length > 0;
  const showClubs  = (activeTab === "all" || activeTab === "clubs")  && clubResults.length > 0;
  const showAlbums = (activeTab === "all" || activeTab === "albums") && albumResults.length > 0;
  const showMedia  = (activeTab === "all" || activeTab === "media")  && mediaResults.length > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-200">
          Results for <span className="text-purple-600">"{query}"</span>
        </h1>
        <p className="text-zinc-200 text-sm mt-1">{results.length} results found</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px shrink-0 ${
              activeTab === tab
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-zinc-200 hover:text-zinc-200"
            }`}
          >
            {tab === "all"    && `All (${results.length})`}
            {tab === "users"  && `People (${userResults.length})`}
            {tab === "events" && `Events (${eventResults.length})`}
            {tab === "clubs"  && `Clubs (${clubResults.length})`}
            {tab === "albums" && `Albums (${albumResults.length})`}
            {tab === "media"  && `Media (${mediaResults.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"/>
          ))}
        </div>
      ) : results.length === 0 && query.length >= 2 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl text-zinc-200">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No results found for "{query}"</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-10">

          {showUsers && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-200 mb-3 uppercase tracking-wide">
                People ({userResults.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {userResults.map((user) => (
                  <Link
                    key={user._id}
                    href={`/profile/${user._id}`}
                    className="bg-zinc-900 border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-purple-300 hover:shadow-sm transition"
                  >
                    <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-base font-bold shrink-0">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">{user.name}</p>
                      <p className="text-xs text-zinc-200">{user.email}</p>
                      <p className="text-xs text-zinc-200 mt-0.5">
                        Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showEvents && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-200 mb-3 uppercase tracking-wide">
                Events ({eventResults.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {eventResults.map((event) => (
                  <Link
                    key={event._id}
                    href={`/events/${event._id}`}
                    className="bg-zinc-900 border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-zinc-200">{event.name}</h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0 ml-2">
                        Public
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 mt-1 capitalize">
                      {event.category} • {event.club?.name}
                    </p>
                    <p className="text-xs text-zinc-200 mt-0.5">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                    {event.description && (
                      <p className="text-zinc-200 text-sm mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <p className="text-xs text-zinc-200 mt-2">By {event.createdBy?.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showClubs && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-200 mb-3 uppercase tracking-wide">
                Clubs ({clubResults.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {clubResults.map((club) => (
                  <Link
                    key={club._id}
                    href={`/clubs/${club._id}`}
                    className="bg-zinc-900 border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition"
                  >
                    <h3 className="font-semibold text-zinc-200">{club.name}</h3>
                    <p className="text-xs text-zinc-200 mt-1 capitalize">{club.category}</p>
                    {club.description && (
                      <p className="text-zinc-200 text-sm mt-2 line-clamp-2">{club.description}</p>
                    )}
                    <p className="text-xs text-zinc-200 mt-2">
                      {club.members?.length || 0} members • By {club.createdBy?.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showAlbums && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-200 mb-3 uppercase tracking-wide">
                Albums ({albumResults.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {albumResults.map((album) => (
                  <Link
                    key={album._id}
                    href={`/albums/${album._id}`}
                    className="bg-zinc-900 border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-zinc-200">{album.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        album.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-zinc-200"
                      }`}>
                        {album.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 mt-1">{album.event?.name}</p>
                    <p className="text-xs text-zinc-200 mt-0.5">By {album.createdBy?.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showMedia && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-200 mb-3 uppercase tracking-wide">
                Photos & Videos ({mediaResults.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {mediaResults.map((item) => (
                  <Link
                    key={item._id}
                    href={`/albums/${item.album?._id || item.album}`}
                    className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square"
                  >
                    {item.type === "video" ? (
                      <video src={item.url} className="w-full h-full object-cover"/>
                    ) : (
                      <img src={item.url} alt="media" className="w-full h-full object-cover"/>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition"/>
                    {item.tags?.length > 0 && (
                      <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5">
                        {item.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"/>
        <div className="h-4 bg-gray-100 rounded w-1/4"/>
        <div className="grid grid-cols-4 gap-3 mt-6">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"/>
          ))}
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}