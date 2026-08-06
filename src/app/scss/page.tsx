"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Coins, Info, HelpCircle, ChevronDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function ScssCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [deposit, setDeposit] = useState(1000000); // 10 Lakhs default
  const [tenureYears, setTenureYears] = useState(5); // 5 years standard, or 8 years with extension
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const SCSS_INTEREST_RATE = 8.20; // Current Senior Citizens Savings Scheme rate
  const SCSS_MAX_LIMIT = 3000000; // statutory limit of ₹30 Lakhs (upgraded from 15L in Budget 2023)

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
    const clampedDeposit = Math.min(deposit, SCSS_MAX_LIMIT);
    const r = SCSS_INTEREST_RATE / 100;
    const infRate = inflation / 100;

    // Quarterly payout
    const quarterlyPayoutNominal = (clampedDeposit * r) / 4;

    // Decaying purchasing power of quarterly payout over years
    const chartData = [];
    for (let yr = 1; yr <= tenureYears; yr++) {
      const realPayout = quarterlyPayoutNominal / Math.pow(1 + infRate, yr);
      const realPrincipal = clampedDeposit / Math.pow(1 + infRate, yr);
      
      chartData.push({
        year: `Yr ${yr}`,
        "Nominal Payout (Quarterly)": Math.round(quarterlyPayoutNominal),
        "Real Payout": Math.round(realPayout),
        "Real Principal Value": Math.round(realPrincipal)
      });
    }

    const finalRealPrincipal = clampedDeposit / Math.pow(1 + infRate, tenureYears);
    const totalPayoutNominal = quarterlyPayoutNominal * 4 * tenureYears;

    let totalPayoutReal = 0;
    for (let yr = 1; yr <= tenureYears; yr++) {
      totalPayoutReal += (quarterlyPayoutNominal * 4) / Math.pow(1 + infRate, yr);
    }

    return {
      clampedDeposit,
      quarterlyPayoutNominal: Math.round(quarterlyPayoutNominal),
      quarterlyPayoutReal: Math.round(quarterlyPayoutNominal / Math.pow(1 + infRate, tenureYears)),
      totalPayoutNominal: Math.round(totalPayoutNominal),
      totalPayoutReal: Math.round(totalPayoutReal),
      finalRealPrincipal: Math.round(finalRealPrincipal),
      principalLoss: Math.round(clampedDeposit - finalRealPrincipal),
      chartData
    };
  }, [deposit, tenureYears, inflation]);

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
            Senior Citizens Savings Scheme (SCSS)
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate guaranteed quarterly payouts under the SCSS scheme and evaluate the erosion of your regular pension income.
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

            {/* Deposit Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Total Deposit</span>
                <NumericInput
                  value={deposit}
                  onChange={(val) => setDeposit(Math.min(val, SCSS_MAX_LIMIT))}
                  min={1000}
                  max={SCSS_MAX_LIMIT}
                  step={5000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={10000}
                max={SCSS_MAX_LIMIT}
                step={50000}
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹1,000 (Min)</span>
                <span>₹30 Lakhs (Statutory Max Limit)</span>
              </div>
            </div>

            {/* Tenure Options */}
            <div className="space-y-2">
              <label className="text-xs text-muted-grey block font-semibold">Tenure Period</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTenureYears(5)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${tenureYears === 5
                    ? "bg-emerald border-emerald text-navy-bg"
                    : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                  }`}
                >
                  5 Years (Standard)
                </button>
                <button
                  onClick={() => setTenureYears(8)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${tenureYears === 8
                    ? "bg-emerald border-emerald text-navy-bg"
                    : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                  }`}
                >
                  8 Years (Extended)
                </button>
              </div>
            </div>

            {/* Rates details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald uppercase block">SCSS Interest Rate</span>
                <p className="text-base font-extrabold text-white">{SCSS_INTEREST_RATE}% p.a.</p>
                <span className="text-[8px] text-muted-grey block leading-tight">
                  *Paid out quarterly. Fixed rate.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald uppercase block">80C Tax Benefit</span>
                <p className="text-base font-extrabold text-emerald">Available</p>
                <span className="text-[8px] text-muted-grey block leading-tight">
                  *On initial deposit up to ₹1.5 Lakhs.
                </span>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the quarterly payouts and principal returned by inflation."><HelpCircle size={14} /></span>
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
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Quarterly Interest Income</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.quarterlyPayoutNominal)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Paid on end of each quarter</span>
            </div>

            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Nominal Interest</span>
              <p className="text-xl font-extrabold text-emerald mt-1">
                {formatCurrency(calculations.totalPayoutNominal)}
              </p>
              <span className="text-[9px] text-emerald block mt-0.5">Over {tenureYears} years: {formatCurrency(calculations.clampedDeposit)} returned</span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald/20 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">
                {adjustInflation ? "Real Value of Returned Principal" : "Nominal Principal Returned"}
              </span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(adjustInflation ? calculations.finalRealPrincipal : calculations.clampedDeposit)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">
                {adjustInflation 
                  ? `Lost ${formatCurrency(calculations.principalLoss)} in purchasing power` 
                  : "Turn on Inflation toggle to see purchasing power"}
              </span>
            </div>
          </div>

          {/* Warning / Explanation Banner */}
          {adjustInflation && (
            <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-red-400 mr-1">⚠️ The Retirement Income Erosion:</span>
              SCSS pays a flat, fixed quarterly nominal income of <strong>{formatCurrency(calculations.quarterlyPayoutNominal)}/quarter</strong>. Over {tenureYears} years of <strong>{inflation}%</strong> inflation, the real value of the final quarterly payout drops to <strong>{formatCurrency(calculations.quarterlyPayoutReal)}</strong>. Additionally, the returned principal of <strong>{formatCurrency(calculations.clampedDeposit)}</strong> loses <strong>{formatCurrency(calculations.principalLoss)}</strong> in real purchasing power.
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Erosion of Quarterly Payout Value (Purchasing Power)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
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
                  <Legend iconType="rect" />
                  <Bar dataKey="Nominal Payout (Quarterly)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  {adjustInflation && (
                    <Bar dataKey="Real Payout" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Section */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          SCSS Scheme Rules & Pension Management
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Eligibilities & Scheme Terms</h4>
            <p>
              The Senior Citizens Savings Scheme (SCSS) is a government-backed retirement program offering regular payouts.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Age Eligibility:</strong> Individuals aged 60 or above. Individuals aged 55-60 who retired under voluntary retirement (VRS) can also invest within 1 month of receiving retirement benefits.</li>
              <li><strong>Limits:</strong> The maximum investment limit is capped at ₹30,000,000 (upgraded from 15L in Budget 2023).</li>
              <li><strong>Tenure:</strong> Initial tenure is 5 years. It can be extended for an additional 3 years by submitting an application within 1 year of maturity.</li>
              <li><strong>Taxation:</strong> Deposits qualify for Section 80C deduction. However, interest income is fully taxable under your tax slab. If interest income exceeds ₹50,000 in a year, TDS is deducted.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">The Senior Citizen Inflation Problem</h4>
            <p>
              SCSS provides a high guaranteed yield of <strong>8.2% p.a.</strong>, which is excellent for safety. However, because seniors are heavily reliant on fixed income, they are the most vulnerable to **inflation**.
            </p>
            <p>
              If a senior citizen deposits the statutory maximum of ₹30 Lakhs, they get ₹61,500/quarter. In 8 years (under extended tenure), that quarterly payout will feel like only ₹41,000 in terms of actual buying power due to 5% inflation.
            </p>
            <p>
              Additionally, their returned capital of ₹30 Lakhs will have lost over ₹9 Lakhs in real purchasing power. Seniors must ensure that a small portion of their retirement corpus is invested in low-risk index funds or hybrid funds to hedge against this erosion.
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
            SCSS Quarterly Payout & Excel Replication
          </span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
        </button>
        
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">SCSS Interest Formula</h4>
              <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                <p>
                  <strong>Quarterly Payout = (Deposit Amount × 8.20%) / 4</strong>
                </p>
                <p className="text-[10px] text-muted-grey">
                  Note: Maximum deposit limit is ₹30 Lakhs. Tenure is 5 years (extendable up to 8 years). Qualifies for 80C deduction up to ₹1.5L.
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
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Quarterly Interest Income</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=(Deposit * 8.20%) / 4</td>
                  </tr>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Real Principal Value at Maturity</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Deposit / ((1 + {inflation}%)^{tenureYears})</td>
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
