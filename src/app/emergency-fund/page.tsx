"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { HelpCircle, ShieldCheck, ChevronDown, Landmark, Shield, AlertTriangle, HeartPulse, Briefcase, Wrench, Plane, Activity, CheckCircle2, XCircle } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function EmergencyFundCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [essential, setEssential] = useState(35000);        // rent, food, bills
  const [discretionary, setDiscretionary] = useState(15000); // lifestyle, shopping
  const [debt, setDebt] = useState(10000);                   // EMIs, premiums
  const [targetMonths, setTargetMonths] = useState(6);       // 3 = minimum, 6 = ideal
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [projectionYears, setProjectionYears] = useState(3);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  // Financial Essentials & Readiness Checklist
  const [annualIncome, setAnnualIncome] = useState(1200000);
  const [termInsuranceCover, setTermInsuranceCover] = useState(15000000);
  const [healthInsuranceCover, setHealthInsuranceCover] = useState(1000000);
  const [monthlyInvestments, setMonthlyInvestments] = useState(25000);

  const calculations = useMemo(() => {
    const totalMonthlyExpense = essential + discretionary + debt;
    const minCorpus = totalMonthlyExpense * 3;
    const idealCorpus = totalMonthlyExpense * 6;
    const targetCorpus = totalMonthlyExpense * targetMonths;

    const inf = inflation / 100;
    const futureTargetCorpus = adjustInflation ? Math.round(targetCorpus * Math.pow(1 + inf, projectionYears)) : targetCorpus;
    const futureMinCorpus = adjustInflation ? Math.round(minCorpus * Math.pow(1 + inf, projectionYears)) : minCorpus;
    const futureIdealCorpus = adjustInflation ? Math.round(idealCorpus * Math.pow(1 + inf, projectionYears)) : idealCorpus;

    const safeReturn = 0.06;
    const r = safeReturn / 12;
    const n = projectionYears * 12;
    const monthlySavingsNeeded = (adjustInflation && n > 0)
      ? Math.round((futureTargetCorpus * r) / (Math.pow(1 + r, n) - 1))
      : Math.round(targetCorpus / (n > 0 ? n : 12));

    const cashAllocation = Math.round(futureTargetCorpus * 0.20);
    const liquidFundAllocation = Math.round(futureTargetCorpus * 0.80);

    const pieData = [
      { name: "Savings Account (20%)", value: cashAllocation, color: "#3b82f6" },
      { name: "Sweep FD & Liquid Funds (80%)", value: liquidFundAllocation, color: "#22c55e" }
    ];

    // Financial Readiness Essentials Diagnostic (0 - 100 Score)
    // 1. Emergency Fund Score (25 pts max)
    const emScore = Math.min(25, Math.round((targetMonths / 6) * 25));

    // 2. Term Life Insurance Score (25 pts max) — target 10x to 15x annual income
    const targetTerm = annualIncome * 12;
    const termRatio = targetTerm > 0 ? termInsuranceCover / targetTerm : 0;
    const termScore = Math.min(25, Math.round(termRatio * 25));

    // 3. Health Insurance Score (25 pts max) — target >= 10 Lakhs base+topup
    const healthScore = Math.min(25, Math.round((healthInsuranceCover / 1000000) * 25));

    // 4. Savings & Investment Rate Score (25 pts max) — target >= 20% of net monthly income
    const monthlyNetIncome = annualIncome / 12;
    const savingsRatio = monthlyNetIncome > 0 ? monthlyInvestments / monthlyNetIncome : 0;
    const savingsScore = Math.min(25, Math.round((savingsRatio / 0.25) * 25));

    const overallReadinessScore = emScore + termScore + healthScore + savingsScore;

    return {
      totalMonthlyExpense,
      targetCorpus,
      minCorpus,
      idealCorpus,
      futureTargetCorpus,
      futureMinCorpus,
      futureIdealCorpus,
      monthlySavingsNeeded,
      cashAllocation,
      liquidFundAllocation,
      pieData,
      emScore,
      termScore,
      healthScore,
      savingsScore,
      overallReadinessScore,
      savingsRatioPct: Math.round(savingsRatio * 100)
    };
  }, [essential, discretionary, debt, targetMonths, inflation, adjustInflation, projectionYears, annualIncome, termInsuranceCover, healthInsuranceCover, monthlyInvestments]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 animate-fadeIn text-light-grey">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="text-emerald" />
            Emergency Fund & Financial Essentials Planner
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Build your household safety net (3–12 months of expenses) and evaluate your 4 Financial Essentials score.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      {/* Financial Readiness Score Banner (FinBoom Style) */}
      <div className="p-6 rounded-2xl border border-emerald/30 bg-emerald/5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald flex items-center gap-1.5">
              <Activity size={16} /> Financial Essentials Health Readiness Score
            </span>
            <p className="text-sm text-muted-grey mt-0.5">
              Evaluates your 4 pillars: Emergency Reserve, Term Life Cover, Health Insurance, and Monthly Savings Rate.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-4xl font-black text-white">{calculations.overallReadinessScore}</span>
              <span className="text-xs text-muted-grey"> / 100</span>
            </div>
            <div className={`px-3 py-1 rounded-lg text-xs font-extrabold ${calculations.overallReadinessScore >= 80 ? "bg-emerald text-navy-bg" : calculations.overallReadinessScore >= 60 ? "bg-amber-500 text-navy-bg" : "bg-red-500 text-white"}`}>
              {calculations.overallReadinessScore >= 80 ? "Fully Prepared" : calculations.overallReadinessScore >= 60 ? "Moderate Buffer" : "Needs Immediate Coverage"}
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Pillar 1: Emergency Reserve */}
          <div className="p-3 bg-navy-bg/80 border border-border-navy/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white">Emergency Reserve</span>
              <span className="text-emerald">{calculations.emScore}/25 pts</span>
            </div>
            <p className="text-[10px] text-muted-grey">{targetMonths} Months of Expenses ({formatCurrency(calculations.targetCorpus)})</p>
          </div>

          {/* Pillar 2: Term Life */}
          <div className="p-3 bg-navy-bg/80 border border-border-navy/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white">Term Life Cover</span>
              <span className="text-emerald">{calculations.termScore}/25 pts</span>
            </div>
            <p className="text-[10px] text-muted-grey">{formatCurrency(termInsuranceCover)} (Target: {formatCurrency(annualIncome * 12)})</p>
          </div>

          {/* Pillar 3: Health Cover */}
          <div className="p-3 bg-navy-bg/80 border border-border-navy/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white">Health Insurance</span>
              <span className="text-emerald">{calculations.healthScore}/25 pts</span>
            </div>
            <p className="text-[10px] text-muted-grey">{formatCurrency(healthInsuranceCover)} Base + Super Top-up</p>
          </div>

          {/* Pillar 4: Savings Rate */}
          <div className="p-3 bg-navy-bg/80 border border-border-navy/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white">Savings & SIP Rate</span>
              <span className="text-emerald">{calculations.savingsScore}/25 pts</span>
            </div>
            <p className="text-[10px] text-muted-grey">{calculations.savingsRatioPct}% of Net Monthly Income</p>
          </div>
        </div>
      </div>

      {/* Main Calculator Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Expenses Breakdown */}
          <div className="p-6 glass-card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald" /> 1. Monthly Household Expense Breakdown
            </h2>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-grey">Essential Expenses</label>
                <p className="text-[10px] text-muted-grey">Rent, Groceries, Utilities</p>
                <NumericInput value={essential} onChange={setEssential} min={0} max={1000000} step={1000} type="currency" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-grey">Discretionary Expenses</label>
                <p className="text-[10px] text-muted-grey">Dining, Subscriptions</p>
                <NumericInput value={discretionary} onChange={setDiscretionary} min={0} max={1000000} step={1000} type="currency" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-grey">Loan EMIs & Insurance</label>
                <p className="text-[10px] text-muted-grey">Home/Car EMI, Premiums</p>
                <NumericInput value={debt} onChange={setDebt} min={0} max={1000000} step={1000} type="currency" />
              </div>
            </div>

            <div className="p-3 bg-navy-bg border border-border-navy/60 rounded-xl flex justify-between items-center text-xs font-bold">
              <span className="text-muted-grey">Total Monthly Expense:</span>
              <span className="text-emerald text-base font-extrabold">{formatCurrency(calculations.totalMonthlyExpense)}</span>
            </div>

            {/* Target Months Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white">Emergency Runway Buffer:</span>
                <span className="text-emerald">{targetMonths} Months ({formatCurrency(calculations.targetCorpus)})</span>
              </div>
              <input
                type="range"
                min={3}
                max={12}
                step={1}
                value={targetMonths}
                onChange={(e) => setTargetMonths(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>3 Months (Floor)</span>
                <span>6 Months (Recommended)</span>
                <span>12 Months (High Stability)</span>
              </div>
            </div>
          </div>

          {/* Financial Protection Essentials Input Card */}
          <div className="p-6 glass-card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HeartPulse size={16} className="text-emerald" /> 2. Insurance & Savings Coverage Inputs
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-grey">Gross Annual Income</label>
                <NumericInput value={annualIncome} onChange={setAnnualIncome} min={0} max={100000000} step={50000} type="currency" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-grey">Term Life Insurance Cover</label>
                <NumericInput value={termInsuranceCover} onChange={setTermInsuranceCover} min={0} max={100000000} step={500000} type="currency" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-grey">Health Insurance (Base + Super Topup)</label>
                <NumericInput value={healthInsuranceCover} onChange={setHealthInsuranceCover} min={0} max={10000000} step={100000} type="currency" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-grey">Monthly Investment SIPs</label>
                <NumericInput value={monthlyInvestments} onChange={setMonthlyInvestments} min={0} max={1000000} step={5000} type="currency" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-6">
            <h2 className="text-lg font-bold text-white">Safety Net Summary</h2>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-emerald/30 bg-emerald/5 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald block">Target Emergency Corpus</span>
                <p className="text-3xl font-black text-white mt-1">{formatCurrency(calculations.futureTargetCorpus)}</p>
                <p className="text-[10px] text-muted-grey mt-1">Factoring {projectionYears}Y inflation at {inflation}%</p>
              </div>

              <div className="p-3 bg-navy-bg border border-border-navy rounded-xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-grey">3-Month Absolute Floor:</span>
                  <span className="font-bold">{formatCurrency(calculations.futureMinCorpus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-grey">6-Month Recommended:</span>
                  <span className="font-bold">{formatCurrency(calculations.futureIdealCorpus)}</span>
                </div>
                <div className="flex justify-between border-t border-border-navy/60 pt-2 text-emerald">
                  <span>Monthly Savings Needed:</span>
                  <span className="font-bold">{formatCurrency(calculations.monthlySavingsNeeded)}/mo</span>
                </div>
              </div>
            </div>

            {/* Recommended Allocation Pie Chart */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">Recommended Liquid Allocation</span>
              <div className="h-[180px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={calculations.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {calculations.pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-muted-grey space-y-1">
                <p>🔹 <strong>20% ({formatCurrency(calculations.cashAllocation)})</strong> in Sweep-In Savings Account (Instant access)</p>
                <p>🟢 <strong>80% ({formatCurrency(calculations.liquidFundAllocation)})</strong> in Liquid Funds / Arbitrage / Sweep FDs (T+1 redemption)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
