"use client";

import { useState } from "react";

export default function EditTags({ mediaId, initialTags = [], isUploader }) {
  const [tags,    setTags]    = useState(initialTags);
  const [input,   setInput]   = useState("");
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/media/tags", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mediaId, tags }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setTags(data.tags);
      setEditing(false);
    }
  }

  function handleAddTag(e) {
    e.preventDefault();
    const tag = input.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setInput("");
  }

  function handleRemoveTag(tag) {
    setTags(tags.filter((t) => t !== tag));
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1 mb-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
          >
            #{tag}
            {editing && (
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-purple-400 hover:text-purple-700"
              >
                ✕
              </button>
            )}
          </span>
        ))}
        {tags.length === 0 && !editing && (
          <span className="text-xs text-gray-400">No tags</span>
        )}
      </div>

      {isUploader && (
        <>
          {editing ? (
            <div className="space-y-2">
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
                >
                  Add
                </button>
              </form>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save tags"}
                </button>
                <button
                  onClick={() => { setEditing(false); setTags(initialTags); }}
                  className="border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-purple-600 hover:text-purple-700"
            >
              ✏️ Edit tags
            </button>
          )}
        </>
      )}
    </div>
  );
}