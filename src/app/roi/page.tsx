"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TrendingUp, Info, HelpCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function RoiCalculator() {
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [finalValue, setFinalValue] = useState(150000);
  const [years, setYears] = useState(3);
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
    const initial = Math.max(0.0001, initialInvestment);
    const final = Math.max(0, finalValue);
    const y = Math.max(0.1, years);
    const infRate = inflation / 100;

    // Calculations
    const absoluteReturn = ((final - initial) / initial) * 100;
    const cagr = (Math.pow(final / initial, 1 / y) - 1) * 100;

    // Inflation Adjusted
    const realFinal = final / Math.pow(1 + infRate, y);
    const realAbsoluteReturn = ((realFinal - initial) / initial) * 100;
    const realCagr = (Math.pow(realFinal / initial, 1 / y) - 1) * 100;

    // Generate Chart Data: show growth from initial to final value
    // Year 0 is initial investment
    for (let yr = 0; yr <= Math.ceil(y); yr++) {
      const fraction = yr / y;
      // Interpolate nominal value based on CAGR
      const nominalVal = initial * Math.pow(1 + cagr / 100, yr);
      const realVal = nominalVal / Math.pow(1 + infRate, yr);

      data.push({
        year: `Yr ${yr}`,
        "Nominal Growth": Math.round(nominalVal),
        "Real Growth": Math.round(realVal)
      });
    }

    return {
      absoluteReturn: absoluteReturn.toFixed(2),
      cagr: cagr.toFixed(2),
      realFinal: Math.round(realFinal),
      realAbsoluteReturn: realAbsoluteReturn.toFixed(2),
      realCagr: realCagr.toFixed(2),
      inflationLoss: Math.round(final - realFinal),
      chartData: data
    };
  }, [initialInvestment, finalValue, years, inflation]);

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
            <TrendingUp className="text-emerald" />
            ROI & CAGR Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Analyze absolute Return on Investment (ROI) and Compound Annual Growth Rate (CAGR) with real inflation adjustments.
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
            <h2 className="text-lg font-bold text-white">Return Settings</h2>

            {/* Initial Investment */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Initial Investment</span>
                <NumericInput
                  value={initialInvestment}
                  onChange={setInitialInvestment}
                  min={1}
                  max={500000000}
                  step={1000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={10000}
                max={1000000}
                step={10000}
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Final Value */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Final Maturity / Current Value</span>
                <NumericInput
                  value={finalValue}
                  onChange={setFinalValue}
                  min={0}
                  max={1000000000}
                  step={1000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={10000}
                max={2000000}
                step={20000}
                value={finalValue}
                onChange={(e) => setFinalValue(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Time Period (Years) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Holding Period (Years)</span>
                <NumericInput
                  value={years}
                  onChange={setYears}
                  min={0.1}
                  max={50}
                  step={0.1}
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
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the final value by inflation rate to show real growth."><HelpCircle size={14} /></span>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Nominal ROI</span>
              <p className="text-lg font-bold text-white mt-1">
                {calculations.absoluteReturn}%
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Absolute Gain</span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Nominal CAGR</span>
              <p className="text-lg font-bold text-emerald mt-1">
                {calculations.cagr}%
              </p>
              <span className="text-[9px] text-emerald block mt-0.5">Annualized Return</span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Real ROI (Post-Inflation)</span>
              <p className="text-lg font-bold text-white mt-1">
                {adjustInflation ? `${calculations.realAbsoluteReturn}%` : "—"}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Purchasing Power ROI</span>
            </div>

            <div className="p-4 rounded-xl border border-emerald/20 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">Real CAGR</span>
              <p className="text-lg font-bold text-white mt-1">
                {adjustInflation ? `${calculations.realCagr}%` : "—"}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Annualized Real Yield</span>
            </div>
          </div>

          {/* Details callout */}
          {adjustInflation && (
            <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-amber-500 mr-1">⚠️ Inflation Erosion:</span>
              While your nominal investment grew from <strong>{formatCurrency(initialInvestment)}</strong> to <strong>{formatCurrency(finalValue)}</strong>, inflation took away <strong>{formatCurrency(calculations.inflationLoss)}</strong> of its purchasing power. The real maturity value of your returns is worth <strong>{formatCurrency(calculations.realFinal)}</strong> in today&apos;s money.
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Growth Curve (Nominal vs. Real)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="roiColorNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="roiColorReal" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="Nominal Growth"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#roiColorNominal)"
                    strokeWidth={2}
                  />
                  {adjustInflation && (
                    <Area
                      type="monotone"
                      dataKey="Real Growth"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#roiColorReal)"
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Inflation Masterclass Educational Section */}
      <section className="p-6 md:p-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-navy-card/60 to-emerald/5 space-y-6">
        <div className="flex items-center gap-3 border-b border-border-navy/60 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-xl shrink-0">
            🔥
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              Why Inflation Matters & Why ValarchiX Is Different
            </h3>
            <p className="text-xs text-muted-grey">
              Understand the silent killer of wealth with a simple real-world example.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-xs text-muted-grey">
          <div className="p-4 rounded-xl border border-border-navy bg-navy-bg/60 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span>☕ The ₹100 Coffee Example</span>
            </div>
            <p className="leading-relaxed">
              If a cup of coffee costs <strong>₹100 today</strong>, at a <strong>6% annual inflation rate</strong>, that exact same cup will cost <strong>₹179 in 10 years</strong> and <strong>₹320 in 20 years</strong>.
            </p>
            <p className="text-amber-400 font-semibold pt-1">
              Prices double roughly every 12 years at 6% inflation!
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border-navy bg-navy-bg/60 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span>📉 The Silent Wealth Erosion</span>
            </div>
            <p className="leading-relaxed">
              If your money earns <strong>7% in an FD</strong>, but inflation is <strong>6%</strong> and income tax takes <strong>30%</strong> (2.1%), your real return is <strong>-1.1% per year</strong>! You lose purchasing power every day.
            </p>
            <p className="text-red-400 font-semibold pt-1">
              Nominal gains create the illusion of wealth while real purchasing power shrinks.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald/30 bg-emerald/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald font-extrabold text-sm">
              <span>💡 The ValarchiX Edge</span>
            </div>
            <p className="leading-relaxed text-light-grey">
              Standard commercial calculators only show <strong>nominal paper gains</strong> to make investments look pretty.
            </p>
            <p className="text-emerald font-semibold pt-1 leading-relaxed">
              ValarchiX calculates <strong>Real CAGR & Real Purchasing Power</strong> using live inflation data so you know what your money will <em>actually</em> buy!
            </p>
          </div>
        </div>
      </section>

      {/* Guide */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          ROI vs. CAGR & Real Returns Explained
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Absolute Return (ROI) vs. CAGR</h4>
            <p>
              <strong>Return on Investment (ROI):</strong> Also known as absolute return, this measures the total percentage increase of your investment from start to finish. It completely ignores time. A 50% absolute return looks identical whether it took 2 years or 10 years.
            </p>
            <p>
              <strong>Compound Annual Growth Rate (CAGR):</strong> This calculates the geometric annualized rate of growth. It tells you the exact yearly rate at which your initial investment would have compounded if it grew at a steady, smooth rate over the holding period. It is the gold standard for comparing investments of different durations (e.g. mutual funds vs bonds).
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Why Nominal ROI Lies to You</h4>
            <p>
              Inflation is the silent tax that reduces what your future currency can actually buy. If your mutual fund portfolio earns a CAGR of 12% over 5 years, but inflation averages 5% over the same period, your real wealth is growing at only <strong>6.67%</strong> annually ($1.12 / 1.05 - 1$).
            </p>
            <p>
              Always discount nominal yields by inflation to calculate your <strong>Real CAGR</strong>. This is the only figure that represents your true growth in purchasing power.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
