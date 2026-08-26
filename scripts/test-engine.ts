import {
  calculateFinancialDna,
  normalizeInsurancePremium,
  calculateTrueMonthlyEssentialRequirement,
  calculateEmergencyFundTargets,
  calculateEmergencyCoverageMonths,
  simulateDnaImpact,
} from "../src/lib/engine/dna";
import { calculateGoalX } from "../src/lib/engine/goalx";
import { formatINR, formatINRWords } from "../src/lib/engine/numeric";
import { FinancialDigitalTwin, FinancialAssessmentData } from "../src/lib/engine/types";

console.log("=================================================");
console.log("⚡ RUNNING VALARCHIX 2.0 FINANCIAL ENGINE TEST SUITE");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details: string = "") {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    failed++;
  }
}

// 1. Insurance Normalization Tests
console.log("🛡️ Testing Insurance Premium Normalization Engine...");
const monthlyNorm = normalizeInsurancePremium(1000, "Monthly");
assert(monthlyNorm.monthly === 1000 && monthlyNorm.annual === 12000, "Monthly frequency (₹1,000/mo -> ₹1,000 monthly, ₹12,000 annual)");

const quartNorm = normalizeInsurancePremium(3000, "Quarterly");
assert(quartNorm.monthly === 1000 && quartNorm.annual === 12000, "Quarterly frequency (₹3,000/qtr -> ₹1,000 monthly, ₹12,000 annual)");

const halfNorm = normalizeInsurancePremium(6000, "Half-yearly");
assert(halfNorm.monthly === 1000 && halfNorm.annual === 12000, "Half-yearly frequency (₹6,000/half -> ₹1,000 monthly, ₹12,000 annual)");

const yearNorm = normalizeInsurancePremium(12000, "Yearly");
assert(yearNorm.monthly === 1000 && yearNorm.annual === 12000, "Yearly frequency (₹12,000/yr -> ₹1,000 monthly, ₹12,000 annual)");

// 2. Emergency Fund Math Tests
console.log("\n🏥 Testing Emergency Fund Requirement & Coverage Engine...");
const monthlyNeeds = 45000;
const healthMonthly = 1000; // e.g. ₹12,000/yr
const termMonthly = 1500;   // e.g. ₹18,000/yr
const trueEssential = calculateTrueMonthlyEssentialRequirement(monthlyNeeds, healthMonthly + termMonthly);
assert(trueEssential === 47500, "True Monthly Essential Requirement (₹45k needs + ₹1k health + ₹1.5k term = ₹47,500)");

const targets = calculateEmergencyFundTargets(trueEssential);
assert(targets.min3Months === 142500, "3-Month Minimum Target (₹47,500 * 3 = ₹1,42,500)");
assert(targets.rec6Months === 285000, "6-Month Recommended Target (₹47,500 * 6 = ₹2,85,000)");

const coverage = calculateEmergencyCoverageMonths(180000, trueEssential);
assert(coverage >= 3.78 && coverage <= 3.80, `Emergency Coverage in Months (₹1,80,000 / ₹47,500 = ~3.79 months), got: ${coverage}`);

// 3. Realistic User Profiles Verification
console.log("\n🧬 Testing 5 Realistic Financial DNA User Profiles...");

// Profile A: High-Income Financial Fortress
const profileAData: FinancialAssessmentData = {
  profile: { age: 32, employmentType: "Salaried", dependents: 2, earningMembers: 2 },
  income: { primaryMonthlyTakeHome: 250000, additionalSources: [{ id: "s1", name: "Rental", type: "Rental", amount: 30000 }] },
  needs: [
    { id: "n1", name: "Rent & Home", amount: 40000, type: "NEED" },
    { id: "n2", name: "Groceries & Utilities", amount: 20000, type: "NEED" },
  ],
  wants: [
    { id: "w1", name: "Dining & Travel", amount: 35000, type: "WANT" },
  ],
  emergencyFund: { hasEmergencyFund: true, currentAmount: 1000000 }, // ~16 months buffer
  healthInsurance: { hasInsurance: true, coverageAmount: 1500000, premiumAmount: 24000, frequency: "Yearly" },
  termInsurance: { hasInsurance: true, coverageAmount: 30000000, premiumAmount: 36000, frequency: "Yearly" },
  sip: { hasSip: true, monthlySip: 80000 }, // 28.5% SIP rate
};

