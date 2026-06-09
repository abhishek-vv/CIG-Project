import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-semibold text-white tracking-tight">MediaHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"/>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"/>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
            <span className="text-xs text-zinc-400">Built for campus clubs</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            All your club{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-violet-400">
              memories
            </span>
            <br />
            in one place
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload, organize and share event photos and videos.
            AI-powered tagging, facial recognition, and Instagram-like
            social features — built for your campus.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3.5 rounded-xl font-medium text-sm transition"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white px-8 py-3.5 rounded-xl font-medium text-sm transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything your club needs</h2>
          <p className="text-zinc-400">Powerful features for managing campus event media</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon:  "🏛️",
              title: "Club management",
              desc:  "Create clubs, invite members with codes, assign roles — Admin, Photographer, Member",
            },
            {
              icon:  "📅",
              title: "Event organization",
              desc:  "Organize media by events and albums. Public and private access control built in",
            },
            {
              icon:  "🤖",
              title: "AI auto-tagging",
              desc:  "Photos are automatically tagged with objects, scenes and activities using AWS Rekognition",
            },
            {
              icon:  "🔍",
              title: "Facial recognition",
              desc:  "Upload a selfie and instantly find all photos containing your face across all events",
            },
            {
              icon:  "❤️",
              title: "Social features",
              desc:  "Like, comment, share, tag friends, save to favourites — just like Instagram",
            },
            {
              icon:  "🔔",
              title: "Real-time notifications",
              desc:  "Get notified instantly when someone likes, comments or tags you in a photo",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-purple-800 hover:bg-zinc-900/80 transition"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-zinc-800 bg-zinc-900/50 py-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "∞",    label: "Photos supported"   },
            { value: "100%", label: "Free to use"         },
            { value: "AI",   label: "Powered tagging"     },
            { value: "🔒",   label: "Access controlled"   },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-purple-400 mb-1">{s.value}</p>
              <p className="text-zinc-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Ready to get started?
        </h2>
        <p className="text-zinc-400 mb-8">
          Join your campus clubs and never lose a memory again
        </p>
        <Link
          href="/register"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-xl font-medium transition"
        >
          Create your account
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span className="text-sm text-zinc-400">MediaHub</span>
          </div>
          <p className="text-xs text-zinc-600">
            Built for campus clubs
          </p>
        </div>
      </footer>
    </main>
  );
}