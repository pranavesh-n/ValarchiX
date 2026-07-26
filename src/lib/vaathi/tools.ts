import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * SIP Calculator Tool
 * Calculates future value of a monthly SIP investment
 */
export const sipCalculator = tool(
  async ({ monthlyAmount, annualReturn, years, stepUpPercent }) => {
    const monthlyRate = annualReturn / 100 / 12;
    const months = years * 12;
    let totalInvested = 0;
    let futureValue = 0;

    if (stepUpPercent && stepUpPercent > 0) {
      // Step-up SIP: increase monthly amount by stepUpPercent every year
      let currentMonthly = monthlyAmount;
      for (let year = 0; year < years; year++) {
        for (let m = 0; m < 12; m++) {
          totalInvested += currentMonthly;
          futureValue = (futureValue + currentMonthly) * (1 + monthlyRate);
        }
        currentMonthly *= (1 + stepUpPercent / 100);
      }
    } else {
      // Regular SIP
      totalInvested = monthlyAmount * months;
      futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    }

    const wealthGained = futureValue - totalInvested;
    return JSON.stringify({
      monthlyAmount,
      annualReturn,
      years,
      stepUpPercent: stepUpPercent || 0,
      totalInvested: Math.round(totalInvested),
      futureValue: Math.round(futureValue),
      wealthGained: Math.round(wealthGained),
      multiplesOfInvestment: (futureValue / totalInvested).toFixed(2) + "x"
    });
  },
  {
    name: "sipCalculator",
    description: "Calculate future value of a monthly SIP (Systematic Investment Plan) investment. Use this when the user asks about SIP returns, monthly investment growth, or wealth accumulation over time.",
    schema: z.object({
      monthlyAmount: z.number().describe("Monthly SIP amount in Rupees (₹)"),
      annualReturn: z.number().describe("Expected annual return percentage (e.g., 12 for 12%)"),
      years: z.number().describe("Investment duration in years"),
      stepUpPercent: z.number().optional().describe("Annual step-up percentage to increase SIP amount each year (optional)")
    })
  }
);

/**
 * Lumpsum Calculator Tool
 * Calculates future value of a one-time investment
 */
export const lumpsumCalculator = tool(
  async ({ amount, annualReturn, years }) => {
    const futureValue = amount * Math.pow(1 + annualReturn / 100, years);
    const wealthGained = futureValue - amount;
    return JSON.stringify({
      investedAmount: amount,
      annualReturn,
      years,
      futureValue: Math.round(futureValue),
      wealthGained: Math.round(wealthGained),
      multiplesOfInvestment: (futureValue / amount).toFixed(2) + "x"
    });
  },
  {
    name: "lumpsumCalculator",
    description: "Calculate future value of a one-time lumpsum investment with compound interest.",
    schema: z.object({
      amount: z.number().describe("Lumpsum investment amount in Rupees (₹)"),
      annualReturn: z.number().describe("Expected annual return percentage"),
      years: z.number().describe("Investment duration in years")
    })
  }
);

/**
 * Compound Interest Explainer Tool
 * Shows the power of compounding with year-by-year breakdown
 */
export const compoundInterestCalc = tool(
  async ({ principal, rate, years }) => {
    const breakdown = [];
    let amount = principal;
    for (let y = 1; y <= years; y++) {
      const interest = amount * (rate / 100);
      amount += interest;
      breakdown.push({
        year: y,
        startingAmount: Math.round(amount - interest),
        interestEarned: Math.round(interest),
        endingAmount: Math.round(amount)
      });
    }
    const totalInterest = Math.round(amount - principal);
    const doublingTime = Math.round(72 / rate * 10) / 10;
    return JSON.stringify({
      principal,
      rate,
      years,
      finalAmount: Math.round(amount),
      totalInterest,
      doublingTimeYears: doublingTime,
      ruleOf72: `At ${rate}% your money doubles every ~${doublingTime} years`,
      yearByYear: breakdown.slice(0, 10) // First 10 years for readability
    });
  },
  {
    name: "compoundInterestCalc",
    description: "Show the power of compounding with a year-by-year breakdown and Rule of 72. Use when explaining compounding or when user wants to see how money grows over time.",
    schema: z.object({
      principal: z.number().describe("Initial principal amount in Rupees"),
      rate: z.number().describe("Annual interest/return rate percentage"),
      years: z.number().describe("Number of years to compound")
    })
  }
);

/**
 * FD vs Mutual Fund Comparison Tool
 * Compares real returns after tax and inflation
 */
