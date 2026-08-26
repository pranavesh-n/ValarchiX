import {
  FinancialDigitalTwin,
  FinancialDnaScore,
  DnaPillarScore,
  FinancialAssessmentData,
  ExpenseCategoryItem,
  InsuranceFrequency,
  InsuranceItemDetail,
  FinancialSnapshot,
  SignatureDiagnostic,
  ActionPlanMove,
  UserPersonalProfile,
} from "./types";

/**
 * Normalizes insurance premium frequencies to monthly and annual equivalents.
 */
export function normalizeInsurancePremium(
  premium: number,
  frequency: InsuranceFrequency
): { monthly: number; annual: number } {
  const p = Math.max(0, premium || 0);
  switch (frequency) {
    case "Monthly":
      return { monthly: p, annual: p * 12 };
    case "Quarterly":
      return { monthly: Math.round(p / 3), annual: p * 4 };
    case "Half-yearly":
      return { monthly: Math.round(p / 6), annual: p * 2 };
    case "Yearly":
    default:
      return { monthly: Math.round(p / 12), annual: p };
  }
}

/**
 * Calculates total monthly take-home income.
 */
export function calculateTotalMonthlyIncome(
  income: FinancialAssessmentData["income"]
): number {
  const primary = Math.max(0, income.primaryMonthlyTakeHome || 0);
  const additional = (income.additionalSources || []).reduce(
    (sum, src) => sum + Math.max(0, src.amount || 0),
    0
  );
  return primary + additional;
}

/**
 * Calculates total monthly needs from essential categories.
 */
export function calculateTotalNeeds(needs: ExpenseCategoryItem[]): number {
  return (needs || []).reduce((sum, item) => sum + Math.max(0, item.amount || 0), 0);
}

/**
 * Calculates total monthly wants from discretionary categories.
 */
export function calculateTotalWants(wants: ExpenseCategoryItem[]): number {
  return (wants || []).reduce((sum, item) => sum + Math.max(0, item.amount || 0), 0);
}

/**
 * Calculates combined monthly insurance cost.
 */
export function calculateTotalMonthlyInsuranceCost(
  health: InsuranceItemDetail,
  term: InsuranceItemDetail
): number {
  const healthMonthly = health.hasInsurance
    ? normalizeInsurancePremium(health.premiumAmount, health.frequency).monthly
    : 0;
  const termMonthly = term.hasInsurance
    ? normalizeInsurancePremium(term.premiumAmount, term.frequency).monthly
    : 0;
  return healthMonthly + termMonthly;
}

/**
 * True monthly essential requirement = Monthly Needs + Monthly Insurance Cost + other recurring unavoidable obligations.
 */
export function calculateTrueMonthlyEssentialRequirement(
  monthlyNeeds: number,
  monthlyInsuranceCost: number,
  otherObligations: number = 0
): number {
  return Math.max(1, monthlyNeeds + monthlyInsuranceCost + Math.max(0, otherObligations));
}

/**
 * Emergency fund targets:
 * - 3 Month Target = True Monthly Essential Requirement * 3
 * - 6 Month Target = True Monthly Essential Requirement * 6
 */
export function calculateEmergencyFundTargets(trueEssential: number): {
  min3Months: number;
  rec6Months: number;
} {
  return {
    min3Months: Math.round(trueEssential * 3),
    rec6Months: Math.round(trueEssential * 6),
  };
}

/**
 * Emergency coverage in months.
 */
export function calculateEmergencyCoverageMonths(
  currentEmergencyFund: number,
  trueEssential: number
): number {
  if (trueEssential <= 0) return 0;
  const coverage = Math.max(0, currentEmergencyFund) / trueEssential;
  return Number(coverage.toFixed(2));
}

/**
 * Detects EMI / Loan payments from needs to calculate Debt burden safely without double counting.
 */
export function calculateDebtRatio(
  needs: ExpenseCategoryItem[],
  monthlyIncome: number
): {
  emiTotal: number;
  debtRatioPct: number;
  burdenLevel: "No debt" | "Low manageable debt" | "Moderate debt" | "High debt burden";
} {
  const emiTotal = (needs || [])
    .filter((n) => {
      const lower = n.name.toLowerCase();
      return lower.includes("emi") || lower.includes("loan") || lower.includes("debt");
    })
    .reduce((sum, n) => sum + Math.max(0, n.amount || 0), 0);

  const income = Math.max(1, monthlyIncome);
  const debtRatioPct = Number(((emiTotal / income) * 100).toFixed(1));

  let burdenLevel: "No debt" | "Low manageable debt" | "Moderate debt" | "High debt burden" = "No debt";
  if (emiTotal === 0) {
    burdenLevel = "No debt";
  } else if (debtRatioPct <= 20) {
    burdenLevel = "Low manageable debt";
  } else if (debtRatioPct <= 40) {
    burdenLevel = "Moderate debt";
  } else {
    burdenLevel = "High debt burden";
  }

  return { emiTotal, debtRatioPct, burdenLevel };
}

/**
 * Calculates monthly SIP investment rate as percentage of income.
 */
export function calculateInvestmentRate(monthlySip: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  return Number(((Math.max(0, monthlySip) / monthlyIncome) * 100).toFixed(1));
}

/**
 * Calculates monthly surplus (Net cash remaining).
 */
export function calculateMonthlySurplus(
  monthlyIncome: number,
  monthlyNeeds: number,
  monthlyWants: number,
  monthlyInsurance: number
): number {
  return monthlyIncome - monthlyNeeds - monthlyWants - monthlyInsurance;
}

/**
 * Future value inflation calculator: FV = PV * (1 + inflationRate)^years
 */
