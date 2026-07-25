"use client";

import React, { useState, useEffect } from "react";
import { X, Smartphone, Zap, ShieldCheck, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPwaModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed PWA mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone ||
      document.referrer.includes("android-app://")
    ) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Check if user dismissed prompt in current browser session
    const dismissedInSession = sessionStorage.getItem("valarchix_pwa_dismissed");
    if (dismissedInSession) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    });

    // Automatically trigger the popup modal within 1.5 seconds of user visit
    const autoOpenTimer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(autoOpenTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setIsOpen(false);
    } else {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("valarchix_pwa_dismissed", "true");
    localStorage.removeItem("valarchix_pwa_dismissed"); // Clear old 7-day lock
    setIsOpen(false);
  };

  useEffect(() => {
    (window as any).triggerPwaInstall = () => setIsOpen(true);
  }, []);

  if (!isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-navy-card border border-border-navy rounded-2xl p-6 shadow-2xl space-y-6 text-light-grey">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-grey hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-4">
          <img
            src="/logo.svg"
            alt="ValarchiX Logo"
            className="w-14 h-14 rounded-2xl shadow-md border border-emerald/30 object-contain shrink-0"
          />
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Install ValarchiX</h3>
            <p className="text-xs text-muted-grey">Add to your home screen or desktop</p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3 bg-navy-light/40 p-4 rounded-xl border border-border-navy/80">
          <div className="flex items-center gap-3 text-xs text-light-grey">
            <Smartphone size={16} className="text-emerald shrink-0" />
            <span>Opens instantly — no browser, no tabs</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-light-grey">
            <Zap size={16} className="text-emerald shrink-0" />
            <span>100% Client-Side — Fast offline access & caching</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-light-grey">
            <ShieldCheck size={16} className="text-emerald shrink-0" />
            <span>Privacy First — Zero tracking, all data stays local</span>
          </div>
        </div>

        {showIosGuide && (
          <div className="p-3.5 bg-emerald/10 border border-emerald/30 rounded-xl text-xs text-emerald space-y-1.5 animate-fadeIn">
            <p className="font-bold text-white">How to Install ValarchiX:</p>
            <p><strong>Mobile (Safari / Chrome):</strong> Tap menu / share button → Select &quot;Add to Home Screen&quot; or &quot;Install App&quot;.</p>
            <p><strong>Desktop (Chrome / Edge):</strong> Click the install icon <Download size={12} className="inline mx-1" /> in your address bar or browser menu.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleInstallClick}
            className="w-full py-3 px-4 bg-emerald text-[#030a16] font-black rounded-xl hover:bg-emerald/90 text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald/20 cursor-pointer"
          >
            <Download size={16} />
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 text-xs font-semibold text-muted-grey hover:text-white transition-colors cursor-pointer text-center"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
