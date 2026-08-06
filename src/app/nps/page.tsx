"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TrendingUp, Info, HelpCircle, ChevronDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function NpsCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [currentAge, setCurrentAge] = useState(28);
  const [monthlyContribution, setMonthlyContribution] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(10); // Average of Equity (E) + Debt (C/G) NPS allocations
  const [annuityRatio, setAnnuityRatio] = useState(40); // Statutory minimum is 40%
  const [annuityYield, setAnnuityYield] = useState(6.0); // Safe annuity interest rate
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

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
    const preRetireYears = Math.max(1, 60 - currentAge);
    const r = expectedReturn / 100;
    const monthlyRate = r / 12;
    const infRate = inflation / 100;
    const totalMonths = preRetireYears * 12;

    let accumulatedCorpus = 0;
    let totalInvested = 0;

    for (let y = 1; y <= preRetireYears; y++) {
      const months = y * 12;
      // Future Value of monthly ordinary annuity
      const fv = monthlyContribution * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
      const invested = monthlyContribution * months;
      
      // Inflation adjusted value (purchasing power in today's rupees)
      const realFv = fv / Math.pow(1 + infRate, y);

      accumulatedCorpus = fv;
      totalInvested = invested;

      data.push({
        year: `Age ${currentAge + y}`,
        "Principal Invested": invested,
        "NPS Corpus": Math.round(fv),
        "Inflation Adjusted": Math.round(realFv)
      });
    }

    // Split at age 60
    const annuityCorpus = accumulatedCorpus * (annuityRatio / 100);
    const lumpSumCorpus = accumulatedCorpus * (1 - annuityRatio / 100);

    // Monthly Pension = (Annuity Corpus * Annuity Yield) / 12
    const monthlyPension = (annuityCorpus * (annuityYield / 100)) / 12;
    
    // Inflation adjusted monthly pension
    const realPension = monthlyPension / Math.pow(1 + infRate, preRetireYears);

    return {
      totalInvested,
      accumulatedCorpus: Math.round(accumulatedCorpus),
      lumpSumCorpus: Math.round(lumpSumCorpus),
      annuityCorpus: Math.round(annuityCorpus),
      monthlyPension: Math.round(monthlyPension),
      realPension: Math.round(realPension),
      years: preRetireYears,
      chartData: data
    };
  }, [currentAge, monthlyContribution, expectedReturn, annuityRatio, annuityYield, inflation]);

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
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="text-emerald" />
            NPS Calculator (National Pension System)
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate monthly retirement corpus accumulation, lump sum withdrawals, and regular annuity pensions.
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

            {/* Current Age Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Your Current Age</span>
                <NumericInput
                  value={currentAge}
                  onChange={setCurrentAge}
                  min={18}
                  max={59}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={18}
                max={59}
                step={1}
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>18 Yrs</span>
                <span>NPS retirement is at Age 60</span>
              </div>
            </div>

            {/* Monthly Contribution Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Monthly NPS Contribution</span>
                <NumericInput
                  value={monthlyContribution}
                  onChange={setMonthlyContribution}
                  min={500}
                  max={10000000}
                  step={500}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={1000}
                max={150000}
                step={1000}
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹1K</span>
                <span>₹1.5L / Mo</span>
              </div>
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Expected Return Rate (p.a.)</span>
                <NumericInput
                  value={expectedReturn}
                  onChange={setExpectedReturn}
                  min={1}
                  max={50}
                  step={0.1}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={5}
                max={15}
                step={0.5}
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>5% (Debt blend)</span>
                <span>15% (Equity heavy)</span>
              </div>
            </div>

            {/* Annuity Ratio Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Annuity Purchase Ratio</span>
                <NumericInput
                  value={annuityRatio}
                  onChange={setAnnuityRatio}
                  min={40}
                  max={100}
                  step={1}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={40} // 40% is statutory minimum
                max={100}
                step={5}
                value={annuityRatio}
                onChange={(e) => setAnnuityRatio(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>40% (Statutory Min)</span>
                <span>100% (Full Pension)</span>
              </div>
            </div>

            {/* Expected Annuity Yield */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Expected Annuity Yield (p.a.)</span>
                <NumericInput
                  value={annuityYield}
                  onChange={setAnnuityYield}
                  min={1}
                  max={25}
                  step={0.1}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={4}
                max={8}
                step={0.1}
                value={annuityYield}
                onChange={(e) => setAnnuityYield(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>4%</span>
                <span>8%</span>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust Pension for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the monthly pension by inflation rate to show real purchasing power."><HelpCircle size={14} /></span>
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

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Accumulated Corpus</span>
              <p className="text-lg font-bold text-white mt-1">
                {formatCurrency(calculations.accumulatedCorpus)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">60% Tax-Free Lump Sum</span>
              <p className="text-lg font-bold text-emerald mt-1">
                {formatCurrency(calculations.lumpSumCorpus)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Annuity Reinvestment</span>
              <p className="text-lg font-bold text-white mt-1">
                {formatCurrency(calculations.annuityCorpus)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">
                {adjustInflation ? "Real Monthly Pension" : "Nominal Monthly Pension"}
              </span>
              <p className="text-lg font-bold text-amber-500 mt-1">
                {formatCurrency(adjustInflation ? calculations.realPension : calculations.monthlyPension)} / Mo
              </p>
            </div>
          </div>

          {/* Chart Display */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              NPS Wealth Accumulation Curve (Age {currentAge} to 60)
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 15, left: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="NPS Corpus"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorCorpus)"
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
              Educational Concept: NPS Annuity Rules
            </h3>
            <p className="text-xs text-muted-grey leading-relaxed">
              At age 60, NPS allows you to withdraw up to **60% of the corpus completely tax-free**. The remaining **40% must be reinvested in an Annuity Plan** with a registered insurance company. This annuity corpus yields a regular monthly interest payout (pension), which acts as a debt cushion during your retirement years, while the 60% lump sum can remain compounded in equities.
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
                  <h4 className="font-semibold text-white">NPS Compounding & Annuity Payout Formulation</h4>
                  <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                    <p>
                      <strong>Accumulated NPS Corpus (Future Value):</strong>
                      <br />
                      Corpus = P * [ ((1 + i)^n - 1) / i ] * (1 + i)
                      <br />
                      <span className="text-[10px] text-muted-grey">where: P = monthly contribution, i = monthly return rate (expected_return / 12), n = monthly installments ((60 - age) * 12).</span>
                    </p>
                    <p>
                      <strong>Lump Sum Withdrawal (Tax-Free 60%):</strong>
                      <br />
                      Lump_Sum = Corpus * (1 - annuity_ratio / 100)
                    </p>
                    <p>
                      <strong>Annuity Corpus (40% Minimum Reinvestment):</strong>
                      <br />
                      Annuity_Corpus = Corpus * (annuity_ratio / 100)
                    </p>
                    <p>
                      <strong>Estimated Monthly Pension:</strong>
                      <br />
                      Monthly Pension = Annuity_Corpus * (annuity_yield / 100) / 12
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel Replication (Audit Script)</h4>
                  <p>To replicate this NPS model in Excel or Google Sheets, use the following cell formulas:</p>
                  <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                    <thead>
                      <tr className="bg-navy-bg/60">
                        <th className="border border-border-navy/80 p-2 text-left">Calculation</th>
                        <th className="border border-border-navy/80 p-2 text-left">Excel / Sheets Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Accumulated Corpus at age 60</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=-FV({expectedReturn}%/12, (60-{currentAge})*12, {monthlyContribution}, 0, 1)</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Annuity Payout (Per Month)</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">= (Corpus * {annuityRatio}% * {annuityYield}%) / 12</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This tool is an educational retirement planning model. It does not provide SEBI-registered investment advice or guarantee annuity rate returns.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
