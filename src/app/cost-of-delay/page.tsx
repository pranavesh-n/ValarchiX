"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Clock, ChevronDown, HelpCircle, AlertTriangle } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function CostOfDelayCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [monthlySIP, setMonthlySIP] = useState(10000);
  const [rate, setRate] = useState(12);
  const [totalYears, setTotalYears] = useState(30);
  const [inflation, setInflation] = useState(6);
  const [adjustInflation, setAdjustInflation] = useState(true);

  useEffect(() => setMounted(true), []);

  const { chartData, scenarios } = useMemo(() => {
    const sipFV = (monthly: number, rateAnnual: number, years: number) => {
      const r = rateAnnual / 100 / 12;
      const n = years * 12;
      return r > 0 ? monthly * ((Math.pow(1 + r, n) - 1) / r) : monthly * n;
    };

    const delays = [0, 3, 5];
    const colors = ["#22c55e", "#f59e0b", "#ef4444"];
    const labels = ["Start Today", "Delay 3 Years", "Delay 5 Years"];

    const chartData: any[] = [];
    const infRate = inflation / 100;

    for (let y = 1; y <= totalYears; y++) {
      const entry: any = { year: `Yr ${y}` };
      delays.forEach((delay, i) => {
        const yearsInvesting = Math.max(0, y - delay);
        let val = yearsInvesting > 0 ? sipFV(monthlySIP, rate, yearsInvesting) : 0;
        if (adjustInflation) {
          val = val / Math.pow(1 + infRate, y);
        }
        entry[labels[i]] = Math.round(val);
      });
      chartData.push(entry);
    }

    const scenarios = delays.map((delay, i) => {
      const yearsActual = Math.max(0, totalYears - delay);
      const nominalCorpus = sipFV(monthlySIP, rate, yearsActual);
      const corpus = adjustInflation
        ? nominalCorpus / Math.pow(1 + infRate, totalYears)
        : nominalCorpus;
      
      const nominalInvested = monthlySIP * 12 * yearsActual;
      const invested = adjustInflation
        ? nominalInvested / Math.pow(1 + infRate, totalYears)
        : nominalInvested;

      const nominalTodayCorpus = sipFV(monthlySIP, rate, totalYears);
      const todayCorpus = adjustInflation
        ? nominalTodayCorpus / Math.pow(1 + infRate, totalYears)
        : nominalTodayCorpus;

      return {
        label: labels[i],
        color: colors[i],
        delay,
        corpus: Math.round(corpus),
        invested: Math.round(invested),
        wealthLost: i === 0 ? 0 : Math.round(todayCorpus - corpus),
        nominalCorpus: Math.round(nominalCorpus),
      };
    });

    return { chartData, scenarios };
  }, [monthlySIP, rate, totalYears, inflation, adjustInflation]);

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
            <Clock className="text-emerald" /> Cost of Delay Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Procrastination is the most expensive financial mistake. See exactly how much wealth you lose by waiting 3 or 5 years to start investing.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 p-6 glass-card space-y-6">
          <h2 className="text-lg font-bold text-white">Parameters</h2>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-grey">Monthly SIP</span>
              <NumericInput value={monthlySIP} onChange={setMonthlySIP} min={500} max={500000} step={500} type="currency" />
            </div>
            <input type="range" min={500} max={100000} step={500} value={monthlySIP} onChange={(e) => setMonthlySIP(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Expected CAGR (%)</span>
              <NumericInput value={rate} onChange={setRate} min={1} max={50} step={0.5} type="percent" />
            </div>
            <input type="range" min={6} max={20} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Total Horizon</span>
              <NumericInput value={totalYears} onChange={setTotalYears} min={1} max={50} step={1} type="years" />
            </div>
            <input type="range" min={10} max={45} step={1} value={totalYears} onChange={(e) => setTotalYears(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
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

          {/* Wealth lost callout */}
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase">Real Wealth Lost (3Y Delay)</p>
            <p className="text-xl font-extrabold text-red-400">{fmtL(scenarios[1].wealthLost)}</p>
            <p className="text-[9px] text-muted-grey">{adjustInflation ? "In today's purchasing power" : "Nominal value lost"}</p>
          </div>
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
            <p className="text-[10px] font-bold text-amber-400 uppercase">Real Wealth Lost (5Y Delay)</p>
            <p className="text-xl font-extrabold text-amber-400">{fmtL(scenarios[2].wealthLost)}</p>
            <p className="text-[9px] text-muted-grey">{adjustInflation ? "In today's purchasing power" : "Nominal value lost"}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Scenario Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {scenarios.map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
                <div className="w-2.5 h-2.5 rounded-full mb-2" style={{ background: s.color }} />
                <span className="text-[10px] uppercase font-bold text-muted-grey block">{s.label}</span>
                <p className="text-base font-bold mt-1" style={{ color: s.color }}>{fmtL(s.corpus)}</p>
                <span className="text-[9px] text-muted-grey block mt-0.5">Invested: {fmtL(s.invested)}</span>
                {s.wealthLost > 0 && <span className="text-[9px] text-red-400 block">−{fmtL(s.wealthLost)} vs starting today</span>}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Corpus Growth — 3 Scenarios</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="s0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="s1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="s2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} interval={Math.floor(totalYears / 6)} />
                  <YAxis tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} width={75} tickFormatter={(v) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Start Today" stroke="#22c55e" fill="url(#s0)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Delay 3 Years" stroke="#f59e0b" fill="url(#s1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Delay 5 Years" stroke="#ef4444" fill="url(#s2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><AlertTriangle size={15} className="text-amber-400" /> Why "I&apos;ll Start Next Year" is so Costly</h3>
            <p className="text-xs text-muted-grey leading-relaxed">
              The compounding curve is <strong className="text-white">non-linear</strong>. The majority of wealth is created in the <strong className="text-white">final years</strong> of a long investment horizon. Delaying by 3–5 years doesn&apos;t reduce your corpus by 10–15% — it can cut it by <strong className="text-white">30–50%</strong> because you lose the most powerful compounding years at the end.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button onClick={() => setShowAudit(!showAudit)} className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer">
          <span className="flex items-center gap-1.5"><HelpCircle className="text-emerald" size={18} />How This is Calculated</span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
        </button>
        {showAudit && (
          <div className="text-xs text-muted-grey pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="bg-navy-bg/50 p-3 rounded-xl font-mono space-y-1">
              <p>SIP FV = M × [(1+r)^n − 1] / r</p>
              <p>Each scenario uses the same SIP but starts later, reducing n (months)</p>
              <p>Wealth Lost = Corpus(Today) − Corpus(Delayed)</p>
            </div>
            <p className="text-[10px] text-amber-500 mt-2">⚠️ <strong>Disclaimer:</strong> Illustrative only. Actual returns vary with market conditions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
