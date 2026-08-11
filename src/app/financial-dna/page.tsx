"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, Activity, TrendingUp, AlertTriangle, ArrowUpRight, 
  CheckCircle2, Sliders, RefreshCw, Zap, Clock, Info, HeartPulse, ChevronRight, Lock, X, Save, Wallet, Building, FileText
} from "lucide-react";
import { calculateFinancialDna } from "@/lib/engine/dna";
import { FinancialDigitalTwin } from "@/lib/engine/types";
import { loadDigitalTwinFromVault, saveDigitalTwinToVault, getCurrentUserSession } from "@/lib/supabase/auth";
import NumericInput from "@/components/NumericInput";

const DEFAULT_TWIN: FinancialDigitalTwin = {
  updatedAt: new Date().toISOString(),
  income: {
    monthlySalary: 120000,
    secondaryMonthlyIncome: 15000,
    expectedAnnualGrowthPct: 10,
    stabilityRating: "high",
  },
  expenses: {
    essentialMonthly: 45000,
    discretionaryMonthly: 25000,
    recurringAnnual: 60000,
    irregularAnnual: 30000,
  },
  savings: {
    liquidBankBalance: 150000,
    cashReserves: 30000,
  },
  investments: [
    { id: "1", name: "Flexi Cap Fund", category: "mutual_fund", currentValue: 450000, monthlyContribution: 15000, expectedReturnPct: 13 },
    { id: "2", name: "Nifty 50 Index", category: "mutual_fund", currentValue: 300000, monthlyContribution: 10000, expectedReturnPct: 12 },
    { id: "3", name: "EPF Balance", category: "epf", currentValue: 350000, monthlyContribution: 7200, expectedReturnPct: 8.25 },
  ],
  debts: [
    { id: "d1", name: "Car Loan", category: "vehicle_loan", outstandingPrincipal: 320000, monthlyEmi: 11500, interestRatePct: 8.9, remainingTenureMonths: 32 },
  ],
  protection: {
    healthInsuranceCover: 500000,
    lifeInsuranceCover: 7500000,
    dependantsCount: 2,
    annualHealthPremium: 18000,
    annualLifePremium: 22000,
  },
  goals: [
    { id: "g1", name: "New SUV Car", category: "vehicle", targetAmountToday: 1200000, targetYear: 2029, currentAllocatedCorpus: 200000, currentMonthlySip: 8000, priority: 2, expectedReturnPct: 11 },
  ],
  dnaHistory: [
    { date: "2026-06-01", score: 68, notes: "Initial baseline assessment" },
    { date: "2026-07-01", score: 71, notes: "Increased Emergency Fund reserves" },
    { date: "2026-08-01", score: 75, notes: "Added Step-Up SIP to Flexi Cap" },
  ],
  decisions: [],
  universes: [],
};

