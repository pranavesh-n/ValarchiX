"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Shield,
  Percent,
  Target,
  Hourglass,
  PieChart,
  Calculator,
  Coins,
  TrendingUp,
  ArrowDownLeft,
  ArrowRight,
  Landmark,
  ArrowUpRight,
  Flame,
  ShieldAlert,
  Coffee,
  Clock,
  BarChart2,
  Scissors,
  CreditCard,
  HeartPulse,
  Zap,
  Sparkles,
  ChevronRight,
  Baby
} from "lucide-react";
import { formatINR, formatINRWords } from "@/lib/engine/numeric";

const SUITE_CATEGORIES = [
  {
    id: "wealth",
    title: "Wealth & Compounding",
    badge: "8 Tools",
    color: "text-emerald",
    bg: "bg-emerald/10 border-emerald/30",
    desc: "Exponential growth, SIP step-up solvers, and irregular cash flow metrics.",
    items: [
      { name: "SIP & FD Simulator", href: "/sip", icon: Percent, desc: "Systematic monthly investing compounding" },
      { name: "Step Up SIP", href: "/step-up-sip", icon: ArrowUpRight, desc: "Annual income increment compounding" },
      { name: "Compound Interest", href: "/compound-interest", icon: TrendingUp, desc: "Exponential curve time simulator" },
      { name: "Cost of Delay", href: "/cost-of-delay", icon: Clock, desc: "Wealth permanently lost by waiting" },
      { name: "Child Legacy Engine", href: "/child-legacy", icon: Baby, desc: "18-25 yr generational compounding" },
      { name: "Recurring Deposit (RD)", href: "/rd", icon: Percent, desc: "Bank & Post Office RD math" },
      { name: "ROI & CAGR Metric", href: "/roi", icon: TrendingUp, desc: "Annualized point-to-point returns" },
      { name: "XIRR Irregular Return", href: "/xirr", icon: Zap, desc: "Accurate realized cash flow XIRR" }
    ]
  },
  {
    id: "budgeting",
    title: "Budgeting & Daily Cash Flow",
    badge: "8 Tools",
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/30",
    desc: "Leakage detection, emergency buffer shields, and loan payoff plans.",
    items: [
      { name: "Latte Factor Spends", href: "/latte-factor", icon: Coffee, desc: "Small daily leak compounding to wealth" },
      { name: "Emergency Fund", href: "/emergency-fund", icon: ShieldAlert, desc: "3-6 month liquid fortress requirement" },
      { name: "Rent vs Buy Housing", href: "/rent-vs-buy", icon: Landmark, desc: "Opportunity cost of real estate vs equity" },
      { name: "Inflation Calculator", href: "/inflation", icon: BarChart2, desc: "Future purchasing power erosion" },
      { name: "Credit Card Trap", href: "/credit-card", icon: CreditCard, desc: "42% annualized interest trap solver" },
      { name: "Debt Payoff Optimizer", href: "/debt-payoff", icon: Scissors, desc: "Snowball vs Avalanche debt freedom" },
      { name: "Human Life Value (HLV)", href: "/hlv", icon: HeartPulse, desc: "Income replacement pure term cover" },
      { name: "FIRE Early Retirement", href: "/fire", icon: Flame, desc: "25x-30x annual spend corpus milestones" }
    ]
  },
  {
    id: "retirement",
    title: "Retirement & Sovereign Schemes",
    badge: "8 Tools",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    desc: "Government-backed sovereign compounding and retirement drawdown plans.",
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
    id: "tax",
    title: "Tax, Debt & Analyzers",
    badge: "8 Tools",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    desc: "Direct tax regime optimization, fund screeners, and loan amortizations.",
    items: [
      { name: "Tax Regime Hub (Old vs New)", href: "/tax", icon: Calculator, desc: "Comparative deduction & surcharge math" },
      { name: "HRA Exemption Math", href: "/hra", icon: Calculator, desc: "House rent allowance tax saving optimization" },
      { name: "Loan EMI Simulator", href: "/emi", icon: Landmark, desc: "Principal vs interest amortization split" },
      { name: "Advanced Income Tax", href: "/income-tax", icon: Calculator, desc: "Section 80C, 80D, 87A rebate & cess" },
      { name: "TDS Deductor Math", href: "/tds", icon: Calculator, desc: "Tax deducted at source on payments" },
      { name: "NSC Certificate", href: "/nsc", icon: Coins, desc: "5-year national savings post office" },
      { name: "Mutual Funds Screener", href: "/mutual-funds", icon: Layers, desc: "Direct vs Regular, TER drag & rolling returns" },
      { name: "Debt Funds Analyzer", href: "/debt-funds", icon: Shield, desc: "Yield to maturity & Macaulay duration" }
    ]
  }
];