export const fdVsMfCompare = tool(
  async ({ amount = 100000, fdRate = 7, mfReturn = 12, years = 5, taxSlab = 30, inflationRate = 6 }: any) => {
    // FD: Interest taxed at income slab every year
    const fdTaxRate = taxSlab / 100;
    const fdPostTaxRate = fdRate * (1 - fdTaxRate) / 100;
    const fdNominal = amount * Math.pow(1 + fdPostTaxRate, years);
    const fdReal = fdNominal / Math.pow(1 + inflationRate / 100, years);

    // MF (Equity): LTCG 12.5% above ₹1.25L exemption
    const mfNominal = amount * Math.pow(1 + mfReturn / 100, years);
    const mfGains = mfNominal - amount;
    const mfTaxableGains = Math.max(0, mfGains - 125000);
    const mfTax = mfTaxableGains * 0.125;
    const mfPostTax = mfNominal - mfTax;
    const mfReal = mfPostTax / Math.pow(1 + inflationRate / 100, years);

    const fdRealCAGR = (Math.pow(fdReal / amount, 1 / years) - 1) * 100;
    const mfRealCAGR = (Math.pow(mfReal / amount, 1 / years) - 1) * 100;

    return JSON.stringify({
      investedAmount: amount,
      years,
      inflationRate,
      fd: {
        nominalRate: fdRate,
        taxSlab,
        postTaxNominal: Math.round(fdNominal),
        realValue: Math.round(fdReal),
        realCAGR: Math.round(fdRealCAGR * 100) / 100
      },
      mutualFund: {
        nominalReturn: mfReturn,
        ltcgTax: "12.5% above ₹1.25L",
        postTaxNominal: Math.round(mfPostTax),
        taxPaid: Math.round(mfTax),
        realValue: Math.round(mfReal),
        realCAGR: Math.round(mfRealCAGR * 100) / 100
      },
      verdict: mfReal > fdReal
        ? `Mutual Fund wins by ₹${Math.round(mfReal - fdReal).toLocaleString("en-IN")} in real purchasing power`
        : `FD wins by ₹${Math.round(fdReal - mfReal).toLocaleString("en-IN")} in real purchasing power`
    });
  },
  {
    name: "fdVsMfCompare",
    description: "Compare Fixed Deposit vs Equity Mutual Fund returns after adjusting for income tax, LTCG tax, and inflation. Use when user asks why MF instead of FD.",
    schema: z.object({
      amount: z.number().describe("Investment amount in Rupees"),
      fdRate: z.number().describe("FD annual interest rate (e.g., 7)"),
      mfReturn: z.number().describe("Expected MF annual return (e.g., 12)"),
      years: z.number().describe("Investment period in years"),
      taxSlab: z.number().describe("Income tax slab percentage (e.g., 30 for 30%)"),
      inflationRate: z.number().describe("Expected inflation rate (e.g., 6)")
    })
  }
);

/**
 * Goal Planner Tool
 * Calculate monthly SIP needed to reach a financial goal
 */
export const goalPlanner = tool(
  async ({ goalAmount, years, expectedReturn, inflationRate }) => {
    // Inflate the goal
    const inflatedGoal = goalAmount * Math.pow(1 + inflationRate / 100, years);
    const monthlyRate = expectedReturn / 100 / 12;
    const months = years * 12;
    // PMT formula for SIP
    const monthlySIP = inflatedGoal * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1) / (1 + monthlyRate);
    const totalInvested = Math.round(monthlySIP) * months;

    return JSON.stringify({
      goalAmount,
      inflatedGoal: Math.round(inflatedGoal),
      years,
      expectedReturn,
      inflationRate,
      requiredMonthlySIP: Math.round(monthlySIP),
      totalYouWillInvest: totalInvested,
      wealthCreatedByCompounding: Math.round(inflatedGoal - totalInvested)
    });
  },
  {
    name: "goalPlanner",
    description: "Calculate the monthly SIP needed to reach a financial goal (house, car, education, wedding) adjusted for inflation.",
    schema: z.object({
      goalAmount: z.number().describe("Target goal amount in today's Rupees"),
      years: z.number().describe("Years until goal"),
      expectedReturn: z.number().describe("Expected annual return percentage"),
      inflationRate: z.number().describe("Expected inflation rate percentage")
    })
  }
);

/**
 * Retirement Calculator Tool
 */
export const retirementCalc = tool(
  async ({ currentAge, retireAge, monthlyExpense, inflationRate, expectedReturn, withdrawalRate }) => {
    const yearsToRetire = retireAge - currentAge;
    const lifeExpectancy = 85;
    const retirementYears = lifeExpectancy - retireAge;

    // Monthly expense at retirement (inflated)
    const futureMonthlyExpense = monthlyExpense * Math.pow(1 + inflationRate / 100, yearsToRetire);
    const futureAnnualExpense = futureMonthlyExpense * 12;

    // Corpus needed (using withdrawal rate)
    const safeWithdrawalRate = withdrawalRate || 4;
    const corpusNeeded = futureAnnualExpense / (safeWithdrawalRate / 100);

    // Monthly SIP to build this corpus
    const monthlyRate = expectedReturn / 100 / 12;
    const months = yearsToRetire * 12;
    const monthlySIP = corpusNeeded * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1) / (1 + monthlyRate);

    return JSON.stringify({
      currentAge,
      retireAge,
      yearsToRetire,
      retirementYears,
      currentMonthlyExpense: monthlyExpense,
      futureMonthlyExpense: Math.round(futureMonthlyExpense),
      futureAnnualExpense: Math.round(futureAnnualExpense),
      corpusNeeded: Math.round(corpusNeeded),
      safeWithdrawalRate,
      requiredMonthlySIP: Math.round(monthlySIP),
      totalInvestment: Math.round(monthlySIP) * months
    });
  },
  {
    name: "retirementCalc",
    description: "Calculate retirement corpus needed and monthly SIP required based on current expenses, inflation, and safe withdrawal rate.",
    schema: z.object({
      currentAge: z.number().describe("Current age"),
      retireAge: z.number().describe("Desired retirement age"),
      monthlyExpense: z.number().describe("Current monthly expense in Rupees"),
      inflationRate: z.number().describe("Expected inflation rate (e.g., 6)"),
      expectedReturn: z.number().describe("Expected annual return on investments"),
      withdrawalRate: z.number().optional().describe("Safe withdrawal rate (default 4%)")
    })
  }
);

