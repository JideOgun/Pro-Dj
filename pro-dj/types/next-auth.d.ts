import { Role } from "@/app/generated/prisma";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    status: string;
    suspensionReason?: string | null;
    suspendedAt?: Date | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      status: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      suspensionReason?: string | null;
      suspendedAt?: Date | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: string;
    suspensionReason?: string | null;
    suspendedAt?: Date | null;
  }
}
