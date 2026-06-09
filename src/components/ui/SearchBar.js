"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  function handleKeyDown(e) {
    if (e.key === "Enter" && query.trim().length >= 2) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
      setLoading(false);
      setOpen(true);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const mediaResults = results.filter((r) => r.resultType === "media");
  const eventResults = results.filter((r) => r.resultType === "event");
  const userResults = results.filter((r) => r.resultType === "user");

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus-within:border-purple-400 focus-within:bg-white transition w-56">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="bg-transparent text-sm ml-2 outline-none w-full text-gray-700 placeholder-gray-400"
        />
        {loading && (
          <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">

          {mediaResults.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">
                Photos & Videos
              </p>
              <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                {mediaResults.slice(0, 6).map((item) => (
                  <div
                    key={item._id}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition"
                  >
                    {item.type === "video" ? (
                      <video src={item.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.url} alt="result" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventResults.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 px-4 pt-2 pb-1 uppercase tracking-wide">
                Events
              </p>
              {eventResults.slice(0, 3).map((item) => (
                <Link
                  key={item._id}
                  href={`/events/${item._id}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition"
                >
                  <span className="text-lg">📅</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {item.category} • {item.club?.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {userResults.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 px-4 pt-2 pb-1 uppercase tracking-wide">
                People
              </p>
              {userResults.slice(0, 3).map((item) => (
                <Link
                  key={item._id}
                  href={`/profile/${item._id}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                    {item.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.email}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.length === 0 && !loading && (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No results found</p>
            </div>
          )}
        </div>
      )}

      {open && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-gray-400">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}