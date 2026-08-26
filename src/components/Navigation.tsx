"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Layers,
  Shield,
  Percent,
  Target,
  Hourglass,
  PieChart,
  Calculator,
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
  Coffee,
  Clock,
  BarChart2,
  Scissors,
  CreditCard,
  HeartPulse,
  Zap,
  Download,
  Sliders,
  GraduationCap,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Baby,
  Plane,
  Building,
  GraduationCap as BookIcon,
  LogOut,
  LogIn,
  CheckCircle2,
  Smartphone
} from "lucide-react";
import { getCurrentUserSession, signInWithGoogle, signOutUser } from "@/lib/supabase/auth";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  desc: string;
  badge?: string;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

const NAV_ITEMS: NavGroup[] = [
  {
    category: "Intelligence Engines",
    items: [
      { name: "Financial DNA", href: "/financial-dna", icon: HeartPulse, desc: "8-Pillar health score & cash flow allocation", badge: "Engine 1" },
      { name: "GoalX Navigation", href: "/goalx", icon: Target, desc: "Inflation adjusted roadmaps & SIP solvers", badge: "Engine 2" },
      { name: "Portfolio Intelligence", href: "/portfolio-intelligence", icon: PieChart, desc: "True XIRR, overlap & drag analyzer", badge: "Engine 3" },
      { name: "Financial Time Machine", href: "/time-machine", icon: Hourglass, desc: "Parallel universes & 20-yr stress test", badge: "Engine 4" },
      { name: "Decision Replay", href: "/decision-replay", icon: Clock, desc: "Hindsight-free decision audit", badge: "Engine 5" },
    ]
  },
  {
    category: "Core & Learning",
    items: [
      { name: "Home Dashboard", href: "/", icon: Home, desc: "Financial Knowledge OS Overview" },
      { name: "Valarchi Vaathi 🎓", href: "/vaathi", icon: GraduationCap, desc: "AI financial literacy mentor" },
      { name: "Beyond FDs & Learning", href: "/beyond-fds", icon: Info, desc: "Real returns vs inflation & compounding" }
    ]
  },
  {
    category: "Analyzers",
    items: [
      { name: "Mutual Funds Screener", href: "/mutual-funds", icon: Layers, desc: "Direct vs Regular, TER drag & rolling returns" },
      { name: "Debt Funds Analyzer", href: "/debt-funds", icon: Shield, desc: "Yield to maturity & Macaulay duration" }
    ]
  },
  {
    category: "Budgeting & Cash Flow",
    items: [
      { name: "Emergency Fund", href: "/emergency-fund", icon: ShieldAlert, desc: "3-6 month fortress requirement" },
      { name: "Latte Factor", href: "/latte-factor", icon: Coffee, desc: "Small daily leak compounding" },
      { name: "Rent vs. Buy", href: "/rent-vs-buy", icon: Home, desc: "Opportunity cost of real estate" }
    ]
  },
  {
    category: "Wealth Building",
    items: [
      { name: "Child Legacy Engine", href: "/child-legacy", icon: Baby, desc: "18-25 yr generational compounding" },
      { name: "SIP & FD Simulator", href: "/sip", icon: Percent, desc: "Systematic monthly investing" },
      { name: "Step Up SIP", href: "/step-up-sip", icon: ArrowUpRight, desc: "Annual increment compounding" },
      { name: "Compound Interest", href: "/compound-interest", icon: TrendingUp, desc: "Exponential curve simulator" },
      { name: "Cost of Delay", href: "/cost-of-delay", icon: Clock, desc: "Wealth lost by waiting" },
      { name: "Inflation Calculator", href: "/inflation", icon: BarChart2, desc: "Future purchasing power drop" },
      { name: "RD Calculator", href: "/rd", icon: Percent, desc: "Recurring deposit returns" },
      { name: "ROI & CAGR", href: "/roi", icon: TrendingUp, desc: "Annualized compounding metrics" },
      { name: "XIRR Calculator", href: "/xirr", icon: Zap, desc: "Irregular cash flow returns" }
    ]
  },
  {
    category: "Debt Tools",
    items: [
      { name: "Debt Snowball / Avalanche", href: "/debt-payoff", icon: Scissors, desc: "Optimal loan payoff strategy" },
      { name: "Loan EMI Simulator", href: "/emi", icon: Landmark, desc: "Principal vs interest amortization" },
      { name: "Credit Card Payoff", href: "/credit-card", icon: CreditCard, desc: "High-interest debt trap analyzer" }
    ]
  },
  {
    category: "Retirement & Planning",
    items: [
      { name: "Goal Planner", href: "/goal", icon: Target, desc: "Target amount future solver" },
      { name: "FIRE Early Retirement", href: "/fire", icon: Flame, desc: "25x-30x corpus milestones" },
      { name: "Retirement Planner", href: "/retirement", icon: Hourglass, desc: "Post-retirement cash drawdown" },
      { name: "Human Life Value (HLV)", href: "/hlv", icon: HeartPulse, desc: "Income replacement term cover" },
      { name: "PPF Calculator", href: "/ppf", icon: Coins, desc: "15-year sovereign tax-free compounding" },
      { name: "NPS Calculator", href: "/nps", icon: TrendingUp, desc: "National Pension System tier 1" },
      { name: "SWP Calculator", href: "/swp", icon: ArrowDownLeft, desc: "Systematic withdrawal plan" },
      { name: "SSY Calculator", href: "/ssy", icon: Coins, desc: "Sukanya Samriddhi Yojana" },
      { name: "EPF Calculator", href: "/epf", icon: Coins, desc: "Employee provident fund corpus" },
      { name: "Gratuity Calculator", href: "/gratuity", icon: Coins, desc: "Service tenure gratuity math" },
      { name: "APY Pension Simulator", href: "/apy", icon: Coins, desc: "Atal Pension Yojana" },
      { name: "Post Office MIS", href: "/pomis", icon: Coins, desc: "Monthly income scheme" },
      { name: "SCSS Calculator", href: "/scss", icon: Coins, desc: "Senior citizens savings scheme" }
    ]
  },
  {
    category: "Portfolio & Tax",
    items: [
      { name: "Strategy Simulator (v2.0)", href: "/portfolio-simulator", icon: Sliders, desc: "Custom asset allocation stress-test" },
      { name: "Portfolio Allocator", href: "/portfolio", icon: PieChart, desc: "Risk-adjusted rebalancing" },
      { name: "Tax Regime Hub", href: "/tax", icon: Calculator, desc: "Old vs New Regime comparative math" },
      { name: "HRA Exemption", href: "/hra", icon: Calculator, desc: "House rent allowance tax saving" },
      { name: "Advanced Income Tax", href: "/income-tax", icon: Calculator, desc: "Section 80C, 80D & surcharge math" },
      { name: "TDS Calculator", href: "/tds", icon: Calculator, desc: "Tax deducted at source on income" },
      { name: "NSC Calculator", href: "/nsc", icon: Coins, desc: "National Savings Certificate" }
    ]
  }
];

