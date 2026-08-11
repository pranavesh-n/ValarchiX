import { GoalItem, GoalCategory } from "./types";

export const CATEGORY_INFLATION_DEFAULTS: Record<GoalCategory, number> = {
  education: 10.0,
  emergency: 6.0,
  vehicle: 5.0,
  house: 7.0,
  travel: 6.0,
  retirement: 6.0,
  custom: 6.0,
};

export interface GoalXCalculationResult {
  goal: GoalItem;
  inflationPctUsed: number;
  yearsRemaining: number;
  todaysCost: number;
  nominalFutureCost: number;
  inflationImpactAmount: number;
  todaysPurchasingPowerOfProjected: number;
  
  projectedCorpusBase: number;
  projectedCorpusConservative: number;
  projectedCorpusOptimistic: number;
  
  shortfallBase: number;
  status: "On Track" | "Slightly Behind" | "At Risk" | "Ahead";
  statusExplanation: string;
  
  recommendedPaths: {
    optionName: string;
    description: string;
    requiredMonthlySip?: number;
    requiredStepUpPct?: number;
    requiredInitialLumpSum?: number;
    newTargetYear?: number;
  }[];
}

export function calculateGoalX(goal: GoalItem): GoalXCalculationResult {
  const currentYear = new Date().getFullYear();
  const yearsRemaining = Math.max(1, goal.targetYear - currentYear);
  const inflationPct = goal.customInflationPct ?? CATEGORY_INFLATION_DEFAULTS[goal.category] ?? 6.0;
  const inflationRate = inflationPct / 100;
  
  // Future Cost = Today's Cost * (1 + i)^n
  const todaysCost = goal.targetAmountToday;
  const nominalFutureCost = todaysCost * Math.pow(1 + inflationRate, yearsRemaining);
  const inflationImpactAmount = nominalFutureCost - todaysCost;

  const currentCorpus = goal.currentAllocatedCorpus;
  const currentSip = goal.currentMonthlySip;
  const returnRateBase = goal.expectedReturnPct / 100;
  const returnRateCons = Math.max(0.04, returnRateBase - 0.03);
  const returnRateOpt = returnRateBase + 0.03;
  const stepUpRate = (goal.annualStepUpPct || 0) / 100;

  // Helper to project corpus with monthly SIP and optional step-up
  const projectCorpus = (r: number) => {
    let corpus = currentCorpus * Math.pow(1 + r, yearsRemaining);
    let monthlySip = currentSip;
    for (let y = 0; y < yearsRemaining; y++) {
      for (let m = 0; m < 12; m++) {
        corpus = (corpus + monthlySip) * (1 + r / 12);
      }
      monthlySip *= (1 + stepUpRate);
    }
    return corpus;
  };

  const projectedCorpusBase = projectCorpus(returnRateBase);
  const projectedCorpusConservative = projectCorpus(returnRateCons);
  const projectedCorpusOptimistic = projectCorpus(returnRateOpt);

  // Today's purchasing power of projected corpus = Projected / (1 + i)^n
  const todaysPurchasingPowerOfProjected = projectedCorpusBase / Math.pow(1 + inflationRate, yearsRemaining);

  const shortfallBase = Math.max(0, nominalFutureCost - projectedCorpusBase);

  let status: GoalXCalculationResult["status"] = "On Track";
  let statusExplanation = "";

  if (projectedCorpusBase >= nominalFutureCost * 1.05) {
    status = "Ahead";
    statusExplanation = `Your current plan is projected to surpass your ₹${(nominalFutureCost / 100000).toFixed(1)}L target by ₹${((projectedCorpusBase - nominalFutureCost) / 100000).toFixed(1)}L.`;
  } else if (projectedCorpusBase >= nominalFutureCost * 0.95) {
    status = "On Track";
    statusExplanation = "Your contribution rate aligns comfortably with estimated future costs under selected assumptions.";
  } else if (projectedCorpusBase >= nominalFutureCost * 0.75) {
    status = "Slightly Behind";
    statusExplanation = `Projected to be approximately ₹${(shortfallBase / 100000).toFixed(1)}L short of your future ₹${(nominalFutureCost / 100000).toFixed(1)}L cost.`;
  } else {
    status = "At Risk";
    statusExplanation = `Significant funding gap of ₹${(shortfallBase / 100000).toFixed(1)}L detected. Action required to adjust investment rate or timeline.`;
  }

  // Reverse Solver: Option A (Increase Monthly SIP)
  // Calculate required flat monthly SIP from scratch
  let reqSipFlat = currentSip;
  if (shortfallBase > 0) {
    // FV of current corpus
    const fvCurrentCorpus = currentCorpus * Math.pow(1 + returnRateBase, yearsRemaining);
    const targetFromSip = nominalFutureCost - fvCurrentCorpus;
    if (targetFromSip > 0) {
      const monthlyRate = returnRateBase / 12;
      const totalMonths = yearsRemaining * 12;
      const fvFactor = (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
      reqSipFlat = Math.ceil(targetFromSip / fvFactor);
    }
  }

  // Recommended Paths
  const recommendedPaths = [
    {
      optionName: "Option A: Increase Monthly SIP",
      description: `Increase monthly SIP from ₹${currentSip.toLocaleString('en-IN')} to ₹${reqSipFlat.toLocaleString('en-IN')}.`,
      requiredMonthlySip: reqSipFlat,
    },
    {
      optionName: "Option B: Add 10% Annual Step-Up",
      description: `Keep current SIP at ₹${currentSip.toLocaleString('en-IN')} and increase contributions by 10% every year.`,
      requiredStepUpPct: 10,
    },
    {
      optionName: "Option C: One-Time Initial Lump Sum",
      description: `Add an initial lump sum of ₹${Math.ceil(shortfallBase / Math.pow(1 + returnRateBase, yearsRemaining)).toLocaleString('en-IN')} today.`,
      requiredInitialLumpSum: Math.ceil(shortfallBase / Math.pow(1 + returnRateBase, yearsRemaining)),
    },
    {
      optionName: "Option D: Extend Target Date by 2 Years",
      description: `Extend goal date to ${goal.targetYear + 2} to allow compounding to bridge the shortfall.`,
      newTargetYear: goal.targetYear + 2,
    },
  ];

  return {
    goal,
    inflationPctUsed: inflationPct,
    yearsRemaining,
    todaysCost,
    nominalFutureCost,
    inflationImpactAmount,
    todaysPurchasingPowerOfProjected,
    projectedCorpusBase,
    projectedCorpusConservative,
    projectedCorpusOptimistic,
    shortfallBase,
    status,
    statusExplanation,
    recommendedPaths,
  };
}

/**
 * Multi-Goal Cash Flow Optimizer
 */
export function optimizeMultiGoals(goals: GoalItem[], availableMonthlyBudget: number) {
  const calculations = goals.map((g) => calculateGoalX(g));
  const totalCurrentSip = goals.reduce((sum, g) => sum + g.currentMonthlySip, 0);
  const totalRequiredSip = calculations.reduce(
    (sum, c) => sum + (c.recommendedPaths[0]?.requiredMonthlySip || c.goal.currentMonthlySip),
    0
  );

  const totalShortfall = calculations.reduce((sum, c) => sum + c.shortfallBase, 0);
  const budgetGap = totalRequiredSip - availableMonthlyBudget;

  return {
    goalsCount: goals.length,
    availableMonthlyBudget,
    totalCurrentSip,
    totalRequiredSip,
    totalShortfall,
    budgetGap: Math.max(0, budgetGap),
    isDeficit: budgetGap > 0,
    calculations,
  };
}
