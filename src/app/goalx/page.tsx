"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Target, TrendingUp, AlertCircle, ArrowRight, ShieldCheck,
  Layers, Calculator, Sparkles, CheckCircle2, ChevronRight, Sliders,
  Save, Lock, Check, Plus, Trash2, Calendar, HelpCircle, ArrowUpRight,
  TrendingDown, RefreshCw, Eye, PieChart, ShieldAlert, Award, Clock,
  ChevronDown, HeartPulse, Building, GraduationCap, Car, Plane, Sunset,
  Coins, Zap, X
} from "lucide-react";
import FinancialInput from "@/components/FinancialInput";
import {
  calculateGoalX,
  optimizeMultiGoals,
  CATEGORY_INFLATION_DEFAULTS,
  GoalXCalculationResult,
} from "@/lib/engine/goalx";
import { GoalItem, GoalCategory, FinancialDigitalTwin } from "@/lib/engine/types";
import {
  getCurrentUserSession,
  loadDigitalTwinFromVault,
  saveDigitalTwinToVault,
  loadUserGoals,
  saveUserGoals,
  signInWithGoogle,
} from "@/lib/supabase/auth";
import { calculateFinancialDna } from "@/lib/engine/dna";

const CATEGORY_ICONS: Record<GoalCategory, any> = {
  house: Building,
  education: GraduationCap,
  vehicle: Car,
  travel: Plane,
  retirement: Sunset,
  emergency: ShieldCheck,
  custom: Target,
};

