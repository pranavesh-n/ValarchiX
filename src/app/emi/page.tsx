"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Info, HelpCircle, Calculator, AlertTriangle, ShieldCheck, ChevronDown, Landmark, ArrowUpRight } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function LoanEmiCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [amount, setAmount] = useState(5000000); // 50L Default
  const [rate, setRate] = useState(8.5); // 8.5% default home loan rate
  const [years, setYears] = useState(20); // 20 years default
  const [prepaymentType, setPrepaymentType] = useState<"none" | "monthly" | "annual">("none");
  const [prepaymentValue, setPrepaymentValue] = useState(10000); // ₹10,000 monthly or ₹1,00,000 annual
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // Sensible default values when prepayment type changes
  const handlePrepaymentTypeChange = (type: "none" | "monthly" | "annual") => {
    setPrepaymentType(type);
    if (type === "monthly") {
      setPrepaymentValue(5000); // default ₹5k extra per month
    } else if (type === "annual") {
      setPrepaymentValue(100000); // default ₹1L extra per year
    } else {
      setPrepaymentValue(0);
    }
  };

  // Run month-by-month loan amortization simulation
  const calculations = useMemo(() => {
    const r = rate / 100;
    const monthlyRate = r / 12;
    const totalMonths = years * 12;
    const infRate = inflation / 100;
    const monthlyInfRate = infRate / 12;

    // Calculate monthly EMI
    let standardEmi = 0;
    if (monthlyRate > 0) {
      standardEmi = Math.round(
        amount * 
        (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      );
    } else {
      standardEmi = Math.round(amount / totalMonths);
    }

    const chartData = [];
    let standardBalance = amount;
    let standardTotalInterest = 0;
    let nominalStandardPaidTotal = 0;
    let realStandardPaidTotal = 0;
    
    let prepaidBalance = amount;
    let prepaidTotalInterest = 0;
    let nominalPrepaidPaidTotal = 0;
    let realPrepaidPaidTotal = 0;
    let monthsToPayOff = 0;
    let prepaidClosed = false;

    // Simulate standard schedule
    for (let m = 1; m <= totalMonths; m++) {
      if (standardBalance > 0) {
        const interest = standardBalance * monthlyRate;
        const principal = (m === totalMonths) ? standardBalance : Math.min(standardEmi - interest, standardBalance);
        const paidThisMonth = principal + interest;
        standardBalance = Math.max(0, standardBalance - principal);
        standardTotalInterest += interest;
        nominalStandardPaidTotal += paidThisMonth;
        realStandardPaidTotal += paidThisMonth / Math.pow(1 + monthlyInfRate, m);
      }
    }

    // Reset standard balance to walk through comparison in a single loop for the chart
    standardBalance = amount;

    // Month-by-month simulation
    for (let m = 1; m <= totalMonths; m++) {
      // 1. Standard outstanding balance trackers
      let currentStandardBal = 0;
      if (standardBalance > 0) {
        const interest = standardBalance * monthlyRate;
        const principal = (m === totalMonths) ? standardBalance : Math.min(standardEmi - interest, standardBalance);
        standardBalance = Math.max(0, standardBalance - principal);
        currentStandardBal = standardBalance;
      }

      // 2. Prepaid outstanding balance trackers
      let currentPrepaidBal = 0;
      if (prepaidBalance > 0 && !prepaidClosed) {
        const interest = prepaidBalance * monthlyRate;
        const principal = Math.min(standardEmi - interest, prepaidBalance);
        let actualExtra = 0;
        
        prepaidBalance = Math.max(0, prepaidBalance - principal);
        prepaidTotalInterest += interest;

        // Apply extra prepayment if scheduled
        let extraAmount = 0;
        if (prepaymentType === "monthly") {
          extraAmount = prepaymentValue;
        } else if (prepaymentType === "annual" && m % 12 === 0) {
          extraAmount = prepaymentValue;
        }

        if (extraAmount > 0 && prepaidBalance > 0) {
          actualExtra = Math.min(extraAmount, prepaidBalance);
          prepaidBalance = Math.max(0, prepaidBalance - actualExtra);
        }

        const paidThisMonth = principal + interest + actualExtra;
        nominalPrepaidPaidTotal += paidThisMonth;
        realPrepaidPaidTotal += paidThisMonth / Math.pow(1 + monthlyInfRate, m);

        if (prepaidBalance <= 0) {
          monthsToPayOff = m;
          prepaidClosed = true;
        }
        currentPrepaidBal = prepaidBalance;
      } else {
        currentPrepaidBal = 0;
      }

      // Record year-end data points or final closure month for the chart
      if (m % 12 === 0 || m === totalMonths || (prepaidClosed && m === monthsToPayOff && m % 12 !== 0)) {
        const yearNum = Math.ceil(m / 12);
        chartData.push({
          year: `Yr ${yearNum}`,
          "Standard Balance": Math.round(adjustInflation ? (currentStandardBal / Math.pow(1 + infRate, yearNum)) : currentStandardBal),
          "Prepaid Balance": Math.round(adjustInflation ? (currentPrepaidBal / Math.pow(1 + infRate, yearNum)) : currentPrepaidBal),
        });
      }
    }

    if (!prepaidClosed) {
      monthsToPayOff = totalMonths;
    }

    const interestSaved = Math.max(0, standardTotalInterest - prepaidTotalInterest);
    const tenureSavedMonths = totalMonths - monthsToPayOff;
    const tenureSavedYears = (tenureSavedMonths / 12).toFixed(1);

    return {
      standardEmi,
      standardTotalInterest: Math.round(standardTotalInterest),
      prepaidTotalInterest: Math.round(prepaidTotalInterest),
      interestSaved: Math.round(interestSaved),
      tenureSavedMonths,
      tenureSavedYears,
      monthsToPayOff,
      chartData,
      realStandardPaidTotal: Math.round(realStandardPaidTotal),
      realPrepaidPaidTotal: Math.round(realPrepaidPaidTotal),
      nominalStandardPaidTotal: Math.round(nominalStandardPaidTotal),
      nominalPrepaidPaidTotal: Math.round(nominalPrepaidPaidTotal),
    };
  }, [amount, rate, years, prepaymentType, prepaymentValue, inflation, adjustInflation]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 animate-fadeIn max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-navy pb-4 sm:pb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight flex items-center gap-2">
            <Calculator className="text-emerald shrink-0" />
            <span>Loan EMI & Prepayment Accelerator</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-grey mt-1">
            Calculate your monthly equative installments and simulate how extra monthly or yearly prepayments dramatically slash interest payable and loan tenure.
          </p>
        </div>
        <div className="hidden sm:block text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg shrink-0">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Sliders and Controls */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-4 sm:space-y-5 shadow-xl">
            <h2 className="text-base sm:text-lg font-bold text-heading">Loan Parameters</h2>

            {/* Principal Loan Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Principal Amount</span>
                <NumericInput
                  value={amount}
                  onChange={setAmount}
                  min={10000}
                  max={100000000}
                  step={50000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={100000}
                max={20000000} // 2 Crore limit on slider
                step={100000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹1L</span>
                <span>₹2Cr</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Interest Rate (p.a.)</span>
                <NumericInput
                  value={rate}
                  onChange={setRate}
                  min={1}
                  max={30}
                  step={0.05}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={5}
                max={18}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>5%</span>
                <span>18%</span>
              </div>
            </div>

            {/* Tenure Years */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Loan Tenure</span>
                <NumericInput
                  value={years}
                  onChange={setYears}
                  min={1}
                  max={30}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>1 Yr</span>
                <span>30 Yrs</span>
              </div>
            </div>

            {/* Prepayment Type Toggle */}
            <div className="space-y-2 border-t border-border-navy/60 pt-4">
              <label className="text-xs font-semibold text-muted-grey block">Prepayment Mode</label>
              <div className="flex bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => handlePrepaymentTypeChange("none")}
                  className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
                    prepaymentType === "none" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                  }`}
                >
                  No Prepayment
                </button>
                <button
                  type="button"
                  onClick={() => handlePrepaymentTypeChange("monthly")}
                  className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
                    prepaymentType === "monthly" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                  }`}
                >
                  Monthly Extra
                </button>
                <button
                  type="button"
                  onClick={() => handlePrepaymentTypeChange("annual")}
                  className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
                    prepaymentType === "annual" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                  }`}
                >
                  Annual Extra
                </button>
              </div>
            </div>

            {/* Prepayment Value */}
            {prepaymentType !== "none" && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">
                    {prepaymentType === "monthly" ? "Monthly Extra Amount" : "Annual Extra Amount"}
                  </span>
                  <NumericInput
                    value={prepaymentValue}
                    onChange={setPrepaymentValue}
                    min={100}
                    max={50000000}
                    step={500}
                    type="currency"
                  />
                </div>
                <input
                  type="range"
                  min={prepaymentType === "monthly" ? 500 : 5000}
                  max={prepaymentType === "monthly" ? 50000 : 500000}
                  step={prepaymentType === "monthly" ? 500 : 5000}
                  value={prepaymentValue}
                  onChange={(e) => setPrepaymentValue(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Inflation Toggle */}
            <div className="space-y-2 border-t border-border-navy/60 pt-4 flex items-center justify-between">
              <label htmlFor="adjust-inflation" className="text-xs font-semibold text-muted-grey cursor-pointer flex items-center gap-1">
                Adjust for Inflation
                <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces future outstanding balances and payments by the inflation rate to show real purchasing power over time."><HelpCircle size={12} /></span>
              </label>
              <input
                id="adjust-inflation"
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
                className="w-4 h-4 accent-emerald cursor-pointer rounded"
              />
            </div>

            {adjustInflation && (
              <div className="space-y-2 border-t border-border-navy/60 pt-4 animate-fadeIn">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Expected Inflation Rate</span>
                  <NumericInput value={inflation} onChange={setInflation} min={0} max={25} step={0.1} type="percent" />
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={0.1}
                  value={inflation}
                  onChange={(e) => setInflation(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-grey">
                  <span>2%</span>
                  <span>15%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInflation(rates.inflationRate)}
                  className="text-[9px] text-left text-emerald/80 hover:text-emerald block mt-1 hover:underline cursor-pointer"
                >
                  CPI Inflation Baseline ({rates.inflationRate}%)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results and Visual Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Equated Monthly EMI</span>
              <p className="text-xl font-bold text-white mt-1">
                {formatCurrency(calculations.standardEmi)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                Original Tenure: {years} Yrs
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Interest Saved</span>
              <p className="text-xl font-bold text-emerald mt-1">
                {formatCurrency(calculations.interestSaved)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                Prepaid Total Int.: {formatCurrency(calculations.prepaidTotalInterest)}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-emerald block">Tenure Shaved Off</span>
              <p className="text-xl font-bold text-emerald glow-emerald mt-1">
                {calculations.tenureSavedYears} Years
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                New Tenure: {(calculations.monthsToPayOff / 12).toFixed(1)} Yrs ({calculations.monthsToPayOff} Months)
              </span>
            </div>
          </div>

          {/* Chart Display */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Amortization Path: Standard vs. Prepaid Loan Balance {adjustInflation ? "(Adjusted for Inflation)" : "(Nominal)"}
              </h3>
              <span className="text-[10px] text-muted-grey bg-navy-bg px-2 py-0.5 border border-border-navy rounded font-mono">
                {years} Yr Timeline
              </span>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 15, left: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorStandardBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPrepaidBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    width={75}
                    tickFormatter={(val) => `₹${val >= 10000000 ? `${(val/10000000).toFixed(1)}Cr` : val >= 100000 ? `${(val/100000).toFixed(1)}L` : `${val/1000}K`}`}
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
                    name="Standard Balance"
                    dataKey="Standard Balance"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorStandardBal)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    name="Prepaid Balance"
                    dataKey="Prepaid Balance"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorPrepaidBal)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Real Cost of Loan Card */}
          {adjustInflation && (
            <div className="p-5 rounded-2xl border border-emerald/20 bg-emerald/5 space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-emerald uppercase tracking-wider">
                The Inflation Discount: Nominal vs. Real Repayment
              </h4>
              <p className="text-xs text-muted-grey leading-relaxed">
                Because of inflation, a fixed EMI payment shrinks in real purchasing power over time. While you pay a total of <strong className="text-white">{formatCurrency(calculations.nominalStandardPaidTotal)}</strong> in nominal cash to the bank, the real economic burden in today's purchasing power is only <strong className="text-emerald">{formatCurrency(calculations.realStandardPaidTotal)}</strong>.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-navy/40 text-xs">
                <div>
                  <span className="text-[10px] text-muted-grey block uppercase font-bold">Standard Real Cost</span>
                  <p className="text-base font-bold text-white mt-0.5">{formatCurrency(calculations.realStandardPaidTotal)}</p>
                  <span className="text-[9px] text-muted-grey">Nominal: {formatCurrency(calculations.nominalStandardPaidTotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-grey block uppercase font-bold">Prepaid Real Cost</span>
                  <p className="text-base font-bold text-emerald mt-0.5">{formatCurrency(calculations.realPrepaidPaidTotal)}</p>
                  <span className="text-[9px] text-muted-grey">Nominal: {formatCurrency(calculations.nominalPrepaidPaidTotal)}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-grey italic mt-1">
                💡 Lesson: Inflation works in favor of the borrower! A ₹{calculations.standardEmi.toLocaleString("en-IN")} EMI paid {years} years from now feels like only ₹{Math.round(calculations.standardEmi / Math.pow(1 + inflation/100, years)).toLocaleString("en-IN")} in today's purchasing power.
              </p>
            </div>
          )}

          {/* Educational Concept Section */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Info className="text-emerald" size={18} />
              Educational Concept: The Prepayment Acceleration Engine
            </h3>

            <div className="text-xs text-muted-grey leading-relaxed space-y-4 border-t border-border-navy/60 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <Landmark size={14} className="text-blue-400" />
                    How Bank Loans Are Amortized
                  </h4>
                  <p>
                    Retail loans (like home or car loans) are structured on a **reducing-balance interest model**. In the initial years, because the outstanding principal balance is high, a major chunk (e.g. 70-80%) of your monthly EMI is eaten up by interest accrued, leaving very little to pay off the actual principal.
                  </p>
                  <p className="text-[11px] text-muted-grey/80">
                    <strong>For Example:</strong> On a ₹50L loan at 8.5% for 20 years, your month 1 interest is ₹35,417, and principal payment is only ₹7,974. It takes almost 10-12 years for the principal component to cross the interest component in your monthly payment.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <ArrowUpRight size={14} className="text-emerald" />
                    Why Early Prepayments Work Wonders
                  </h4>
                  <p>
                    Every rupee you prepay on a loan goes **100% directly towards reducing your outstanding principal balance**, bypassing interest entirely. 
                  </p>
                  <p className="text-[11px] text-muted-grey/80">
                    <strong>Compound Interest in Reverse:</strong> By shrinking the principal early on, you prevent interest from compounding on that chunk for all the remaining years. Prepaying just 1 extra EMI per year can shave off 3-4 years from a 20-year home loan, saving you several lakhs in interest expenses!
                  </p>
                </div>
              </div>

              <div className="bg-emerald/5 border border-emerald/20 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-[13px] flex items-center gap-1">
                  <ShieldCheck className="text-emerald" size={16} />
                  Amortization Prepayment Golden Rules:
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 mt-1 text-[11px] text-muted-grey">
                  <li><strong>The Timing Rule:</strong> Prepaying ₹1 Lakh in Year 2 of a loan saves almost 3x more interest than prepaying ₹1 Lakh in Year 15. The earlier you prepay, the more tenure you shave off.</li>
                  <li><strong>No Foreclosure Charges:</strong> Under RBI regulations, banks are prohibited from charging foreclosure penalties or prepayment fees on floating-rate individual term loans (like Home Loans). Check your terms!</li>
                  <li><strong>Liabilities vs. Opportunities:</strong> Before prepaying a loan costing 8.5% interest, ensure you compare it against investing that surplus in assets yielding higher historical yields (e.g. Equity Index at 12%).</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Mathematical Audit & Sheet Replication */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <button 
              onClick={() => setShowAudit(!showAudit)} 
              className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="text-emerald" size={18} />
                How This is Calculated & Excel Replication
              </span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
            </button>
            
            {showAudit && (
              <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Mathematical Model</h4>
                  <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                    <p>
                      Let monthly interest rate i = Rate / 12 / 100
                      <br />
                      Total number of months n = Years * 12
                    </p>
                    <p>
                      <strong>Standard Monthly EMI Calculation:</strong>
                      <br />
                      EMI = Principal * [ i * (1 + i)^n ] / [ (1 + i)^n - 1 ]
                    </p>
                    <p>
                      For each month m = 1 to n:
                      <br />
                      &bull; Interest Accrued: Interest_m = Balance_m-1 * i
                      <br />
                      &bull; Standard Principal Component: Principal_m = min(EMI - Interest_m, Balance_m-1)
                      <br />
                      &bull; Prepayment: Extra_m (depends on prepayment schedule)
                      <br />
                      &bull; New Ending Balance: Balance_m = Balance_m-1 - Principal_m - Extra_m
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel / Google Sheets Replication Formulas</h4>
                  <p>In Excel, you can replicate the standard EMI and interest using the following formulas:</p>
                  <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                    <thead>
                      <tr className="bg-navy-bg/60">
                        <th className="border border-border-navy/80 p-2 text-left">Metric</th>
                        <th className="border border-border-navy/80 p-2 text-left">Excel Formula</th>
                        <th className="border border-border-navy/80 p-2 text-left">Variables Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Monthly Standard EMI</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=PMT({rate}%/12, {years}*12, -{amount})</td>
                        <td className="border border-border-navy/80 p-2">PMT(rate, nper, pv)</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">First Month Interest Component</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=IPMT({rate}%/12, 1, {years}*12, -{amount})</td>
                        <td className="border border-border-navy/80 p-2">IPMT(rate, per, nper, pv)</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">First Month Principal Component</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=PPMT({rate}%/12, 1, {years}*12, -{amount})</td>
                        <td className="border border-border-navy/80 p-2">PPMT(rate, per, nper, pv)</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-muted-grey mt-2">
                    To model prepayments, set up a row-by-row amortization schedule in Excel. Columns should represent: Month, Beginning Balance, Interest accrued, Standard Principal, Extra Prepayment, and Ending Balance. Use `=min(EMI - Interest, Beginning_Balance)` for standard principal, and subtract both standard principal and extra prepayment from the beginning balance to calculate the ending balance.
                  </p>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This tool is for training purposes only and represents a mathematical loan compound interest reducing-balance simulator. It does not provide commercial banking or legal financial advice.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
