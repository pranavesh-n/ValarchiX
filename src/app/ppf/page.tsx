"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Coins, Info, HelpCircle, ChevronDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function PpfCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [yearlyDeposit, setYearlyDeposit] = useState(150000);
  const [years, setYears] = useState(15); // PPF has a default 15-year lock-in
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const PPF_INTEREST_RATE = 7.10; // Current actual PPF interest rate (fixed by Govt)

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
    const r = PPF_INTEREST_RATE / 100;
    const infRate = inflation / 100;
    let totalInvested = 0;
    let maturityValue = 0;

    // PPF compounding formula (invested at start of year)
    // F = P * [((1 + r)^n - 1) / r] * (1 + r)
    for (let y = 1; y <= years; y++) {
      const invested = yearlyDeposit * y;
      const nominalMaturity = yearlyDeposit * (((Math.pow(1 + r, y) - 1) / r) * (1 + r));
      const realMaturity = nominalMaturity / Math.pow(1 + infRate, y);

      totalInvested = invested;
      maturityValue = nominalMaturity;

      data.push({
        year: `Yr ${y}`,
        "Total Invested": invested,
        "Maturity Value": Math.round(nominalMaturity),
        "Inflation Adjusted": Math.round(realMaturity)
      });
    }

    return {
      totalInvested,
      maturityValue: Math.round(maturityValue),
      interestEarned: Math.round(Math.max(0, maturityValue - totalInvested)),
      realMaturityValue: Math.round(maturityValue / Math.pow(1 + infRate, years)),
      chartData: data
    };
  }, [yearlyDeposit, years, inflation]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Coins className="text-emerald" />
            PPF Calculator (Public Provident Fund)
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate risk-free compounding in the Public Provident Fund under the fixed 7.10% p.a. sovereign rate.
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
                  min={500}
                  max={150000}
                  step={500}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={500}
                max={150000} // PPF has a statutory max limit of 1.5 Lakhs per year
                step={500}
                value={yearlyDeposit}
                onChange={(e) => setYearlyDeposit(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹500</span>
                <span>₹1.5 Lakhs (Statutory Max Limit)</span>
              </div>
            </div>

            {/* PPF Lock-in Interest indicator */}
            <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
              <span className="text-[10px] font-bold text-emerald uppercase block">PPF Interest Rate</span>
              <p className="text-base font-extrabold text-white">{PPF_INTEREST_RATE}% p.a.</p>
              <span className="text-[9px] text-muted-grey block leading-tight">
                *Interest is government-guaranteed and completely tax-free under Sec 80C.
              </span>
            </div>

            {/* Horizon Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Lock-in Period (Years)</span>
                <NumericInput
                  value={years}
                  onChange={setYears}
                  min={15}
                  max={50}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={15} // Statutory minimum lock-in is 15 years
                max={30}
                step={5} // Extendable in blocks of 5 years
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>15 Years (Min)</span>
                <span>30 Years (Extended)</span>
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
                  <div className="pt-1 text-left">
                    <button
                      type="button"
                      onClick={() => setInflation(rates.inflationRate)}
                      className="text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded transition-all"
                    >
                      CPI Inflation Baseline ({rates.inflationRate}%)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Principal</span>
              <p className="text-xl font-bold text-white mt-1">
                {formatCurrency(calculations.totalInvested)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Maturity Value (Nominal)</span>
              <p className="text-xl font-bold text-emerald mt-1">
                {formatCurrency(calculations.maturityValue)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Maturity Value (Real Value)</span>
              <p className="text-xl font-bold text-amber-500 mt-1">
                {formatCurrency(adjustInflation ? calculations.realMaturityValue : calculations.maturityValue)}
              </p>
            </div>
          </div>

          {/* Chart Display */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              PPF Compounding Curve Map
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 15, left: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMaturity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
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
                    dataKey="Maturity Value"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorMaturity)"
                    strokeWidth={2}
                  />
                  {adjustInflation && (
                    <Area
                      type="monotone"
                      dataKey="Inflation Adjusted"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#colorReal)"
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Education card */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Info className="text-emerald" size={18} />
              Educational Concept: PPF Sovereign Safety
            </h3>
            <p className="text-xs text-muted-grey leading-relaxed">
              The Public Provident Fund is backed directly by the Central Government of India, making default risk virtually non-existent. However, because it compounds at a fixed rate (7.10% p.a.), it tracks close to average CPI inflation (5.09%). This means it is the perfect tool for capital preservation and debt allocation, but should be combined with equity indexes for long-term growth.
            </p>
          </div>

          {/* Collapsible Math Audit Section */}
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
                  <h4 className="font-semibold text-white">PPF Annual Compounding & Balance Formulation</h4>
                  <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                    <p>
                      <strong>Annual Compounding Formula (assuming deposit on Day 1):</strong>
                      <br />
                      Maturity Balance (F) = A * [ ((1 + r)^n - 1) / r ] * (1 + r)
                      <br />
                      <span className="text-[10px] text-muted-grey">where: A = annual deposit (max ₹1.5 Lakhs), r = PPF interest rate (7.10%), n = number of years.</span>
                    </p>
                    <p>
                      Note: Under Indian Government rules, interest is calculated monthly on the lowest balance between the 5th and the last day of the month, and compounded annually at the end of the FY (March 31).
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel Replication (Audit Script)</h4>
                  <p>To replicate this PPF compounding model in Excel or Google Sheets, use:</p>
                  <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                    <thead>
                      <tr className="bg-navy-bg/60">
                        <th className="border border-border-navy/80 p-2 text-left">Calculation</th>
                        <th className="border border-border-navy/80 p-2 text-left">Excel / Sheets Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">PPF Maturity Balance</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=-FV({PPF_INTEREST_RATE}%, {years}, {yearlyDeposit}, 0, 1)</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Inflation Real Value</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Maturity_Balance / ((1 + {inflation}%)^{years})</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This tool is an educational planning model designed to teach capital compounding. It does not provide SEBI-registered investment advice or guarantee future Sovereign rates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
