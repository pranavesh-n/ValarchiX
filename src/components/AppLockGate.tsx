"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lock, Delete, LogOut, ShieldCheck, Sun, Moon } from "lucide-react";
import { signOutUser, getCurrentUserSession } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  hashPin,
  getUserPasscodeKey,
  getUserLockEnabledKey,
  checkIsAppLockedSync,
  isAppUnlockedInSession,
  setAppUnlockedInSession,
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

  // Synchronous lock evaluation on initial render
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return checkIsAppLockedSync();
    }
    return false;
  });

  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Read active theme on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = document.documentElement.classList.contains("light") ? "light" : "dark";
      setCurrentTheme(active);
    }
  }, []);

  const handleToggleTheme = useCallback(() => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
    window.dispatchEvent(new CustomEvent("valarchix_theme_changed", { detail: nextTheme }));
  }, [currentTheme]);

  // Synchronous lock evaluation whenever session is known
  const checkUserLockState = useCallback((currentUserSession: any) => {
    if (isAppUnlockedInSession()) {
      setIsLocked(false);
      return;
    }

    if (!currentUserSession?.user) {
      setIsLocked(checkIsAppLockedSync());
      return;
    }

    const userId = currentUserSession.user.id;
    setCachedUserInfo(currentUserSession.user);

    const pinKey = getUserPasscodeKey(userId);
    const lockEnabledKey = getUserLockEnabledKey(userId);

    const isLockExplicitlyEnabled =
      localStorage.getItem(lockEnabledKey) === "true" ||
      localStorage.getItem("valarchix_app_lock_enabled") === "true";
    const savedPinHash =
      localStorage.getItem(pinKey) || localStorage.getItem("valarchix_app_pin");

    if (isLockExplicitlyEnabled && savedPinHash) {
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

        if (activeUserId) {
          savedPinHash = localStorage.getItem(getUserPasscodeKey(activeUserId));
        }

        if (!savedPinHash) {
          savedPinHash = localStorage.getItem("valarchix_app_pin");
        }

        const hashedInput = await hashPin(enteredPin);

        if (savedPinHash && (hashedInput === savedPinHash || enteredPin === savedPinHash)) {
          setAppUnlockedInSession(true);
          setIsSuccess(true);
          setErrorMsg("");

          setTimeout(() => {
            setIsLocked(false);
            setPinInput("");
            setIsSuccess(false);
          }, 180);
          return;
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setErrorMsg("Incorrect PIN. Please try again.");
          setPinInput("");
        }
      } catch (err) {
        console.error("PIN verification error:", err);
        setErrorMsg("Error verifying PIN. Please try again.");
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

  const handleSignOutToReset = useCallback(async () => {
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, handleDigitClick, handleDelete]);

  if (isLocked) {
    const rawName =
      session?.user?.user_metadata?.full_name ||
      session?.user?.email?.split("@")[0] ||
      getCachedUserFirstName();
    const displayName = getPrimaryFirstName(rawName);

    return (
      <div className="fixed inset-0 z-[99999] bg-slate-50/95 dark:bg-[#020817]/95 backdrop-blur-2xl flex flex-col items-center justify-start sm:justify-center p-4 py-8 sm:py-6 min-h-[100dvh] overflow-y-auto transition-colors duration-200">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
          <button
            type="button"
            onClick={handleToggleTheme}
            className="p-2.5 rounded-full bg-white/80 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 shadow-md backdrop-blur-md transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle theme"
          >
            {currentTheme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-700" />}
          </button>
        </div>

        {/* Ambient background glow accents */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Security Vault Card Container - Flawless Light & Dark adaptive */}
        <div className="relative z-10 w-full max-w-sm mx-auto my-auto bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl text-center flex flex-col items-center space-y-3.5 sm:space-y-4 transition-colors duration-200">
          {/* ValarchiX Official Security Emblem */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-[#060b17] border border-emerald-500/40 p-2.5 shadow-xl shadow-emerald-500/10 flex items-center justify-center">
              <img
                src="/logo.svg"
                alt="ValarchiX"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#0c1322]"></span>
            </span>
          </div>

          {/* User Name & Instruction */}
          <div className="space-y-1.5 pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={13} />
              <span>ValarchiX Vault Protection</span>
            </div>
            <div
              role="heading"
              aria-level={1}
              className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              Welcome Back, {displayName} 👋
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
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
                      : "w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/80"
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message Pill */}
          <div className="min-h-[22px] flex items-center justify-center">
            {errorMsg && (
              <div className="text-[12px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-0.5 rounded-full animate-fadeIn max-w-[280px]">
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
                className="h-13 sm:h-14 rounded-2xl bg-slate-100/90 hover:bg-slate-200 active:bg-emerald-500/15 border border-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:active:bg-emerald-500/20 dark:border-white/10 transition-all flex flex-col items-center justify-center cursor-pointer shadow-sm active:scale-95 select-none"
              >
                <span className="text-xl font-bold tracking-tight leading-none text-slate-900 dark:text-white pointer-events-none">
                  {item.num}
                </span>
                {item.sub && (
                  <span className="text-[9px] font-semibold tracking-widest uppercase mt-0.5 leading-none text-slate-500 dark:text-slate-400 pointer-events-none">
                    {item.sub}
                  </span>
                )}
              </button>
            ))}

            {/* Row 4: Biometric/Vault indicator */}
            <div className="h-13 sm:h-14 flex items-center justify-center text-slate-400 dark:text-slate-500 rounded-2xl pointer-events-none">
              <Lock size={18} />
            </div>

            {/* Row 4: Digit 0 */}
            <button
              type="button"
              onClick={() => handleDigitClick("0")}
              className="h-13 sm:h-14 rounded-2xl bg-slate-100/90 hover:bg-slate-200 active:bg-emerald-500/15 border border-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:active:bg-emerald-500/20 dark:border-white/10 transition-all flex flex-col items-center justify-center cursor-pointer shadow-sm active:scale-95 select-none"
            >
              <span className="text-xl font-bold tracking-tight leading-none text-slate-900 dark:text-white pointer-events-none">
                0
              </span>
              <span className="text-[9px] font-semibold tracking-widest uppercase mt-0.5 leading-none text-slate-500 dark:text-slate-400 pointer-events-none">
                +
              </span>
            </button>

            {/* Row 4: Backspace Button */}
            <button
              type="button"
              onClick={handleDelete}
              className="h-13 sm:h-14 rounded-2xl bg-slate-100/90 hover:bg-rose-50 active:scale-95 border border-slate-200/80 text-slate-700 hover:text-rose-600 dark:bg-white/[0.06] dark:hover:bg-rose-500/20 dark:border-white/10 dark:text-slate-300 dark:hover:text-rose-400 transition-all flex items-center justify-center cursor-pointer shadow-sm select-none"
              title="Delete digit"
            >
              <Delete size={20} className="pointer-events-none" />
            </button>
          </div>

          {/* Secure Reset Row */}
          <div className="pt-2 w-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
            <span>Forgot PIN?</span>
            <button
              type="button"
              onClick={handleSignOutToReset}
              className="ml-1.5 text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <LogOut size={12} className="pointer-events-none" />
              <span>Sign out to reset</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
