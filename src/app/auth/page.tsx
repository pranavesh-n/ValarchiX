"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // 1-Click login is now directly available via the top-right profile dropdown!
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-pulse text-xs text-muted-grey font-bold">
        Redirecting to ValarchiX Home...
      </div>
    </div>
  );
}
