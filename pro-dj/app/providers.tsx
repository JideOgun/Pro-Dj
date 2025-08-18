"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { SocketProvider } from "@/components/SocketProvider";
import { LoadingProvider } from "@/components/LoadingProvider";
import { useSession } from "next-auth/react";

function SocketWrapper({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  return (
    <SocketProvider userId={session?.user?.id} role={session?.user?.role}>
      {children}
    </SocketProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LoadingProvider>
        <SocketWrapper>{children}</SocketWrapper>
      </LoadingProvider>
    </SessionProvider>
  );
}
