"use client";

import React, { useState, useEffect } from "react";
import { X, Smartphone, Zap, ShieldCheck, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Catch beforeinstallprompt as early as possible on window load
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export default function InstallPwaModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker immediately to satisfy browser PWA criteria
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("ServiceWorker registered:", reg.scope))
        .catch((err) => console.warn("ServiceWorker registration failed:", err));
    }

    // 2. Check if running inside standalone PWA window
    const checkInstalled = () => {
      if (typeof window === "undefined") return false;

      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: window-controls-overlay)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes("android-app://");

      if (isStandaloneMode) {
        setIsInstalled(true);
        return true;
      }

      // Check stored flag only if no beforeinstallprompt has arrived
      if (localStorage.getItem("valarchix_is_installed") === "true" && !globalDeferredPrompt) {
        setIsInstalled(true);
        return true;
      }

      return false;
    };

    // 2b. Real-time native OS installation check (Chrome / Edge / Android)
    if (typeof window !== "undefined" && "navigator" in window && "getInstalledRelatedApps" in navigator) {
      (navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
        if (relatedApps && relatedApps.length > 0) {
          setIsInstalled(true);
          localStorage.setItem("valarchix_is_installed", "true");
          window.dispatchEvent(new Event("valarchix_pwa_status_change"));
        } else if (!window.matchMedia("(display-mode: standalone)").matches) {
          // App is uninstalled! Clear stale localStorage flag
          localStorage.removeItem("valarchix_is_installed");
          setIsInstalled(false);
          window.dispatchEvent(new Event("valarchix_pwa_status_change"));
        }
      }).catch(() => {});
    }

    const installed = checkInstalled();

    let autoOpenTimer: NodeJS.Timeout | null = null;

    const isDismissedInSession = typeof window !== "undefined" && sessionStorage.getItem("valarchix_pwa_dismissed_session") === "true";

    if (!installed && !isDismissedInSession) {
      autoOpenTimer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
    }

    // 3. Listen for beforeinstallprompt & appinstalled events for real-time monitoring
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // beforeinstallprompt firing proves the app is NOT installed! Clear stale state
      localStorage.removeItem("valarchix_is_installed");
      setIsInstalled(false);
      window.dispatchEvent(new Event("valarchix_pwa_status_change"));
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      localStorage.setItem("valarchix_is_installed", "true");
      window.dispatchEvent(new Event("valarchix_pwa_status_change"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    // 4. Global trigger function for manual header button click
    (window as any).triggerPwaInstall = async () => {
      const promptEvent = deferredPrompt || globalDeferredPrompt;
      if (promptEvent) {
        try {
          await promptEvent.prompt();
          const choiceResult = await promptEvent.userChoice;
          if (choiceResult.outcome === "accepted") {
            setIsInstalled(true);
            localStorage.setItem("valarchix_is_installed", "true");
            window.dispatchEvent(new Event("valarchix_pwa_status_change"));
            setIsOpen(false);
          }
          setDeferredPrompt(null);
          globalDeferredPrompt = null;
          return;
        } catch (err) {
          console.error("PWA install trigger error:", err);
        }
      }

      // If no native prompt is pending, check if already installed or instruct user
      if (isInstalled || localStorage.getItem("valarchix_is_installed") === "true") {
        alert("✅ ValarchiX is already installed on your device!\n\nYou can launch it directly from your Desktop App shortcut, Chrome App Launcher, or Mobile Home Screen.");
        setIsInstalled(true);
        localStorage.setItem("valarchix_is_installed", "true");
        window.dispatchEvent(new Event("valarchix_pwa_status_change"));
        setIsOpen(false);
        return;
      }

      setIsOpen(true);
    };

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (autoOpenTimer) clearTimeout(autoOpenTimer);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
          localStorage.setItem("valarchix_is_installed", "true");
          window.dispatchEvent(new Event("valarchix_pwa_status_change"));
          setIsOpen(false);
        }
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
      } catch (err) {
        console.error("PWA install error:", err);
      }
    } else {
      if (isInstalled || localStorage.getItem("valarchix_is_installed") === "true") {
        alert("✅ ValarchiX is already installed on your device!\n\nLaunch it from your Desktop shortcuts or App menu.");
        setIsInstalled(true);
        localStorage.setItem("valarchix_is_installed", "true");
        window.dispatchEvent(new Event("valarchix_pwa_status_change"));
        setIsOpen(false);
      } else {
        alert(
          "To install ValarchiX:\n\n" +
          "• Desktop Chrome/Edge: Click the 'Install' icon [⬇] in your browser address bar.\n" +
          "• Mobile Chrome/Brave: Tap the ⋮ menu -> 'Add to Home Screen'.\n" +
          "• iOS Safari: Tap Share -> 'Add to Home Screen'."
        );
        // Save installation hint
        localStorage.setItem("valarchix_is_installed", "true");
        setIsInstalled(true);
        window.dispatchEvent(new Event("valarchix_pwa_status_change"));
        setIsOpen(false);
      }
    }
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("valarchix_pwa_dismissed_session", "true");
    }
    setIsOpen(false);
  };

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
            className="w-14 h-14 rounded-2xl shadow-md object-contain shrink-0"
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