const FUNDSINDIA_GOALS = [
  { name: "Retirement Planning", href: "/retirement", icon: Hourglass, desc: "Corpus & drawdown" },
  { name: "Child's Education", href: "/child-legacy", icon: BookIcon, desc: "18-25 yr compounding" },
  { name: "Plan a Vacation", href: "/goal", icon: Plane, desc: "Travel inflation goals" },
  { name: "Wealth Creation", href: "/sip", icon: TrendingUp, desc: "SIP & Step-Up compounding" },
  { name: "Buying a Home", href: "/goalx", icon: Building, desc: "Real estate vs SIP math" },
  { name: "Emergency Funds", href: "/emergency-fund", icon: ShieldAlert, desc: "3-6 month liquid fortress" },
];

const BOTTOM_TABS = [
  { name: "Home", href: "/", icon: Home, type: "link" as const },
  { name: "Calculators", href: "#", icon: Calculator, type: "drawer" as const },
  { name: "Engines", href: "#", icon: LayoutGrid, type: "drawer" as const },
  { name: "Vaathi", href: "/vaathi", icon: GraduationCap, type: "link" as const },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawer, setMobileDrawer] = useState<string | null>(null);
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [session, setSession] = useState<any>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

  // Check PWA Installation Status & Supabase Session
  useEffect(() => {
    async function loadAuth() {
      const s = await getCurrentUserSession();
      setSession(s);
    }
    loadAuth();

    const checkPwa = () => {
      if (typeof window === "undefined") return;
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true ||
        localStorage.getItem("valarchix_is_installed") === "true";
      setIsPwaInstalled(isStandalone);
    };

    checkPwa();
    window.addEventListener("valarchix_pwa_status_change", checkPwa);
    return () => window.removeEventListener("valarchix_pwa_status_change", checkPwa);
  }, [pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Theme on mount
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

  const handleDropdownHover = (name: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(name);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign in trigger error:", err);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setSession(null);
    setProfileDropdownOpen(false);
  };

  const handleInstallPwa = () => {
    window.dispatchEvent(new Event("valarchix_open_pwa_modal"));
  };

  const closeDrawer = () => {
    setMobileDrawer(null);
    setSidebarDrawerOpen(false);
  };

  const engineItems = NAV_ITEMS.find(g => g.category === "Intelligence Engines")?.items || [];

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "User";
  const userEmail = session?.user?.email || "";
  const userAvatar = session?.user?.user_metadata?.avatar_url;
  const userInitial = userName.charAt(0).toUpperCase() || "U";

  return (
    <>
      {/* ===== MAIN NAVBAR ===== */}
      <header className="sticky top-0 z-40 w-full border-b border-border-navy bg-navy-bg/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6 md:px-8">
          
          {/* Logo that doubles as the Sidebar Drawer Trigger */}
          <button
            onClick={() => setSidebarDrawerOpen(true)}
            className="flex items-center gap-3 group cursor-pointer text-left focus:outline-none"
            title="Click to open full ValarchiX Suite Directory"
          >
            <div className="relative">
              <img src="/logo.svg" alt="ValarchiX" className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl shadow-sm group-hover:scale-105 transition-transform" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald border-2 border-navy-bg"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-heading flex items-center gap-1 group-hover:text-emerald transition-colors">
                Valarchi<span className="text-emerald font-black">X</span>
                <ChevronDown size={16} className="text-muted-grey group-hover:text-emerald group-hover:translate-y-0.5 transition" />
              </span>
            </div>
          </button>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-2 font-bold text-sm text-muted-grey">
            
            {/* 1. Plan your goals dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleDropdownHover("goals")}
              onMouseLeave={handleDropdownLeave}
            >
              <button 
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition hover:text-heading cursor-pointer ${
                  openDropdown === "goals" ? "text-heading font-black" : ""
                }`}
              >
                <span>Plan your goals</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${openDropdown === "goals" ? "rotate-180 text-heading" : ""}`} />
              </button>

              {openDropdown === "goals" && (
                <div className="absolute top-full left-0 mt-1.5 w-[440px] rounded-3xl mega-menu-dropdown p-4 shadow-2xl animate-slideDown z-50">
                  <div className="grid grid-cols-2 gap-2">
                    {FUNDSINDIA_GOALS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-navy-light transition group cursor-pointer"
                        >
                          <div className="p-2 rounded-xl bg-emerald/10 text-emerald group-hover:bg-emerald group-hover:text-slate-950 transition shrink-0">
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-black text-heading group-hover:text-emerald transition">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-muted-grey leading-tight mt-0.5">{item.desc}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Our Engines Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleDropdownHover("engines")}
              onMouseLeave={handleDropdownLeave}
            >
              <button 
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition hover:text-heading cursor-pointer ${
                  openDropdown === "engines" ? "text-heading font-black" : ""
                }`}
              >
                <span>Our engines</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${openDropdown === "engines" ? "rotate-180 text-heading" : ""}`} />
              </button>

              {openDropdown === "engines" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[480px] rounded-3xl mega-menu-dropdown p-4 shadow-2xl animate-slideDown z-50">
                  <div className="grid grid-cols-2 gap-2.5">
                    {engineItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-start gap-3 p-3 rounded-2xl hover:bg-navy-light transition group cursor-pointer"
                        >
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition shrink-0 mt-0.5">
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-black text-heading group-hover:text-emerald transition flex items-center gap-1.5">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-muted-grey leading-tight mt-0.5">{item.desc}</div>
                          </div>
                        </Link>
                      );
                    })}
                    
                    <Link
                      href="/vaathi"
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-start gap-3 p-3 rounded-2xl hover:bg-navy-light transition group cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-emerald/10 text-emerald group-hover:bg-emerald group-hover:text-slate-950 transition shrink-0 mt-0.5">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-heading group-hover:text-emerald transition">
                          Valarchi Vaathi 🎓
                        </div>
                        <div className="text-[11px] text-muted-grey leading-tight mt-0.5">AI Financial Mentor</div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Calculators Comprehensive Mega-Menu */}
            <div 
              className="relative"
              onMouseEnter={() => handleDropdownHover("calculators")}
              onMouseLeave={handleDropdownLeave}
            >
              <button 
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition hover:text-heading cursor-pointer ${
                  openDropdown === "calculators" ? "text-heading font-black" : ""
                }`}
              >
                <span>Calculators</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${openDropdown === "calculators" ? "rotate-180 text-heading" : ""}`} />
              </button>

              {openDropdown === "calculators" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[940px] max-w-[95vw] rounded-3xl mega-menu-dropdown p-5 shadow-2xl animate-slideDown z-50">
                  <div className="grid grid-cols-4 gap-4">
                    
                    {/* Column 1: Wealth & Compounding */}
                    <div className="space-y-2">
                      <div className="text-xs font-black uppercase tracking-wider text-emerald px-2 pb-1 border-b border-border-navy/60">
                        Wealth &amp; Compounding
                      </div>
                      <div className="space-y-0.5">
                        {[
                          { name: "SIP & FD Simulator", href: "/sip", icon: Percent },
                          { name: "Step Up SIP", href: "/step-up-sip", icon: ArrowUpRight },
                          { name: "Compound Interest", href: "/compound-interest", icon: TrendingUp },
                          { name: "Cost of Delay", href: "/cost-of-delay", icon: Clock },
                          { name: "Child Legacy Engine", href: "/child-legacy", icon: Baby },
                          { name: "Recurring Deposit (RD)", href: "/rd", icon: Percent },
                          { name: "ROI & CAGR Metric", href: "/roi", icon: TrendingUp },
                          { name: "XIRR Irregular Return", href: "/xirr", icon: Zap },
                        ].map((c) => (
                          <Link
                            key={c.name}
                            href={c.href}
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-navy-light text-xs font-bold text-heading hover:text-emerald transition group"
                          >
                            <c.icon size={14} className="text-emerald shrink-0" />
                            <span className="truncate">{c.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Budgeting & Cash Flow */}
                    <div className="space-y-2 border-l border-border-navy/50 pl-3.5">
                      <div className="text-xs font-black uppercase tracking-wider text-teal-400 px-2 pb-1 border-b border-border-navy/60">
                        Budgeting &amp; Cash Flow
                      </div>
                      <div className="space-y-0.5">
                        {[
                          { name: "Latte Factor Spends", href: "/latte-factor", icon: Coffee },
                          { name: "Emergency Fund", href: "/emergency-fund", icon: ShieldAlert },
                          { name: "Rent vs Buy Housing", href: "/rent-vs-buy", icon: Home },
                          { name: "Inflation Calculator", href: "/inflation", icon: BarChart2 },
                          { name: "Credit Card Trap", href: "/credit-card", icon: CreditCard },
                          { name: "Debt Payoff Optimizer", href: "/debt-payoff", icon: Scissors },
                          { name: "Human Life Value (HLV)", href: "/hlv", icon: HeartPulse },
                          { name: "FIRE Early Retirement", href: "/fire", icon: Flame },
                        ].map((b) => (
                          <Link
                            key={b.name}
                            href={b.href}
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-navy-light text-xs font-bold text-heading hover:text-teal-400 transition group"
                          >
                            <b.icon size={14} className="text-teal-400 shrink-0" />
                            <span className="truncate">{b.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Retirement & Sovereign Schemes */}
                    <div className="space-y-2 border-l border-border-navy/50 pl-3.5">
                      <div className="text-xs font-black uppercase tracking-wider text-indigo-400 px-2 pb-1 border-b border-border-navy/60">
                        Retirement &amp; Schemes
                      </div>
                      <div className="space-y-0.5">
                        {[
                          { name: "PPF (15-Yr Sovereign)", href: "/ppf", icon: Coins },
                          { name: "NPS Pension Scheme", href: "/nps", icon: TrendingUp },
                          { name: "EPF Corpus Calculator", href: "/epf", icon: Coins },
                          { name: "Sukanya Samriddhi (SSY)", href: "/ssy", icon: Coins },
                          { name: "SWP Drawdown Planner", href: "/swp", icon: ArrowDownLeft },
                          { name: "APY Pension Simulator", href: "/apy", icon: Coins },
                          { name: "Senior Citizens (SCSS)", href: "/scss", icon: Coins },
                          { name: "Gratuity Math", href: "/gratuity", icon: Coins },
                        ].map((s) => (
                          <Link
                            key={s.name}
                            href={s.href}
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-navy-light text-xs font-bold text-heading hover:text-indigo-400 transition group"
                          >
                            <s.icon size={14} className="text-indigo-400 shrink-0" />
                            <span className="truncate">{s.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 4: Tax, Debt & Analyzers */}
                    <div className="space-y-2 border-l border-border-navy/50 pl-3.5">
                      <div className="text-xs font-black uppercase tracking-wider text-amber-500 px-2 pb-1 border-b border-border-navy/60">
                        Tax, Debt &amp; Loans
                      </div>
                      <div className="space-y-0.5">
                        {[
                          { name: "Tax Regime Hub (Old/New)", href: "/tax", icon: Calculator },
                          { name: "HRA Exemption Math", href: "/hra", icon: Calculator },
                          { name: "Loan EMI Simulator", href: "/emi", icon: Landmark },
                          { name: "Advanced Income Tax", href: "/income-tax", icon: Calculator },
                          { name: "TDS Deductor Math", href: "/tds", icon: Calculator },
                          { name: "NSC Certificate", href: "/nsc", icon: Coins },
                          { name: "Mutual Funds Screener", href: "/mutual-funds", icon: Layers },
                          { name: "Debt Funds Analyzer", href: "/debt-funds", icon: Shield },
                        ].map((t) => (
                          <Link
                            key={t.name}
                            href={t.href}
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-navy-light text-xs font-bold text-heading hover:text-amber-500 transition group"
                          >
                            <t.icon size={14} className="text-amber-500 shrink-0" />
                            <span className="truncate">{t.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                  </div>

                  <div className="mt-4 pt-3 border-t border-border-navy flex items-center justify-between text-xs">
                    <span className="text-muted-grey text-xs">Looking for all calculators &amp; simulators?</span>
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        setSidebarDrawerOpen(true);
                      }}
                      className="font-black text-emerald hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Complete Suite Directory</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Link: Vaathi AI */}
            <Link 
              href="/vaathi" 
              className={`px-4 py-2.5 rounded-xl transition hover:text-heading ${pathname === "/vaathi" ? "text-emerald font-black" : ""}`}
            >
              Vaathi 🎓
            </Link>

            {/* Direct Link: About Us */}
            <Link 
              href="/beyond-fds" 
              className={`px-4 py-2.5 rounded-xl transition hover:text-heading ${pathname === "/beyond-fds" ? "text-emerald font-black" : ""}`}
            >
              About Us
            </Link>
          </nav>

          {/* Right Action Buttons: PDF, Theme Toggle & Google Profile Dropdown */}
          <div className="flex items-center gap-3">
            {pathname !== "/" && (
              <button
                onClick={() => window.print()}
                className="hidden xl:flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border-navy bg-navy-card/50 text-muted-grey hover:text-heading transition-all text-xs font-bold cursor-pointer shadow-sm"
                title="Download PDF Report"
              >
                <Download size={14} className="text-emerald" />
                <span>PDF</span>
              </button>
            )}
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full border border-border-navy bg-navy-card/50 text-emerald hover:text-heading hover:border-emerald/40 transition-all cursor-pointer shadow-sm"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* ===== GOOGLE AUTH PROFILE / SIGN IN BUTTON ===== */}
            <div className="relative" ref={profileDropdownRef}>
              {session?.user ? (
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-border-navy bg-navy-card hover:bg-navy-light text-heading transition shadow-sm cursor-pointer"
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-7 h-7 rounded-full object-cover border border-emerald/50" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald to-indigo-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-inner">
                      {userInitial}
                    </div>
                  )}
                  <span className="font-extrabold text-xs sm:text-sm hidden sm:inline max-w-[130px] truncate">
                    {userName}
                  </span>
                  <ChevronDown size={14} className={`text-muted-grey transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="bg-indigo-600 hover:bg-indigo-500 !text-white text-xs sm:text-sm font-black px-5 py-2.5 rounded-full transition shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </button>
              )}

              {/* Floating Sikkanam Profile Card Dropdown */}
              {profileDropdownOpen && session?.user && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-3xl bg-navy-card border border-border-navy p-5 shadow-2xl animate-slideDown z-50 space-y-4">
                  
                  {/* User Details */}
                  <div className="space-y-1">
                    <div className="font-black text-base text-heading">
                      {userName}
                    </div>
                    {userEmail && (
                      <div className="text-xs text-muted-grey font-mono truncate">
                        {userEmail}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border-navy pt-3 space-y-2.5">
                    {/* PWA App Installation Status */}
                    {isPwaInstalled ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald/10 border border-emerald/30 rounded-xl text-emerald font-bold text-xs">
                        <span className="flex items-center gap-1.5">
                          <Smartphone size={15} /> ValarchiX App
                        </span>
                        <span className="flex items-center gap-1 font-black">
                          Installed ✅
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleInstallPwa();
                        }}
                        className="flex items-center justify-between p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer w-full text-left"
                      >
                        <span className="flex items-center gap-1.5 text-heading">
                          <Smartphone size={15} className="text-rose-500" /> Install ValarchiX
                        </span>
                        <span className="font-black text-rose-500">
                          Not Installed 📲
                        </span>
                      </button>
                    )}

                    {/* Sign Out Button (Minimalist like Sikkanam) */}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-2 p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl font-bold text-xs transition cursor-pointer w-full text-left"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ===== SLIDE-OVER SIDEBAR DRAWER ===== */}
      {sidebarDrawerOpen && (
        <>
          <div
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity"
          />

          <aside className="fixed top-0 left-0 bottom-0 z-50 w-80 sm:w-96 bg-navy-card border-r border-border-navy shadow-2xl flex flex-col animate-slideDown overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border-navy bg-navy-bg/50">
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="ValarchiX" className="h-8 w-8 rounded-xl" />
                <span className="text-base font-black text-heading">
                  Valarchi<span className="text-emerald">X</span> Complete Suite
                </span>
              </div>
              <button 
                onClick={closeDrawer}
                className="p-2 rounded-xl bg-navy-bg hover:bg-navy-light text-muted-grey hover:text-heading transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {NAV_ITEMS.map((group) => (
                <div key={group.category} className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald px-2 py-1">
                    {group.category}
                  </h4>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={closeDrawer}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                            isActive
                              ? "bg-emerald text-slate-950 shadow-sm"
                              : "text-muted-grey hover:bg-navy-light hover:text-heading"
                          }`}
                        >
                          <Icon size={16} className={isActive ? "text-slate-950" : "text-muted-grey"} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border-navy bg-navy-bg text-center text-xs text-muted-grey font-semibold">
              💡 «We don't tell what to pick, we tell how to pick»
            </div>
          </aside>
        </>
      )}

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
                    router.push(tab.href);
                  } else {
                    setMobileDrawer(mobileDrawer === tab.name ? null : tab.name);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1 w-16 py-1.5 rounded-2xl transition-all ${
                  isActive || isDrawerOpen
                    ? "text-emerald font-black"
                    : "text-muted-grey hover:text-heading"
                }`}
              >
                <Icon size={20} strokeWidth={isActive || isDrawerOpen ? 2.5 : 1.8} />
                <span className="text-[11px] font-bold">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ===== MOBILE DRAWER (Dedicated Sheets for Engines & Calculators) ===== */}
      {mobileDrawer && (
        <>
          <div
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md md:hidden"
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-navy-card border-t border-border-navy rounded-t-3xl max-h-[78vh] overflow-y-auto shadow-2xl safe-area-bottom p-5 space-y-4 animate-slideDown">
            {/* Top Sheet Drag Handle */}
            <div className="w-12 h-1.5 bg-border-navy rounded-full mx-auto mb-1"></div>

            <div className="flex items-center justify-between border-b border-border-navy pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald"></div>
                <h3 className="text-base font-black text-heading">
                  {mobileDrawer === "Engines" ? "Intelligence Engines" : "Financial Calculators"}
                </h3>
              </div>
              <button 
                onClick={closeDrawer} 
                className="p-1.5 bg-navy-bg hover:bg-navy-light rounded-xl text-muted-grey hover:text-heading transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* If Mobile Drawer is Engines */}
            {mobileDrawer === "Engines" && (
              <div className="space-y-2.5">
                {engineItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeDrawer}
                      className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-emerald text-slate-950 border-emerald shadow-md"
                          : "card-tile-neutral hover:bg-navy-light"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${isActive ? "bg-slate-950/15 text-slate-950" : "bg-indigo-500/10 text-indigo-400"} shrink-0 mt-0.5`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm ${isActive ? "text-slate-950" : "text-heading"}`}>
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isActive ? "bg-slate-950 text-emerald" : "bg-indigo-950 text-indigo-300"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isActive ? "text-slate-900/80" : "text-muted-grey"}`}>
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}

                <Link
                  href="/vaathi"
                  onClick={closeDrawer}
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all ${
                    pathname === "/vaathi"
                      ? "bg-emerald text-slate-950 border-emerald shadow-md"
                      : "card-tile-neutral hover:bg-navy-light"
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-emerald/10 text-emerald shrink-0 mt-0.5">
                    <GraduationCap size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-sm text-heading">Valarchi Vaathi 🎓</span>
                    <p className="text-xs text-muted-grey mt-0.5">AI Financial Literacy & Planning Mentor</p>
                  </div>
                </Link>
              </div>
            )}

            {/* If Mobile Drawer is Calculators */}
            {mobileDrawer === "Calculators" && (
              <div className="space-y-4">
                {/* Wealth & Compounding */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald block px-1">
                    Wealth &amp; Compounding
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "SIP & FD", href: "/sip", icon: Percent },
                      { name: "Step Up SIP", href: "/step-up-sip", icon: ArrowUpRight },
                      { name: "Compound Interest", href: "/compound-interest", icon: TrendingUp },
                      { name: "Cost of Delay", href: "/cost-of-delay", icon: Clock },
                      { name: "Child Legacy", href: "/child-legacy", icon: Baby },
                      { name: "RD Simulator", href: "/rd", icon: Percent },
                      { name: "ROI & CAGR", href: "/roi", icon: TrendingUp },
                      { name: "XIRR Return", href: "/xirr", icon: Zap },
                    ].map((c) => (
                      <Link
                        key={c.name}
                        href={c.href}
                        onClick={closeDrawer}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          pathname === c.href ? "bg-emerald text-slate-950 border-emerald" : "card-tile-neutral"
                        }`}
                      >
                        <c.icon size={15} className={pathname === c.href ? "text-slate-950" : "text-emerald"} />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Budgeting & Cash Flow */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-400 block px-1">
                    Budgeting &amp; Cash Flow
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "Latte Factor", href: "/latte-factor", icon: Coffee },
                      { name: "Emergency Fund", href: "/emergency-fund", icon: ShieldAlert },
                      { name: "Rent vs Buy", href: "/rent-vs-buy", icon: Home },
                      { name: "Inflation Calculator", href: "/inflation", icon: BarChart2 },
                      { name: "Credit Card Trap", href: "/credit-card", icon: CreditCard },
                      { name: "Debt Payoff", href: "/debt-payoff", icon: Scissors },
                      { name: "Human Life (HLV)", href: "/hlv", icon: HeartPulse },
                      { name: "FIRE Retirement", href: "/fire", icon: Flame },
                    ].map((b) => (
                      <Link
                        key={b.name}
                        href={b.href}
                        onClick={closeDrawer}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          pathname === b.href ? "bg-teal-600 text-white border-teal-500" : "card-tile-neutral"
                        }`}
                      >
                        <b.icon size={15} className={pathname === b.href ? "text-white" : "text-teal-400"} />
                        <span className="truncate">{b.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Retirement & Schemes */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-400 block px-1">
                    Retirement &amp; Schemes
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "PPF (15-Yr)", href: "/ppf", icon: Coins },
                      { name: "NPS Scheme", href: "/nps", icon: TrendingUp },
                      { name: "EPF Corpus", href: "/epf", icon: Coins },
                      { name: "SSY Scheme", href: "/ssy", icon: Coins },
                      { name: "SWP Planner", href: "/swp", icon: ArrowDownLeft },
                      { name: "APY Pension", href: "/apy", icon: Coins },
                      { name: "SCSS Seniors", href: "/scss", icon: Coins },
                      { name: "Gratuity", href: "/gratuity", icon: Coins },
                    ].map((s) => (
                      <Link
                        key={s.name}
                        href={s.href}
                        onClick={closeDrawer}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          pathname === s.href ? "bg-indigo-600 text-white border-indigo-500" : "card-tile-neutral"
                        }`}
                      >
                        <s.icon size={15} className={pathname === s.href ? "text-white" : "text-indigo-400"} />
                        <span className="truncate">{s.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Tax, Debt & Loans */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500 block px-1">
                    Tax, Debt &amp; Loans
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "Tax Regime Hub", href: "/tax", icon: Calculator },
                      { name: "HRA Exemption", href: "/hra", icon: Calculator },
                      { name: "Loan EMI", href: "/emi", icon: Landmark },
                      { name: "Advanced Income Tax", href: "/income-tax", icon: Calculator },
                      { name: "TDS Deductor", href: "/tds", icon: Calculator },
                      { name: "NSC Certificate", href: "/nsc", icon: Coins },
                      { name: "Mutual Funds", href: "/mutual-funds", icon: Layers },
                      { name: "Debt Funds", href: "/debt-funds", icon: Shield },
                    ].map((t) => (
                      <Link
                        key={t.name}
                        href={t.href}
                        onClick={closeDrawer}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          pathname === t.href ? "bg-amber-600 text-white border-amber-500" : "card-tile-neutral"
                        }`}
                      >
                        <t.icon size={15} className={pathname === t.href ? "text-white" : "text-amber-500"} />
                        <span className="truncate">{t.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setMobileDrawer(null);
                      setSidebarDrawerOpen(true);
                    }}
                    className="w-full py-3 bg-navy-bg hover:bg-navy-light border border-border-navy rounded-2xl text-xs font-black text-emerald flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>View All 56+ Tools in Suite</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </>
  );
}
