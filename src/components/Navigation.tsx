"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Layers,
  Shield,
  Percent,
  Target,
  Hourglass,
  PieChart,
  Calculator,
  Menu,
  X,
  Info,
  Sun,
  Moon,
  Coins,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ShieldAlert,
  Flame,
  Wallet,
  Coffee,
  Clock,
  BarChart2,
  Scissors,
  CreditCard,
  HeartPulse,
  TrendingDown,
  Zap,
  Download,
  Sliders,
  GraduationCap,
  LayoutGrid,
  BarChart,
  MoreHorizontal,
  ChevronRight,
  RotateCcw,
  Lock,
  Baby
} from "lucide-react";

const NAV_ITEMS = [
  {
    category: "Intelligence Engines",
    items: [
      { name: "Financial DNA", href: "/financial-dna", icon: HeartPulse },
      { name: "GoalX Navigation", href: "/goalx", icon: Target },
      { name: "Portfolio Intelligence", href: "/portfolio-intelligence", icon: PieChart },
      { name: "Financial Time Machine", href: "/time-machine", icon: Hourglass },
      { name: "Decision Replay", href: "/decision-replay", icon: RotateCcw },
    ]
  },
  {
    category: "Core",
    items: [
      { name: "Home Dashboard", href: "/", icon: Home },
      { name: "Valarchi Vaathi 🎓", href: "/vaathi", icon: GraduationCap },
      { name: "Beyond FDs & Learning", href: "/beyond-fds", icon: Info }
    ]
  },
  {
    category: "Analyzers",
    items: [
      { name: "Mutual Funds", href: "/mutual-funds", icon: Layers },
      { name: "Debt Funds", href: "/debt-funds", icon: Shield }
    ]
  },
  {
    category: "Budgeting & Cash Flow",
    items: [
      { name: "Net Worth", href: "/net-worth", icon: Wallet },
      { name: "Emergency Fund", href: "/emergency-fund", icon: ShieldAlert },
      { name: "Latte Factor", href: "/latte-factor", icon: Coffee },
      { name: "Rent vs. Buy", href: "/rent-vs-buy", icon: Home }
    ]
  },
  {
    category: "Wealth Building",
    items: [
      { name: "Child Legacy Engine", href: "/child-legacy", icon: Baby },
      { name: "SIP & FD Simulator", href: "/sip", icon: Percent },
      { name: "Step Up SIP", href: "/step-up-sip", icon: ArrowUpRight },
      { name: "Compound Interest", href: "/compound-interest", icon: TrendingUp },
      { name: "Cost of Delay", href: "/cost-of-delay", icon: Clock },
      { name: "Inflation Calculator", href: "/inflation", icon: BarChart2 },
      { name: "RD Calculator", href: "/rd", icon: Percent },
      { name: "ROI & CAGR", href: "/roi", icon: TrendingUp },
      { name: "XIRR Calculator", href: "/xirr", icon: Zap }
    ]
  },
  {
    category: "Debt Tools",
    items: [
      { name: "Debt Snowball / Avalanche", href: "/debt-payoff", icon: Scissors },
      { name: "Loan EMI Simulator", href: "/emi", icon: Landmark },
      { name: "Credit Card Payoff", href: "/credit-card", icon: CreditCard }
    ]
  },
  {
    category: "Retirement & Planning",
    items: [
      { name: "Goal Planner", href: "/goal", icon: Target },
      { name: "FIRE Early Retirement", href: "/fire", icon: Flame },
      { name: "Retirement", href: "/retirement", icon: Hourglass },
      { name: "Human Life Value (HLV)", href: "/hlv", icon: HeartPulse },
      { name: "PPF Calculator", href: "/ppf", icon: Coins },
      { name: "NPS Calculator", href: "/nps", icon: TrendingUp },
      { name: "SWP Calculator", href: "/swp", icon: ArrowDownLeft },
      { name: "SSY Calculator", href: "/ssy", icon: Coins },
      { name: "EPF Calculator", href: "/epf", icon: Coins },
      { name: "Gratuity Calculator", href: "/gratuity", icon: Coins },
      { name: "APY Pension Simulator", href: "/apy", icon: Coins },
      { name: "Post Office MIS", href: "/pomis", icon: Coins },
      { name: "SCSS Calculator", href: "/scss", icon: Coins }
    ]
  },
  {
    category: "Portfolio & Tax",
    items: [
      { name: "Strategy Simulator (v2.0)", href: "/portfolio-simulator", icon: Sliders },
      { name: "Portfolio Allocator", href: "/portfolio", icon: PieChart },
      { name: "Tax Regime Hub", href: "/tax", icon: Calculator },
      { name: "HRA Exemption", href: "/hra", icon: Calculator },
      { name: "Advanced Income Tax", href: "/income-tax", icon: Calculator },
      { name: "TDS Calculator", href: "/tds", icon: Calculator },
      { name: "NSC Calculator", href: "/nsc", icon: Coins }
    ]
  }
];

