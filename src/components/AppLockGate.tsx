"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Lock, Delete, LogOut } from "lucide-react";
import { signOutUser, getCurrentUserSession } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  hashPin,
  getUserPasscodeKey,
  getUserLockEnabledKey,
  getUserSessionUnlockedKey
} from "@/lib/passcode";

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const [shake, setShake] = useState(false);
  const hiddenStartTimeRef = useRef<number | null>(null);
  const isVerifyingRef = useRef(false);

  // Check and sync user lock state
  const checkUserLockState = useCallback((currentUserSession: any) => {
    if (!currentUserSession?.user) {
      setIsLocked(false);
      setPinInput("");
      setFailedAttempts(0);
      setHasChecked(true);
      return;
    }

    const userId = currentUserSession.user.id;
    const pinKey = getUserPasscodeKey(userId);
    const unlockKey = getUserSessionUnlockedKey(userId);

    const savedPinHash = localStorage.getItem(pinKey) || localStorage.getItem("valarchix_app_pin");
    const isUnlockedInSession = sessionStorage.getItem(unlockKey);

    if (savedPinHash && isUnlockedInSession !== "true") {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
    setHasChecked(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function initAuth() {
      const s = await getCurrentUserSession();
      setSession(s);
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
        checkUserLockState(newSession);
      }
    });

    // 25-Second Background Inactivity Listener (Only active when user is logged in & lock is enabled)
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
            setIsLocked(true);
            setPinInput("");
            setErrorMsg("");
            setFailedAttempts(0);
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
      if (!currentS?.user) {
        setIsLocked(false);
        isVerifyingRef.current = false;
        return;
      }

      const userId = currentS.user.id;
      const pinKey = getUserPasscodeKey(userId);
      const unlockKey = getUserSessionUnlockedKey(userId);

      const savedPinHash = localStorage.getItem(pinKey) || localStorage.getItem("valarchix_app_pin");
      const hashedInput = await hashPin(enteredPin);

      // Check against SHA-256 hash or legacy plaintext
      if (savedPinHash && (hashedInput === savedPinHash || enteredPin === savedPinHash)) {
        sessionStorage.setItem(unlockKey, "true");
        setFailedAttempts(0);
        setErrorMsg("");
        setTimeout(() => {
          setIsLocked(false);
          setPinInput("");
          isVerifyingRef.current = false;
        }, 120);
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
          }, 200);
          return nextAttempts;
        });
      }
    },
    [session]
  );

  const handleKeyPress = useCallback(
    (num: string) => {
      if (isVerifyingRef.current) return;
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
    [processPinEntry]
  );

  const handleDelete = useCallback(() => {
    if (isVerifyingRef.current) return;
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg("");
  }, []);

  // Physical Keyboard listener for numbers / backspace when locked
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
    if (session?.user?.id) {
      const userId = session.user.id;
      localStorage.removeItem(getUserPasscodeKey(userId));
      localStorage.removeItem(getUserLockEnabledKey(userId));
      sessionStorage.removeItem(getUserSessionUnlockedKey(userId));
    }
    localStorage.removeItem("valarchix_app_pin");
    sessionStorage.removeItem("valarchix_session_unlocked");
    sessionStorage.removeItem("valarchix_login_toast_shown");

    setIsLocked(false);
    setPinInput("");
    setFailedAttempts(0);
    setErrorMsg("");
    await signOutUser();
    setSession(null);
    router.push("/");
  };

  if (!hasChecked) return <>{children}</>;

  if (isLocked && session?.user) {
    const displayName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Investor";

    return (
      <div className="fixed inset-0 z-[9999] bg-[#0c121e] text-white flex flex-col items-center justify-center p-4 select-none animate-fadeIn">
        <div className="flex flex-col items-center justify-center max-w-sm w-full space-y-4 text-center">
          
          {/* Original ValarchiX Official Logo */}
          <div className="relative">
            <img
              src="/logo.svg"
              alt="ValarchiX"
              className="w-16 h-16 rounded-2xl shadow-xl shadow-emerald/30 border border-emerald/50 object-contain bg-[#030a16]"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald border-2 border-[#0c121e]"></span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-1 pt-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome Back, {displayName} 👋
            </h1>
            <p className="text-xs text-neutral-400 font-medium">
              Enter your 4-digit PIN to unlock ValarchiX
            </p>
          </div>

          {/* 4 Circular PIN Dots */}
          <div className={`flex items-center justify-center gap-3.5 py-3 ${shake ? "animate-shake" : ""}`}>
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border ${
                  pinInput.length > index
                    ? "bg-white border-white scale-110 shadow-sm"
                    : "border-neutral-600 bg-transparent"
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="text-xs font-bold text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Keypad Grid (Sikkanam Layout) */}
          <div className="grid grid-cols-3 gap-3 pt-2 w-full max-w-[280px]">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-16 rounded-2xl bg-[#172033] hover:bg-[#202c45] active:scale-90 text-white font-black text-xl flex items-center justify-center border border-white/5 transition cursor-pointer shadow-sm touch-manipulation select-none"
              >
                {num}
              </button>
            ))}
            
            {/* Row 4: Lock Icon */}
            <div className="h-16 flex items-center justify-center text-neutral-600">
              <Lock size={20} />
            </div>

            {/* Row 4: Digit 0 */}
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              className="h-16 rounded-2xl bg-[#172033] hover:bg-[#202c45] active:scale-90 text-white font-black text-xl flex items-center justify-center border border-white/5 transition cursor-pointer shadow-sm touch-manipulation select-none"
            >
              0
            </button>

            {/* Row 4: Backspace Button */}
            <button
              type="button"
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-[#172033] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 active:scale-90 flex items-center justify-center border border-white/5 transition cursor-pointer shadow-sm touch-manipulation select-none"
              title="Delete digit"
            >
              <Delete size={22} />
            </button>
          </div>

          {/* Bottom Prompt / 2 Wrong Attempts Logout */}
          <div className="pt-4 min-h-[48px] flex items-center justify-center">
            {failedAttempts >= 2 ? (
              <button
                type="button"
                onClick={handleResetAndSignOut}
                className="text-xs font-black text-rose-400 hover:text-rose-300 underline underline-offset-4 flex items-center gap-1.5 cursor-pointer animate-fadeIn bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20"
              >
                <LogOut size={14} />
                <span>Forgot PIN? Click to Log Out &amp; Reset Lock</span>
              </button>
            ) : (
              <p className="text-[11px] text-neutral-500">
                Forgot PIN? Enter incorrectly 2 times to reset
              </p>
            )}
          </div>

        </div>
      </div>
    );
  }

  return <>{children}</>;
}

