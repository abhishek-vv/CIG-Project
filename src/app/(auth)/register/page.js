"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    inviteCode: "",
  });
  const [hasCode, setHasCode] = useState(false);
  const [error, setError] = useState("");
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

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    console.log("Register response:", data);

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong");
    } else {
      console.log("Trying to sign in...");
      const loginRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      console.log("Login result:", loginRes);
      setLoading(false);

      if (loginRes?.error) {
        console.log("Login failed:", loginRes.error);
        router.push("/login");
      } else {
        console.log("Login success, redirecting...");
        router.push("/dashboard");
        router.refresh();
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-md">

        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-bold text-purple-600">MediaHub</Link>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Club membership toggle */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Join a club?</p>
                <p className="text-xs text-gray-400 mt-0.5">Have an invite code from your club?</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHasCode(!hasCode);
                  if (hasCode) setForm({ ...form, inviteCode: "" });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasCode ? "bg-purple-600" : "bg-gray-200"
                  }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasCode ? "translate-x-6" : "translate-x-1"
                  }`} />
              </button>
            </div>

            {/* Invite code input */}
            {hasCode && (
              <div className="mt-3">
                <input
                  type="text"
                  name="inviteCode"
                  placeholder="Enter invite code (e.g. MEM-ABC12345)"
                  value={form.inviteCode}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ask your club admin for the invite code. Codes starting with MEM- make you a Club Member, PHO- make you a Photographer.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-purple-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}