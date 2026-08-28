"use client";

import React, { useState, useEffect } from "react";
import { Lock, KeyRound, CheckCircle2, ShieldCheck, X, Delete } from "lucide-react";

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem("valarchix_app_pin");
    const isUnlocked = sessionStorage.getItem("valarchix_session_unlocked");

    if (savedPin && isUnlocked !== "true") {
      setIsLocked(true);
    }
    setHasChecked(true);

    const handleLockEvent = () => {
      const pin = localStorage.getItem("valarchix_app_pin");
      if (pin) {
        sessionStorage.removeItem("valarchix_session_unlocked");
        setIsLocked(true);
        setPinInput("");
        setErrorMsg("");
      }
    };

    window.addEventListener("valarchix_lock_app", handleLockEvent);
    return () => window.removeEventListener("valarchix_lock_app", handleLockEvent);
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
          setTimeout(() => {
            setIsLocked(false);
            setPinInput("");
          }, 150);
        } else {
          setTimeout(() => {
            setErrorMsg("Incorrect PIN. Please try again.");
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

  if (!hasChecked) return <>{children}</>;

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-50 bg-navy-bg flex items-center justify-center p-4 select-none animate-fadeIn">
        <div className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
          
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald/15 border border-emerald/30 text-emerald flex items-center justify-center shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-xl font-black text-heading tracking-tight">ValarchiX Security Lock</h2>
            <p className="text-xs text-muted-grey">Enter your 4-digit security PIN to unlock</p>
          </div>

          {/* 4 PIN Dots */}
          <div className="flex items-center justify-center gap-4 py-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  pinInput.length > index
                    ? "bg-emerald border-emerald scale-110 shadow-sm shadow-emerald/50"
                    : "border-border-navy bg-navy-bg"
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="text-xs font-black text-rose-500 animate-bounce">
              {errorMsg}
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-14 rounded-2xl bg-navy-bg hover:bg-navy-light text-heading font-mono text-xl font-black border border-border-navy transition active:scale-95 cursor-pointer shadow-sm"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              className="h-14 rounded-2xl bg-navy-bg hover:bg-navy-light text-heading font-mono text-xl font-black border border-border-navy transition active:scale-95 cursor-pointer shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-navy-bg hover:bg-rose-500/10 text-muted-grey hover:text-rose-500 flex items-center justify-center border border-border-navy transition active:scale-95 cursor-pointer shadow-sm"
              title="Delete digit"
            >
              <Delete size={20} />
            </button>
          </div>

          <div className="text-[11px] text-muted-grey font-semibold">
            🔒 Protected by AES-256 Client-Side Passcode
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