/**
 * Tax Comparison Tool
 * Compare Old vs New tax regime
 */
export const taxCompare = tool(
  async ({ annualIncome, section80C, section80D, hra, nps80CCD, otherDeductions }) => {
    const deductions80C = Math.min(section80C || 0, 150000);
    const deductions80D = section80D || 0;
    const hraExemption = hra || 0;
    const npsDeduction = Math.min(nps80CCD || 0, 50000);
    const other = otherDeductions || 0;
    const standardDeduction = 75000;

    // OLD REGIME
    const oldTaxableIncome = Math.max(0,
      annualIncome - standardDeduction - deductions80C - deductions80D - hraExemption - npsDeduction - other
    );
    const oldTax = calculateOldRegimeTax(oldTaxableIncome);

    // NEW REGIME (FY 2024-25+)
    const newTaxableIncome = Math.max(0, annualIncome - standardDeduction);
    const newTax = calculateNewRegimeTax(newTaxableIncome);

    const savings = oldTax - newTax;

    return JSON.stringify({
      annualIncome,
      totalDeductionsClaimed: deductions80C + deductions80D + hraExemption + npsDeduction + other,
      oldRegime: {
        taxableIncome: oldTaxableIncome,
        taxPayable: Math.round(oldTax),
        effectiveRate: Math.round(oldTax / annualIncome * 10000) / 100 + "%"
      },
      newRegime: {
        taxableIncome: newTaxableIncome,
        taxPayable: Math.round(newTax),
        effectiveRate: Math.round(newTax / annualIncome * 10000) / 100 + "%"
      },
      recommendation: savings > 0
        ? `New Regime saves you ₹${Math.abs(Math.round(savings)).toLocaleString("en-IN")}`
        : `Old Regime saves you ₹${Math.abs(Math.round(savings)).toLocaleString("en-IN")}`,
      betterRegime: savings > 0 ? "New Regime" : "Old Regime"
    });
  },
  {
    name: "taxCompare",
    description: "Compare Old vs New income tax regime for a given income and deductions. Use when user asks about tax planning or regime comparison.",
    schema: z.object({
      annualIncome: z.number().describe("Total annual income in Rupees"),
      section80C: z.number().optional().describe("80C deductions (PPF, ELSS, LIC, etc.) - max ₹1.5L"),
      section80D: z.number().optional().describe("80D health insurance premium"),
      hra: z.number().optional().describe("HRA exemption amount"),
      nps80CCD: z.number().optional().describe("NPS 80CCD(1B) additional deduction - max ₹50K"),
      otherDeductions: z.number().optional().describe("Any other deductions")
    })
  }
);

// Helper: Old Regime Tax Slabs
function calculateOldRegimeTax(income: number): number {
  let tax = 0;
  if (income > 1000000) tax += (income - 1000000) * 0.30;
  if (income > 500000) tax += Math.min(income - 500000, 500000) * 0.20;
  if (income > 250000) tax += Math.min(income - 250000, 250000) * 0.05;
  // Rebate u/s 87A
  if (income <= 500000) tax = 0;
  // 4% cess
  tax *= 1.04;
  return tax;
}

// Helper: New Regime Tax Slabs (FY 2024-25+)
function calculateNewRegimeTax(income: number): number {
  let tax = 0;
  const slabs = [
    { limit: 400000, rate: 0 },
    { limit: 800000, rate: 0.05 },
    { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 },
    { limit: 2000000, rate: 0.20 },
    { limit: 2400000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 }
  ];
  let remaining = income;
  let prevLimit = 0;
  for (const slab of slabs) {
    const taxable = Math.min(remaining, slab.limit - prevLimit);
    if (taxable <= 0) break;
    tax += taxable * slab.rate;
    remaining -= taxable;
    prevLimit = slab.limit;
  }
  // Rebate u/s 87A for new regime
  if (income <= 1200000) tax = 0;
  // 4% cess
  tax *= 1.04;
  return tax;
}

/** PPF Calculator Tool */
export const ppfCalc = tool(
  async ({ annualDeposit, years = 15 }) => {
    const deposit = Math.min(annualDeposit, 150000);
    const rate = 0.071;
    let balance = 0;
    let totalInvested = 0;
    for (let y = 1; y <= years; y++) {
      totalInvested += deposit;
      balance = (balance + deposit) * (1 + rate);
    }
    return JSON.stringify({
      annualDeposit: deposit,
      years,
      rate: "7.1%",
      taxStatus: "EEE (100% Tax Free)",
      totalInvested: Math.round(totalInvested),
      maturityAmount: Math.round(balance),
      interestEarned: Math.round(balance - totalInvested)
    });
  },
  {
    name: "ppfCalc",
    description: "Calculate maturity amount and interest earned under Public Provident Fund (PPF) at 7.1% tax-free interest.",
    schema: z.object({
      annualDeposit: z.number().describe("Annual deposit amount in ₹ (max ₹1.5 Lakhs)"),
      years: z.number().optional().describe("Tenure in years (default 15 years)")
    })
  }
);

