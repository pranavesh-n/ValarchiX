"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lock, Delete, LogOut, ShieldCheck, Unlock } from "lucide-react";
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
  setCachedUserInfo,
  disableAllPasscodes,
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

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return checkIsAppLockedSync();
    }
    return false;
  });

  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Synchronous lock evaluation whenever session is known
  const checkUserLockState = useCallback((currentUserSession: any) => {
    if (!currentUserSession?.user) {
      setIsLocked(checkIsAppLockedSync());
      return;
    }

    const userId = currentUserSession.user.id;
    setCachedUserInfo(currentUserSession.user);

    const pinKey = getUserPasscodeKey(userId);
    const lockEnabledKey = getUserLockEnabledKey(userId);
    const unlockKey = getUserSessionUnlockedKey(userId);

    const isLockExplicitlyEnabled =
      localStorage.getItem(lockEnabledKey) === "true";
    const savedPinHash = localStorage.getItem(pinKey);
    const isUnlockedInSession =
      sessionStorage.getItem(unlockKey) === "true" ||
      sessionStorage.getItem("valarchix_session_unlocked") === "true";

    if (isLockExplicitlyEnabled && savedPinHash && !isUnlockedInSession) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    setIsLocked(checkIsAppLockedSync());

    const supabase = createClient();

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
      } else {
        setCachedUserInfo(newSession.user);
        checkUserLockState(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUserLockState]);

  const processPinEntry = useCallback(
    async (enteredPin: string) => {
      try {
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

        if (savedPinHash && (hashedInput === savedPinHash || enteredPin === savedPinHash)) {
          sessionStorage.setItem(unlockKey, "true");
          sessionStorage.setItem("valarchix_session_unlocked", "true");
          setIsSuccess(true);
          setErrorMsg("");

          setTimeout(() => {
            setIsLocked(false);
            setPinInput("");
            setIsSuccess(false);
          }, 200);
          return;
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setErrorMsg("Incorrect PIN. Click 'Reset Lock & Enter' below if forgotten.");
          setPinInput("");
        }
      } catch (err) {
        console.error("PIN verification error:", err);
        setErrorMsg("Error verifying. Click 'Reset Lock & Enter' below.");
        setPinInput("");
      }
    },
    [session]
  );

  const handleDigitClick = useCallback(
    (digit: string) => {
      setPinInput((prev) => {
        if (prev.length >= 4) return prev;
        const next = prev + digit;
        setErrorMsg("");
        if (next.length === 4) {
          processPinEntry(next);
        }
        return next;
      });
    },
    [processPinEntry]
  );

  const handleDelete = useCallback(() => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg("");
  }, []);

  const handleResetAndUnlock = useCallback(() => {
    disableAllPasscodes();
    setIsLocked(false);
    setPinInput("");
    setErrorMsg("");
    setIsSuccess(false);
  }, []);

  const handleResetAndSignOut = useCallback(async () => {
    disableAllPasscodes();
    localStorage.removeItem("valarchix_active_user_id");
    localStorage.removeItem("valarchix_cached_first_name");
    sessionStorage.removeItem("valarchix_login_toast_shown");

    setIsLocked(false);
    setPinInput("");
    setErrorMsg("");
    setIsSuccess(false);

    await signOutUser();
    setSession(null);
    router.push("/");
  }, [router]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleDigitClick(key);
      } else if (key === "Backspace" || key === "Delete") {
        e.preventDefault();
        handleDelete();
      } else if (key === "Escape") {
        e.preventDefault();
        handleResetAndUnlock();
      } else if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
        setErrorMsg("PIN uses 4 digits (0-9). Tap 'Reset Lock & Enter' below if needed.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, handleDigitClick, handleDelete, handleResetAndUnlock]);

  if (isLocked) {
    const rawName =
      session?.user?.user_metadata?.full_name ||
      session?.user?.email?.split("@")[0] ||
      getCachedUserFirstName();
    const displayName = getPrimaryFirstName(rawName);

    return (
      <div className="fixed inset-0 z-[99999] bg-[#020817]/95 backdrop-blur-xl text-white flex flex-col items-center justify-center p-4 overflow-y-auto">
        {/* Top-Right Instant Escape / Unlock Button */}
        <div className="absolute top-4 right-4 z-50">
          <button
            type="button"
            onClick={handleResetAndUnlock}
            className="px-4 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
          >
            <Unlock size={14} />
            <span>Close Lock &amp; Enter</span>
          </button>
        </div>

        {/* Ambient background glow accents */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Security Vault Card Container */}
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
                className="w-full h-full object-contain pointer-events-none"
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
              className="text-xl sm:text-2xl font-black text-white tracking-tight"
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
              <div className="text-[12px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-0.5 rounded-full animate-fadeIn max-w-[280px]">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[280px]">
            {KEYPAD_DIGITS.map((item) => (
              <button
                key={item.num}
                type="button"
                onClick={() => handleDigitClick(item.num)}
                className="h-13 sm:h-14 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] active:bg-emerald-500/25 active:scale-95 border border-white/10 transition-all flex flex-col items-center justify-center cursor-pointer shadow-sm select-none"
              >
                <span
                  className="text-xl font-bold tracking-tight leading-none pointer-events-none"
                  style={{ color: "#ffffff" }}
                >
                  {item.num}
                </span>
                {item.sub && (
                  <span
                    className="text-[9px] font-semibold tracking-widest uppercase mt-0.5 leading-none pointer-events-none"
                    style={{ color: "#94a3b8" }}
                  >
                    {item.sub}
                  </span>
                )}
              </button>
            ))}

            {/* Row 4: Biometric/Vault indicator */}
            <div className="h-13 sm:h-14 flex items-center justify-center text-slate-500 rounded-2xl pointer-events-none">
              <Lock size={18} />
            </div>

            {/* Row 4: Digit 0 */}
            <button
              type="button"
              onClick={() => handleDigitClick("0")}
              className="h-13 sm:h-14 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] active:bg-emerald-500/25 active:scale-95 border border-white/10 transition-all flex flex-col items-center justify-center cursor-pointer shadow-sm select-none"
            >
              <span
                className="text-xl font-bold tracking-tight leading-none pointer-events-none"
                style={{ color: "#ffffff" }}
              >
                0
              </span>
              <span
                className="text-[9px] font-semibold tracking-widest uppercase mt-0.5 leading-none pointer-events-none"
                style={{ color: "#94a3b8" }}
              >
                +
              </span>
            </button>

            {/* Row 4: Backspace Button */}
            <button
              type="button"
              onClick={handleDelete}
              className="h-13 sm:h-14 rounded-2xl bg-white/[0.05] hover:bg-rose-500/20 active:scale-95 border border-white/10 transition-all flex items-center justify-center cursor-pointer shadow-sm select-none"
              style={{ color: "#cbd5e1" }}
              title="Delete digit"
            >
              <Delete size={20} className="pointer-events-none" />
            </button>
          </div>

          {/* Action Row */}
          <div className="pt-2 w-full space-y-2">
            <button
              type="button"
              onClick={handleResetAndUnlock}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <Unlock size={14} className="pointer-events-none" />
              <span className="pointer-events-none">Forgot PIN? Reset Lock &amp; Enter</span>
            </button>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>Need to switch account?</span>
              <button
                type="button"
                onClick={handleResetAndSignOut}
                className="text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <LogOut size={11} className="pointer-events-none" />
                <span className="pointer-events-none">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
