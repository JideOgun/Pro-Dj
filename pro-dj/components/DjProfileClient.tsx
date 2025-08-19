"use client";

import { useSession } from "next-auth/react";
import FollowButton from "./FollowButton";

interface DjProfileClientProps {
  djId: string;
  userId: string;
  stageName: string;
  children: React.ReactNode;
}

export default function DjProfileClient({
  djId,
  userId,
  stageName,
  children,
}: DjProfileClientProps) {
  const { data: session } = useSession();

  // Don't show follow button for own profile or if not logged in
  if (!session?.user || session.user.id === userId) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute top-4 right-4 z-20">
        <FollowButton userId={userId} size="lg" showCount={true} />
      </div>
    </div>
  );
}
