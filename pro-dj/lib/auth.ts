import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@/app/generated/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  // Add NEXTAUTH_URL for production
  ...(process.env.NEXTAUTH_URL && { url: process.env.NEXTAUTH_URL }),
  providers: [
    // Temporarily comment out Google OAuth until configured
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   authorization: {
    //     params: {
    //       prompt: "consent",
    //       access_type: "offline",
    //       response_type: "code",
    //     },
    //   },
    // }),
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) return null;

        console.log("Credentials login attempt:", { email: creds.email });

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: creds.email,
              mode: "insensitive",
            },
          },
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

        // Check if user already exists (case-insensitive)
        const existingUser = await prisma.user.findFirst({
          where: {
            email: {
              equals: user.email,
              mode: "insensitive",
            },
          },
        });

        if (existingUser) {
          // Update existing user but preserve their role and password
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name ?? existingUser.name,
              googleId: account.providerAccountId,
              // Preserve existing email case if different
              email: existingUser.email,
            },
          });
          console.log(
            `✅ Merged Google account with existing user: ${existingUser.email}`
          );
        } else {
          // Create new user with CLIENT role (they'll select their role later)
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              googleId: account.providerAccountId,
              role: "CLIENT", // Default, will be updated in role selection
            },
          });
          console.log(`✅ Created new user from Google: ${user.email}`);
        }
      }
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Simple redirect logic
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      return url;
    },

    async jwt({ token, trigger, session }) {
      // Enrich token with DB user id + role
      if (token?.email) {
        const u = await prisma.user.findFirst({
          where: {
            email: {
              equals: token.email,
              mode: "insensitive",
            },
          },
        });
        if (u) {
          token.id = u.id;
          token.role = u.role;
          token.name = u.name;
          token.status = u.status;
          token.suspensionReason = u.suspensionReason;
          token.suspendedAt = u.suspendedAt;
          token.agreedToTerms = u.agreedToTerms;
          token.agreedToPrivacy = u.agreedToPrivacy;
          token.agreedToContractorTerms = u.agreedToContractorTerms;
          token.agreedToServiceProviderTerms = u.agreedToServiceProviderTerms;
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
        session.user.agreedToTerms = token.agreedToTerms as boolean;
        session.user.agreedToPrivacy = token.agreedToPrivacy as boolean;
        session.user.agreedToContractorTerms =
          token.agreedToContractorTerms as boolean;
        session.user.agreedToServiceProviderTerms =
          token.agreedToServiceProviderTerms as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
  useSecureCookies: false,
};
