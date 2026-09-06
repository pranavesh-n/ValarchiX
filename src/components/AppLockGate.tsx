"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Lock, Delete, LogOut, ShieldCheck } from "lucide-react";
import { signOutUser, getCurrentUserSession } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  hashPin,
  getUserPasscodeKey,
  getUserLockEnabledKey,
  getUserSessionUnlockedKey,
  checkIsAppLockedSync,
  getPrimaryFirstName,
  getCachedUserFirstName,
  setCachedUserInfo
} from "@/lib/passcode";

const KEYPAD_DIGITS = [
  { num: "1", sub: "" },
  { num: "2", sub: "ABC" },
  { num: "3", sub: "DEF" },
  { num: "4", sub: "GHI" },
  { num: "5", sub: "JKL" },
  { num: "6", sub: "MNO" },
  { num: "7", sub: "PQRS" },
  { num: "8", sub: "TUV" },
  { num: "9", sub: "WXYZ" },
];

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  // Synchronous instant lock check (0.001ms latency, 0 waiting for async network)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return checkIsAppLockedSync();
    }
    return false;
  });

  const [hasChecked, setHasChecked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return true;
    }
    return false;
  });

  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const hiddenStartTimeRef = useRef<number | null>(null);
  const isVerifyingRef = useRef(false);

  // Synchronous lock evaluation whenever session is known
  const checkUserLockState = useCallback((currentUserSession: any) => {
    if (!currentUserSession?.user) {
      // If user signed out, check if legacy lock applies
      const isSyncLocked = checkIsAppLockedSync();
      setIsLocked(isSyncLocked);
      setHasChecked(true);
      return;
    }

    const userId = currentUserSession.user.id;
    setCachedUserInfo(currentUserSession.user);

    const pinKey = getUserPasscodeKey(userId);
    const unlockKey = getUserSessionUnlockedKey(userId);

    const savedPinHash = localStorage.getItem(pinKey) || localStorage.getItem("valarchix_app_pin");
    const isUnlockedInSession = sessionStorage.getItem(unlockKey) === "true" ||
                               sessionStorage.getItem("valarchix_session_unlocked") === "true";

    if (savedPinHash && !isUnlockedInSession) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
    setHasChecked(true);
  }, []);

  useEffect(() => {
    // 1. Instant check on mount (frame 0)
    const syncLock = checkIsAppLockedSync();
    setIsLocked(syncLock);
    setHasChecked(true);

    const supabase = createClient();

    // 2. Async session verification in background without blocking frame-0 UI
    async function initAuth() {
      const s = await getCurrentUserSession();
      setSession(s);
      if (s?.user) {
        setCachedUserInfo(s.user);
      }
      checkUserLockState(s);
    }
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, newSession: any) => {
      setSession(newSession);
      if (event === "SIGNED_OUT" || !newSession?.user) {
        setIsLocked(false);
        setPinInput("");
        setFailedAttempts(0);
      } else {
        setCachedUserInfo(newSession.user);
        checkUserLockState(newSession);
      }
    });

    // 25-Second Background Inactivity Lock
    const handleVisibilityChange = async () => {
      const currentS = await getCurrentUserSession();
      if (!currentS?.user) return;

      const userId = currentS.user.id;
      const pinKey = getUserPasscodeKey(userId);
      const savedPin = localStorage.getItem(pinKey) || localStorage.getItem("valarchix_app_pin");
      if (!savedPin) return;

      if (document.hidden) {
        hiddenStartTimeRef.current = Date.now();
      } else {
        if (hiddenStartTimeRef.current) {
          const elapsed = Date.now() - hiddenStartTimeRef.current;
          if (elapsed >= 25000) {
            sessionStorage.removeItem(getUserSessionUnlockedKey(userId));
            sessionStorage.removeItem("valarchix_session_unlocked");
            setIsLocked(true);
            setPinInput("");
            setErrorMsg("");
            setFailedAttempts(0);
            setIsSuccess(false);
          }
        }
        hiddenStartTimeRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkUserLockState]);

  const processPinEntry = useCallback(
    async (enteredPin: string) => {
      if (isVerifyingRef.current) return;
      isVerifyingRef.current = true;

      const currentS = session || (await getCurrentUserSession());
      const activeUserId = currentS?.user?.id || (typeof window !== "undefined" ? localStorage.getItem("valarchix_active_user_id") : null);

      let savedPinHash: string | null = null;
      let unlockKey = "valarchix_session_unlocked";

      if (activeUserId) {
        savedPinHash = localStorage.getItem(getUserPasscodeKey(activeUserId));
        unlockKey = getUserSessionUnlockedKey(activeUserId);
      }

      if (!savedPinHash) {
        savedPinHash = localStorage.getItem("valarchix_app_pin");
      }

      const hashedInput = await hashPin(enteredPin);

      // Verify against SHA-256 hash or plaintext fallback
      if (savedPinHash && (hashedInput === savedPinHash || enteredPin === savedPinHash)) {
        sessionStorage.setItem(unlockKey, "true");
        sessionStorage.setItem("valarchix_session_unlocked", "true");
        setIsSuccess(true);
        setFailedAttempts(0);
        setErrorMsg("");

        setTimeout(() => {
          setIsLocked(false);
          setPinInput("");
          setIsSuccess(false);
          isVerifyingRef.current = false;
        }, 220);
      } else {
        setFailedAttempts((prevAttempts) => {
          const nextAttempts = prevAttempts + 1;
          setShake(true);
          setTimeout(() => setShake(false), 500);

          setTimeout(() => {
            if (nextAttempts >= 2) {
              setErrorMsg("2 incorrect PIN attempts.");
            } else {
              setErrorMsg("Incorrect PIN. Please try again.");
            }
            setPinInput("");
            isVerifyingRef.current = false;
          }, 180);
          return nextAttempts;
        });
      }
    },
    [session]
  );

  const handleKeyPress = useCallback(
    (num: string) => {
      if (isVerifyingRef.current || isSuccess) return;
      setPinInput((prev) => {
        if (prev.length >= 4) return prev;
        const nextPin = prev + num;
        setErrorMsg("");

        if (nextPin.length === 4) {
          processPinEntry(nextPin);
        }
        return nextPin;
      });
    },
    [processPinEntry, isSuccess]
  );

  const handleDelete = useCallback(() => {
    if (isVerifyingRef.current || isSuccess) return;
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg("");
  }, [isSuccess]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, handleKeyPress, handleDelete]);

  const handleResetAndSignOut = async () => {
    const activeUserId = session?.user?.id || (typeof window !== "undefined" ? localStorage.getItem("valarchix_active_user_id") : null);

    if (activeUserId) {
      localStorage.removeItem(getUserPasscodeKey(activeUserId));
      localStorage.removeItem(getUserLockEnabledKey(activeUserId));
      sessionStorage.removeItem(getUserSessionUnlockedKey(activeUserId));
    }
    localStorage.removeItem("valarchix_app_pin");
    localStorage.removeItem("valarchix_active_user_id");
    localStorage.removeItem("valarchix_cached_first_name");
    sessionStorage.removeItem("valarchix_session_unlocked");
    sessionStorage.removeItem("valarchix_login_toast_shown");

    setIsLocked(false);
    setPinInput("");
    setFailedAttempts(0);
    setErrorMsg("");
    setIsSuccess(false);

    await signOutUser();
    setSession(null);
    router.push("/");
  };

  // Safe client check: Never leak children if locked
  if (isLocked) {
    const rawName = session?.user?.user_metadata?.full_name ||
                    session?.user?.email?.split("@")[0] ||
                    getCachedUserFirstName();
    const displayName = getPrimaryFirstName(rawName);

    return (
      <div className="fixed inset-0 z-[99999] bg-[#050b17] text-white flex flex-col items-center justify-center p-4 select-none overflow-y-auto">
        {/* Ambient background glow accents */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Security Vault Card Container */}
        <div className="relative z-10 w-full max-w-sm mx-auto bg-[#091428]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-center flex flex-col items-center space-y-5">
          
          {/* ValarchiX Official Security Emblem */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#030914] border border-emerald-500/40 p-2.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center group">
              <img
                src="/logo.svg"
                alt="ValarchiX"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#091428]"></span>
            </span>
          </div>

          {/* User Name & Instruction */}
          <div className="space-y-1.5 pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
              <ShieldCheck size={13} />
              <span>ValarchiX Vault Protection</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome Back, {displayName} 👋
            </h1>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Enter your 4-digit PIN to securely unlock your financial workspace
            </p>
          </div>

          {/* 4 PIN Dots */}
          <div className={`flex items-center justify-center gap-4 py-2 ${shake ? "animate-shake" : ""}`}>
            {[0, 1, 2, 3].map((index) => {
              const filled = pinInput.length > index;
              return (
                <div
                  key={index}
                  className={`transition-all duration-200 ${
                    isSuccess
                      ? "w-4 h-4 rounded-full bg-emerald-400 border border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.8)] scale-110"
                      : filled
                      ? "w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)] scale-110"
                      : "w-3.5 h-3.5 rounded-full border-2 border-slate-600 bg-slate-800/40"
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message Pill */}
          <div className="min-h-[22px] flex items-center justify-center">
            {errorMsg && (
              <div className="text-[12px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-0.5 rounded-full animate-fadeIn">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Tactile Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {KEYPAD_DIGITS.map((item) => (
              <button
                key={item.num}
                type="button"
                onClick={() => handleKeyPress(item.num)}
                disabled={isSuccess}
                className="h-14 sm:h-15 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-emerald-500/20 active:scale-95 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-sm touch-manipulation select-none"
              >
                <span className="text-xl font-bold text-white tracking-tight leading-none">
                  {item.num}
                </span>
                {item.sub && (
                  <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5 leading-none">
                    {item.sub}
                  </span>
                )}
              </button>
            ))}

            {/* Row 4: Biometric/Vault indicator */}
            <div className="h-14 sm:h-15 flex items-center justify-center text-slate-500 rounded-2xl">
              <Lock size={18} className="text-slate-500/80" />
            </div>

            {/* Row 4: Digit 0 */}
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              disabled={isSuccess}
              className="h-14 sm:h-15 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-emerald-500/20 active:scale-95 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-sm touch-manipulation select-none"
            >
              <span className="text-xl font-bold text-white tracking-tight leading-none">
                0
              </span>
              <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5 leading-none">
                +
              </span>
            </button>

            {/* Row 4: Backspace Button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSuccess}
              className="h-14 sm:h-15 rounded-2xl bg-white/[0.03] hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 active:scale-95 border border-white/[0.06] transition-all duration-150 flex items-center justify-center cursor-pointer shadow-sm touch-manipulation select-none"
              title="Delete digit"
            >
              <Delete size={20} />
            </button>
          </div>

          {/* Bottom Forgot PIN Action */}
          <div className="pt-2 w-full flex items-center justify-center min-h-[44px]">
            {failedAttempts >= 2 ? (
              <button
                type="button"
                onClick={handleResetAndSignOut}
                className="text-xs font-bold text-rose-300 hover:text-rose-200 flex items-center gap-1.5 cursor-pointer bg-rose-500/15 px-4 py-2 rounded-full border border-rose-500/30 transition-all hover:bg-rose-500/25"
              >
                <LogOut size={14} />
                <span>Forgot PIN? Sign out &amp; Reset</span>
              </button>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium">
                Forgot PIN? Enter incorrectly 2 times to reset
              </p>
            )}
          </div>

        </div>
      </div>
    );
  }

  // If not locked and checked, render children directly
  return <>{children}</>;
}
