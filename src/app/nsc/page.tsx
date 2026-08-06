"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Coins, Info, HelpCircle, ChevronDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function NscCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [investment, setInvestment] = useState(100000);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const NSC_INTEREST_RATE = 7.70; // Current NSC Interest Rate (compounded annually)
  const NSC_TENURE = 5; // NSC has a fixed 5-year lock-in period

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
    const r = NSC_INTEREST_RATE / 100;
    const infRate = inflation / 100;
    let balance = investment;
    
    // Year 0 details
    data.push({
      year: "Start",
      "Invested Principal": investment,
      "Nominal Value": investment,
      "Inflation Adjusted": investment,
      "Accrued Interest": 0
    });

    for (let y = 1; y <= NSC_TENURE; y++) {
      const prevBalance = balance;
      balance = prevBalance * (1 + r);
      const accrued = balance - prevBalance;
      const realVal = balance / Math.pow(1 + infRate, y);

      data.push({
        year: `Yr ${y}`,
        "Invested Principal": investment,
        "Nominal Value": Math.round(balance),
        "Inflation Adjusted": Math.round(realVal),
        "Accrued Interest": Math.round(accrued)
      });
    }

    const maturityValue = balance;
    const interestEarned = maturityValue - investment;

    return {
      totalInvested: investment,
      maturityValue: Math.round(maturityValue),
      interestEarned: Math.round(interestEarned),
      realMaturityValue: Math.round(maturityValue / Math.pow(1 + infRate, NSC_TENURE)),
      chartData: data
    };
  }, [investment, inflation]);

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
            NSC Calculator (National Savings Certificate)
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate risk-free compounding in the National Savings Certificate under the fixed 7.70% p.a. sovereign rate.
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
            <h2 className="text-lg font-bold text-white">Certificate Settings</h2>

            {/* Investment amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Investment Amount</span>
                <NumericInput
                  value={investment}
                  onChange={setInvestment}
                  min={1000}
                  max={50000000}
                  step={1000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={1000}
                max={500000}
                step={5000}
                value={investment}
                onChange={(e) => setInvestment(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹1,000 (Min)</span>
                <span>No Maximum Limit</span>
              </div>
            </div>

            {/* NSC details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald uppercase block">NSC Interest Rate</span>
                <p className="text-base font-extrabold text-white">{NSC_INTEREST_RATE}% p.a.</p>
                <span className="text-[8px] text-muted-grey block leading-tight">
                  *Compounded annually, paid at maturity.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald uppercase block">Lock-in Period</span>
                <p className="text-base font-extrabold text-white">{NSC_TENURE} Years</p>
                <span className="text-[8px] text-muted-grey block leading-tight">
                  *Fixed maturity, no premature withdrawals.
                </span>
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Invested</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.totalInvested)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Lump Sum Principal</span>
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
                  ? `Purchasing power after 5 years` 
                  : "Turn on Inflation toggle to see purchasing power"}
              </span>
            </div>
          </div>

          {/* Banner */}
          {adjustInflation && (
            <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-amber-500 mr-1">⚠️ The 5-Year Decay:</span>
              Due to compounding inflation of <strong>{inflation}%</strong>, the nominal maturity corpus of <strong>{formatCurrency(calculations.maturityValue)}</strong> will purchase what <strong>{formatCurrency(calculations.realMaturityValue)}</strong> does today. While NSC provides absolute principal security, its real post-inflation yields are limited.
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">NSC Compounding (Nominal vs. Real)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="nscColorNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="nscColorReal" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}K`}
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
                    dataKey="Nominal Value"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#nscColorNominal)"
                    strokeWidth={2}
                  />
                  {adjustInflation && (
                    <Area
                      type="monotone"
                      dataKey="Inflation Adjusted"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#nscColorReal)"
                      strokeWidth={2}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="Invested Principal"
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

      {/* Guide Section */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          National Savings Certificate (NSC) Scheme Guide
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Key Rules & Section 80C Reinvestment</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Sovereign Guarantee:</strong> NSC is a government-backed fixed income investment scheme available at all post offices.</li>
              <li><strong>Section 80C Benefit:</strong> The initial investment qualifies for tax deduction under Section 80C up to ₹1,50,000 per year.</li>
              <li><strong>The Reinvestment Loophole:</strong> The interest earned is compounded annually and added back to the principal. Because this interest is not paid out but reinvested, it is considered a **new investment** and is eligible for Section 80C tax deduction in Year 1, 2, 3, and 4! Only the interest earned in the 5th (final) year is taxable since it is paid out.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Inflation & Fixed Yield Impact</h4>
            <p>
              The government sets the interest rate quarterly. The current rate is <strong>7.7% p.a.</strong> compounded annually.
            </p>
            <p>
              <strong>Inflation Reality:</strong> A 7.7% fixed return is highly safe, but after paying tax on the final maturity year (or if you already exhaust your 80C limit), and with general prices rising at 5%, the real purchasing power increase of your capital is roughly 2.6%. NSC is excellent for capital preservation and tax saving for low-risk portfolios, but must be balanced with equity assets for long-term purchasing power expansion.
            </p>
          </div>
        </div>
      </section>

      {/* Collapsible Math Audit Section */}
      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button 
          onClick={() => setShowAudit(!showAudit)} 
          className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="text-emerald" size={18} />
            NSC Annual Compounding & Excel Replication
          </span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
        </button>
        
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">NSC Compounding Formula</h4>
              <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                <p>
                  <strong>Maturity Value = Investment Principal × (1 + 7.70%)^5</strong>
                </p>
                <p className="text-[10px] text-muted-grey">
                  Note: Interest is compounded annually for 5 years and paid out at maturity. Interest earned in Years 1–4 is deemed reinvested under Section 80C.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white">Excel / Google Sheets Replication Formula</h4>
              <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                <thead>
                  <tr className="bg-navy-bg/60">
                    <th className="border border-border-navy/80 p-2 text-left">Calculation</th>
                    <th className="border border-border-navy/80 p-2 text-left">Excel / Sheets Formula</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Maturity Amount (Year 5)</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Investment * (1 + 7.70%)^5</td>
                  </tr>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Inflation Real Value</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Maturity_Amount / ((1 + {inflation}%))^5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