export function calculateFutureValueInflation(
  presentValue: number,
  years: number,
  inflationPct: number = 6.0
): number {
  const rate = inflationPct / 100;
  return Math.round(presentValue * Math.pow(1 + rate, Math.max(0, years)));
}

/**
 * Builds standard snapshot data.
 */
export function buildFinancialSnapshot(data: FinancialAssessmentData): FinancialSnapshot {
  const monthlyIncome = calculateTotalMonthlyIncome(data.income);
  const monthlyNeeds = calculateTotalNeeds(data.needs);
  const monthlyWants = calculateTotalWants(data.wants);
  const monthlyInsurance = calculateTotalMonthlyInsuranceCost(
    data.healthInsurance,
    data.termInsurance
  );
  const monthlySip = data.sip.hasSip ? Math.max(0, data.sip.monthlySip) : 0;
  const monthlySurplus = calculateMonthlySurplus(
    monthlyIncome,
    monthlyNeeds,
    monthlyWants,
    monthlyInsurance
  );

  const trueEssential = calculateTrueMonthlyEssentialRequirement(
    monthlyNeeds,
    monthlyInsurance
  );
  const emergencyTargets = calculateEmergencyFundTargets(trueEssential);
  const emergencyFundCurrent = data.emergencyFund.hasEmergencyFund
    ? Math.max(0, data.emergencyFund.currentAmount)
    : 0;
  const emergencyCoverageMonths = calculateEmergencyCoverageMonths(
    emergencyFundCurrent,
    trueEssential
  );

  const needsRatioPct = monthlyIncome > 0 ? Number(((monthlyNeeds / monthlyIncome) * 100).toFixed(1)) : 0;
  const wantsRatioPct = monthlyIncome > 0 ? Number(((monthlyWants / monthlyIncome) * 100).toFixed(1)) : 0;
  const sipRatePct = calculateInvestmentRate(monthlySip, monthlyIncome);
  const debt = calculateDebtRatio(data.needs, monthlyIncome);

  return {
    monthlyIncome,
    monthlyNeeds,
    monthlyWants,
    monthlyInsurance,
    monthlySip,
    monthlySurplus,
    emergencyFundCurrent,
    emergencyFundMinTarget: emergencyTargets.min3Months,
    emergencyFundRecTarget: emergencyTargets.rec6Months,
    emergencyCoverageMonths,
    needsRatioPct,
    wantsRatioPct,
    sipRatePct,
    emiTotal: debt.emiTotal,
    debtRatioPct: debt.debtRatioPct,
  };
}

/**
 * 8-Pillar Scoring Engine: Deterministic, transparent, and data-driven.
 */
