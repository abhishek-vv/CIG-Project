"use client";

import { useState, useEffect } from "react";

export default function QRModal({ url, title, onClose }) {
  const [qr,      setQr]      = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQR() {
      const res  = await fetch(`/api/qr?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (res.ok) setQr(data.qr);
      setLoading(false);
    }
    fetchQR();
  }, [url]);

  async function handleDownloadQR() {
    const link    = document.createElement("a");
    link.href     = qr;
    link.download = `qr-${title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Share via QR</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">{title}</p>

        {loading ? (
          <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto animate-pulse"/>
        ) : qr ? (
          <img
            src={qr}
            alt="QR Code"
            className="w-48 h-48 mx-auto rounded-xl border border-gray-200"
          />
        ) : (
          <p className="text-red-500 text-sm">Failed to generate QR code</p>
        )}

        <p className="text-xs text-gray-400 mt-3 break-all px-2">{url}</p>

        {qr && (
          <button
            onClick={handleDownloadQR}
            className="w-full mt-4 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition"
          >
            Download QR Code
          </button>
        )}
      </div>
    </div>
  );
}