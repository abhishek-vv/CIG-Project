"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ShareModal from "@/components/ui/ShareModal";
import { downloadMedia } from "@/lib/download";
import TagPeople from "@/components/ui/TagPeople";
import EditTags from "@/components/ui/EditTags";
import QRModal from "@/components/ui/QRModal";
import { useInView } from "react-intersection-observer";

export default function AlbumDetailPage() {
  const { data: session } = useSession();
  const { id } = useParams();
  const router = useRouter();

  const [album, setAlbum] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [likes, setLikes] = useState({});
  const [favourites, setFavourites] = useState({});
  const [showShare, setShowShare] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { ref: bottomRef, inView } = useInView();


  async function fetchAlbum() {
    const res = await fetch(`/api/albums/${id}`);
    const data = await res.json();
    if (res.ok) {
      setAlbum(data.album);
      setCanEdit(data.canEdit);
    }
  }

  async function fetchMedia() {
    const res = await fetch(`/api/media?albumId=${id}`);
    const data = await res.json();
    if (res.ok) setMedia(data.media || []);
  }

  useEffect(() => {
    if (inView && hasMore && !loadingMore) {
      loadMoreMedia();
    }
  }, [inView]);

  async function loadMoreMedia() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const res = await fetch(`/api/media?albumId=${id}&page=${page + 1}&limit=12`);
    const data = await res.json();

    if (!res.ok || data.media.length === 0) {
      setHasMore(false);
    } else {
      setMedia((prev) => [...prev, ...data.media]);
      setPage((prev) => prev + 1);
      if (data.media.length < 12) setHasMore(false);
    }
    setLoadingMore(false);
  }

  useEffect(() => {
    async function load() {
      await Promise.all([fetchAlbum(), fetchMedia()]);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  async function fetchLikesAndFavs(item) {
    const [likeRes, favRes] = await Promise.all([
      fetch(`/api/likes?mediaId=${item._id}`),
      fetch(`/api/favourites?mediaId=${item._id}`),
    ]);
    const likeData = await likeRes.json();
    const favData = await favRes.json();

    setLikes((prev) => ({
      ...prev,
      [item._id]: { liked: likeData.liked, count: likeData.likeCount },
    }));
    setFavourites((prev) => ({ ...prev, [item._id]: favData.favourited }));
  }

  async function fetchComments(mediaId) {
    const res = await fetch(`/api/comments?mediaId=${mediaId}`);
    const data = await res.json();
    if (res.ok) setComments(data.comments || []);
  }

  async function openMedia(item) {
    setSelected(item);
    setTaggedUsers(item.taggedUsers || []);
    setNewComment("");
    await Promise.all([fetchLikesAndFavs(item), fetchComments(item._id)]);
  }

  async function handleLike(mediaId) {
    if (!session?.user) return;
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
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
    const res = await fetch("/api/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
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

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: selected._id, content: newComment }),
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

  async function handleDelete(mediaId) {
    if (!confirm("Delete this media?")) return;
    const res = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
    if (res.ok) {
      setMedia(media.filter((m) => m._id !== mediaId));
      if (selected?._id === mediaId) setSelected(null);
    }
  }
  async function handleDeleteAlbum() {
    if (!confirm("Delete this album? All media inside will also be deleted.")) return;
    const res = await fetch(`/api/albums/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/events/${album?.event?._id || album?.event}`);
    } else {
      const data = await res.json();
      alert(data.error);
    }
  }

  async function handleToggleAlbumVisibility() {
    const res = await fetch(`/api/albums/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !album.isPublic }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
    } else {
      setAlbum(data.album);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-zinc-300 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-zinc-300 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/events/${album?.event?._id || album?.event}`}
        className="text-sm text-zinc-300 hover:text-zinc-300"
      >
        ← Back to event
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-300">{album?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-zinc-300 text-sm">{media.length} items</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${album?.isPublic
              ? "bg-green-100 text-green-700"
              : "bg-zinc-300 text-zinc-300"
              }`}>
              {album?.isPublic ? "Public" : "Private"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="text-sm border cursor-pointer border-zinc-300 text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition"
          >
            📷 QR
          </button>
          {canEdit && (
            <button
              onClick={handleToggleAlbumVisibility}
              className={`text-sm border px-3 py-1.5 rounded-lg transition cursor-pointer ${album?.isPublic
                ? "border-zinc-300 text-zinc-300 hover:bg-zinc-800"
                : "border-green-200 text-green-600 hover:bg-zinc-800"
                }`}
            >
              {album?.isPublic ? "Make private" : "Make public"}
            </button>
          )}
          {canEdit && (
            <button
              onClick={handleDeleteAlbum}
              className="text-sm text-red-500 border cursor-pointer border-red-200 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition"
            >
              Delete album
            </button>
          )}
          <Link
            href="/upload"
            className="bg-purple-600 text-white cursor-pointer px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
          >
            + Upload
          </Link>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-300 rounded-xl text-zinc-300">
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
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {media.map((item) => (
              <div
                key={item._id}
                className="relative group cursor-pointer rounded-xl overflow-hidden bg-zinc-300 aspect-square"
                onClick={() => openMedia(item)}
              >
                {item.type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption || "media"}
                    className="w-full h-full object-cover"
                  />
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
          <div ref={bottomRef} className="py-4 text-center">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 text-zinc-300">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            )}
            {!hasMore && media.length > 0 && (
              <p className="text-xs text-zinc-300">All photos loaded</p>
            )}
          </div>
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
                className="absolute -top-10 right-0 text-white text-sm hover:text-zinc-300"
              >
                ✕ Close
              </button>

              {selected.type === "video" ? (
                <video
                  src={selected.url}
                  controls
                  className="w-full rounded-xl max-h-96"
                />
              ) : (
                <img
                  src={selected.url}
                  alt="full size"
                  className="w-full rounded-xl object-contain max-h-96"
                />
              )}

              <div className="bg-zinc-900 rounded-xl p-4 mt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-zinc-300">
                    By {selected.uploadedBy?.name}
                  </p>
                  <div className="flex items-center gap-3">

                    <button
                      onClick={() => handleLike(selected._id)}
                      className="flex items-center gap-1"
                    >
                      {likes[selected._id]?.liked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                      <span className="text-sm text-zinc-300">
                        {likes[selected._id]?.count || 0}
                      </span>
                    </button>

                    <button onClick={() => handleFavourite(selected._id)}>
                      {favourites[selected._id] ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => setShowShare(true)}
                      className="text-sm text-zinc-300 hover:text-zinc-300"
                    >
                      🔗 Share
                    </button>

                    <button
                      onClick={() => downloadMedia(
                        selected.url,
                        `photo-${selected._id}`,
                        album?.event?.club?.name || "",
                        album?.event?.name || ""
                      )}
                      className="bg-purple-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
                    >
                      Download
                    </button>

                    {(selected.uploadedBy?._id === session?.user?.id ||
                      selected.uploadedBy?._id?.toString() === session?.user?.id ||
                      canEdit) && (
                        <button
                          onClick={() => handleDelete(selected._id)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                  </div>
                </div>

                {selected.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {selected.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <EditTags
                  mediaId={selected._id}
                  initialTags={selected.tags || []}
                  isUploader={
                    selected.uploadedBy?._id === session?.user?.id ||
                    selected.uploadedBy?._id?.toString() === session?.user?.id
                  }
                />

                <TagPeople
                  mediaId={selected._id}
                  taggedUsers={taggedUsers}
                  onUpdate={(updated) => setTaggedUsers(updated)}
                />
              </div>
            </div>

            <div className="w-72 bg-zinc-900 rounded-xl flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-zinc-300">
                <p className="text-sm font-semibold text-zinc-300">
                  Comments ({comments.length})
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
                {comments.length === 0 ? (
                  <p className="text-sm text-zinc-300 text-center py-4">
                    No comments yet
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-zinc-300">
                          {comment.user?.name}
                        </p>
                        <p className="text-sm text-zinc-300">{comment.content}</p>
                        <p className="text-xs text-zinc-300 mt-0.5">
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
                <form
                  onSubmit={handleComment}
                  className="p-3 border-t border-zinc-300 flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          albumUrl={`${window.location.origin}/albums/${id}`}
          photoUrl={selected.url}
          onClose={() => setShowShare(false)}
        />
      )}

      {showQR && (
        <QRModal
          url={`${window.location.origin}/albums/${id}`}
          title={album?.name}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}