export function calculate8Pillars(
  data: FinancialAssessmentData,
  snapshot: FinancialSnapshot,
  twinGoals: FinancialDigitalTwin["goals"] = []
): DnaPillarScore[] {
  const { profile } = data;
  const income = snapshot.monthlyIncome;
  const surplus = snapshot.monthlySurplus;
  const coverageMonths = snapshot.emergencyCoverageMonths;
  const debtRatio = snapshot.debtRatioPct;
  const sipRate = snapshot.sipRatePct;

  // PILLAR 1: Cash Flow Health (weight: 15)
  let cashFlowScore = 50;
  if (income > 0) {
    const surplusRatio = (surplus / income) * 100;
    if (surplus < 0) {
      // Deficit
      cashFlowScore = Math.max(10, 40 + surplusRatio * 1.5);
    } else {
      // Healthy surplus: Base score derived from Needs, Wants, and Surplus ratios
      const needsFactor = Math.max(0, 100 - snapshot.needsRatioPct);
      const wantsPenalty = snapshot.wantsRatioPct > 30 ? (snapshot.wantsRatioPct - 30) * 1.5 : 0;
      const surplusBonus = Math.min(40, surplusRatio * 1.6);
      cashFlowScore = Math.min(100, Math.max(20, (needsFactor * 0.4) + surplusBonus - wantsPenalty + 20));
    }
  }
  cashFlowScore = Math.round(Math.min(100, Math.max(10, cashFlowScore)));
  const cashFlowRating =
    cashFlowScore >= 80 ? "Strong" : cashFlowScore >= 65 ? "Healthy" : cashFlowScore >= 45 ? "Needs Attention" : "Weak";

  // PILLAR 2: Emergency Readiness (weight: 15)
  let emergencyScore = 10;
  if (coverageMonths >= 6.0) {
    emergencyScore = Math.min(100, 90 + (coverageMonths - 6.0) * 2);
  } else if (coverageMonths >= 3.0) {
    emergencyScore = 65 + ((coverageMonths - 3.0) / 3.0) * 25;
  } else if (coverageMonths > 0) {
    emergencyScore = 20 + (coverageMonths / 3.0) * 45;
  }
  emergencyScore = Math.round(Math.min(100, Math.max(10, emergencyScore)));
  const emergencyRating =
    emergencyScore >= 85 ? "Strong" : emergencyScore >= 65 ? "Healthy" : emergencyScore >= 45 ? "Needs Attention" : "Weak";

  // PILLAR 3: Debt Health (weight: 15)
  let debtScore = 95;
  if (snapshot.emiTotal === 0) {
    debtScore = 98;
  } else if (debtRatio <= 20) {
    debtScore = 90 - (debtRatio / 20) * 10;
  } else if (debtRatio <= 35) {
    debtScore = 75 - ((debtRatio - 20) / 15) * 15;
  } else if (debtRatio <= 50) {
    debtScore = 55 - ((debtRatio - 35) / 15) * 20;
  } else {
    debtScore = Math.max(10, 35 - ((debtRatio - 50) / 20) * 20);
  }
  debtScore = Math.round(Math.min(100, Math.max(10, debtScore)));
  const debtRating =
    debtScore >= 80 ? "Strong" : debtScore >= 65 ? "Healthy" : debtScore >= 45 ? "Needs Attention" : "Weak";

  // PILLAR 4: Investment Health (weight: 15)
  let investmentScore = 15;
  if (data.sip.hasSip && snapshot.monthlySip > 0) {
    if (sipRate >= 25) {
      investmentScore = 95 + Math.min(5, (sipRate - 25));
    } else if (sipRate >= 15) {
      investmentScore = 80 + ((sipRate - 15) / 10) * 15;
    } else if (sipRate >= 10) {
      investmentScore = 65 + ((sipRate - 10) / 5) * 15;
    } else {
      investmentScore = 25 + (sipRate / 10) * 40;
    }
  }
  investmentScore = Math.round(Math.min(100, Math.max(10, investmentScore)));
  const investmentRating =
    investmentScore >= 80 ? "Strong" : investmentScore >= 65 ? "Healthy" : investmentScore >= 45 ? "Needs Attention" : "Weak";

  // PILLAR 5: Goal Readiness (weight: 10)
  let goalScore = 70;
  let goalExplanation = "";
  let goalStatusText = "Goals Tracked";
  if (twinGoals && twinGoals.length > 0) {
    const readinessSum = twinGoals.reduce((acc, g) => {
      const targetCorpus = g.targetAmountToday * Math.pow(1.06, Math.max(1, g.targetYear - new Date().getFullYear()));
      const projectedCorpus = g.currentAllocatedCorpus + (g.currentMonthlySip * 12 * Math.max(1, g.targetYear - new Date().getFullYear()));
      const ratio = Math.min(1.2, projectedCorpus / Math.max(1, targetCorpus));
      return acc + ratio;
    }, 0);
    goalScore = Math.round(Math.min(100, Math.max(15, (readinessSum / twinGoals.length) * 100)));
    goalExplanation = `Current trajectory covers approx ${goalScore}% of inflation-adjusted active goal targets.`;
  } else {
    goalScore = 55; // Neutral baseline when goals not configured
    goalStatusText = "GoalX Unlocked";
    goalExplanation = "Complete GoalX to link specific milestone targets with your Financial DNA.";
  }
  const goalRating =
    goalScore >= 80 ? "Strong" : goalScore >= 65 ? "Healthy" : goalScore >= 45 ? "Needs Attention" : "Weak";

  // PILLAR 6: Retirement Readiness (weight: 10)
  const age = profile.age || 28;
  const yearsToRetire = Math.max(5, 60 - age);
  const monthlySipVal = snapshot.monthlySip;
  // Estimated corpus @ 12% CAGR vs inflation-adjusted living expenses (assume 70% of current needs)
  const futureLivingExp = snapshot.monthlyNeeds * 12 * Math.pow(1.06, yearsToRetire);
  const requiredRetirementCorpus = futureLivingExp * 20; // 20x rule
  const projectedCorpus = monthlySipVal > 0
    ? monthlySipVal * ((Math.pow(1 + 0.12 / 12, yearsToRetire * 12) - 1) / (0.12 / 12))
    : 0;
  const retirementRatio = requiredRetirementCorpus > 0 ? (projectedCorpus / requiredRetirementCorpus) : 0;
  let retirementScore = Math.min(100, Math.max(15, Math.round(retirementRatio * 85 + (sipRate >= 15 ? 15 : 5))));
  if (!data.sip.hasSip || monthlySipVal === 0) {
    retirementScore = Math.max(10, Math.min(35, 45 - (age > 30 ? (age - 30) * 2 : 0)));
  }
  const retirementRating =
    retirementScore >= 80 ? "Strong" : retirementScore >= 65 ? "Healthy" : retirementScore >= 45 ? "Needs Attention" : "Weak";

  // PILLAR 7: Protection Readiness (weight: 10)
  let protectionScore = 15;
  const hasHealth = data.healthInsurance.hasInsurance && data.healthInsurance.coverageAmount > 0;
  const hasTerm = data.termInsurance.hasInsurance && data.termInsurance.coverageAmount > 0;
  const healthCover = data.healthInsurance.coverageAmount || 0;
  const termCover = data.termInsurance.coverageAmount || 0;
  const requiredTermCover = (income * 12 * 10) + snapshot.emiTotal * 24 + (profile.dependents * 1000000);

  let healthPoints = 0;
  if (hasHealth) {
    healthPoints = healthCover >= 1000000 ? 50 : healthCover >= 500000 ? 40 : 25;
  }

  let termPoints = 0;
  if (hasTerm) {
    const termRatio = requiredTermCover > 0 ? termCover / requiredTermCover : 1;
    termPoints = Math.min(50, Math.round(termRatio * 50));
  } else if (profile.dependents === 0 && profile.employmentType === "Student") {
    termPoints = 35; // Minimal penalty for student with zero dependents
  } else if (profile.dependents === 0) {
    termPoints = 25; // Moderate penalty for single earner
  } else {
    termPoints = 0; // Heavy penalty if earner has dependents but no term cover
  }

  protectionScore = Math.round(Math.min(100, Math.max(10, healthPoints + termPoints)));
  const protectionRating =
    protectionScore >= 80 ? "Strong" : protectionScore >= 65 ? "Healthy" : protectionScore >= 45 ? "Needs Attention" : "Weak";

  // PILLAR 8: Financial Resilience (weight: 10)
  // Resilience evaluates shock resistance across emergency, cash flow, debt, and insurance
  let resilienceScore =
    emergencyScore * 0.35 +
    cashFlowScore * 0.25 +
    debtScore * 0.20 +
    protectionScore * 0.20;
  resilienceScore = Math.round(Math.min(100, Math.max(10, resilienceScore)));
  const resilienceRating =
    resilienceScore >= 80 ? "Strong" : resilienceScore >= 65 ? "Healthy" : resilienceScore >= 45 ? "Needs Attention" : "Weak";

  const pillars: DnaPillarScore[] = [
    {
      id: "cash_flow",
      name: "Cash Flow Health",
      score: cashFlowScore,
      rating: cashFlowRating,
      weight: 15,
      statusText: cashFlowRating,
      keyMetricLabel: "Monthly Surplus",
      keyMetricValue: `₹${surplus.toLocaleString("en-IN")}/mo`,
      explanation:
        surplus >= 0
          ? `You have a monthly surplus of ₹${surplus.toLocaleString("en-IN")} (${income > 0 ? ((surplus / income) * 100).toFixed(1) : 0}% of income). Needs account for ${snapshot.needsRatioPct}% and Wants for ${snapshot.wantsRatioPct}%.`
          : `Monthly commitments exceed income by ₹${Math.abs(surplus).toLocaleString("en-IN")}/mo. Needs + Wants + Insurance total ₹${(snapshot.monthlyNeeds + snapshot.monthlyWants + snapshot.monthlyInsurance).toLocaleString("en-IN")}.`,
      recommendation:
        surplus < 0
          ? "Immediate cash-flow audit required. Reduce discretionary wants and review recurring commitments."
          : snapshot.wantsRatioPct > 30
          ? "Optimize lifestyle spending to redirect at least 5-10% more cash toward investments."
          : "Excellent cash flow generation supporting long-term compounding.",
      impactOfFix: "Restoring a 20%+ surplus rate immediately elevates Cash Flow and Resilience.",
    },
    {
      id: "emergency",
      name: "Emergency Readiness",
      score: emergencyScore,
      rating: emergencyRating,
      weight: 15,
      statusText: `${coverageMonths} Mo Coverage`,
      keyMetricLabel: "Coverage Months",
      keyMetricValue: `${coverageMonths} months`,
      explanation: `You currently have ₹${snapshot.emergencyFundCurrent.toLocaleString("en-IN")} saved against your true monthly essential obligation of ₹${calculateTrueMonthlyEssentialRequirement(snapshot.monthlyNeeds, snapshot.monthlyInsurance).toLocaleString("en-IN")}. This represents approx ${coverageMonths} months of buffer.`,
      recommendation:
        coverageMonths < 3
          ? `Build a minimum 3-month buffer of ₹${snapshot.emergencyFundMinTarget.toLocaleString("en-IN")}, then expand towards the 6-month target of ₹${snapshot.emergencyFundRecTarget.toLocaleString("en-IN")}.`
          : coverageMonths < 6
          ? `Expand your emergency fund by ₹${Math.max(0, snapshot.emergencyFundRecTarget - snapshot.emergencyFundCurrent).toLocaleString("en-IN")} to achieve full 6-month protection.`
          : "Outstanding emergency cushion shielding your family from sudden economic shocks.",
      impactOfFix: `Reaching full 6-month reserve elevates Emergency Readiness score to 95+ (+${Math.max(0, 95 - emergencyScore)} pts).`,
    },
    {
      id: "debt",
      name: "Debt Health",
      score: debtScore,
      rating: debtRating,
      weight: 15,
      statusText: calculateDebtRatio(data.needs, income).burdenLevel,
      keyMetricLabel: "EMI to Income",
      keyMetricValue: `${debtRatio}%`,
      explanation:
        snapshot.emiTotal === 0
          ? "Zero monthly EMI debt burden reported. High cash flow flexibility."
          : `Monthly EMI is ₹${snapshot.emiTotal.toLocaleString("en-IN")}, which consumes ${debtRatio}% of monthly take-home income.`,
      recommendation:
        debtRatio > 35
          ? "Debt burden is elevated. Prioritize aggressive prepayment on high-interest loans before expanding discretionary spending."
          : debtRatio > 0
          ? "Maintain timely EMI servicing and avoid taking on unhedged unsecured consumer debt."
          : "Keep debt at zero or strictly confined to appreciating low-interest assets.",
      impactOfFix: "Lowering EMI below 20% of income safeguards financial resilience during market volatility.",
    },
    {
      id: "investment",
      name: "Investment Health",
      score: investmentScore,
      rating: investmentRating,
      weight: 15,
      statusText: `${sipRate}% SIP Rate`,
      keyMetricLabel: "Monthly SIP",
      keyMetricValue: `₹${snapshot.monthlySip.toLocaleString("en-IN")}/mo`,
      explanation:
        snapshot.monthlySip > 0
          ? `You systematically invest ₹${snapshot.monthlySip.toLocaleString("en-IN")}/month, representing ${sipRate}% of your monthly income.`
          : "No active systematic monthly investments (SIP) reported. Wealth is not compounding automatically.",
      recommendation:
        sipRate < 10
          ? "Target a minimum 15% monthly SIP rate by automating investment on salary credit day."
          : sipRate < 20
          ? "Consider introducing a 10% annual Step-Up SIP to match salary increments."
          : "Exceptional investment discipline driving long-term wealth velocity.",
      impactOfFix: `Increasing SIP to 20% of income boosts Investment Health to 95+ pts.`,
    },
    {
      id: "goal_readiness",
      name: "Goal Readiness",
      score: goalScore,
      rating: goalRating,
      weight: 10,
      statusText: goalStatusText,
      keyMetricLabel: "Funding Trajectory",
      keyMetricValue: `${goalScore}%`,
      explanation: goalExplanation,
      recommendation:
        twinGoals.length === 0
          ? "Define specific milestones (Child Education, Home, Vehicle) in GoalX to benchmark funding gaps."
          : "Align monthly SIP allocations directly to prioritized milestone dates using GoalX reverse solver.",
      impactOfFix: "Direct goal alignment eliminates last-minute debt borrowing for life milestones.",
    },
    {
      id: "retirement",
      name: "Retirement Readiness",
      score: retirementScore,
      rating: retirementRating,
      weight: 10,
      statusText: retirementRating,
      keyMetricLabel: "Years to 60",
      keyMetricValue: `${yearsToRetire} yrs`,
      explanation:
        snapshot.monthlySip > 0
          ? `At age ${age} with ₹${snapshot.monthlySip.toLocaleString("en-IN")}/mo SIP, compounding provides an estimated trajectory over ${yearsToRetire} working years towards your post-retirement lifestyle.`
          : `At age ${age}, without active systematic investments, the future purchasing power required for retirement lifestyle is unhedged against inflation.`,
      recommendation:
        retirementScore < 60
          ? "Begin dedicated index equity SIPs and maximize EPF/NPS contributions early to harness compounding."
          : "Stay the course and increase equity allocation during market drawdowns.",
      impactOfFix: "Early retirement compounding drastically reduces required monthly contributions later in life.",
    },
    {
      id: "protection",
      name: "Protection Readiness",
      score: protectionScore,
      rating: protectionRating,
      weight: 10,
      statusText: protectionRating,
      keyMetricLabel: "Health + Life Cover",
      keyMetricValue: `${hasHealth ? "Health ✓" : "Health ✗"} | ${hasTerm ? "Term ✓" : "Term ✗"}`,
      explanation: `Health Cover: ${hasHealth ? `₹${(healthCover / 100000).toFixed(1)}L` : "None"}. Term Life Cover: ${hasTerm ? `₹${(termCover / 100000).toFixed(1)}L` : "None"}. Number of dependents: ${profile.dependents}.`,
      recommendation:
        !hasHealth && !hasTerm
          ? "Secure a minimum ₹10L super top-up health policy and pure term life cover equal to 10-15x annual income immediately."
          : !hasTerm && profile.dependents > 0
          ? "High risk: You have dependents but no pure term life insurance. Protect family liabilities."
          : !hasHealth
          ? "Add standalone health insurance to prevent sudden hospitalization from wiping out your emergency fund."
          : "Solid protection safety net established.",
      impactOfFix: "Comprehensive health and term coverage protects all accumulated investment assets from black swan events.",
    },
    {
      id: "resilience",
      name: "Financial Resilience",
      score: resilienceScore,
      rating: resilienceRating,
      weight: 10,
      statusText: resilienceRating,
      keyMetricLabel: "Shock Fortress",
      keyMetricValue: `${resilienceScore}/100`,
      explanation:
        "Comprehensive measure of shock resistance against sudden job interruption, medical emergencies, market downturns, or interest rate spikes.",
      recommendation:
        resilienceScore < 60
          ? "Focus on the twin pillars of Emergency Buffer and Pure Insurance to harden your financial foundation."
          : "Robust financial fortress capable of weathering economic headwinds.",
      impactOfFix: "High resilience prevents panic liquidation of long-term investments during market crashes.",
    },
  ];

  return pillars;
}