const dnaA = calculateFinancialDna({
  updatedAt: new Date().toISOString(),
  assessmentData: profileAData,
  income: { monthlySalary: 250000, secondaryMonthlyIncome: 30000, expectedAnnualGrowthPct: 10, stabilityRating: "high" },
  expenses: { essentialMonthly: 60000, discretionaryMonthly: 35000, recurringAnnual: 0, irregularAnnual: 0 },
  savings: { liquidBankBalance: 1000000, cashReserves: 0 },
  investments: [{ id: "i1", name: "SIP", category: "mutual_fund", currentValue: 2500000, monthlyContribution: 80000, expectedReturnPct: 12 }],
  debts: [],
  protection: { healthInsuranceCover: 1500000, lifeInsuranceCover: 30000000, dependantsCount: 2, annualHealthPremium: 24000, annualLifePremium: 36000 },
  goals: [], dnaHistory: [], decisions: [], universes: [],
});

assert(dnaA.overallScore >= 85, `Profile A (Fortress) Score >= 85 (Grade ${dnaA.grade}), got: ${dnaA.overallScore}`);
assert(dnaA.pillars.length === 8, "Profile A evaluates exactly 8 deterministic pillars");
assert(dnaA.nextMoves.length <= 3, "Profile A receives concise next moves");

// Profile B: Vulnerable Starter
const profileBData: FinancialAssessmentData = {
  profile: { age: 24, employmentType: "Freelancer", dependents: 1, earningMembers: 1 },
  income: { primaryMonthlyTakeHome: 30000, additionalSources: [] },
  needs: [
    { id: "n1", name: "Rent & Food", amount: 24000, type: "NEED" },
    { id: "n2", name: "Medical", amount: 3000, type: "NEED" },
  ],
  wants: [
    { id: "w1", name: "Mobile/Data", amount: 2000, type: "WANT" },
  ],
  emergencyFund: { hasEmergencyFund: false, currentAmount: 0 },
  healthInsurance: { hasInsurance: false, coverageAmount: 0, premiumAmount: 0, frequency: "Yearly" },
  termInsurance: { hasInsurance: false, coverageAmount: 0, premiumAmount: 0, frequency: "Yearly" },
  sip: { hasSip: false, monthlySip: 0 },
};

const dnaB = calculateFinancialDna({
  updatedAt: new Date().toISOString(),
  assessmentData: profileBData,
  income: { monthlySalary: 30000, secondaryMonthlyIncome: 0, expectedAnnualGrowthPct: 5, stabilityRating: "variable" },
  expenses: { essentialMonthly: 27000, discretionaryMonthly: 2000, recurringAnnual: 0, irregularAnnual: 0 },
  savings: { liquidBankBalance: 0, cashReserves: 0 },
  investments: [], debts: [],
  protection: { healthInsuranceCover: 0, lifeInsuranceCover: 0, dependantsCount: 1, annualHealthPremium: 0, annualLifePremium: 0 },
  goals: [], dnaHistory: [], decisions: [], universes: [],
});

assert(dnaB.overallScore <= 45, `Profile B (Vulnerable) Score <= 45 (Grade ${dnaB.grade}), got: ${dnaB.overallScore}`);
assert(dnaB.grade === "C", `Profile B Grade is C, got: ${dnaB.grade}`);
assert(dnaB.biggestGap.pillarId === "emergency" || dnaB.biggestGap.pillarId === "protection" || dnaB.biggestGap.pillarId === "investment", "Profile B flags urgent foundation gap");