/** EPF Calculator Tool */
export const epfCalc = tool(
  async ({ currentBasicSalary, employeeContributionPercent = 12, currentAge = 25, retireAge = 58, expectedSalaryGrowth = 5 }) => {
    const rate = 0.0825;
    const years = retireAge - currentAge;
    let basic = currentBasicSalary;
    let balance = 0;
    let totalEmployeeContrib = 0;
    let totalEmployerContrib = 0;

    for (let y = 0; y < years; y++) {
      const empMonthly = basic * (employeeContributionPercent / 100);
      const emprMonthly = basic * 0.0367; // 3.67% to EPF
      for (let m = 0; m < 12; m++) {
        totalEmployeeContrib += empMonthly;
        totalEmployerContrib += emprMonthly;
        balance = (balance + empMonthly + emprMonthly) * (1 + rate / 12);
      }
      basic *= (1 + expectedSalaryGrowth / 100);
    }

    return JSON.stringify({
      currentBasicSalary,
      currentAge,
      retireAge,
      yearsToRetire: years,
      totalEmployeeContrib: Math.round(totalEmployeeContrib),
      totalEmployerContrib: Math.round(totalEmployerContrib),
      interestRate: "8.25%",
      finalRetirementCorpus: Math.round(balance),
      totalInterestEarned: Math.round(balance - totalEmployeeContrib - totalEmployerContrib)
    });
  },
  {
    name: "epfCalc",
    description: "Calculate Employees' Provident Fund (EPF) accumulation and pension corpus at 8.25% interest.",
    schema: z.object({
      currentBasicSalary: z.number().describe("Current monthly basic salary in ₹"),
      employeeContributionPercent: z.number().optional().describe("Employee EPF contribution % (default 12%)"),
      currentAge: z.number().optional().describe("Current age (default 25)"),
      retireAge: z.number().optional().describe("Retirement age (default 58)"),
      expectedSalaryGrowth: z.number().optional().describe("Expected annual salary increment % (default 5%)")
    })
  }
);

/** NPS Calculator Tool */
export const npsCalc = tool(
  async ({ monthlyInvestment, currentAge = 30, retireAge = 60, expectedReturn = 10, annuityPercent = 40, annuityReturn = 6 }) => {
    const years = retireAge - currentAge;
    const months = years * 12;
    const monthlyRate = expectedReturn / 100 / 12;
    const totalInvested = monthlyInvestment * months;
    const corpus = monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

    const annuityCorpus = corpus * (annuityPercent / 100);
    const lumpSumWithdrawal = corpus - annuityCorpus;
    const monthlyPension = (annuityCorpus * (annuityReturn / 100)) / 12;

    return JSON.stringify({
      monthlyInvestment,
      yearsToRetire: years,
      totalInvested: Math.round(totalInvested),
      totalCorpusAt60: Math.round(corpus),
      taxFreeLumpSum60Percent: Math.round(lumpSumWithdrawal),
      annuityCorpus40Percent: Math.round(annuityCorpus),
      estimatedMonthlyPension: Math.round(monthlyPension)
    });
  },
  {
    name: "npsCalc",
    description: "Calculate National Pension System (NPS) maturity corpus, 60% tax-free lump sum withdrawal, and 40% annuity pension.",
    schema: z.object({
      monthlyInvestment: z.number().describe("Monthly NPS contribution in ₹"),
      currentAge: z.number().optional().describe("Current age (default 30)"),
      retireAge: z.number().optional().describe("Retirement age (default 60)"),
      expectedReturn: z.number().optional().describe("Expected annual NPS return % (default 10%)"),
      annuityPercent: z.number().optional().describe("Percentage allocated to annuity pension (min 40%)"),
      annuityReturn: z.number().optional().describe("Expected annual return on annuity (default 6%)")
    })
  }
);

/** SSY Calculator Tool */
export const ssyCalc = tool(
  async ({ yearlyInvestment, girlChildAge = 1 }) => {
    const deposit = Math.min(yearlyInvestment, 150000);
    const rate = 0.082; // 8.2%
    const depositYears = 15;
    const maturityYears = 21;
    let balance = 0;
    let totalInvested = 0;

    for (let y = 1; y <= maturityYears; y++) {
      if (y <= depositYears) {
        totalInvested += deposit;
        balance += deposit;
      }
      balance *= (1 + rate);
    }

    return JSON.stringify({
      yearlyInvestment: deposit,
      girlChildAge,
      maturityAge: girlChildAge + maturityYears,
      totalInvested: Math.round(totalInvested),
      maturityAmount: Math.round(balance),
      interestEarned: Math.round(balance - totalInvested),
      taxStatus: "100% Tax Free (EEE)"
    });
  },
  {
    name: "ssyCalc",
    description: "Calculate Sukanya Samriddhi Yojana (SSY) maturity corpus at 8.2% tax-free interest for a girl child.",
    schema: z.object({
      yearlyInvestment: z.number().describe("Yearly investment in ₹ (max ₹1.5 Lakhs)"),
      girlChildAge: z.number().optional().describe("Current age of girl child (0-10 years)")
    })
  }
);

