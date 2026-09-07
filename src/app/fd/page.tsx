"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  Landmark,
  Info,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  GitCompare,
  ArrowRight,
  UserCheck,
  Calendar,
  Percent,
  Coins,
  Wallet,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  Award,
  Crown,
  Building,
  ShieldAlert
} from "lucide-react";
import NumericInput from "@/components/NumericInput";

export type FdScheme = "cumulative" | "non-cumulative";
export type PayoutFrequency = "monthly" | "quarterly" | "half-yearly" | "annually";
export type CompoundingOption = "quarterly" | "monthly" | "half-yearly" | "annually" | "simple";
export type SeniorCategory = "regular" | "senior" | "super_senior" | "special_scheme" | "scss";

export interface SeniorCategoryConfig {
  id: SeniorCategory;
  label: string;
  age: string;
  bonusRate: number; // in percentage points added to card rate
  isFixedRate?: boolean;
  fixedRate?: number;
  tdsThreshold: number; // in INR
  badge: string;
  desc: string;
  icon: React.ElementType;
}

const SENIOR_CATEGORIES: Record<SeniorCategory, SeniorCategoryConfig> = {
  regular: {
    id: "regular",
    label: "General Citizen",
    age: "Age < 60",
    bonusRate: 0.0,
    tdsThreshold: 40000,
    badge: "Public Card Rate",
    desc: "Standard card rates. TDS threshold is ₹40,000 per financial year under Sec 194A.",
    icon: Landmark
  },
  senior: {
    id: "senior",
    label: "Senior Citizen",
    age: "Age 60 to 79",
    bonusRate: 0.50,
    tdsThreshold: 100000,
    badge: "+0.50% Premium",
    desc: "Standard 50 bps premium over card rate. ₹1,00,000 TDS threshold & Sec 80TTB benefit.",
    icon: UserCheck
  },
  super_senior: {
    id: "super_senior",
    label: "Super Senior",
    age: "Age 80+",
    bonusRate: 0.75,
    tdsThreshold: 100000,
    badge: "+0.75% Premium",
    desc: "Additional 0.25% above senior rate (+0.75% total) offered by BoI, PNB, Indian Bank, etc.",
    icon: Crown
  },
  special_scheme: {
    id: "special_scheme",
    label: "Special Bank Scheme",
    age: "SBI We-Care / 3-5Y",
    bonusRate: 1.00,
    tdsThreshold: 100000,
    badge: "+1.00% Premium",
    desc: "Special long-term senior buckets (SBI We-Care, HDFC Senior Care) paying up to 1.00% extra.",
    icon: Award
  },
  scss: {
    id: "scss",
    label: "Govt SCSS Scheme",
    age: "Age 60+ Sovereign",
    bonusRate: 0.0,
    isFixedRate: true,
    fixedRate: 8.20,
    tdsThreshold: 100000,
    badge: "8.20% Sovereign",
    desc: "Government-backed Senior Citizen Savings Scheme offering guaranteed 8.2% p.a. quarterly income.",
    icon: Building
  }
};

const COMPOUNDING_PERIODS: Record<CompoundingOption, { label: string; periods: number; desc: string; standard?: boolean }> = {
  quarterly: { label: "Quarterly (RBI Bank Std)", periods: 4, desc: "Mandatory standard for all Indian commercial banks under RBI regulations", standard: true },
  monthly: { label: "Monthly (NBFC Model)", periods: 12, desc: "Offered by select NBFCs or corporate fixed deposit issuers" },
  "half-yearly": { label: "Half-Yearly", periods: 2, desc: "Compounded twice a year (every 6 months)" },
  annually: { label: "Annually", periods: 1, desc: "Compounded once a year (yearly reinvestment)" },
  simple: { label: "Simple Interest", periods: 0, desc: "Short-term deposits under 181 days or non-cumulative returns" }
};

const PAYOUT_FREQUENCIES: Record<PayoutFrequency, { label: string; periodsPerYear: number; desc: string }> = {
  monthly: { label: "Monthly Payout", periodsPerYear: 12, desc: "Discounted monthly interest per RBI rules to match quarterly yield" },
  quarterly: { label: "Quarterly Payout", periodsPerYear: 4, desc: "Simple interest paid out every 3 calendar months (P × r / 4)" },
  "half-yearly": { label: "Half-Yearly Payout", periodsPerYear: 2, desc: "Interest paid every 6 calendar months (P × r / 2)" },
  annually: { label: "Annual Payout", periodsPerYear: 1, desc: "Lump sum interest paid out once every year (P × r)" }
};

