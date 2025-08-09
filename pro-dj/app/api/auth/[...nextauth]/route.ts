import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@/app/generated/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: creds.email },
        });
        if (!user || !user.password) return null;
        const ok = await bcrypt.compare(creds.password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // For google logins, ensure a User exists in the database, default role Client
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            googleId: account.providerAccountId,
          },
          create: {
            email: user.email,
            name: user.name ?? null,
            googleId: account.providerAccountId,
            role: "CLIENT",
          },
        });
      }
      return true;
    },

    async jwt({ token }) {
      // Enrich token with DB user id + role
      if (token?.email) {
        const u = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (u) {
          token.id = u.id;
          token.role = u.role;
          token.name = u.name;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = token.name as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    // optional custom pages if you make them:
    // signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