/** APY Calculator Tool */
export const apyCalc = tool(
  async ({ currentAge, desiredPension }) => {
    const yearsToContribute = 60 - currentAge;
    // Standard APY contribution matrix approximation
    const baseContributions: Record<number, Record<number, number>> = {
      1000: { 18: 42, 25: 76, 30: 116, 35: 181, 40: 291 },
      5000: { 18: 210, 25: 376, 30: 577, 35: 902, 40: 1454 }
    };
    const approxMonthlyContrib = (desiredPension / 1000) * Math.round(42 * Math.pow(1.05, currentAge - 18));
    const totalContrib = approxMonthlyContrib * yearsToContribute * 12;

    return JSON.stringify({
      currentAge,
      pensionAge: 60,
      yearsToContribute,
      guaranteedMonthlyPension: desiredPension,
      approxMonthlyContribution: Math.round(approxMonthlyContrib),
      totalContributionTill60: Math.round(totalContrib)
    });
  },
  {
    name: "apyCalc",
    description: "Calculate Atal Pension Yojana (APY) monthly contribution required for guaranteed pension of ₹1,000 to ₹5,000.",
    schema: z.object({
      currentAge: z.number().describe("Current age (18 to 40)"),
      desiredPension: z.number().describe("Desired monthly pension after 60 (1000, 2000, 3000, 4000, 5000)")
    })
  }
);

/** POMIS Calculator Tool */
export const pomisCalc = tool(
  async ({ investmentAmount }) => {
    const rate = 0.074; // 7.4%
    const monthlyIncome = (investmentAmount * rate) / 12;
    const total5YearPayout = monthlyIncome * 60;

    return JSON.stringify({
      investmentAmount,
      tenureYears: 5,
      interestRate: "7.4%",
      monthlyIncomePayout: Math.round(monthlyIncome),
      total5YearIncome: Math.round(total5YearPayout)
    });
  },
  {
    name: "pomisCalc",
    description: "Calculate Post Office Monthly Income Scheme (POMIS) guaranteed monthly payout at 7.4% p.a.",
    schema: z.object({
      investmentAmount: z.number().describe("Investment amount in ₹ (max ₹9L single, ₹15L joint)")
    })
  }
);

/** RD Calculator Tool */
export const rdCalc = tool(
  async ({ monthlyDeposit, annualRate = 6.7, months = 60 }) => {
    const r = annualRate / 100 / 4; // quarterly compounding
    let maturity = 0;
    const totalInvested = monthlyDeposit * months;

    for (let i = 0; i < months; i++) {
      const n = (months - i) / 3;
      maturity += monthlyDeposit * Math.pow(1 + r, n);
    }

    return JSON.stringify({
      monthlyDeposit,
      annualRate,
      tenureMonths: months,
      totalInvested: Math.round(totalInvested),
      maturityAmount: Math.round(maturity),
      interestEarned: Math.round(maturity - totalInvested)
    });
  },
  {
    name: "rdCalc",
    description: "Calculate Recurring Deposit (RD) maturity value with quarterly compounding interest.",
    schema: z.object({
      monthlyDeposit: z.number().describe("Monthly RD deposit in ₹"),
      annualRate: z.number().optional().describe("Annual interest rate % (default 6.7%)"),
      months: z.number().optional().describe("Tenure in months (default 60)")
    })
  }
);

/** HRA Exemption Calculator Tool */
export const hraExemptionCalc = tool(
  async ({ basicSalaryMonthly, hraReceivedMonthly, rentPaidMonthly, isMetro = true }) => {
    const annualBasic = basicSalaryMonthly * 12;
    const annualHRA = hraReceivedMonthly * 12;
    const annualRent = rentPaidMonthly * 12;

    const cond1 = annualHRA;
    const cond2 = Math.max(0, annualRent - 0.10 * annualBasic);
    const cond3 = (isMetro ? 0.50 : 0.40) * annualBasic;

    const exemptHRA = Math.min(cond1, cond2, cond3);
    const taxableHRA = Math.max(0, annualHRA - exemptHRA);

    return JSON.stringify({
      annualBasicSalary: annualBasic,
      annualHraReceived: annualHRA,
      annualRentPaid: annualRent,
      exemptHraAmount: Math.round(exemptHRA),
      taxableHraAmount: Math.round(taxableHRA),
      monthlyTaxSavingsAt30Percent: Math.round((exemptHRA * 0.30) / 12)
    });
  },
  {
    name: "hraExemptionCalc",
    description: "Calculate Tax Exempt HRA (House Rent Allowance) and Taxable HRA under Section 10(13A).",
    schema: z.object({
      basicSalaryMonthly: z.number().describe("Monthly basic salary + DA in ₹"),
      hraReceivedMonthly: z.number().describe("Monthly HRA component received from employer"),
      rentPaidMonthly: z.number().describe("Actual monthly house rent paid"),
      isMetro: z.boolean().optional().describe("True if living in Metro (Mumbai, Delhi, Kolkata, Chennai), else false")
    })
  }
);