// Profile C: High-Income Lifestyle Inflator (High Wants, Low Savings)
const profileCData: FinancialAssessmentData = {
  profile: { age: 30, employmentType: "Salaried", dependents: 0, earningMembers: 1 },
  income: { primaryMonthlyTakeHome: 200000, additionalSources: [] },
  needs: [
    { id: "n1", name: "Rent & Luxury Condo", amount: 50000, type: "NEED" },
  ],
  wants: [
    { id: "w1", name: "Luxury Lifestyle & Dining", amount: 135000, type: "WANT" },
  ],
  emergencyFund: { hasEmergencyFund: true, currentAmount: 60000 }, // ~1 month buffer
  healthInsurance: { hasInsurance: true, coverageAmount: 500000, premiumAmount: 12000, frequency: "Yearly" },
  termInsurance: { hasInsurance: false, coverageAmount: 0, premiumAmount: 0, frequency: "Yearly" },
  sip: { hasSip: true, monthlySip: 5000 }, // 2.5% rate
};

const dnaC = calculateFinancialDna({
  updatedAt: new Date().toISOString(),
  assessmentData: profileCData,
  income: { monthlySalary: 200000, secondaryMonthlyIncome: 0, expectedAnnualGrowthPct: 10, stabilityRating: "high" },
  expenses: { essentialMonthly: 50000, discretionaryMonthly: 135000, recurringAnnual: 0, irregularAnnual: 0 },
  savings: { liquidBankBalance: 60000, cashReserves: 0 },
  investments: [{ id: "i1", name: "SIP", category: "mutual_fund", currentValue: 50000, monthlyContribution: 5000, expectedReturnPct: 12 }],
  debts: [],
  protection: { healthInsuranceCover: 500000, lifeInsuranceCover: 0, dependantsCount: 0, annualHealthPremium: 12000, annualLifePremium: 0 },
  goals: [], dnaHistory: [], decisions: [], universes: [],
});

assert(dnaC.overallScore < 70, `Profile C (Lifestyle Inflator) Score < 70, got: ${dnaC.overallScore}`);
assert(dnaC.snapshot.wantsRatioPct >= 65, "Profile C detects high wants ratio");

// Profile D: Balanced Foundation Earner
const profileDData: FinancialAssessmentData = {
  profile: { age: 29, employmentType: "Salaried", dependents: 1, earningMembers: 1 },
  income: { primaryMonthlyTakeHome: 80000, additionalSources: [] },
  needs: [
    { id: "n1", name: "Needs & Groceries", amount: 45000, type: "NEED" },
  ],
  wants: [
    { id: "w1", name: "Wants & Outings", amount: 12000, type: "WANT" },
  ],
  emergencyFund: { hasEmergencyFund: true, currentAmount: 180000 },
  healthInsurance: { hasInsurance: true, coverageAmount: 1000000, premiumAmount: 12000, frequency: "Yearly" },
  termInsurance: { hasInsurance: true, coverageAmount: 10000000, premiumAmount: 18000, frequency: "Yearly" },
  sip: { hasSip: true, monthlySip: 8000 }, // 10% rate
};

const dnaD = calculateFinancialDna({
  updatedAt: new Date().toISOString(),
  assessmentData: profileDData,
  income: { monthlySalary: 80000, secondaryMonthlyIncome: 0, expectedAnnualGrowthPct: 10, stabilityRating: "high" },
  expenses: { essentialMonthly: 45000, discretionaryMonthly: 12000, recurringAnnual: 0, irregularAnnual: 0 },
  savings: { liquidBankBalance: 180000, cashReserves: 0 },
  investments: [{ id: "i1", name: "SIP", category: "mutual_fund", currentValue: 200000, monthlyContribution: 8000, expectedReturnPct: 12 }],
  debts: [],
  protection: { healthInsuranceCover: 1000000, lifeInsuranceCover: 10000000, dependantsCount: 1, annualHealthPremium: 12000, annualLifePremium: 18000 },
  goals: [], dnaHistory: [], decisions: [], universes: [],
});

assert(dnaD.overallScore >= 70 && dnaD.overallScore <= 82, `Profile D (Balanced) Score in [70, 82] (Grade ${dnaD.grade}), got: ${dnaD.overallScore}`);

