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

  // Synchronous instant lock check (0 latency)
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
      // If user signed out, check if lock applies
      const isSyncLocked = checkIsAppLockedSync();
      setIsLocked(isSyncLocked);
      setHasChecked(true);
      return;
    }

    const userId = currentUserSession.user.id;
    setCachedUserInfo(currentUserSession.user);

    const pinKey = getUserPasscodeKey(userId);
    const lockEnabledKey = getUserLockEnabledKey(userId);
    const unlockKey = getUserSessionUnlockedKey(userId);

    const isLockExplicitlyEnabled =
      localStorage.getItem(lockEnabledKey) === "true" ||
      localStorage.getItem("valarchix_app_lock_enabled") === "true";
    const savedPinHash =
      localStorage.getItem(pinKey) || localStorage.getItem("valarchix_app_pin");
    const isUnlockedInSession =
      sessionStorage.getItem(unlockKey) === "true" ||
      sessionStorage.getItem("valarchix_session_unlocked") === "true";

    if (isLockExplicitlyEnabled && savedPinHash && !isUnlockedInSession) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
    setHasChecked(true);
  }, []);

  useEffect(() => {
    // 1. Instant check on mount
    const syncLock = checkIsAppLockedSync();
    setIsLocked(syncLock);
    setHasChecked(true);

    const supabase = createClient();

    // 2. Async session verification in background without blocking UI
    async function initAuth() {
      const s = await getCurrentUserSession();
      setSession(s);
      if (s?.user) {
        setCachedUserInfo(s.user);
      }
      checkUserLockState(s);
    }
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, newSession: any) => {
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

    // 3. 25-Second Background Tab Lockout
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        hiddenStartTimeRef.current = Date.now();
      } else {
        if (hiddenStartTimeRef.current) {
          const elapsed = Date.now() - hiddenStartTimeRef.current;
          hiddenStartTimeRef.current = null;

          // If tab was backgrounded for 25 seconds or more, lock the app
          if (elapsed >= 25000) {
            const currentS = session || (await getCurrentUserSession());
            if (currentS?.user) {
              const activeUserId = currentS.user.id;
              const pinKey = getUserPasscodeKey(activeUserId);
              const lockEnabledKey = getUserLockEnabledKey(activeUserId);
              const unlockKey = getUserSessionUnlockedKey(activeUserId);

              const isEnabled =
                localStorage.getItem(lockEnabledKey) === "true" ||
                localStorage.getItem("valarchix_app_lock_enabled") === "true";
              const savedPin =
                localStorage.getItem(pinKey) ||
                localStorage.getItem("valarchix_app_pin");

              if (isEnabled && savedPin) {
                sessionStorage.removeItem(unlockKey);
                sessionStorage.removeItem("valarchix_session_unlocked");
                setIsLocked(true);
                setPinInput("");
                setErrorMsg("");
              }
            } else {
              const isEnabled =
                localStorage.getItem("valarchix_app_lock_enabled") === "true";
              const savedPin = localStorage.getItem("valarchix_app_pin");
              if (isEnabled && savedPin) {
                sessionStorage.removeItem("valarchix_session_unlocked");
                setIsLocked(true);
                setPinInput("");
                setErrorMsg("");
              }
            }
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkUserLockState, session]);

  const processPinEntry = useCallback(
    async (enteredPin: string) => {
      if (isVerifyingRef.current) return;
      isVerifyingRef.current = true;

      const currentS = session || (await getCurrentUserSession());
      const activeUserId =
        currentS?.user?.id ||
        (typeof window !== "undefined"
          ? localStorage.getItem("valarchix_active_user_id")
          : null);

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
    const activeUserId =
      session?.user?.id ||
      (typeof window !== "undefined"
        ? localStorage.getItem("valarchix_active_user_id")
        : null);

    if (activeUserId) {
      localStorage.removeItem(getUserPasscodeKey(activeUserId));
      localStorage.removeItem(getUserLockEnabledKey(activeUserId));
      sessionStorage.removeItem(getUserSessionUnlockedKey(activeUserId));
    }
    localStorage.removeItem("valarchix_app_pin");
    localStorage.removeItem("valarchix_app_lock_enabled");
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
    const rawName =
      session?.user?.user_metadata?.full_name ||
      session?.user?.email?.split("@")[0] ||
      getCachedUserFirstName();
    const displayName = getPrimaryFirstName(rawName);

    return (
      <div className="fixed inset-0 z-[99999] bg-[#020817]/95 backdrop-blur-xl text-white flex flex-col items-center justify-center p-4 select-none overflow-y-auto">
        {/* Ambient background glow accents */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Security Vault Card Container (Always high-contrast dark vault) */}
        <div
          className="relative z-10 w-full max-w-sm mx-auto bg-[#091428] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center space-y-4"
          style={{ backgroundColor: "#091428", borderColor: "rgba(255,255,255,0.12)" }}
        >
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
            <h1
              className="text-xl sm:text-2xl font-black !text-white tracking-tight"
              style={{ color: "#ffffff" }}
            >
              Welcome Back, {displayName} 👋
            </h1>
            <p
              className="text-xs font-medium leading-relaxed"
              style={{ color: "#cbd5e1" }}
            >
              Enter your 4-digit PIN to securely unlock your financial workspace
            </p>
          </div>

          {/* 4 PIN Dots */}
          <div
            className={`flex items-center justify-center gap-4 py-1.5 ${
              shake ? "animate-shake" : ""
            }`}
          >
            {[0, 1, 2, 3].map((index) => {
              const filled = pinInput.length > index;
              return (
                <div
                  key={index}
                  className={`transition-all duration-200 ${
                    isSuccess
                      ? "w-4 h-4 rounded-full bg-emerald-500 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)] scale-110"
                      : filled
                      ? "w-4 h-4 rounded-full bg-emerald-500 border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)] scale-110"
                      : "w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-800/80"
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
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[280px]">
            {KEYPAD_DIGITS.map((item) => (
              <button
                key={item.num}
                type="button"
                onClick={() => handleKeyPress(item.num)}
                disabled={isSuccess}
                className="h-13 sm:h-14 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-emerald-500/20 active:scale-95 border border-white/[0.08] transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-sm touch-manipulation select-none"
              >
                <span
                  className="text-xl font-bold tracking-tight leading-none"
                  style={{ color: "#ffffff" }}
                >
                  {item.num}
                </span>
                {item.sub && (
                  <span
                    className="text-[9px] font-semibold tracking-widest uppercase mt-0.5 leading-none"
                    style={{ color: "#94a3b8" }}
                  >
                    {item.sub}
                  </span>
                )}
              </button>
            ))}

            {/* Row 4: Biometric/Vault indicator */}
            <div className="h-13 sm:h-14 flex items-center justify-center text-slate-500 rounded-2xl">
              <Lock size={18} />
            </div>

            {/* Row 4: Digit 0 */}
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              disabled={isSuccess}
              className="h-13 sm:h-14 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-emerald-500/20 active:scale-95 border border-white/[0.08] transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-sm touch-manipulation select-none"
            >
              <span
                className="text-xl font-bold tracking-tight leading-none"
                style={{ color: "#ffffff" }}
              >
                0
              </span>
              <span
                className="text-[9px] font-semibold tracking-widest uppercase mt-0.5 leading-none"
                style={{ color: "#94a3b8" }}
              >
                +
              </span>
            </button>

            {/* Row 4: Backspace Button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSuccess}
              className="h-13 sm:h-14 rounded-2xl bg-white/[0.04] hover:bg-rose-500/20 active:scale-95 border border-white/[0.08] transition-all duration-150 flex items-center justify-center cursor-pointer shadow-sm touch-manipulation select-none"
              style={{ color: "#cbd5e1" }}
              title="Delete digit"
            >
              <Delete size={20} />
            </button>
          </div>

          {/* Action Row */}
          <div className="pt-2 w-full">
            {failedAttempts >= 2 ? (
              <button
                type="button"
                onClick={handleResetAndSignOut}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <LogOut size={14} />
                <span>Forgot PIN? Sign out &amp; Reset</span>
              </button>
            ) : (
              <p
                className="text-[11px] font-medium tracking-tight"
                style={{ color: "#94a3b8" }}
              >
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
