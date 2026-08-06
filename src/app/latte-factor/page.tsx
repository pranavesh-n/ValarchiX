"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Coffee, TrendingUp, ChevronDown, HelpCircle, AlertTriangle } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function LatteFactorCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dailySpend, setDailySpend] = useState(150);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [years, setYears] = useState(20);
  const [returnRate, setReturnRate] = useState(12);
  const [inflation, setInflation] = useState(5.09);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

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

  const { chartData, totalSpent, totalIfInvested, opportunityCost, nominalSpent, nominalIfInvested } = useMemo(() => {
    const multiplier = frequency === "daily" ? 365 : frequency === "weekly" ? 52 : 12;
    const annualSpend = dailySpend * multiplier;
    const monthlySpend = annualSpend / 12;
    const r = returnRate / 100 / 12;
    const infRate = inflation / 100;

    let chartData = [];
    let runningInvested = 0;
    let runningSpent = 0;

    for (let y = 1; y <= years; y++) {
      runningSpent = annualSpend * y;
      const n = y * 12;
      runningInvested = r > 0 ? monthlySpend * ((Math.pow(1 + r, n) - 1) / r) : monthlySpend * n;

      const realSpent = runningSpent / Math.pow(1 + infRate, y);
      const realInvested = runningInvested / Math.pow(1 + infRate, y);

      chartData.push({
        year: `Yr ${y}`,
        "If Spent": Math.round(adjustInflation ? realSpent : runningSpent),
        "If Invested": Math.round(adjustInflation ? realInvested : runningInvested),
      });
    }

    const nominalSpent = annualSpend * years;
    const nominalIfInvested = r > 0 ? monthlySpend * ((Math.pow(1 + r, years * 12) - 1) / r) : monthlySpend * years * 12;

    const totalSpent = adjustInflation ? (nominalSpent / Math.pow(1 + infRate, years)) : nominalSpent;
    const totalIfInvested = adjustInflation ? (nominalIfInvested / Math.pow(1 + infRate, years)) : nominalIfInvested;

    return {
      chartData,
      totalSpent,
      totalIfInvested,
      opportunityCost: totalIfInvested - totalSpent,
      nominalSpent,
      nominalIfInvested
    };
  }, [dailySpend, frequency, years, returnRate, inflation, adjustInflation]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  const fmtShort = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
    return fmt(v);
  };

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Coffee className="text-emerald" />
            Latte Factor Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Small recurring spends silently destroy long-term wealth. See exactly how much your daily habits cost you — and what they could have become.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-6">
            <h2 className="text-lg font-bold text-white">Your Daily Habit</h2>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Spend Amount (₹)</span>
                <NumericInput value={dailySpend} onChange={setDailySpend} min={10} max={10000} step={10} type="currency" />
              </div>
              <input type="range" min={10} max={2000} step={10} value={dailySpend}
                onChange={(e) => setDailySpend(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
              <div className="flex justify-between text-[10px] text-muted-grey"><span>₹10</span><span>₹2,000</span></div>
            </div>

            <div className="space-y-2 border-t border-border-navy/60 pt-4">
              <label className="text-xs font-semibold text-muted-grey block">Frequency</label>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                {(["daily", "weekly", "monthly"] as const).map((f) => (
                  <button key={f} onClick={() => setFrequency(f)}
                    className={`p-2.5 rounded-lg border text-center capitalize transition-all cursor-pointer ${frequency === f ? "bg-emerald/10 border-emerald text-white" : "bg-navy-bg/40 border-border-navy text-muted-grey hover:text-white"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-border-navy/60 pt-4">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Period (Years)</span>
                <NumericInput value={years} onChange={setYears} min={1} max={50} step={1} type="years" />
              </div>
              <input type="range" min={1} max={40} step={1} value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
              <div className="flex justify-between text-[10px] text-muted-grey"><span>1 yr</span><span>40 yrs</span></div>
            </div>

            <div className="space-y-2 border-t border-border-navy/60 pt-4">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Expected Return Rate</span>
                <NumericInput value={returnRate} onChange={setReturnRate} min={1} max={50} step={0.5} type="percent" />
              </div>
              <input type="range" min={4} max={20} step={0.5} value={returnRate}
                onChange={(e) => setReturnRate(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
              <div className="flex justify-between text-[10px] text-muted-grey"><span>4%</span><span>20%</span></div>
              <p className="text-[9.5px] text-muted-grey">Historical Nifty 50 CAGR ≈ 12–14%</p>
            </div>

            {/* Inflation Toggle */}
            <div className="space-y-2 border-t border-border-navy/60 pt-4 flex items-center justify-between">
              <label htmlFor="adjust-inflation" className="text-xs font-semibold text-muted-grey cursor-pointer flex items-center gap-1">
                Adjust for Inflation
                <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the future value by the inflation rate to show today's purchasing power."><HelpCircle size={12} /></span>
              </label>
              <input
                id="adjust-inflation"
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
                className="w-4 h-4 accent-emerald cursor-pointer rounded"
              />
            </div>

            {adjustInflation && (
              <div className="space-y-2 border-t border-border-navy/60 pt-4 animate-fadeIn">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Expected Inflation Rate</span>
                  <NumericInput value={inflation} onChange={setInflation} min={0} max={25} step={0.1} type="percent" />
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={0.1}
                  value={inflation}
                  onChange={(e) => setInflation(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-grey">
                  <span>2%</span>
                  <span>15%</span>
                </div>
                <button
                  onClick={() => setInflation(rates.inflationRate)}
                  className="text-[9px] text-left text-emerald/80 hover:text-emerald block mt-1 hover:underline cursor-pointer animate-fadeIn"
                >
                  CPI Inflation Baseline ({rates.inflationRate}%)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">
                {adjustInflation ? "Total Spent (Real)" : "Total Spent"}
              </span>
              <p className="text-lg font-bold text-red-400 mt-1">{fmtShort(totalSpent)}</p>
              <span className="text-[9px] text-muted-grey block mt-0.5">
                {adjustInflation ? `Nominal: ${fmtShort(nominalSpent)}` : `Over ${years} years`}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-emerald block">
                {adjustInflation ? "If Invested (Real)" : "If Invested Instead"}
              </span>
              <p className="text-lg font-bold text-emerald glow-emerald mt-1">{fmtShort(totalIfInvested)}</p>
              <span className="text-[9px] text-muted-grey block mt-0.5">
                {adjustInflation ? `Nominal: ${fmtShort(nominalIfInvested)}` : `At ${returnRate}% CAGR`}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">
                {adjustInflation ? "Opportunity Cost (Real)" : "Opportunity Cost"}
              </span>
              <p className="text-lg font-bold text-amber-400 mt-1">{fmtShort(opportunityCost)}</p>
              <span className="text-[9px] text-muted-grey block mt-0.5">
                {adjustInflation ? "Purchasing power lost" : "Wealth you gave up"}
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Spend vs Invest — {years}-Year Trajectory {adjustInflation ? "(Adjusted for Inflation)" : "(Nominal)"}
            </h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="invested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} interval={Math.floor(years / 5)} />
                  <YAxis tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} width={75} tickFormatter={(v) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="If Invested" stroke="#22c55e" fill="url(#invested)" strokeWidth={2} />
                  <Area type="monotone" dataKey="If Spent" stroke="#ef4444" fill="url(#spent)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Education */}
          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" /> The Latte Factor — David Bach&apos;s Core Insight
            </h3>
            <p className="text-xs text-muted-grey leading-relaxed">
              Financial author David Bach coined the &quot;Latte Factor&quot; to illustrate how <strong className="text-white">small, mindless recurring expenses</strong> — a daily coffee, a cigarette pack, an impulse snack — silently drain massive wealth over decades. The issue is not the spend itself, but the <strong className="text-white">compounding you sacrifice</strong> by not investing that amount instead.
            </p>
            <p className="text-[11px] text-muted-grey/80">
              A ₹150 daily coffee habit (₹54,750/year) invested at 12% CAGR for 30 years becomes <strong className="text-white">over ₹1.5 Crore</strong>. You are not just spending ₹150 — you are spending your future ₹1.5 Cr.
            </p>
          </div>
        </div>
      </div>

      {/* Audit */}
      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button onClick={() => setShowAudit(!showAudit)} className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer">
          <span className="flex items-center gap-1.5"><HelpCircle className="text-emerald" size={18} />How This is Calculated</span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
        </button>
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-3 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="bg-navy-bg/50 p-3 rounded-xl font-mono space-y-1">
              <p>Annual Spend = Spend Amount × Frequency Multiplier</p>
              <p>Monthly Contribution = Annual Spend ÷ 12</p>
              <p>Future Value (SIP) = M × [(1 + r)^n − 1] / r</p>
              <p>where r = monthly rate, n = total months</p>
              {adjustInflation && <p>Inflation Adjusted Real Value = Future Value ÷ (1 + Inflation Rate)^years</p>}
              <p>Opportunity Cost = Future Value − Total Spent</p>
            </div>
            <p className="text-[10px] text-amber-500">⚠️ <strong>Disclaimer:</strong> Returns are illustrative. Actual market returns vary.</p>
          </div>
        )}
      </div>
    </div>
  );
}
