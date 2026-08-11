export type GoalCategory = 
  | "emergency"
  | "education"
  | "vehicle"
  | "house"
  | "travel"
  | "retirement"
  | "custom";

export type DebtCategory =
  | "home_loan"
  | "vehicle_loan"
  | "education_loan"
  | "personal_loan"
  | "credit_card"
  | "other";

export interface IncomeConfig {
  monthlySalary: number;
  secondaryMonthlyIncome: number;
  expectedAnnualGrowthPct: number;
  stabilityRating: "high" | "moderate" | "variable";
}

export interface ExpenseConfig {
  essentialMonthly: number;
  discretionaryMonthly: number;
  recurringAnnual: number;
  irregularAnnual: number;
}

export interface SavingsConfig {
  liquidBankBalance: number;
  cashReserves: number;
}

export interface InvestmentAsset {
  id: string;
  name: string;
  category: "mutual_fund" | "stock" | "etf" | "fd_rd" | "ppf" | "epf" | "nps" | "gold" | "bond" | "other";
  currentValue: number;
  monthlyContribution: number;
  expectedReturnPct: number;
  expenseRatioPct?: number;
  folioNumber?: string;
  amcName?: string;
  underlyingSector?: string;
}

export interface DebtItem {
  id: string;
  name: string;
  category: DebtCategory;
  outstandingPrincipal: number;
  monthlyEmi: number;
  interestRatePct: number;
  remainingTenureMonths: number;
}

export interface ProtectionConfig {
  healthInsuranceCover: number;
  lifeInsuranceCover: number;
  dependantsCount: number;
  annualHealthPremium: number;
  annualLifePremium: number;
}

export interface GoalItem {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmountToday: number;
  targetYear: number;
  currentAllocatedCorpus: number;
  currentMonthlySip: number;
  priority: number; // 1 = highest
  expectedReturnPct: number;
  customInflationPct?: number;
  annualStepUpPct?: number;
}

export interface DnaPillarScore {
  id: string;
  name: string;
  score: number; // 0 - 100
  rating: "Strong" | "Healthy" | "Needs Attention" | "Weak";
  weight: number;
  explanation: string;
  recommendation: string;
  impactOfFix: string;
}

export interface FinancialDnaScore {
  overallScore: number; // 0 - 100
  grade: "S" | "A+" | "A" | "B" | "C";
  summaryText: string;
  pillars: DnaPillarScore[];
  biggestGap: {
    pillarId: string;
    title: string;
    explanation: string;
    improvedScoreIfFixed: number;
    recommendedAction: string;
  };
  liveDelta?: {
    pointsChange: number;
    direction: "up" | "down" | "unchanged";
    reasons: string[];
  };
  snapshotDate: string;
}

export interface DecisionLogEntry {
  id: string;
  date: string;
  title: string;
  category: "investment" | "debt" | "expense" | "goal" | "career";
  rationale: string;
  assumptions: {
    expectedReturnPct?: number;
    monthlyContribution?: number;
    timelineYears?: number;
    notes?: string;
  };
  expectedOutcomeAmount?: number;
  actualOutcomeAmount?: number;
  retrospectiveEvaluation?: {
    status: "On Track" | "Exceeded" | "Underperformed" | "Pending";
    hindsightFreeAnalysis: string;
  };
}

export interface TimeMachineUniverse {
  id: string;
  name: string;
  description: string;
  color: string;
  parameters: {
    monthlySipDelta?: number;
    stepUpPctDelta?: number;
    sipPauseMonths?: number;
    marketCrashPct?: number;
    salaryGrowthPctDelta?: number;
    largeOneTimeExpense?: number;
    delayGoalYears?: number;
  };
  projections: {
    year: number;
    corpus: number;
    purchasingPower: number;
  }[];
}

export interface FinancialDigitalTwin {
  userId?: string;
  updatedAt: string;
  income: IncomeConfig;
  expenses: ExpenseConfig;
  savings: SavingsConfig;
  investments: InvestmentAsset[];
  debts: DebtItem[];
  protection: ProtectionConfig;
  goals: GoalItem[];
  dnaScore?: FinancialDnaScore;
  dnaHistory: { date: string; score: number; notes: string }[];
  decisions: DecisionLogEntry[];
  universes: TimeMachineUniverse[];
}
