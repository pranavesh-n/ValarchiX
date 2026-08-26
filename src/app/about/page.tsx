"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  HeartPulse,
  Target,
  PieChart,
  Hourglass,
  Clock,
  GraduationCap,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  Award,
  Layers,
  Activity,
  CheckCircle2
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-8 sm:space-y-12 animate-fadeIn pb-12">
      
      {/* Hero Banner */}
      <section className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden text-center space-y-4">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 bg-emerald/10 border border-emerald/30 text-emerald px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
          <Sparkles size={14} />
          <span>The ValarchiX Mission</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-heading tracking-tight max-w-3xl mx-auto leading-tight">
          Democratizing First-Principles Financial Intelligence for India.
        </h1>

        <p className="text-sm sm:text-base text-muted-grey max-w-2xl mx-auto leading-relaxed">
          &ldquo;We don&apos;t tell what to pick, we tell how to pick.&rdquo; — An institutional-grade, zero-commission financial knowledge operating system built to protect and compound your wealth.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/financial-dna"
            className="bg-emerald hover:bg-emerald/90 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl transition shadow-lg shadow-emerald/20 flex items-center gap-2 cursor-pointer"
          >
            <HeartPulse size={16} />
            <span>Discover Your Financial DNA</span>
          </Link>
          <Link
            href="/vaathi"
            className="bg-navy-bg hover:bg-navy-light text-heading border border-border-navy font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl transition flex items-center gap-2 cursor-pointer"
          >
            <GraduationCap size={16} className="text-emerald" />
            <span>Meet Valarchi Vaathi 🎓</span>
          </Link>
        </div>
      </section>

      {/* Core Principles Grid */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-emerald">Our Philosophy</span>
          <h2 className="text-2xl sm:text-3xl font-black text-heading">Why ValarchiX is Fundamentally Different</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
          
          <div className="card-tile-neutral p-6 rounded-3xl border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald/15 text-emerald border border-emerald/30 flex items-center justify-center font-black">
              <Lock size={24} />
            </div>
            <h3 className="text-base sm:text-lg font-black text-heading">100% Zero-Knowledge Privacy</h3>
            <p className="text-xs sm:text-sm text-muted-grey leading-relaxed">
              Your financial data is encrypted on your device using client-side AES-GCM-256 before storage. We have zero access to your net worth, income, or investment details.
            </p>
          </div>

          <div className="card-tile-neutral p-6 rounded-3xl border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black">
              <Zap size={24} />
            </div>
            <h3 className="text-base sm:text-lg font-black text-heading">Zero Commissions &amp; Pure Math</h3>
            <p className="text-xs sm:text-sm text-muted-grey leading-relaxed">
              No hidden affiliate commissions, no sponsored fund pushing, and no broker bias. All recommendations are derived from deterministic mathematics and risk equations.
            </p>
          </div>

          <div className="card-tile-neutral p-6 rounded-3xl border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center font-black">
              <Layers size={24} />
            </div>
            <h3 className="text-base sm:text-lg font-black text-heading">56+ Integrated Intelligence Tools</h3>
            <p className="text-xs sm:text-sm text-muted-grey leading-relaxed">
              From Indian tax regime comparative algorithms to Monte Carlo 20-year stress tests, ValarchiX provides a unified cockpit replacing dozens of fragmented calculators.
            </p>
          </div>

        </div>
      </section>

      {/* The 5 Core Engines Overview */}
      <section className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-navy pb-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400">System Architecture</span>
            <h2 className="text-xl sm:text-2xl font-black text-heading">The 5 Pillar Intelligence Ecosystem</h2>
          </div>
          <span className="text-xs text-muted-grey font-mono">Engineered for Lifelong Wealth</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="card-tile-neutral p-4 rounded-2xl border space-y-2">
            <div className="flex items-center gap-2 text-emerald font-black text-sm">
              <HeartPulse size={18} />
              <span>1. Financial DNA</span>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              An 8-pillar health check evaluating emergency buffer, true needs, insurance adequacy, and saving velocity.
            </p>
          </div>

          <div className="card-tile-neutral p-4 rounded-2xl border space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
              <Target size={18} />
              <span>2. GoalX Navigation</span>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              Category-specific inflation roadmaps that calculate exact monthly SIP and Step-Up investment milestones.
            </p>
          </div>

          <div className="card-tile-neutral p-4 rounded-2xl border space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-black text-sm">
              <PieChart size={18} />
              <span>3. Portfolio Intelligence</span>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              Deep mutual fund overlap diagnostics, stock concentration risk, and direct vs regular TER expense ratio drag.
            </p>
          </div>

          <div className="card-tile-neutral p-4 rounded-2xl border space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Hourglass size={18} />
              <span>4. Financial Time Machine</span>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              Simulate 20-year future parallel universes, market crashes, and the compound impact of lifestyle tweaks.
            </p>
          </div>

          <div className="card-tile-neutral p-4 rounded-2xl border space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
              <Clock size={18} />
              <span>5. Decision Replay</span>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              Hindsight-free decision audit to evaluate whether your past financial choices followed sound logic regardless of outcome.
            </p>
          </div>

          <div className="card-stat-emerald p-4 rounded-2xl border space-y-2">
            <div className="flex items-center gap-2 font-black text-sm">
              <GraduationCap size={18} />
              <span>Valarchi Vaathi 🎓</span>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              AI mentor trained on first-principles personal finance to answer real-world Indian tax, compounding, and investment questions.
            </p>
          </div>

        </div>
      </section>

      {/* Creator & Community Card */}
      <section className="card-tile-neutral p-6 sm:p-8 rounded-3xl border text-center space-y-3">
        <h3 className="text-lg sm:text-xl font-black text-heading">Built with Passion for Financial Clarity</h3>
        <p className="text-xs sm:text-sm text-muted-grey max-w-xl mx-auto leading-relaxed">
          ValarchiX was designed to eliminate financial anxiety and replace guesswork with deterministic clarity. 
          Thank you for choosing to invest smarter, avoid predatory fees, and take control of your financial destiny.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-black text-xs text-emerald hover:underline"
          >
            <span>Back to Main Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

    </div>
  );
}
