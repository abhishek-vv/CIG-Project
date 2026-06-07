"use client";

import { useState } from "react";

export default function ShareModal({ albumUrl, photoUrl, onClose }) {
  const [copied,   setCopied]   = useState("");
  const [sharing,  setSharing]  = useState(false);

  async function copyToClipboard(url, type) {
    await navigator.clipboard.writeText(url);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  }

  async function getImageFile() {
    const response = await fetch(photoUrl);
    const blob     = await response.blob();
    const ext      = blob.type.includes("video") ? "mp4" : "jpg";
    return new File([blob], `media.${ext}`, { type: blob.type });
  }

  async function shareViaNavigator() {
    try {
      setSharing(true);
      const file = await getImageFile();
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Check out this photo!",
          text:  "Shared from MediaHub",
        });
      } else {
        await navigator.share({
          title: "Check out this photo!",
          url:   photoUrl,
        });
      }
    } catch (error) {
      console.error("Share error:", error);
    } finally {
      setSharing(false);
    }
  }

  async function shareWhatsApp() {
    try {
      setSharing(true);
      const file = await getImageFile();
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(photoUrl)}`,
          "_blank"
        );
      }
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(photoUrl)}`,
        "_blank"
      );
    } finally {
      setSharing(false);
    }
  }

  async function shareTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(photoUrl)}`,
      "_blank"
    );
  }

  async function shareTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(photoUrl)}`,
      "_blank"
    );
  }

  async function downloadAndShare(platform) {
    try {
      setSharing(true);
      const response = await fetch(photoUrl);
      const blob     = await response.blob();
      const ext      = blob.type.includes("video") ? "mp4" : "jpg";
      const blobUrl  = URL.createObjectURL(blob);

      const link    = document.createElement("a");
      link.href     = blobUrl;
      link.download = `media.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setTimeout(() => {
        if (platform === "whatsapp") {
          window.open("https://wa.me/", "_blank");
        } else if (platform === "telegram") {
          window.open("https://t.me/", "_blank");
        }
      }, 500);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Share</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {sharing && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 mb-4">
            <p className="text-purple-600 text-sm text-center">Preparing media...</p>
          </div>
        )}

        <div className="space-y-3 mb-5">

          {navigator?.share && (
            <button
              onClick={shareViaNavigator}
              disabled={sharing}
              className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              📱 Share photo directly
            </button>
          )}

          <div className="border border-gray-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span>💬</span>
              <p className="text-sm font-medium text-gray-800">WhatsApp</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={shareWhatsApp}
                disabled={sharing}
                className="flex-1 text-xs text-white py-1.5 rounded-lg bg-green-500 hover:bg-green-600 transition disabled:opacity-60"
              >
                Share photo
              </button>
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(albumUrl)}`, "_blank")}
                className="flex-1 text-xs text-white py-1.5 rounded-lg bg-green-500 hover:bg-green-600 transition"
              >
                Share album link
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span>✈️</span>
              <p className="text-sm font-medium text-gray-800">Telegram</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadAndShare("telegram")}
                disabled={sharing}
                className="flex-1 text-xs text-white py-1.5 rounded-lg bg-blue-400 hover:bg-blue-500 transition disabled:opacity-60"
              >
                Share photo
              </button>
              <button
                onClick={shareTelegram}
                className="flex-1 text-xs text-white py-1.5 rounded-lg bg-blue-400 hover:bg-blue-500 transition"
              >
                Share album link
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span>🐦</span>
              <p className="text-sm font-medium text-gray-800">Twitter / X</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(photoUrl)}`, "_blank")}
                className="flex-1 text-xs text-white py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 transition"
              >
                Share photo link
              </button>
              <button
                onClick={shareTwitter}
                className="flex-1 text-xs text-white py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 transition"
              >
                Share album link
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-xs text-gray-500 font-medium mb-2">Copy link</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={albumUrl}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50"
            />
            <button
              onClick={() => copyToClipboard(albumUrl, "album")}
              className="bg-purple-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-purple-700 transition shrink-0"
            >
              {copied === "album" ? "✅" : "Copy album"}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={photoUrl}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50"
            />
            <button
              onClick={() => copyToClipboard(photoUrl, "photo")}
              className="bg-purple-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-purple-700 transition shrink-0"
            >
              {copied === "photo" ? "✅" : "Copy photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}