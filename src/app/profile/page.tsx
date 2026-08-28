"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Key,
  Trash2,
  Smartphone,
  Sparkles,
  Info,
  LogOut,
  LogIn,
  CheckCircle2,
  HeartPulse,
  Target,
  ChevronRight,
  X,
  FileText,
  ShieldCheck,
  Delete
} from "lucide-react";
import {
  getCurrentUserSession,
  signInWithGoogle,
  signOutUser,
  loadDigitalTwinFromVault
} from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [dnaScore, setDnaScore] = useState<number | null>(null);
  const [goalsCount, setGoalsCount] = useState<number>(0);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [passcodeEnabled, setPasscodeEnabled] = useState(false);
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [whatsNewModalOpen, setWhatsNewModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [loginPromptModalOpen, setLoginPromptModalOpen] = useState(false);
  const [loginPromptFeature, setLoginPromptFeature] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const s = await getCurrentUserSession();
      setSession(s);

      // Load saved DNA & Goals in real time
      try {
        const twin = await loadDigitalTwinFromVault();
        if (twin) {
          if (twin.dnaScore?.overallScore) {
            setDnaScore(twin.dnaScore.overallScore);
          }
          if (twin.goals?.length) {
            setGoalsCount(twin.goals.length);
          }
        } else {
          const localTwinRaw = localStorage.getItem("VALARCHIX_DIGITAL_TWIN");
          if (localTwinRaw) {
            const parsed = JSON.parse(localTwinRaw);
            if (parsed.dnaScore?.overallScore || parsed.score?.overallScore) {
              setDnaScore(parsed.dnaScore?.overallScore || parsed.score?.overallScore);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load DNA record:", err);
      }

      // Check Passcode State
      const savedPin = localStorage.getItem("valarchix_app_pin");
      setPasscodeEnabled(!!savedPin);

      // Check PWA Installation
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true ||
        localStorage.getItem("valarchix_is_installed") === "true";
      setIsPwaInstalled(isStandalone);
    }
    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const requireAuthForAction = (featureName: string, actionCallback: () => void) => {
    if (!session?.user) {
      setLoginPromptFeature(featureName);
      setLoginPromptModalOpen(true);
    } else {
      actionCallback();
    }
  };

  const handleTogglePasscode = () => {
    requireAuthForAction("App Passcode Lock", () => {
      if (passcodeEnabled) {
        localStorage.removeItem("valarchix_app_pin");
        sessionStorage.removeItem("valarchix_session_unlocked");
        setPasscodeEnabled(false);
        showToast("App Passcode Lock disabled");
      } else {
        setPasscodeModalOpen(true);
      }
    });
  };

  const handleSavePin = () => {
    if (currentPin.length === 4) {
      localStorage.setItem("valarchix_app_pin", currentPin);
      sessionStorage.setItem("valarchix_session_unlocked", "true");
      setPasscodeEnabled(true);
      setPasscodeModalOpen(false);
      setCurrentPin("");
      showToast("4-digit Passcode enabled successfully ✅");
    } else {
      alert("Please enter a 4-digit PIN");
    }
  };

  const handleClearCache = () => {
    if (confirm("Reset local temporary session state? (Your saved financial records remain safe)")) {
      sessionStorage.clear();
      showToast("Temporary session cache reset successfully ✅");
    }
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out of ValarchiX?")) {
      await signOutUser();
      setSession(null);
      router.push("/");
    }
  };

  const userName = session?.user
    ? (session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "ValarchiX Investor")
    : "Guest Investor";
  const userEmail = session?.user
    ? session.user.email
    : "Not signed in · Connect Google to sync";
  const userAvatar = session?.user?.user_metadata?.avatar_url;
  const userInitial = userName.charAt(0).toUpperCase() || "V";

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-16 pt-2">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-border-navy px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-slideDown">
          <CheckCircle2 size={19} className="text-emerald shrink-0" />
          <span className="text-xs sm:text-sm font-black !text-slate-900 dark:!text-white">{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          PROFILE HEADER CARD (Sikkanam Clean Style)
          ========================================================================= */}
      <section className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5">
        <div className="flex flex-col items-center justify-center space-y-3">
          
          {/* Avatar with Verified Status */}
          <div className="relative">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-emerald shadow-sm"
              />
            ) : session?.user ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald text-slate-950 flex items-center justify-center font-black text-2xl shadow-sm border-2 border-emerald">
                {userInitial}
              </div>
            ) : (
              <img
                src="/logo.svg"
                alt="ValarchiX"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-2 bg-[#030a16] border-2 border-emerald shadow-lg shadow-emerald/20 object-contain"
              />
            )}
            {session?.user && (
              <div className="absolute -bottom-1 -right-1 bg-emerald text-slate-950 rounded-full p-1 border-2 border-navy-card shadow-sm" title="Verified Member">
                <CheckCircle2 size={15} strokeWidth={3} />
              </div>
            )}
          </div>

          {/* User Full Name & Email */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-heading tracking-tight">
              {userName}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-muted-grey font-mono">{userEmail}</span>
              {session?.user && (
                <span className="bg-emerald/15 text-emerald border border-emerald/30 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider">
                  Verified Investor
                </span>
              )}
            </div>
          </div>

          {!session?.user && (
            <div className="pt-1">
              <button
                onClick={signInWithGoogle}
                className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 dark:border-white/15 text-xs sm:text-sm font-black px-6 py-2.5 rounded-full transition shadow-md flex items-center gap-2.5 mx-auto cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign In with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* 2 Quick Summary Tiles (Sikkanam Style) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Link
            href="/financial-dna"
            className="card-tile-neutral p-4 rounded-2xl border text-left hover:border-emerald/40 transition group cursor-pointer flex items-center gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-emerald/10 text-emerald shrink-0">
              <HeartPulse size={20} />
            </div>
            <div>
              <div className="text-sm font-black text-heading">
                {dnaScore ? `${dnaScore} / 100 Score` : "DNA Score"}
              </div>
              <div className="text-xs text-muted-grey">
                {dnaScore ? "Financial DNA Health" : "Start Assessment"}
              </div>
            </div>
          </Link>

          <Link
            href="/goalx"
            className="card-tile-neutral p-4 rounded-2xl border text-left hover:border-indigo-400/40 transition group cursor-pointer flex items-center gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Target size={20} />
            </div>
            <div>
              <div className="text-sm font-black text-heading">
                {goalsCount ? `${goalsCount} Goals Active` : "GoalX Roadmaps"}
              </div>
              <div className="text-xs text-muted-grey">
                {goalsCount ? "Active Targets" : "Plan Your Goals"}
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: SECURITY & PRIVACY
          ========================================================================= */}
      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-grey px-1">
          Security &amp; Privacy
        </h2>
        <div className="bg-navy-card border border-border-navy rounded-3xl divide-y divide-border-navy/60 overflow-hidden shadow-sm">
          
          {/* App Passcode Lock */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-navy-light/40 transition">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-heading">App Passcode Lock</div>
                <div className="text-xs text-muted-grey">
                  {passcodeEnabled ? "4-digit PIN lock enabled (Tap to disable)" : "Require 4-digit PIN to open ValarchiX"}
                </div>
              </div>
            </div>
            <button
              onClick={handleTogglePasscode}
              className={`px-3.5 py-1 rounded-full text-xs font-black transition cursor-pointer border ${
                passcodeEnabled
                  ? "bg-emerald/15 text-emerald border-emerald/30"
                  : "bg-navy-bg text-muted-grey border-border-navy hover:text-heading"
              }`}
            >
              {passcodeEnabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* Change Passcode */}
          {passcodeEnabled && (
            <button
              onClick={() => setPasscodeModalOpen(true)}
              className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-navy-light/40 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0">
                  <Key size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-heading">Change Passcode</div>
                  <div className="text-xs text-muted-grey">Update your 4-digit PIN code</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-grey" />
            </button>
          )}

          {/* Clear Temporary Cache */}
          <button
            onClick={handleClearCache}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-navy-light/40 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-heading">Clear Temporary Cache</div>
                <div className="text-xs text-muted-grey">Reset local session state &amp; refresh financial cache</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-grey" />
          </button>

        </div>
      </section>

      {/* =========================================================================
          SECTION 2: APP EXPERIENCE
          ========================================================================= */}
      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-grey px-1">
          App Experience
        </h2>
        <div className="bg-navy-card border border-border-navy rounded-3xl divide-y divide-border-navy/60 overflow-hidden shadow-sm">
          
          {/* ValarchiX App PWA */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-navy-light/40 transition">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-emerald/10 text-emerald shrink-0">
                <Smartphone size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-heading">ValarchiX App</div>
                <div className="text-xs text-muted-grey">
                  {isPwaInstalled ? "App is installed & ready on your device" : "Install app on your home screen"}
                </div>
              </div>
            </div>
            {isPwaInstalled ? (
              <span className="bg-emerald/15 text-emerald border border-emerald/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>INSTALLED</span>
              </span>
            ) : (
              <button
                onClick={() => {
                  window.dispatchEvent(new Event("valarchix_install_prompt"));
                  showToast("Opening install prompt...");
                }}
                className="bg-indigo-600 hover:bg-indigo-500 !text-white px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer shadow-sm"
              >
                Install App
              </button>
            )}
          </div>

          {/* What's New in ValarchiX */}
          <button
            onClick={() => setWhatsNewModalOpen(true)}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-navy-light/40 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-heading">What&apos;s New in ValarchiX</div>
                <div className="text-xs text-muted-grey">Feature release notes &amp; suite updates</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-grey" />
          </button>

        </div>
      </section>

      {/* =========================================================================
          SECTION 3: SUPPORT & COMMUNITY
          ========================================================================= */}
      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-grey px-1">
          Support &amp; Community
        </h2>
        <div className="bg-navy-card border border-border-navy rounded-3xl divide-y divide-border-navy/60 overflow-hidden shadow-sm">
          
          {/* About ValarchiX */}
          <button
            onClick={() => setAboutModalOpen(true)}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-navy-light/40 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <Info size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-heading">About ValarchiX</div>
                <div className="text-xs text-muted-grey">Origin, mission &amp; first-principles financial companion</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-grey" />
          </button>

          {/* Disclaimer & Policy */}
          <Link
            href="/disclaimer"
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-navy-light/40 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-slate-500/10 text-slate-400 shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-heading">Financial Disclaimer</div>
                <div className="text-xs text-muted-grey">Educational tool principles &amp; zero financial advisory liability</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-grey" />
          </Link>

        </div>
      </section>

      {/* =========================================================================
          SIGN OUT BUTTON (Clean Style)
          ========================================================================= */}
      {session?.user && (
        <button
          onClick={handleSignOut}
          className="w-full p-4 sm:p-5 rounded-3xl bg-emerald hover:bg-emerald/90 text-slate-950 font-black text-sm flex items-center justify-between transition shadow-md shadow-emerald/20 cursor-pointer border border-emerald"
        >
          <div className="flex items-center gap-2.5">
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
          <ChevronRight size={16} />
        </button>
      )}

      {/* Footer Version Tag */}
      <div className="text-center text-xs text-muted-grey font-mono pt-2">
        வளர்ச்சி · ValarchiX v2.6.0
      </div>

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* Guest Feature Unlock Modal */}
      {loginPromptModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-slideDown">
            <div className="flex items-center justify-between border-b border-border-navy pb-3">
              <div className="flex items-center gap-2 text-emerald">
                <ShieldCheck size={22} />
                <h3 className="font-black text-base text-heading">Sign In to ValarchiX</h3>
              </div>
              <button onClick={() => setLoginPromptModalOpen(false)} className="text-muted-grey hover:text-heading cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-heading font-black">
                {loginPromptFeature} is an exclusive feature for verified ValarchiX members.
              </p>
              <p className="text-xs text-muted-grey">
                Link your Google account to unlock all features:
              </p>
              
              <div className="space-y-2 text-xs text-muted-grey">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald shrink-0" />
                  <span>🛡️ <strong>App Security Lock</strong> (4-digit biometric / passcode)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald shrink-0" />
                  <span>📊 <strong>Financial DNA Cloud Records</strong> (History &amp; trends)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald shrink-0" />
                  <span>📥 <strong>Full Factsheet &amp; PDF Downloads</strong> across all tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald shrink-0" />
                  <span>🎯 <strong>Cross-Device Sync</strong> (Mobile, Desktop &amp; Tablets)</span>
                </div>
              </div>
            </div>

            <button
              onClick={signInWithGoogle}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 dark:border-white/15 font-black py-3.5 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2.5 shadow-lg cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      )}

      {/* Passcode Set Modal (Sikkanam Keypad Style) */}
      {passcodeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c121e] border border-white/10 text-white rounded-3xl p-6 sm:p-7 max-w-xs w-full space-y-4 shadow-2xl animate-slideDown text-center">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <Lock size={16} className="text-emerald" />
                <span>{passcodeEnabled ? "Change Passcode PIN" : "Set 4-Digit Passcode"}</span>
              </h3>
              <button
                onClick={() => {
                  setPasscodeModalOpen(false);
                  setCurrentPin("");
                }}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Enter 4 digits to secure ValarchiX
            </p>

            {/* 4 Circular PIN Dots */}
            <div className="flex items-center justify-center gap-3.5 py-1">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border ${
                    currentPin.length > index
                      ? "bg-white border-white scale-110"
                      : "border-neutral-600 bg-transparent"
                  }`}
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (currentPin.length < 4) {
                      setCurrentPin((prev) => prev + num);
                    }
                  }}
                  className="h-14 rounded-2xl bg-[#172033] hover:bg-[#202c45] active:scale-95 text-white font-black text-lg flex items-center justify-center border border-white/5 transition cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <div className="h-14 flex items-center justify-center text-neutral-600">
                <Lock size={18} />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (currentPin.length < 4) {
                    setCurrentPin((prev) => prev + "0");
                  }
                }}
                className="h-14 rounded-2xl bg-[#172033] hover:bg-[#202c45] active:scale-95 text-white font-black text-lg flex items-center justify-center border border-white/5 transition cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setCurrentPin((prev) => prev.slice(0, -1))}
                className="h-14 rounded-2xl bg-[#172033] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 active:scale-95 flex items-center justify-center border border-white/5 transition cursor-pointer"
                title="Delete digit"
              >
                <Delete size={20} />
              </button>
            </div>

            <button
              onClick={handleSavePin}
              disabled={currentPin.length !== 4}
              className={`w-full py-3 rounded-2xl text-xs font-black transition cursor-pointer ${
                currentPin.length === 4
                  ? "bg-emerald hover:bg-emerald/90 text-slate-950 shadow-md shadow-emerald/20"
                  : "bg-white/10 text-neutral-500 cursor-not-allowed"
              }`}
            >
              Save 4-Digit Passcode
            </button>
          </div>
        </div>
      )}

      {/* What's New Modal */}
      {whatsNewModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-card border border-border-navy rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-slideDown max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-navy pb-3">
              <h3 className="font-black text-base text-heading flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <span>What&apos;s New in ValarchiX v2.6.0</span>
              </h3>
              <button onClick={() => setWhatsNewModalOpen(false)} className="text-muted-grey hover:text-heading cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs text-muted-grey">
              <div className="p-3 rounded-2xl bg-navy-bg border border-border-navy space-y-1">
                <span className="font-black text-emerald block">4-Pillar Segregated Calculators Directory</span>
                <p>Strict segregation across Wealth &amp; Compounding, Budgeting &amp; Cash Flow, Retirement &amp; Sovereign Schemes, and Tax, Debt &amp; Analyzers.</p>
              </div>
              <div className="p-3 rounded-2xl bg-navy-bg border border-border-navy space-y-1">
                <span className="font-black text-indigo-400 block">Sikkanam-Style Profile &amp; Security OS</span>
                <p>Real 4-digit App passcode locking, Financial DNA health record tracking, and 1-click Google OAuth profile cards.</p>
              </div>
              <div className="p-3 rounded-2xl bg-navy-bg border border-border-navy space-y-1">
                <span className="font-black text-teal-400 block">Beyond Fixed Deposits Masterclass in Engines</span>
                <p>Masterclass explaining inflation decay, equity volatility, and compounding law added to the intelligence ecosystem.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About ValarchiX Modal */}
      {aboutModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-card border border-border-navy rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-slideDown max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-navy pb-3">
              <h3 className="font-black text-base text-heading flex items-center gap-2">
                <Info size={18} className="text-emerald" />
                <span>About ValarchiX</span>
              </h3>
              <button onClick={() => setAboutModalOpen(false)} className="text-muted-grey hover:text-heading cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs text-muted-grey leading-relaxed">
              <p>
                <strong className="text-heading">«We don&apos;t tell what to pick, we tell how to pick»</strong> &mdash; ValarchiX is an institutional-grade, zero-commission financial knowledge operating system built for India.
              </p>
              <p>
                Unlike traditional fintech platforms that push high-commission regular mutual funds or sponsored loans, ValarchiX provides 100% mathematical, deterministic clarity with zero broker bias.
              </p>
              <div className="pt-2 text-center">
                <Link
                  href="/about"
                  onClick={() => setAboutModalOpen(false)}
                  className="text-xs font-black text-indigo-400 hover:underline"
                >
                  View Full About &amp; Architecture Page ➔
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
