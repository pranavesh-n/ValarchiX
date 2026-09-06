"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Coins, Info, HelpCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function SsyCalculator() {
  const [yearlyDeposit, setYearlyDeposit] = useState(100000);
  const [girlAge, setGirlAge] = useState(5);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(7.0);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 7.0 });

  const SSY_INTEREST_RATE = 8.20; // Current Sukanya Samriddhi Yojana Interest Rate

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
    const r = SSY_INTEREST_RATE / 100;
    const infRate = inflation / 100;
    let balance = 0;
    let totalInvested = 0;

    // SSY scheme runs for 21 years from the date of account opening.
    // Deposits are allowed for 15 years.
    for (let y = 1; y <= 21; y++) {
      const deposit = y <= 15 ? yearlyDeposit : 0;
      totalInvested += deposit;

      // Compound interest credited at the end of each financial year
      balance = (balance + deposit) * (1 + r);
      
      const nominalMaturity = balance;
      const realMaturity = nominalMaturity / Math.pow(1 + infRate, y);

      data.push({
        year: `Yr ${y}`,
        "Total Invested": totalInvested,
        "Maturity Value": Math.round(nominalMaturity),
        "Inflation Adjusted": Math.round(realMaturity)
      });
    }

    return {
      totalInvested,
      maturityValue: Math.round(balance),
      interestEarned: Math.round(Math.max(0, balance - totalInvested)),
      realMaturityValue: Math.round(balance / Math.pow(1 + infRate, 21)),
      chartData: data
    };
  }, [yearlyDeposit, inflation]);

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
            SSY Calculator (Sukanya Samriddhi Yojana)
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate government-guaranteed compounding for a girl child&apos;s education and marriage.
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
            <h2 className="text-lg font-bold text-white">Investment Settings</h2>

            {/* Yearly Deposit Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Yearly Deposit</span>
                <NumericInput
                  value={yearlyDeposit}
                  onChange={setYearlyDeposit}
                  min={250}
                  max={150000}
                  step={500}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={250}
                max={150000} // statutory limit
                step={500}
                value={yearlyDeposit}
                onChange={(e) => setYearlyDeposit(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹250 (Min)</span>
                <span>₹1.5 Lakhs (Statutory Max Limit)</span>
              </div>
            </div>

            {/* SSY Rate indicator */}
            <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
              <span className="text-[10px] font-bold text-emerald uppercase block">Current SSY Interest Rate</span>
              <p className="text-base font-extrabold text-white">{SSY_INTEREST_RATE}% p.a.</p>
              <span className="text-[9px] text-muted-grey block leading-tight">
                *Interest is government-guaranteed and completely tax-free under Section 80C.
              </span>
            </div>

            {/* Girl Child Age */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Girl Child Age (0-10)</span>
                <NumericInput
                  value={girlAge}
                  onChange={setGirlAge}
                  min={0}
                  max={10}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={girlAge}
                onChange={(e) => setGirlAge(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>0 Years (Newborn)</span>
                <span>10 Years (Max Entry Age)</span>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the maturity value by inflation rate to show real purchasing power."><HelpCircle size={14} /></span>
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
                  <div className="flex justify-between text-[10px] text-muted-grey">
                    <span>3%</span>
                    <span>12%</span>
                  </div>
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
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Invested</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.totalInvested)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Over 15 Years</span>
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
                  ? `Purchasing power after 21 years` 
                  : "Turn on Inflation toggle to see purchasing power"}
              </span>
            </div>
          </div>

          {/* Warning / Explanation Banner */}
          {adjustInflation && (
            <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-amber-500 mr-1">⚠️ The 21-Year Reality:</span>
              Due to compounding inflation of <strong>{inflation}%</strong>, the nominal maturity corpus of <strong>{formatCurrency(calculations.maturityValue)}</strong> will purchase what <strong>{formatCurrency(calculations.realMaturityValue)}</strong> does today. While SSY beats bank FDs, remember to scale your targets for higher education expenses.
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Growth Projection (Over 21 Years)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="ssyColorNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ssyColorReal" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#ssyColorNominal)"
                    strokeWidth={2}
                  />
                  {adjustInflation && (
                    <Area
                      type="monotone"
                      dataKey="Inflation Adjusted"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#ssyColorReal)"
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

      {/* Educational info section */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          Sukanya Samriddhi Yojana (SSY) Scheme Guide
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Key Rules & Statutory Limits</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Eligible Child:</strong> Only for a girl child resident in India under the age of 10 at opening.</li>
              <li><strong>Statutory Limit:</strong> Minimum investment is ₹250, and the maximum is capped at ₹1,50,000 per financial year (Section 80C benefits).</li>
              <li><strong>Deposit Tenure:</strong> Contributions must be made for exactly 15 years from opening.</li>
              <li><strong>Account Maturity:</strong> The account matures after 21 years from date of opening or when the girl marries after age 18.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Inflation & Yield Reality</h4>
            <p>
              Sukanya Samriddhi Yojana currently offers an attractive sovereign interest rate of <strong>8.2% p.a.</strong>, which is higher than most other fixed-income schemes like PPF or bank FDs.
            </p>
            <p>
              <strong>Why Inflation Adjustment is Critical here:</strong> Because child education costs in India typically inflate at 8–10% per year (higher than CPI general inflation). A target corpus calculated solely on nominal values might fall short when the child reaches 18–21 years of age. Adjusting for a 5-6% inflation rate gives you the necessary reality check on the actual purchasing power of your investments.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
