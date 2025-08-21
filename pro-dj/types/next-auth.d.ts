import { Role } from "@/app/generated/prisma";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    status: string;
    suspensionReason?: string | null;
    suspendedAt?: Date | null;
    agreedToTerms?: boolean;
    agreedToPrivacy?: boolean;
    agreedToContractorTerms?: boolean;
    agreedToServiceProviderTerms?: boolean;
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
      agreedToTerms?: boolean;
      agreedToPrivacy?: boolean;
      agreedToContractorTerms?: boolean;
      agreedToServiceProviderTerms?: boolean;
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
    agreedToTerms?: boolean;
    agreedToPrivacy?: boolean;
    agreedToContractorTerms?: boolean;
    agreedToServiceProviderTerms?: boolean;
  }
}
