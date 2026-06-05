import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "MediaHub — Event & Media Platform",
  description: "Organize, share and interact with event media",
};

export default async function RootLayout({ children }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}