"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, Delete, LogOut } from "lucide-react";
import { signOutUser } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const [shake, setShake] = useState(false);
  const hiddenStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if passcode is enabled
    const savedPin = localStorage.getItem("valarchix_app_pin");
    const isUnlockedInSession = sessionStorage.getItem("valarchix_session_unlocked");

    // On page load/refresh, require PIN if passcode is enabled
    if (savedPin) {
      if (isUnlockedInSession !== "true") {
        setIsLocked(true);
      }
    }
    setHasChecked(true);

    // Event listener for manual lock trigger (e.g. Lock Now button in profile)
    const handleLockEvent = () => {
      const pin = localStorage.getItem("valarchix_app_pin");
      if (pin) {
        sessionStorage.removeItem("valarchix_session_unlocked");
        setIsLocked(true);
        setPinInput("");
        setErrorMsg("");
        setFailedAttempts(0);
      }
    };

    // 25-Second Background Inactivity Listener (ONLY triggers when tab is genuinely hidden/switched away for >25s)
    const handleVisibilityChange = () => {
      const pin = localStorage.getItem("valarchix_app_pin");
      if (!pin) return;

      if (document.hidden) {
        // Tab was hidden / placed in background
        hiddenStartTimeRef.current = Date.now();
      } else {
        // User came back to the tab
        if (hiddenStartTimeRef.current) {
          const timeInBackground = Date.now() - hiddenStartTimeRef.current;
          if (timeInBackground >= 25000) {
            sessionStorage.removeItem("valarchix_session_unlocked");
            setIsLocked(true);
            setPinInput("");
            setErrorMsg("");
            setFailedAttempts(0);
          }
        }
        hiddenStartTimeRef.current = null;
      }
    };

    window.addEventListener("valarchix_lock_app", handleLockEvent);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("valarchix_lock_app", handleLockEvent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      setErrorMsg("");

      if (nextPin.length === 4) {
        const savedPin = localStorage.getItem("valarchix_app_pin");
        if (nextPin === savedPin) {
          sessionStorage.setItem("valarchix_session_unlocked", "true");
          setFailedAttempts(0);
          setTimeout(() => {
            setIsLocked(false);
            setPinInput("");
          }, 120);
        } else {
          const nextAttempts = failedAttempts + 1;
          setFailedAttempts(nextAttempts);
          setShake(true);
          setTimeout(() => setShake(false), 500);

          setTimeout(() => {
            if (nextAttempts >= 2) {
              setErrorMsg("Incorrect PIN entered 2 times.");
            } else {
              setErrorMsg("Incorrect PIN. Please try again.");
            }
            setPinInput("");
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleResetAndSignOut = async () => {
    localStorage.removeItem("valarchix_app_pin");
    sessionStorage.removeItem("valarchix_session_unlocked");
    setIsLocked(false);
    setPinInput("");
    setFailedAttempts(0);
    setErrorMsg("");
    await signOutUser();
    router.push("/");
    window.location.href = "/";
  };

  if (!hasChecked) return <>{children}</>;

  if (isLocked) {
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
              Welcome Back, Investor 👋
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
                className="h-16 rounded-2xl bg-[#172033] hover:bg-[#202c45] active:scale-95 text-white font-black text-xl flex items-center justify-center border border-white/5 transition cursor-pointer shadow-sm"
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
              className="h-16 rounded-2xl bg-[#172033] hover:bg-[#202c45] active:scale-95 text-white font-black text-xl flex items-center justify-center border border-white/5 transition cursor-pointer shadow-sm"
            >
              0
            </button>

            {/* Row 4: Backspace Button */}
            <button
              type="button"
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-[#172033] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 active:scale-95 flex items-center justify-center border border-white/5 transition cursor-pointer shadow-sm"
              title="Delete digit"
            >
              <Delete size={22} />
            </button>
          </div>

          {/* Bottom Prompt / Forgot PIN Reset Trigger */}
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
