"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [clubs,     setClubs]     = useState([]);
  const [events,    setEvents]    = useState([]);
  const [albums,    setAlbums]    = useState([]);
  const [selectedClub,  setSelectedClub]  = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [files,     setFiles]     = useState([]);
  const [previews,  setPreviews]  = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [dragging,  setDragging]  = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchClubs() {
      const res  = await fetch("/api/clubs");
      const data = await res.json();
      const myClubs = (data.clubs || []).filter((club) =>
        club.createdBy?._id === session?.user?.id ||
        club.createdBy === session?.user?.id ||
        club.members?.some((m) =>
          m.user === session?.user?.id ||
          m.user?._id === session?.user?.id
        )
      );
      setClubs(myClubs);
    }
    if (session) fetchClubs();
  }, [session]);

  useEffect(() => {
    if (!selectedClub) { setEvents([]); setSelectedEvent(""); return; }
    async function fetchEvents() {
      const res  = await fetch(`/api/events?clubId=${selectedClub}`);
      const data = await res.json();
      setEvents(data.events || []);
      setSelectedEvent("");
      setAlbums([]);
      setSelectedAlbum("");
    }
    fetchEvents();
  }, [selectedClub]);

  useEffect(() => {
    if (!selectedEvent) { setAlbums([]); setSelectedAlbum(""); return; }
    async function fetchAlbums() {
      const res  = await fetch(`/api/albums?eventId=${selectedEvent}`);
      const data = await res.json();
      setAlbums(data.albums || []);
      setSelectedAlbum("");
    }
    fetchAlbums();
  }, [selectedEvent]);

  function handleFiles(newFiles) {
    const fileArray = Array.from(newFiles);
    const valid = fileArray.filter((f) =>
      f.type.startsWith("image/") || f.type.startsWith("video/")
    );

    setFiles((prev) => [...prev, ...valid]);

    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [
          ...prev,
          { url: e.target.result, name: file.name, type: file.type, size: file.size },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (!selectedAlbum) { setError("Please select an album"); return; }
    if (files.length === 0) { setError("Please select at least one file"); return; }

    setError("");
    setSuccess("");
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("albumId", selectedAlbum);

    const res  = await fetch("/api/media/upload", {
      method: "POST",
      body:   formData,
    });

    const data = await res.json();
    setUploading(false);
    setProgress(100);

    if (!res.ok) {
      setError(data.error);
    } else {
      setSuccess(`${data.count} file(s) uploaded successfully!`);
      setFiles([]);
      setPreviews([]);
      setTimeout(() => {
        router.push(`/albums/${selectedAlbum}`);
      }, 1500);
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Upload Media</h1>
        <p className="text-gray-500 text-sm mt-1">Upload photos and videos to an album</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a club</option>
            {clubs.map((club) => (
              <option key={club._id} value={club._id}>{club.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            disabled={!selectedClub}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <option value="">Select an event</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>{event.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Album</label>
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            disabled={!selectedEvent}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <option value="">Select an album</option>
            {albums.map((album) => (
              <option key={album._id} value={album._id}>{album.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition mb-4 ${
          dragging
            ? "border-purple-500 bg-purple-50"
            : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-4xl mb-3">📸</p>
        <p className="text-gray-700 font-medium">Drag and drop files here</p>
        <p className="text-gray-400 text-sm mt-1">or click to browse</p>
        <p className="text-gray-400 text-xs mt-2">Supports images and videos</p>
      </div>

      {previews.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">{previews.length} file(s) selected</p>
            <button
              onClick={() => { setFiles([]); setPreviews([]); }}
              className="text-xs text-red-400 hover:text-red-600 transition"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                {preview.type.startsWith("video/") ? (
                  <video
                    src={preview.url}
                    className="w-full h-24 object-cover rounded-lg bg-gray-100"
                  />
                ) : (
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
                <p className="text-xs text-gray-400 mt-1 truncate">{formatSize(preview.size)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-700">Uploading...</p>
            <p className="text-sm text-purple-600">{progress}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0 || !selectedAlbum}
        className="w-full bg-purple-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? "Uploading..." : `Upload ${files.length > 0 ? files.length + " file(s)" : ""}`}
      </button>
    </div>
  );
}