/**
 * Signature Diagnostic: Identifies the biggest financial gap and provides concrete what-if calculation.
 */
export function generateSignatureDiagnostic(
  pillars: DnaPillarScore[],
  snapshot: FinancialSnapshot,
  data: FinancialAssessmentData
): SignatureDiagnostic {
  const sorted = [...pillars].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];

  let explanation = weakest.explanation;
  let whatToImprove = weakest.recommendation;
  let whatItChanges = "";

  if (weakest.id === "emergency") {
    explanation = `You currently have ₹${snapshot.emergencyFundCurrent.toLocaleString("en-IN")} in liquid buffer (${snapshot.emergencyCoverageMonths} months), while your 6-month recommended target is ₹${snapshot.emergencyFundRecTarget.toLocaleString("en-IN")}.`;
    whatToImprove = `Build your emergency reserve from ₹${snapshot.emergencyFundCurrent.toLocaleString("en-IN")} to ₹${snapshot.emergencyFundRecTarget.toLocaleString("en-IN")} (Gap: ₹${Math.max(0, snapshot.emergencyFundRecTarget - snapshot.emergencyFundCurrent).toLocaleString("en-IN")}).`;
    whatItChanges = `Achieving the 6-month target increases your Emergency score from ${weakest.score} to 95 and boosts your overall Financial DNA score by +${Math.round((95 - weakest.score) * 0.15)} points.`;
  } else if (weakest.id === "investment") {
    explanation = `You currently invest ₹${snapshot.monthlySip.toLocaleString("en-IN")}/month (${snapshot.sipRatePct}% of monthly income).`;
    const targetSip = Math.round(snapshot.monthlyIncome * 0.2);
    whatToImprove = `Increase monthly SIP by ₹${Math.max(2000, targetSip - snapshot.monthlySip).toLocaleString("en-IN")}/month to reach a 20% investment rate.`;
    whatItChanges = `A 20% SIP rate accelerates your 20-year compounding corpus and lifts your Financial DNA score by +${Math.round((90 - weakest.score) * 0.15)} points.`;
  } else if (weakest.id === "protection") {
    explanation = `Insurance protection is insufficient for your family context (Dependents: ${data.profile.dependents}).`;
    whatToImprove = "Obtain pure term insurance cover (10-15x annual salary) and a family floater health policy.";
    whatItChanges = `Closing protection gaps elevates Protection Readiness to 85+ and insulates all your investment goals from shock liquidation.`;
  } else if (weakest.id === "cash_flow") {
    explanation = snapshot.monthlySurplus < 0
      ? `Monthly commitments exceed income by ₹${Math.abs(snapshot.monthlySurplus).toLocaleString("en-IN")}.`
      : `Discretionary lifestyle spending is consuming ${snapshot.wantsRatioPct}% of your income.`;
    whatToImprove = "Audit non-essential subscriptions and discretionary wants to free up monthly cash.";
    whatItChanges = "Restoring positive cash flow eliminates monthly deficit stress and feeds systematic SIPs.";
  } else if (weakest.id === "debt") {
    explanation = `EMIs take up ${snapshot.debtRatioPct}% of your take-home pay.`;
    whatToImprove = "Apply the debt snowball or avalanche strategy to eliminate highest interest debts first.";
    whatItChanges = "Freeing up EMI cash flow directly boosts both Monthly Surplus and Investment Health.";
  } else {
    whatToImprove = weakest.recommendation;
    whatItChanges = `Improving this area elevates overall Financial DNA score by up to +${Math.round((85 - weakest.score) * (weakest.weight / 100))} points.`;
  }

  // Calculate simulated overall score if this weakest pillar is improved to 85
  const improvedPillars = pillars.map((p) => (p.id === weakest.id ? { ...p, score: 85 } : p));
  const improvedScoreIfFixed = Math.round(
    improvedPillars.reduce((sum, p) => sum + p.score * p.weight, 0) / 100
  );

  return {
    pillarId: weakest.id,
    title: weakest.name,
    score: weakest.score,
    explanation,
    whatToImprove,
    whatItChanges,
    improvedScoreIfFixed: Math.max(improvedScoreIfFixed, Math.min(100, Math.round(pillars.reduce((s, p) => s + p.score * p.weight, 0) / 100) + 4)),
  };
}

