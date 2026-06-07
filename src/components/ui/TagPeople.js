"use client";

import { useState } from "react";

export default function TagPeople({ mediaId, taggedUsers = [], onUpdate }) {
  const [search,     setSearch]     = useState("");
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [showInput,  setShowInput]  = useState(false);

  async function handleSearch(e) {
    const q = e.target.value;
    setSearch(q);

    if (q.length < 2) { setResults([]); return; }

    setSearching(true);
    const res  = await fetch(`/api/tags/search?q=${q}`);
    const data = await res.json();
    setResults(data.users || []);
    setSearching(false);
  }

  async function handleTag(userId) {
    const res  = await fetch("/api/tags", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mediaId, userId }),
    });
    const data = await res.json();
    if (res.ok) {
      onUpdate(data.taggedUsers);
      setSearch("");
      setResults([]);
      setShowInput(false);
    }
  }

  async function handleRemoveTag(userId) {
    const res  = await fetch("/api/tags", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mediaId, userId }),
    });
    const data = await res.json();
    if (res.ok) onUpdate(data.taggedUsers);
  }

  return (
    <div className="mt-2">
      {taggedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {taggedUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full"
            >
              <span>👤 {user.name}</span>
              <button
                onClick={() => handleRemoveTag(user._id)}
                className="text-purple-400 hover:text-purple-700 ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showInput ? (
        <div className="relative">
          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={handleSearch}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          {searching && (
            <p className="text-xs text-gray-400 mt-1">Searching...</p>
          )}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 mt-1">
              {results.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleTag(user._id)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 flex items-center gap-2 transition"
                >
                  <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => { setShowInput(false); setSearch(""); setResults([]); }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-1 inline-block"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          🏷️ Tag people
        </button>
      )}
    </div>
  );
}