export default function FinancialDnaPage() {
  const [twin, setTwin] = useState<FinancialDigitalTwin>(DEFAULT_TWIN);
  const [showInputDrawer, setShowInputDrawer] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    async function loadData() {
      const session = await getCurrentUserSession();
      setIsSignedIn(!!session?.user);
      const loaded = await loadDigitalTwinFromVault();
      if (loaded) setTwin(loaded);
    }
    loadData();
  }, []);

  // Calculate DNA score live on every render (0ms latency!)
  const dna = calculateFinancialDna(twin);

  // Synchronous local state update for instant live reaction + background vault save
  const handleUpdateTwin = (updated: FinancialDigitalTwin) => {
    setTwin(updated);
    saveDigitalTwinToVault(updated).catch(console.error);
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-navy-bg text-light-grey p-3 sm:p-4 md:p-8 relative">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-navy pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm mb-1 uppercase tracking-wider">
            <HeartPulse className="w-4 h-4" /> Engine 1: Financial DNA
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-heading">Your Personal Financial Fitness</h1>
          <p className="text-muted-grey text-xs sm:text-sm mt-1">
            «Know your financial fitness before trying to optimize your wealth.»
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInputDrawer(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4" /> Edit Profile Inputs
          </button>
          {isSignedIn ? (
            <span className="flex items-center gap-2 text-xs bg-emerald/10 text-emerald border border-emerald/40 px-3 py-1.5 rounded-full font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald animate-pulse"></span>
              Live Auto-Sync Active
            </span>
          ) : (
            <a href="/auth" className="flex items-center gap-2 text-xs bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-3 py-1.5 rounded-full hover:bg-indigo-900 transition font-semibold">
              <Lock className="w-3 h-3" /> Enable Live Mode
            </a>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Score Hero Card */}
        <div className="lg:col-span-1 bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-muted-grey uppercase tracking-widest">Financial DNA Score</span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 font-extrabold text-xs rounded-full border border-indigo-500/30">
                Grade {dna.grade}
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-6">
              <span className="text-6xl sm:text-7xl font-black text-heading tracking-tight transition-all duration-300">{dna.overallScore}</span>
              <span className="text-xl sm:text-2xl font-bold text-muted-grey">/ 100</span>

              {dna.liveDelta && (
                <span className="flex items-center text-emerald text-sm font-bold bg-emerald/10 border border-emerald/30 px-2.5 py-1 rounded-lg">
                  <ArrowUpRight className="w-4 h-4 mr-0.5" /> +{dna.liveDelta.pointsChange}
                </span>
              )}
            </div>

            <p className="text-light-grey text-xs sm:text-sm leading-relaxed mb-6">
              {dna.summaryText}
            </p>
          </div>

          {/* Quick Live Sliders Card (Stonzz-style Live Interactive Controls) */}
          <div className="bg-navy-bg p-4 rounded-2xl border border-border-navy space-y-4">
            <div className="flex items-center justify-between border-b border-border-navy pb-2">
              <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Quick Live Adjuster
              </span>
              <span className="text-[10px] text-emerald font-bold">0ms Live Update</span>
            </div>

            {/* Monthly Salary Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-grey">Monthly Salary</span>
                <span className="font-bold text-heading">{fmt(twin.income.monthlySalary)}</span>
              </div>
              <input
                type="range"
                min={30000}
                max={500000}
                step={5000}
                value={twin.income.monthlySalary}
                onChange={(e) => handleUpdateTwin({
                  ...twin,
                  income: { ...twin.income, monthlySalary: Number(e.target.value) }
                })}
                className="w-full accent-indigo-500 bg-navy-card h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Essential Expenses Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-grey">Essential Expenses</span>
                <span className="font-bold text-heading">{fmt(twin.expenses.essentialMonthly)}</span>
              </div>
              <input
                type="range"
                min={10000}
                max={200000}
                step={2500}
                value={twin.expenses.essentialMonthly}
                onChange={(e) => handleUpdateTwin({
                  ...twin,
                  expenses: { ...twin.expenses, essentialMonthly: Number(e.target.value) }
                })}
                className="w-full accent-rose-500 bg-navy-card h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Bank Savings Balance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-grey">Bank Savings Reserve</span>
                <span className="font-bold text-heading">{fmt(twin.savings.liquidBankBalance)}</span>
              </div>
              <input
                type="range"
                min={20000}
                max={1500000}
                step={10000}
                value={twin.savings.liquidBankBalance}
                onChange={(e) => handleUpdateTwin({
                  ...twin,
                  savings: { ...twin.savings, liquidBankBalance: Number(e.target.value) }
                })}
                className="w-full accent-emerald bg-navy-card h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Historical Evolution Timeline */}
          <div className="border-t border-border-navy pt-4 mt-4">
            <h4 className="text-xs font-semibold text-muted-grey uppercase mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Score Evolution Timeline
            </h4>
            <div className="space-y-2">
              {twin.dnaHistory.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-muted-grey bg-navy-bg px-3 py-2 rounded-xl border border-border-navy/60">
                  <span>{h.date}</span>
                  <span className="font-semibold text-heading">{h.score} pts</span>
                  <span className="text-muted-grey truncate max-w-[140px]">{h.notes}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Signature Feature: Biggest Gap & Fix Simulator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-amber-950/30 via-navy-card to-navy-card border border-amber-500/40 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl relative">
            <div className="flex items-center gap-3 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Signature Diagnostic: What Should I Fix First?
            </div>
            
            <h3 className="text-xl font-bold text-heading mb-2">
              Biggest Financial Gap: <span className="text-amber-400">{dna.biggestGap.title}</span>
            </h3>
            <p className="text-light-grey text-xs sm:text-sm mb-4 leading-relaxed">
              {dna.biggestGap.explanation}
            </p>

            <div className="bg-navy-bg border border-border-navy rounded-2xl p-4 mb-6">
              <div className="text-xs font-bold text-muted-grey mb-1 uppercase tracking-wider text-[11px]">Recommended Action</div>
              <div className="text-sm font-bold text-amber-300">{dna.biggestGap.recommendedAction}</div>
            </div>

            {/* Current vs Improved Simulation */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-navy-bg border border-border-navy rounded-2xl p-4 gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs text-muted-grey uppercase font-bold text-[10px]">Current DNA</div>
                  <div className="text-2xl font-black text-heading">{dna.overallScore}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-grey hidden sm:block" />
                <div>
                  <div className="text-xs text-amber-400 uppercase font-extrabold text-[10px]">After Fixing Gap</div>
                  <div className="text-2xl font-black text-emerald">
                    {dna.biggestGap.improvedScoreIfFixed} <span className="text-xs font-normal text-emerald">(+{dna.biggestGap.improvedScoreIfFixed - dna.overallScore} pts)</span>
                  </div>
                </div>
              </div>

              <a
                href="/time-machine"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <Zap className="w-4 h-4" /> Simulate Fix in Time Machine
              </a>
            </div>
          </div>

          {/* 8 Pillar Breakdown Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-heading flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> 8 Pillar Fitness Diagnostics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dna.pillars.map((p) => {
                const getBadge = (r: string) => {
                  if (r === "Strong") return "bg-emerald/10 text-emerald border-emerald/40";
                  if (r === "Healthy") return "bg-blue-500/10 text-blue-400 border-blue-500/30";
                  if (r === "Needs Attention") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
                  return "bg-rose-500/10 text-rose-400 border-rose-500/30";
                };

                return (
                  <div key={p.id} className="bg-navy-card border border-border-navy rounded-2xl p-4 sm:p-5 hover:border-emerald/40 transition shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-heading text-sm sm:text-base">{p.name}</span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${getBadge(p.rating)}`}>
                        {p.score} / 100 • {p.rating}
                      </span>
                    </div>

                    <p className="text-xs text-light-grey mb-3 leading-relaxed">{p.explanation}</p>

                    <div className="text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-900/40 p-2.5 rounded-xl font-medium">
                      <span className="font-bold text-indigo-200">Advice: </span>
                      {p.recommendation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stonzz-style Interactive Profile Edit Drawer */}
      {showInputDrawer && (
        <div className="fixed inset-0 bg-navy-bg/80 backdrop-blur-md flex justify-end z-50">
          <div className="bg-navy-card border-l border-border-navy w-full max-w-xl h-full p-4 sm:p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border-navy pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-heading flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-400" /> Edit Financial Profile
                  </h3>
                  <p className="text-xs text-muted-grey mt-0.5">
                    Adjust your numbers below to watch your DNA score update live.
                  </p>
                </div>
                <button
                  onClick={() => setShowInputDrawer(false)}
                  className="p-2 bg-navy-bg hover:bg-navy-light rounded-xl text-muted-grey hover:text-heading cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Income Inputs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Income & Cash Flow
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-grey">Monthly Salary</label>
                    <input
                      type="number"
                      value={twin.income.monthlySalary}
                      onChange={(e) => handleUpdateTwin({
                        ...twin,
                        income: { ...twin.income, monthlySalary: Number(e.target.value) }
                      })}
                      className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-grey">Secondary Income</label>
                    <input
                      type="number"
                      value={twin.income.secondaryMonthlyIncome}
                      onChange={(e) => handleUpdateTwin({
                        ...twin,
                        income: { ...twin.income, secondaryMonthlyIncome: Number(e.target.value) }
                      })}
                      className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Expense Inputs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Expenses
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-grey">Essential Expenses</label>
                    <input
                      type="number"
                      value={twin.expenses.essentialMonthly}
                      onChange={(e) => handleUpdateTwin({
                        ...twin,
                        expenses: { ...twin.expenses, essentialMonthly: Number(e.target.value) }
                      })}
                      className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-grey">Discretionary Expenses</label>
                    <input
                      type="number"
                      value={twin.expenses.discretionaryMonthly}
                      onChange={(e) => handleUpdateTwin({
                        ...twin,
                        expenses: { ...twin.expenses, discretionaryMonthly: Number(e.target.value) }
                      })}
                      className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Savings & Emergency Buffer */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Savings & Emergency Reserves
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-grey">Bank Savings Balance</label>
                    <input
                      type="number"
                      value={twin.savings.liquidBankBalance}
                      onChange={(e) => handleUpdateTwin({
                        ...twin,
                        savings: { ...twin.savings, liquidBankBalance: Number(e.target.value) }
                      })}
                      className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-grey">Cash Reserves</label>
                    <input
                      type="number"
                      value={twin.savings.cashReserves}
                      onChange={(e) => handleUpdateTwin({
                        ...twin,
                        savings: { ...twin.savings, cashReserves: Number(e.target.value) }
                      })}
                      className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Insurance & Protection */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Protection & Insurance
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-grey">Life Insurance Cover</label>
                    <input
                      type="number"
                      value={twin.protection.lifeInsuranceCover}
                      onChange={(e) => handleUpdateTwin({
                        ...twin,
                        protection: { ...twin.protection, lifeInsuranceCover: Number(e.target.value) }
                      })}
                      className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-grey">Health Insurance Cover</label>
                    <input
                      type="number"
                      value={twin.protection.healthInsuranceCover}
                      onChange={(e) => handleUpdateTwin({
                        ...twin,
                        protection: { ...twin.protection, healthInsuranceCover: Number(e.target.value) }
                      })}
                      className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-navy">
              <button
                onClick={() => setShowInputDrawer(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Profile & Update DNA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
