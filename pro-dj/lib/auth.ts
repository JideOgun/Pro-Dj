import { NextAuthOptions } from "next-auth";
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
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) return null;

        console.log("Credentials login attempt:", { email: creds.email });

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
        });

        if (!user) {
          console.log("User not found");
          return null;
        }

        if (!user.password) {
          console.log("User has no password");
          return null;
        }

        const ok = await bcrypt.compare(creds.password, user.password);
        console.log("Password comparison result:", ok);

        if (!ok) return null;

        console.log("Login successful for user:", {
          id: user.id,
          email: user.email,
          role: user.role,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],

  callbacks: {
    // For google logins, ensure a User exists in the database, preserve existing role
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          // Update existing user but preserve their role
          await prisma.user.update({
            where: { email: user.email },
            data: {
              name: user.name ?? undefined,
              googleId: account.providerAccountId,
            },
          });
        } else {
          // Create new user with CLIENT role
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              googleId: account.providerAccountId,
              role: "CLIENT",
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, trigger, session }) {
      // Enrich token with DB user id + role
      if (token?.email) {
        const u = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (u) {
          token.id = u.id;
          token.role = u.role;
          token.name = u.name;
          token.status = u.status;
          token.suspensionReason = u.suspensionReason;
          token.suspendedAt = u.suspendedAt;
        }
      }

      // Handle session update trigger
      if (trigger === "update" && session) {
        token.role = session.role;
        token.status = session.status;
        token.suspensionReason = session.suspensionReason;
        token.suspendedAt = session.suspendedAt;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = token.name as string | null | undefined;
        session.user.status = token.status as string;
        session.user.suspensionReason = token.suspensionReason as string | null;
        session.user.suspendedAt = token.suspendedAt as Date | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
};
