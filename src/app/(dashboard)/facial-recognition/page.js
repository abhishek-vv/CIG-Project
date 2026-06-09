"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { downloadMedia } from "@/lib/download";
import ShareModal from "@/components/ui/ShareModal";

export default function FacialRecognitionPage() {
  const { data: session } = useSession();
  const [selfie,    setSelfie]    = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [results,   setResults]   = useState([]);
  const [searched,  setSearched]  = useState(false);
  const [error,     setError]     = useState("");
  const [selected,  setSelected]  = useState(null);
  const [showShare, setShowShare] = useState(false);

  function handleSelfie(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSelfie(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSearch() {
    if (!selfie) { setError("Please upload a selfie first"); return; }
    setError("");
    setLoading(true);
    setResults([]);
    setSearched(false);

    const formData = new FormData();
    formData.append("selfie", selfie);

    const res  = await fetch("/api/facial-recognition", {
      method: "POST",
      body:   formData,
    });
    const data = await res.json();
    setLoading(false);
    setSearched(true);

    if (!res.ok) {
      setError(data.error);
    } else {
      setResults(data.media || []);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white-200">Find Photos of You</h1>
        <p className="text-white-350 text-sm mt-1">
          Upload a selfie and we'll find all photos containing your face
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-white-900 mb-2">
              Upload your selfie
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSelfie}
              className="w-full border text-white border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-white-700 mt-1">
              Use a clear front-facing photo for best results
            </p>
          </div>

          {preview && (
            <img
              src={preview}
              alt="selfie preview"
              className="w-24 h-24 object-cover rounded-xl border border-zinc-800 shrink-0"
            />
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mt-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={loading || !selfie}
          className="w-full mt-4 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              Searching through photos...
            </span>
          ) : (
            "🔍 Find my photos"
          )}
        </button>
      </div>

      {loading && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center mb-6">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-purple-700 font-medium">Scanning photos...</p>
          <p className="text-purple-500 text-sm mt-1">This may take a moment</p>
        </div>
      )}

      {searched && !loading && (
        <div>
          <h2 className="text-lg font-semibold text-white-350 mb-4">
            {results.length > 0
              ? `Found ${results.length} photo(s) with your face`
              : "No matching photos found"}
          </h2>

          {results.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white-200 rounded-xl text-white-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">No photos found</p>
              <p className="text-sm mt-1">
                Try a clearer selfie or there may not be any photos of you yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelected(item)}
                  className="relative group cursor-pointer rounded-xl overflow-hidden bg-zinc-900 aspect-square"
                >
                  <img
                    src={item.url}
                    alt="matched"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition"/>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.uploadedBy?.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute cursor-pointer -top-10 right-0 text-white text-sm hover:text-red-300"
            >
              ✕ Close
            </button>

            <img
              src={selected.url}
              alt="full"
              className="w-full rounded-xl object-contain max-h-screen"
            />

            <div className="bg-zinc-900 rounded-xl p-4 mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm text-white-600">By {selected.uploadedBy?.name}</p>
                <p className="text-xs text-white-400">{selected.album?.name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowShare(true)}
                  className="text-sm text-white-700 border cursor-pointer border-white-500 px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition"
                >
                  🔗 Share
                </button>
                <button
                  onClick={() => downloadMedia(selected.url, `photo-${selected._id}`)}
                  className="bg-purple-600 cursor-pointer text-white text-sm px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShare && selected && (
        <ShareModal
          albumUrl={`${window.location.origin}/facial-recognition`}
          photoUrl={selected.url}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}