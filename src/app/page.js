import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-purple-50 to-white px-4">
      <div className="text-center max-w-xl">
        <div className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
          Event & Media Platform
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          All your club memories,<br />
          <span className="text-purple-600">in one place</span>
        </h1>
        <p className="text-gray-500 mb-8 text-base">
          Upload, organize and share photos and videos from your events.
          AI-powered tagging, facial recognition, and social features included.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/register"
            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-2xl w-full">
        {[
          { label: "Event management", icon: "📅" },
          { label: "AI auto-tagging", icon: "🤖" },
          { label: "Facial recognition", icon: "🔍" },
          { label: "Real-time notifs", icon: "🔔" },
        ].map((f) => (
          <div key={f.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-2">{f.icon}</div>
            <p className="text-xs text-gray-600 font-medium">{f.label}</p>
          </div>
        ))}
      </div>
    </main>
  );
}