"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingSpinner from "./LoadingSpinner";

export default function PageLoading() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // Simulate loading on route changes
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return <LoadingSpinner message="Loading page..." size="sm" />;
}
