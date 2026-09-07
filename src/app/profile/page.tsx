"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Delete,
  AlertTriangle,
  Search,
  Zap,
  History,
  Award,
  TrendingUp,
  Layers,
  Calendar
} from "lucide-react";
import {
  getCurrentUserSession,
  signInWithGoogle,
  signOutUser,
  loadDigitalTwinFromVault
} from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import {
  hashPin,
  getUserPasscodeKey,
  getUserLockEnabledKey,
  getUserSessionUnlockedKey,
  getPrimaryFirstName,
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

interface ReleaseMilestone {
  version: string;
  shortVersion: string;
  title: string;
  date: string;
  tag: string;
  tagColor: string;
  isLatest?: boolean;
  summary: string;
  featureGroups: {
    category: string;
    items: string[];
  }[];
}

const VALARCHIX_RELEASES: ReleaseMilestone[] = [
  {
    version: "v2.6.1",
    shortVersion: "v2.6.1",
    title: "SIP vs FD Tool, 48 AMC Factsheets, 7% Baseline Inflation & UI Improvements",
    date: "September 2026",
    tag: "Current Release",
    tagColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    isLatest: true,
    summary: "Featured release delivering the new SIP vs FD Head-to-Head Comparative Simulator, an expanded 48-AMC Official Factsheets vault, a calibrated 7.0% Indian household baseline inflation default across all engines, and platform-wide UI improvements.",
    featureGroups: [
      {
        category: "SIP vs FD Comparative Tool",
        items: [
          "Head-to-head comparative simulator (/sip-vs-fd) modeling monthly SIP equity compounding against fixed deposit compounding over 1–30 year horizons.",
          "Real-time integration with active RBI repo rates (6.50%) and 10Y sovereign benchmark yields (6.95%) via /api/rates.",
          "Tax-bracket drag analysis simulating post-tax returns under 0%, 5%, 10%, 15%, 20%, 25%, and 30% tax brackets vs equity LTCG (12.5%).",
          "Senior citizen FD bonus toggle (+0.50%), dual nominal vs real wealth charts, and mathematical transparency breakdown."
        ]
      },
      {
        category: "Additional AMC Factsheets Vault",
        items: [
          "Integrated official monthly factsheet and portfolio disclosure portals across 48 AMCs in India (SBI, HDFC, ICICI, Nippon, Kotak, PPFAS, Quant, Mirae, Motilal, DSP, Bandhan, Tata, and more).",
          "One-click direct links to fund houses' statutory disclosure pages and official scheme PDFs in /mutual-funds.",
          "5-Pillar fund evaluation framework: Rolling Returns, Alpha Consistency, Downside Protection (Sortino), Portfolio Concentration, and Direct vs Regular TER drag."
        ]
      },
      {
        category: "Prudent 7.0% Baseline Inflation Default",
        items: [
          "Calibrated universal baseline inflation to 7.00% across all 50+ calculators and diagnostic engines, reflecting real Indian household and lifestyle cost escalation.",
          "Centralized dynamic synchronization with /api/rates with full manual user override support and quick preset buttons (5% CPI, 7% Realistic, 10% Lifestyle/Education).",
          "Interactive inflation-adjusted purchasing power toggles on SIP, Step-Up SIP, SWP, Retirement, and Sovereign scheme calculators."
        ]
      },
      {
        category: "Universal UI Improvements & Theme System",
        items: [
          "Complete WCAG AA contrast compliance: rich, deep text in light mode (Slate-900 / Slate-800) and radiant text in dark mode with zero pale or washed-out fonts.",
          "Eliminated all hardcoded dark background blocks across the platform; pages like /portfolio-intelligence, /decision-replay, and /rent-vs-buy adapt cleanly to light and dark themes.",
          "Brand-new ValarchiX squircle logo emblem with radiant emerald gradient, subtle obsidian slate borders, and tactile spring click feedback.",
          "Dropdown menu icon containers redesigned to non-inverting tinted badges with smooth scaling on hover instead of turning into dark solid blobs.",
          "Seamless 6-tab mobile bottom navigation bar (Home, Engines, Tools, Calc, Vaathi, Profile) with zero text clipping or ellipsis on compact screens (320px–375px)."
        ]
      }
    ]
  },
  {
    version: "v2.5.0",
    shortVersion: "v2.5",
    title: "Sikkanam-Style Security OS, Passcode Vault & Account Architecture",
    date: "August 2026",
    tag: "Security & Cloud",
    tagColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    summary: "Introduced enterprise-grade client-side encryption, a custom 4-digit in-app tactile passcode lock, and seamless 1-click Google OAuth cloud synchronization for user financial profiles.",
    featureGroups: [
      {
        category: "Client-Side Zero-Knowledge Encryption",
        items: [
          "AES-GCM 256-bit encrypted Digital Twin vault storing personal financial metrics, goals, and DNA scores with ₹0 data leakage risk.",
          "End-to-end cryptographic privacy where sensitive financial figures are never stored in plain text."
        ]
      },
      {
        category: "4-Digit In-App Passcode Locking",
        items: [
          "Custom telephone-style numeric keypad with tactile sound and vibration feedback for rapid 4-digit passcode entry.",
          "PBKDF2/SHA-256 client-side PIN hashing with strictly isolated per-user session storage keys.",
          "Automatic session lock triggers on inactivity and app backgrounding."
        ]
      },
      {
        category: "Google OAuth & Cross-Device Cloud Sync",
        items: [
          "1-Click Google OAuth authentication via Supabase with seamless session recovery from URL tokens and query parameters.",
          "Automatic cloud sync of user's Financial DNA diagnostics, GoalX targets, and profile metadata.",
          "Guest mode feature unlock modals gracefully onboarding visitors to authenticated cloud profiles."
        ]
      },
      {
        category: "Progressive Web App (PWA) 2.0",
        items: [
          "Native install prompt trigger ([⬇]) directly accessible from desktop and mobile headers.",
          "Real-time uninstallation detection using navigator.getInstalledRelatedApps() to clear stale cache.",
          "Offline service worker caching (/sw.js) for sub-second offline app launching."
        ]
      }
    ]
  },
  {
    version: "v2.3.0",
    shortVersion: "v2.3",
    title: "Financial DNA & GoalX Intelligence Engines",
    date: "July 2026",
    tag: "Intelligence Engines",
    tagColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    summary: "Launched the flagship Financial DNA diagnostic engine and GoalX multi-tier goal planner, providing scientific financial scoring and automated goal SIP allocation.",
    featureGroups: [
      {
        category: "Financial DNA Diagnostic Engine",
        items: [
          "8 deterministic mathematical pillars: Emergency Runway, Needs/Income Ratio, Wants Velocity, Debt-to-Income (DTI), Term Cover Adequacy, Health Insurance Buffer, Equity Allocation Velocity, and Longevity Horizons.",
          "Objective 0-100 scoring algorithm free of subjective human bias or commission incentives.",
          "Personalized diagnostic prescription highlighting critical financial vulnerabilities and actionable remediation steps."
        ]
      },
      {
        category: "GoalX Multi-Goal Priority Planner",
        items: [
          "Multi-tier priority categorization: Must-Have (Survival/Retirement), Good-to-Have (Home/Vehicle), and Dream Goals (Travel/Luxury).",
          "Category-specific inflation escalators (e.g. 10% for education vs 6% CPI general inflation).",
          "Automated monthly SIP allocation engine distributing available savings across competing life goals.",
          "Probability-of-success metric modeling market return distributions."
        ]
      },
      {
        category: "Portfolio Intelligence & Beyond FDs",
        items: [
          "Portfolio Intelligence engine analyzing asset allocation balance, equity style tilts (Large/Mid/Small cap), and downside stress testing.",
          "Beyond Fixed Deposits Masterclass educating users on the hidden risk of inflation erosion and purchasing power decay."
        ]
      }
    ]
  },
  {
    version: "v2.0.0",
    shortVersion: "v2.0",
    title: "Advanced Actuarial Engines, Decision Replay & Brent-Dekker XIRR",
    date: "June 2026",
    tag: "Actuarial Math",
    tagColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    summary: "Major release introducing deep actuarial simulations, the Decision Replay financial counterfactual machine, a robust Brent-Dekker XIRR solver, and 30-year Rent vs Buy math.",
    featureGroups: [
      {
        category: "Decision Replay (Financial Time Machine)",
        items: [
          "Historical counterfactual engine measuring the true opportunity cost of past purchases (e.g. buying a car or gadget vs investing in Nifty 50).",
          "Visualizes wealth divergence curves, lost compounding dividends, and financial regret index."
        ]
      },
      {
        category: "Rent vs Buy 30-Year Actuarial Engine",
        items: [
          "Full 30-year lifecycle simulation comparing home purchase (down payment, EMI amortization, property tax, maintenance, capital appreciation) vs renting.",
          "Simulates down payment opportunity cost invested in equity index funds alongside rent inflation growth.",
          "Identifies exact net worth crossover inflection point between renting and home ownership."
        ]
      },
      {
        category: "Brent-Dekker Robust XIRR Solver",
        items: [
          "Industry-grade Brent-Dekker root-finding numerical engine eliminating divergence, zero-derivative traps, and NaN anomalies.",
          "Multi-point logarithmic grid bracketing ([-0.999999, +10000.0]) capable of handling extreme, irregular, non-periodic cash flows.",
          "Interactive multiplier series (× [count]) for recurring cash flows with real-time subtext summaries and inflation-adjusted real yields."
        ]
      },
      {
        category: "Debt Funds & Actuarial Planners",
        items: [
          "Debt Funds Analyzer calculating Yield to Maturity (YTM), Macaulay Duration, Modified Duration, and interest rate sensitivity.",
          "Human Life Value (HLV) term insurance calculator and Child Legacy higher education escalating inflation planner."
        ]
      }
    ]
  },
  {
    version: "v1.8.0",
    shortVersion: "v1.8",
    title: "AMFI Master NAV Database & Multi-Format Broker Statement Parser",
    date: "May 2026",
    tag: "Data & Mutual Funds",
    tagColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    summary: "Direct AMFI master database integration powering official mutual fund analytics and multi-format broker statement ingestion.",
    featureGroups: [
      {
        category: "Official AMFI Master NAV Database",
        items: [
          "Direct integration with the Association of Mutual Funds in India (AMFI) official master NAV database.",
          "Zero-latency word-tokenized local cache search engine matching queries in any order with 0ms network lag.",
          "Comprehensive metrics: 1Y, 3Y, 5Y CAGR, annualized Volatility (Standard Deviation), Sharpe Ratio, and Sortino Ratio.",
          "Interactive rebased historical NAV performance charts against benchmark indices (Base 100)."
        ]
      },
      {
        category: "Multi-Format Statement Parser",
        items: [
          "Drag-and-drop parsing of broker statements in PDF, Excel (XLSX/XLS), and CSV exported from Zerodha, Groww, CAMS, and KFintech.",
          "Prefix-based fuzzy matching heuristics resolving scheme names despite typos, abbreviations, or missing spaces.",
          "Folio number filtering preventing account digits from corrupting valuation and units math.",
          "Direct vs Regular Total Expense Ratio (TER) compound drag calculator exposing hidden distributor fees."
        ]
      }
    ]
  },
  {
    version: "v1.5.0",
    shortVersion: "v1.5",
    title: "Sovereign Schemes Suite, Retirement Engines & Union Budget 2025 Tax Hub",
    date: "April 2026",
    tag: "Tax & Sovereign",
    tagColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    summary: "Comprehensive tax optimization aligned with Union Budget revised slabs, sovereign retirement schemes (EPF, SSY, NPS, PPF), and FIRE/SWP decumulation models.",
    featureGroups: [
      {
        category: "Union Budget Tax Regime Hub",
        items: [
          "Fully aligned with revised New Tax Regime slabs (FY 2025-26 & FY 2026-27) up to ₹24L+.",
          "Section 87A rebate math modeling ₹0 tax for salaried individuals earning up to ₹12.75 Lakhs with the ₹75,000 standard deduction.",
          "Bracket Creep simulator demonstrating how nominal pay raises push taxpayers into higher effective brackets under inflation.",
          "Section 10(13A) HRA exemption optimization and TDS transactional tax calculator with missing PAN penalty rates."
        ]
      },
      {
        category: "Sovereign Schemes Simulators",
        items: [
          "Sukanya Samriddhi Yojana (SSY) 21-year sovereign savings model at the 8.2% tax-free interest rate.",
          "Employee Provident Fund (EPF) simulating 12% employee/employer splits, EPS ₹1,250 caps, and annual pay hikes.",
          "Public Provident Fund (PPF) 15-year compounding calculator with Section 80C tax benefits.",
          "National Pension System (NPS) Tier I & Tier II models with annuity vs lumpsum maturity splits.",
          "National Savings Certificate (NSC 7.7%) and Post Office Monthly Income Scheme (POMIS 7.4%)."
        ]
      },
      {
        category: "FIRE & SWP Early Retirement Models",
        items: [
          "FIRE (Financial Independence, Retire Early) simulator with Safe Withdrawal Rate (4% SWR) and monthly bridging SIP calculations.",
          "Systematic Withdrawal Plan (SWP) planner modeling post-retirement cash flows and sequence-of-returns risk."
        ]
      }
    ]
  },
  {
    version: "v1.2.0",
    shortVersion: "v1.2",
    title: "Vaathi (வாத்தி) Enterprise Financial AI Mentor",
    date: "March 2026",
    tag: "AI & LLM",
    tagColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    summary: "Pioneered Vaathi AI, an institutional-grade financial assistant engineered with single-pass sub-second execution, zero-token guardrail interception, and multi-model failover.",
    featureGroups: [
      {
        category: "Single-Pass Sub-Second LLM Execution",
        items: [
          "Engineered single-pass execution delivering sub-second (~0.6s) response times by eliminating multi-turn tool calling latency.",
          "Achieved an 80% reduction in API token overhead and operational latency."
        ]
      },
      {
        category: "Zero-Token Edge Interceptor & Semantic Cache",
        items: [
          "0-Token Pre-LLM Guardrail Interceptor rejecting out-of-scope non-financial queries at the edge before hitting LLM models.",
          "Zero-latency semantic response cache delivering instantaneous responses (0ms network lag) for common financial questions."
        ]
      },
      {
        category: "Dynamic Multi-Model Failover & Solvers",
        items: [
          "Zero-downtime resilient failover routing requests across Llama 3.1 8B Instant, Llama 3.3 70B, and Google Gemini Flash.",
          "Direct integration with 25+ internal financial math solvers with robust parameter safeguards against ₹0 anomaly outputs."
        ]
      }
    ]
  },
  {
    version: "v1.0.0",
    shortVersion: "v1.0",
    title: "Birth of ValarchiX & Foundational Compounding OS",
    date: "February 2026",
    tag: "Genesis Milestone",
    tagColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    summary: "The inception of ValarchiX (வளர்ச்சி - Growth) as a zero-commission, zero-broker-bias financial knowledge operating system built on pure mathematics.",
    featureGroups: [
      {
        category: "Genesis Principles & Philosophy",
        items: [
          "Established core mission: «We don't tell what to pick, we tell how to pick» — empowering investors through first-principles financial mathematics rather than sponsored product recommendations.",
          "100% free, zero-commission, zero-broker-bias educational architecture."
        ]
      },
      {
        category: "Foundational Compounding Math Engines",
        items: [
          "Multi-frequency SIP Calculator supporting Daily, Weekly, Monthly, Quarterly, and Yearly investing intervals.",
          "Lumpsum Compound Interest simulator implementing official RBI quarterly compounding rules.",
          "Step-Up SIP Calculator modeling annual investment percentage and fixed nominal increments.",
          "Bank Fixed Deposit (FD) and Recurring Deposit (RD) compounding simulators."
        ]
      },
      {
        category: "Math Transparency & Debt Amortization",
        items: [
          "Collapsible 'How This is Calculated & Excel Replication' panels with formula proofs and Google Sheets replication formulas (FV, PMT, RATE).",
          "Home & Personal Loan EMI simulator with detailed principal vs interest amortization splits and prepayment savings modeling.",
          "Inflation Purchasing Power Decay simulator modeling the real future value of cash reserves."
        ]
      }
    ]
  }
];

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
  const [whatsNewSearchQuery, setWhatsNewSearchQuery] = useState("");
  const [selectedReleaseFilter, setSelectedReleaseFilter] = useState("ALL");
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [loginPromptModalOpen, setLoginPromptModalOpen] = useState(false);
  const [loginPromptFeature, setLoginPromptFeature] = useState("");
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);
  const [confirmClearCacheOpen, setConfirmClearCacheOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      if (typeof window !== "undefined") {
        // 1. Check query param code (?code=...)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
          try {
            const { data } = await supabase.auth.exchangeCodeForSession(code);
            if (data?.session) {
              setSession(data.session);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {
            console.warn("Client exchangeCodeForSession:", e);
          }
        }

        // 2. Check URL hash fragment (#access_token=...)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            try {
              const { data } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (data?.session) {
                setSession(data.session);
              }
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
              console.warn("Client setSession from hash:", e);
            }
          }
        }
      }

      const s = await getCurrentUserSession();
      setSession(s);
      if (s?.user) {
        setCachedUserInfo(s.user);
      }

      // Check Passcode State strictly for this authenticated user
      if (s?.user) {
        const userPin = localStorage.getItem(getUserPasscodeKey(s.user.id)) || localStorage.getItem("valarchix_app_pin");
        setPasscodeEnabled(!!userPin);
      } else {
        setPasscodeEnabled(false);
      }

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

      // Check PWA Installation
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true ||
        localStorage.getItem("valarchix_is_installed") === "true";
      setIsPwaInstalled(isStandalone);
    }
    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, newSession: any) => {
      setSession(newSession);
      if (event === "SIGNED_IN" && newSession?.user) {
        setCachedUserInfo(newSession.user);
        const alreadyNotified = sessionStorage.getItem("valarchix_login_toast_shown");
        if (!alreadyNotified) {
          sessionStorage.setItem("valarchix_login_toast_shown", "true");
          const rawName = newSession.user.user_metadata?.full_name || newSession.user.email?.split("@")[0] || "Investor";
          const name = getPrimaryFirstName(rawName);
          showToast(`Logged in successfully as ${name} ✅`);
        }
      } else if (event === "SIGNED_OUT") {
        sessionStorage.removeItem("valarchix_login_toast_shown");
      }
      loadData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handlePinKeyPress = async (digit: string) => {
    if (currentPin.length >= 4) return;
    const nextPin = currentPin + digit;
    setCurrentPin(nextPin);

    if (nextPin.length === 4) {
      if (session?.user) {
        const userId = session.user.id;
        const hashed = await hashPin(nextPin);
        localStorage.setItem(getUserPasscodeKey(userId), hashed);
        localStorage.setItem(getUserLockEnabledKey(userId), "true");
        sessionStorage.setItem(getUserSessionUnlockedKey(userId), "true");

        // Backwards compatibility keys
        localStorage.setItem("valarchix_app_pin", hashed);
        sessionStorage.setItem("valarchix_session_unlocked", "true");
        setCachedUserInfo(session.user);

        setPasscodeEnabled(true);
        const isUpdate = passcodeEnabled;
        setTimeout(() => {
          setPasscodeModalOpen(false);
          setCurrentPin("");
          showToast(isUpdate ? "4-digit PIN updated successfully ✅" : "4-digit PIN enabled successfully ✅");
        }, 120);
      }
    }
  };

  const handlePinDelete = () => {
    setCurrentPin((prev) => prev.slice(0, -1));
  };

  // Keyboard support for Passcode modal
  useEffect(() => {
    if (!passcodeModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePinKeyPress(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handlePinDelete();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setPasscodeModalOpen(false);
        setCurrentPin("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [passcodeModalOpen, currentPin]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
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
        if (session?.user) {
          const userId = session.user.id;
          localStorage.removeItem(getUserPasscodeKey(userId));
          localStorage.removeItem(getUserLockEnabledKey(userId));
          sessionStorage.removeItem(getUserSessionUnlockedKey(userId));
        }
        localStorage.removeItem("valarchix_app_pin");
        sessionStorage.removeItem("valarchix_session_unlocked");
        setPasscodeEnabled(false);
        showToast("App Passcode Lock disabled");
      } else {
        setPasscodeModalOpen(true);
      }
    });
  };

  const handleClearCache = () => {
    setConfirmClearCacheOpen(true);
  };

  const executeClearCache = () => {
    sessionStorage.clear();
    setConfirmClearCacheOpen(false);
    showToast("Temporary session cache reset successfully ✅");
  };

  const handleSignOut = () => {
    setConfirmSignOutOpen(true);
  };

  const executeSignOut = async () => {
    // 1. Instant 0ms UI reset
    setConfirmSignOutOpen(false);
    setSession(null);
    setPasscodeEnabled(false);
    setDnaScore(null);
    setGoalsCount(0);
    showToast("Signed out successfully");

    // 2. Complete storage & SDK purge
    await signOutUser();
  };

  const rawUserName = session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "ValarchiX Investor";
  const userName = session?.user
    ? getPrimaryFirstName(rawUserName)
    : "Guest Investor";
  const userEmail = session?.user
    ? session.user.email
    : "Not signed in · Connect Google to sync";
  const userAvatar = session?.user?.user_metadata?.avatar_url;
  const userInitial = userName.charAt(0).toUpperCase() || "V";

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-16 pt-2">
      
      {/* Toast Notification (High Contrast Floating Pill) */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-border-navy px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-slideDown max-w-sm">
          <CheckCircle2 size={19} className="text-emerald shrink-0" />
          <span className="text-xs sm:text-sm font-black !text-slate-900 dark:!text-white leading-tight">{toastMessage}</span>
        </div>
      )}

      {/* Main Profile Identity Card (Sikkanam Layout) */}
      <div className="card-tile-neutral rounded-3xl p-6 sm:p-8 text-center space-y-4 border relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/10 rounded-full blur-3xl -z-10" />
        
        {/* User Avatar Circle */}
        <div className="relative inline-block mx-auto">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-emerald shadow-lg shadow-emerald/20 object-cover"
            />
          ) : session?.user ? (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald/20 border-2 border-emerald flex items-center justify-center text-emerald font-black text-2xl sm:text-3xl shadow-lg shadow-emerald/20">
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
              type="button"
              onClick={() => signInWithGoogle("/profile")}
              className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 dark:border-white/15 text-xs sm:text-sm font-black px-6 py-2.5 rounded-full transition shadow-md flex items-center gap-2.5 mx-auto cursor-pointer active:scale-95 inline-flex"
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

      {/* =========================================================================
          SECTION 1: SECURITY & PRIVACY
          ========================================================================= */}
      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-grey px-1">
          Security &amp; Privacy
        </h2>
        <div className="bg-navy-card border border-border-navy rounded-3xl divide-y divide-border-navy/60 overflow-hidden shadow-sm">
          
          {/* App Passcode Lock (Entire Row Clickable) */}
          <button
            type="button"
            onClick={handleTogglePasscode}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-navy-light/40 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-heading">App Passcode Lock</div>
                <div className="text-xs text-muted-grey">
                  {passcodeEnabled ? "4-digit PIN lock enabled (Tap anywhere to disable)" : "Require 4-digit PIN to open ValarchiX"}
                </div>
              </div>
            </div>
            <div
              className={`px-3.5 py-1 rounded-full text-xs font-black transition border shrink-0 ${
                passcodeEnabled
                  ? "bg-emerald/15 text-emerald border-emerald/30"
                  : "bg-navy-bg text-muted-grey border-border-navy"
              }`}
            >
              {passcodeEnabled ? "ON" : "OFF"}
            </div>
          </button>

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
          
          {/* ValarchiX App PWA (Whole Row Clickable) */}
          <div
            onClick={() => {
              if (isPwaInstalled) {
                showToast("ValarchiX standalone app is active ✅");
              } else {
                window.dispatchEvent(new Event("valarchix_install_prompt"));
                showToast("Opening app install prompt...");
              }
            }}
            className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-navy-light/40 transition cursor-pointer"
          >
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
              <span className="bg-indigo-600 hover:bg-indigo-500 !text-white px-3.5 py-1.5 rounded-full text-xs font-black transition shadow-sm">
                Install App
              </span>
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
        வளர்ச்சி · ValarchiX v2.6.1
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
              type="button"
              onClick={() => signInWithGoogle("/profile")}
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

      {/* Full-Screen Set/Change Passcode Screen (Matches App Lock Gate UI) */}
      {passcodeModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-[#050b17] text-white flex flex-col items-center justify-center p-4 select-none overflow-y-auto animate-fadeIn">
          {/* Ambient background glow accents */}
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Security Vault Card Container */}
          <div className="relative z-10 w-full max-w-sm mx-auto bg-[#091428]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-center flex flex-col items-center space-y-5">
            
            {/* ValarchiX Official Security Emblem */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#030914] border border-emerald-500/40 p-2.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
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

            {/* Heading & Subtitle */}
            <div className="space-y-1.5 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                <ShieldCheck size={13} />
                <span>Device Passcode Security</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {passcodeEnabled ? "Change Passcode PIN 🔐" : "Set 4-Digit Passcode 🔐"}
              </h1>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Enter 4 digits to secure ValarchiX on this device
              </p>
            </div>

            {/* 4 Circular PIN Dots */}
            <div className="flex items-center justify-center gap-4 py-2">
              {[0, 1, 2, 3].map((index) => {
                const filled = currentPin.length > index;
                return (
                  <div
                    key={index}
                    className={`transition-all duration-200 ${
                      filled
                        ? "w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)] scale-110"
                        : "w-3.5 h-3.5 rounded-full border-2 border-slate-600 bg-slate-800/40"
                    }`}
                  />
                );
              })}
            </div>

            {/* Tactile Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {KEYPAD_DIGITS.map((item) => (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => handlePinKeyPress(item.num)}
                  className="h-14 sm:h-15 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-emerald-500/20 active:scale-95 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-sm touch-manipulation select-none"
                >
                  <span className="text-xl font-bold text-white tracking-tight leading-none">
                    {item.num}
                  </span>
                  {item.sub && (
                    <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5 leading-none">
                      {item.sub}
                    </span>
                  )}
                </button>
              ))}
              
              {/* Row 4: Lock Icon */}
              <div className="h-14 sm:h-15 flex items-center justify-center text-slate-500 rounded-2xl">
                <Lock size={18} className="text-slate-500/80" />
              </div>

              {/* Row 4: Digit 0 */}
              <button
                type="button"
                onClick={() => handlePinKeyPress("0")}
                className="h-14 sm:h-15 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-emerald-500/20 active:scale-95 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-sm touch-manipulation select-none"
              >
                <span className="text-xl font-bold text-white tracking-tight leading-none">
                  0
                </span>
                <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5 leading-none">
                  +
                </span>
              </button>

              {/* Row 4: Backspace Button */}
              <button
                type="button"
                onClick={handlePinDelete}
                className="h-14 sm:h-15 rounded-2xl bg-white/[0.03] hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 active:scale-95 border border-white/[0.06] transition-all duration-150 flex items-center justify-center cursor-pointer shadow-sm touch-manipulation select-none"
                title="Delete digit"
              >
                <Delete size={20} />
              </button>
            </div>

            {/* Cancel Button */}
            <div className="pt-2 w-full flex items-center justify-center min-h-[44px]">
              <button
                type="button"
                onClick={() => {
                  setPasscodeModalOpen(false);
                  setCurrentPin("");
                }}
                className="text-xs font-bold text-slate-400 hover:text-white px-5 py-2.5 rounded-full border border-white/10 hover:border-white/20 transition cursor-pointer"
              >
                Cancel &amp; Return to Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* What's New Modal: Comprehensive ValarchiX Evolution Chronicle */}
      {whatsNewModalOpen && (() => {
        const query = whatsNewSearchQuery.toLowerCase().trim();
        const filteredReleases = VALARCHIX_RELEASES.filter((rel) => {
          // Version filter
          if (selectedReleaseFilter !== "ALL") {
            if (selectedReleaseFilter !== rel.shortVersion && selectedReleaseFilter !== rel.version) {
              return false;
            }
          }
          // Search query filter
          if (!query) return true;
          const matchVersion = rel.version.toLowerCase().includes(query);
          const matchTitle = rel.title.toLowerCase().includes(query);
          const matchSummary = rel.summary.toLowerCase().includes(query);
          const matchCategory = rel.featureGroups.some((fg) => fg.category.toLowerCase().includes(query));
          const matchItems = rel.featureGroups.some((fg) => fg.items.some((it) => it.toLowerCase().includes(query)));
          return matchVersion || matchTitle || matchSummary || matchCategory || matchItems;
        });

        const totalFeaturesCount = VALARCHIX_RELEASES.reduce(
          (acc, rel) => acc + rel.featureGroups.reduce((gAcc, g) => gAcc + g.items.length, 0),
          0
        );

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-navy-card border border-border-navy rounded-3xl p-5 sm:p-7 max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl animate-slideDown">
              
              {/* Modal Top Header */}
              <div className="flex items-start justify-between border-b border-border-navy pb-4 shrink-0">
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Sparkles size={18} />
                    </span>
                    <h3 className="font-black text-lg sm:text-xl text-heading tracking-tight">
                      What&apos;s New in ValarchiX
                    </h3>
                    <span className="hidden sm:inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      v2.6.1 Live
                    </span>
                  </div>
                  <p className="text-xs text-muted-grey">
                    Complete evolution, feature upgrades, and actuarial solvers from Genesis (v1.0) to Present.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWhatsNewModalOpen(false);
                    setWhatsNewSearchQuery("");
                    setSelectedReleaseFilter("ALL");
                  }}
                  className="p-2 rounded-xl text-muted-grey hover:text-heading hover:bg-navy-light/60 transition cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search & Milestone Filter Controls */}
              <div className="pt-3 pb-3 space-y-2.5 shrink-0 border-b border-border-navy/60">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-grey" />
                  <input
                    type="text"
                    value={whatsNewSearchQuery}
                    onChange={(e) => setWhatsNewSearchQuery(e.target.value)}
                    placeholder="Search features (e.g., XIRR, Passcode, Rent vs Buy, AMFI, Tax, SIP)..."
                    className="w-full bg-navy-bg text-heading placeholder:text-muted-grey text-xs pl-9 pr-8 py-2.5 rounded-xl border border-border-navy focus:outline-none focus:border-indigo-500 transition"
                  />
                  {whatsNewSearchQuery && (
                    <button
                      onClick={() => setWhatsNewSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-grey hover:text-heading text-xs cursor-pointer p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Milestone Version Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] font-bold">
                  <button
                    onClick={() => setSelectedReleaseFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer border ${
                      selectedReleaseFilter === "ALL"
                        ? "bg-indigo-600 !text-white border-indigo-500 shadow-sm"
                        : "bg-navy-bg text-muted-grey hover:text-heading border-border-navy"
                    }`}
                  >
                    All Milestones ({VALARCHIX_RELEASES.length})
                  </button>
                  {VALARCHIX_RELEASES.map((rel) => (
                    <button
                      key={rel.version}
                      onClick={() => setSelectedReleaseFilter(rel.shortVersion)}
                      className={`px-2.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer border ${
                        selectedReleaseFilter === rel.shortVersion
                          ? "bg-indigo-600 !text-white border-indigo-500 shadow-sm"
                          : "bg-navy-bg text-muted-grey hover:text-heading border-border-navy"
                      }`}
                    >
                      {rel.shortVersion} {rel.isLatest ? "🔥" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Releases List */}
              <div className="overflow-y-auto flex-1 pr-1 sm:pr-2 space-y-4 pt-4 no-scrollbar">
                {filteredReleases.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <History size={36} className="mx-auto text-muted-grey/50" />
                    <div className="text-sm font-bold text-heading">No matching upgrades found</div>
                    <p className="text-xs text-muted-grey">
                      No release milestones matched &quot;{whatsNewSearchQuery}&quot;.
                    </p>
                    <button
                      onClick={() => {
                        setWhatsNewSearchQuery("");
                        setSelectedReleaseFilter("ALL");
                      }}
                      className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer pt-1"
                    >
                      Clear search &amp; view all releases
                    </button>
                  </div>
                ) : (
                  filteredReleases.map((rel) => (
                    <div
                      key={rel.version}
                      className={`bg-navy-bg border rounded-2xl p-4 sm:p-5 space-y-3.5 transition ${
                        rel.isLatest
                          ? "border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-md"
                          : "border-border-navy"
                      }`}
                    >
                      {/* Release Title Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-navy/60 pb-3">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-navy-card border border-border-navy text-heading">
                            {rel.version}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${rel.tagColor}`}>
                            {rel.tag}
                          </span>
                          {rel.isLatest && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black animate-pulse">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-grey font-medium">
                          <Calendar size={13} />
                          <span>{rel.date}</span>
                        </div>
                      </div>

                      {/* Headline & Summary */}
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-black text-heading leading-snug">
                          {rel.title}
                        </h4>
                        <p className="text-xs text-muted-grey leading-relaxed">
                          {rel.summary}
                        </p>
                      </div>

                      {/* Feature Categories & Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {rel.featureGroups.map((group, gIdx) => (
                          <div
                            key={gIdx}
                            className="bg-navy-card/70 border border-border-navy/70 rounded-xl p-3 sm:p-3.5 space-y-2"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-black text-heading">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              <span>{group.category}</span>
                            </div>
                            <ul className="space-y-1.5 text-[11px] text-muted-grey leading-relaxed">
                              {group.items.map((item, iIdx) => (
                                <li key={iIdx} className="flex items-start gap-1.5">
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* Modal Bottom Footer Summary */}
              <div className="pt-3 border-t border-border-navy shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-muted-grey">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-bold">{totalFeaturesCount}+ documented capabilities</span>
                  <span>•</span>
                  <span>v1.0 Genesis to v2.6.1 Live</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/about"
                    onClick={() => setWhatsNewModalOpen(false)}
                    className="font-black text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Full About &amp; Mission</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

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

      {/* Confirmation Modal: Sign Out */}
      {confirmSignOutOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-5 shadow-2xl animate-slideDown text-center">
            <div className="flex justify-center">
              <div className="p-3.5 rounded-full bg-emerald/10 text-emerald border border-emerald/20">
                <LogOut size={26} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-heading">Sign Out of ValarchiX?</h3>
              <p className="text-xs text-muted-grey">
                Your encrypted data and financial records are securely synced in the cloud.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSignOutOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-border-navy bg-navy-bg hover:bg-navy-light text-heading text-xs font-black transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSignOut}
                className="flex-1 py-3 rounded-2xl bg-emerald hover:bg-emerald/90 text-slate-950 text-xs font-black transition shadow-md shadow-emerald/20 cursor-pointer border border-emerald"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Temporary Cache */}
      {confirmClearCacheOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-5 shadow-2xl animate-slideDown text-center">
            <div className="flex justify-center">
              <div className="p-3.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <Trash2 size={26} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-heading">Reset Session Cache?</h3>
              <p className="text-xs text-muted-grey">
                This clears temporary session variables. Your saved cloud records, DNA scores, and goals remain 100% safe.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearCacheOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-border-navy bg-navy-bg hover:bg-navy-light text-heading text-xs font-black transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeClearCache}
                className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
