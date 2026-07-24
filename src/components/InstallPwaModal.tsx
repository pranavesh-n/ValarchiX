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
    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Check if user dismissed prompt recently
    const dismissedAt = localStorage.getItem("valarchix_pwa_dismissed");
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    if (dismissedAt && now - parseInt(dismissedAt, 10) < SEVEN_DAYS) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => {
        setIsOpen(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    });

    if (iosDevice && (!dismissedAt || now - parseInt(dismissedAt, 10) >= SEVEN_DAYS)) {
      setTimeout(() => {
        setIsOpen(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      alert("To install ValarchiX, click the Install icon in your browser address bar.");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("valarchix_pwa_dismissed", Date.now().toString());
    setIsOpen(false);
  };

  useEffect(() => {
    (window as any).triggerPwaInstall = () => setIsOpen(true);
  }, []);

  if (!isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0a182e] border border-border-navy rounded-2xl p-6 shadow-2xl space-y-6 text-light-grey">
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
          <div className="w-14 h-14 rounded-2xl bg-emerald/10 border border-emerald/30 flex items-center justify-center shrink-0">
            <span className="text-2xl font-black text-emerald tracking-tighter">VX</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Install ValarchiX</h3>
            <p className="text-xs text-muted-grey">Add to your home screen or desktop</p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3 bg-navy-bg/70 p-4 rounded-xl border border-border-navy/80">
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
          <div className="p-3 bg-emerald/10 border border-emerald/30 rounded-xl text-xs text-emerald space-y-1">
            <p className="font-bold">On iOS (Safari):</p>
            <p>1. Tap the Share button at the bottom of your screen.</p>
            <p>2. Scroll down and tap &quot;Add to Home Screen&quot;.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleInstallClick}
            className="w-full py-3 px-4 bg-emerald text-navy-bg font-extrabold rounded-xl hover:bg-emerald/90 text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald/20 cursor-pointer"
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
