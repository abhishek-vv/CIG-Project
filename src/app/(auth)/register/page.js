"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

const ROLES = [
  { value: "VIEWER",       label: "Viewer",       desc: "Browse public events",          icon: "👁️" },
  { value: "CLUB_MEMBER",  label: "Club Member",  desc: "Join events and interact",      icon: "👥" },
  { value: "PHOTOGRAPHER", label: "Photographer", desc: "Upload and manage media",       icon: "📸" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name:       "",
    email:      "",
    password:   "",
    inviteCode: "",
  });
  const [hasCode, setHasCode] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res  = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong");
    } else {
      const loginRes = await signIn("credentials", {
        email:    form.email,
        password: form.password,
        redirect: false,
      });

      setLoading(false);

      if (loginRes?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="font-semibold text-white text-lg">MediaHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-zinc-400 text-sm mt-1">Join your campus media platform</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                required
              />
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Have a club invite code?</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Join a club during registration</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasCode(!hasCode);
                    if (hasCode) setForm({ ...form, inviteCode: "" });
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    hasCode ? "bg-purple-600" : "bg-zinc-600"
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    hasCode ? "translate-x-4" : "translate-x-0.5"
                  }`}/>
                </button>
              </div>

              {hasCode && (
                <div className="mt-3">
                  <input
                    type="text"
                    name="inviteCode"
                    placeholder="e.g. MEM-ABC12345"
                    value={form.inviteCode}
                    onChange={handleChange}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500 font-mono uppercase"
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    MEM- = Club Member • PHO- = Photographer
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}