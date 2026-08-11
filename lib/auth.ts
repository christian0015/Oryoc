// lib/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { loginSchema } from "@/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Visually the primary sign-in path (§5.0) — large, full-color button on the client.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Secondary, opt-in path via a discrete "use email instead" link.
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        await connectDB();
        const dbUser = await UserModel.findOne({ email }).select("+passwordHash");
        if (!dbUser || !dbUser.passwordHash) return null;

        const valid = await bcrypt.compare(password, dbUser.passwordHash);
        if (!valid) return null;

        return {
          id: dbUser._id.toString(),
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.avatarUrl,
          role: dbUser.role,
          locale: dbUser.locale,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // First-time Google sign-in: provision the User document.
      if (account?.provider === "google" && user.email) {
        await connectDB();
        const existing = await UserModel.findOne({ email: user.email });
        if (!existing) {
          await UserModel.create({
            email: user.email,
            name: user.name ?? "Utilisateur ORYOC",
            avatarUrl: user.image ?? undefined,
            authProvider: "google",
            role: "tenant",
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        await connectDB();
        const dbUser = await UserModel.findOne({ email: user.email });
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.role = dbUser.role;
          token.locale = dbUser.locale;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
        session.user.role = token.role ?? "tenant";
        session.user.locale = token.locale ?? "fr";
      }
      return session;
    },
  },
});

/**
 * Convenience helper for server actions / route handlers: returns the
 * signed-in user's Mongo id, or null. Actions that require an account
 * use this as the very first line (see §5.0 / §9).
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Admin is a platform permission separate from the marketplace `role`
 * field, so it's looked up fresh rather than carried in the JWT. */
export async function requireAdminUserId(): Promise<string | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const { connectDB } = await import("@/lib/db");
  const { UserModel } = await import("@/lib/models");
  await connectDB();
  const user = await UserModel.findById(userId);
  return user?.isAdmin ? userId : null;
}