/** EMI Calculator Tool */
export const emiCalc = tool(
  async ({ loanAmount, annualRate, tenureYears }) => {
    const r = annualRate / 100 / 12;
    const n = tenureYears * 12;
    const emi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - loanAmount;

    return JSON.stringify({
      loanAmount,
      annualInterestRate: annualRate,
      tenureYears,
      monthlyEmi: Math.round(emi),
      totalInterestPayable: Math.round(totalInterest),
      totalAmountPayable: Math.round(totalPayment),
      interestToPrincipalRatio: (totalInterest / loanAmount).toFixed(2) + "x"
    });
  },
  {
    name: "emiCalc",
    description: "Calculate Equated Monthly Installment (EMI), total interest, and loan repayment schedule for home/car/personal loans.",
    schema: z.object({
      loanAmount: z.number().describe("Principal loan amount in ₹"),
      annualRate: z.number().describe("Annual interest rate % (e.g. 8.5)"),
      tenureYears: z.number().describe("Loan tenure in years")
    })
  }
);

/** SWP Calculator Tool */
export const swpCalc = tool(
  async ({ initialCorpus, monthlyWithdrawal, expectedReturn, years }) => {
    const monthlyRate = expectedReturn / 100 / 12;
    const months = years * 12;
    let balance = initialCorpus;
    let totalWithdrawn = 0;

    for (let m = 1; m <= months; m++) {
      balance = (balance - monthlyWithdrawal) * (1 + monthlyRate);
      totalWithdrawn += monthlyWithdrawal;
      if (balance <= 0) {
        balance = 0;
        break;
      }
    }

    return JSON.stringify({
      initialCorpus,
      monthlyWithdrawal,
      years,
      totalWithdrawn: Math.round(totalWithdrawn),
      finalRemainingCorpus: Math.round(balance),
      depletedEarly: balance === 0 ? "Yes, corpus ran out before tenure" : "No, portfolio sustained withdrawals"
    });
  },
  {
    name: "swpCalc",
    description: "Calculate Systematic Withdrawal Plan (SWP) post-retirement monthly cashflow and remaining portfolio balance.",
    schema: z.object({
      initialCorpus: z.number().describe("Initial investment corpus in ₹"),
      monthlyWithdrawal: z.number().describe("Desired monthly SWP withdrawal in ₹"),
      expectedReturn: z.number().describe("Expected annual portfolio return % (e.g. 8)"),
      years: z.number().describe("Withdrawal duration in years")
    })
  }
);

/** Cost of Delay Calculator Tool */
export const costOfDelayCalc = tool(
  async ({ monthlyAmount, expectedReturn, investDurationYears, delayYears }) => {
    const monthlyRate = expectedReturn / 100 / 12;
    
    // Starting today
    const totalMonths = investDurationYears * 12;
    const fvToday = monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);

    // Starting delayed
    const delayedMonths = (investDurationYears - delayYears) * 12;
    const fvDelayed = monthlyAmount * ((Math.pow(1 + monthlyRate, delayedMonths) - 1) / monthlyRate) * (1 + monthlyRate);

    const costOfDelay = fvToday - fvDelayed;

    return JSON.stringify({
      monthlyAmount,
      expectedReturn,
      investDurationYears,
      delayYears,
      wealthIfStartedToday: Math.round(fvToday),
      wealthIfDelayed: Math.round(fvDelayed),
      wealthLostDueToDelay: Math.round(costOfDelay),
      impactSummary: `Delaying by ${delayYears} years costs you ₹${Math.round(costOfDelay).toLocaleString("en-IN")} in lost wealth!`
    });
  },
  {
    name: "costOfDelayCalc",
    description: "Calculate the exponential wealth loss caused by delaying a monthly SIP investment by 1 to 5 years.",
    schema: z.object({
      monthlyAmount: z.number().describe("Monthly SIP amount in ₹"),
      expectedReturn: z.number().describe("Expected annual return %"),
      investDurationYears: z.number().describe("Total target investment duration in years"),
      delayYears: z.number().describe("Number of years delayed in starting")
    })
  }
);

/** Latte Factor Calculator Tool */
export const latteFactorCalc = tool(
  async ({ dailySpend, years = 20, expectedReturn = 12 }) => {
    const monthlySpend = dailySpend * 30;
    const monthlyRate = expectedReturn / 100 / 12;
    const months = years * 12;
    const totalSpentOut = monthlySpend * months;
    const futureWealthIfInvested = monthlySpend * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

    return JSON.stringify({
      dailySpend,
      monthlySpend,
      years,
      totalOutPocketSpent: Math.round(totalSpentOut),
      potentialWealthIfInvested: Math.round(futureWealthIfInvested),
      opportunityCost: Math.round(futureWealthIfInvested - totalSpentOut)
    });
  },
  {
    name: "latteFactorCalc",
    description: "Calculate the long-term wealth impact of small daily recurring spends (coffee, snacks, subscriptions) if invested instead.",
    schema: z.object({
      dailySpend: z.number().describe("Daily small spend in ₹ (e.g. ₹100 for daily chai/coffee)"),
      years: z.number().optional().describe("Time horizon in years (default 20)"),
      expectedReturn: z.number().optional().describe("Expected annual SIP return % (default 12%)")
    })
  }
);

