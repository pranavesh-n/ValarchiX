import { GoalItem, GoalCategory } from "./types";

export const CATEGORY_INFLATION_DEFAULTS: Record<GoalCategory, number> = {
  education: 10.0,
  house: 7.0,
  vehicle: 5.0,
  travel: 6.0,
  retirement: 6.0,
  emergency: 6.0,
  custom: 6.0,
};

export interface GoalYearMilestone {
  year: number;
  yearsFromNow: number;
  projectedCorpus: number;
  targetFutureValueSoFar: number;
  annualSipInvested: number;
  cumulativeInvested: number;
}

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
  
  requiredMonthlySip: number;
  requiredStartingStepUpSip: number;
  requiredOneTimeLumpSum: number;
  
  shortfallBase: number;
  status: "On Track" | "Slightly Behind" | "At Risk" | "Ahead";
  statusExplanation: string;
  
  milestones: GoalYearMilestone[];
  
  recommendedPaths: {
    optionName: string;
    description: string;
    requiredMonthlySip?: number;
    requiredStepUpPct?: number;
    requiredInitialLumpSum?: number;
    newTargetYear?: number;
    benefitTag?: string;
  }[];
}

/**
 * Core GoalX Calculation Engine
 * User specifies target cost today and tenure (or target year), and engine calculates all inflation, SIP roadmaps, and step-up paths.
 */
