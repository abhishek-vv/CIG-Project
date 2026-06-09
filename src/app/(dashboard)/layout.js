import Navbar from "@/components/ui/Navbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}