/**
 * Generates Top 3 Action Plan Moves (Your Next 3 Moves).
 */
export function generateNext3Moves(
  pillars: DnaPillarScore[],
  snapshot: FinancialSnapshot,
  data: FinancialAssessmentData
): ActionPlanMove[] {
  const candidateMoves: ActionPlanMove[] = [];

  // Move: Emergency Fund
  const emergencyPillar = pillars.find((p) => p.id === "emergency");
  if (snapshot.emergencyCoverageMonths < 6.0) {
    const gap = Math.max(0, snapshot.emergencyFundRecTarget - snapshot.emergencyFundCurrent);
    candidateMoves.push({
      id: "move_emergency",
      priority: snapshot.emergencyCoverageMonths < 3.0 ? 1 : 2,
      title: "Strengthen Emergency Buffer",
      category: "Emergency Fund",
      currentState: `₹${(snapshot.emergencyFundCurrent / 100000).toFixed(2)}L (${snapshot.emergencyCoverageMonths} months coverage)`,
      targetState: `₹${(snapshot.emergencyFundRecTarget / 100000).toFixed(2)}L (6 months essential obligations)`,
      gap: `₹${(gap / 100000).toFixed(2)}L`,
      suggestedAction: "Automate monthly allocation to liquid savings until 6 months of true living costs are buffered.",
      impact: `Boosts Emergency Readiness from ${emergencyPillar?.score || 30} to 95 pts.`,
    });
  }

  // Move: Protection
  const protectionPillar = pillars.find((p) => p.id === "protection");
  const hasTerm = data.termInsurance.hasInsurance && data.termInsurance.coverageAmount > 0;
  const hasHealth = data.healthInsurance.hasInsurance && data.healthInsurance.coverageAmount > 0;
  if (!hasTerm || !hasHealth) {
    candidateMoves.push({
      id: "move_protection",
      priority: data.profile.dependents > 0 && !hasTerm ? 1 : 2,
      title: !hasTerm && !hasHealth ? "Secure Health & Term Insurance" : !hasTerm ? "Get Pure Term Life Insurance" : "Get Comprehensive Health Cover",
      category: "Protection",
      currentState: `${hasHealth ? `Health ₹${(data.healthInsurance.coverageAmount / 100000).toFixed(1)}L` : "No Health"} • ${hasTerm ? `Term ₹${(data.termInsurance.coverageAmount / 100000).toFixed(1)}L` : "No Term"}`,
      targetState: "10-15x Annual Income Term Cover + ₹10L+ Health Floater",
      gap: "Unprotected liabilities and medical risk",
      suggestedAction: "Lock in pure term insurance early at younger age brackets and add super top-up health insurance.",
      impact: `Protects your family and lifts Protection Readiness to 85+ pts.`,
    });
  }

  // Move: Investment SIP
  const investPillar = pillars.find((p) => p.id === "investment");
  if (snapshot.sipRatePct < 20) {
    const targetSip = Math.round(snapshot.monthlyIncome * 0.2);
    const sipGap = Math.max(1000, targetSip - snapshot.monthlySip);
    candidateMoves.push({
      id: "move_sip",
      priority: candidateMoves.length === 0 ? 1 : 2,
      title: snapshot.monthlySip === 0 ? "Start Systematic Investment Plan (SIP)" : "Scale Monthly SIP to 20%",
      category: "Investments",
      currentState: `₹${snapshot.monthlySip.toLocaleString("en-IN")}/mo (${snapshot.sipRatePct}% rate)`,
      targetState: `₹${targetSip.toLocaleString("en-IN")}/mo (20% investment rate)`,
      gap: `+₹${sipGap.toLocaleString("en-IN")}/mo`,
      suggestedAction: "Set up auto-debit SIP in diversified broad-market index / flexi-cap funds on salary day.",
      impact: `Increases Investment Health from ${investPillar?.score || 20} to 90+ pts.`,
    });
  }

  // Move: Cash Flow / Deficit
  if (snapshot.monthlySurplus < 0 || snapshot.wantsRatioPct > 35) {
    candidateMoves.push({
      id: "move_cashflow",
      priority: snapshot.monthlySurplus < 0 ? 1 : 3,
      title: snapshot.monthlySurplus < 0 ? "Eliminate Monthly Deficit" : "Trim Discretionary Wants",
      category: "Cash Flow",
      currentState: `Surplus ₹${snapshot.monthlySurplus.toLocaleString("en-IN")}/mo (Wants: ${snapshot.wantsRatioPct}%)`,
      targetState: "Positive surplus >= 20% of monthly income",
      gap: snapshot.monthlySurplus < 0 ? `₹${Math.abs(snapshot.monthlySurplus).toLocaleString("en-IN")}/mo deficit` : `${snapshot.wantsRatioPct - 25}% excess wants`,
      suggestedAction: "Audit discretionary recurring subscriptions and dining out expenses.",
      impact: "Immediately improves cash flow stability and financial resilience.",
    });
  }

  // Move: Debt Payoff
  if (snapshot.debtRatioPct > 30) {
    candidateMoves.push({
      id: "move_debt",
      priority: 2,
      title: "Accelerate EMI Debt Prepayment",
      category: "Debt",
      currentState: `EMI is ₹${snapshot.emiTotal.toLocaleString("en-IN")}/mo (${snapshot.debtRatioPct}% of income)`,
      targetState: "EMI under 20% of income",
      gap: `Excess EMI burden (${snapshot.debtRatioPct}%)`,
      suggestedAction: "Direct bonus or surplus cash to principal prepayments on high-cost loans.",
      impact: "Slashes total interest outgo and frees monthly cash flow.",
    });
  }

  // Sort by priority and return top 3
  candidateMoves.sort((a, b) => a.priority - b.priority);
  return candidateMoves.slice(0, 3);
}