export function calculateGoalX(goal: GoalItem): GoalXCalculationResult {
  const currentYear = new Date().getFullYear();
  const yearsRemaining = Math.max(1, goal.targetYear - currentYear);
  const inflationPct = goal.customInflationPct ?? CATEGORY_INFLATION_DEFAULTS[goal.category] ?? 6.0;
  const inflationRate = inflationPct / 100;
  
  // Future Cost = Today's Cost * (1 + i)^n
  const todaysCost = goal.targetAmountToday;
  const nominalFutureCost = todaysCost * Math.pow(1 + inflationRate, yearsRemaining);
  const inflationImpactAmount = Math.max(0, nominalFutureCost - todaysCost);

  const currentCorpus = goal.currentAllocatedCorpus || 0;
  const currentSip = goal.currentMonthlySip || 0;
  const returnRateBase = (goal.expectedReturnPct || 12) / 100;
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

  // 1. Calculate Required Flat Monthly SIP to fully fund nominalFutureCost from scratch (accounting for currentCorpus)
  const fvOfCurrentCorpus = currentCorpus * Math.pow(1 + returnRateBase, yearsRemaining);
  const remainingTargetToFund = Math.max(0, nominalFutureCost - fvOfCurrentCorpus);
  
  const monthlyRate = returnRateBase / 12;
  const totalMonths = yearsRemaining * 12;
  const fvFactor = monthlyRate > 0 ? (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate : totalMonths;
  const requiredMonthlySip = remainingTargetToFund > 0 ? Math.ceil(remainingTargetToFund / fvFactor) : 0;

  // 2. Calculate Required Starting Step-Up SIP (with 10% annual increase)
  // Step-up formula approximation:
  let stepUpMultiplier = 0;
  for (let y = 0; y < yearsRemaining; y++) {
    const annualWeight = Math.pow(1 + 0.10, y);
    const monthsLeft = (yearsRemaining - y) * 12;
    for (let m = 0; m < 12; m++) {
      const monthIndex = y * 12 + m;
      const compoundMonths = totalMonths - monthIndex;
      stepUpMultiplier += annualWeight * Math.pow(1 + monthlyRate, compoundMonths);
    }
  }
  const requiredStartingStepUpSip = stepUpMultiplier > 0 && remainingTargetToFund > 0
    ? Math.ceil(remainingTargetToFund / stepUpMultiplier)
    : Math.ceil(requiredMonthlySip * 0.65);

  // 3. Calculate Required One-Time Lump Sum Today
  const requiredOneTimeLumpSum = remainingTargetToFund > 0
    ? Math.ceil(remainingTargetToFund / Math.pow(1 + returnRateBase, yearsRemaining))
    : 0;

  // Status Diagnostics
  let status: GoalXCalculationResult["status"] = "On Track";
  let statusExplanation = "";

  if (currentSip === 0 && currentCorpus === 0) {
    status = "At Risk";
    statusExplanation = `To achieve this goal of ₹${(nominalFutureCost / 100000).toFixed(1)}L in ${yearsRemaining} years, start a monthly SIP of ₹${requiredMonthlySip.toLocaleString('en-IN')}/mo or a Step-Up SIP of ₹${requiredStartingStepUpSip.toLocaleString('en-IN')}/mo.`;
  } else if (projectedCorpusBase >= nominalFutureCost * 1.05) {
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
    statusExplanation = `Funding gap of ₹${(shortfallBase / 100000).toFixed(1)}L detected. Action required to adjust investment rate or timeline.`;
  }

  // Generate Year-by-Year Milestones
  const milestones: GoalYearMilestone[] = [];
  let runningCorpus = currentCorpus;
  let runningSip = currentSip > 0 ? currentSip : requiredMonthlySip;
  let runningInvested = currentCorpus;

  for (let yr = 1; yr <= yearsRemaining; yr++) {
    const calendarYear = currentYear + yr;
    let annualInvested = 0;
    for (let m = 0; m < 12; m++) {
      runningCorpus = (runningCorpus + runningSip) * (1 + monthlyRate);
      annualInvested += runningSip;
    }
    runningInvested += annualInvested;
    if (stepUpRate > 0) {
      runningSip *= (1 + stepUpRate);
    }
    const targetSoFar = todaysCost * Math.pow(1 + inflationRate, yr);
    milestones.push({
      year: calendarYear,
      yearsFromNow: yr,
      projectedCorpus: Math.round(runningCorpus),
      targetFutureValueSoFar: Math.round(targetSoFar),
      annualSipInvested: Math.round(annualInvested),
      cumulativeInvested: Math.round(runningInvested),
    });
  }

  // Recommended Reverse Solver Paths
  const recommendedPaths = [
    {
      optionName: "Strategy 1: Optimal Flat Monthly SIP",
      description: `Invest ₹${requiredMonthlySip.toLocaleString('en-IN')}/month in 12% CAGR equity mutual funds for ${yearsRemaining} years.`,
      requiredMonthlySip,
      benefitTag: "Simplest Path",
    },
    {
      optionName: "Strategy 2: 10% Annual Step-Up SIP",
      description: `Start with ₹${requiredStartingStepUpSip.toLocaleString('en-IN')}/month today and increase by 10% yearly as your income grows.`,
      requiredMonthlySip: requiredStartingStepUpSip,
      requiredStepUpPct: 10,
      benefitTag: "35% Lower Initial Load",
    },
    {
      optionName: "Strategy 3: One-Time Lump Sum Today",
      description: `Deploy a one-time lump sum of ₹${requiredOneTimeLumpSum.toLocaleString('en-IN')} today at 12% CAGR without recurring SIPs.`,
      requiredInitialLumpSum: requiredOneTimeLumpSum,
      benefitTag: "Zero Recurring Burden",
    },
    {
      optionName: `Strategy 4: Extend Timeline to ${goal.targetYear + 2}`,
      description: `Extend your planning horizon by 2 years to allow compounding to reduce required monthly SIP to ₹${Math.ceil(requiredMonthlySip * 0.72).toLocaleString('en-IN')}/mo.`,
      newTargetYear: goal.targetYear + 2,
      requiredMonthlySip: Math.ceil(requiredMonthlySip * 0.72),
      benefitTag: "Reduced Monthly Stress",
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
    requiredMonthlySip,
    requiredStartingStepUpSip,
    requiredOneTimeLumpSum,
    shortfallBase,
    status,
    statusExplanation,
    milestones,
    recommendedPaths,
  };
}

/**
 * Multi-Goal Portfolio Aggregator & Cash Flow Check
 */
export function optimizeMultiGoals(goals: GoalItem[], availableMonthlyBudget: number) {
  const calculations = goals.map((g) => calculateGoalX(g));
  const totalTodaysCost = goals.reduce((sum, g) => sum + (g.targetAmountToday || 0), 0);
  const totalNominalFutureCost = calculations.reduce((sum, c) => sum + c.nominalFutureCost, 0);
  const totalCurrentSip = goals.reduce((sum, g) => sum + (g.currentMonthlySip || 0), 0);
  const totalRequiredSip = calculations.reduce(
    (sum, c) => sum + (c.requiredMonthlySip || 0),
    0
  );

  const totalShortfall = calculations.reduce((sum, c) => sum + c.shortfallBase, 0);
  const budgetGap = totalRequiredSip - availableMonthlyBudget;

  return {
    goalsCount: goals.length,
    availableMonthlyBudget,
    totalTodaysCost,
    totalNominalFutureCost,
    totalCurrentSip,
    totalRequiredSip,
    totalShortfall,
    budgetGap: Math.max(0, budgetGap),
    isDeficit: budgetGap > 0,
    calculations,
  };
}
