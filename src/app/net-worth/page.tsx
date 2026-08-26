"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NetWorthRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Net Worth is now integrated into Financial DNA Engine
    router.replace("/financial-dna");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-pulse text-xs text-muted-grey font-bold">
        Redirecting to Financial DNA...
      </div>
    </div>
  );
}