export default function HomePage() {
  const [quickSip, setQuickSip] = useState(10000);
  const [quickTenure, setQuickTenure] = useState(15);
  const [quickReturnRate, setQuickReturnRate] = useState(12);
  const [activeCategoryTab, setActiveCategoryTab] = useState("wealth");

  // Compounding Simulator Calculation
  const quickProjection = useMemo(() => {
    const monthlyRate = quickReturnRate / 100 / 12;
    const months = quickTenure * 12;
    const investedAmount = quickSip * months;
    const futureValue = quickSip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const wealthGained = futureValue - investedAmount;

    return {
      investedAmount: Math.round(investedAmount),
      futureValue: Math.round(futureValue),
      wealthGained: Math.round(wealthGained),
      gainRatio: (futureValue / investedAmount).toFixed(1),
    };
  }, [quickSip, quickTenure, quickReturnRate]);

  return (
    <div className="space-y-8 sm:space-y-12 animate-fadeIn pb-12">
      
      {/* =========================================================================
          HERO PRESENTATION SECTION
          ========================================================================= */}
      <section className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headline & CTAs */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 bg-emerald/10 border border-emerald/30 text-emerald px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Next-Gen Financial Knowledge OS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-heading tracking-tight leading-tight">
              Invest with clarity.<br />
              Plan for your <span className="text-emerald">Financial DNA</span> &amp; Goals.
            </h1>

            <p className="text-sm sm:text-base text-muted-grey leading-relaxed">
              &laquo;We don&apos;t tell what to pick, we tell how to pick&raquo; &mdash; deterministic intelligence, inflation-proof roadmaps, and zero-knowledge client-side encryption.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/financial-dna"
                className="bg-indigo-600 hover:bg-indigo-500 !text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
              >
                <span>Start Financial DNA</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/goalx"
                className="bg-navy-bg hover:bg-navy-light text-heading border border-border-navy font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl transition flex items-center gap-2 cursor-pointer"
              >
                <Target size={16} className="text-emerald" />
                <span>Explore GoalX</span>
              </Link>
              <Link
                href="/vaathi"
                className="text-xs sm:text-sm font-bold text-muted-grey hover:text-heading px-3 py-2 transition flex items-center gap-1.5"
              >
                <span>Ask Vaathi AI 🎓</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right Column: 3 Live Proof Pillars */}
          <div className="lg:col-span-5 space-y-3">
            <div className="card-tile-neutral p-4 rounded-2xl border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-grey uppercase font-bold block">100% Client-Side Vault</span>
                <h4 className="text-sm font-black text-emerald">₹0 Data Leakage Risk</h4>
                <p className="text-[11px] text-muted-grey mt-0.5">AES-GCM 256-bit encrypted before storage</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-emerald/10 text-emerald rounded-full border border-emerald/30">
                Zero-Knowledge
              </span>
            </div>

            <div className="card-tile-neutral p-4 rounded-2xl border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-grey uppercase font-bold block">8 Deterministic Pillars</span>
                <h4 className="text-sm font-black text-indigo-400">Scientific DNA Scoring</h4>
                <p className="text-[11px] text-muted-grey mt-0.5">Emergency, needs, wants, term &amp; equity velocity</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/30">
                Objective Math
              </span>
            </div>

            <div className="card-tile-neutral p-4 rounded-2xl border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-grey uppercase font-bold block">56+ Calculators &amp; Engines</span>
                <h4 className="text-sm font-black text-amber-500">Instant Financial Clarity</h4>
                <p className="text-[11px] text-muted-grey mt-0.5">Category inflation, step-up roadmaps &amp; tax hubs</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/30">
                Full Suite
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          PROPERLY SEGREGATED 4-PILLAR FINANCIAL SUITE DIRECTORY
          ========================================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-border-navy pb-4">
          <div>
            <span className="text-xs font-black text-emerald uppercase tracking-wider block">
              Complete 30+ Tools Directory
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-heading mt-0.5">
              Strictly Segregated Financial Calculators &amp; Engines
            </h2>
            <p className="text-xs sm:text-sm text-muted-grey mt-0.5">
              Every tool is categorized by life intent — no messy dumping, completely focused.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {SUITE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryTab(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 border ${
                  activeCategoryTab === cat.id
                    ? `${cat.bg} ${cat.color} font-black shadow-sm`
                    : "bg-navy-card/60 text-muted-grey border-border-navy hover:text-heading"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Render Selected Category's 8 Clear Tools */}
        {SUITE_CATEGORIES.filter(c => c.id === activeCategoryTab).map((cat) => (
          <div key={cat.id} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <h3 className={`text-base font-black ${cat.color} flex items-center gap-2`}>
                  <span>{cat.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-card border border-border-navy text-muted-grey font-mono">
                    {cat.badge}
                  </span>
                </h3>
                <p className="text-xs text-muted-grey">{cat.desc}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {cat.items.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="card-tile-neutral p-4 rounded-2xl border hover:border-emerald/50 hover:bg-navy-light transition flex flex-col justify-between space-y-3 group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-navy-bg border border-border-navy flex items-center justify-center group-hover:scale-105 transition">
                        <Icon size={16} className={cat.color} />
                      </div>
                      <h4 className="font-black text-sm text-heading group-hover:text-emerald transition">
                        {tool.name}
                      </h4>
                      <p className="text-xs text-muted-grey leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border-navy/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-grey font-semibold">Open Engine</span>
                      <ChevronRight size={14} className="text-muted-grey group-hover:text-emerald group-hover:translate-x-1 transition" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* =========================================================================
          INTERACTIVE GROWTH & COMPOUNDING SIMULATOR
          ========================================================================= */}
      <section className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-navy pb-5">
          <div>
            <span className="text-xs font-bold text-emerald uppercase tracking-wider block">
              Compounding Power Simulator
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">
              Small Monthly Investments, Massive Future Freedom
            </h2>
            <p className="text-xs sm:text-sm text-muted-grey mt-1">
              Adjust monthly SIP and tenure to witness how compounding turns disciplined habits into exponential wealth.
            </p>
          </div>
          <Link
            href="/sip"
            className="bg-navy-bg hover:bg-navy-light text-heading border border-border-navy text-xs font-bold px-4 py-2 rounded-xl self-start md:self-auto transition shrink-0"
          >
            Open Full SIP Calculator ➔
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Sliders Column */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Monthly SIP Amount Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-muted-grey">Monthly Investment (SIP)</span>
                <span className="font-black text-heading font-mono text-base sm:text-lg">
                  {formatINR(quickSip)}/mo
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={100000}
                step={1000}
                value={quickSip}
                onChange={(e) => setQuickSip(Number(e.target.value))}
                className="w-full accent-emerald h-2 bg-navy-bg rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey font-mono">
                <span>₹1,000</span>
                <span>₹25,000</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-muted-grey">Investment Tenure (Years)</span>
                <span className="font-black text-heading font-mono text-base sm:text-lg">
                  {quickTenure} Years
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={quickTenure}
                onChange={(e) => setQuickTenure(Number(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-navy-bg rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey font-mono">
                <span>3 Yrs</span>
                <span>10 Yrs</span>
                <span>20 Yrs</span>
                <span>30 Yrs</span>
              </div>
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-muted-grey">Expected Return (% p.a.)</span>
                <span className="font-black text-emerald font-mono text-base sm:text-lg">
                  {quickReturnRate}% CAGR
                </span>
              </div>
              <div className="flex gap-2">
                {[10, 12, 14, 15].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setQuickReturnRate(rate)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      quickReturnRate === rate
                        ? "bg-indigo-600 !text-white border-indigo-500"
                        : "bg-navy-bg text-muted-grey border-border-navy hover:text-heading"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Projection Visual Summary Card */}
          <div className="lg:col-span-5 bg-navy-bg border border-border-navy rounded-3xl p-5 shadow-inner space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-muted-grey uppercase tracking-wider block">
                Total Projected Future Corpus
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald tracking-tight">
                {formatINRWords(quickProjection.futureValue)}
              </div>
              <div className="text-xs text-muted-grey font-mono">
                ₹{quickProjection.futureValue.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Progress Split */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-navy-card rounded-full overflow-hidden flex border border-border-navy p-0.5">
                <div
                  style={{ width: `${(quickProjection.investedAmount / quickProjection.futureValue) * 100}%` }}
                  className="bg-indigo-500 h-full rounded-l-full"
                ></div>
                <div
                  style={{ width: `${(quickProjection.wealthGained / quickProjection.futureValue) * 100}%` }}
                  className="bg-emerald h-full rounded-r-full"
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-indigo-400">● Invested: {formatINRWords(quickProjection.investedAmount)}</span>
                <span className="text-emerald font-bold">● Gain: {formatINRWords(quickProjection.wealthGained)}</span>
              </div>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="card-tile-neutral p-3 rounded-xl border">
                <span className="text-[10px] text-muted-grey uppercase font-bold block">Wealth Multiplier</span>
                <div className="text-base font-black text-heading mt-0.5">
                  {quickProjection.gainRatio}x Gain
                </div>
              </div>
              <div className="card-stat-emerald p-3 rounded-xl border">
                <span className="text-[10px] uppercase font-bold block opacity-80">Compounding Effect</span>
                <div className="text-base font-black mt-0.5">
                  {Math.round((quickProjection.wealthGained / quickProjection.futureValue) * 100)}% of Corpus
                </div>
              </div>
            </div>

            <Link
              href="/goalx"
              className="w-full bg-emerald hover:bg-emerald/90 text-slate-950 font-black text-xs py-3 rounded-2xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald/20 cursor-pointer"
            >
              <span>Convert to Inflation-Proof Goal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
