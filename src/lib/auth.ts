import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;
        // Only block if explicitly false — undefined means old account, treat as verified
        if (user.emailVerified === false) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existing = await User.findOne({ email: user.email!.toLowerCase() });
          if (!existing) {
            await User.create({
              name:          user.name ?? "Google User",
              email:         user.email!.toLowerCase(),
              password:      "",
              emailVerified: true,
            });
          } else if (!existing.emailVerified) {
            await User.findByIdAndUpdate(existing._id, { emailVerified: true });
          }
        } catch (e) {
          console.error("[auth] Google signIn error:", e);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) token.id = user.id;
      // For Google — always overwrite with MongoDB _id, not Google's numeric ID
      if (account?.provider === "google" && token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email.toLowerCase() });
        if (dbUser) token.id = dbUser._id.toString();
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },

  pages: { signIn: "/auth/login", error: "/auth/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
