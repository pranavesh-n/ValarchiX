"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUserSession } from "@/lib/supabase/auth";
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
  Wallet,
  Coffee,
  Home as HomeIcon,
  Clock,
  BarChart2,
  Scissors,
  CreditCard,
  HeartPulse,
  Zap,
  Info,
  Scale,
  AlertTriangle
} from "lucide-react";

const STATS = [
  { value: "22+", label: "Financial Calculators" },
  { value: "500+", label: "Mutual Funds Indexed" },
  { value: "100% Safe", label: "No Stock-Picking Risk" },
  { value: "Dynamic", label: "Goal & Pension Math" },
  { value: "Accurate", label: "Regime Tax Rules" }
];

const MODEL_ASSUMPTIONS = [
  {
    title: "Constant CAGR vs Market Volatility",
    desc: "Calculators assume a fixed annual compounding return (e.g., 12% p.a.). Real-world stock market returns fluctuate year-on-year with sequence-of-returns risk.",
    icon: TrendingUp,
    badge: "Compounding Limit",
    color: "border-emerald/30 bg-emerald/5"
  },
  {
    title: "Inflation Baseline (6% CPI)",
    desc: "Default models assume a baseline inflation rate of 6% p.a. Specific goals like education or healthcare experience higher category inflation (8-10%).",
    icon: Hourglass,
    badge: "Purchasing Power",
    color: "border-amber-500/30 bg-amber-500/5"
  },
  {
    title: "FY 2024-25 Tax Rules",
    desc: "Tax calculations incorporate standard deduction (₹75,000), 12.5% LTCG on equity mutual funds above ₹1.25L exemption, and the latest New Tax Regime slabs.",
    icon: Calculator,
    badge: "Tax Baseline",
    color: "border-indigo-500/30 bg-indigo-500/5"
  },
  {
    title: "Non-SEBI Educational Notice",
    desc: "ValarchiX & Valarchi Vaathi are educational tools designed for financial literacy. They do not recommend individual stocks or provide SEBI-registered personalized advice.",
    icon: ShieldAlert,
    badge: "Guardrail",
    color: "border-red-500/30 bg-red-500/5"
  }
];

const FOUNDATIONS = [
  {
    question: "What is a Mutual Fund?",
    desc: "A pooled basket of 50+ company shares or government bonds managed by experts. It offers instant diversification with small ticket sizes (starting at ₹500).",
    icon: Layers,
    pros: "Instant diversification, highly liquid, regulated",
    cons: "AMC expense ratios, no direct pick control"
  },
  {
    question: "Why Mutual Funds instead of FDs?",
    desc: "FD interest is eaten by income tax slabs and inflation, causing negative real returns. Mutual Funds compound tax-efficiently above inflation over long terms.",
    icon: Landmark,
    pros: "Beats inflation, compounds tax-efficiently",
    cons: "No guaranteed yields, short-term fluctuations"
  },
  {
    question: "What is Compounding?",
    desc: "Earning returns on your accumulated returns. Time is your greatest asset—the exponential growth curve makes starting early far more critical than the amount invested.",
    icon: TrendingUp,
    pros: "Exponential growth, builds wealth passively",
    cons: "Requires extreme patience and market discipline"
  },
  {
    question: "Why do we need Diversification?",
    desc: "The only free lunch in finance. Spreading savings across sectors (banking, IT, consumer) and assets (equity, bonds, gold) shields you from single stock crashes.",
    icon: PieChart,
    pros: "Shields against individual company failures",
    cons: "Limits potential gains of single concentrated bets"
  },
  {
    question: "What is Asset Allocation?",
    desc: "The art of dividing capital between Equity (growth), Debt (safety), and Gold (insurance hedge) depending on your age, timeline, and risk appetite.",
    icon: Shield,
    pros: "Keeps portfolio stable during market corrections",
    cons: "Requires periodic rebalancing adjustments"
  },
  {
    question: "What is an SIP & its Life Impact?",
    desc: "Systematic Investment Plan. Automatically invests monthly. Enforces financial discipline and uses Rupee Cost Averaging to turn market crashes into buying opportunities.",
    icon: Hourglass,
    pros: "No market timing stress, averages purchase cost",
    cons: "Must remain uninterrupted for 10+ years"
  }
];

