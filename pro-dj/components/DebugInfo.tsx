"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense } from "react";

function DebugInfoContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
      <h3 className="text-red-400 font-bold mb-2">Debug Info (Client Side)</h3>
      <div className="text-sm text-red-300 space-y-1">
        <div>View Parameter: {searchParams.get("view") || "undefined"}</div>
        <div>User Role: {session?.user?.role || "undefined"}</div>
        <div>User Email: {session?.user?.email || "undefined"}</div>
        <div>
          All Search Params:{" "}
          {JSON.stringify(Object.fromEntries(searchParams.entries()))}
        </div>
      </div>
    </div>
  );
}

export default function DebugInfo() {
  return (
    <Suspense
      fallback={<div className="text-red-300">Loading debug info...</div>}
    >
      <DebugInfoContent />
    </Suspense>
  );
}