export default function FixedDepositCalculator() {
  const [scheme, setScheme] = useState<FdScheme>("cumulative");
  const [payoutFreq, setPayoutFreq] = useState<PayoutFrequency>("monthly");
  const [compounding, setCompounding] = useState<CompoundingOption>("quarterly");
  const [seniorCategory, setSeniorCategory] = useState<SeniorCategory>("senior");
  
  const [depositAmount, setDepositAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(7.0);
  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(0);
  const [taxSlab, setTaxSlab] = useState(30); // 0%, 5%, 10%, 15%, 20%, 25%, 30%
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(7.0);
  
  const [showAudit, setShowAudit] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showCompoundingComparison, setShowCompoundingComparison] = useState(true);

  // Live dynamic macroeconomic rates from API
  const [rates, setRates] = useState({
    repoRate: 6.5,
    bondYield10Y: 6.95,
    inflationRate: 7.0
  });

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        if (data.inflationRate) {
          setInflation(data.inflationRate);
        }
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  const currentSeniorConfig = SENIOR_CATEGORIES[seniorCategory];

  // Effective nominal interest rate factoring senior category additions
  const effectiveRate = useMemo(() => {
    if (currentSeniorConfig.isFixedRate && currentSeniorConfig.fixedRate) {
      return currentSeniorConfig.fixedRate;
    }
    return Number((interestRate + currentSeniorConfig.bonusRate).toFixed(2));
  }, [interestRate, currentSeniorConfig]);

  // Total tenure in fractional years and approximate days
  const totalTenureYears = useMemo(() => {
    const total = years + months / 12;
    return total > 0 ? total : 1 / 12; // min 1 month
  }, [years, months]);

  const tenureInDays = useMemo(() => {
    return Math.round(totalTenureYears * 365);
  }, [totalTenureYears]);

  // RBI Rule: Tenures under 181 days (~6 months) use Simple Interest
  const isShortTerm = useMemo(() => {
    return years === 0 && months < 6;
  }, [years, months]);

  // Main calculations for Cumulative and Non-Cumulative Schemes
  const calculations = useMemo(() => {
    const P = depositAmount;
    const r = effectiveRate / 100;
    const regularRate = interestRate / 100;
    const t = totalTenureYears;
    const taxRate = taxSlab / 100;
    const infRate = inflation / 100;

    // 1. CUMULATIVE SCHEME CALCULATIONS (WITH SENIOR BONUS ADDITION)
    let cumulativeGross = 0;
    let cumulativeInterest = 0;
    let regularGross = 0;
    let regularInterest = 0;

    // Under RBI guidelines: if under 181 days, simple interest applies automatically
    const effectiveCompounding = isShortTerm ? "simple" : compounding;

    if (effectiveCompounding === "simple") {
      cumulativeInterest = P * r * t;
      cumulativeGross = P + cumulativeInterest;

      regularInterest = P * regularRate * t;
      regularGross = P + regularInterest;
    } else {
      const m = COMPOUNDING_PERIODS[compounding].periods;
      // Standard Formula: A = P * (1 + r/m)^(m * t)
      cumulativeGross = P * Math.pow(1 + r / m, m * t);
      cumulativeInterest = cumulativeGross - P;

      regularGross = P * Math.pow(1 + regularRate / m, m * t);
      regularInterest = regularGross - P;
    }

    const cumulativeTax = cumulativeInterest * taxRate;
    const cumulativePostTaxMaturity = cumulativeGross - cumulativeTax;
    const cumulativePostTaxInterest = cumulativeInterest - cumulativeTax;
    const cumulativeRealMaturity = cumulativePostTaxMaturity / Math.pow(1 + infRate, t);

    // Regular Card Rate (No Senior Addition) for comparison
    const regularTax = regularInterest * taxRate;
    const regularPostTaxMaturity = regularGross - regularTax;
    const regularPostTaxInterest = regularInterest - regularTax;

    // Additional Senior Citizen Extra Returns
    const additionalSeniorGrossInterest = Math.max(0, cumulativeInterest - regularInterest);
    const additionalSeniorPostTaxInterest = Math.max(0, cumulativePostTaxInterest - regularPostTaxInterest);
    const additionalSeniorMaturity = Math.max(0, cumulativePostTaxMaturity - regularPostTaxMaturity);

    const cumulativePostTaxCAGR =
      (Math.pow(cumulativePostTaxMaturity / P, 1 / t) - 1) * 100;
    const cumulativeRealCAGR =
      ((1 + cumulativePostTaxCAGR / 100) / (1 + infRate) - 1) * 100;

    // 2. NON-CUMULATIVE (PAYOUT PLAN) CALCULATIONS
    // RBI Rule for Monthly Payout: Discounted rate so net yield equals quarterly compounding
    // Formula: P * [(1 + r/4)^(1/3) - 1]
    const discountedMonthlyPayout = P * (Math.pow(1 + r / 4, 1 / 3) - 1);
    const undiscountedSimpleMonthly = P * (r / 12);
    const quarterlyPayout = P * (r / 4);
    const halfYearlyPayout = P * (r / 2);
    const annualPayout = P * r;

    let periodicPayoutGross = 0;
    let totalPeriods = 0;

    if (payoutFreq === "monthly") {
      periodicPayoutGross = discountedMonthlyPayout;
      totalPeriods = Math.max(1, Math.round(t * 12));
    } else if (payoutFreq === "quarterly") {
      periodicPayoutGross = quarterlyPayout;
      totalPeriods = Math.max(1, Math.round(t * 4));
    } else if (payoutFreq === "half-yearly") {
      periodicPayoutGross = halfYearlyPayout;
      totalPeriods = Math.max(1, Math.round(t * 2));
    } else {
      periodicPayoutGross = annualPayout;
      totalPeriods = Math.max(1, Math.round(t));
    }

    const periodicPayoutTax = periodicPayoutGross * taxRate;
    const periodicPayoutNet = periodicPayoutGross - periodicPayoutTax;
    const totalNonCumulativeInterestGross = periodicPayoutGross * totalPeriods;
    const totalNonCumulativeTax = periodicPayoutTax * totalPeriods;
    const totalNonCumulativeInterestNet = periodicPayoutNet * totalPeriods;
    const nonCumulativeTotalCashflow = P + totalNonCumulativeInterestNet;

    // Regular Non-Cumulative Payout for Comparison
    const regularQuarterlyPayout = P * (regularRate / 4);
    const regularDiscountedMonthly = P * (Math.pow(1 + regularRate / 4, 1 / 3) - 1);
    const regularPeriodicGross = payoutFreq === "monthly" ? regularDiscountedMonthly : regularQuarterlyPayout;
    const extraPeriodicPayout = Math.max(0, periodicPayoutNet - (regularPeriodicGross * (1 - taxRate)));

    // 3. TDS Exemption Status Evaluation (Sec 194A)
    // Regular threshold = ₹40,000, Senior Citizen threshold = ₹1,00,000
    const estAnnualInterest = (cumulativeInterest / t);
    const isTdsExempt = estAnnualInterest <= currentSeniorConfig.tdsThreshold;
    const regularTdsExempt = estAnnualInterest <= 40000;
    const seniorTdsBenefitActive = !regularTdsExempt && isTdsExempt;

    // 4. Sovereign SCSS Benchmark Comparison
    // SCSS offers 8.20% fixed quarterly payout up to ₹30 Lakh
    const scssRate = 0.082;
    const scssGrossMaturity = P * Math.pow(1 + scssRate / 4, 4 * t);
    const scssTotalInterest = scssGrossMaturity - P;
    const scssPostTaxMaturity = P + (scssTotalInterest * (1 - taxRate));
    const scssAdvantage = scssPostTaxMaturity - cumulativePostTaxMaturity;

    // 5. Compounding Frequency Comparison Table
    const frequencyComparison = [
      {
        frequency: "Quarterly (RBI Commercial Bank Standard)",
        periods: 4,
        badge: "RBI Regulatory Standard",
        interest: Math.round(P * Math.pow(1 + r / 4, 4 * t) - P),
        maturity: Math.round(P * Math.pow(1 + r / 4, 4 * t)),
        apy: Number(((Math.pow(1 + r / 4, 4) - 1) * 100).toFixed(2))
      },
      {
        frequency: "Monthly (NBFC / Corporate FD)",
        periods: 12,
        badge: "Select NBFCs Only",
        interest: Math.round(P * Math.pow(1 + r / 12, 12 * t) - P),
        maturity: Math.round(P * Math.pow(1 + r / 12, 12 * t)),
        apy: Number(((Math.pow(1 + r / 12, 12) - 1) * 100).toFixed(2))
      },
      {
        frequency: "Half-Yearly",
        periods: 2,
        badge: "Semi-Annual",
        interest: Math.round(P * Math.pow(1 + r / 2, 2 * t) - P),
        maturity: Math.round(P * Math.pow(1 + r / 2, 2 * t)),
        apy: Number(((Math.pow(1 + r / 2, 2) - 1) * 100).toFixed(2))
      },
      {
        frequency: "Yearly (Annual Reinvestment)",
        periods: 1,
        badge: "Annual",
        interest: Math.round(P * Math.pow(1 + r, t) - P),
        maturity: Math.round(P * Math.pow(1 + r, t)),
        apy: Number((r * 100).toFixed(2))
      },
      {
        frequency: "Simple Interest (Under 181 Days / Short-Term)",
        periods: 0,
        badge: "Zero Compounding",
        interest: Math.round(P * r * t),
        maturity: Math.round(P * (1 + r * t)),
        apy: Number((r * 100).toFixed(2))
      }
    ];

    // Year-by-year growth trajectory
    const chartData = [];
    const yearlyBreakdown = [];
    const maxYears = Math.ceil(t);

    for (let y = 1; y <= maxYears; y++) {
      const currentT = Math.min(y, t);

      if (scheme === "cumulative") {
        let yrGross = 0;
        let yrInterest = 0;

        if (effectiveCompounding === "simple") {
          yrInterest = P * r * currentT;
          yrGross = P + yrInterest;
        } else {
          const m = COMPOUNDING_PERIODS[compounding].periods;
          yrGross = P * Math.pow(1 + r / m, m * currentT);
          yrInterest = yrGross - P;
        }

        const yrTax = yrInterest * taxRate;
        const yrNet = yrGross - yrTax;
        const yrReal = yrNet / Math.pow(1 + infRate, currentT);

        chartData.push({
          year: `Yr ${y}`,
          "Gross Maturity": Math.round(yrGross),
          "Post-Tax Maturity": Math.round(yrNet),
          "Inflation Adjusted (Real)": Math.round(yrReal),
          "Principal Deposited": Math.round(P)
        });

        yearlyBreakdown.push({
          year: y,
          gross: Math.round(yrGross),
          interest: Math.round(yrInterest),
          tax: Math.round(yrTax),
          net: Math.round(yrNet),
          real: Math.round(yrReal)
        });
      } else {
        const periodsElapsed = Math.round(currentT * PAYOUT_FREQUENCIES[payoutFreq].periodsPerYear);
        const cumInterestGross = periodicPayoutGross * periodsElapsed;
        const cumInterestNet = periodicPayoutNet * periodsElapsed;
        const cumTax = periodicPayoutTax * periodsElapsed;
        const totalCashReceived = P + cumInterestNet;
        const realCash = totalCashReceived / Math.pow(1 + infRate, currentT);

        chartData.push({
          year: `Yr ${y}`,
          "Total Inflow (Principal + Payouts)": Math.round(totalCashReceived),
          "Cumulative Payouts (Post-Tax)": Math.round(cumInterestNet),
          "Inflation Adjusted Value": Math.round(realCash),
          "Principal Deposited": Math.round(P)
        });

        yearlyBreakdown.push({
          year: y,
          gross: Math.round(P + cumInterestGross),
          interest: Math.round(cumInterestGross),
          tax: Math.round(cumTax),
          net: Math.round(totalCashReceived),
          real: Math.round(realCash)
        });
      }
    }

    return {
      principal: P,
      effectiveCompounding,
      // Cumulative Scheme outputs
      cumulativeGross: Math.round(cumulativeGross),
      cumulativeInterest: Math.round(cumulativeInterest),
      cumulativeTax: Math.round(cumulativeTax),
      cumulativePostTaxMaturity: Math.round(cumulativePostTaxMaturity),
      cumulativePostTaxInterest: Math.round(cumulativePostTaxInterest),
      cumulativeRealMaturity: Math.round(cumulativeRealMaturity),
      cumulativePostTaxCAGR: Number(cumulativePostTaxCAGR.toFixed(2)),
      cumulativeRealCAGR: Number(cumulativeRealCAGR.toFixed(2)),
      // Additional Senior Gains
      additionalSeniorGrossInterest: Math.round(additionalSeniorGrossInterest),
      additionalSeniorPostTaxInterest: Math.round(additionalSeniorPostTaxInterest),
      additionalSeniorMaturity: Math.round(additionalSeniorMaturity),
      regularPostTaxMaturity: Math.round(regularPostTaxMaturity),
      // Non-Cumulative Scheme outputs
      periodicPayoutGross: Math.round(periodicPayoutGross),
      periodicPayoutNet: Math.round(periodicPayoutNet),
      periodicPayoutTax: Math.round(periodicPayoutTax),
      totalPeriods,
      totalNonCumulativeInterestGross: Math.round(totalNonCumulativeInterestGross),
      totalNonCumulativeInterestNet: Math.round(totalNonCumulativeInterestNet),
      totalNonCumulativeTax: Math.round(totalNonCumulativeTax),
      nonCumulativeTotalCashflow: Math.round(nonCumulativeTotalCashflow),
      discountedMonthlyPayout: Math.round(discountedMonthlyPayout),
      undiscountedSimpleMonthly: Math.round(undiscountedSimpleMonthly),
      monthlyDiscountGap: Math.round(undiscountedSimpleMonthly - discountedMonthlyPayout),
      extraPeriodicPayout: Math.round(extraPeriodicPayout),
      // TDS Evaluation
      estAnnualInterest: Math.round(estAnnualInterest),
      isTdsExempt,
      seniorTdsBenefitActive,
      // SCSS Comparison
      scssGrossMaturity: Math.round(scssGrossMaturity),
      scssPostTaxMaturity: Math.round(scssPostTaxMaturity),
      scssAdvantage: Math.round(scssAdvantage),
      // Tables & Charts
      frequencyComparison,
      chartData,
      yearlyBreakdown
    };
  }, [
    depositAmount,
    effectiveRate,
    interestRate,
    totalTenureYears,
    compounding,
    isShortTerm,
    scheme,
    payoutFreq,
    taxSlab,
    inflation,
    currentSeniorConfig
  ]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 animate-fadeIn max-w-full overflow-x-hidden text-light-grey">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-navy pb-4 sm:pb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald/10 text-emerald border border-emerald/30 px-2 py-0.5 rounded">
              RBI Regulatory Compliant
            </span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Award size={12} />
              Senior Citizen Premium Engine
            </span>
            <span className="text-[10px] font-bold text-muted-grey">
              Quarterly Compounding Norm
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight flex items-center gap-2 mt-1">
            <Landmark className="text-emerald shrink-0" />
            <span>Fixed Deposit (FD) Calculator</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-grey mt-1">
            Calculate Bank and Sovereign FDs with active Senior Citizen premiums (+0.50% to +1.00%), RBI quarterly compounding, discounted monthly payouts, and 0% to 30% tax brackets.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/sip-vs-fd"
            className="text-xs font-bold text-emerald bg-emerald/10 border border-emerald/30 hover:bg-emerald/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <GitCompare size={14} />
            <span>Compare SIP vs FD</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Scheme Mode Selector: Cumulative vs Non-Cumulative */}
      <div className="p-1.5 bg-navy-card/90 rounded-2xl border border-border-navy grid grid-cols-1 md:grid-cols-2 gap-2 shadow-lg">
        <button
          type="button"
          onClick={() => setScheme("cumulative")}
          className={`p-3 sm:p-4 rounded-xl text-left transition-all cursor-pointer flex items-start gap-3 border ${
            scheme === "cumulative"
              ? "bg-emerald/15 border-emerald text-heading shadow-md"
              : "bg-navy-bg/50 border-transparent text-muted-grey hover:text-heading hover:bg-navy-bg"
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${scheme === "cumulative" ? "bg-emerald text-navy-bg" : "bg-navy-card text-muted-grey"}`}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold text-heading">Cumulative FD (Growth Plan)</strong>
              <span className="text-[9px] font-extrabold bg-emerald/10 dark:bg-emerald/20 text-emerald border border-emerald/25 px-2 py-0.5 rounded">
                Quarterly Compounded
              </span>
            </div>
            <p className="text-[11px] text-muted-grey mt-1 leading-snug">
              Interest earned every 3 months is automatically reinvested into principal. Matures as a lumpsum (Principal + Compounded Interest) at end of tenure.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setScheme("non-cumulative")}
          className={`p-3 sm:p-4 rounded-xl text-left transition-all cursor-pointer flex items-start gap-3 border ${
            scheme === "non-cumulative"
              ? "bg-cyan-500/15 border-cyan-400 text-heading shadow-md"
              : "bg-navy-bg/50 border-transparent text-muted-grey hover:text-heading hover:bg-navy-bg"
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${scheme === "non-cumulative" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-navy-card text-muted-grey"}`}>
            <Wallet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold text-heading">Non-Cumulative FD (Payout Plan)</strong>
              <span className="text-[9px] font-extrabold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 px-2 py-0.5 rounded">
                Regular Cash Income
              </span>
            </div>
            <p className="text-[11px] text-muted-grey mt-1 leading-snug">
              Compounding does NOT apply. Earned interest is paid out periodically (Monthly Discounted, Quarterly, Half-Yearly, or Annually) to your bank account.
            </p>
          </div>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-4 sm:space-y-5 shadow-xl">
            {/* Header with Depositor Status */}
            <div className="border-b border-border-navy pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-heading">Deposit Parameters</h2>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  {currentSeniorConfig.badge}
                </span>
              </div>
            </div>

            {/* ⭐ SELECT BUTTON: Depositor Seniority Category (User Request) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-heading flex items-center gap-1.5">
                  <Award size={14} className="text-amber-400" />
                  <span>Depositor Seniority &amp; Status</span>
                </label>
                <span className="text-[10px] font-bold text-emerald">
                  {seniorCategory === "regular" ? "0.00% Added" : `+${currentSeniorConfig.bonusRate}% Boost Added`}
                </span>
              </div>

              {/* Interactive Category Selection Grid */}
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.keys(SENIOR_CATEGORIES) as SeniorCategory[]).map((catKey) => {
                  const cat = SENIOR_CATEGORIES[catKey];
                  const Icon = cat.icon;
                  const isSelected = seniorCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setSeniorCategory(catKey)}
                      className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-500 text-heading shadow-md"
                          : "bg-navy-bg/60 border-border-navy/60 text-muted-grey hover:text-heading hover:bg-navy-bg"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isSelected ? "bg-amber-500 text-navy-bg font-bold" : "bg-navy-card text-muted-grey"}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-heading">{cat.label}</span>
                            <span className="text-[9px] text-muted-grey font-mono">({cat.age})</span>
                          </div>
                          <span className="text-[9px] text-muted-grey block leading-tight">
                            {cat.id === "regular" && "Standard public card rate (TDS at ₹40k)"}
                            {cat.id === "senior" && "Standard +0.50% extra rate (TDS at ₹1 Lakh)"}
                            {cat.id === "super_senior" && "+0.75% extra (+0.25% ultra-senior boost)"}
                            {cat.id === "special_scheme" && "+1.00% extra on SBI We-Care / 5Y buckets"}
                            {cat.id === "scss" && "8.20% sovereign fixed quarterly rate"}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0 ${
                        isSelected ? "bg-amber-500 text-navy-bg" : "bg-navy-card text-muted-grey border border-border-navy"
                      }`}>
                        {cat.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rate Equation Indicator */}
              <div className="p-2 rounded-lg bg-navy-bg/70 border border-border-navy/70 text-[10px] text-light-grey flex items-center justify-between">
                <span className="text-heading font-medium">Effective Rate Applied:</span>
                <span className="font-mono font-bold text-amber-500 dark:text-amber-400">
                  {seniorCategory === "scss" ? (
                    "8.20% (Govt Sovereign SCSS)"
                  ) : (
                    `${interestRate.toFixed(2)}% Base + ${currentSeniorConfig.bonusRate.toFixed(2)}% Senior = ${effectiveRate.toFixed(2)}% p.a.`
                  )}
                </span>
              </div>
            </div>

            {/* Principal Amount */}
            <div className="space-y-2 border-t border-border-navy/60 pt-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Deposit Principal</span>
                <NumericInput
                  value={depositAmount}
                  onChange={setDepositAmount}
                  min={1000}
                  max={seniorCategory === "scss" ? 3000000 : 100000000}
                  step={5000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={10000}
                max={seniorCategory === "scss" ? 3000000 : 5000000}
                step={10000}
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹10,000</span>
                <span>{seniorCategory === "scss" ? "₹30 Lakhs (SCSS Cap)" : "₹50 Lakhs"}</span>
              </div>
              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[50000, 100000, 500000, 1000000, seniorCategory === "scss" ? 3000000 : 2500000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDepositAmount(preset)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      depositAmount === preset
                        ? "bg-emerald/20 text-emerald border-emerald/40"
                        : "bg-navy-bg text-muted-grey border-border-navy hover:text-white"
                    }`}
                  >
                    ₹{preset >= 100000 ? `${preset / 100000}L` : `${preset / 1000}K`}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate (Editable if not fixed SCSS) */}
            {seniorCategory !== "scss" ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">
                    Base Card Rate (Regular Public)
                  </span>
                  <NumericInput
                    value={interestRate}
                    onChange={setInterestRate}
                    min={1}
                    max={20}
                    step={0.1}
                    type="percent"
                  />
                </div>
                <input
                  type="range"
                  min={4}
                  max={12}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-grey">
                  <span>4%</span>
                  <span>12%</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setInterestRate(rates.repoRate)}
                    className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all cursor-pointer"
                  >
                    RBI Repo Rate ({rates.repoRate}%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestRate(7.0)}
                    className="text-[9px] font-bold text-white border border-border-navy bg-navy-light/40 hover:bg-navy-light px-2 py-0.5 rounded transition-all cursor-pointer"
                  >
                    Bank FD Avg (7.0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestRate(8.5)}
                    className="text-[9px] font-bold text-cyan-400 border border-cyan-400/20 bg-cyan-400/5 hover:bg-cyan-400/10 px-2 py-0.5 rounded transition-all cursor-pointer"
                  >
                    Small Finance Bank (8.5%)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>Sovereign Fixed Rate</span>
                  <span className="font-mono text-sm">8.20% p.a.</span>
                </div>
                <p className="text-[10px] text-amber-300/80 leading-tight">
                  Guaranteed by the Government of India for the entire 5-year tenure. Quarterly interest payouts with 100% sovereign capital safety.
                </p>
              </div>
            )}

            {/* Tenure (Years & Months) */}
            <div className="space-y-3 border-t border-border-navy/60 pt-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Deposit Tenure</span>
                <span className="text-white font-mono text-xs">
                  {years} Yrs {months > 0 ? `${months} Mos` : ""} ({totalTenureYears.toFixed(2)} Yrs / ~{tenureInDays} Days)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-grey">
                    <span>Years</span>
                    <span>{years} Yrs</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-grey">
                    <span>Months</span>
                    <span>{months} Mos</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={11}
                    step={1}
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Short-Term FD (< 181 Days) Notice per RBI Guidelines */}
              {isShortTerm && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                    <span>Short-Term FD (&lt; 181 Days / 6 Months)</span>
                  </div>
                  <p className="text-[10px] text-amber-300/80 leading-tight">
                    Under Reserve Bank of India (RBI) guidelines, term deposits under 181 days are calculated on a <strong>Simple Interest</strong> basis because no compounding cycles occur before maturity.
                  </p>
                </div>
              )}
            </div>

            {/* Scheme-Specific Frequency Options */}
            {scheme === "cumulative" ? (
              <div className="space-y-2 border-t border-border-navy/60 pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-grey block">
                    Compounding Frequency
                  </label>
                  {isShortTerm ? (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      Simple Interest (&lt; 181 Days)
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald bg-emerald/10 border border-emerald/30 px-1.5 py-0.5 rounded">
                      Quarterly = RBI Standard
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                  {(Object.keys(COMPOUNDING_PERIODS) as CompoundingOption[]).map((key) => {
                    const item = COMPOUNDING_PERIODS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCompounding(key)}
                        disabled={isShortTerm}
                        className={`py-1.5 px-2 rounded transition-colors text-center cursor-pointer relative ${
                          (isShortTerm ? key === "simple" : compounding === key)
                            ? "bg-emerald text-navy-bg font-extrabold shadow"
                            : "text-muted-grey hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[9px] text-muted-grey block">
                  *{COMPOUNDING_PERIODS[isShortTerm ? "simple" : compounding].desc}
                </span>
              </div>
            ) : (
              <div className="space-y-2 border-t border-border-navy/60 pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-grey block">
                    Income Payout Frequency
                  </label>
                  <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                    Regular Cashflow
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                  {(Object.keys(PAYOUT_FREQUENCIES) as PayoutFrequency[]).map((key) => {
                    const item = PAYOUT_FREQUENCIES[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPayoutFreq(key)}
                        className={`py-1.5 px-2 rounded transition-colors text-center cursor-pointer ${
                          payoutFreq === key
                            ? "bg-cyan-400 text-navy-bg font-extrabold shadow"
                            : "text-muted-grey hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[9px] text-muted-grey block">
                  *{PAYOUT_FREQUENCIES[payoutFreq].desc}
                </span>
              </div>
            )}

            {/* Income Tax Slab with Full New Tax Regime Slabs */}
            <div className="space-y-2 border-t border-border-navy/60 pt-3">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span className="text-heading font-bold">
                  New Tax Regime Slab (FY 2025-26)
                </span>
                <span className="text-xs text-amber-500 font-extrabold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  {taxSlab}% Bracket
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 bg-navy-bg p-1.5 rounded-xl border border-border-navy text-xs font-bold">
                {[0, 5, 10, 15, 20, 25, 30].map((slab) => (
                  <button
                    key={slab}
                    type="button"
                    onClick={() => setTaxSlab(slab)}
                    className={`py-2 rounded-lg transition-all text-center cursor-pointer font-bold ${
                      taxSlab === slab
                        ? "bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400/40"
                        : "text-heading bg-navy-card/80 hover:bg-navy-light border border-border-navy/60"
                    }`}
                  >
                    {slab}%
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-grey leading-relaxed space-y-1 bg-navy-bg/80 p-3 rounded-xl border border-border-navy">
                <div className="flex justify-between text-heading font-semibold">
                  <span>Bracket Description:</span>
                  <span className="text-amber-500 dark:text-amber-400 font-extrabold">
                    {taxSlab === 0 && "Up to ₹4,00,000 / Sec 87A Rebate (Nil)"}
                    {taxSlab === 5 && "₹4,00,001 to ₹8,00,000 (5%)"}
                    {taxSlab === 10 && "₹8,00,001 to ₹12,00,000 (10%)"}
                    {taxSlab === 15 && "₹12,00,001 to ₹16,00,000 (15%)"}
                    {taxSlab === 20 && "₹16,00,001 to ₹20,00,000 (20%)"}
                    {taxSlab === 25 && "₹20,00,001 to ₹24,00,000 (25%)"}
                    {taxSlab === 30 && "Above ₹24,00,000 (30%)"}
                  </span>
                </div>
                <p className="text-muted-grey text-xs pt-1 leading-normal">
                  *Under New Regime, income up to ₹12 Lakh gets full Section 87A rebate. Senior citizens submitting Form 15H have 0% TDS withheld.
                </p>
              </div>
            </div>

            {/* Inflation Adjustment */}
            <div className="border-t border-border-navy pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Calculates real purchasing power net of consumer inflation.">
                    <HelpCircle size={14} />
                  </span>
                </label>
                <input
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                  className="rounded border-border-navy text-emerald focus:ring-emerald accent-emerald h-4 w-4 cursor-pointer"
                />
              </div>

              {adjustInflation && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-grey">Inflation Benchmark</span>
                    <NumericInput
                      value={inflation}
                      onChange={setInflation}
                      min={0}
                      max={25}
                      step={0.1}
                      type="percent"
                      className="text-amber-500 focus-within:border-amber-500/50"
                    />
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    step={0.5}
                    value={inflation}
                    onChange={(e) => setInflation(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-navy-bg h-1 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-grey">
                    <span>3%</span>
                    <span>12%</span>
                  </div>
                  <div className="pt-0.5 text-left">
                    <button
                      type="button"
                      onClick={() => setInflation(rates.inflationRate)}
                      className="text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      CPI Inflation Baseline ({rates.inflationRate}%)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results & Visuals Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* ⭐ HIGHLIGHT CARD: Senior Citizen Extra Returns Additionally Added */}
          {seniorCategory !== "regular" && (
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-navy-card shadow-sm space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border-navy pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm">
                    <Crown size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-heading">
                      {currentSeniorConfig.label} Premium Applied
                    </h3>
                    <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">
                      Rate Boost: {seniorCategory === "scss" ? "8.20% Sovereign Fixed" : `+${currentSeniorConfig.bonusRate}% over public card rate`}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald bg-emerald/10 border border-emerald/30 px-3 py-1 rounded-full">
                  Returns Automatically Added
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-navy-bg p-3.5 rounded-xl border border-border-navy shadow-xs">
                  <span className="text-xs uppercase font-bold text-muted-grey block">Additional Interest Earned</span>
                  <p className="text-base sm:text-lg font-extrabold text-amber-500 dark:text-amber-400 mt-0.5">
                    +{formatCurrency(calculations.additionalSeniorPostTaxInterest)}
                  </p>
                  <span className="text-xs text-muted-grey block mt-0.5">
                    Gross: +{formatCurrency(calculations.additionalSeniorGrossInterest)}
                  </span>
                </div>

                <div className="bg-navy-bg p-3.5 rounded-xl border border-border-navy shadow-xs">
                  <span className="text-xs uppercase font-bold text-muted-grey block">Higher Take-Home Maturity</span>
                  <p className="text-base sm:text-lg font-extrabold text-emerald mt-0.5">
                    +{formatCurrency(calculations.additionalSeniorMaturity)}
                  </p>
                  <span className="text-xs text-muted-grey block mt-0.5">
                    vs Regular {interestRate}% Public FD
                  </span>
                </div>

                <div className="bg-navy-bg p-3.5 rounded-xl border border-border-navy shadow-xs col-span-2 sm:col-span-1">
                  <span className="text-xs uppercase font-bold text-muted-grey block">Senior TDS Exemption Limit</span>
                  <p className="text-base sm:text-lg font-extrabold text-cyan-400 mt-0.5">
                    ₹1,00,000 / Yr
                  </p>
                  <span className="text-xs text-muted-grey block mt-0.5">
                    vs ₹40,000 for regular savers
                  </span>
                </div>
              </div>

              {/* TDS Exemption Status Callout */}
              <div className={`p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 border ${
                calculations.seniorTdsBenefitActive
                  ? "bg-emerald/10 border-emerald/30 text-emerald-800 dark:text-emerald-300 font-semibold"
                  : calculations.isTdsExempt
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-semibold"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold"
              }`}>
                {calculations.isTdsExempt ? (
                  <CheckCircle2 size={18} className="text-emerald shrink-0" />
                ) : (
                  <ShieldAlert size={18} className="text-amber-500 shrink-0" />
                )}
                <div>
                  {calculations.seniorTdsBenefitActive ? (
                    <span>
                      <strong>Senior Citizen Tax Shelter Active:</strong> Your estimated annual interest of {formatCurrency(calculations.estAnnualInterest)} would have suffered 10% TDS under the regular ₹40,000 limit, but is <strong>100% exempt from TDS</strong> under the Senior Citizen ₹1,00,000 threshold!
                    </span>
                  ) : calculations.isTdsExempt ? (
                    <span>
                      <strong>No Bank TDS Deducted:</strong> Annual interest of {formatCurrency(calculations.estAnnualInterest)} is safely below your {formatCurrency(currentSeniorConfig.tdsThreshold)} threshold under Section 194A.
                    </span>
                  ) : (
                    <span>
                      <strong>TDS Applicable:</strong> Annual interest of {formatCurrency(calculations.estAnnualInterest)} exceeds the {formatCurrency(currentSeniorConfig.tdsThreshold)} limit. Bank will deduct 10% TDS unless Form 15H is submitted.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {scheme === "cumulative" ? (
            /* Cumulative Result Cards */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
                <span className="text-[10px] uppercase font-bold text-muted-grey block">Principal Deposited</span>
                <p className="text-lg sm:text-xl font-extrabold text-white mt-1">
                  {formatCurrency(calculations.principal)}
                </p>
                <span className="text-[9px] text-muted-grey block mt-0.5">
                  Applied: {effectiveRate}% p.a.
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
                <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Interest (Post-Tax)</span>
                <p className="text-lg sm:text-xl font-extrabold text-emerald mt-1">
                  {formatCurrency(calculations.cumulativePostTaxInterest)}
                </p>
                <span className="text-[9px] text-muted-grey block mt-0.5">
                  Gross: {formatCurrency(calculations.cumulativeInterest)}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
                <span className="text-[10px] uppercase font-bold text-muted-grey block">Maturity (Post-Tax)</span>
                <p className="text-lg sm:text-xl font-extrabold text-emerald mt-1">
                  {formatCurrency(calculations.cumulativePostTaxMaturity)}
                </p>
                <span className="text-[9px] text-muted-grey block mt-0.5">
                  Tax: -{formatCurrency(calculations.cumulativeTax)} ({taxSlab}%)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
                <span className="text-[10px] uppercase font-bold text-muted-grey block">Purchasing Power (Real)</span>
                <p className={`text-lg sm:text-xl font-extrabold mt-1 ${
                  calculations.cumulativeRealMaturity < calculations.principal ? "text-red-400" : "text-amber-500"
                }`}>
                  {formatCurrency(adjustInflation ? calculations.cumulativeRealMaturity : calculations.cumulativePostTaxMaturity)}
                </p>
                <span className={`text-[9px] font-bold block mt-0.5 ${
                  calculations.cumulativeRealCAGR < 0 ? "text-red-400" : "text-emerald"
                }`}>
                  Real CAGR: {calculations.cumulativeRealCAGR > 0 ? `+${calculations.cumulativeRealCAGR}%` : `${calculations.cumulativeRealCAGR}%`}
                </span>
              </div>
            </div>
          ) : (
            /* Non-Cumulative (Payout Plan) Result Cards */
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
                  <span className="text-[10px] uppercase font-bold text-muted-grey block">
                    {PAYOUT_FREQUENCIES[payoutFreq].label} (Net)
                  </span>
                  <p className="text-lg sm:text-xl font-extrabold text-cyan-400 mt-1">
                    {formatCurrency(calculations.periodicPayoutNet)}
                  </p>
                  <span className="text-[9px] text-muted-grey block mt-0.5">
                    Gross: {formatCurrency(calculations.periodicPayoutGross)} / period
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
                  <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Payouts Received</span>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald mt-1">
                    {formatCurrency(calculations.totalNonCumulativeInterestNet)}
                  </p>
                  <span className="text-[9px] text-muted-grey block mt-0.5">
                    Over {calculations.totalPeriods} periodic payments
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
                  <span className="text-[10px] uppercase font-bold text-muted-grey block">Principal Returned</span>
                  <p className="text-lg sm:text-xl font-extrabold text-white mt-1">
                    {formatCurrency(calculations.principal)}
                  </p>
                  <span className="text-[9px] text-muted-grey block mt-0.5">
                    100% returned at maturity
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
                  <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Cash Inflow</span>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald mt-1">
                    {formatCurrency(calculations.nonCumulativeTotalCashflow)}
                  </p>
                  <span className="text-[9px] text-muted-grey block mt-0.5">
                    Tax Deducted: -{formatCurrency(calculations.totalNonCumulativeTax)}
                  </span>
                </div>
              </div>

              {/* Special RBI Callout for Monthly Discounted Payout */}
              {payoutFreq === "monthly" && (
                <div className="p-4 rounded-xl border border-cyan-400/30 bg-cyan-400/5 text-xs text-light-grey space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Sparkles size={16} className="text-cyan-400" />
                    <span>RBI Discounted Monthly Payout Mechanics Explained</span>
                  </div>
                  <p className="leading-relaxed">
                    Under Reserve Bank of India (RBI) rules, commercial banks do not calculate monthly payouts using simple division (P × r / 12 = {formatCurrency(calculations.undiscountedSimpleMonthly)}). Instead, interest is paid out at a <strong>discounted rate of {formatCurrency(calculations.periodicPayoutGross)}/month</strong> so that the bank&apos;s effective annual payout yield does not exceed standard quarterly compounding.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="bg-navy-bg/60 p-2 rounded border border-border-navy">
                      <span className="text-muted-grey block text-[9px]">Discounted Payout (Actual)</span>
                      <strong className="text-cyan-300">{formatCurrency(calculations.discountedMonthlyPayout)}/mo</strong>
                    </div>
                    <div className="bg-navy-bg/60 p-2 rounded border border-border-navy">
                      <span className="text-muted-grey block text-[9px]">Simple Monthly (Theoretical)</span>
                      <strong className="text-muted-grey line-through">{formatCurrency(calculations.undiscountedSimpleMonthly)}/mo</strong>
                    </div>
                    <div className="bg-navy-bg/60 p-2 rounded border border-border-navy col-span-2 sm:col-span-1">
                      <span className="text-muted-grey block text-[9px]">Discount Factor</span>
                      <strong className="text-amber-400">-{formatCurrency(calculations.monthlyDiscountGap)}/mo</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ⭐ SOVEREIGN SCSS (8.2%) COMPARISON CARD FOR SENIORS */}
          {seniorCategory !== "scss" && (
            <div className="p-4 rounded-xl border border-emerald/30 bg-navy-card/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-emerald" />
                  <strong className="text-white text-xs sm:text-sm">
                    Sovereign Senior Alternative: Senior Citizen Savings Scheme (SCSS) @ 8.20% p.a.
                  </strong>
                </div>
                <p className="text-[11px] text-muted-grey">
                  Government-backed 8.2% fixed quarterly payout with zero default risk up to ₹30 Lakh. SCSS earns {formatCurrency(calculations.scssPostTaxMaturity)} ({calculations.scssAdvantage >= 0 ? `+${formatCurrency(calculations.scssAdvantage)} more` : `${formatCurrency(Math.abs(calculations.scssAdvantage))} less`}) over {totalTenureYears.toFixed(1)} years.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSeniorCategory("scss")}
                  className="text-xs font-bold text-navy-bg bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Apply 8.20% SCSS
                </button>
                <Link
                  href="/scss"
                  className="text-xs font-bold text-emerald border border-emerald/30 bg-emerald/10 hover:bg-emerald/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                >
                  Full SCSS Page <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* Alert Banner for Real Purchasing Power */}
          {adjustInflation && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              calculations.cumulativeRealCAGR < 0
                ? "bg-red-500/5 border-red-500/20 text-red-300"
                : "bg-emerald/5 border-emerald/20 text-emerald-300"
            }`}>
              {calculations.cumulativeRealCAGR < 0 ? (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <strong className="text-red-300 font-bold">Negative Real Return Warning: </strong>
                    After accounting for your {taxSlab}% income tax slab (yielding {calculations.cumulativePostTaxCAGR}% net) and {inflation}% annual inflation, your deposit is eroding purchasing power at <strong>{Math.abs(calculations.cumulativeRealCAGR)}% annually</strong>. In real terms, your ₹{formatCurrency(depositAmount)} will only buy what ₹{formatCurrency(calculations.cumulativeRealMaturity)} buys today.
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <ShieldCheck className="text-emerald shrink-0 mt-0.5" size={16} />
                  <div>
                    <strong className="text-emerald font-bold">Inflation Beat: </strong>
                    With a {taxSlab}% tax bracket, your post-tax return of {calculations.cumulativePostTaxCAGR}% p.a. outpaces inflation ({inflation}%) by <strong>+{calculations.cumulativeRealCAGR}% annually</strong> in real purchasing power.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chart Display */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {scheme === "cumulative"
                  ? `Fixed Deposit Growth Pathway (${COMPOUNDING_PERIODS[calculations.effectiveCompounding].label})`
                  : `Income Stream & Capital Inflow (${PAYOUT_FREQUENCIES[payoutFreq].label})`}
              </h3>
              <span className="text-[10px] text-muted-grey bg-navy-bg px-2 py-0.5 border border-border-navy rounded font-mono">
                {totalTenureYears.toFixed(1)} Yr Horizon
              </span>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 15, left: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fdColorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fdColorPostTax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fdColorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    width={75}
                    tickFormatter={(val) =>
                      `₹${val >= 10000000 ? `${(val / 10000000).toFixed(1)}Cr` : val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${(val / 1000).toFixed(0)}K`}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#081c3a",
                      borderColor: "#112d55",
                      borderRadius: "8px",
                      color: "#f1f5f9"
                    }}
                    formatter={(v: any) => [formatCurrency(v), ""]}
                  />
                  <Legend iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey={scheme === "cumulative" ? "Gross Maturity" : "Total Inflow (Principal + Payouts)"}
                    stroke="#38bdf8"
                    fillOpacity={1}
                    fill="url(#fdColorGross)"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey={scheme === "cumulative" ? "Post-Tax Maturity" : "Cumulative Payouts (Post-Tax)"}
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#fdColorPostTax)"
                    strokeWidth={2}
                  />
                  {adjustInflation && (
                    <Area
                      type="monotone"
                      dataKey={scheme === "cumulative" ? "Inflation Adjusted (Real)" : "Inflation Adjusted Value"}
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#fdColorReal)"
                      strokeWidth={2}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="Principal Deposited"
                    stroke="#64748b"
                    fill="none"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 📊 Impact of Compounding Frequency on Deposit Value */}
          <div className="p-4 sm:p-6 rounded-2xl border border-border-navy bg-navy-card/35 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-emerald" />
                  <span>Impact of Compounding Frequency on ₹{depositAmount.toLocaleString("en-IN")}</span>
                </h3>
                <p className="text-[11px] text-muted-grey mt-0.5">
                  Comparing compounding frequencies over {totalTenureYears.toFixed(1)} years at {effectiveRate}% p.a. ({currentSeniorConfig.label}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompoundingComparison(!showCompoundingComparison)}
                className="text-xs font-bold text-emerald hover:underline cursor-pointer"
              >
                {showCompoundingComparison ? "Collapse Table" : "Expand Table"}
              </button>
            </div>

            {showCompoundingComparison && (
              <div className="overflow-x-auto pt-1 animate-fadeIn space-y-3">
                <table className="w-full text-[11px] text-left border-collapse border border-border-navy/80">
                  <thead>
                    <tr className="bg-navy-bg/90 text-muted-grey uppercase text-[9px] font-mono">
                      <th className="border border-border-navy/80 p-2.5">Compounding Period</th>
                      <th className="border border-border-navy/80 p-2.5">Principal</th>
                      <th className="border border-border-navy/80 p-2.5">Interest Rate</th>
                      <th className="border border-border-navy/80 p-2.5">Effective Yield (APY)</th>
                      <th className="border border-border-navy/80 p-2.5">Total Interest Earned</th>
                      <th className="border border-border-navy/80 p-2.5">Final Maturity Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.frequencyComparison.map((row, idx) => {
                      const isStd = row.periods === 4;
                      return (
                        <tr
                          key={idx}
                          className={`transition-colors ${
                            isStd ? "bg-emerald/10 hover:bg-emerald/15 font-semibold" : "hover:bg-navy-light/20"
                          }`}
                        >
                          <td className="border border-border-navy/80 p-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-medium">{row.frequency}</span>
                              {isStd && (
                                <span className="text-[8px] bg-emerald text-navy-bg font-extrabold px-1.5 py-0.5 rounded">
                                  Standard
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border border-border-navy/80 p-2.5 font-mono text-muted-grey">
                            {formatCurrency(depositAmount)}
                          </td>
                          <td className="border border-border-navy/80 p-2.5 font-mono text-white">
                            {effectiveRate}%
                          </td>
                          <td className="border border-border-navy/80 p-2.5 font-mono text-cyan-400">
                            {row.apy}%
                          </td>
                          <td className="border border-border-navy/80 p-2.5 font-mono text-emerald font-bold">
                            {formatCurrency(row.interest)}
                          </td>
                          <td className="border border-border-navy/80 p-2.5 font-mono text-white font-extrabold">
                            {formatCurrency(row.maturity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Regulatory Note directly matching RBI Standards */}
                <div className="p-3 rounded-xl bg-navy-bg/50 border border-border-navy/60 text-[10px] text-muted-grey leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Info size={12} className="text-emerald" />
                    <span>RBI Compounding Standard Note:</span>
                  </div>
                  <p>
                    Under Reserve Bank of India (RBI) guidelines, interest on cumulative term deposits across all commercial banks (SBI, HDFC, ICICI, PNB, etc.) is calculated and added back to principal <strong>four times a year (quarterly)</strong>. Certain Non-Banking Financial Companies (NBFCs) or corporate FDs may explicitly offer true monthly or annual compounding, but commercial banks strictly adhere to the quarterly regulatory standard.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Toggleable Year-by-Year Growth Table */}
          <div className="p-4 sm:p-6 rounded-2xl border border-border-navy bg-navy-card/35 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald" />
                <span>Year-by-Year Amortization Schedule</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowTable(!showTable)}
                className="text-xs font-bold text-emerald hover:underline cursor-pointer"
              >
                {showTable ? "Hide Schedule" : "Show Schedule"}
              </button>
            </div>

            {showTable && (
              <div className="overflow-x-auto pt-2 animate-fadeIn">
                <table className="w-full text-[11px] text-left border-collapse border border-border-navy/80">
                  <thead>
                    <tr className="bg-navy-bg/80 text-muted-grey uppercase text-[9px] font-mono">
                      <th className="border border-border-navy/80 p-2">Tenure</th>
                      <th className="border border-border-navy/80 p-2">
                        {scheme === "cumulative" ? "Gross Balance" : "Gross Cumulative Inflow"}
                      </th>
                      <th className="border border-border-navy/80 p-2">
                        {scheme === "cumulative" ? "Cumulative Interest" : "Cumulative Interest Paid"}
                      </th>
                      <th className="border border-border-navy/80 p-2">TDS / Tax ({taxSlab}%)</th>
                      <th className="border border-border-navy/80 p-2">
                        {scheme === "cumulative" ? "Post-Tax Maturity" : "Net Total Cashflow"}
                      </th>
                      <th className="border border-border-navy/80 p-2">Real Value ({inflation}% Inf)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.yearlyBreakdown.map((row) => (
                      <tr key={row.year} className="hover:bg-navy-light/20 transition-colors">
                        <td className="border border-border-navy/80 p-2 font-mono font-bold text-white">Year {row.year}</td>
                        <td className="border border-border-navy/80 p-2 text-sky-400 font-mono">{formatCurrency(row.gross)}</td>
                        <td className="border border-border-navy/80 p-2 text-emerald font-mono">+{formatCurrency(row.interest)}</td>
                        <td className="border border-border-navy/80 p-2 text-red-400 font-mono">-{formatCurrency(row.tax)}</td>
                        <td className="border border-border-navy/80 p-2 text-white font-mono font-semibold">{formatCurrency(row.net)}</td>
                        <td className="border border-border-navy/80 p-2 text-amber-400 font-mono">{formatCurrency(row.real)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Manual & Mathematical Audit */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <button
              onClick={() => setShowAudit(!showAudit)}
              className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="text-emerald" size={18} />
                <span>User Manual: Senior Citizen Tax Benefits, SCSS Sovereign Rules &amp; Excel Formulas</span>
              </span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
            </button>

            {showAudit && (
              <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Senior Benefits */}
                  <div className="space-y-2 p-3.5 rounded-xl border border-border-navy bg-navy-bg/50">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <Award size={16} className="text-amber-400" />
                      <span>Senior Citizen Benefits &amp; Higher TDS Threshold</span>
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-[11px]">
                      <li>
                        <strong>Standard Premium (+0.50%):</strong> Most Indian commercial banks grant an extra 50 basis points over regular card rates for all tenures.
                      </li>
                      <li>
                        <strong>Special Scheme Additions (+0.75% to +1.00%):</strong> Schemes like SBI We-Care or HDFC Senior Care offer up to 100 bps extra on 3-to-5 year deposits.
                      </li>
                      <li>
                        <strong>Super Senior Citizens (Age 80+):</strong> Banks like Bank of India, PNB, and Central Bank pay an additional 0.15% to 0.25% on top of senior rates.
                      </li>
                      <li>
                        <strong>Higher TDS Limit (₹1,00,000 vs ₹40,000):</strong> Under Section 194A, banks will not deduct TDS for senior citizens unless total annual FD interest crosses ₹1,00,000 (compared to ₹40,000 for regular individuals).
                      </li>
                      <li>
                        <strong>Section 80TTB Deduction:</strong> Under the Old Tax Regime, senior citizens can claim a direct deduction of up to <strong>₹50,000</strong> on interest income from banks and post offices.
                      </li>
                    </ul>
                  </div>

                  {/* Sovereign SCSS */}
                  <div className="space-y-2 p-3.5 rounded-xl border border-border-navy bg-navy-bg/50">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <Building size={16} className="text-emerald" />
                      <span>Government SCSS Scheme (8.20%)</span>
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-[11px]">
                      <li>
                        <strong>Fixed 8.20% p.a. Sovereign Rate:</strong> Backed 100% by the Government of India with zero credit or default risk.
                      </li>
                      <li>
                        <strong>Tenure:</strong> 5-year initial tenure, extendable by an additional 3 years in blocks.
                      </li>
                      <li>
                        <strong>Deposit Limit:</strong> Up to <strong>₹30 Lakhs</strong> per individual (or ₹60 Lakhs jointly with spouse).
                      </li>
                      <li>
                        <strong>Guaranteed Income:</strong> Interest is paid out automatically every quarter on the first day of April, July, October, and January.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Mathematical Formulas */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Mathematical Audit &amp; Compounding Formulas</h4>
                  <div className="bg-navy-bg/60 p-3 rounded-xl space-y-2 font-mono text-[11px]">
                    <p>
                      <strong>1. Quarterly Compounding (RBI Standard):</strong>
                      <br />
                      A = P &times; (1 + r / 4)^(4 &times; t)
                      <br />
                      <span className="text-[10px] text-muted-grey">where P = principal, r = effective annual rate (including senior premium), t = tenure in years.</span>
                    </p>
                    <p>
                      <strong>2. Discounted Monthly Payout (Non-Cumulative):</strong>
                      <br />
                      MonthlyPayout = P &times; ((1 + r / 4)^(1/3) - 1)
                      <br />
                      <span className="text-[10px] text-muted-grey">ensures (1 + MonthlyPayout/P)^3 = 1 + r/4 (matching quarterly yield).</span>
                    </p>
                    <p>
                      <strong>3. Short-Term FD (&lt; 181 Days Simple Interest):</strong>
                      <br />
                      Interest = P &times; r &times; (Days / 365)
                    </p>
                  </div>
                </div>

                {/* Excel Replication Audit */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel / Google Sheets Audit Formulas</h4>
                  <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                    <thead>
                      <tr className="bg-navy-bg/60">
                        <th className="border border-border-navy/80 p-2 text-left">Metric</th>
                        <th className="border border-border-navy/80 p-2 text-left">Excel / Google Sheets Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Quarterly Gross Maturity</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=-FV({effectiveRate}%/4, {totalTenureYears.toFixed(2)}*4, 0, {depositAmount})</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Discounted Monthly Payout</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">={depositAmount} * ((1 + {effectiveRate}%/4)^(1/3) - 1)</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Post-Tax Cumulative Maturity</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">={depositAmount} + (-FV({effectiveRate}%/4, {totalTenureYears.toFixed(2)}*4, 0, {depositAmount}) - {depositAmount}) * (1 - {taxSlab}%)</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Real Purchasing Power</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=PostTaxMaturity / (1 + {inflation}%)^{totalTenureYears.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald/20 bg-emerald/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs text-light-grey">
                    <strong className="text-white">Curious about Equity Compounding?</strong> See why Index Mutual Funds beat Fixed Deposits by 3x-5x over long horizons.
                  </div>
                  <Link
                    href="/sip-vs-fd"
                    className="shrink-0 text-xs font-bold text-emerald underline flex items-center gap-1"
                  >
                    Open SIP vs FD Comparison <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
