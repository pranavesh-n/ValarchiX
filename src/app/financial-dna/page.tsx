"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Shield, Activity, TrendingUp, AlertTriangle, ArrowUpRight,
  CheckCircle2, Sliders, RefreshCw, Zap, Clock, Info, HeartPulse,
  ChevronRight, Lock, X, Save, Wallet, Building, FileText, ArrowLeft,
  Plus, Trash2, Check, Sparkles, TrendingDown, Target, HelpCircle,
  BarChart3, Scale, Layers, ChevronDown, CheckCircle, AlertCircle,
  Eye, Gauge, Award, RotateCcw
} from "lucide-react";
import FinancialInput from "@/components/FinancialInput";
import {
  calculateFinancialDna,
  calculateTotalMonthlyIncome,
  calculateTotalNeeds,
  calculateTotalWants,
  calculateTotalMonthlyInsuranceCost,
  calculateTrueMonthlyEssentialRequirement,
  calculateEmergencyFundTargets,
  calculateEmergencyCoverageMonths,
  normalizeInsurancePremium,
  calculateInvestmentRate,
  calculateFutureValueInflation,
  simulateDnaImpact,
} from "@/lib/engine/dna";
import {
  FinancialDigitalTwin,
  FinancialAssessmentData,
  ExpenseCategoryItem,
  IncomeSourceItem,
  EmploymentType,
  InsuranceFrequency,
  FinancialDnaScore,
} from "@/lib/engine/types";
import {
  loadDigitalTwinFromVault,
  saveDigitalTwinToVault,
  getCurrentUserSession,
  signInWithGoogle,
} from "@/lib/supabase/auth";

// Baseline benchmark ghost values for transparent calculation
const GHOST_BENCHMARKS = {
  primaryIncome: 80000,
  emergencyFund: 180000,
  healthCoverage: 1000000,
  healthPremium: 12000,
  termCoverage: 10000000,
  termPremium: 18000,
  sip: 10000,
  needs: {
    n_rent: 25000,
    n_groc: 10000,
    n_fuel: 3500,
    n_util: 2500,
    n_mob: 1200,
    n_med: 2000,
    n_edu: 5000,
    n_emi: 15000,
    n_fam: 3000,
    n_oth: 2000,
  } as Record<string, number>,
  wants: {
    w_food: 3000,
    w_shop: 4000,
    w_ent: 1500,
    w_game: 1000,
    w_trav: 2500,
    w_dine: 2500,
    w_subs: 800,
    w_mus: 500,
    w_care: 1200,
    w_fit: 1000,
    w_oth: 1500,
  } as Record<string, number>,
};

const DEFAULT_NEEDS: ExpenseCategoryItem[] = [
  { id: "n_rent", name: "Rent / Home Expense", amount: 0, placeholder: "e.g. 25,000", type: "NEED" },
  { id: "n_groc", name: "Groceries & Food", amount: 0, placeholder: "e.g. 10,000", type: "NEED" },
  { id: "n_fuel", name: "Fuel / Transportation", amount: 0, placeholder: "e.g. 3,500", type: "NEED" },
  { id: "n_util", name: "Electricity & Utilities", amount: 0, placeholder: "e.g. 2,500", type: "NEED" },
  { id: "n_mob", name: "Mobile & Internet", amount: 0, placeholder: "e.g. 1,200", type: "NEED" },
  { id: "n_med", name: "Medical Expenses", amount: 0, placeholder: "e.g. 2,000", type: "NEED" },
  { id: "n_edu", name: "Education & Courses", amount: 0, placeholder: "e.g. 5,000", type: "NEED" },
  { id: "n_emi", name: "EMI / Loan Payments", amount: 0, placeholder: "e.g. 15,000", type: "NEED" },
  { id: "n_fam", name: "Family Expenses", amount: 0, placeholder: "e.g. 3,000", type: "NEED" },
  { id: "n_oth", name: "Other Essential Expenses", amount: 0, placeholder: "e.g. 2,000", type: "NEED" },
];

const DEFAULT_WANTS: ExpenseCategoryItem[] = [
  { id: "w_food", name: "Online Food Orders", amount: 0, placeholder: "e.g. 3,000", type: "WANT" },
  { id: "w_shop", name: "Shopping & Clothes", amount: 0, placeholder: "e.g. 4,000", type: "WANT" },
  { id: "w_ent", name: "Entertainment & Movies", amount: 0, placeholder: "e.g. 1,500", type: "WANT" },
  { id: "w_game", name: "Gaming", amount: 0, placeholder: "e.g. 1,000", type: "WANT" },
  { id: "w_trav", name: "Travel & Vacations", amount: 0, placeholder: "e.g. 2,500", type: "WANT" },
  { id: "w_dine", name: "Dining Out", amount: 0, placeholder: "e.g. 2,500", type: "WANT" },
  { id: "w_subs", name: "Subscriptions (OTT/Apps)", amount: 0, placeholder: "e.g. 800", type: "WANT" },
  { id: "w_mus", name: "Music & Events", amount: 0, placeholder: "e.g. 500", type: "WANT" },
  { id: "w_care", name: "Personal Care & Grooming", amount: 0, placeholder: "e.g. 1,200", type: "WANT" },
  { id: "w_fit", name: "Fitness & Gym", amount: 0, placeholder: "e.g. 1,000", type: "WANT" },
  { id: "w_oth", name: "Other Wants", amount: 0, placeholder: "e.g. 1,500", type: "WANT" },
];

const INITIAL_ASSESSMENT: FinancialAssessmentData = {
  profile: {
    age: 0,
    employmentType: "Salaried",
    dependents: 0,
    earningMembers: 0,
  },
  income: {
    primaryMonthlyTakeHome: 0,
    additionalSources: [],
  },
  needs: DEFAULT_NEEDS,
  wants: DEFAULT_WANTS,
  emergencyFund: {
    hasEmergencyFund: false,
    currentAmount: 0,
  },
  healthInsurance: {
    hasInsurance: false,
    coverageAmount: 0,
    premiumAmount: 0,
    frequency: "Yearly",
  },
  termInsurance: {
    hasInsurance: false,
    coverageAmount: 0,
    premiumAmount: 0,
    frequency: "Yearly",
  },
  sip: {
    hasSip: false,
    monthlySip: 0,
  },
};

const DEFAULT_TWIN: FinancialDigitalTwin = {
  updatedAt: new Date().toISOString(),
  assessmentData: INITIAL_ASSESSMENT,
  income: {
    monthlySalary: 0,
    secondaryMonthlyIncome: 0,
    expectedAnnualGrowthPct: 10,
    stabilityRating: "high",
  },
  expenses: {
    essentialMonthly: 0,
    discretionaryMonthly: 0,
    recurringAnnual: 0,
    irregularAnnual: 0,
  },
  savings: {
    liquidBankBalance: 0,
    cashReserves: 0,
  },
  investments: [],
  debts: [],
  protection: {
    healthInsuranceCover: 0,
    lifeInsuranceCover: 0,
    dependantsCount: 0,
    annualHealthPremium: 0,
    annualLifePremium: 0,
  },
  goals: [],
  dnaHistory: [],
  decisions: [],
  universes: [],
};

const EMPLOYMENT_OPTIONS: EmploymentType[] = [
  "Salaried",
  "Self-employed",
  "Business owner",
  "Freelancer",
  "Student",
  "Retired",
  "Other",
];

const FREQUENCIES: InsuranceFrequency[] = ["Monthly", "Quarterly", "Half-yearly", "Yearly"];

/**
 * Builds an effective assessment where any unfilled (0) input uses its transparent benchmark
 * for live telemetry and reactive visual graphing.
 */