// Profile E: Deficit Scenario (Expenses > Income)
const profileEData: FinancialAssessmentData = {
  profile: { age: 35, employmentType: "Business owner", dependents: 3, earningMembers: 1 },
  income: { primaryMonthlyTakeHome: 60000, additionalSources: [] },
  needs: [
    { id: "n1", name: "Living Needs", amount: 45000, type: "NEED" },
    { id: "n2", name: "Loan EMI", amount: 20000, type: "NEED" },
  ],
  wants: [
    { id: "w1", name: "Family Expenses", amount: 15000, type: "WANT" },
  ],
  emergencyFund: { hasEmergencyFund: false, currentAmount: 10000 },
  healthInsurance: { hasInsurance: false, coverageAmount: 0, premiumAmount: 0, frequency: "Yearly" },
  termInsurance: { hasInsurance: false, coverageAmount: 0, premiumAmount: 0, frequency: "Yearly" },
  sip: { hasSip: false, monthlySip: 0 },
};

const dnaE = calculateFinancialDna({
  updatedAt: new Date().toISOString(),
  assessmentData: profileEData,
  income: { monthlySalary: 60000, secondaryMonthlyIncome: 0, expectedAnnualGrowthPct: 0, stabilityRating: "variable" },
  expenses: { essentialMonthly: 65000, discretionaryMonthly: 15000, recurringAnnual: 0, irregularAnnual: 0 },
  savings: { liquidBankBalance: 10000, cashReserves: 0 },
  investments: [], debts: [],
  protection: { healthInsuranceCover: 0, lifeInsuranceCover: 0, dependantsCount: 3, annualHealthPremium: 0, annualLifePremium: 0 },
  goals: [], dnaHistory: [], decisions: [], universes: [],
});

assert(dnaE.snapshot.monthlySurplus < 0, `Profile E detects deficit (₹${dnaE.snapshot.monthlySurplus}/mo)`);
assert(!isNaN(dnaE.overallScore) && isFinite(dnaE.overallScore), "Deficit profile evaluated without math error");

// 4. Time Machine Impact Simulator
console.log("\n⏳ Testing Time Machine DNA Impact Simulation...");
const simImpact = simulateDnaImpact(profileDData, { sipDelta: 4000, emergencyDelta: 100000 });
assert(simImpact.scoreDelta > 0, `Simulation increases score (+${simImpact.scoreDelta} pts)`);
assert(simImpact.projected20YrCorpusDelta > 0, `Simulation calculates 20-yr corpus delta (₹${simImpact.projected20YrCorpusDelta.toLocaleString('en-IN')})`);

// 5. GoalX Engine Tests
console.log("\n🎯 Testing GoalX Engine...");
const testGoal = {
  id: "test1",
  name: "Child College",
  category: "education" as const,
  targetAmountToday: 2000000,
  targetYear: 2036,
  currentAllocatedCorpus: 200000,
  currentMonthlySip: 10000,
  priority: 1,
  expectedReturnPct: 12.0,
  annualStepUpPct: 10.0,
  customInflationPct: 10.0,
};
const goalResult = calculateGoalX(testGoal);
assert(goalResult.nominalFutureCost > 5000000, "GoalX Future Cost computed");

// 6. Numeric Formatter Tests
console.log("\n🔢 Testing Numeric Formatting...");
assert(formatINR(1) === "₹1", "Formats ₹1 correctly");
assert(formatINRWords(10000000000) === "₹1000 Cr", "Formats ₹1,000Cr in words correctly");

console.log("\n=================================================");
if (failed === 0) {
  console.log(`🎉 ALL ${passed} FINANCIAL ENGINE TESTS PASSED SUCCESSFULLY!`);
  console.log("=================================================");
  process.exit(0);
} else {
  console.error(`💥 ${failed} TESTS FAILED OUT OF ${passed + failed}!`);
  console.log("=================================================");
  process.exit(1);
}