/**
 * Main Deterministic Financial DNA Calculation Engine.
 */
export function calculateFinancialDna(twin: FinancialDigitalTwin): FinancialDnaScore {
  // Extract or synthesize assessmentData
  let assessmentData: FinancialAssessmentData;

  if (twin.assessmentData) {
    assessmentData = twin.assessmentData;
  } else {
    // Graceful backward compatibility mapping for legacy twin structures
    const legacySalary = twin.income.monthlySalary || 0;
    const legacySecondary = twin.income.secondaryMonthlyIncome || 0;
    const legacyEssential = twin.expenses.essentialMonthly || 0;
    const legacyDiscretionary = twin.expenses.discretionaryMonthly || 0;
    const legacyLiquid = (twin.savings.liquidBankBalance || 0) + (twin.savings.cashReserves || 0);
    const legacySip = twin.investments.reduce((sum, i) => sum + (i.monthlyContribution || 0), 0);
    const legacyEmi = twin.debts.reduce((sum, d) => sum + (d.monthlyEmi || 0), 0);

    assessmentData = {
      profile: twin.profile || {
        age: 28,
        employmentType: "Salaried",
        dependents: twin.protection?.dependantsCount || 0,
        earningMembers: 1,
      },
      income: {
        primaryMonthlyTakeHome: legacySalary,
        additionalSources: legacySecondary > 0
          ? [{ id: "legacy_sec", name: "Secondary Income", type: "Other", amount: legacySecondary }]
          : [],
      },
      needs: [
        { id: "legacy_ess", name: "Living Essentials", amount: Math.max(0, legacyEssential - legacyEmi), type: "NEED" },
        ...(legacyEmi > 0 ? [{ id: "legacy_emi", name: "EMI / Loan Payments", amount: legacyEmi, type: "NEED" as const }] : []),
      ],
      wants: [
        { id: "legacy_disc", name: "Discretionary Lifestyle", amount: legacyDiscretionary, type: "WANT" },
      ],
      emergencyFund: {
        hasEmergencyFund: legacyLiquid > 0,
        currentAmount: legacyLiquid,
      },
      healthInsurance: {
        hasInsurance: (twin.protection?.healthInsuranceCover || 0) > 0,
        coverageAmount: twin.protection?.healthInsuranceCover || 0,
        premiumAmount: twin.protection?.annualHealthPremium || 0,
        frequency: "Yearly",
      },
      termInsurance: {
        hasInsurance: (twin.protection?.lifeInsuranceCover || 0) > 0,
        coverageAmount: twin.protection?.lifeInsuranceCover || 0,
        premiumAmount: twin.protection?.annualLifePremium || 0,
        frequency: "Yearly",
      },
      sip: {
        hasSip: legacySip > 0,
        monthlySip: legacySip,
      },
    };
  }

  const snapshot = buildFinancialSnapshot(assessmentData);
  const pillars = calculate8Pillars(assessmentData, snapshot, twin.goals);

  const totalWeightedScore = pillars.reduce((sum, p) => sum + p.score * p.weight, 0) / 100;
  const overallScore = Math.round(Math.min(100, Math.max(10, totalWeightedScore)));

  let grade: FinancialDnaScore["grade"] = "B";
  let status = "Moderate Financial Fitness";
  if (overallScore >= 90) {
    grade = "S";
    status = "Pinnacle Financial Mastery";
  } else if (overallScore >= 80) {
    grade = "A+";
    status = "Robust Financial Fortress";
  } else if (overallScore >= 70) {
    grade = "A";
    status = "Solid Financial Foundation";
  } else if (overallScore >= 60) {
    grade = "B+";
    status = "Growing Financial Fitness";
  } else if (overallScore >= 50) {
    grade = "B";
    status = "Moderate Financial Fitness";
  } else {
    grade = "C";
    status = "Financial Vulnerability Detected";
  }

  // Strongest and Weakest Areas
  const sortedPillars = [...pillars].sort((a, b) => b.score - a.score);
  const strongestArea = { name: sortedPillars[0].name, score: sortedPillars[0].score };
  const weakestArea = {
    name: sortedPillars[sortedPillars.length - 1].name,
    score: sortedPillars[sortedPillars.length - 1].score,
  };

  const biggestGap = generateSignatureDiagnostic(pillars, snapshot, assessmentData);
  const nextMoves = generateNext3Moves(pillars, snapshot, assessmentData);

  let summaryText = "";
  if (overallScore >= 85) {
    summaryText = `Your financial foundation is in the top tier (Grade ${grade}). Exceptional resilience, disciplined compounding, and complete protection.`;
  } else if (overallScore >= 70) {
    summaryText = `Your financial foundation is healthy (Grade ${grade}), with strong cash flow and savings discipline, but your ${weakestArea.name.toLowerCase()} has room for enhancement.`;
  } else if (overallScore >= 55) {
    summaryText = `Your financial fitness is developing (Grade ${grade}). Key structural gaps in ${weakestArea.name.toLowerCase()} require focused action.`;
  } else {
    summaryText = `Financial vulnerability detected (Grade ${grade}). Prioritize building your emergency buffer and closing insurance gaps to protect against unexpected life shocks.`;
  }

  return {
    overallScore,
    grade,
    status,
    summaryText,
    strongestArea,
    weakestArea,
    pillars,
    snapshot,
    biggestGap,
    nextMoves,
    snapshotDate: new Date().toISOString().split("T")[0],
  };
}