function buildEffectiveAssessment(raw: FinancialAssessmentData): {
  effective: FinancialAssessmentData;
  userFilledCount: number;
  totalKeyFields: number;
  isPurePreview: boolean;
} {
  let filled = 0;
  const total = 7;

  const hasUserIncome = (raw.income.primaryMonthlyTakeHome || 0) > 0 || (raw.income.additionalSources || []).length > 0;
  if (hasUserIncome) filled++;

  const hasUserNeeds = (raw.needs || []).some((n) => (n.amount || 0) > 0);
  if (hasUserNeeds) filled++;

  const hasUserWants = (raw.wants || []).some((w) => (w.amount || 0) > 0);
  if (hasUserWants) filled++;

  const hasUserEmergency = raw.emergencyFund.hasEmergencyFund && (raw.emergencyFund.currentAmount || 0) > 0;
  if (hasUserEmergency) filled++;

  const hasUserHealth = raw.healthInsurance.hasInsurance && (raw.healthInsurance.coverageAmount || 0) > 0;
  if (hasUserHealth) filled++;

  const hasUserTerm = raw.termInsurance.hasInsurance && (raw.termInsurance.coverageAmount || 0) > 0;
  if (hasUserTerm) filled++;

  const hasUserSip = raw.sip.hasSip && (raw.sip.monthlySip || 0) > 0;
  if (hasUserSip) filled++;

  const effective: FinancialAssessmentData = {
    profile: {
      ...raw.profile,
      age: raw.profile.age > 0 ? raw.profile.age : 28,
      earningMembers: raw.profile.earningMembers > 0 ? raw.profile.earningMembers : 1,
      dependents: raw.profile.dependents || 0,
    },
    income: {
      primaryMonthlyTakeHome:
        raw.income.primaryMonthlyTakeHome > 0
          ? raw.income.primaryMonthlyTakeHome
          : GHOST_BENCHMARKS.primaryIncome,
      additionalSources: raw.income.additionalSources || [],
    },
    needs: (raw.needs || DEFAULT_NEEDS).map((n) => ({
      ...n,
      amount: n.amount > 0 ? n.amount : (GHOST_BENCHMARKS.needs[n.id] || 2000),
    })),
    wants: (raw.wants || DEFAULT_WANTS).map((w) => ({
      ...w,
      amount: w.amount > 0 ? w.amount : (GHOST_BENCHMARKS.wants[w.id] || 1500),
    })),
    emergencyFund: {
      hasEmergencyFund: true,
      currentAmount:
        raw.emergencyFund.currentAmount > 0
          ? raw.emergencyFund.currentAmount
          : GHOST_BENCHMARKS.emergencyFund,
    },
    healthInsurance: {
      hasInsurance: true,
      coverageAmount:
        raw.healthInsurance.coverageAmount > 0
          ? raw.healthInsurance.coverageAmount
          : GHOST_BENCHMARKS.healthCoverage,
      premiumAmount:
        raw.healthInsurance.premiumAmount > 0
          ? raw.healthInsurance.premiumAmount
          : GHOST_BENCHMARKS.healthPremium,
      frequency: raw.healthInsurance.frequency || "Yearly",
    },
    termInsurance: {
      hasInsurance: true,
      coverageAmount:
        raw.termInsurance.coverageAmount > 0
          ? raw.termInsurance.coverageAmount
          : GHOST_BENCHMARKS.termCoverage,
      premiumAmount:
        raw.termInsurance.premiumAmount > 0
          ? raw.termInsurance.premiumAmount
          : GHOST_BENCHMARKS.termPremium,
      frequency: raw.termInsurance.frequency || "Yearly",
    },
    sip: {
      hasSip: true,
      monthlySip:
        raw.sip.monthlySip > 0
          ? raw.sip.monthlySip
          : GHOST_BENCHMARKS.sip,
    },
  };

  return {
    effective,
    userFilledCount: filled,
    totalKeyFields: total,
    isPurePreview: filled === 0,
  };
}

