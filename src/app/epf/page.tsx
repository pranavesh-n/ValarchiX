"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Coins, Info, HelpCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function EpfCalculator() {
  const [monthlyBasic, setMonthlyBasic] = useState(50000);
  const [employeeContributionRate, setEmployeeContributionRate] = useState(12); // Standard is 12%
  const [annualIncrement, setAnnualIncrement] = useState(7); // 7% average yearly pay raise
  const [currentAge, setCurrentAge] = useState(25);
  const [retirementAge, setRetirementAge] = useState(58); // Standard retirement age is 58 in EPFO
  const [currentEpfBalance, setCurrentEpfBalance] = useState(100000);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const EPF_INTEREST_RATE = 8.25; // Current EPFO Interest Rate (FY 24-25 baseline)

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  const calculations = useMemo(() => {
    const data = [];
    const r = EPF_INTEREST_RATE / 100 / 12; // Monthly rate
    const infRate = inflation / 100;
    const years = retirementAge - currentAge;
    const totalMonths = years * 12;

    let balance = currentEpfBalance;
    let currentSalary = monthlyBasic;
    let employeeTotalContribution = 0;
    let employerTotalContribution = 0;

    for (let m = 1; m <= totalMonths; m++) {
      // Annual increment applies every 12 months
      if (m > 1 && m % 12 === 1) {
        currentSalary = currentSalary * (1 + annualIncrement / 100);
      }

      // EPF Contribution details:
      // Employee contributes 12% of Basic + DA.
      // Employer contributes 12%, out of which 8.33% goes to EPS (capped at ₹1,250),
      // and the remainder (3.67% + excess over cap) goes to EPF.
      const employeeCont = currentSalary * (employeeContributionRate / 100);
      const epsCont = Math.min(currentSalary * 0.0833, 1250);
      const employerCont = (currentSalary * 0.12) - epsCont;

      employeeTotalContribution += employeeCont;
      employerTotalContribution += employerCont;

      // Accumulate in EPF
      const monthlyContribution = employeeCont + employerCont;
      balance = (balance + monthlyContribution) * (1 + r);

      // Record yearly data for charts
      if (m % 12 === 0) {
        const yearIndex = m / 12;
        const realMaturity = balance / Math.pow(1 + infRate, yearIndex);

        data.push({
          year: `Yr ${yearIndex}`,
          "Total Employee Cont": Math.round(employeeTotalContribution),
          "Total Employer Cont": Math.round(employerTotalContribution),
          "EPF Corpus": Math.round(balance),
          "Inflation Adjusted": Math.round(realMaturity)
        });
      }
    }

    const totalInvested = employeeTotalContribution + employerTotalContribution;

    return {
      totalInvested: Math.round(totalInvested),
      employeeContribution: Math.round(employeeTotalContribution),
      employerContribution: Math.round(employerTotalContribution),
      maturityValue: Math.round(balance),
      interestEarned: Math.round(Math.max(0, balance - totalInvested - currentEpfBalance)),
      realMaturityValue: Math.round(balance / Math.pow(1 + infRate, years)),
      chartData: data,
      years
    };
  }, [monthlyBasic, employeeContributionRate, annualIncrement, currentAge, retirementAge, currentEpfBalance, inflation]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-10 py-6 animate-fadeIn text-light-grey">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Coins className="text-emerald" />
            EPF Calculator (Employee Provident Fund)
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate your EPF retirement corpus accumulation including basic salary raises and employee/employer contributions.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-6">
            <h2 className="text-lg font-bold text-white">Salary & EPF Settings</h2>

            {/* Monthly Basic + DA */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Monthly Basic Salary + DA</span>
                <NumericInput
                  value={monthlyBasic}
                  onChange={setMonthlyBasic}
                  min={1000}
                  max={1000000}
                  step={1000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={15000}
                max={250000}
                step={5000}
                value={monthlyBasic}
                onChange={(e) => setMonthlyBasic(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Employee Contribution Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Employee Share Rate</span>
                <NumericInput
                  value={employeeContributionRate}
                  onChange={setEmployeeContributionRate}
                  min={1}
                  max={100}
                  step={1}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={8}
                max={20}
                step={1}
                value={employeeContributionRate}
                onChange={(e) => setEmployeeContributionRate(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] text-muted-grey block leading-tight">
                *Standard mandatory contribution is 12%.
              </span>
            </div>

            {/* Annual Increment */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Expected Annual Appraisal Raise</span>
                <NumericInput
                  value={annualIncrement}
                  onChange={setAnnualIncrement}
                  min={0}
                  max={30}
                  step={0.5}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={annualIncrement}
                onChange={(e) => setAnnualIncrement(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Ages Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-grey">Current Age</label>
                <NumericInput
                  value={currentAge}
                  onChange={setCurrentAge}
                  min={18}
                  max={57}
                  step={1}
                  type="years"
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-grey">Retirement Age</label>
                <NumericInput
                  value={retirementAge}
                  onChange={setRetirementAge}
                  min={currentAge + 1}
                  max={70}
                  step={1}
                  type="years"
                  className="w-full"
                />
              </div>
            </div>

            {/* Current EPF Balance */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Current EPF Balance</span>
                <NumericInput
                  value={currentEpfBalance}
                  onChange={setCurrentEpfBalance}
                  min={0}
                  max={50000000}
                  step={5000}
                  type="currency"
                />
              </div>
            </div>

            {/* EPF Rate Info */}
            <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
              <span className="text-[10px] font-bold text-emerald uppercase block">Current EPF Interest Rate</span>
              <p className="text-base font-extrabold text-white">{EPF_INTEREST_RATE}% p.a.</p>
              <span className="text-[9px] text-muted-grey block leading-tight">
                *Interest rates are reviewed and set yearly by the EPFO Board.
              </span>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the retirement corpus value to show equivalent purchasing power in today's currency."><HelpCircle size={14} /></span>
                </label>
                <input
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                  className="rounded border-border-navy text-emerald focus:ring-emerald accent-emerald h-4 w-4"
                />
              </div>

              {adjustInflation && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-grey">Expected Inflation Rate</span>
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results & Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Contributions</span>
              <p className="text-lg font-extrabold text-white mt-1">
                {formatCurrency(calculations.totalInvested)}
              </p>
              <div className="text-[9px] text-muted-grey mt-1 space-y-0.5">
                <span className="block">Emp: {formatCurrency(calculations.employeeContribution)}</span>
                <span className="block">Emplr: {formatCurrency(calculations.employerContribution)}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Nominal EPF Corpus</span>
              <p className="text-lg font-extrabold text-emerald mt-1">
                {formatCurrency(calculations.maturityValue)}
              </p>
              <span className="text-[9px] text-emerald block mt-1">Interest: +{formatCurrency(calculations.interestEarned)}</span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald/20 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">
                {adjustInflation ? "Real Corpus Value (Today's Power)" : "Inflation Adjusted Value"}
              </span>
              <p className="text-lg font-extrabold text-white mt-1">
                {formatCurrency(adjustInflation ? calculations.realMaturityValue : calculations.maturityValue)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-1">
                {adjustInflation 
                  ? `Purchasing power at retirement in ${calculations.years} years` 
                  : "Turn on Inflation toggle to see purchasing power"}
              </span>
            </div>
          </div>

          {/* Warning / Explanation Banner */}
          {adjustInflation && (
            <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-amber-500 mr-1">⚠️ The Long-Term Retirement Illusion:</span>
              Your future EPF retirement pool will accumulate to <strong>{formatCurrency(calculations.maturityValue)}</strong> on paper. However, due to an annual inflation of <strong>{inflation}%</strong> over <strong>{calculations.years} years</strong>, its true purchasing power will feel like <strong>{formatCurrency(calculations.realMaturityValue)}</strong> in today&apos;s money. Make sure your retirement target covers this gap!
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Retirement Corpus Accumulation</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 15, left: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="epfColorNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="epfColorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    width={75}
                    tickFormatter={(val) => val >= 10000000 ? `₹${(val / 10000000).toFixed(1)}Cr` : val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : `₹${val}`}
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
                    dataKey="EPF Corpus"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#epfColorNominal)"
                    strokeWidth={2}
                  />
                  {adjustInflation && (
                    <Area
                      type="monotone"
                      dataKey="Inflation Adjusted"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#epfColorReal)"
                      strokeWidth={2}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="Total Employee Cont"
                    stroke="#3b82f6"
                    fill="none"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Educational info section */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          EPF (Employee Provident Fund) Regulations & Structure
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">How EPF Contributions are Split</h4>
            <p>
              EPF is a mandatory retirement program for salaried workers in India earning basic wages. The contribution is split as follows:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Employee Contribution:</strong> Exactly 12% of basic salary + dearness allowance (DA) goes directly into the EPF account.</li>
              <li><strong>Employer Contribution:</strong> 12% of basic + DA is contributed. However:
                <ul className="list-circle pl-5 mt-1 space-y-1 text-muted-grey/80">
                  <li><strong>8.33%</strong> is routed to the <strong>EPS (Employee Pension Scheme)</strong> to fund post-retirement monthly pensions. This contribution is statutorily capped at ₹1,250 per month (8.33% of a ₹15,000 basic salary ceiling).</li>
                  <li>The remaining <strong>3.67%</strong> (plus any contribution on basic salaries above ₹15,000) is routed directly into the <strong>EPF account</strong>.</li>
                </ul>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Why Inflation Adjusted EPF is Crucial</h4>
            <p>
              EPF compounds over highly extended timelines (typically 25 to 40 years). Over these multi-decade spans, general prices will rise dramatically.
            </p>
            <p>
              An EPF statement showing a projected retirement corpus of ₹2 Crores may seem vast, but with an inflation rate of 5%, that ₹2 Crores will purchase only what about ₹30 Lakhs does today.
            </p>
            <p>
              Adjusting your EPF projections for inflation allows you to assess your actual retirement security and evaluate if you need to complement it with equity index fund investments.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
