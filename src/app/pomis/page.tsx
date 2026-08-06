"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Coins, Info, HelpCircle, ChevronDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function PomisCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [deposit, setDeposit] = useState(450000);
  const [isJoint, setIsJoint] = useState(false);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const POMIS_INTEREST_RATE = 7.40; // Current Post Office Monthly Income Scheme rate
  const POMIS_TENURE = 5; // Fixed 5-year lock-in

  const maxLimit = isJoint ? 1500000 : 900000; // Statutory limits: 9L single, 15L joint

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // Clamp deposit if account type changes
  useEffect(() => {
    setDeposit((prev) => Math.min(prev, maxLimit));
  }, [isJoint, maxLimit]);

  const calculations = useMemo(() => {
    const clampedDeposit = Math.min(deposit, maxLimit);
    const r = POMIS_INTEREST_RATE / 100;
    const infRate = inflation / 100;

    // Monthly payout
    const monthlyPayoutNominal = (clampedDeposit * r) / 12;

    // Decaying purchasing power of monthly payout over 5 years
    const chartData = [];
    for (let yr = 1; yr <= POMIS_TENURE; yr++) {
      const realPayout = monthlyPayoutNominal / Math.pow(1 + infRate, yr);
      const realPrincipal = clampedDeposit / Math.pow(1 + infRate, yr);
      
      chartData.push({
        year: `Yr ${yr}`,
        "Nominal Payout": Math.round(monthlyPayoutNominal),
        "Real Payout": Math.round(realPayout),
        "Real Principal Value": Math.round(realPrincipal)
      });
    }

    const finalRealPrincipal = clampedDeposit / Math.pow(1 + infRate, POMIS_TENURE);
    const totalPayoutNominal = monthlyPayoutNominal * 12 * POMIS_TENURE;

    let totalPayoutReal = 0;
    for (let yr = 1; yr <= POMIS_TENURE; yr++) {
      totalPayoutReal += (monthlyPayoutNominal * 12) / Math.pow(1 + infRate, yr);
    }

    return {
      clampedDeposit,
      monthlyPayoutNominal: Math.round(monthlyPayoutNominal),
      monthlyPayoutReal: Math.round(monthlyPayoutNominal / Math.pow(1 + infRate, POMIS_TENURE)),
      totalPayoutNominal: Math.round(totalPayoutNominal),
      totalPayoutReal: Math.round(totalPayoutReal),
      finalRealPrincipal: Math.round(finalRealPrincipal),
      principalLoss: Math.round(clampedDeposit - finalRealPrincipal),
      chartData
    };
  }, [deposit, isJoint, inflation, maxLimit]);

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
            Post Office Monthly Income Scheme (POMIS)
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate guaranteed monthly payouts under the POMIS scheme and evaluate the erosion of your monthly income and principal.
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

            {/* Account Type Buttons */}
            <div className="space-y-2">
              <label className="text-xs text-muted-grey block font-semibold">Account Ownership</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsJoint(false)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${!isJoint
                    ? "bg-emerald border-emerald text-navy-bg"
                    : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                  }`}
                >
                  Single Account
                  <span className="block text-[8px] opacity-80">Max: ₹9 Lakhs</span>
                </button>
                <button
                  onClick={() => setIsJoint(true)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${isJoint
                    ? "bg-emerald border-emerald text-navy-bg"
                    : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                  }`}
                >
                  Joint Account
                  <span className="block text-[8px] opacity-80">Max: ₹15 Lakhs</span>
                </button>
              </div>
            </div>

            {/* Deposit Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Total Deposit</span>
                <NumericInput
                  value={deposit}
                  onChange={(val) => setDeposit(Math.min(val, maxLimit))}
                  min={1000}
                  max={maxLimit}
                  step={1000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={10000}
                max={maxLimit}
                step={5000}
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹1,000 (Min)</span>
                <span>₹{maxLimit / 100000} Lakhs (Max)</span>
              </div>
            </div>

            {/* Rates details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald uppercase block">POMIS Interest Rate</span>
                <p className="text-base font-extrabold text-white">{POMIS_INTEREST_RATE}% p.a.</p>
                <span className="text-[8px] text-muted-grey block leading-tight">
                  *Paid out monthly. Fixed for 5 yrs.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald uppercase block">Tenure Lock-in</span>
                <p className="text-base font-extrabold text-white">{POMIS_TENURE} Years</p>
                <span className="text-[8px] text-muted-grey block leading-tight">
                  *Returned at maturity.
                </span>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the monthly income and principal returned by inflation."><HelpCircle size={14} /></span>
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
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Monthly Interest Income</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.monthlyPayoutNominal)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Paid directly to bank account</span>
            </div>

            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Nominal Interest</span>
              <p className="text-xl font-extrabold text-emerald mt-1">
                {formatCurrency(calculations.totalPayoutNominal)}
              </p>
              <span className="text-[9px] text-emerald block mt-0.5">Over 5 years: {formatCurrency(calculations.clampedDeposit)} returned</span>
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
              <span className="font-bold text-red-400 mr-1">⚠️ Double Inflation Erosion:</span>
              POMIS pays a fixed nominal income of <strong>{formatCurrency(calculations.monthlyPayoutNominal)}/month</strong>. By Year 5, this payout purchases only what <strong>{formatCurrency(calculations.monthlyPayoutReal)}</strong> does today. In addition, the returned principal of <strong>{formatCurrency(calculations.clampedDeposit)}</strong> has eroded by <strong>{formatCurrency(calculations.principalLoss)}</strong> in real value.
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Erosion of Monthly Income (Purchasing Power)</h3>
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
                  <Bar dataKey="Nominal Payout" fill="#22c55e" radius={[4, 4, 0, 0]} />
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
          POMIS Rules & Income Security
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Statutory Limits & Payout Structure</h4>
            <p>
              The Post Office Monthly Income Scheme (POMIS) is a government savings program that offers low-risk regular monthly income.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Limits:</strong> The maximum investment is capped at ₹9,00,000 for single accounts and ₹15,00,000 for joint accounts.</li>
              <li><strong>Premature Withdrawal Penalty:</strong> Lock-in period is 5 years. If closed between 1-3 years, a 2% deduction applies. If closed between 3-5 years, a 1% deduction applies to the principal.</li>
              <li><strong>Taxation:</strong> Interest income is completely taxable under &quot;Income from Other Sources&quot; at your tax slab rate. There is no tax benefit under Section 80C.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">The Regular Payout Inflation Dilemma</h4>
            <p>
              Many retirees depend on POMIS for monthly income because it is safe and regular. However, POMIS suffers from two structural flaws:
            </p>
            <p>
              1. <strong>Flat Income:</strong> The monthly payout is flat and does not grow. In 5 years, general prices will rise by ~28% (at 5% inflation), meaning your monthly ₹5,550 payout will buy only what ₹4,300 does today.
            </p>
            <p>
              2. <strong>Principal Decay:</strong> When the government returns your principal of ₹9 Lakhs at Year 5, it is nominal. Its actual purchasing power will have decayed to approximately ₹7 Lakhs today. Retaining capital entirely in POMIS results in a guaranteed loss of real purchasing power.
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
            POMIS Payout Calculation & Excel Replication
          </span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
        </button>
        
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">POMIS Interest Formula</h4>
              <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                <p>
                  <strong>Monthly Payout = (Deposit Amount × 7.40%) / 12</strong>
                </p>
                <p className="text-[10px] text-muted-grey">
                  Note: Statutory limits are ₹9 Lakhs for single accounts and ₹15 Lakhs for joint accounts. Lock-in tenure is 5 years.
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
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Monthly Income Payout</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=(Deposit * 7.40%) / 12</td>
                  </tr>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Real Principal Value at Year 5</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Deposit / ((1 + {inflation}%))^5</td>
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