/** Emergency Fund Calculator Tool */
export const emergencyFundCalc = tool(
  async ({ monthlyExpenses, monthsOfSafety = 6 }) => {
    const requiredFund = monthlyExpenses * monthsOfSafety;

    return JSON.stringify({
      monthlyExpenses,
      monthsOfSafety,
      requiredEmergencyFund: Math.round(requiredFund),
      recommendedAllocation: {
        instantCashInBank: Math.round(requiredFund * 0.20),
        liquidOrArbitrageFunds: Math.round(requiredFund * 0.80)
      },
      advice: "Keep 20% in high-yield savings account and 80% in Liquid/Arbitrage Mutual Funds for T+1 redemption."
    });
  },
  {
    name: "emergencyFundCalc",
    description: "Calculate emergency safety net corpus needed based on household monthly expenses (3 to 6 month rule).",
    schema: z.object({
      monthlyExpenses: z.number().describe("Total essential monthly family expenses in ₹"),
      monthsOfSafety: z.number().optional().describe("Months of expenses to buffer (3, 6, or 12)")
    })
  }
);

/** Rent vs Buy Property Calculator Tool */
export const rentVsBuyCalc = tool(
  async ({ homePrice, monthlyRent, downPaymentPercent = 20, homeLoanRate = 8.5, tenureYears = 20, propertyAppreciation = 5, investmentReturn = 12 }) => {
    const downPayment = homePrice * (downPaymentPercent / 100);
    const loanAmount = homePrice - downPayment;
    const r = homeLoanRate / 100 / 12;
    const n = tenureYears * 12;
    const emi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    // Buy option final home value
    const finalHomeValue = homePrice * Math.pow(1 + propertyAppreciation / 100, tenureYears);
    const totalLoanPaid = emi * n;
    const buyerNetWealth = finalHomeValue - totalLoanPaid - downPayment;

    // Rent option: Down payment + (EMI - Rent) invested in SIP
    const emiRentDiff = Math.max(0, emi - monthlyRent);
    const monthlyRate = investmentReturn / 100 / 12;
    const sipValue = emiRentDiff * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate);
    const downPaymentGrowth = downPayment * Math.pow(1 + investmentReturn / 100, tenureYears);
    const renterNetWealth = sipValue + downPaymentGrowth;

    return JSON.stringify({
      homePrice,
      monthlyRent,
      monthlyEmi: Math.round(emi),
      buyingScenario: {
        finalHomeValue: Math.round(finalHomeValue),
        buyerNetWealth: Math.round(buyerNetWealth)
      },
      rentingScenario: {
        renterSIPWealthCreated: Math.round(renterNetWealth)
      },
      verdict: renterNetWealth > buyerNetWealth
        ? `Renting & Investing saves ₹${Math.round(renterNetWealth - buyerNetWealth).toLocaleString("en-IN")} more net wealth!`
        : `Buying wins by ₹${Math.round(buyerNetWealth - renterNetWealth).toLocaleString("en-IN")} net wealth!`
    });
  },
  {
    name: "rentVsBuyCalc",
    description: "Compare mathematical net wealth creation between Renting vs Buying a home over a 20-year horizon.",
    schema: z.object({
      homePrice: z.number().describe("Property purchase price in ₹"),
      monthlyRent: z.number().describe("Current monthly rent in ₹"),
      downPaymentPercent: z.number().optional().describe("Down payment % (default 20%)"),
      homeLoanRate: z.number().optional().describe("Home loan interest rate % (default 8.5%)"),
      tenureYears: z.number().optional().describe("Loan tenure in years (default 20)"),
      propertyAppreciation: z.number().optional().describe("Annual real estate appreciation % (default 5%)"),
      investmentReturn: z.number().optional().describe("Expected equity SIP return % (default 12%)")
    })
  }
);

/** Net Worth Calculator Tool */
export const netWorthCalc = tool(
  async ({ liquidAssets, realEstateValue, equityAndMF, goldAndOther, totalLiabilities }) => {
    const totalAssets = liquidAssets + realEstateValue + equityAndMF + goldAndOther;
    const netWorth = totalAssets - totalLiabilities;

    return JSON.stringify({
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
      netWorth: Math.round(netWorth),
      solvencyRatio: (totalAssets / Math.max(1, totalLiabilities)).toFixed(2) + "x",
      status: netWorth > 0 ? "Positive Net Worth" : "Negative Net Worth (Debt heavy)"
    });
  },
  {
    name: "netWorthCalc",
    description: "Calculate personal Net Worth (Total Assets minus Total Outstanding Liabilities).",
    schema: z.object({
      liquidAssets: z.number().describe("Cash, savings bank balance, FD balance in ₹"),
      realEstateValue: z.number().describe("Current market value of owned properties in ₹"),
      equityAndMF: z.number().describe("Current portfolio value of stocks & mutual funds in ₹"),
      goldAndOther: z.number().describe("Value of physical gold, digital gold, vehicle in ₹"),
      totalLiabilities: z.number().describe("Total outstanding loans (home loan, car loan, credit cards) in ₹")
    })
  }
);

