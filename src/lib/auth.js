import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          await connectDB();

          // explicitly select password since it has select: false
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
          }).select("+password");

          console.log("Auth user found:", user?.email, "has password:", !!user?.password);

          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(
            credentials.password, 
            user.password
          );

          console.log("Password valid:", isValid);

          if (!isValid) return null;

          return {
            id:    user._id.toString(),
            email: user.email,
            name:  user.name,
            image: user.image || null,
            role:  user.role,
          };
        } catch (error) {
          console.error("Auth error:", error.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});