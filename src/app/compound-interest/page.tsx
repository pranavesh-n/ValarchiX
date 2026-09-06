"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ChevronDown, HelpCircle, Zap } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function CompoundInterestCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [principal, setPrincipal] = useState(100000);
  const [annualTopUp, setAnnualTopUp] = useState(0);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(20);
  const [compounding, setCompounding] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [inflation, setInflation] = useState(7);
  const [adjustInflation, setAdjustInflation] = useState(true);

  useEffect(() => setMounted(true), []);

  const { chartData, finalValue, totalInvested, wealthGained, finalNominalValue } = useMemo(() => {
    const n = compounding === "monthly" ? 12 : compounding === "quarterly" ? 4 : 1;
    const r = rate / 100;
    const infRate = inflation / 100;
    let corpus = principal;
    let totalInvested = principal;
    const chartData = [];

    for (let y = 1; y <= years; y++) {
      corpus = corpus * Math.pow(1 + r / n, n);
      if (annualTopUp > 0 && y < years) {
        corpus += annualTopUp;
        totalInvested += annualTopUp;
      }
      
      const realValue = corpus / Math.pow(1 + infRate, y);

      chartData.push({
        year: `Yr ${y}`,
        "Corpus Value (Nominal)": Math.round(corpus),
        "Corpus Value (Real)": Math.round(realValue),
        "Amount Invested": Math.round(totalInvested),
      });
    }

    const finalNominal = Math.round(corpus);
    const finalReal = Math.round(corpus / Math.pow(1 + infRate, years));
    const finalValue = adjustInflation ? finalReal : finalNominal;

    return {
      chartData,
      finalValue,
      totalInvested,
      wealthGained: Math.round(finalValue - totalInvested),
      finalNominalValue: finalNominal,
    };
  }, [principal, annualTopUp, rate, years, compounding, inflation, adjustInflation]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
  const fmtL = (v: number) =>
    v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : fmt(v);

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="text-emerald" /> Compound Interest Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Watch your money grow exponentially. Compound interest is the 8th wonder of the world — the longer you wait, the harder it works.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 p-6 glass-card space-y-6">
          <h2 className="text-lg font-bold text-white">Inputs</h2>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-grey">Initial Investment</span>
              <NumericInput value={principal} onChange={setPrincipal} min={1000} max={100000000} step={10000} type="currency" />
            </div>
            <input type="range" min={1000} max={5000000} step={10000} value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-grey">Annual Top-Up</span>
              <NumericInput value={annualTopUp} onChange={setAnnualTopUp} min={0} max={10000000} step={10000} type="currency" />
            </div>
            <input type="range" min={0} max={1000000} step={10000} value={annualTopUp} onChange={(e) => setAnnualTopUp(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
            <p className="text-[9.5px] text-muted-grey">Additional lump sum added each year</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Annual Rate (%)</span>
              <NumericInput value={rate} onChange={setRate} min={1} max={50} step={0.5} type="percent" />
            </div>
            <input type="range" min={1} max={25} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Time Period</span>
              <NumericInput value={years} onChange={setYears} min={1} max={50} step={1} type="years" />
            </div>
            <input type="range" min={1} max={50} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          <div className="space-y-2 border-t border-border-navy/60 pt-4">
            <label className="text-xs font-semibold text-muted-grey block">Compounding Frequency</label>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
              {(["monthly", "quarterly", "yearly"] as const).map((c) => (
                <button key={c} onClick={() => setCompounding(c)}
                  className={`p-2 rounded-lg border text-center capitalize transition-all cursor-pointer ${compounding === c ? "bg-emerald/10 border-emerald text-white" : "bg-navy-bg/40 border-border-navy text-muted-grey hover:text-white"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-border-navy/60 pt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="adjust-inflation" className="text-xs font-semibold text-muted-grey cursor-pointer">Adjust for Inflation</label>
              <input
                id="adjust-inflation"
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
                className="w-4 h-4 accent-emerald cursor-pointer"
              />
            </div>
            {adjustInflation && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Inflation Rate (%)</span>
                  <NumericInput value={inflation} onChange={setInflation} min={0} max={25} step={0.5} type="percent" className="text-red-400 focus-within:border-red-400/50" />
                </div>
                <input type="range" min={2} max={15} step={0.5} value={inflation} onChange={(e) => setInflation(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Invested</span>
              <p className="text-lg font-bold text-white mt-1">{fmtL(totalInvested)}</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald/40 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">{adjustInflation ? "Real Wealth Gained" : "Nominal Wealth Gained"}</span>
              <p className="text-lg font-bold text-emerald glow-emerald mt-1">{fmtL(wealthGained)}</p>
            </div>
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">{adjustInflation ? "Real Final Value" : "Nominal Final Value"}</span>
              <p className="text-lg font-bold text-white mt-1">{fmtL(finalValue)}</p>
              {adjustInflation && <span className="text-[9px] text-muted-grey block mt-0.5">Nominal: {fmtL(finalNominalValue)}</span>}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Growth Curve — {years} Years ({adjustInflation ? "Adjusted for Inflation" : "Nominal Value"})</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="corpus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="invested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b8cba" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6b8cba" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} interval={Math.floor(years / 6)} />
                  <YAxis tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} tickFormatter={(v) => v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : `${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey={adjustInflation ? "Corpus Value (Real)" : "Corpus Value (Nominal)"} stroke="#22c55e" fill="url(#corpus)" strokeWidth={2.5} name={adjustInflation ? "Real Value" : "Nominal Value"} />
                  <Area type="monotone" dataKey="Amount Invested" stroke="#6b8cba" fill="url(#invested)" strokeWidth={1.5} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-emerald/20 bg-emerald/5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Zap size={15} className="text-emerald" /> The Rule of 72</h3>
            <p className="text-xs text-muted-grey leading-relaxed">
              Divide <strong className="text-white">72 by your annual return rate</strong> to estimate how many years it takes to double your money.
              At {rate}% your money doubles every <strong className="text-emerald">{(72 / rate).toFixed(1)} years</strong>.
            </p>
            <p className="text-[11px] text-muted-grey/80">
              The critical insight: frequency of compounding matters. ₹1L at 12% compounded <strong className="text-white">monthly</strong> beats the same rate compounded yearly by a meaningful margin over decades — interest earns interest on itself more frequently.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button onClick={() => setShowAudit(!showAudit)} className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer">
          <span className="flex items-center gap-1.5"><HelpCircle className="text-emerald" size={18} />Formula & Excel Replication</span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
        </button>
        {showAudit && (
          <div className="text-xs text-muted-grey pt-4 border-t border-border-navy/60 animate-fadeIn space-y-2">
            <div className="bg-navy-bg/50 p-3 rounded-xl font-mono space-y-1">
              <p>A = P × (1 + r/n)^(n×t)</p>
              <p>where: P = Principal, r = annual rate, n = compounding periods/year, t = years</p>
              <p>Excel: =FV(rate/n, n*years, 0, -principal)</p>
            </div>
            <p className="text-[10px] text-amber-500">⚠️ <strong>Disclaimer:</strong> Illustrative returns. Actual market returns fluctuate.</p>
          </div>
        )}
      </div>
    </div>
  );
}
