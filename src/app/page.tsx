"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  AlertTriangle,
  Lock,
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle2,
  TrendingDown
} from "lucide-react";
import { formatINR, formatINRWords } from "@/lib/engine/numeric";

const PROOF_CARDS = [
  {
    title: "100% Client-Side Vault",
    subtitle: "₹0 Data Leakage Risk",
    desc: "AES-GCM 256-bit encrypted before storage",
    badge: "Zero-Knowledge",
    color: "text-emerald",
    bg: "bg-emerald/10 border-emerald/30",
  },
  {
    title: "8 Deterministic Pillars",
    subtitle: "Scientific DNA Scoring",
    desc: "Emergency, needs, wants, term & equity velocity",
    badge: "Objective Math",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/30",
  },
  {
    title: "56+ Calculators & Engines",
    subtitle: "Instant Financial Clarity",
    desc: "Category inflation, step-up roadmaps & tax hubs",
    badge: "Full Suite",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
];

const ENGINE_SHOWCASE = [
  {
    id: "dna",
    title: "Financial DNA",
    href: "/financial-dna",
    tag: "Most Popular",
    tagColor: "bg-emerald/15 text-emerald border-emerald/30",
    desc: "8-Pillar cash flow & security assessment with live reactive telemetry.",
    icon: HeartPulse,
    action: "Start Assessment",
    metric: "0 to 100 Score",
  },
  {
    id: "goalx",
    title: "GoalX Navigation",
    href: "/goalx",
    tag: "Target Driven",
    tagColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    desc: "Input current cost & tenure. Automated category inflation & SIP solvers.",
    icon: Target,
    action: "Plot Roadmap",
    metric: "Flat vs Step-Up SIP",
  },
  {
    id: "portfolio",
    title: "Portfolio Intelligence",
    href: "/portfolio-intelligence",
    tag: "New Launch",
    tagColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    desc: "True XIRR, mutual fund overlap detector & expense ratio TER drag analyzer.",
    icon: PieChart,
    action: "Analyze Portfolio",
    metric: "Zero Bias",
  },
  {
    id: "time_machine",
    title: "Financial Time Machine",
    href: "/time-machine",
    tag: "Stress Simulator",
    tagColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    desc: "Simulate parallel financial universes & scrub through 20-year stress horizons.",
    icon: Hourglass,
    action: "Simulate Futures",
    metric: "20-Yr Timeline",
  },
];

const FOUNDATIONS = [
  {
    question: "What is a Mutual Fund?",
    desc: "A pooled basket of 50+ company shares or government bonds managed by SEBI-regulated fund managers, offering instant diversification with small ticket sizes (starting at ₹500/mo).",
    icon: Layers,
    pros: "Instant diversification, liquid, professional oversight",
    cons: "AMC expense ratios, short-term market fluctuations"
  },
  {
    question: "Why Mutual Funds instead of FDs?",
    desc: "Bank FD interest is heavily eroded by income tax slabs and inflation, causing negative real purchasing power. Equity mutual funds compound tax-efficiently above inflation.",
    icon: Landmark,
    pros: "Beats inflation, long-term wealth compounding",
    cons: "No fixed guaranteed yields, requires patience"
  },
  {
    question: "What is Exponential Compounding?",
    desc: "Earning returns on your accumulated gains. Time is your greatest multiplier—the exponential compounding curve makes starting early far more powerful than starting big.",
    icon: TrendingUp,
    pros: "Exponential growth, builds wealth passively",
    cons: "Requires uninterrupted market discipline"
  },
  {
    question: "Why do we need Diversification?",
    desc: "The only free lunch in finance. Spreading savings across sectors (banking, IT, consumer) and assets (equity, debt, gold) shields you from single-company shocks.",
    icon: PieChart,
    pros: "Shields against individual company failures",
    cons: "Limits concentrated speculative spikes"
  },
];

export default function HomeDashboardPage() {
  const [session, setSession] = useState<any>(null);

  // Interactive Quick Growth Projection Widget State
  const [quickSip, setQuickSip] = useState<number>(10000);
  const [quickTenure, setQuickTenure] = useState<number>(15);
  const [quickReturnRate, setQuickReturnRate] = useState<number>(12);

  useEffect(() => {
    async function loadSession() {
      const s = await getCurrentUserSession();
      setSession(s);
    }
    loadSession();
  }, []);

  // Compute Quick SIP Growth Math
  const quickProjection = useMemo(() => {
    const r = quickReturnRate / 100 / 12;
    const n = quickTenure * 12;
    const fv = quickSip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = quickSip * n;
    const gain = Math.max(0, fv - invested);
    return {
      futureValue: Math.round(fv),
      investedAmount: invested,
      wealthGained: Math.round(gain),
      gainRatio: invested > 0 ? (gain / invested).toFixed(1) : "0",
    };
  }, [quickSip, quickTenure, quickReturnRate]);

  return (
    <div className="space-y-12 pb-16 animate-fadeIn">
      
      {/* =========================================================================
          HERO SECTION (FundsIndia-Inspired Concise PC Layout)
          ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-card border border-border-navy p-6 sm:p-10 md:p-12 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: High-Impact Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/10 border border-emerald/30 text-emerald text-xs font-extrabold tracking-wide">
              <Sparkles size={13} />
              <span>Next-Gen Financial Knowledge OS</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-heading tracking-tight leading-[1.15]">
                Invest with clarity. <br />
                Plan for your <span className="text-emerald">Financial DNA</span> & <span className="text-indigo-400">Goals</span>.
              </h1>
              <p className="text-sm sm:text-base text-muted-grey leading-relaxed max-w-xl pt-2">
                «We don’t tell what to pick, we tell how to pick» — deterministic intelligence, inflation-proof roadmaps, and zero-knowledge client-side encryption.
              </p>
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/financial-dna"
                className="bg-indigo-600 hover:bg-indigo-500 !text-white font-black text-sm px-7 py-3.5 rounded-full transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <span>Start Financial DNA</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/goalx"
                className="bg-navy-bg hover:bg-navy-light text-heading border border-border-navy font-bold text-sm px-6 py-3.5 rounded-full transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Target size={16} className="text-emerald" />
                <span>Explore GoalX</span>
              </Link>

              <Link
                href="/vaathi"
                className="text-xs font-bold text-muted-grey hover:text-emerald px-3 py-2 flex items-center gap-1 transition"
              >
                <span>Ask Vaathi AI 🎓</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right Column: Floating Proof Cards & Trust Metrics */}
          <div className="lg:col-span-5 space-y-3.5">
            {PROOF_CARDS.map((card, idx) => (
              <div
                key={idx}
                className="card-tile-neutral p-4 rounded-2xl border transition-all hover:scale-[1.01] flex items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-heading">{card.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-navy-bg border border-border-navy text-muted-grey">
                      {card.badge}
                    </span>
                  </div>
                  <div className={`text-base sm:text-lg font-black ${card.color} mt-0.5`}>
                    {card.subtitle}
                  </div>
                  <p className="text-[11px] text-muted-grey leading-tight mt-0.5">{card.desc}</p>
                </div>
                <div className="shrink-0 p-2 rounded-xl bg-navy-bg border border-border-navy">
                  <CheckCircle2 size={18} className="text-emerald" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          INTELLIGENCE ENGINES SHOWCASE (FundsIndia Product Cards)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-navy pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-heading">
              Intelligence Options For You
            </h2>
            <p className="text-xs text-muted-grey">
              Choose an engine to analyze your cash flow, stress-test future universes, or navigate milestones.
            </p>
          </div>
          <Link
            href="/financial-dna"
            className="text-xs font-bold text-emerald hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Engines</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ENGINE_SHOWCASE.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="bg-navy-card border border-border-navy rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:border-emerald/50 hover:shadow-xl transition-all group cursor-pointer space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${item.tagColor}`}>
                      {item.tag}
                    </span>
                    <div className="p-2 rounded-xl bg-navy-bg border border-border-navy text-muted-grey group-hover:text-emerald group-hover:border-emerald/40 transition">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 rounded-xl bg-emerald/10 text-emerald">
                      <Icon size={18} />
                    </div>
                    <h3 className="text-base font-extrabold text-heading group-hover:text-emerald transition">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-muted-grey leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-border-navy flex items-center justify-between text-xs">
                  <span className="text-muted-grey font-mono text-[11px]">{item.metric}</span>
                  <span className="font-bold text-emerald flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    {item.action} ➔
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE GROWTH PROJECTION WIDGET (FundsIndia Style)
          ========================================================================= */}
      <section className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-navy pb-5">
          <div>
            <span className="text-xs font-bold text-emerald uppercase tracking-wider block">
              Compounding Power Simulator
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-heading mt-1">
              Small Monthly Investments, Massive Future Value
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Sliders Column */}
          <div className="lg:col-span-7 space-y-6">
            
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
          <div className="lg:col-span-5 bg-navy-bg border border-border-navy rounded-3xl p-6 shadow-inner space-y-5">
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

      {/* =========================================================================
          CORE FINANCIAL FOUNDATIONS
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-navy pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-heading">
              Financial Foundations & First Principles
            </h2>
            <p className="text-xs text-muted-grey">
              The non-negotiable mental models behind long-term compounding and risk management.
            </p>
          </div>
          <Link
            href="/beyond-fds"
            className="text-xs font-bold text-emerald hover:underline flex items-center gap-1"
          >
            <span>Learn More</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FOUNDATIONS.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="bg-navy-card border border-border-navy rounded-3xl p-5 sm:p-6 shadow-md hover:border-emerald/40 transition-all space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald/10 text-emerald shrink-0">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-heading">{f.question}</h3>
                </div>

                <p className="text-xs text-muted-grey leading-relaxed">
                  {f.desc}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="card-stat-emerald p-2.5 rounded-xl border">
                    <span className="font-extrabold uppercase text-[10px] block opacity-80">Strength</span>
                    <span className="mt-0.5 block">{f.pros}</span>
                  </div>
                  <div className="card-tile-neutral p-2.5 rounded-xl border">
                    <span className="font-extrabold uppercase text-[10px] block text-muted-grey">Tradeoff</span>
                    <span className="mt-0.5 block">{f.cons}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
