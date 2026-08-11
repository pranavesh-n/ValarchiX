"use client";

import React, { useState, useEffect } from "react";
import { 
  Target, TrendingUp, AlertCircle, ArrowRight, ShieldCheck, 
  Layers, Calculator, Sparkles, CheckCircle2, ChevronRight, Sliders, Save, Lock, Check
} from "lucide-react";
import { calculateGoalX, CATEGORY_INFLATION_DEFAULTS } from "@/lib/engine/goalx";
import { GoalItem, GoalCategory } from "@/lib/engine/types";
import { formatINR, formatINRWords, valueToSliderPos, sliderPosToValue } from "@/lib/engine/numeric";
import { getCurrentUserSession, loadDigitalTwinFromVault, saveDigitalTwinToVault } from "@/lib/supabase/auth";

const INITIAL_GOAL: GoalItem = {
  id: "g1",
  name: "Buy Dream Electric SUV",
  category: "vehicle",
  targetAmountToday: 1500000,
  targetYear: 2030,
  currentAllocatedCorpus: 300000,
  currentMonthlySip: 10000,
  priority: 1,
  expectedReturnPct: 12,
  customInflationPct: 5.0,
  annualStepUpPct: 10,
};

export default function GoalXPage() {
  const [goal, setGoal] = useState<GoalItem>(INITIAL_GOAL);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSavedToVault, setIsSavedToVault] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const session = await getCurrentUserSession();
      setIsSignedIn(!!session?.user);
      const twin = await loadDigitalTwinFromVault();
      if (twin && twin.goals && twin.goals.length > 0) {
        setGoal(twin.goals[0]);
      }
    }
    checkAuth();
  }, []);

  const res = calculateGoalX(goal);

  const handleSliderChange = (pos: number) => {
    const val = sliderPosToValue(pos);
    setGoal({ ...goal, targetAmountToday: val });
  };

  const handleApplyStrategy = (path: any) => {
    const updated = { ...goal };
    if (path.requiredMonthlySip) {
      updated.currentMonthlySip = path.requiredMonthlySip;
    } else if (path.requiredStepUpPct) {
      updated.annualStepUpPct = path.requiredStepUpPct;
    } else if (path.requiredInitialLumpSum) {
      updated.currentAllocatedCorpus = updated.currentAllocatedCorpus + path.requiredInitialLumpSum;
    } else if (path.newTargetYear) {
      updated.targetYear = path.newTargetYear;
    }
    setGoal(updated);
    setIsSavedToVault(false);
    setToastMessage(`⚡ Applied: ${path.optionName}! Parameters updated and trajectory recalculating...`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveToVault = async () => {
    const twin = (await loadDigitalTwinFromVault()) || {
      updatedAt: new Date().toISOString(),
      income: { monthlySalary: 120000, secondaryMonthlyIncome: 15000, expectedAnnualGrowthPct: 10, stabilityRating: "high" },
      expenses: { essentialMonthly: 45000, discretionaryMonthly: 25000, recurringAnnual: 60000, irregularAnnual: 30000 },
      savings: { liquidBankBalance: 300000, cashReserves: 50000 },
      investments: [], debts: [], protection: { healthInsuranceCover: 1000000, lifeInsuranceCover: 7500000, dependantsCount: 2, annualHealthPremium: 18000, annualLifePremium: 22000 },
      goals: [], dnaHistory: [], decisions: [], universes: []
    };

    const existingGoalIdx = twin.goals.findIndex((g) => g.id === goal.id || g.name === goal.name);
    if (existingGoalIdx >= 0) {
      twin.goals[existingGoalIdx] = goal;
    } else {
      twin.goals.push(goal);
    }

    await saveDigitalTwinToVault(twin);
    setIsSavedToVault(true);
    setToastMessage("🔒 Goal successfully saved and synced to your Personal Financial Vault!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-navy-bg text-light-grey p-3 sm:p-4 md:p-8">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-emerald-950 text-emerald border border-emerald/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn text-xs sm:text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-border-navy pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald font-bold text-sm mb-1 uppercase tracking-wider">
            <Target className="w-4 h-4 text-emerald" /> Engine 2: GoalX Navigation
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-heading">Inflation-Adjusted Goal Navigation</h1>
          <p className="text-muted-grey text-xs sm:text-sm mt-1">
            «Your goal has a future price. We calculate the journey.»
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <button
              onClick={handleSaveToVault}
              className="flex items-center gap-2 bg-emerald/10 hover:bg-emerald hover:text-navy-bg text-emerald border border-emerald/40 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-md"
            >
              {isSavedToVault ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isSavedToVault ? "Synced to Vault" : "Save Goal to Vault"}
            </button>
          ) : (
            <a href="/auth" className="flex items-center gap-2 text-xs bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-3.5 py-2 rounded-xl hover:bg-indigo-900 transition font-semibold">
              <Lock className="w-3.5 h-3.5" /> Sign In to Save Goals
            </a>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Inputs Drawer */}
        <div className="lg:col-span-5 bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-extrabold text-heading flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald" /> Goal Parameters
          </h2>

          {/* Goal Name & Category */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-grey uppercase">Goal Name</label>
              <input
                type="text"
                value={goal.name}
                onChange={(e) => setGoal({ ...goal, name: e.target.value })}
                className="w-full bg-navy-bg border border-border-navy rounded-xl px-4 py-2.5 text-heading font-bold text-sm mt-1 focus:border-emerald focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-grey uppercase">Category</label>
                <select
                  value={goal.category}
                  onChange={(e) => setGoal({ ...goal, category: e.target.value as GoalCategory })}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2.5 text-heading text-xs sm:text-sm mt-1 focus:border-emerald focus:outline-none font-semibold"
                >
                  <option value="vehicle">Vehicle (5% Infl)</option>
                  <option value="education">Education (10% Infl)</option>
                  <option value="house">Housing (7% Infl)</option>
                  <option value="travel">Travel (6% Infl)</option>
                  <option value="retirement">Retirement (6% Infl)</option>
                  <option value="emergency">Emergency (6% Infl)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-grey uppercase">Target Year</label>
                <input
                  type="number"
                  value={goal.targetYear}
                  onChange={(e) => setGoal({ ...goal, targetYear: Number(e.target.value) })}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-4 py-2.5 text-heading font-bold text-sm mt-1 focus:border-emerald focus:outline-none"
                />
              </div>
            </div>

            {/* Target Amount Today (Unlimited Numeric Input + Adaptive Slider) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-muted-grey uppercase">Goal Cost Today</label>
                <span className="text-sm font-black text-emerald">{formatINRWords(goal.targetAmountToday)}</span>
              </div>

              <input
                type="number"
                value={goal.targetAmountToday}
                onChange={(e) => setGoal({ ...goal, targetAmountToday: Math.max(1, Number(e.target.value)) })}
                className="w-full bg-navy-bg border border-border-navy rounded-xl px-4 py-2.5 text-heading font-bold text-base mb-2 focus:border-emerald focus:outline-none"
              />

              {/* Logarithmic / Adaptive Slider */}
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={valueToSliderPos(goal.targetAmountToday)}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey mt-1 font-semibold">
                <span>₹1k</span>
                <span>₹10L</span>
                <span>₹1Cr</span>
                <span>₹100Cr</span>
              </div>
            </div>

            {/* Current Portfolio & Monthly SIP */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-grey uppercase">Current Corpus</label>
                <input
                  type="number"
                  value={goal.currentAllocatedCorpus}
                  onChange={(e) => setGoal({ ...goal, currentAllocatedCorpus: Number(e.target.value) })}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-grey uppercase">Monthly SIP</label>
                <input
                  type="number"
                  value={goal.currentMonthlySip}
                  onChange={(e) => setGoal({ ...goal, currentMonthlySip: Number(e.target.value) })}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1"
                />
              </div>
            </div>

            {/* Assumptions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-grey uppercase">Expected Return %</label>
                <input
                  type="number"
                  value={goal.expectedReturnPct}
                  onChange={(e) => setGoal({ ...goal, expectedReturnPct: Number(e.target.value) })}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-grey uppercase">Annual Step-Up %</label>
                <input
                  type="number"
                  value={goal.annualStepUpPct || 0}
                  onChange={(e) => setGoal({ ...goal, annualStepUpPct: Number(e.target.value) })}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2 text-heading font-bold text-sm mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Dashboard */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status & Inflation Impact Hero */}
          <div className="bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-muted-grey uppercase">Goal Status Diagnosis</span>
              <span className={`px-3.5 py-1 text-xs font-extrabold rounded-full border transition-all ${
                res.status === "Ahead" || res.status === "On Track"
                  ? "bg-emerald/10 text-emerald border-emerald/40 shadow-sm"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}>
                {res.status}
              </span>
            </div>

            <p className="text-light-grey text-xs sm:text-sm mb-6 leading-relaxed font-medium">{res.statusExplanation}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border-navy pt-4">
              <div className="bg-navy-bg p-3 rounded-2xl border border-border-navy">
                <div className="text-[10px] text-muted-grey uppercase font-bold">Cost Today</div>
                <div className="text-base sm:text-lg font-bold text-heading mt-0.5">{formatINRWords(res.todaysCost)}</div>
              </div>

              <div className="bg-navy-bg p-3 rounded-2xl border border-emerald/30">
                <div className="text-[10px] text-emerald uppercase font-bold">Est. Future Cost ({res.goal.targetYear})</div>
                <div className="text-base sm:text-lg font-black text-emerald mt-0.5">{formatINRWords(res.nominalFutureCost)}</div>
                <div className="text-[10px] text-emerald font-medium">+{(res.inflationImpactAmount / 100000).toFixed(1)}L Inflation Drag</div>
              </div>

              <div className="bg-navy-bg p-3 rounded-2xl border border-border-navy">
                <div className="text-[10px] text-muted-grey uppercase font-bold">Projected Corpus</div>
                <div className="text-base sm:text-lg font-bold text-heading mt-0.5">{formatINRWords(res.projectedCorpusBase)}</div>
              </div>
            </div>
          </div>

          {/* Reverse Solver: "How Can I Reach It?" */}
          <div className="bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl">
            <h3 className="text-lg font-extrabold text-heading mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald" /> Goal Reverse Engine: Alternative Strategies
            </h3>

            <div className="space-y-3">
              {res.recommendedPaths.map((path, idx) => (
                <div key={idx} className="bg-navy-bg border border-border-navy rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald/40 transition">
                  <div>
                    <div className="text-sm font-extrabold text-heading">{path.optionName}</div>
                    <div className="text-xs text-muted-grey mt-0.5">{path.description}</div>
                  </div>

                  <button
                    onClick={() => handleApplyStrategy(path)}
                    className="bg-emerald/10 hover:bg-emerald hover:text-navy-bg text-emerald text-xs font-extrabold px-4 py-2.5 rounded-xl border border-emerald/40 transition self-start sm:self-auto cursor-pointer shadow-sm"
                  >
                    Apply Strategy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