const QUICK_ACTIONS = [
  {
    name: "SIP & FD Yield Simulator",
    desc: "Simulate mutual fund compounding, one-time deposits, and compare post-tax real yields against bank FDs.",
    href: "/sip",
    icon: Percent,
    badge: "Core Metric",
    color: "from-emerald/20 to-emerald/5"
  },
  {
    name: "Live Mutual Fund Analyzer",
    desc: "Search actual mutual funds, calculate rolling CAGR yields, and compare performance indices using fast backend data.",
    href: "/mutual-funds",
    icon: Layers,
    badge: "Live Feed",
    color: "from-indigo-500/10 to-indigo-500/5"
  },
  {
    name: "Portfolio Allocator",
    desc: "Check asset overlap, expense ratios, and overall diversification score. No buy/sell tips, just pure logic.",
    href: "/portfolio",
    icon: PieChart,
    badge: "Diagnostic",
    color: "from-amber-500/10 to-amber-500/5"
  }
];

const EXPLORE_CARDS = [
  {
    name: "Emergency Fund Planner",
    desc: "Build the right safety net — minimum 3 months, ideal 6 months of total family monthly expense in high-liquidity instruments.",
    href: "/emergency-fund",
    icon: ShieldAlert,
    category: "Budgeting"
  },
  {
    name: "Net Worth Calculator",
    desc: "Subtract total liabilities from total assets. Understand the true definition of wealth and track your financial progress.",
    href: "/net-worth",
    icon: Wallet,
    category: "Budgeting"
  },
  {
    name: "Latte Factor Calculator",
    desc: "Visualise the dramatic long-term cost of small recurring daily spends — and what they could have become if invested.",
    href: "/latte-factor",
    icon: Coffee,
    category: "Budgeting"
  },
  {
    name: "Rent vs. Buy Calculator",
    desc: "Compare the true mathematical costs of renting vs. buying — EMIs, maintenance, appreciation, and opportunity cost.",
    href: "/rent-vs-buy",
    icon: HomeIcon,
    category: "Budgeting"
  },
  {
    name: "Tax Regime Hub",
    desc: "Compare Old vs New Tax regimes, learn about tax harvesting, 80C, and asset taxation.",
    href: "/tax",
    icon: Calculator,
    category: "Tax"
  },
  {
    name: "Debt Fund Explorer",
    desc: "Compare credit risk, liquid funds, average durations, and find who they are suitable for.",
    href: "/debt-funds",
    icon: Shield,
    category: "Analysis"
  },
  {
    name: "PPF Calculator",
    desc: "Calculate maturity and interest earnings in the Public Provident Fund under the fixed 7.10% tax-free rate.",
    href: "/ppf",
    icon: Coins,
    category: "Debt"
  },
  {
    name: "NPS Calculator",
    desc: "Model retirement corpus accumulation, lump sum withdrawals, and monthly annuity pensions.",
    href: "/nps",
    icon: TrendingUp,
    category: "Retirement"
  },
  {
    name: "SWP Pension Calculator",
    desc: "Simulate systematic withdrawals for retirement cash flow, testing for corpus depletion against inflation.",
    href: "/swp",
    icon: ArrowDownLeft,
    category: "Retirement"
  },
  {
    name: "FIRE Early Retirement",
    desc: "Determine your financial independence target corpus using safe withdrawal rates and required monthly SIP.",
    href: "/fire",
    icon: Flame,
    category: "Retirement"
  },
  {
    name: "Financial Goal Planner",
    desc: "Set timelines for a house, car, or marriage with inflation-adjusted targets and monthly SIP calculation.",
    href: "/goal",
    icon: Target,
    category: "Planners"
  },
  {
    name: "Step Up SIP Calculator",
    desc: "Calculate how a yearly SIP increase accelerates long-term wealth compounding versus a flat SIP.",
    href: "/step-up-sip",
    icon: ArrowUpRight,
    category: "Planners"
  },
  {
    name: "Retirement Planner",
    desc: "Solve for your target corpus, safe withdrawal rates, inflation-adjusted spend, and retirement age.",
    href: "/retirement",
    icon: Hourglass,
    category: "Planners"
  },
  {
    name: "Loan EMI & Prepayment",
    desc: "Calculate monthly installments and simulate how extra prepayments save interest and reduce tenure.",
    href: "/emi",
    icon: Landmark,
    category: "Debt"
  },
  {
    name: "Compound Interest Calculator",
    desc: "Demonstrate exponential money growth through compounding — with frequency comparison and the Rule of 72.",
    href: "/compound-interest",
    icon: TrendingUp,
    category: "Wealth"
  },
  {
    name: "Cost of Delay Calculator",
    desc: "See exactly how much wealth you lose by delaying investing by 3 or 5 years — compounding's cruelest lesson.",
    href: "/cost-of-delay",
    icon: Clock,
    category: "Wealth"
  },
  {
    name: "Inflation Calculator",
    desc: "Illustrate the eroding purchasing power of cash and calculate the SIP needed to stay ahead of inflation.",
    href: "/inflation",
    icon: BarChart2,
    category: "Wealth"
  },
  {
    name: "Debt Snowball / Avalanche",
    desc: "Compare strategies to accelerate debt payoff — Snowball (lowest balance) vs. Avalanche (highest rate).",
    href: "/debt-payoff",
    icon: Scissors,
    category: "Debt"
  },
  {
    name: "Credit Card Payoff",
    desc: "Reveal the true danger of minimum payments — total interest costs and years trapped in 36–42% p.a. debt.",
    href: "/credit-card",
    icon: CreditCard,
    category: "Debt"
  },
  {
    name: "Human Life Value (HLV)",
    desc: "Calculate the life insurance cover your family truly needs based on future income, liabilities, and inflation.",
    href: "/hlv",
    icon: HeartPulse,
    category: "Retirement"
  },
  {
    name: "Portfolio Allocator",
    desc: "Check asset overlap, expense ratios, and overall diversification score. No buy/sell tips, just pure logic.",
    href: "/portfolio",
    icon: PieChart,
    category: "Analysis"
  },
  {
    name: "SSY Calculator",
    desc: "Compounding savings for a girl child under the 8.2% tax-free government rate.",
    href: "/ssy",
    icon: Coins,
    category: "Debt"
  },
  {
    name: "EPF Calculator",
    desc: "Accumulate employee provident retirement fund with appraisals and inflation-discounting.",
    href: "/epf",
    icon: Coins,
    category: "Retirement"
  },
  {
    name: "RD Calculator",
    desc: "Calculate standard bank Recurring Deposits with quarterly compounding.",
    href: "/rd",
    icon: Percent,
    category: "Debt"
  },
  {
    name: "ROI & CAGR Calculator",
    desc: "Calculate absolute returns and compound annual growth rate with inflation-discounting.",
    href: "/roi",
    icon: TrendingUp,
    category: "Wealth"
  },
  {
    name: "HRA Tax Exemption",
    desc: "Determine tax-free vs. taxable house rent allowance splits under Section 10(13A).",
    href: "/hra",
    icon: Calculator,
    category: "Tax"
  },
  {
    name: "NSC Calculator",
    desc: "Compounding savings under the 7.7% sovereign rate with 80C reinvestment.",
    href: "/nsc",
    icon: Coins,
    category: "Debt"
  },
  {
    name: "Advanced Income Tax",
    desc: "Compare Old vs. New tax slabs side-by-side and simulate bracket creep inflation tax.",
    href: "/income-tax",
    icon: Calculator,
    category: "Tax"
  },
  {
    name: "Gratuity Calculator",
    desc: "Calculate gratuity benefits under the Payment of Gratuity Act and inflation payouts.",
    href: "/gratuity",
    icon: Coins,
    category: "Retirement"
  },
  {
    name: "Atal Pension Yojana",
    desc: "Model government pension contributions and check post-retirement purchasing power.",
    href: "/apy",
    icon: Coins,
    category: "Retirement"
  },
  {
    name: "TDS Calculator",
    desc: "Calculate transactional tax deductions, limits, and PAN card penalty rates.",
    href: "/tds",
    icon: Calculator,
    category: "Tax"
  },
  {
    name: "Post Office MIS",
    desc: "Model guaranteed monthly income scheme payouts and check real principal erosion.",
    href: "/pomis",
    icon: Coins,
    category: "Retirement"
  },
  {
    name: "SCSS Calculator",
    desc: "Simulate Senior Citizens Savings Scheme quarterly interest income and principal decay.",
    href: "/scss",
    icon: Coins,
    category: "Retirement"
  },
  {
    name: "XIRR Calculator",
    desc: "Calculate Extended Internal Rate of Return for irregular cash flows and real returns.",
    href: "/xirr",
    icon: Zap,
    category: "Wealth"
  }
];

