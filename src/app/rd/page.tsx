"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Percent, Info, HelpCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function RdCalculator() {
  const [monthlyDeposit, setMonthlyDeposit] = useState(10000);
  const [interestRate, setInterestRate] = useState(6.70); // Average bank RD rate
  const [years, setYears] = useState(5);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(7.0);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 7.0 });

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
    const r = interestRate / 100;
    const infRate = inflation / 100;
    const totalMonths = years * 12;

    // Standard bank RD compounds quarterly. 
    // We convert the nominal annual rate to the equivalent monthly rate.
    const monthlyRateEquiv = Math.pow(1 + r / 4, 1 / 3) - 1;

    let balance = 0;
    let totalInvested = 0;

    for (let m = 1; m <= totalMonths; m++) {
      totalInvested += monthlyDeposit;
      
      // Add deposit at start of month, compound at end of month
      balance = (balance + monthlyDeposit) * (1 + monthlyRateEquiv);

      // Record year-end data for chart
      if (m % 12 === 0) {
        const yr = m / 12;
        const realVal = balance / Math.pow(1 + infRate, yr);
        data.push({
          year: `Yr ${yr}`,
          "Total Invested": totalInvested,
          "Maturity Value": Math.round(balance),
          "Inflation Adjusted": Math.round(realVal)
        });
      }
    }

    return {
      totalInvested,
      maturityValue: Math.round(balance),
      interestEarned: Math.round(Math.max(0, balance - totalInvested)),
      realMaturityValue: Math.round(balance / Math.pow(1 + infRate, years)),
      chartData: data
    };
  }, [monthlyDeposit, interestRate, years, inflation]);

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
            <Percent className="text-emerald" />
            RD Calculator (Recurring Deposit)
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate bank or post office Recurring Deposits with quarterly compounding and real inflation adjustments.
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
            <h2 className="text-lg font-bold text-white">Deposit Settings</h2>

            {/* Monthly Deposit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Monthly Deposit</span>
                <NumericInput
                  value={monthlyDeposit}
                  onChange={setMonthlyDeposit}
                  min={100}
                  max={5000000}
                  step={500}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={1000}
                max={100000}
                step={1000}
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Interest Rate (p.a.)</span>
                <NumericInput
                  value={interestRate}
                  onChange={setInterestRate}
                  min={1}
                  max={20}
                  step={0.05}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={3}
                max={10}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] text-muted-grey block leading-tight">
                *Most banks compound RD interest quarterly.
              </span>
            </div>

            {/* Tenure (Years) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Tenure (Years)</span>
                <NumericInput
                  value={years}
                  onChange={setYears}
                  min={1}
                  max={25}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the final value to show equivalent purchasing power."><HelpCircle size={14} /></span>
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

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Deposit</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.totalInvested)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Over {years} Years</span>
            </div>

            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Nominal Maturity</span>
              <p className="text-xl font-extrabold text-emerald mt-1">
                {formatCurrency(calculations.maturityValue)}
              </p>
              <span className="text-[9px] text-emerald block mt-0.5">Interest: +{formatCurrency(calculations.interestEarned)}</span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald/20 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">
                {adjustInflation ? "Real Value (Today's Power)" : "Inflation Adjusted Value"}
              </span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(adjustInflation ? calculations.realMaturityValue : calculations.maturityValue)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">
                {adjustInflation 
                  ? `Purchasing power after ${years} years` 
                  : "Turn on Inflation toggle to see purchasing power"}
              </span>
            </div>
          </div>

          {/* Banner */}
          {adjustInflation && (
            <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-amber-500 mr-1">⚠️ Fixed Income Dilution:</span>
              Your Recurring Deposit will pay out a nominal sum of <strong>{formatCurrency(calculations.maturityValue)}</strong>. However, due to <strong>{inflation}%</strong> annual inflation, that money will buy only what <strong>{formatCurrency(calculations.realMaturityValue)}</strong> buys today. RDs offer capital safety but do not grow real wealth.
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Maturity Growth Pathway</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rdColorNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rdColorReal" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
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
                    dataKey="Maturity Value"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#rdColorNominal)"
                    strokeWidth={2}
                  />
                  {adjustInflation && (
                    <Area
                      type="monotone"
                      dataKey="Inflation Adjusted"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#rdColorReal)"
                      strokeWidth={2}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="Total Invested"
                    stroke="#64748b"
                    fill="none"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Guide */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          Recurring Deposit (RD) Mechanics & Taxation
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">How Bank RDs Compound Interest</h4>
            <p>
              A Recurring Deposit is a term savings account where you deposit a fixed sum monthly. Unlike FDs where you invest a lump sum, RDs permit systematic periodic savings.
            </p>
            <p>
              Under Indian banking rules, RD interest is compounded quarterly. This means interest earned in the first three months is added to your principal, and future interest is calculated on this cumulative amount. Because earlier months compound for a longer period than later deposits, the effective yield is slightly lower than a standard lump-sum FD.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Taxation & Real Yield Erosion</h4>
            <p>
              <strong>Interest Taxation:</strong> RD interest is fully taxable under &quot;Income from Other Sources&quot; at your standard income tax slab rate (e.g. up to 30% + cess). Banks deduct 10% TDS if the interest income exceeds ₹40,000 in a financial year (₹50,000 for senior citizens).
            </p>
            <p>
              <strong>The Inflation Impact:</strong> Since RD rates usually hover around 6-7%, after subtracting income tax (e.g. 30% slab reduces a 7% yield to a post-tax return of 4.9%) and factoring in 5% inflation, the real purchasing power return is often <strong>negative</strong>. RDs should be used strictly for short-term goals (under 3 years) rather than long-term retirement wealth accumulation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