/** Human Life Value (HLV) Insurance Calculator Tool */
export const hlvCalc = tool(
  async ({ annualIncome, currentAge, retireAge = 60, existingLoans = 0, existingCover = 0 }) => {
    const yearsToRetire = retireAge - currentAge;
    // Income replacement method (assumes 5% inflation adjusted discount rate)
    const incomeReplacementNeed = annualIncome * yearsToRetire * 0.70; // 70% income replacement
    const totalCoverNeeded = incomeReplacementNeed + existingLoans - existingCover;

    return JSON.stringify({
      annualIncome,
      currentAge,
      yearsToProtect: yearsToRetire,
      existingLoans,
      existingCover,
      recommendedTermInsuranceCover: Math.round(Math.max(0, totalCoverNeeded)),
      ruleOfThumb: `Minimum Recommended Term Cover: ₹${Math.round(annualIncome * 15).toLocaleString("en-IN")} (15x annual income)`
    });
  },
  {
    name: "hlvCalc",
    description: "Calculate Human Life Value (HLV) and required Term Life Insurance cover needed to protect family income.",
    schema: z.object({
      annualIncome: z.number().describe("Current annual income in ₹"),
      currentAge: z.number().describe("Current age"),
      retireAge: z.number().optional().describe("Target retirement age (default 60)"),
      existingLoans: z.number().optional().describe("Total outstanding loans to be covered in ₹"),
      existingCover: z.number().optional().describe("Existing life insurance cover in ₹")
    })
  }
);

/** Gratuity Calculator Tool */
export const gratuityCalc = tool(
  async ({ lastDrawnBasicSalary, yearsOfService }) => {
    if (yearsOfService < 5) {
      return JSON.stringify({
        lastDrawnBasicSalary,
        yearsOfService,
        gratuityAmount: 0,
        status: "Not Eligible (Minimum 5 continuous years of service required)"
      });
    }
    const gratuity = (15 / 26) * lastDrawnBasicSalary * yearsOfService;
    const taxExemptGratuity = Math.min(gratuity, 2000000); // ₹20 Lakh statutory cap

    return JSON.stringify({
      lastDrawnBasicSalary,
      yearsOfService,
      totalGratuityPayable: Math.round(gratuity),
      taxExemptLimit: Math.round(taxExemptGratuity),
      taxableGratuity: Math.round(Math.max(0, gratuity - taxExemptGratuity))
    });
  },
  {
    name: "gratuityCalc",
    description: "Calculate Gratuity payout and statutory tax exemption under Gratuity Act.",
    schema: z.object({
      lastDrawnBasicSalary: z.number().describe("Last drawn monthly basic salary + DA in ₹"),
      yearsOfService: z.number().describe("Total completed years of service in company")
    })
  }
);

/** Credit Card Payoff Calculator Tool */
export const creditCardPayoffCalc = tool(
  async ({ creditCardBalance, annualInterestRate = 42, monthlyPayment }) => {
    const monthlyRate = annualInterestRate / 100 / 12;
    const minInterestOnly = creditCardBalance * monthlyRate;

    if (monthlyPayment <= minInterestOnly) {
      return JSON.stringify({
        creditCardBalance,
        annualInterestRate: annualInterestRate + "%",
        monthlyPayment,
        status: "Debt Trap Warning! Your monthly payment is less than monthly interest. The debt will never be paid off."
      });
    }

    let balance = creditCardBalance;
    let months = 0;
    let totalInterest = 0;

    while (balance > 0 && months < 360) {
      const interest = balance * monthlyRate;
      totalInterest += interest;
      balance = balance + interest - monthlyPayment;
      months++;
    }

    return JSON.stringify({
      creditCardBalance,
      annualInterestRate: annualInterestRate + "%",
      monthlyPayment,
      monthsToPayOff: months,
      yearsToPayOff: (months / 12).toFixed(1),
      totalInterestPaid: Math.round(totalInterest),
      totalRepayment: Math.round(creditCardBalance + totalInterest)
    });
  },
  {
    name: "creditCardPayoffCalc",
    description: "Calculate months to payoff high-interest credit card debt and total interest paid.",
    schema: z.object({
      creditCardBalance: z.number().describe("Total credit card balance outstanding in ₹"),
      annualInterestRate: z.number().optional().describe("Annual interest rate % (default 42%)"),
      monthlyPayment: z.number().describe("Monthly payment planned in ₹")
    })
  }
);

/** All 25+ tools exported as an array for the agent */
export const vaathiTools = [
  sipCalculator,
  lumpsumCalculator,
  compoundInterestCalc,
  fdVsMfCompare,
  goalPlanner,
  retirementCalc,
  taxCompare,
  ppfCalc,
  epfCalc,
  npsCalc,
  ssyCalc,
  apyCalc,
  pomisCalc,
  rdCalc,
  hraExemptionCalc,
  emiCalc,
  swpCalc,
  costOfDelayCalc,
  latteFactorCalc,
  emergencyFundCalc,
  rentVsBuyCalc,
  netWorthCalc,
  hlvCalc,
  gratuityCalc,
  creditCardPayoffCalc
];