export default function GoalXPage() {
  const [twin, setTwin] = useState<FinancialDigitalTwin | null>(null);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [activeGoalId, setActiveGoalId] = useState<string>("");
  const [viewTab, setViewTab] = useState<"navigator" | "portfolio">("navigator");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSavedToVault, setIsSavedToVault] = useState(false);

  // New Goal Creator Modal / Form state
  const [isAddingNewGoal, setIsAddingNewGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory>("house");
  const [newGoalCostToday, setNewGoalCostToday] = useState<number>(0);
  const [newGoalTenureYears, setNewGoalTenureYears] = useState<number>(5);
  const [newGoalCustomInflation, setNewGoalCustomInflation] = useState<number>(6.0);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function loadData() {
      const session = await getCurrentUserSession();
      setIsSignedIn(!!session?.user);
      const userGoals = await loadUserGoals();
      const loadedTwin = await loadDigitalTwinFromVault();
      const goalsToUse = (userGoals && userGoals.length > 0)
        ? userGoals
        : (loadedTwin?.goals && loadedTwin.goals.length > 0 ? loadedTwin.goals : []);

      if (loadedTwin) {
        setTwin(loadedTwin);
      }
      setGoals(goalsToUse);
      if (goalsToUse.length > 0) {
        setActiveGoalId(goalsToUse[0].id);
      }
    }
    loadData();
  }, []);

  const activeGoal = goals.find((g) => g.id === activeGoalId) || goals[0] || null;
  const activeCalc: GoalXCalculationResult | null = useMemo(() => {
    if (!activeGoal) return null;
    return calculateGoalX(activeGoal);
  }, [activeGoal]);

  // Compute Financial DNA Monthly Surplus ONLY if verified DNA analysis exists
  const dnaAnalysisRecord = useMemo(() => {
    if (!twin || !twin.assessmentData) return null;
    const hasIncome = (twin.assessmentData.income?.primaryMonthlyTakeHome || 0) > 0 || (twin.income?.monthlySalary || 0) > 0;
    if (!hasIncome) return null;
    const dnaScore = calculateFinancialDna(twin);
    return {
      score: dnaScore,
      surplus: dnaScore.snapshot.monthlySurplus,
    };
  }, [twin]);

  const hasDnaAnalysis = !!dnaAnalysisRecord;
  const dnaMonthlySurplus = dnaAnalysisRecord ? dnaAnalysisRecord.surplus : 0;

  const multiGoalSummary = useMemo(() => {
    return optimizeMultiGoals(goals, dnaMonthlySurplus);
  }, [goals, dnaMonthlySurplus]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);

  const fmtL = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
    return fmt(v);
  };

  const handleUpdateActiveGoal = (updatedGoal: GoalItem) => {
    const updated = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    setGoals(updated);
    setIsSavedToVault(false);
    syncToVault(updated);
  };

  const syncToVault = async (updatedGoals: GoalItem[]) => {
    saveUserGoals(updatedGoals).catch(console.warn);
    const currentTwin = twin || {
      updatedAt: new Date().toISOString(),
      income: { monthlySalary: 100000, secondaryMonthlyIncome: 0, expectedAnnualGrowthPct: 10, stabilityRating: "high" },
      expenses: { essentialMonthly: 40000, discretionaryMonthly: 20000, recurringAnnual: 50000, irregularAnnual: 25000 },
      savings: { liquidBankBalance: 200000, cashReserves: 50000 },
      investments: [], debts: [], protection: { healthInsuranceCover: 1000000, lifeInsuranceCover: 10000000, dependantsCount: 1, annualHealthPremium: 15000, annualLifePremium: 20000 },
      goals: [], dnaHistory: [], decisions: [], universes: []
    };
    const newTwin = { ...currentTwin, goals: updatedGoals, updatedAt: new Date().toISOString() };
    setTwin(newTwin);
    await saveDigitalTwinToVault(newTwin);
    setIsSavedToVault(true);
  };

  const handleApplyStrategy = (path: any) => {
    if (!activeGoal) return;
    const updated = { ...activeGoal };
    if (path.requiredMonthlySip !== undefined) {
      updated.currentMonthlySip = path.requiredMonthlySip;
    }
    if (path.requiredStepUpPct !== undefined) {
      updated.annualStepUpPct = path.requiredStepUpPct;
    }
    if (path.requiredInitialLumpSum !== undefined) {
      updated.currentAllocatedCorpus = (updated.currentAllocatedCorpus || 0) + path.requiredInitialLumpSum;
    }
    if (path.newTargetYear !== undefined) {
      updated.targetYear = path.newTargetYear;
    }
    handleUpdateActiveGoal(updated);
    setToastMessage(`⚡ Applied: ${path.optionName}! Roadmap recalculated.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateNewGoal = () => {
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }
    if (!newGoalName.trim() || newGoalCostToday <= 0) return;
    const inflationRate = newGoalCategory === "custom"
      ? (newGoalCustomInflation || 6.0)
      : (CATEGORY_INFLATION_DEFAULTS[newGoalCategory] || 6.0);

    const newGoal: GoalItem = {
      id: `goal_${Date.now()}`,
      name: newGoalName.trim(),
      category: newGoalCategory,
      targetAmountToday: newGoalCostToday,
      targetYear: currentYear + Math.max(1, newGoalTenureYears),
      currentAllocatedCorpus: 0,
      currentMonthlySip: 0,
      priority: goals.length + 1,
      expectedReturnPct: 12,
      customInflationPct: inflationRate,
      annualStepUpPct: 10,
    };
    const updated = [...goals, newGoal];
    setGoals(updated);
    setActiveGoalId(newGoal.id);
    setIsAddingNewGoal(false);
    setNewGoalName("");
    setNewGoalCostToday(0);
    setNewGoalTenureYears(5);
    setNewGoalCustomInflation(6.0);
    syncToVault(updated);
    setToastMessage(`🎯 New Goal "${newGoal.name}" added to your navigation deck!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTriggerAddGoal = (category: GoalCategory = "house", name = "", cost = 0, tenure = 5, inflation = 6.0) => {
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }
    setNewGoalCategory(category);
    setNewGoalName(name);
    setNewGoalCostToday(cost);
    setNewGoalTenureYears(tenure);
    setNewGoalCustomInflation(inflation);
    setIsAddingNewGoal(true);
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    if (activeGoalId === id) {
      setActiveGoalId(updated[0]?.id || "");
    }
    syncToVault(updated);
    setToastMessage("Goal removed from your deck.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const tenureYears = activeGoal ? Math.max(1, activeGoal.targetYear - currentYear) : 5;
  const ActiveCategoryIcon = activeGoal ? (CATEGORY_ICONS[activeGoal.category] || Target) : Target;

  return (
    <div className="w-full space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-emerald text-slate-950 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn text-xs sm:text-sm font-black">
          <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-navy pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald font-bold text-xs uppercase tracking-wider mb-1">
            <Target className="w-4 h-4 text-emerald" /> ValarchiX Engine 2: GoalX Navigation
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-heading tracking-tight">
            GoalX Navigation Deck
          </h1>
          <p className="text-muted-grey text-xs sm:text-sm mt-0.5">
            Category inflation, flat vs step-up SIP roadmap, and auto-correcting trajectory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center bg-navy-card border border-border-navy p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewTab("navigator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === "navigator"
                  ? "bg-indigo-600 !text-white shadow-sm"
                  : "text-muted-grey hover:text-heading"
              }`}
            >
              Goal Navigator
            </button>
            <button
              type="button"
              onClick={() => setViewTab("portfolio")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === "portfolio"
                  ? "bg-indigo-600 !text-white shadow-sm"
                  : "text-muted-grey hover:text-heading"
              }`}
            >
              All Goals Portfolio ({goals.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleTriggerAddGoal("house", "", 0, 5, 6.0)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-emerald hover:opacity-95 !text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>
      </div>

      {/* Empty State When No Goals Exist */}
      {goals.length === 0 && (
        <div className="max-w-3xl mx-auto my-10 bg-navy-card border border-border-navy rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-5 text-indigo-400">
            <Target className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-heading mb-2">Build Your Goals from Scratch</h2>
          <p className="text-xs sm:text-sm text-muted-grey max-w-md mx-auto mb-8 leading-relaxed">
            Every investor's journey is unique. Add your personal financial milestones and GoalX will calculate inflation drag, required SIPs, and dynamic step-up roadmaps.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
            <button
              type="button"
              onClick={() => handleTriggerAddGoal("house", "Buy Dream Home", 5000000, 7, 7.0)}
              className="px-4 py-2.5 rounded-xl bg-navy-bg hover:bg-navy-light border border-border-navy text-xs font-bold text-heading flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Building className="w-3.5 h-3.5 text-emerald" /> House (7% Infl)
            </button>
            <button
              type="button"
              onClick={() => handleTriggerAddGoal("education", "Child Higher Education", 2500000, 10, 10.0)}
              className="px-4 py-2.5 rounded-xl bg-navy-bg hover:bg-navy-light border border-border-navy text-xs font-bold text-heading flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Education (10% Infl)
            </button>
            <button
              type="button"
              onClick={() => handleTriggerAddGoal("vehicle", "New Car Upgrade", 1500000, 4, 5.0)}
              className="px-4 py-2.5 rounded-xl bg-navy-bg hover:bg-navy-light border border-border-navy text-xs font-bold text-heading flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Car className="w-3.5 h-3.5 text-amber-400" /> Vehicle (5% Infl)
            </button>
            <button
              type="button"
              onClick={() => handleTriggerAddGoal("custom", "Custom Life Milestone", 1000000, 5, 6.0)}
              className="px-4 py-2.5 rounded-xl bg-navy-bg hover:bg-navy-light border border-border-navy text-xs font-bold text-heading flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Target className="w-3.5 h-3.5 text-rose-400" /> Custom Inflation
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleTriggerAddGoal("house", "", 0, 5, 6.0)}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-emerald/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Your First Goal
          </button>
        </div>
      )}

      {/* Goal Switcher Carousel / Tab Bar */}
      {goals.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6 flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {goals.map((g) => {
            const Icon = CATEGORY_ICONS[g.category] || Target;
            const isActive = g.id === activeGoalId;
            const calc = calculateGoalX(g);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setActiveGoalId(g.id);
                  setViewTab("navigator");
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer shrink-0 shadow-sm ${
                  isActive
                    ? "bg-navy-card border-emerald text-heading ring-2 ring-emerald/30 shadow-emerald/5"
                    : "bg-navy-card/60 hover:bg-navy-card border-border-navy text-muted-grey hover:text-heading"
                }`}
              >
                <div className={`p-1.5 rounded-xl ${isActive ? "bg-emerald/15 text-emerald" : "bg-navy-bg text-muted-grey"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-heading font-extrabold truncate max-w-[140px]">{g.name}</span>
                  <span className="block text-[10px] text-muted-grey font-mono">
                    {fmtL(g.targetAmountToday)} in {Math.max(1, g.targetYear - currentYear)} yrs
                  </span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ml-1 ${
                    calc.status === "Ahead" || calc.status === "On Track"
                      ? "bg-emerald/15 text-emerald"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {calc.status}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          VIEW TAB 1: INDIVIDUAL GOAL NAVIGATOR
         ========================================================================= */}
      {goals.length > 0 && activeGoal && activeCalc && viewTab === "navigator" && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-fadeIn">
          {/* Left Column: Ultra-Simple Inputs (Amount to Buy Now + Tenure) */}
          <div className="lg:col-span-5 bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-border-navy pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald/15 text-emerald">
                    <ActiveCategoryIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-heading">{activeGoal.name}</h2>
                    <span className="text-xs text-muted-grey uppercase font-bold tracking-wider">
                      {activeGoal.category} Category ({activeCalc.inflationPctUsed}% Indian Inflation)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteGoal(activeGoal.id)}
                  title="Delete this goal"
                  className="p-1.5 text-muted-grey hover:text-rose-400 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* CORE INPUT 1: Amount to Buy Today */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider">
                    Cost to Buy Today (₹)
                  </label>
                  <span className="text-xs font-extrabold text-emerald font-mono">
                    {fmtL(activeGoal.targetAmountToday)}
                  </span>
                </div>
                <FinancialInput
                  size="lg"
                  prefix="₹"
                  placeholder="e.g. 50,00,000"
                  value={activeGoal.targetAmountToday}
                  onChange={(v) => handleUpdateActiveGoal({ ...activeGoal, targetAmountToday: v })}
                />
                <span className="text-[11px] text-muted-grey mt-1 block">
                  Enter today's purchase price in current rupee value.
                </span>
              </div>

              {/* CORE INPUT 2: Planning Tenure / Horizon */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider">
                    Planning Tenure to Buy
                  </label>
                  <span className="text-sm font-black text-heading font-mono bg-navy-bg px-2.5 py-0.5 rounded-lg border border-border-navy">
                    {tenureYears} Years (Year {activeGoal.targetYear})
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={tenureYears}
                  onChange={(e) =>
                    handleUpdateActiveGoal({
                      ...activeGoal,
                      targetYear: currentYear + Number(e.target.value),
                    })
                  }
                  className="w-full accent-emerald h-2 rounded-lg cursor-pointer my-2"
                />
                <div className="flex justify-between text-[10px] text-muted-grey font-mono">
                  <span>1 Year</span>
                  <span>5 Years</span>
                  <span>10 Years</span>
                  <span>20 Years</span>
                  <span>30 Years</span>
                </div>
              </div>

              {/* Category Benchmark Inflation Selector */}
              <div className="bg-navy-bg p-3.5 rounded-2xl border border-border-navy space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-heading">Category Specific Inflation Rate</span>
                  <span className="font-extrabold text-emerald">{activeCalc.inflationPctUsed}% / year</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {(["house", "education", "vehicle", "travel", "retirement", "custom"] as GoalCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        handleUpdateActiveGoal({
                          ...activeGoal,
                          category: cat,
                          customInflationPct: cat === "custom"
                            ? (activeGoal.customInflationPct || 6.0)
                            : (CATEGORY_INFLATION_DEFAULTS[cat] || 6.0),
                        })
                      }
                      className={`capitalize py-1.5 px-2 rounded-lg border transition font-bold ${
                        activeGoal.category === cat
                          ? "bg-indigo-600 !text-white border-indigo-500 shadow-sm"
                          : "bg-navy-card text-muted-grey border-border-navy/60 hover:text-heading"
                      }`}
                    >
                      {cat} ({cat === "custom" ? `${activeGoal.customInflationPct ?? 6}%` : `${CATEGORY_INFLATION_DEFAULTS[cat]}%`})
                    </button>
                  ))}
                </div>

                {/* Interactive Custom Inflation Rate Input & Presets */}
                {activeGoal.category === "custom" && (
                  <div className="pt-2 border-t border-border-navy/60 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-[11px] font-bold text-muted-grey uppercase">
                        Edit Custom Inflation Rate (%/yr)
                      </label>
                      <span className="font-mono font-black text-emerald text-xs">
                        {activeGoal.customInflationPct ?? 6.0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        value={activeGoal.customInflationPct ?? 6.0}
                        onChange={(e) =>
                          handleUpdateActiveGoal({
                            ...activeGoal,
                            customInflationPct: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-24 bg-navy-card border border-border-navy rounded-xl px-3 py-1.5 text-heading font-mono text-xs font-bold focus:outline-none focus:border-emerald"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {[5, 6, 7, 8, 10, 12].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() =>
                              handleUpdateActiveGoal({
                                ...activeGoal,
                                customInflationPct: pct,
                              })
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                              (activeGoal.customInflationPct ?? 6.0) === pct
                                ? "bg-emerald text-navy-bg border-emerald"
                                : "bg-navy-card text-muted-grey border-border-navy hover:text-heading"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={0.5}
                      value={activeGoal.customInflationPct ?? 6.0}
                      onChange={(e) =>
                        handleUpdateActiveGoal({
                          ...activeGoal,
                          customInflationPct: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-emerald h-1.5 rounded-lg cursor-pointer my-1"
                    />
                  </div>
                )}
              </div>

              {/* Optional Existing Savings / Current SIP (Collapsed / Clean) */}
              <div className="border-t border-border-navy pt-3 space-y-3">
                <span className="text-[11px] font-bold text-muted-grey uppercase block">
                  Existing Savings / Active Investments (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-grey block mb-1">
                      Already Saved (₹)
                    </label>
                    <FinancialInput
                      size="sm"
                      prefix="₹"
                      placeholder="e.g. 0"
                      value={activeGoal.currentAllocatedCorpus}
                      onChange={(v) => handleUpdateActiveGoal({ ...activeGoal, currentAllocatedCorpus: v })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-grey block mb-1">
                      Current SIP (₹/mo)
                    </label>
                    <FinancialInput
                      size="sm"
                      prefix="₹"
                      placeholder="e.g. 0"
                      value={activeGoal.currentMonthlySip}
                      onChange={(v) => handleUpdateActiveGoal({ ...activeGoal, currentMonthlySip: v })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial DNA Cross-Check Note */}
            {hasDnaAnalysis ? (
              <div className="card-stat-indigo rounded-xl p-3 flex items-start gap-2.5 text-xs">
                <HeartPulse className="w-4 h-4 shrink-0 mt-0.5 text-emerald" />
                <div>
                  <span className="font-bold">Financial DNA Verified Surplus: </span>
                  Your available monthly cash surplus is <strong className="text-emerald">{fmt(dnaMonthlySurplus)}/mo</strong>.
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <span className="font-bold text-amber-300">Financial DNA Analysis Required: </span>
                  Surplus cash calculation requires at least 1 completed Financial DNA assessment.{" "}
                  <Link href="/financial-dna" className="underline font-bold text-amber-400 hover:text-amber-300">
                    Analyze Financial DNA →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Engine Automatic Output Dashboard */}
          <div className="lg:col-span-7 space-y-6">
            {/* Future Inflation Reality Hero Banner */}
            <div className="bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-border-navy pb-3">
                <div>
                  <span className="text-xs font-bold text-emerald uppercase tracking-wider block">
                    Automated Calculation
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-heading">
                    Future Inflation Reality in Year {activeGoal.targetYear}
                  </h3>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-extrabold rounded-full border ${
                    activeCalc.status === "Ahead" || activeCalc.status === "On Track"
                      ? "bg-emerald/10 text-emerald border-emerald/40"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {activeCalc.status}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-light-grey leading-relaxed">
                {activeCalc.statusExplanation}
              </p>

              {/* The 3 Big Math Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="card-tile-neutral p-4 rounded-2xl border">
                  <span className="text-[10px] font-bold text-muted-grey uppercase block">Cost in Today's Terms</span>
                  <div className="text-xl font-black text-heading mt-1">{fmtL(activeCalc.todaysCost)}</div>
                  <span className="text-[10px] text-muted-grey">Base purchase price</span>
                </div>

                <div className="card-stat-emerald p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase block opacity-80">
                    True Future Cost ({activeGoal.targetYear})
                  </span>
                  <div className="text-xl sm:text-2xl font-black mt-1">
                    {fmtL(activeCalc.nominalFutureCost)}
                  </div>
                  <span className="text-[10px] font-semibold opacity-90">
                    +{fmtL(activeCalc.inflationImpactAmount)} Inflation Drag
                  </span>
                </div>

                <div className="card-tile-neutral p-4 rounded-2xl border">
                  <span className="text-[10px] font-bold text-muted-grey uppercase block">Purchasing Power Value</span>
                  <div className="text-xl font-black text-heading mt-1">
                    {fmtL(activeCalc.todaysPurchasingPowerOfProjected)}
                  </div>
                  <span className="text-[10px] text-muted-grey">Real value of corpus</span>
                </div>
              </div>
            </div>

            {/* Tactical Reverse Solvers: 4 Immediate Action Plans */}
            <div className="bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border-navy pb-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald" /> Automated Roadmap Solvers
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-heading mt-0.5">
                    How Can You Reach This Goal?
                  </h3>
                </div>
                <span className="text-xs text-muted-grey">Engine 12% CAGR Benchmark</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeCalc.recommendedPaths.map((path, idx) => (
                  <div
                    key={idx}
                    className="bg-navy-bg border border-border-navy hover:border-emerald/40 transition rounded-2xl p-4 flex flex-col justify-between shadow-md space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-heading">{path.optionName}</span>
                        {path.benefitTag && (
                          <span className="text-[10px] font-extrabold bg-emerald/10 text-emerald border border-emerald/30 px-2 py-0.5 rounded-full">
                            {path.benefitTag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-light-grey leading-relaxed">{path.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyStrategy(path)}
                      className="w-full bg-emerald/10 hover:bg-emerald hover:text-slate-950 text-emerald text-xs font-extrabold py-2.5 rounded-xl border border-emerald/40 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" /> Apply This Strategy
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Year-by-Year Milestone Compounding Roadmap */}
            <div className="bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border-navy pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-base sm:text-lg font-black text-heading">
                    Year-by-Year Compounding Milestone Track
                  </h3>
                </div>
                <span className="text-xs text-muted-grey">Growth Trajectory</span>
              </div>

              <div className="max-h-64 overflow-y-auto pr-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] text-muted-grey uppercase border-b border-border-navy/60 pb-2">
                      <th className="pb-2">Year</th>
                      <th className="pb-2">Target Value</th>
                      <th className="pb-2">Cumulative Invested</th>
                      <th className="pb-2 text-right">Projected Corpus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-navy/40">
                    {activeCalc.milestones.map((m) => (
                      <tr key={m.year} className="hover:bg-navy-bg/60 transition">
                        <td className="py-2.5 font-bold text-heading">
                          Year {m.year} <span className="text-[10px] text-muted-grey font-normal">(+{m.yearsFromNow} yr)</span>
                        </td>
                        <td className="py-2.5 font-mono text-muted-grey">{fmtL(m.targetFutureValueSoFar)}</td>
                        <td className="py-2.5 font-mono text-muted-grey">{fmtL(m.cumulativeInvested)}</td>
                        <td className="py-2.5 font-black text-emerald text-right font-mono">{fmtL(m.projectedCorpus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW TAB 2: ALL GOALS PORTFOLIO AGGREGATE
         ========================================================================= */}
      {goals.length > 0 && viewTab === "portfolio" && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          {/* Aggregate Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-navy-card p-4 rounded-2xl border border-border-navy shadow-md">
              <span className="text-[10px] font-bold text-muted-grey uppercase block">Total Goals Tracked</span>
              <div className="text-2xl font-black text-heading mt-1">{multiGoalSummary.goalsCount} Goals</div>
              <span className="text-[10px] text-emerald font-semibold">Active Navigation</span>
            </div>

            <div className="bg-navy-card p-4 rounded-2xl border border-border-navy shadow-md">
              <span className="text-[10px] font-bold text-muted-grey uppercase block">Total Cost Today</span>
              <div className="text-2xl font-black text-heading mt-1">{fmtL(multiGoalSummary.totalTodaysCost)}</div>
              <span className="text-[10px] text-muted-grey">Base Value</span>
            </div>

            <div className="bg-navy-card p-4 rounded-2xl border border-border-navy shadow-md">
              <span className="text-[10px] font-bold text-indigo-300 uppercase block">Total Future Liability</span>
              <div className="text-2xl font-black text-emerald mt-1">{fmtL(multiGoalSummary.totalNominalFutureCost)}</div>
              <span className="text-[10px] text-muted-grey">Inflation Adjusted</span>
            </div>

            <div className="bg-navy-card p-4 rounded-2xl border border-border-navy shadow-md">
              <span className="text-[10px] font-bold text-emerald uppercase block">Total Required SIP</span>
              <div className="text-2xl font-black text-emerald mt-1">{fmt(multiGoalSummary.totalRequiredSip)}/mo</div>
              <span className="text-[10px] text-muted-grey">Across All Goals</span>
            </div>
          </div>

          {/* Cash Flow Feasibility Bar */}
          <div className="bg-navy-card border border-border-navy rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-heading uppercase tracking-wider flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald" /> Portfolio Monthly Cash Flow Feasibility
              </span>
              <span className="text-muted-grey">
                {hasDnaAnalysis ? (
                  <>Surplus: <strong className="text-heading">{fmt(dnaMonthlySurplus)}/mo</strong></>
                ) : (
                  <span className="text-amber-400 font-mono text-[11px]">Analysis Required</span>
                )}
              </span>
            </div>

            {!hasDnaAnalysis ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold text-amber-300">Financial DNA Analysis Required: </span>
                    Total required SIP across all goals is <strong className="font-black text-heading">{fmt(multiGoalSummary.totalRequiredSip)}/mo</strong>. To verify whether your take-home surplus comfortably finances these goals, complete your Financial DNA assessment.
                  </div>
                </div>
                <Link
                  href="/financial-dna"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold transition shrink-0"
                >
                  <Zap className="w-3.5 h-3.5" /> Analyze DNA
                </Link>
              </div>
            ) : multiGoalSummary.isDeficit ? (
              <div className="banner-alert-rose rounded-xl p-3.5 flex items-start gap-3 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <span className="font-bold">Cash Flow Allocation Warning: </span>
                  Your required goal SIPs total <strong className="font-black">{fmt(multiGoalSummary.totalRequiredSip)}/mo</strong>, which exceeds your available Financial DNA monthly surplus of <strong className="font-black">{fmt(dnaMonthlySurplus)}/mo</strong> by <strong className="font-black">{fmt(multiGoalSummary.budgetGap)}/mo</strong>. Consider using the Step-Up strategy or extending tenures.
                </div>
              </div>
            ) : (
              <div className="banner-alert-emerald rounded-xl p-3.5 flex items-start gap-3 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald" />
                <div>
                  <span className="font-bold">Comfortable Cash Flow Alignment: </span>
                  Your total required SIP of <strong className="font-black">{fmt(multiGoalSummary.totalRequiredSip)}/mo</strong> fits well inside your monthly surplus of <strong className="font-black text-emerald">{fmt(dnaMonthlySurplus)}/mo</strong> with <strong className="font-black text-emerald">{fmt(dnaMonthlySurplus - multiGoalSummary.totalRequiredSip)}/mo</strong> remaining buffer!
                </div>
              </div>
            )}
          </div>

          {/* List of All Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.map((g) => {
              const calc = calculateGoalX(g);
              const Icon = CATEGORY_ICONS[g.category] || Target;
              return (
                <div
                  key={g.id}
                  className="bg-navy-card border border-border-navy rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-emerald/15 text-emerald">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-heading text-sm">{g.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          calc.status === "Ahead" || calc.status === "On Track"
                            ? "bg-emerald/15 text-emerald border-emerald/40"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {calc.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs card-tile-neutral p-3 rounded-xl border">
                      <div>
                        <span className="text-muted-grey text-[10px] uppercase block">Today's Cost</span>
                        <span className="font-bold text-heading">{fmtL(g.targetAmountToday)}</span>
                      </div>
                      <div>
                        <span className="text-muted-grey text-[10px] uppercase block">Future Cost</span>
                        <span className="font-extrabold text-emerald">{fmtL(calc.nominalFutureCost)}</span>
                      </div>
                      <div>
                        <span className="text-muted-grey text-[10px] uppercase block">Tenure</span>
                        <span className="font-bold text-heading">{Math.max(1, g.targetYear - currentYear)} yrs ({g.targetYear})</span>
                      </div>
                      <div>
                        <span className="text-muted-grey text-[10px] uppercase block">Required SIP</span>
                        <span className="font-extrabold text-indigo-500 dark:text-indigo-300">{fmt(calc.requiredMonthlySip)}/mo</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveGoalId(g.id);
                      setViewTab("navigator");
                    }}
                    className="w-full bg-navy-bg hover:bg-navy-light border border-border-navy text-heading text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Open in Navigator <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW GOAL
         ========================================================================= */}
      {isAddingNewGoal && (
        <div className="fixed inset-0 bg-navy-bg/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-navy-card border border-border-navy rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="border-b border-border-navy pb-3">
              <span className="text-xs font-bold text-emerald uppercase tracking-wider">New Ambition</span>
              <h3 className="text-xl font-black text-heading mt-0.5">Add Life Goal to Navigation</h3>
              <p className="text-xs text-muted-grey mt-0.5">
                Provide today's purchase price and planned tenure. The engine will calculate the rest.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-grey uppercase block mb-1">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vacation in Switzerland / Luxury Watch"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-4 py-2.5 text-heading font-bold text-sm focus:border-emerald focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase block mb-1">Category</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value as GoalCategory)}
                    className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2.5 text-heading font-bold text-xs focus:border-emerald focus:outline-none capitalize"
                  >
                    <option value="house">House (7% Infl)</option>
                    <option value="education">Education (10% Infl)</option>
                    <option value="vehicle">Vehicle (5% Infl)</option>
                    <option value="travel">Travel (6% Infl)</option>
                    <option value="retirement">Retirement (6% Infl)</option>
                    <option value="emergency">Emergency (6% Infl)</option>
                    <option value="custom">Custom (6% Infl)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase block mb-1">
                    Tenure (Years)
                  </label>
                  <FinancialInput
                    prefix=""
                    suffix="yrs"
                    placeholder="e.g. 5"
                    value={newGoalTenureYears}
                    onChange={(v) => setNewGoalTenureYears(Math.max(1, v))}
                    min={1}
                    max={40}
                  />
                </div>
              </div>

                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase block mb-1">
                    Cost to Buy Today (₹)
                  </label>
                  <FinancialInput
                    size="lg"
                    prefix="₹"
                    placeholder="e.g. 20,00,000"
                    value={newGoalCostToday}
                    onChange={(v) => setNewGoalCostToday(v)}
                  />
                </div>

                {newGoalCategory === "custom" && (
                  <div className="pt-2 border-t border-border-navy/60 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-[11px] font-bold text-muted-grey uppercase">
                        Custom Inflation Rate (% / year)
                      </label>
                      <span className="font-mono font-black text-emerald text-xs">
                        {newGoalCustomInflation}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        value={newGoalCustomInflation}
                        onChange={(e) => setNewGoalCustomInflation(parseFloat(e.target.value) || 0)}
                        className="w-24 bg-navy-bg border border-border-navy rounded-xl px-3 py-1.5 text-heading font-mono text-xs font-bold focus:outline-none focus:border-emerald"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {[5, 6, 7, 8, 10, 12].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setNewGoalCustomInflation(pct)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                              newGoalCustomInflation === pct
                                ? "bg-emerald text-navy-bg border-emerald"
                                : "bg-navy-bg text-muted-grey border-border-navy hover:text-heading"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            <div className="flex gap-3 pt-3 border-t border-border-navy">
              <button
                type="button"
                onClick={() => setIsAddingNewGoal(false)}
                className="w-1/2 bg-navy-bg hover:bg-navy-light border border-border-navy text-heading font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewGoal}
                disabled={!newGoalName.trim() || newGoalCostToday <= 0}
                className={`w-1/2 !text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer shadow-lg ${
                  !newGoalName.trim() || newGoalCostToday <= 0
                    ? "bg-muted-grey/40 opacity-50 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-emerald hover:opacity-95 shadow-emerald/20"
                }`}
              >
                Launch Goal Navigation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Auth Modal Gate */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-navy-card border border-border-navy rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-muted-grey hover:text-heading rounded-full hover:bg-navy-bg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald/10 border border-emerald/30 flex items-center justify-center mx-auto text-emerald">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-heading">Sign In to Save &amp; Track Goals</h3>
              <p className="text-xs text-muted-grey leading-relaxed">
                Only logged-in users can add custom financial goals, persist their roadmaps in their personal cloud account, and track goal trajectories.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => signInWithGoogle("/goalx")}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm transition flex items-center justify-center gap-3 shadow-lg cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2.5 text-xs text-muted-grey hover:text-heading font-semibold transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
