"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/profile";
  const [status, setStatus] = useState("Securing session...");

  useEffect(() => {
    const supabase = createClient();

    async function handleAuth() {
      const finish = (dest: string) => {
        if (typeof window !== "undefined") {
          window.location.replace(dest);
        } else {
          router.replace(dest);
        }
      };

      try {
        // 1. Check if PKCE code is in the query params
        const code = searchParams.get("code");
        if (code) {
          setStatus("Connecting account...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            finish(next);
            return;
          }
        }

        // 2. Check if access_token is in the URL hash fragment
        if (typeof window !== "undefined" && window.location.hash) {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            setStatus("Finalizing secure token...");
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error && data?.session) {
              finish(next);
              return;
            }
          }
        }

        // 3. Fallback check: get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          finish(next);
          return;
        }

        // 4. Listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, newSession: any) => {
          if (newSession?.user) {
            subscription.unsubscribe();
            finish(next);
          }
        });

        // Safe fallback timeout (1.5s) to prevent lingering
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          finish(next);
        }, 1500);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timeout);
        };
      } catch (err) {
        console.error("Auth callback error:", err);
        finish(next);
      }
    }

    handleAuth();
  }, [router, searchParams, next]);

  return (
    <div className="min-h-screen bg-navy-bg flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-navy-card border border-border-navy rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl animate-scaleUp">
        <div className="flex justify-center">
          <div className="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-center shadow-lg">
            <Image
              src="/logo.svg"
              alt="ValarchiX Logo"
              width={48}
              height={48}
              className="object-contain animate-pulse"
              priority
            />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-black text-heading">Signing in to ValarchiX</h2>
          <p className="text-xs text-muted-grey animate-pulse">{status}</p>
        </div>

        <div className="flex justify-center pt-2">
          <div className="w-8 h-8 border-2 border-emerald/20 border-t-emerald rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-bg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald/20 border-t-emerald rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