// Bottom nav tabs for mobile
const BOTTOM_TABS = [
  { name: "Home", href: "/", icon: Home, type: "link" as const },
  { name: "Calculators", href: "#", icon: Calculator, type: "drawer" as const },
  { name: "Engines", href: "#", icon: LayoutGrid, type: "drawer" as const },
  { name: "Vaathi", href: "/vaathi", icon: GraduationCap, type: "link" as const },
  { name: "Vault", href: "/auth", icon: Lock, type: "link" as const },
];

import { getCurrentUserSession } from "@/lib/supabase/auth";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isInstalled, setIsInstalled] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function fetchSession() {
      const s = await getCurrentUserSession();
      setSession(s);
    }
    fetchSession();
  }, [pathname]);

  // Check PWA installation state
  useEffect(() => {
    const checkIsInstalled = () => {
      if (typeof window === "undefined") return false;
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: window-controls-overlay)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (navigator as any).standalone === true ||
        localStorage.getItem("valarchix_is_installed") === "true"
      );
    };

    setIsInstalled(checkIsInstalled());

    if (typeof window !== "undefined" && "navigator" in window && "getInstalledRelatedApps" in navigator) {
      (navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
        if (relatedApps && relatedApps.length > 0) {
          setIsInstalled(true);
          localStorage.setItem("valarchix_is_installed", "true");
        }
      }).catch(() => {});
    }

    const handlePwaStatusChange = () => {
      setIsInstalled(checkIsInstalled());
    };

    window.addEventListener("valarchix_pwa_status_change", handlePwaStatusChange);
    window.addEventListener("appinstalled", () => {
      localStorage.setItem("valarchix_is_installed", "true");
      setIsInstalled(true);
    });
    window.addEventListener("beforeinstallprompt", () => {
      // beforeinstallprompt firing proves app is NOT installed currently
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        localStorage.removeItem("valarchix_is_installed");
        setIsInstalled(false);
      }
    });

    return () => {
      window.removeEventListener("valarchix_pwa_status_change", handlePwaStatusChange);
    };
  }, []);

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

  // Get items for mobile drawers
  const getDrawerItems = (drawerName: string) => {
    if (drawerName === "Engines") {
      return NAV_ITEMS.filter(g => ["Intelligence Engines", "Core", "Budgeting & Cash Flow", "Wealth Building"].includes(g.category));
    }
    if (drawerName === "Tools") {
      return NAV_ITEMS.filter(g => ["Budgeting & Cash Flow", "Wealth Building", "Debt Tools", "Retirement & Planning"].includes(g.category));
    }
    if (drawerName === "Analyze") {
      return NAV_ITEMS.filter(g => ["Analyzers", "Portfolio & Tax"].includes(g.category));
    }
    if (drawerName === "More") {
      return [
        ...NAV_ITEMS.filter(g => ["Debt Tools", "Retirement & Planning", "Portfolio & Tax"].includes(g.category)),
        { category: "System & Learning", items: [
          { name: "Beyond FDs & Learning", href: "/beyond-fds", icon: Info },
          { name: "Disclaimer", href: "/disclaimer", icon: Info }
        ]},
      ];
    }
    return NAV_ITEMS;
  };

  const closeDrawer = () => setMobileDrawer(null);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border-navy bg-navy-bg/90 backdrop-blur-md">
        <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            {/* Desktop hamburger only — mobile uses bottom nav */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-grey hover:text-white hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="ValarchiX" className="h-7 w-7 md:h-8 md:w-8 rounded-lg" />
              <span className="text-lg md:text-xl font-bold tracking-wider text-light-grey">
                Valarchi<span className="text-emerald font-extrabold">X</span>
              </span>
            </Link>
          </div>

          {/* Core Motto — desktop only */}
          <div className="hidden text-sm font-medium text-emerald bg-emerald/5 border border-emerald/20 px-4 py-1.5 rounded-full md:block">
            💡 &ldquo;We don&apos;t tell what to pick, we tell how to pick&rdquo;
          </div>

          {/* Theme Switch & Actions */}
          <div className="flex items-center gap-2 md:gap-3">

            {pathname !== "/" && (
              <button
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald/30 bg-emerald/10 text-emerald hover:bg-emerald hover:text-navy-bg transition-all text-xs font-bold cursor-pointer"
                title="Download PDF Report"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 md:p-2.5 rounded-xl border border-border-navy bg-navy-card/30 text-emerald hover:text-white hover:border-emerald/40 transition-all cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link
              href="/auth"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                session?.user
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/80"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
              }`}
            >
              <Lock size={14} />
              {session?.user ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="truncate max-w-[70px] sm:max-w-[110px]">
                    {session.user.user_metadata?.full_name?.split(" ")[0] || "Live Vault"}
                  </span>
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar Navigation — hidden on mobile */}
      <aside className="fixed bottom-0 top-14 md:top-16 z-30 hidden md:flex w-64 flex-col border-r border-border-navy bg-navy-bg">
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-6">
            {NAV_ITEMS.map((group) => (
              <div key={group.category} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-grey px-3">
                  {group.category}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                            isActive
                              ? "bg-navy-light text-emerald border-l-2 border-emerald font-bold"
                              : "text-muted-grey hover:bg-navy-light hover:text-light-grey"
                          }`}
                        >
                          <Icon size={18} className={isActive ? "text-emerald" : ""} />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Disclaimer */}
        <div className="border-t border-border-navy p-4 bg-navy-bg">
          <div className="flex items-start gap-2 text-[10px] text-muted-grey">
            <Info size={14} className="text-emerald shrink-0 mt-0.5" />
            <p className="leading-tight">
              <strong>Disclaimer:</strong> Educational purposes only. We do not provide personalized financial advice.
            </p>
          </div>
        </div>
      </aside>

      {/* ===== MOBILE BOTTOM NAVIGATION BAR ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border-navy bg-navy-bg/95 backdrop-blur-md safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.type === "link" && pathname === tab.href;
            const isDrawerOpen = tab.type === "drawer" && mobileDrawer === tab.name;

            return (
              <button
                key={tab.name}
                onClick={() => {
                  if (tab.type === "link") {
                    setMobileDrawer(null);
                    window.location.href = tab.href;
                  } else {
                    setMobileDrawer(mobileDrawer === tab.name ? null : tab.name);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1.5 rounded-xl transition-all ${
                  isActive || isDrawerOpen
                    ? "text-emerald-400 font-extrabold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={20} strokeWidth={isActive || isDrawerOpen ? 2.5 : 1.8} />
                <span className="text-[10px] font-semibold">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ===== MOBILE DRAWER (slides up from bottom nav) ===== */}
      {mobileDrawer && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md md:hidden"
          />
          {/* Drawer */}
          <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-navy-bg border-t border-border-navy rounded-t-3xl max-h-[75vh] overflow-y-auto shadow-2xl safe-area-bottom p-5 space-y-5">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <h3 className="text-base font-extrabold text-white">{mobileDrawer} Navigation</h3>
              </div>
              <button onClick={closeDrawer} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* Theme toggle in More drawer */}
            {mobileDrawer === "More" && (
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-950 text-sm font-semibold text-slate-200"
              >
                {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
                <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
              </button>
            )}

            {/* Nav items grid */}
            {getDrawerItems(mobileDrawer).map((group) => (
              <div key={group.category} className="space-y-2">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 px-1">
                  {group.category}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={closeDrawer}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-bold transition-all border ${
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                            : "bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
