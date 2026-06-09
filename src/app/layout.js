import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";
import { auth } from "@/lib/auth";

export const metadata = {
  title:       "MediaHub — Campus Event Media Platform",
  description: "Upload, organize and share event photos and videos for campus clubs",
};

export default async function RootLayout({ children }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}