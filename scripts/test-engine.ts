import { calculateGoalX } from "../src/lib/engine/goalx";
import { calculateFinancialDna } from "../src/lib/engine/dna";
import { formatINR, formatINRWords } from "../src/lib/engine/numeric";
import { FinancialDigitalTwin } from "../src/lib/engine/types";

console.log("=================================================");
console.log("⚡ RUNNING VALARCHIX 1.2 FINANCIAL ENGINE TEST SUITE");
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

// 1. GoalX Engine Tests
console.log("🎯 Testing GoalX Engine (Inflation & Step-Up SIP Math)...");
const testGoal = {
  id: "test1",
  name: "Child College",
  category: "education" as const,
  targetAmountToday: 2000000, // ₹20L
  targetYear: 2036, // 10 years
  currentAllocatedCorpus: 200000, // ₹2L
  currentMonthlySip: 10000, // ₹10,000/mo
  priority: 1,
  expectedReturnPct: 12.0,
  annualStepUpPct: 10.0,
  customInflationPct: 10.0 // 10% education inflation
};

const goalResult = calculateGoalX(testGoal);
assert(goalResult.nominalFutureCost > 5000000 && goalResult.nominalFutureCost < 5300000, "GoalX Education Inflation Future Cost (₹20L -> ~₹51.87L @ 10% in 10 yrs)", `Got: ${goalResult.nominalFutureCost}`);
assert(goalResult.projectedCorpusBase > 0, "GoalX Base Projected Corpus Calculation");
assert(goalResult.recommendedPaths.length >= 3, "GoalX Reverse Mode generates 3+ actionable paths");

// 2. Financial DNA Engine Tests
console.log("\n🧬 Testing Financial DNA Engine (8 Pillars & Extreme Boundaries)...");
const dummyTwin: FinancialDigitalTwin = {
  updatedAt: new Date().toISOString(),
  income: { monthlySalary: 120000, secondaryMonthlyIncome: 15000, expectedAnnualGrowthPct: 10, stabilityRating: "high" },
  expenses: { essentialMonthly: 45000, discretionaryMonthly: 25000, recurringAnnual: 60000, irregularAnnual: 30000 },
  savings: { liquidBankBalance: 300000, cashReserves: 50000 },
  investments: [
    { id: "1", name: "Flexi Cap", category: "mutual_fund", currentValue: 500000, monthlyContribution: 15000, expectedReturnPct: 13 }
  ],
  debts: [
    { id: "d1", name: "Car Loan", category: "vehicle_loan", outstandingPrincipal: 200000, monthlyEmi: 8000, interestRatePct: 8.5, remainingTenureMonths: 24 }
  ],
  protection: { healthInsuranceCover: 1000000, lifeInsuranceCover: 15000000, dependantsCount: 2, annualHealthPremium: 20000, annualLifePremium: 25000 },
  goals: [testGoal],
  dnaHistory: [], decisions: [], universes: []
};

const dnaResult = calculateFinancialDna(dummyTwin);
assert(dnaResult.overallScore >= 10 && dnaResult.overallScore <= 100, "DNA Overall Score bound strictly within [10, 100]", `Got: ${dnaResult.overallScore}`);
assert(dnaResult.pillars.length === 8, "Financial DNA evaluates exactly 8 distinct fitness pillars");
assert(dnaResult.biggestGap.improvedScoreIfFixed >= dnaResult.overallScore, "Fixing biggest gap guarantees score improvement");

// 2b. DNA Edge Case: ₹1 salary, zero savings
const extremeTwin: FinancialDigitalTwin = {
  ...dummyTwin,
  income: { monthlySalary: 1, secondaryMonthlyIncome: 0, expectedAnnualGrowthPct: 0, stabilityRating: "variable" },
  savings: { liquidBankBalance: 0, cashReserves: 0 }
};
const extremeDna = calculateFinancialDna(extremeTwin);
assert(!isNaN(extremeDna.overallScore) && isFinite(extremeDna.overallScore), "DNA Engine handles ₹1 income gracefully without NaN or Infinity", `Got: ${extremeDna.overallScore}`);

// 3. Numeric Formatting Edge Cases (Adaptive Logarithmic Scale)
console.log("\n🔢 Testing Numeric Formatting (Adaptive Scale: ₹1 to ₹1,000Cr+)...");
assert(formatINR(1) === "₹1", "Formats ₹1 correctly");
assert(formatINRWords(10000000000) === "₹1000 Cr", "Formats ₹1,000Cr in words correctly", `Got: ${formatINRWords(10000000000)}`);
assert(formatINRWords(100000000000) === "₹10000 Cr", "Formats ₹10,000Cr without arbitrary ceiling", `Got: ${formatINRWords(100000000000)}`);

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
