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
  Scale,
  GitCompare,
  Plane,
  Building,
  GraduationCap as BookIcon,
  LogOut,
  LogIn,
  CheckCircle2,
  Smartphone,
  BookOpen,
  ShieldCheck,
  Menu
} from "lucide-react";
import {
  getCurrentUserSession,
  signInWithGoogle,
  signOutUser
} from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import { getPrimaryFirstName, setCachedUserInfo } from "@/lib/passcode";

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
      { name: "Beyond FDs Masterclass", href: "/beyond-fds", icon: BookOpen, desc: "Real returns vs inflation & compounding math", badge: "Engine 6" },
    ]
  },
  {
    category: "Core & Learning",
    items: [
      { name: "Home Dashboard", href: "/", icon: Home, desc: "Financial Knowledge OS Overview" },
      { name: "Profile & Settings", href: "/profile", icon: ShieldCheck, desc: "Passcode lock, vault backup & account" },
      { name: "About ValarchiX", href: "/about", icon: Info, desc: "Mission, philosophy & zero-knowledge architecture" },
      { name: "Valarchi Vaathi 🎓", href: "/vaathi", icon: GraduationCap, desc: "AI financial literacy mentor" },
      { name: "Beyond FDs & Learning", href: "/beyond-fds", icon: Info, desc: "Real returns vs inflation & compounding" }
    ]
  },
  {
    category: "Screeners & Analyzers",
    items: [
      { name: "Mutual Funds Screener", href: "/mutual-funds", icon: Layers, desc: "Direct vs Regular, TER drag & 48 AMC Factsheets" },
      { name: "Debt Funds Analyzer", href: "/debt-funds", icon: Shield, desc: "Yield to maturity, duration & credit risk" },
      { name: "Portfolio Intelligence", href: "/portfolio-intelligence", icon: PieChart, desc: "CAS parser, true XIRR, overlap & drag" },
      { name: "Portfolio Simulator", href: "/portfolio-simulator", icon: Sliders, desc: "20-yr multi-asset stress test & backtest" },
      { name: "Tax Regime Hub", href: "/tax", icon: Calculator, desc: "Old vs New regime deduction & rebate solver" },
      { name: "Rent vs Buy Decision", href: "/rent-vs-buy", icon: Landmark, desc: "Real estate opportunity cost vs equity SIP" },
      { name: "Debt Payoff Optimizer", href: "/debt-payoff", icon: Scissors, desc: "Snowball vs Avalanche interest minimization" },
      { name: "Credit Card Debt Trap", href: "/credit-card", icon: CreditCard, desc: "42% annualized APR debt trap solver" }
    ]
  },
  {
    category: "Budgeting & Cash Flow",
    items: [
      { name: "Latte Factor Spends", href: "/latte-factor", icon: Coffee, desc: "Small daily leak compounding to wealth" },
      { name: "Emergency Fund Fortress", href: "/emergency-fund", icon: ShieldAlert, desc: "3-6 month liquid emergency buffer" },
      { name: "Inflation & Purchasing Power", href: "/inflation", icon: BarChart2, desc: "Future cost & purchasing power erosion" },
      { name: "Human Life Value (HLV)", href: "/hlv", icon: HeartPulse, desc: "Income replacement pure term cover" },
      { name: "FIRE Early Retirement", href: "/fire", icon: Flame, desc: "25x-30x annual spend corpus milestones" }
    ]
  },
  {
    category: "Wealth & Compounding",
    items: [
      { name: "SIP Simulator", href: "/sip", icon: Percent, desc: "Systematic investment plan compounding" },
      { name: "Fixed Deposit (FD)", href: "/fd", icon: Landmark, desc: "Bank & corporate FD growth with 0%-30% tax slabs" },
      { name: "SIP vs FD Comparison", href: "/sip-vs-fd", icon: Scale, desc: "Real purchasing power: Equity MF vs Bank FD" },
      { name: "Step Up SIP", href: "/step-up-sip", icon: ArrowUpRight, desc: "Annual income increment compounding" },
      { name: "Compound Interest", href: "/compound-interest", icon: TrendingUp, desc: "Exponential curve time simulator" },
      { name: "Cost of Delay", href: "/cost-of-delay", icon: Clock, desc: "Wealth permanently lost by waiting" },
      { name: "Child Legacy Engine", href: "/child-legacy", icon: Baby, desc: "18-25 yr generational compounding" },
      { name: "Recurring Deposit (RD)", href: "/rd", icon: Percent, desc: "Bank & Post Office RD growth" },
      { name: "ROI & CAGR Metric", href: "/roi", icon: TrendingUp, desc: "Annualized point-to-point returns" },
      { name: "XIRR Calculator", href: "/xirr", icon: Zap, desc: "Accurate realized cash flow XIRR" }
    ]
  },
  {
    category: "Retirement & Sovereign Schemes",
    items: [
      { name: "PPF (15-Yr Sovereign)", href: "/ppf", icon: Coins, desc: "15-year tax-free government compounding" },
      { name: "NPS Pension Scheme", href: "/nps", icon: TrendingUp, desc: "National Pension System Tier-1 corpus" },
      { name: "EPF Corpus Calculator", href: "/epf", icon: Coins, desc: "Employee provident fund retirement math" },
      { name: "Sukanya Samriddhi (SSY)", href: "/ssy", icon: Coins, desc: "Girl child 8.2% sovereign compounding" },
      { name: "SWP Drawdown Planner", href: "/swp", icon: ArrowDownLeft, desc: "Systematic monthly tax-efficient cash flow" },
      { name: "APY Pension Simulator", href: "/apy", icon: Coins, desc: "Guaranteed monthly lifelong pension" },
      { name: "Senior Citizens (SCSS)", href: "/scss", icon: Coins, desc: "Quarterly interest payout scheme" },
      { name: "Gratuity Mathematics", href: "/gratuity", icon: Coins, desc: "15/26 service tenure statutory math" }
    ]
  },
  {
    category: "Tax, Debt & Loans",
    items: [
      { name: "Tax Regime Hub (Old vs New)", href: "/tax", icon: Calculator, desc: "Comparative deduction & surcharge math" },
      { name: "HRA Exemption Math", href: "/hra", icon: Calculator, desc: "House rent allowance tax saving optimization" },
      { name: "Loan EMI Simulator", href: "/emi", icon: Landmark, desc: "Principal vs interest amortization split" },
      { name: "Advanced Income Tax", href: "/income-tax", icon: Calculator, desc: "Section 80C, 80D, 87A rebate & cess" },
      { name: "TDS Deductor Math", href: "/tds", icon: Calculator, desc: "Tax deducted at source on payments" },
      { name: "NSC Certificate", href: "/nsc", icon: Coins, desc: "5-year national savings post office" },
      { name: "POMIS Monthly Income", href: "/pomis", icon: Coins, desc: "Post Office 5-year guaranteed income scheme" },
      { name: "Goal Inflation Solver", href: "/goal", icon: Target, desc: "Real purchasing power future goal planning" }
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

const ANALYZER_ITEMS = [
  { name: "Mutual Funds Screener", href: "/mutual-funds", icon: Layers, desc: "Direct vs Regular, TER drag & 48 AMC Factsheets", color: "text-emerald", bg: "bg-emerald/10" },
  { name: "Debt Funds Analyzer", href: "/debt-funds", icon: Shield, desc: "Yield to maturity, duration & credit risk", color: "text-teal-400", bg: "bg-teal-500/10" },
  { name: "Portfolio Intelligence", href: "/portfolio-intelligence", icon: PieChart, desc: "CAS parser, true XIRR, overlap & concentration", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { name: "Portfolio Simulator", href: "/portfolio-simulator", icon: Sliders, desc: "20-yr multi-asset stress test & backtesting", color: "text-purple-400", bg: "bg-purple-500/10" },
  { name: "Tax Regime Hub", href: "/tax", icon: Calculator, desc: "Old vs New regime deduction & rebate solver", color: "text-amber-400", bg: "bg-amber-500/10" },
  { name: "Rent vs Buy Housing", href: "/rent-vs-buy", icon: Landmark, desc: "Real estate opportunity cost vs equity SIP", color: "text-blue-400", bg: "bg-blue-500/10" },
  { name: "Debt Payoff Optimizer", href: "/debt-payoff", icon: Scissors, desc: "Snowball vs Avalanche interest minimization", color: "text-rose-400", bg: "bg-rose-500/10" },
  { name: "Credit Card Trap", href: "/credit-card", icon: CreditCard, desc: "42% APR interest & minimum due solver", color: "text-rose-400", bg: "bg-rose-500/10" },
];

const BOTTOM_TABS = [
  { name: "Home", shortName: "Home", href: "/", icon: Home, type: "link" as const },
  { name: "Engines", shortName: "Engines", href: "#", icon: LayoutGrid, type: "drawer" as const },
  { name: "Screeners", shortName: "Tools", href: "#", icon: Layers, type: "drawer" as const },
  { name: "Calculators", shortName: "Calc", href: "#", icon: Calculator, type: "drawer" as const },
  { name: "Vaathi", shortName: "Vaathi", href: "/vaathi", icon: GraduationCap, type: "link" as const },
  { name: "Profile", shortName: "Profile", href: "/profile", icon: ShieldCheck, type: "link" as const },
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
    const supabase = createClient();

    async function loadAuth() {
      if (typeof window !== "undefined") {
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
            console.warn("Navigation exchangeCodeForSession:", e);
          }
        }

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
              console.warn("Navigation setSession from hash:", e);
            }
          }
        }
      }
      const s = await getCurrentUserSession();
      if (s?.user) {
        setSession(s);
        setCachedUserInfo(s.user);
      }
    }
    loadAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, newSession: any) => {
      setSession(newSession);
      if (newSession?.user) {
        setCachedUserInfo(newSession.user);
      }
    });

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
    return () => {
      window.removeEventListener("valarchix_pwa_status_change", checkPwa);
      subscription.unsubscribe();
    };
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

  const rawName = session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "User";
  const userName = session?.user ? getPrimaryFirstName(rawName) : "User";
  const userEmail = session?.user?.email || "";
  const userAvatar = session?.user?.user_metadata?.avatar_url;
  const userInitial = userName.charAt(0).toUpperCase() || "U";

  return (
    <>
      {/* ===== MAIN NAVBAR ===== */}
      <header className="sticky top-0 z-40 w-full border-b border-border-navy bg-navy-bg/95 backdrop-blur-md">
        <div className="max-w-[1680px] mx-auto flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10">
          
          {/* Logo that navigates directly to Home Page */}
          <Link
            href="/"
            className="flex items-center gap-3 group cursor-pointer text-left focus:outline-none shrink-0 active:scale-95 transition-transform"
            title="ValarchiX Home"
          >
            <div className="relative">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl overflow-hidden shadow-md ring-1 ring-border-navy/80 bg-slate-950 flex items-center justify-center group-hover:scale-105 group-hover:ring-emerald/40 transition-all duration-200">
                <img src="/logo.svg" alt="ValarchiX" className="h-full w-full object-contain" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald ring-2 ring-navy-bg"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-heading flex items-center gap-1 group-hover:text-emerald transition-colors">
                Valarchi<span className="text-emerald font-black">X</span>
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 font-bold text-xs xl:text-sm text-muted-grey">
            
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
                <div className="absolute top-full left-0 mt-1.5 w-[440px] max-w-[calc(100vw-2rem)] rounded-3xl mega-menu-dropdown p-4 shadow-2xl animate-slideDown z-50">
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
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all shrink-0">
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
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[520px] max-w-[calc(100vw-2rem)] rounded-3xl mega-menu-dropdown p-4 shadow-2xl animate-slideDown z-50 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    {engineItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-navy-light transition group cursor-pointer"
                        >
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all shrink-0 mt-0.5">
                            <Icon size={17} />
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
                  </div>
                  
                  <Link
                    href="/vaathi"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-emerald/10 border border-emerald/20 hover:bg-emerald/15 transition group cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-emerald text-slate-950 font-bold transition-transform group-hover:scale-110 shrink-0">
                      <GraduationCap size={18} className="text-slate-950" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-emerald transition">
                        Valarchi Vaathi 🎓 — AI Financial Mentor
                      </div>
                      <div className="text-[11px] text-muted-grey leading-tight mt-0.5">
                        Ask any real-world Indian tax, compounding, and investment question
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Screeners & Analyzers Mega-Menu */}
            <div 
              className="relative"
              onMouseEnter={() => handleDropdownHover("analyzers")}
              onMouseLeave={handleDropdownLeave}
            >
              <button 
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition hover:text-heading cursor-pointer ${
                  openDropdown === "analyzers" ? "text-heading font-black" : ""
                }`}
              >
                <span>Screeners &amp; Analyzers</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${openDropdown === "analyzers" ? "rotate-180 text-heading" : ""}`} />
              </button>

              {openDropdown === "analyzers" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[560px] max-w-[calc(100vw-2rem)] rounded-3xl mega-menu-dropdown p-4 shadow-2xl animate-slideDown z-50 space-y-2.5">
                  <div className="flex items-center justify-between px-2 pb-1 border-b border-border-navy/60">
                    <span className="text-xs font-black uppercase tracking-wider text-heading flex items-center gap-1.5">
                      <Layers size={14} className="text-emerald" />
                      <span>Screeners &amp; Financial Analyzers</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald bg-emerald/10 px-2.5 py-0.5 rounded-full border border-emerald/20">
                      8 Screeners &amp; Tools
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {ANALYZER_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-navy-light transition group cursor-pointer"
                        >
                          <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} border border-border-navy/60 group-hover:scale-110 transition-transform shrink-0 mt-0.5`}>
                            <Icon size={17} />
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

            {/* 4. Calculators Comprehensive Mega-Menu */}
            <div 
              className="relative"
              onMouseEnter={() => handleDropdownHover("calculators")}
              onMouseLeave={handleDropdownLeave}
            >
              <button 
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition hover:text-heading cursor-pointer ${
                  openDropdown === "calculators" ? "text-heading font-black" : ""
                }`}
              >
                <span>Calculators</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${openDropdown === "calculators" ? "rotate-180 text-heading" : ""}`} />
              </button>

              {openDropdown === "calculators" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[940px] max-w-[calc(100vw-2rem)] rounded-3xl mega-menu-dropdown p-5 shadow-2xl animate-slideDown z-50">
                  <div className="grid grid-cols-4 gap-4">
                    
                    {/* Column 1: Wealth & Compounding */}
                    <div className="space-y-2">
                      <div className="text-xs font-black uppercase tracking-wider text-emerald px-2 pb-1 border-b border-border-navy/60">
                        Wealth &amp; Compounding
                      </div>
                      <div className="space-y-0.5">
                        {[
                          { name: "SIP & FD Simulator", href: "/sip", icon: Percent },
                          { name: "SIP vs FD Comparison", href: "/sip-vs-fd", icon: Scale },
                          { name: "Fixed Deposit (FD)", href: "/fd", icon: Landmark },
                          { name: "Step Up SIP", href: "/step-up-sip", icon: ArrowUpRight },
                          { name: "Compound Interest", href: "/compound-interest", icon: TrendingUp },
                          { name: "Cost of Delay", href: "/cost-of-delay", icon: Clock },
                          { name: "Child Legacy Engine", href: "/child-legacy", icon: Baby },
                          { name: "Recurring Deposit (RD)", href: "/rd", icon: Percent },
                          { name: "ROI & CAGR Metric", href: "/roi", icon: TrendingUp },
                          { name: "XIRR Calculator", href: "/xirr", icon: Zap },
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

                    {/* Column 4: Tax, Debt & Loans */}
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
                          { name: "POMIS Monthly Income", href: "/pomis", icon: Coins },
                          { name: "Goal Inflation Solver", href: "/goal", icon: Target },
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

            {/* Direct Link: Profile */}
            <Link 
              href="/profile" 
              className={`px-4 py-2.5 rounded-xl transition hover:text-heading ${pathname === "/profile" ? "text-emerald font-black" : ""}`}
            >
              Profile
            </Link>
          </nav>

          {/* Right Action Buttons: PDF, Theme Toggle & Google Profile Dropdown */}
          <div className="flex items-center gap-3">
            {pathname && !["/", "/profile", "/about", "/disclaimer", "/auth", "/vaathi"].includes(pathname) && !pathname.startsWith("/auth") && (
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
              className="p-2 sm:p-2.5 rounded-full border border-border-navy bg-navy-card/50 text-emerald hover:text-heading hover:border-emerald/40 transition-all cursor-pointer shadow-sm shrink-0"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Mobile / Tablet Full Suite Menu Button */}
            <button
              type="button"
              onClick={() => setSidebarDrawerOpen(true)}
              className="lg:hidden p-2 sm:p-2.5 rounded-full border border-border-navy bg-navy-card/60 hover:bg-navy-light text-heading hover:border-emerald/40 transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
              title="All 56+ Tools & Categories"
              aria-label="All 56+ Tools & Categories"
            >
              <Menu size={18} />
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
                  type="button"
                  onClick={() => signInWithGoogle("/profile")}
                  className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 dark:border-white/15 text-xs sm:text-sm font-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition shadow-md flex items-center gap-2.5 cursor-pointer inline-flex"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
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
                    {/* Link to Full Profile Page */}
                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center justify-between p-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-xs font-black text-indigo-400 transition cursor-pointer w-full text-left"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={15} /> Open Profile &amp; Security OS
                      </span>
                      <ChevronRight size={14} />
                    </Link>

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

                    {/* Sign Out Button */}
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
        <div className="flex items-center justify-between max-w-lg mx-auto h-16 px-1.5">
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
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 max-w-[64px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                  isActive || isDrawerOpen
                    ? "text-emerald font-black"
                    : "text-muted-grey hover:text-heading"
                }`}
              >
                <Icon size={18} className="sm:w-5 sm:h-5 shrink-0" strokeWidth={isActive || isDrawerOpen ? 2.5 : 1.8} />
                <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight whitespace-nowrap">
                  {tab.shortName || tab.name}
                </span>
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
                  {mobileDrawer === "Engines" ? "Intelligence Engines" : mobileDrawer === "Analyzers" || mobileDrawer === "Screeners" ? "Screeners & Analyzers" : "Financial Calculators"}
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
                      <div className={`p-2.5 rounded-xl ${isActive ? "bg-slate-950/15 text-slate-950" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"} shrink-0 mt-0.5`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm ${isActive ? "text-slate-950" : "text-heading"}`}>
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isActive 
                                ? "bg-slate-950 text-emerald" 
                                : "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50"
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

            {/* If Mobile Drawer is Screeners / Analyzers */}
            {(mobileDrawer === "Analyzers" || mobileDrawer === "Screeners") && (
              <div className="space-y-2.5">
                {ANALYZER_ITEMS.map((item) => {
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
                      <div className={`p-2.5 rounded-xl ${isActive ? "bg-slate-950/15 text-slate-950" : `${item.bg} ${item.color}`} shrink-0 mt-0.5`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className={`font-black text-sm block ${isActive ? "text-slate-950" : "text-heading"}`}>
                          {item.name}
                        </span>
                        <p className={`text-xs mt-0.5 ${isActive ? "text-slate-900/80" : "text-muted-grey"}`}>
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
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
                      { name: "SIP vs FD", href: "/sip-vs-fd", icon: Scale },
                      { name: "Fixed Deposit", href: "/fd", icon: Landmark },
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
                      { name: "POMIS Income", href: "/pomis", icon: Coins },
                      { name: "Goal Solver", href: "/goal", icon: Target },
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