export default function FinancialDnaPage() {
  const [twin, setTwin] = useState<FinancialDigitalTwin>(DEFAULT_TWIN);
  const [viewMode, setViewMode] = useState<"results" | "assessment">("assessment");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showInputDrawer, setShowInputDrawer] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [acknowledgedDeficit, setAcknowledgedDeficit] = useState<boolean>(false);

  // Time Machine Simulation Interactive Deltas
  const [simSipDelta, setSimSipDelta] = useState(5000);
  const [simEmergencyDelta, setSimEmergencyDelta] = useState(100000);

  // Inflation interactive calculator state
  const [inflationYears, setInflationYears] = useState(20);
  const [inflationRate, setInflationRate] = useState(6.0);

  // Custom expense creation state
  const [newNeedName, setNewNeedName] = useState("");
  const [newNeedAmount, setNewNeedAmount] = useState<number>(0);
  const [newWantName, setNewWantName] = useState("");
  const [newWantAmount, setNewWantAmount] = useState<number>(0);
  const [newIncName, setNewIncName] = useState("");
  const [newIncType, setNewIncType] = useState<IncomeSourceItem["type"]>("Freelance");
  const [newIncAmount, setNewIncAmount] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      const session = await getCurrentUserSession();
      setIsSignedIn(!!session?.user);
      // Always start fresh from Step 1 on a clean slate with transparent benchmark previews
      setTwin({
        ...DEFAULT_TWIN,
        assessmentData: INITIAL_ASSESSMENT,
      });
      setViewMode("assessment");
      setCurrentStep(1);
    }
    loadData();
  }, []);

  const assessmentData = twin.assessmentData || INITIAL_ASSESSMENT;

  // Compute effective transparent vs user-modified data
  const { effective, userFilledCount, totalKeyFields, isPurePreview } = useMemo(() => {
    return buildEffectiveAssessment(assessmentData);
  }, [assessmentData]);

  // Compute live DNA score based on active/effective state
  const activeTwinForCalc: FinancialDigitalTwin = useMemo(() => {
    return {
      ...twin,
      assessmentData: isPurePreview ? effective : assessmentData,
    };
  }, [twin, effective, assessmentData, isPurePreview]);

  const dna: FinancialDnaScore = useMemo(() => {
    return calculateFinancialDna(activeTwinForCalc);
  }, [activeTwinForCalc]);

  const snapshot = dna.snapshot;

  // Sync state helper
  const handleUpdateAssessment = (updatedData: FinancialAssessmentData) => {
    const updatedTwin: FinancialDigitalTwin = {
      ...twin,
      assessmentData: updatedData,
      profile: updatedData.profile,
      income: {
        ...twin.income,
        monthlySalary: updatedData.income.primaryMonthlyTakeHome,
      },
      expenses: {
        ...twin.expenses,
        essentialMonthly: calculateTotalNeeds(updatedData.needs),
        discretionaryMonthly: calculateTotalWants(updatedData.wants),
      },
      savings: {
        ...twin.savings,
        liquidBankBalance: updatedData.emergencyFund.currentAmount,
      },
      protection: {
        ...twin.protection,
        healthInsuranceCover: updatedData.healthInsurance.coverageAmount,
        lifeInsuranceCover: updatedData.termInsurance.coverageAmount,
        dependantsCount: updatedData.profile.dependents,
        annualHealthPremium: normalizeInsurancePremium(
          updatedData.healthInsurance.premiumAmount,
          updatedData.healthInsurance.frequency
        ).annual,
        annualLifePremium: normalizeInsurancePremium(
          updatedData.termInsurance.premiumAmount,
          updatedData.termInsurance.frequency
        ).annual,
      },
    };
    setTwin(updatedTwin);
    saveDigitalTwinToVault(updatedTwin).catch(console.error);
  };

  const handleResetToClean = () => {
    handleUpdateAssessment(INITIAL_ASSESSMENT);
    setCurrentStep(1);
  };

  const handleSaveToHistory = () => {
    const today = new Date().toISOString().split("T")[0];
    const newEntry = {
      date: today,
      score: dna.overallScore,
      notes: `Financial Assessment Score: ${dna.overallScore} (${dna.grade})`,
    };
    const updated = {
      ...twin,
      dnaHistory: [newEntry, ...(twin.dnaHistory || [])].slice(0, 10),
    };
    setTwin(updated);
    saveDigitalTwinToVault(updated).catch(console.error);
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);

  const fmtL = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
    return fmt(v);
  };

  // Live calculation metrics from active data
  const displayAssessment = isPurePreview ? effective : assessmentData;
  const liveTotalIncome = calculateTotalMonthlyIncome(displayAssessment.income);
  const liveTotalNeeds = calculateTotalNeeds(displayAssessment.needs);
  const liveTotalWants = calculateTotalWants(displayAssessment.wants);
  const liveInsuranceCost = calculateTotalMonthlyInsuranceCost(
    displayAssessment.healthInsurance,
    displayAssessment.termInsurance
  );
  const liveTrueEssential = calculateTrueMonthlyEssentialRequirement(
    liveTotalNeeds,
    liveInsuranceCost
  );
  const liveEmergencyTargets = calculateEmergencyFundTargets(liveTrueEssential);
  const liveEmergencyCoverage = calculateEmergencyCoverageMonths(
    displayAssessment.emergencyFund.hasEmergencyFund ? displayAssessment.emergencyFund.currentAmount : 0,
    liveTrueEssential
  );
  const liveSipAmount = displayAssessment.sip.hasSip ? displayAssessment.sip.monthlySip : 0;
  const liveSipRate = calculateInvestmentRate(liveSipAmount, liveTotalIncome);
  const liveSurplus = Math.max(0, liveTotalIncome - liveTotalNeeds - liveTotalWants - liveInsuranceCost - liveSipAmount);

  // Proportions for visual cash flow bar
  const totalAllocated = liveTotalNeeds + liveTotalWants + liveInsuranceCost + liveSipAmount + liveSurplus;
  const needsPct = totalAllocated > 0 ? Math.round((liveTotalNeeds / totalAllocated) * 100) : 0;
  const wantsPct = totalAllocated > 0 ? Math.round((liveTotalWants / totalAllocated) * 100) : 0;
  const insurancePct = totalAllocated > 0 ? Math.round((liveInsuranceCost / totalAllocated) * 100) : 0;
  const sipPct = totalAllocated > 0 ? Math.round((liveSipAmount / totalAllocated) * 100) : 0;
  const surplusPct = Math.max(0, 100 - needsPct - wantsPct - insurancePct - sipPct);

  // Time machine simulation calculation
  const simResult = useMemo(() => {
    return simulateDnaImpact(displayAssessment, {
      sipDelta: simSipDelta,
      emergencyDelta: simEmergencyDelta,
    });
  }, [displayAssessment, simSipDelta, simEmergencyDelta]);

  const isDeficit = !isPurePreview && liveTotalIncome > 0 && (liveTotalNeeds + liveTotalWants + liveInsuranceCost) > liveTotalIncome;

  // Add custom items
  const handleAddCustomNeed = () => {
    if (!newNeedName.trim() || newNeedAmount <= 0) return;
    const item: ExpenseCategoryItem = {
      id: `custom_need_${Date.now()}`,
      name: newNeedName.trim(),
      amount: newNeedAmount,
      placeholder: "e.g. 3,000",
      isCustom: true,
      type: "NEED",
    };
    handleUpdateAssessment({
      ...assessmentData,
      needs: [...assessmentData.needs, item],
    });
    setNewNeedName("");
    setNewNeedAmount(0);
  };

  const handleRemoveNeed = (id: string) => {
    handleUpdateAssessment({
      ...assessmentData,
      needs: assessmentData.needs.filter((n) => n.id !== id),
    });
  };

  const handleAddCustomWant = () => {
    if (!newWantName.trim() || newWantAmount <= 0) return;
    const item: ExpenseCategoryItem = {
      id: `custom_want_${Date.now()}`,
      name: newWantName.trim(),
      amount: newWantAmount,
      placeholder: "e.g. 2,500",
      isCustom: true,
      type: "WANT",
    };
    handleUpdateAssessment({
      ...assessmentData,
      wants: [...assessmentData.wants, item],
    });
    setNewWantName("");
    setNewWantAmount(0);
  };

  const handleRemoveWant = (id: string) => {
    handleUpdateAssessment({
      ...assessmentData,
      wants: assessmentData.wants.filter((w) => w.id !== id),
    });
  };

  const handleAddIncomeSource = () => {
    if (!newIncName.trim() || newIncAmount <= 0) return;
    const item: IncomeSourceItem = {
      id: `inc_${Date.now()}`,
      name: newIncName.trim(),
      type: newIncType,
      amount: newIncAmount,
    };
    handleUpdateAssessment({
      ...assessmentData,
      income: {
        ...assessmentData.income,
        additionalSources: [...(assessmentData.income.additionalSources || []), item],
      },
    });
    setNewIncName("");
    setNewIncAmount(0);
  };

  const handleRemoveIncomeSource = (id: string) => {
    handleUpdateAssessment({
      ...assessmentData,
      income: {
        ...assessmentData.income,
        additionalSources: assessmentData.income.additionalSources.filter((s) => s.id !== id),
      },
    });
  };

  return (
    <div className="w-full relative space-y-4">
      {/* =========================================================================
          MODE 1: PROGRESSIVE ASSESSMENT FLOW (STEPS 1 TO 9)
         ========================================================================= */}
      {viewMode === "assessment" && (
        <div className="max-w-5xl mx-auto space-y-4 animate-fadeIn pb-12">
          
          {/* Unified Compact Command Header & Live Telemetry Card */}
          <div className="bg-navy-card border border-border-navy rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            
            {/* Top Row: Title + Action Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-navy/60 pb-3.5">
              <div>
                <div className="flex items-center gap-2 text-emerald font-extrabold text-[11px] uppercase tracking-wider">
                  <HeartPulse className="w-3.5 h-3.5" /> Engine 1: Financial DNA
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-heading tracking-tight mt-0.5">
                  Personal Financial Assessment
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToClean}
                  title="Reset all numbers to transparent example placeholders"
                  className="flex items-center gap-1.5 bg-navy-bg hover:bg-rose-950/30 border border-border-navy hover:border-rose-500/40 text-muted-grey hover:text-rose-400 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Start Fresh
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("results")}
                  className="flex items-center gap-1.5 bg-navy-bg hover:bg-navy-light border border-border-navy text-heading px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-muted-grey" /> Results
                </button>
                {isSignedIn ? (
                  <span className="flex items-center gap-1 text-[11px] bg-emerald/10 text-emerald border border-emerald/40 px-2.5 py-1 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></span>
                    Encrypted Vault
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    className="flex items-center gap-1 text-[11px] bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-2.5 py-1 rounded-full hover:bg-indigo-900 transition font-semibold cursor-pointer"
                  >
                    <Lock className="w-3 h-3" /> Encrypted Vault
                  </button>
                )}
              </div>
            </div>

            {/* Visual Allocation Bar & Segmented Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-grey font-mono">
                <span className="flex items-center gap-1 text-rose-500 font-bold">● Needs ({needsPct}%)</span>
                <span className="flex items-center gap-1 text-amber-500 font-bold">● Wants ({wantsPct}%)</span>
                <span className="flex items-center gap-1 text-blue-500 font-bold">● Insurance ({insurancePct}%)</span>
                <span className="flex items-center gap-1 text-emerald font-bold">● SIP ({sipPct}%)</span>
                <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-300 font-bold">● Surplus ({surplusPct}%)</span>
              </div>

              <div className="w-full h-3 bg-navy-bg rounded-full overflow-hidden flex border border-border-navy/80 p-0.5 shadow-inner">
                <div
                  style={{ width: `${needsPct}%` }}
                  className="bg-rose-500 h-full rounded-l-full transition-all duration-300"
                  title={`Needs: ${fmt(liveTotalNeeds)}`}
                ></div>
                <div
                  style={{ width: `${wantsPct}%` }}
                  className="bg-amber-500 h-full transition-all duration-300"
                  title={`Wants: ${fmt(liveTotalWants)}`}
                ></div>
                <div
                  style={{ width: `${insurancePct}%` }}
                  className="bg-blue-500 h-full transition-all duration-300"
                  title={`Insurance: ${fmt(liveInsuranceCost)}`}
                ></div>
                <div
                  style={{ width: `${sipPct}%` }}
                  className="bg-emerald h-full transition-all duration-300"
                  title={`SIP: ${fmt(liveSipAmount)}`}
                ></div>
                <div
                  style={{ width: `${surplusPct}%` }}
                  className="bg-indigo-500 h-full rounded-r-full transition-all duration-300"
                  title={`Surplus: ${fmt(liveSurplus)}`}
                ></div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="card-tile-neutral px-3 py-2 rounded-xl border">
                <span className="text-[10px] text-muted-grey uppercase font-bold block">Monthly Income</span>
                <span className="text-sm font-black text-heading">{fmt(liveTotalIncome)}/mo</span>
              </div>
              <div className="card-tile-neutral px-3 py-2 rounded-xl border">
                <span className="text-[10px] text-muted-grey uppercase font-bold block">True Living Need</span>
                <span className="text-sm font-black text-rose-500">{fmt(liveTrueEssential)}/mo</span>
              </div>
              <div className="card-tile-neutral px-3 py-2 rounded-xl border">
                <span className="text-[10px] text-muted-grey uppercase font-bold block">Buffer Coverage</span>
                <span className="text-sm font-black text-emerald">{liveEmergencyCoverage} Months</span>
              </div>
              <div className="card-tile-neutral px-3 py-2 rounded-xl border">
                <span className="text-[10px] text-muted-grey uppercase font-bold block">DNA Health Score</span>
                <span className="text-sm font-black text-indigo-500 dark:text-indigo-300">{dna.overallScore} pts ({dna.grade})</span>
              </div>
            </div>

            {/* Step Navigation Pill Stepper (Embedded in Command Card) */}
            <div className="border-t border-border-navy/60 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted-grey">
                <span className="text-emerald flex items-center gap-1.5 uppercase tracking-wider font-extrabold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" /> Step {currentStep} of 9
                </span>
                <span className="text-heading font-mono text-[11px]">{Math.round((currentStep / 9) * 100)}% Complete</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1">
                {[
                  "1. Profile", "2. Income", "3. Needs", "4. Wants",
                  "5. Emergency", "6. Health", "7. Term", "8. SIP", "9. Review"
                ].map((name, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setCurrentStep(idx + 1)}
                    className={`cursor-pointer px-1.5 py-1 rounded-lg text-center text-[10px] sm:text-[11px] transition font-bold truncate ${
                      currentStep === idx + 1
                        ? "bg-indigo-600 !text-white shadow-sm"
                        : currentStep > idx + 1
                        ? "text-heading bg-navy-bg hover:bg-navy-light"
                        : "text-muted-grey/60 hover:text-heading"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* STEP 1: PERSONAL PROFILE */}
          {currentStep === 1 && (
            <div className="bg-navy-card border border-border-navy rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border-navy pb-4">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Section 1</span>
                <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">Personal Financial Context</h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  Your age, employment structure, and family dependents determine your essential safety margins.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Age */}
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                    Your Current Age
                  </label>
                  <FinancialInput
                    prefix=""
                    suffix="yrs"
                    placeholder="e.g. 28"
                    value={assessmentData.profile.age}
                    onChange={(v) =>
                      handleUpdateAssessment({
                        ...assessmentData,
                        profile: { ...assessmentData.profile, age: v },
                      })
                    }
                    min={18}
                    max={100}
                  />
                  <span className="text-[11px] text-muted-grey mt-1 block">Determines your compounding horizon till 60.</span>
                </div>

                {/* Employment Type */}
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={assessmentData.profile.employmentType}
                    onChange={(e) =>
                      handleUpdateAssessment({
                        ...assessmentData,
                        profile: { ...assessmentData.profile, employmentType: e.target.value as EmploymentType },
                      })
                    }
                    className="w-full bg-navy-bg border border-border-navy rounded-xl px-4 py-2.5 text-heading font-bold text-sm focus:border-emerald focus:outline-none"
                  >
                    {EMPLOYMENT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-navy-card text-heading">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Number of Dependents */}
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                    Number of Financial Dependents
                  </label>
                  <FinancialInput
                    prefix=""
                    suffix=""
                    placeholder="e.g. 0"
                    value={assessmentData.profile.dependents}
                    onChange={(v) =>
                      handleUpdateAssessment({
                        ...assessmentData,
                        profile: { ...assessmentData.profile, dependents: v },
                      })
                    }
                    min={0}
                    max={15}
                  />
                  <span className="text-[11px] text-muted-grey mt-1 block">
                    Directly impacts required Term & Health Insurance thresholds.
                  </span>
                </div>

                {/* Earning Members */}
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                    Earning Members in Household
                  </label>
                  <FinancialInput
                    prefix=""
                    suffix=""
                    placeholder="e.g. 1"
                    value={assessmentData.profile.earningMembers || 1}
                    onChange={(v) =>
                      handleUpdateAssessment({
                        ...assessmentData,
                        profile: { ...assessmentData.profile, earningMembers: v },
                      })
                    }
                    min={1}
                    max={10}
                  />
                  <span className="text-[11px] text-muted-grey mt-1 block">Household income distribution factor.</span>
                </div>
              </div>

              {/* Contextual Educational Note */}
              <div className="bg-navy-bg border border-border-navy/80 rounded-xl p-3.5 flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-grey leading-relaxed">
                  <span className="text-heading font-bold">Why this matters: </span>
                  ₹50,000 monthly income for a single earner is fundamentally different from ₹50,000 supporting multiple dependents. ValarchiX weights your emergency buffers and protection targets based on this context.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: MONTHLY INCOME */}
          {currentStep === 2 && (
            <div className="bg-navy-card border border-border-navy rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border-navy pb-4">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Section 2</span>
                <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">Monthly Take-Home Income</h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  Enter your net post-tax income that hits your bank account each month.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                    Primary Monthly Take-Home Income (₹)
                  </label>
                  <FinancialInput
                    size="lg"
                    prefix="₹"
                    suffix="/mo"
                    placeholder="e.g. 80,000"
                    value={assessmentData.income.primaryMonthlyTakeHome}
                    onChange={(v) =>
                      handleUpdateAssessment({
                        ...assessmentData,
                        income: {
                          ...assessmentData.income,
                          primaryMonthlyTakeHome: v,
                        },
                      })
                    }
                  />
                </div>

                {/* Additional Sources List */}
                {assessmentData.income.additionalSources && assessmentData.income.additionalSources.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-muted-grey uppercase tracking-wider block">
                      Additional Income Sources
                    </span>
                    {assessmentData.income.additionalSources.map((src) => (
                      <div
                        key={src.id}
                        className="flex items-center justify-between bg-navy-bg border border-emerald/40 px-3 py-2.5 rounded-xl text-xs shadow-sm"
                      >
                        <div>
                          <span className="font-bold text-heading">{src.name}</span>
                          <span className="text-muted-grey ml-2">({src.type})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-emerald">{fmt(src.amount)}/mo</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIncomeSource(src.id)}
                            className="text-muted-grey hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Custom Income Source */}
                <div className="bg-navy-bg/60 border border-dashed border-border-navy rounded-xl p-3.5 space-y-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Additional Income Stream
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Freelance / Rental"
                      value={newIncName}
                      onChange={(e) => setNewIncName(e.target.value)}
                      className="bg-navy-card border border-border-navy rounded-lg px-3 py-1.5 text-xs text-heading focus:border-emerald focus:outline-none"
                    />
                    <select
                      value={newIncType}
                      onChange={(e) => setNewIncType(e.target.value as any)}
                      className="bg-navy-card border border-border-navy rounded-lg px-3 py-1.5 text-xs text-heading focus:border-emerald focus:outline-none"
                    >
                      <option value="Freelance">Freelance</option>
                      <option value="Business">Business</option>
                      <option value="Rental">Rental</option>
                      <option value="Interest / dividends">Interest / Dividends</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="flex gap-2">
                      <FinancialInput
                        size="sm"
                        prefix="₹"
                        placeholder="e.g. 15,000"
                        value={newIncAmount}
                        onChange={(v) => setNewIncAmount(v)}
                        className="w-full bg-navy-card"
                      />
                      <button
                        type="button"
                        onClick={handleAddIncomeSource}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto Calculated Total Income Card */}
                <div className="card-stat-emerald rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">
                      Auto-Calculated Total Monthly Income
                    </span>
                    <div className="text-xs opacity-80">Sum of primary and all secondary streams</div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black">{fmt(liveTotalIncome)}/mo</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: NEEDS (ESSENTIAL EXPENSES) */}
          {currentStep === 3 && (
            <div className="bg-navy-card border border-border-navy rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border-navy pb-4">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Section 3</span>
                <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">Needs (Essential Monthly Expenses)</h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  Non-negotiable living expenses required for shelter, food, utilities, loan EMIs, and healthcare.
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {assessmentData.needs.map((item, idx) => {
                    const isItemFilled = (item.amount || 0) > 0;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-3 flex items-center justify-between gap-2 transition-all ${
                          isItemFilled
                            ? "bg-navy-card border border-emerald/40 shadow-sm"
                            : "bg-white/[0.01] border border-dashed border-border-navy/60"
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className={`text-xs font-bold block truncate ${isItemFilled ? "text-heading" : "text-muted-grey/80"}`}>
                            {item.name}
                          </span>
                          {item.isCustom && <span className="text-[10px] text-indigo-400 font-semibold">Custom Need</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <FinancialInput
                            size="sm"
                            prefix="₹"
                            placeholder={item.placeholder || "e.g. 0"}
                            value={item.amount}
                            onChange={(v) => {
                              const updatedNeeds = [...assessmentData.needs];
                              updatedNeeds[idx] = { ...item, amount: v };
                              handleUpdateAssessment({ ...assessmentData, needs: updatedNeeds });
                            }}
                            className="w-32 sm:w-36"
                          />
                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleRemoveNeed(item.id)}
                              className="text-muted-grey hover:text-rose-400 p-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Need Category */}
                <div className="bg-navy-bg/60 border border-dashed border-border-navy rounded-xl p-3 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Parents' Medicine / Tuition"
                    value={newNeedName}
                    onChange={(e) => setNewNeedName(e.target.value)}
                    className="w-full sm:w-1/2 bg-navy-card border border-border-navy rounded-lg px-3 py-2 text-xs text-heading focus:border-emerald focus:outline-none"
                  />
                  <div className="w-full sm:w-1/2 flex gap-2">
                    <FinancialInput
                      size="sm"
                      prefix="₹"
                      placeholder="e.g. 3,000"
                      value={newNeedAmount}
                      onChange={(v) => setNewNeedAmount(v)}
                      className="w-full bg-navy-card"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomNeed}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      + Add Need
                    </button>
                  </div>
                </div>

                {/* Auto Calculated Total Needs */}
                <div className="card-stat-rose rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">
                      Total Monthly Needs (Auto-Calculated)
                    </span>
                    <div className="text-xs opacity-80">
                      {liveTotalIncome > 0 ? ((liveTotalNeeds / liveTotalIncome) * 100).toFixed(1) : 0}% of Monthly Income
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black">{fmt(liveTotalNeeds)}/mo</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: WANTS (DISCRETIONARY SPENDING) */}
          {currentStep === 4 && (
            <div className="bg-navy-card border border-border-navy rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border-navy pb-4">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Section 4</span>
                <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">Wants (Discretionary Lifestyle)</h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  Lifestyle spending on food delivery, entertainment, shopping, travel, and personal hobbies.
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {assessmentData.wants.map((item, idx) => {
                    const isItemFilled = (item.amount || 0) > 0;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-3 flex items-center justify-between gap-2 transition-all ${
                          isItemFilled
                            ? "bg-navy-card border border-amber-500/40 shadow-sm"
                            : "bg-white/[0.01] border border-dashed border-border-navy/60"
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className={`text-xs font-bold block truncate ${isItemFilled ? "text-heading" : "text-muted-grey/80"}`}>
                            {item.name}
                          </span>
                          {item.isCustom && <span className="text-[10px] text-amber-400 font-semibold">Custom Want</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <FinancialInput
                            size="sm"
                            prefix="₹"
                            placeholder={item.placeholder || "e.g. 0"}
                            value={item.amount}
                            onChange={(v) => {
                              const updatedWants = [...assessmentData.wants];
                              updatedWants[idx] = { ...item, amount: v };
                              handleUpdateAssessment({ ...assessmentData, wants: updatedWants });
                            }}
                            className="w-32 sm:w-36"
                          />
                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleRemoveWant(item.id)}
                              className="text-muted-grey hover:text-rose-400 p-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Want */}
                <div className="bg-navy-bg/60 border border-dashed border-border-navy rounded-xl p-3 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Weekend Outings / Golf"
                    value={newWantName}
                    onChange={(e) => setNewWantName(e.target.value)}
                    className="w-full sm:w-1/2 bg-navy-card border border-border-navy rounded-lg px-3 py-2 text-xs text-heading focus:border-emerald focus:outline-none"
                  />
                  <div className="w-full sm:w-1/2 flex gap-2">
                    <FinancialInput
                      size="sm"
                      prefix="₹"
                      placeholder="e.g. 2,500"
                      value={newWantAmount}
                      onChange={(v) => setNewWantAmount(v)}
                      className="w-full bg-navy-card"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomWant}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      + Add Want
                    </button>
                  </div>
                </div>

                {/* Auto Calculated Total Wants */}
                <div className="card-stat-amber rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">
                      Total Monthly Wants (Auto-Calculated)
                    </span>
                    <div className="text-xs opacity-80">
                      {liveTotalIncome > 0 ? ((liveTotalWants / liveTotalIncome) * 100).toFixed(1) : 0}% of Monthly Income
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black">{fmt(liveTotalWants)}/mo</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: EMERGENCY FUND */}
          {currentStep === 5 && (
            <div className="bg-navy-card border border-border-navy rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border-navy pb-4">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Section 5</span>
                <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">Emergency Fund Reserves</h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  You never have to calculate your required buffer manually. ValarchiX calculates it from your actual obligations.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-2">
                    Do you currently have a dedicated liquid emergency fund?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          emergencyFund: { ...assessmentData.emergencyFund, hasEmergencyFund: true },
                        })
                      }
                      className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        assessmentData.emergencyFund.hasEmergencyFund
                          ? "bg-emerald text-slate-950 border-emerald shadow-lg shadow-emerald/20"
                          : "bg-navy-bg text-muted-grey border-border-navy"
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          emergencyFund: { hasEmergencyFund: false, currentAmount: 0 },
                        })
                      }
                      className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        !assessmentData.emergencyFund.hasEmergencyFund
                          ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                          : "bg-navy-bg text-muted-grey border-border-navy"
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                {assessmentData.emergencyFund.hasEmergencyFund && (
                  <div>
                    <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                      Current Liquid Reserve in Bank / FDs (₹)
                    </label>
                    <FinancialInput
                      size="lg"
                      prefix="₹"
                      placeholder="e.g. 1,80,000"
                      value={assessmentData.emergencyFund.currentAmount}
                      onChange={(v) =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          emergencyFund: {
                            ...assessmentData.emergencyFund,
                            currentAmount: v,
                          },
                        })
                      }
                    />
                  </div>
                )}

                {/* ValarchiX Automated Calculation Display */}
                <div className="bg-navy-bg border border-border-navy rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Activity className="w-4 h-4" /> ValarchiX Automated Emergency Requirement Math
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-navy-card p-3.5 rounded-xl border border-border-navy/70">
                      <span className="text-[10px] font-bold text-muted-grey uppercase">True Monthly Essential</span>
                      <div className="text-lg font-black text-heading">{fmt(liveTrueEssential)}/mo</div>
                      <span className="text-[10px] text-muted-grey">Needs (₹{liveTotalNeeds.toLocaleString('en-IN')}) + Insurance (₹{liveInsuranceCost.toLocaleString('en-IN')})</span>
                    </div>

                    <div className="bg-navy-card p-3.5 rounded-xl border border-border-navy/70">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">3 Month Target (Min)</span>
                      <div className="text-lg font-black text-amber-300">{fmt(liveEmergencyTargets.min3Months)}</div>
                      <span className="text-[10px] text-muted-grey">Minimum emergency foundation</span>
                    </div>

                    <div className="bg-navy-card p-3.5 rounded-xl border border-border-navy/70">
                      <span className="text-[10px] font-bold text-emerald uppercase">6 Month Target (Rec)</span>
                      <div className="text-lg font-black text-emerald">{fmt(liveEmergencyTargets.rec6Months)}</div>
                      <span className="text-[10px] text-muted-grey">Recommended financial fortress</span>
                    </div>
                  </div>

                  {/* Visual Emergency Cushion Gauge */}
                  <div className="bg-navy-card p-4 rounded-xl border border-border-navy space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-heading">Emergency Buffer Milestone Cushion</span>
                      <span className="font-extrabold text-emerald">{liveEmergencyCoverage} Months Covered</span>
                    </div>
                    <div className="relative w-full h-3 bg-navy-bg rounded-full overflow-hidden border border-border-navy">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, (liveEmergencyCoverage / 6) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-grey">
                      <span>0 Mo (Vulnerable)</span>
                      <span className="text-amber-400 font-bold">3 Mo (Minimum)</span>
                      <span className="text-emerald font-bold">6+ Mo (Fortress)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: HEALTH INSURANCE */}
          {currentStep === 6 && (
            <div className="bg-navy-card border border-border-navy rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border-navy pb-4">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Section 6</span>
                <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">Health Insurance (Medical Protection)</h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  Protects your family and investment corpus against catastrophic hospitalization costs.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-2">
                    Do you have active health insurance coverage?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          healthInsurance: { ...assessmentData.healthInsurance, hasInsurance: true },
                        })
                      }
                      className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        assessmentData.healthInsurance.hasInsurance
                          ? "bg-emerald text-slate-950 border-emerald shadow-lg shadow-emerald/20"
                          : "bg-navy-bg text-muted-grey border-border-navy"
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          healthInsurance: { hasInsurance: false, coverageAmount: 0, premiumAmount: 0, frequency: "Yearly" },
                        })
                      }
                      className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        !assessmentData.healthInsurance.hasInsurance
                          ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                          : "bg-navy-bg text-muted-grey border-border-navy"
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                {assessmentData.healthInsurance.hasInsurance && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                        Coverage / Sum Insured (₹)
                      </label>
                      <FinancialInput
                        prefix="₹"
                        placeholder="e.g. 10,00,000"
                        value={assessmentData.healthInsurance.coverageAmount}
                        onChange={(v) =>
                          handleUpdateAssessment({
                            ...assessmentData,
                            healthInsurance: {
                              ...assessmentData.healthInsurance,
                              coverageAmount: v,
                            },
                          })
                        }
                      />
                      <span className="text-[11px] text-muted-grey mt-1 block">
                        {assessmentData.healthInsurance.coverageAmount > 0 ? fmtL(assessmentData.healthInsurance.coverageAmount) : "e.g. ₹10 Lakhs"}
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                        Premium Amount (₹)
                      </label>
                      <FinancialInput
                        prefix="₹"
                        placeholder="e.g. 12,000"
                        value={assessmentData.healthInsurance.premiumAmount}
                        onChange={(v) =>
                          handleUpdateAssessment({
                            ...assessmentData,
                            healthInsurance: {
                              ...assessmentData.healthInsurance,
                              premiumAmount: v,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                        Payment Frequency
                      </label>
                      <select
                        value={assessmentData.healthInsurance.frequency}
                        onChange={(e) =>
                          handleUpdateAssessment({
                            ...assessmentData,
                            healthInsurance: {
                              ...assessmentData.healthInsurance,
                              frequency: e.target.value as InsuranceFrequency,
                            },
                          })
                        }
                        className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-heading font-bold text-sm focus:border-emerald focus:outline-none"
                      >
                        {FREQUENCIES.map((f) => (
                          <option key={f} value={f} className="bg-navy-card text-heading">
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Normalized Breakdown */}
                {assessmentData.healthInsurance.hasInsurance && assessmentData.healthInsurance.premiumAmount > 0 && (
                  <div className="bg-navy-bg border border-border-navy rounded-xl p-4 flex items-center justify-between text-xs">
                    <span className="text-muted-grey">
                      Normalized Premium Cost:
                      <span className="font-bold text-heading ml-1.5">
                        {fmt(normalizeInsurancePremium(assessmentData.healthInsurance.premiumAmount, assessmentData.healthInsurance.frequency).monthly)}/month
                      </span>
                    </span>
                    <span className="text-muted-grey">
                      Annual Equivalent:
                      <span className="font-bold text-indigo-400 ml-1.5">
                        {fmt(normalizeInsurancePremium(assessmentData.healthInsurance.premiumAmount, assessmentData.healthInsurance.frequency).annual)}/yr
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: TERM INSURANCE */}
          {currentStep === 7 && (
            <div className="bg-navy-card border border-border-navy rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border-navy pb-4">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Section 7</span>
                <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">Pure Term Insurance (Life Cover)</h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  Protects your dependents and replaces your future earnings in the event of an untimely demise.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-2">
                    Do you have active Pure Term Life Insurance?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          termInsurance: { ...assessmentData.termInsurance, hasInsurance: true },
                        })
                      }
                      className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        assessmentData.termInsurance.hasInsurance
                          ? "bg-emerald text-slate-950 border-emerald shadow-lg shadow-emerald/20"
                          : "bg-navy-bg text-muted-grey border-border-navy"
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          termInsurance: { hasInsurance: false, coverageAmount: 0, premiumAmount: 0, frequency: "Yearly" },
                        })
                      }
                      className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        !assessmentData.termInsurance.hasInsurance
                          ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                          : "bg-navy-bg text-muted-grey border-border-navy"
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                {assessmentData.termInsurance.hasInsurance && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                        Life Cover Sum Assured (₹)
                      </label>
                      <FinancialInput
                        prefix="₹"
                        placeholder="e.g. 1,00,00,000"
                        value={assessmentData.termInsurance.coverageAmount}
                        onChange={(v) =>
                          handleUpdateAssessment({
                            ...assessmentData,
                            termInsurance: {
                              ...assessmentData.termInsurance,
                              coverageAmount: v,
                            },
                          })
                        }
                      />
                      <span className="text-[11px] text-muted-grey mt-1 block">
                        {assessmentData.termInsurance.coverageAmount > 0 ? fmtL(assessmentData.termInsurance.coverageAmount) : "e.g. ₹1 Crore"}
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                        Premium Amount (₹)
                      </label>
                      <FinancialInput
                        prefix="₹"
                        placeholder="e.g. 18,000"
                        value={assessmentData.termInsurance.premiumAmount}
                        onChange={(v) =>
                          handleUpdateAssessment({
                            ...assessmentData,
                            termInsurance: {
                              ...assessmentData.termInsurance,
                              premiumAmount: v,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                        Payment Frequency
                      </label>
                      <select
                        value={assessmentData.termInsurance.frequency}
                        onChange={(e) =>
                          handleUpdateAssessment({
                            ...assessmentData,
                            termInsurance: {
                              ...assessmentData.termInsurance,
                              frequency: e.target.value as InsuranceFrequency,
                            },
                          })
                        }
                        className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-heading font-bold text-sm focus:border-emerald focus:outline-none"
                      >
                        {FREQUENCIES.map((f) => (
                          <option key={f} value={f} className="bg-navy-card text-heading">
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Normalized Breakdown */}
                {assessmentData.termInsurance.hasInsurance && assessmentData.termInsurance.premiumAmount > 0 && (
                  <div className="bg-navy-bg border border-border-navy rounded-xl p-4 flex items-center justify-between text-xs">
                    <span className="text-muted-grey">
                      Normalized Premium Cost:
                      <span className="font-bold text-heading ml-1.5">
                        {fmt(normalizeInsurancePremium(assessmentData.termInsurance.premiumAmount, assessmentData.termInsurance.frequency).monthly)}/month
                      </span>
                    </span>
                    <span className="text-muted-grey">
                      Annual Equivalent:
                      <span className="font-bold text-indigo-400 ml-1.5">
                        {fmt(normalizeInsurancePremium(assessmentData.termInsurance.premiumAmount, assessmentData.termInsurance.frequency).annual)}/yr
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 8: INVESTMENTS & SIP */}
          {currentStep === 8 && (
            <div className="bg-navy-card border border-border-navy rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border-navy pb-4">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Section 8</span>
                <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">Systematic Investments (SIP)</h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  Monthly disciplined equity/mutual fund investments powering long-term wealth compounding.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-2">
                    Do you currently invest monthly through SIP / Mutual Funds?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          sip: { ...assessmentData.sip, hasSip: true },
                        })
                      }
                      className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        assessmentData.sip.hasSip
                          ? "bg-emerald text-slate-950 border-emerald shadow-lg shadow-emerald/20"
                          : "bg-navy-bg text-muted-grey border-border-navy"
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          sip: { hasSip: false, monthlySip: 0 },
                        })
                      }
                      className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        !assessmentData.sip.hasSip
                          ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                          : "bg-navy-bg text-muted-grey border-border-navy"
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                {assessmentData.sip.hasSip && (
                  <div>
                    <label className="text-xs font-bold text-muted-grey uppercase tracking-wider block mb-1.5">
                      Total Monthly SIP Amount (₹)
                    </label>
                    <FinancialInput
                      size="lg"
                      prefix="₹"
                      suffix="/mo"
                      placeholder="e.g. 10,000"
                      value={assessmentData.sip.monthlySip}
                      onChange={(v) =>
                        handleUpdateAssessment({
                          ...assessmentData,
                          sip: {
                            ...assessmentData.sip,
                            monthlySip: v,
                          },
                        })
                      }
                    />
                  </div>
                )}

                {/* Auto Calculated Investment Rate */}
                <div className="card-stat-emerald rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">
                      Auto-Calculated Investment Rate
                    </span>
                    <div className="text-xs opacity-80 mt-0.5">
                      {liveSipRate >= 20
                        ? "Exceptional investment velocity (Target 20%+ achieved)."
                        : liveSipRate >= 10
                        ? "Good foundational savings rate (Target 15-20% recommended)."
                        : "Consider automating an additional 5-10% into equity SIPs."}
                    </div>
                  </div>
                  <div className="text-2xl font-black">{liveSipRate}%</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: REVIEW & SANITY CHECK */}
          {currentStep === 9 && (
            <div className="bg-navy-card border border-border-navy rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border-navy pb-4">
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Section 9</span>
                <h2 className="text-xl sm:text-2xl font-black text-heading mt-1">Review Financial Structure</h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  Verify your numbers before the deterministic calculation engine computes your 8-Pillar Financial DNA.
                </p>
              </div>

              {/* Grid Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="card-tile-neutral p-3 rounded-xl border">
                  <span className="text-[10px] font-bold text-muted-grey uppercase">Monthly Income</span>
                  <div className="text-base sm:text-lg font-black text-heading mt-0.5">{fmt(liveTotalIncome)}</div>
                </div>
                <div className="card-tile-neutral p-3 rounded-xl border">
                  <span className="text-[10px] font-bold text-rose-500 uppercase">Monthly Needs</span>
                  <div className="text-base sm:text-lg font-black text-rose-500 mt-0.5">{fmt(liveTotalNeeds)}</div>
                </div>
                <div className="card-tile-neutral p-3 rounded-xl border">
                  <span className="text-[10px] font-bold text-amber-500 uppercase">Monthly Wants</span>
                  <div className="text-base sm:text-lg font-black text-amber-500 mt-0.5">{fmt(liveTotalWants)}</div>
                </div>
                <div className="card-tile-neutral p-3 rounded-xl border">
                  <span className="text-[10px] font-bold text-blue-500 uppercase">Monthly Insurance</span>
                  <div className="text-base sm:text-lg font-black text-blue-500 mt-0.5">{fmt(liveInsuranceCost)}</div>
                </div>
              </div>

              {/* Deficit Warning if Commitments > Income */}
              {isDeficit ? (
                <div className="banner-alert-rose rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-500" /> Monthly Commitments Exceed Income
                  </div>
                  <p className="text-xs leading-relaxed">
                    Your reported monthly needs (₹{liveTotalNeeds.toLocaleString('en-IN')}) + wants (₹{liveTotalWants.toLocaleString('en-IN')}) + insurance (₹{liveInsuranceCost.toLocaleString('en-IN')}) equal ₹{(liveTotalNeeds + liveTotalWants + liveInsuranceCost).toLocaleString('en-IN')}, which exceeds your monthly income of ₹{liveTotalIncome.toLocaleString('en-IN')} by <span className="font-bold">₹{((liveTotalNeeds + liveTotalWants + liveInsuranceCost) - liveTotalIncome).toLocaleString('en-IN')}/month</span>.
                  </p>
                  <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={acknowledgedDeficit}
                      onChange={(e) => setAcknowledgedDeficit(e.target.checked)}
                      className="accent-rose-500 rounded"
                    />
                    <span>I acknowledge this deficit and wish to proceed with the assessment.</span>
                  </label>
                </div>
              ) : (
                <div className="card-stat-emerald rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">Calculated Monthly Surplus</span>
                    <div className="text-xs opacity-80">Net unallocated cash flow supporting investments</div>
                  </div>
                  <div className="text-xl font-black">
                    {fmt(liveSurplus)}/mo
                  </div>
                </div>
              )}

              {/* Calculate Button */}
              <div className="pt-4 border-t border-border-navy flex justify-end">
                <button
                  type="button"
                  disabled={isDeficit && !acknowledgedDeficit}
                  onClick={() => {
                    handleSaveToHistory();
                    setViewMode("results");
                  }}
                  className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-extrabold shadow-xl transition cursor-pointer ${
                    isDeficit && !acknowledgedDeficit
                      ? "bg-muted-grey/30 text-muted-grey cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-emerald hover:opacity-95 text-white shadow-emerald/20"
                  }`}
                >
                  <Zap className="w-4 h-4" /> Calculate Financial DNA
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls Bottom Bar */}
          <div className="sticky bottom-4 z-40 bg-navy-card/95 backdrop-blur-md border border-border-navy rounded-2xl p-4 flex items-center justify-between shadow-2xl">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition ${
                currentStep === 1
                  ? "opacity-40 border-border-navy text-muted-grey cursor-not-allowed"
                  : "bg-navy-bg hover:bg-navy-light border-border-navy text-heading cursor-pointer"
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {currentStep < 9 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(9, s + 1))}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-emerald hover:opacity-95 text-white px-7 py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                Continue to Step {currentStep + 1} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleSaveToHistory();
                  setViewMode("results");
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-emerald text-white px-7 py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald/30 transition cursor-pointer"
              >
                View DNA Results <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: FINANCIAL DNA RESULTS & INTELLIGENCE DASHBOARD
         ========================================================================= */}
      {viewMode === "results" && (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
          {/* Top Row: Hero DNA Score Card & Financial Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Score Hero Card */}
            <div className="lg:col-span-1 bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-muted-grey uppercase tracking-widest">Financial DNA Score</span>
                  <span className="px-3 py-1 bg-emerald/10 text-emerald font-extrabold text-xs rounded-full border border-emerald/30 shadow-sm">
                    Grade {dna.grade}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-4">
                  <span className="text-6xl sm:text-7xl font-black text-heading tracking-tight">
                    {dna.overallScore}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-muted-grey">/ 100</span>
                </div>

                <div className="inline-block bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs font-bold px-3 py-1 rounded-lg mb-3">
                  {dna.status}
                </div>

                <p className="text-light-grey text-xs sm:text-sm leading-relaxed mb-4">
                  {dna.summaryText}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-border-navy pt-3">
                  <div>
                    <span className="text-muted-grey text-[10px] uppercase font-bold block">Strongest Pillar</span>
                    <span className="text-emerald font-bold">{dna.strongestArea.name} ({dna.strongestArea.score} pts)</span>
                  </div>
                  <div>
                    <span className="text-muted-grey text-[10px] uppercase font-bold block">Weakest Pillar</span>
                    <span className="text-amber-400 font-bold">{dna.weakestArea.name} ({dna.weakestArea.score} pts)</span>
                  </div>
                </div>
              </div>

              {/* Historical Evolution Timeline */}
              <div className="border-t border-border-navy pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-grey uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Score Evolution
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveToHistory}
                    className="text-[10px] text-emerald hover:underline font-bold cursor-pointer"
                  >
                    + Log Snapshot
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {twin.dnaHistory && twin.dnaHistory.length > 0 ? (
                    twin.dnaHistory.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-muted-grey bg-navy-bg px-2.5 py-1.5 rounded-lg border border-border-navy/60"
                      >
                        <span className="font-mono text-[11px]">{h.date}</span>
                        <span className="font-extrabold text-heading">{h.score} pts</span>
                        <span className="text-muted-grey truncate max-w-[130px] text-[11px]">{h.notes}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-grey py-1">No historical scores saved yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Snapshot Summary Card */}
            <div className="lg:col-span-2 bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border-navy pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald" />
                    <h3 className="text-base sm:text-lg font-black text-heading">Your Financial Snapshot</h3>
                  </div>
                  <span className="text-xs text-muted-grey">Calculated from verified assessment</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  <div className="bg-navy-bg p-3 sm:p-3.5 rounded-xl border border-border-navy">
                    <span className="text-[10px] font-bold text-muted-grey uppercase tracking-wider block">Monthly Income</span>
                    <div className="text-base sm:text-lg font-extrabold text-heading mt-0.5">{fmt(snapshot.monthlyIncome)}</div>
                    <span className="text-[10px] text-emerald font-semibold">Take-Home Cash</span>
                  </div>

                  <div className="bg-navy-bg p-3 sm:p-3.5 rounded-xl border border-border-navy">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Monthly Needs</span>
                    <div className="text-base sm:text-lg font-extrabold text-rose-300 mt-0.5">{fmt(snapshot.monthlyNeeds)}</div>
                    <span className="text-[10px] text-muted-grey">{snapshot.needsRatioPct}% of Income</span>
                  </div>

                  <div className="bg-navy-bg p-3 sm:p-3.5 rounded-xl border border-border-navy">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Monthly Wants</span>
                    <div className="text-base sm:text-lg font-extrabold text-amber-300 mt-0.5">{fmt(snapshot.monthlyWants)}</div>
                    <span className="text-[10px] text-muted-grey">{snapshot.wantsRatioPct}% of Income</span>
                  </div>

                  <div className="bg-navy-bg p-3 sm:p-3.5 rounded-xl border border-border-navy">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Monthly Insurance</span>
                    <div className="text-base sm:text-lg font-extrabold text-blue-300 mt-0.5">{fmt(snapshot.monthlyInsurance)}</div>
                    <span className="text-[10px] text-muted-grey">Health + Term</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-navy-bg p-3 sm:p-3.5 rounded-xl border border-border-navy">
                    <span className="text-[10px] font-bold text-emerald uppercase tracking-wider block">Monthly SIP</span>
                    <div className="text-base sm:text-lg font-extrabold text-emerald mt-0.5">{fmt(snapshot.monthlySip)}</div>
                    <span className="text-[10px] text-muted-grey">{snapshot.sipRatePct}% Investment Rate</span>
                  </div>

                  <div className="bg-navy-bg p-3 sm:p-3.5 rounded-xl border border-border-navy">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Monthly Surplus</span>
                    <div className="text-base sm:text-lg font-extrabold text-indigo-300 mt-0.5">{fmt(snapshot.monthlySurplus)}</div>
                    <span className="text-[10px] text-muted-grey">
                      {snapshot.monthlySurplus >= 0 ? "Positive Cash Flow" : "Deficit Warning"}
                    </span>
                  </div>

                  <div className="bg-navy-bg p-3 sm:p-3.5 rounded-xl border border-border-navy">
                    <span className="text-[10px] font-bold text-muted-grey uppercase tracking-wider block">Emergency Buffer</span>
                    <div className="text-base sm:text-lg font-extrabold text-heading mt-0.5">{fmtL(snapshot.emergencyFundCurrent)}</div>
                    <span className="text-[10px] text-muted-grey">Target: {fmtL(snapshot.emergencyFundRecTarget)}</span>
                  </div>

                  <div className="bg-navy-bg p-3 sm:p-3.5 rounded-xl border border-border-navy">
                    <span className="text-[10px] font-bold text-emerald uppercase tracking-wider block">Coverage Months</span>
                    <div className="text-base sm:text-lg font-extrabold text-emerald mt-0.5">{snapshot.emergencyCoverageMonths} Mo</div>
                    <span className="text-[10px] text-muted-grey">Against True Living Cost</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-navy flex flex-wrap items-center justify-between text-xs text-muted-grey gap-2">
                <span>True Monthly Living Obligation: <strong className="text-heading">{fmt(calculateTrueMonthlyEssentialRequirement(snapshot.monthlyNeeds, snapshot.monthlyInsurance))}</strong></span>
                <span>Debt Burden (EMI): <strong className="text-heading">{snapshot.debtRatioPct}% of income</strong></span>
              </div>
            </div>
          </div>

          {/* Signature Diagnostic: Biggest Financial Gap */}
          <div className="bg-gradient-to-br from-amber-950/30 via-navy-card to-navy-card border border-amber-500/40 rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Signature Diagnostic: What Should I Fix First?
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-heading mb-2">
              Biggest Financial Gap: <span className="text-amber-400">{dna.biggestGap.title}</span> ({dna.biggestGap.score}/100)
            </h3>
            <p className="text-light-grey text-xs sm:text-sm mb-4 leading-relaxed max-w-3xl">
              {dna.biggestGap.explanation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-navy-bg border border-border-navy rounded-xl p-4">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">What to Improve</span>
                <p className="text-xs sm:text-sm font-semibold text-amber-200 leading-relaxed">
                  {dna.biggestGap.whatToImprove}
                </p>
              </div>

              <div className="bg-navy-bg border border-border-navy rounded-xl p-4">
                <span className="text-[10px] font-bold text-emerald uppercase tracking-wider block mb-1">What It Changes</span>
                <p className="text-xs sm:text-sm font-semibold text-emerald leading-relaxed">
                  {dna.biggestGap.whatItChanges}
                </p>
              </div>
            </div>

            {/* Score Simulation Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-navy-bg border border-border-navy rounded-xl p-3.5 gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[10px] text-muted-grey uppercase font-bold">Current DNA</div>
                  <div className="text-xl sm:text-2xl font-black text-heading">{dna.overallScore}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-grey hidden sm:block" />
                <div>
                  <div className="text-[10px] text-amber-400 uppercase font-extrabold">Simulated Score if Fixed</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald">
                    {dna.biggestGap.improvedScoreIfFixed} <span className="text-xs font-normal text-emerald">(+{dna.biggestGap.improvedScoreIfFixed - dna.overallScore} pts)</span>
                  </div>
                </div>
              </div>

              <Link
                href="/time-machine"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <Zap className="w-4 h-4" /> Simulate in Time Machine
              </Link>
            </div>
          </div>

          {/* Focused Action Plan: Your Next 3 Moves */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-heading flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald" /> Your Next 3 Moves
                </h3>
                <p className="text-xs text-muted-grey mt-0.5">
                  Prioritized, high-leverage steps to strengthen your financial foundation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dna.nextMoves.map((move, idx) => (
                <div
                  key={move.id}
                  className="bg-navy-card border border-border-navy hover:border-emerald/40 transition rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800/40 px-2.5 py-0.5 rounded-full">
                        Priority #{idx + 1}
                      </span>
                      <span className="text-[11px] text-muted-grey font-semibold">{move.category}</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-heading">{move.title}</h4>

                    <div className="space-y-1.5 text-xs bg-navy-bg p-3 rounded-xl border border-border-navy/60">
                      <div className="flex justify-between">
                        <span className="text-muted-grey">Current:</span>
                        <span className="font-bold text-heading text-right">{move.currentState}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-grey">Target:</span>
                        <span className="font-bold text-emerald text-right">{move.targetState}</span>
                      </div>
                      <div className="flex justify-between border-t border-border-navy/40 pt-1">
                        <span className="text-muted-grey">Gap:</span>
                        <span className="font-bold text-amber-400 text-right">{move.gap}</span>
                      </div>
                    </div>

                    <p className="text-xs text-light-grey leading-relaxed">
                      <strong className="text-heading">Action: </strong> {move.suggestedAction}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border-navy/40 text-[11px] font-bold text-emerald">
                    {move.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8-Pillar Fitness Breakdown Grid */}
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-black text-heading flex items-center gap-2">
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

                const getBarColor = (score: number) => {
                  if (score >= 80) return "bg-emerald";
                  if (score >= 65) return "bg-blue-500";
                  if (score >= 45) return "bg-amber-500";
                  return "bg-rose-500";
                };

                return (
                  <div
                    key={p.id}
                    className="bg-navy-card border border-border-navy rounded-2xl p-4 sm:p-5 hover:border-emerald/40 transition shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-heading text-sm sm:text-base">{p.name}</span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${getBadge(p.rating)}`}>
                          {p.score} / 100 • {p.rating}
                        </span>
                      </div>

                      {/* Dynamic Visual Progress Bar */}
                      <div className="w-full bg-navy-bg h-2 rounded-full overflow-hidden mb-3 border border-border-navy/60">
                        <div
                          className={`${getBarColor(p.score)} h-full rounded-full transition-all duration-300`}
                          style={{ width: `${p.score}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-navy-bg px-3 py-1.5 rounded-lg border border-border-navy/60 mb-3">
                        <span className="text-muted-grey">{p.keyMetricLabel}</span>
                        <span className="font-extrabold text-heading">{p.keyMetricValue}</span>
                      </div>

                      <p className="text-xs text-light-grey mb-3 leading-relaxed">{p.explanation}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] text-indigo-200 bg-indigo-950/40 border border-indigo-900/40 p-2.5 rounded-xl font-medium">
                        <strong className="text-indigo-300">Action: </strong> {p.recommendation}
                      </div>
                      <div className="text-[10px] text-emerald font-semibold">{p.impactOfFix}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ValarchiX Inflation Engine: Future Purchasing Power Visualizer */}
          <div className="bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-navy pb-3">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <TrendingDown className="w-4 h-4 text-indigo-400" /> ValarchiX Inflation Engine: Unique Differentiator
                </div>
                <h3 className="text-base sm:text-lg font-black text-heading mt-0.5">
                  Future Cost & Purchasing Power Reality
                </h3>
              </div>
              <span className="text-xs text-muted-grey">Formula: FV = PV × (1 + Inflation)^Years</span>
            </div>

            <p className="text-xs text-light-grey leading-relaxed">
              «₹1 Crore today does NOT have the same purchasing power 20 years from now.» Financial DNA evaluates long-term goals using inflation-adjusted future values.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-navy-bg p-4 rounded-2xl border border-border-navy">
              <div>
                <label className="text-[11px] font-bold text-muted-grey uppercase block mb-1">
                  Living Cost Target Today (₹)
                </label>
                <div className="text-lg font-black text-heading">
                  {fmt(snapshot.monthlyNeeds * 12)} / year
                </div>
                <span className="text-[10px] text-muted-grey">Current annual living needs</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-muted-grey uppercase mb-1">
                  <span>Timeline: {inflationYears} Years</span>
                  <span>Inflation: {inflationRate}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={35}
                  step={1}
                  value={inflationYears}
                  onChange={(e) => setInflationYears(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div className="bg-navy-card p-3 rounded-xl border border-border-navy/60">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">
                  Future Equivalent in {inflationYears} Yrs
                </span>
                <div className="text-xl font-black text-amber-300 mt-0.5">
                  {fmt(calculateFutureValueInflation(snapshot.monthlyNeeds * 12, inflationYears, inflationRate))} / year
                </div>
                <span className="text-[10px] text-muted-grey">
                  Inflation erodes purchasing power by {((1 - 1 / Math.pow(1 + inflationRate / 100, inflationYears)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Financial DNA Time Machine Simulation Widget */}
          <div className="bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-navy pb-3">
              <div>
                <div className="flex items-center gap-2 text-emerald font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-emerald" /> Financial DNA Time Machine
                </div>
                <h3 className="text-base sm:text-lg font-black text-heading mt-0.5">
                  Interactive Impact Simulator
                </h3>
              </div>
              <span className="text-[11px] bg-indigo-950 text-indigo-300 border border-indigo-800/40 px-2.5 py-1 rounded-full font-bold">
                SIMULATION / POTENTIAL IMPACT
              </span>
            </div>

            <p className="text-xs text-light-grey leading-relaxed">
              Adjust variables below to immediately simulate potential effects on your Financial DNA score and 20-year wealth trajectory.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-navy-bg p-5 rounded-2xl border border-border-navy">
              {/* Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-grey">Boost Monthly SIP</span>
                    <span className="font-bold text-emerald">+{fmt(simSipDelta)}/mo</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={30000}
                    step={1000}
                    value={simSipDelta}
                    onChange={(e) => setSimSipDelta(Number(e.target.value))}
                    className="w-full accent-emerald h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-grey">Add to Emergency Fund</span>
                    <span className="font-bold text-indigo-400">+{fmtL(simEmergencyDelta)}</span>
                  </div>
                  <input
                    type="range"
                    min={20000}
                    max={500000}
                    step={10000}
                    value={simEmergencyDelta}
                    onChange={(e) => setSimEmergencyDelta(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className="bg-navy-card p-4 rounded-xl border border-border-navy flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-grey uppercase tracking-wider block">
                    Simulated Financial DNA Impact
                  </span>
                  <div className="flex items-baseline gap-3 my-2">
                    <span className="text-3xl sm:text-4xl font-black text-emerald">{simResult.simulatedScore}</span>
                    <span className="text-sm font-bold text-muted-grey">/ 100</span>
                    <span className="text-xs font-bold text-emerald bg-emerald/10 border border-emerald/30 px-2 py-0.5 rounded-lg">
                      +{simResult.scoreDelta} pts (Grade {simResult.simulatedGrade})
                    </span>
                  </div>
                </div>

                <div className="border-t border-border-navy/60 pt-2 text-xs">
                  <span className="text-muted-grey">Projected 20-Yr Compounding Difference: </span>
                  <span className="font-extrabold text-emerald">+{fmtL(simResult.projected20YrCorpusDelta)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Disclaimer */}
          <div className="bg-navy-bg border border-border-navy/80 rounded-2xl p-4 text-[11px] text-muted-grey leading-relaxed flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-heading">Financial Intelligence Disclaimer: </strong>
              ValarchiX is an educational financial intelligence and modeling platform. All scores, simulations, and inflation-adjusted projections are deterministic mathematical calculations based on your provided inputs and standard financial planning heuristics. ValarchiX does not provide investment solicitation or guaranteed return promises.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER: QUICK PROFILE EDIT DRAWER
         ========================================================================= */}
      {showInputDrawer && (
        <div className="fixed inset-0 bg-navy-bg/80 backdrop-blur-md flex justify-end z-50 animate-fadeIn">
          <div className="bg-navy-card border-l border-border-navy w-full max-w-xl h-full p-5 sm:p-7 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-border-navy pb-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-heading flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-400" /> Quick Profile Adjuster
                  </h3>
                  <p className="text-xs text-muted-grey mt-0.5">
                    Modify core variables to observe instant live scoring updates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInputDrawer(false)}
                  className="p-1.5 bg-navy-bg hover:bg-navy-light rounded-xl text-muted-grey hover:text-heading cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Income */}
              <div>
                <label className="text-xs font-bold text-muted-grey uppercase block mb-1">Primary Monthly Income (₹)</label>
                <FinancialInput
                  prefix="₹"
                  suffix="/mo"
                  placeholder="e.g. 80,000"
                  value={assessmentData.income.primaryMonthlyTakeHome}
                  onChange={(v) =>
                    handleUpdateAssessment({
                      ...assessmentData,
                      income: {
                        ...assessmentData.income,
                        primaryMonthlyTakeHome: v,
                      },
                    })
                  }
                />
              </div>

              {/* Emergency Reserve */}
              <div>
                <label className="text-xs font-bold text-muted-grey uppercase block mb-1">Emergency Reserve (₹)</label>
                <FinancialInput
                  prefix="₹"
                  placeholder="e.g. 1,80,000"
                  value={assessmentData.emergencyFund.currentAmount}
                  onChange={(v) =>
                    handleUpdateAssessment({
                      ...assessmentData,
                      emergencyFund: {
                        ...assessmentData.emergencyFund,
                        currentAmount: v,
                      },
                    })
                  }
                />
              </div>

              {/* Monthly SIP */}
              <div>
                <label className="text-xs font-bold text-muted-grey uppercase block mb-1">Monthly SIP (₹)</label>
                <FinancialInput
                  prefix="₹"
                  suffix="/mo"
                  placeholder="e.g. 10,000"
                  value={assessmentData.sip.monthlySip}
                  onChange={(v) =>
                    handleUpdateAssessment({
                      ...assessmentData,
                      sip: {
                        ...assessmentData.sip,
                        monthlySip: v,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border-navy space-y-2">
              <button
                type="button"
                onClick={() => setShowInputDrawer(false)}
                className="w-full bg-emerald hover:bg-emerald/90 text-slate-950 font-black text-sm py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Profile & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
