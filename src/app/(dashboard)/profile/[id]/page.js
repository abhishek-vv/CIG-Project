"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ShareModal from "@/components/ui/ShareModal";
import { downloadMedia } from "@/lib/download";

const ROLE_COLORS = {
  // ADMIN:        "bg-red-100 text-red-700",
  // PHOTOGRAPHER: "bg-blue-100 text-blue-700",
  // CLUB_MEMBER:  "bg-green-100 text-green-700",
  // MEMBER:       "bg--100 text--600",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const { id }  = useParams();

  const [user,     setUser]     = useState(null);
  const [clubs,    setClubs]    = useState([]);
  const [media,    setMedia]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [comments,       setComments]       = useState([]);
  const [newComment,     setNewComment]     = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [likes,          setLikes]          = useState({});
  const [favourites,     setFavourites]     = useState({});

  useEffect(() => {
    async function fetchProfile() {
      const res  = await fetch(`/api/users/${id}`);
      const data = await res.json();
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      setUser(data.user);
      setClubs(data.clubs || []);
      setMedia(data.media || []);
      setLoading(false);
    }
    if (id) fetchProfile();
  }, [id]);

  async function fetchLikesAndFavs(item) {
    const [likeRes, favRes] = await Promise.all([
      fetch(`/api/likes?mediaId=${item._id}`),
      fetch(`/api/favourites?mediaId=${item._id}`),
    ]);
    const likeData = await likeRes.json();
    const favData  = await favRes.json();
    setLikes((prev) => ({
      ...prev,
      [item._id]: { liked: likeData.liked, count: likeData.likeCount },
    }));
    setFavourites((prev) => ({ ...prev, [item._id]: favData.favourited }));
  }

  async function fetchComments(mediaId) {
    const res  = await fetch(`/api/comments?mediaId=${mediaId}`);
    const data = await res.json();
    if (res.ok) setComments(data.comments || []);
  }

  async function openMedia(item) {
    setSelected(item);
    setNewComment("");
    await Promise.all([fetchLikesAndFavs(item), fetchComments(item._id)]);
  }

  async function handleLike(mediaId) {
    if (!session?.user) return;
    const res  = await fetch("/api/likes", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mediaId }),
    });
    const data = await res.json();
    if (res.ok) {
      setLikes((prev) => ({
        ...prev,
        [mediaId]: { liked: data.liked, count: data.likeCount },
      }));
    }
  }

  async function handleFavourite(mediaId) {
    if (!session?.user) return;
    const res  = await fetch("/api/favourites", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mediaId }),
    });
    const data = await res.json();
    if (res.ok) {
      setFavourites((prev) => ({ ...prev, [mediaId]: data.favourited }));
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    const res  = await fetch("/api/comments", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mediaId: selected._id, content: newComment }),
    });
    const data = await res.json();
    setCommentLoading(false);
    if (res.ok) {
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    }
  }

  async function handleDeleteComment(commentId) {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) setComments(comments.filter((c) => c._id !== commentId));
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"/>
        <div className="h-4 bg-gray-100 rounded w-1/4"/>
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl"/>
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">👤</p>
        <p className="font-medium text-zinc-200">User not found</p>
        <Link href="/clubs" className="text-purple-600 hover:underline text-sm mt-2 inline-block">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-zinc-900 border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-200">{user.name}</h1>
            <p className="text-zinc-200 text-sm">{user.email}</p>
            <p className="text-zinc-200 text-xs mt-0.5">
              Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <p className="text-sm text-zinc-200 font-medium">
            {media.length} uploads
          </p>
        </div>
      </div>

      {clubs.length > 0 && (
        <div className="bg-zinc-900 border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Clubs</h2>
          <div className="flex flex-wrap gap-2">
            {clubs.map((club) => (
              <Link
                key={club._id}
                href={`/clubs/${club._id}`}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-purple-300 hover:bg-zinc-700 transition"
              >
                <span className="text-sm text-zinc-200">{club.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[club.role] || ROLE_COLORS.MEMBER}`}>
                  {club.role}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-zinc-200 mb-4">
        Photos & Videos
        <span className="text-zinc-200 font-normal text-base ml-2">({media.length})</span>
      </h2>

      {media.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl text-zinc-200">
          <p className="text-3xl mb-2">📷</p>
          <p className="font-medium">No uploads yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((item) => (
            <div
              key={item._id}
              onClick={() => openMedia(item)}
              className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100 aspect-square"
            >
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-full object-cover"/>
              ) : (
                <img src={item.url} alt="media" className="w-full h-full object-cover"/>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition"/>
              {item.type === "video" && (
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  Video
                </div>
              )}
              {!item.isPublic && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  Private
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
            className="relative w-full max-w-5xl flex gap-4 max-h-screen"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex flex-col justify-center">
              <button
                onClick={() => setSelected(null)}
                className="absolute -top-10 right-0 text-white text-sm hover:text-zinc-700"
              >
                ✕ Close
              </button>

              {selected.type === "video" ? (
                <video src={selected.url} controls className="w-full rounded-xl max-h-96"/>
              ) : (
                <img src={selected.url} alt="full size" className="w-full rounded-xl object-contain max-h-96"/>
              )}

              <div className="bg-zinc-900 rounded-xl p-4 mt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-zinc-200">By {user.name}</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleLike(selected._id)} className="flex items-center gap-1">
                      {likes[selected._id]?.liked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                      )}
                      <span className="text-sm text-zinc-200">{likes[selected._id]?.count || 0}</span>
                    </button>

                    <button onClick={() => handleFavourite(selected._id)}>
                      {favourites[selected._id] ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => setShowShare(true)}
                      className="text-sm text-zinc-200 hover:text-zinc-700"
                    >
                      🔗 Share
                    </button>

                    <button
                      onClick={() => downloadMedia(selected.url, `photo-${selected._id}`)}
                      className="bg-purple-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-72 bg-zinc-900 rounded-xl flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-zinc-200">
                  Comments ({comments.length})
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
                {comments.length === 0 ? (
                  <p className="text-sm text-zinc-200 text-center py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-zinc-200">{comment.user?.name}</p>
                        <p className="text-sm text-zinc-200">{comment.content}</p>
                        <p className="text-xs text-zinc-200 mt-0.5">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {(comment.user?._id === session?.user?.id ||
                        comment.user?._id?.toString() === session?.user?.id) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-xs text-red-400 hover:text-red-600 shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {session?.user && (
                <form onSubmit={handleComment} className="p-3 border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-60"
                  >
                    Post
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showShare && selected && (
        <ShareModal
          albumUrl={`${window.location.origin}/profile/${id}`}
          photoUrl={selected.url}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}