export default function Home() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function loadSession() {
      const s = await getCurrentUserSession();
      setSession(s);
    }
    loadSession();
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Signed-in VIP Status Banner */}
      {session?.user && (
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 font-extrabold text-lg">
              {session.user.user_metadata?.full_name?.[0] || session.user.email?.[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Encrypted Vault Active
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Welcome back, {session.user.user_metadata?.full_name || session.user.email}!
              </h2>
              <p className="text-xs text-slate-300">
                Live Financial DNA score tracking (`78 ↑4 pts`), Zero-Knowledge Multi-Device Sync, and persistent decision memory enabled.
              </p>
            </div>
          </div>

          <Link
            href="/financial-dna"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition flex items-center gap-1.5"
          >
            View Live DNA Score <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ValarchiX Flagship Intelligence Ecosystem Section */}
      <section className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative space-y-6 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-300 uppercase tracking-widest">
            ✨ ValarchiX • Personal Financial Intelligence System
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Your Personal Financial <br />
            <span className="bg-gradient-to-r from-indigo-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Digital Twin</span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Understand where you are. Understand where you&apos;re going. See what could happen. Decide what to change.
          </p>

          {/* 6 Interconnected Engines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 text-left">
            <Link href="/financial-dna" className="group bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl transition shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-indigo-400">1. Financial DNA</span>
                <HeartPulse className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-white mb-1">Fitness Score & 8 Pillars</div>
              <div className="text-xs text-slate-400 leading-relaxed">Know your financial health before trying to optimize wealth. Signature "What Should I Fix First?" simulator.</div>
            </Link>

            <Link href="/goalx" className="group bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-emerald-400">2. GoalX Navigation</span>
                <Target className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-white mb-1">Inflation-Adjusted Goals</div>
              <div className="text-xs text-slate-400 leading-relaxed">Reverse goal solver with category-specific inflation, unlimited numeric range, and adaptive sliders.</div>
            </Link>

            <Link href="/portfolio-intelligence" className="group bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl transition shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-cyan-400">3. Portfolio X-Ray</span>
                <PieChart className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-white mb-1">Overlap & Concentration</div>
              <div className="text-xs text-slate-400 leading-relaxed">Deep multi-fund overlap diagnostics, stock concentration risk, and sector weight exposures.</div>
            </Link>

            <Link href="/time-machine" className="group bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl transition shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-purple-400">4. Time Machine</span>
                <Hourglass className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-white mb-1">Parallel Universes</div>
              <div className="text-xs text-slate-400 leading-relaxed">Simulate alternate financial futures side-by-side, scrub timelines, and run stress tests.</div>
            </Link>

            <Link href="/decision-replay" className="group bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-5 rounded-2xl transition shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-rose-400">5. Decision Replay</span>
                <Clock className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-white mb-1">Hindsight-Free Log</div>
              <div className="text-xs text-slate-400 leading-relaxed">Record past decisions and evaluate expected vs actual outcomes without hindsight bias.</div>
            </Link>

            <Link href="/vaathi" className="group bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl transition shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-amber-400">6. Valarchi Vaathi 🎓</span>
                <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-white mb-1">AI Financial Tutor</div>
              <div className="text-xs text-slate-400 leading-relaxed">Natural-language scenario execution over deterministic math engines (0 hallucinations).</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Education Promo Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald/30 bg-gradient-to-r from-emerald/10 via-emerald/5 to-transparent p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl text-left">
          <span className="text-[10px] font-bold text-emerald uppercase tracking-wider bg-emerald/10 border border-emerald/20 px-2.5 py-0.5 rounded-full">
            New Masterclass
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Why Move Beyond FDs & Learn Personal Finance?
          </h2>
          <p className="text-xs md:text-sm text-muted-grey leading-relaxed">
            See the magic of compounding in real-time, learn why income tax and inflation make FDs a guaranteed wealth destroyer, and discover how to manage equity risks using simple tools.
          </p>
        </div>
        <Link
          href="/beyond-fds"
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald hover:bg-emerald/90 px-6 py-3.5 text-xs font-bold text-navy-bg transition-all shrink-0 hover:translate-x-1"
        >
          <span>Start Free Masterclass</span>
          <ArrowRight size={14} />
        </Link>
      </section>

      {/* Statistics Section */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center p-6 rounded-2xl glass-card text-center"
          >
            <span className="text-2xl md:text-3xl font-extrabold text-emerald tracking-tight">
              {stat.value}
            </span>
            <span className="text-xs md:text-sm text-muted-grey mt-2">
              {stat.label}
            </span>
          </div>
        ))}
      </section>

      {/* Financial Foundations Hub */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Financial Foundations</h2>
          <p className="text-sm text-muted-grey">Simple, logical answers to the 6 fundamental investing questions</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FOUNDATIONS.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.question} className="p-6 glass-card space-y-4 flex flex-col justify-between hover:border-emerald/30 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-navy-light rounded-lg border border-border-navy text-emerald shrink-0">
                      <Icon size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{f.question}</h3>
                  </div>
                  <p className="text-xs text-muted-grey leading-relaxed">{f.desc}</p>
                </div>

                <div className="border-t border-border-navy/60 pt-3 space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-emerald font-bold">🟢 PROS:</span>
                    <span className="text-light-grey text-right">{f.pros}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-500 font-bold">🔴 CONS/LIMITS:</span>
                    <span className="text-light-grey text-right">{f.cons}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Launch / Hero Features */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Core Hubs</h2>
            <p className="text-sm text-muted-grey">Launch into main diagnostic and compounding tools</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.name}
                className={`relative overflow-hidden rounded-2xl border border-border-navy bg-gradient-to-br ${action.color} p-6 flex flex-col justify-between group transition-all duration-300 hover:border-emerald/40 hover:-translate-y-1`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-navy-card rounded-xl border border-border-navy text-emerald">
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-sm text-muted-grey leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                </div>
                
                <Link
                  href={action.href}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-white group-hover:text-emerald transition-colors pt-6"
                >
                  <span>Launch Tool</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Feature Explorer Grid */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Explore the Operating System</h2>
          <p className="text-sm text-muted-grey">All tools follow a strict education-only design principle</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPLORE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.name} className="flex flex-col justify-between p-6 glass-card">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-navy-light rounded-lg border border-border-navy/55 text-emerald">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-grey border border-border-navy px-2 py-0.5 rounded-md">
                      {card.category}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">{card.name}</h3>
                    <p className="text-xs text-muted-grey leading-relaxed">{card.desc}</p>
                  </div>
                </div>
                
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-white transition-colors mt-6"
                >
                  <span>Explore</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
