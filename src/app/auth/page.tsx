"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, LogOut, RefreshCw, CheckCircle2, UserCheck, Key, Zap, Sparkles, Download } from "lucide-react";
import { signInWithGoogle, signInWithDemoUser, signOutUser, getCurrentUserSession } from "@/lib/supabase/auth";

export default function AuthPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const s = await getCurrentUserSession();
      setSession(s);
      setLoading(false);
    }
    fetchSession();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const s = await signInWithGoogle();
      if (s) {
        const fresh = await getCurrentUserSession();
        setSession(fresh);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    const s = await signInWithDemoUser();
    setSession(s);
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOutUser();
    setSession(null);
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
      <div className="max-w-xl w-full bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden transition-colors duration-300">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-950/60 border border-indigo-800/80 rounded-2xl text-indigo-400 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-heading">ValarchiX Encrypted Vault</h1>
          <p className="text-xs text-muted-grey max-w-md mx-auto">
            Sign in to unlock Live Financial DNA Auto-Sync, Zero-Knowledge Multi-Device Vault, and Persistent Memory.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-grey text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Vault Session...
          </div>
        ) : session?.user ? (
          <div className="bg-navy-bg border border-border-navy rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              {session.user.user_metadata?.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="Profile" className="w-12 h-12 rounded-full border-2 border-emerald shadow-md" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald/20 border-2 border-emerald flex items-center justify-center font-extrabold text-emerald text-lg">
                  {session.user.email?.[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-base font-extrabold text-heading tracking-wide">{session.user.user_metadata?.full_name || session.user.email}</div>
                <div className="text-xs text-emerald font-bold flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald" /> Supabase Encrypted Vault Active
                </div>
              </div>
            </div>

            <div className="border-t border-border-navy pt-3 text-xs space-y-2 text-light-grey">
              <div className="flex justify-between">
                <span className="text-muted-grey">Vault Encryption:</span>
                <span className="font-mono text-indigo-400 font-bold">AES-256-GCM (Zero-Knowledge)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-grey">Multi-Device Sync:</span>
                <span className="text-emerald font-bold">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-grey">Live DNA Auto-Sync:</span>
                <span className="text-emerald font-bold">Enabled (`78 ↑4`)</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && (window as any).triggerPwaInstall) {
                    (window as any).triggerPwaInstall();
                  }
                }}
                className="w-full bg-emerald/10 hover:bg-emerald hover:text-navy-bg text-emerald border border-emerald/40 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" /> Install ValarchiX Mobile App (PWA)
              </button>

              <button
                onClick={handleSignOut}
                className="w-full bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out & Lock Vault
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-heading text-navy-bg hover:opacity-90 font-extrabold text-sm py-3.5 px-4 rounded-2xl transition flex items-center justify-center gap-3 shadow-lg"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border-navy"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-muted-grey uppercase">Or Test Instantly</span>
              <div className="flex-grow border-t border-border-navy"></div>
            </div>

            <button
              onClick={handleDemoSignIn}
              className="w-full bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/80 font-bold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-indigo-400" /> Instant Demo Sign-In (1-Click Test)
            </button>

            <div className="bg-navy-bg border border-border-navy rounded-2xl p-4 text-xs space-y-2 text-muted-grey">
              <div className="font-semibold text-heading mb-1 uppercase tracking-wider text-[11px]">Why Sign In?</div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                <span><strong>Live DNA Auto-Sync</strong>: Tracks your score evolution over time (`78 ↑4`).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                <span><strong>Zero-Knowledge Privacy</strong>: Client-side AES-256-GCM encryption before saving to Supabase.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                <span><strong>Multi-Device Cloud Sync</strong>: Access your exact financial twin on phone, tablet, and desktop.</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).triggerPwaInstall) {
                  (window as any).triggerPwaInstall();
                }
              }}
              className="w-full bg-emerald/10 hover:bg-emerald hover:text-navy-bg text-emerald border border-emerald/40 font-bold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4"
            >
              <Download className="w-4 h-4" /> Install ValarchiX Mobile App (PWA)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
