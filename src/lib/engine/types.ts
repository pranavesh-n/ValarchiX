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

export type EmploymentType =
  | "Salaried"
  | "Self-employed"
  | "Business owner"
  | "Freelancer"
  | "Student"
  | "Retired"
  | "Other";

export type InsuranceFrequency = "Monthly" | "Quarterly" | "Half-yearly" | "Yearly";

export interface IncomeSourceItem {
  id: string;
  name: string;
  type: "Freelance" | "Business" | "Rental" | "Interest / dividends" | "Other";
  amount: number;
}

export interface ExpenseCategoryItem {
  id: string;
  name: string;
  amount: number;
  placeholder?: string;
  isCustom?: boolean;
  type: "NEED" | "WANT";
}

export interface InsuranceItemDetail {
  hasInsurance: boolean;
  coverageAmount: number;
  premiumAmount: number;
  frequency: InsuranceFrequency;
}

export interface EmergencyFundState {
  hasEmergencyFund: boolean;
  currentAmount: number;
}

export interface SipInvestmentDetail {
  hasSip: boolean;
  monthlySip: number;
}

export interface UserPersonalProfile {
  age: number;
  employmentType: EmploymentType;
  employmentTypeOther?: string;
  dependents: number;
  earningMembers: number;
}

export interface FinancialAssessmentData {
  profile: UserPersonalProfile;
  income: {
    primaryMonthlyTakeHome: number;
    additionalSources: IncomeSourceItem[];
  };
  needs: ExpenseCategoryItem[];
  wants: ExpenseCategoryItem[];
  emergencyFund: EmergencyFundState;
  healthInsurance: InsuranceItemDetail;
  termInsurance: InsuranceItemDetail;
  sip: SipInvestmentDetail;
  completedAt?: string;
}

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
  statusText: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  explanation: string;
  recommendation: string;
  impactOfFix: string;
}

export interface SignatureDiagnostic {
  pillarId: string;
  title: string;
  score: number;
  explanation: string;
  whatToImprove: string;
  whatItChanges: string;
  improvedScoreIfFixed: number;
}

export interface ActionPlanMove {
  id: string;
  priority: number;
  title: string;
  category: string;
  currentState: string;
  targetState: string;
  gap: string;
  suggestedAction: string;
  impact: string;
}

export interface FinancialSnapshot {
  monthlyIncome: number;
  monthlyNeeds: number;
  monthlyWants: number;
  monthlyInsurance: number;
  monthlySip: number;
  monthlySurplus: number;
  emergencyFundCurrent: number;
  emergencyFundMinTarget: number;
  emergencyFundRecTarget: number;
  emergencyCoverageMonths: number;
  needsRatioPct: number;
  wantsRatioPct: number;
  sipRatePct: number;
  emiTotal: number;
  debtRatioPct: number;
}

export interface FinancialDnaScore {
  overallScore: number; // 0 - 100
  grade: "S" | "A+" | "A" | "B+" | "B" | "C";
  status: string;
  summaryText: string;
  strongestArea: { name: string; score: number };
  weakestArea: { name: string; score: number };
  pillars: DnaPillarScore[];
  snapshot: FinancialSnapshot;
  biggestGap: SignatureDiagnostic;
  nextMoves: ActionPlanMove[];
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
  profile?: UserPersonalProfile;
  assessmentData?: FinancialAssessmentData;
  income: IncomeConfig;
  expenses: ExpenseConfig;
  savings: SavingsConfig;
  investments: InvestmentAsset[];
  debts: DebtItem[];
  protection: ProtectionConfig;
  goals: GoalItem[];
  dnaScore?: FinancialDnaScore;
  dnaHistory: { date: string; score: number; notes: string; pillarDeltas?: Record<string, number> }[];
  decisions: DecisionLogEntry[];
  universes: TimeMachineUniverse[];
}