/**
 * Simulates Financial DNA impact for Time Machine live controls.
 */
export function simulateDnaImpact(
  baseData: FinancialAssessmentData,
  deltas: {
    sipDelta?: number;
    emergencyDelta?: number;
    wantsDelta?: number;
    needsDelta?: number;
  }
): {
  simulatedScore: number;
  simulatedGrade: FinancialDnaScore["grade"];
  scoreDelta: number;
  projected20YrCorpusDelta: number;
} {
  const simulatedData: FinancialAssessmentData = {
    ...baseData,
    sip: {
      hasSip: true,
      monthlySip: Math.max(0, (baseData.sip.monthlySip || 0) + (deltas.sipDelta || 0)),
    },
    emergencyFund: {
      hasEmergencyFund: true,
      currentAmount: Math.max(0, (baseData.emergencyFund.currentAmount || 0) + (deltas.emergencyDelta || 0)),
    },
    wants: baseData.wants.map((w, idx) =>
      idx === 0 ? { ...w, amount: Math.max(0, w.amount + (deltas.wantsDelta || 0)) } : w
    ),
    needs: baseData.needs.map((n, idx) =>
      idx === 0 ? { ...n, amount: Math.max(0, n.amount + (deltas.needsDelta || 0)) } : n
    ),
  };

  const dummyTwin: FinancialDigitalTwin = {
    updatedAt: new Date().toISOString(),
    assessmentData: simulatedData,
    income: { monthlySalary: calculateTotalMonthlyIncome(simulatedData.income), secondaryMonthlyIncome: 0, expectedAnnualGrowthPct: 10, stabilityRating: "high" },
    expenses: { essentialMonthly: calculateTotalNeeds(simulatedData.needs), discretionaryMonthly: calculateTotalWants(simulatedData.wants), recurringAnnual: 0, irregularAnnual: 0 },
    savings: { liquidBankBalance: simulatedData.emergencyFund.currentAmount, cashReserves: 0 },
    investments: [{ id: "sim", name: "Simulated SIP", category: "mutual_fund", currentValue: 0, monthlyContribution: simulatedData.sip.monthlySip, expectedReturnPct: 12 }],
    debts: [],
    protection: { healthInsuranceCover: simulatedData.healthInsurance.coverageAmount, lifeInsuranceCover: simulatedData.termInsurance.coverageAmount, dependantsCount: simulatedData.profile.dependents, annualHealthPremium: simulatedData.healthInsurance.premiumAmount, annualLifePremium: simulatedData.termInsurance.premiumAmount },
    goals: [],
    dnaHistory: [],
    decisions: [],
    universes: [],
  };

  const baseResult = calculateFinancialDna({
    ...dummyTwin,
    assessmentData: baseData,
  });
  const simulatedResult = calculateFinancialDna(dummyTwin);

  // 20 year SIP compounding impact of sip delta: FV = P * ((1+r)^n - 1) / r
  const r = 0.12 / 12;
  const n = 20 * 12;
  const sipDelta = deltas.sipDelta || 0;
  const projected20YrCorpusDelta = sipDelta > 0 ? Math.round(sipDelta * ((Math.pow(1 + r, n) - 1) / r)) : 0;

  return {
    simulatedScore: simulatedResult.overallScore,
    simulatedGrade: simulatedResult.grade,
    scoreDelta: simulatedResult.overallScore - baseResult.overallScore,
    projected20YrCorpusDelta,
  };
}
