"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart2, ChevronDown, HelpCircle, TrendingDown } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function InflationCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState(1000000);
  const [inflation, setInflation] = useState(7);
  const [investReturn, setInvestReturn] = useState(10);
  const [years, setYears] = useState(20);

  useEffect(() => setMounted(true), []);

  const { chartData, futureValueNominal, purchasingPowerFuture, sipNeeded } = useMemo(() => {
    const chartData = [];
    let nominalValue = amount;
    let realValue = amount;

    for (let y = 1; y <= years; y++) {
      nominalValue = nominalValue; // money in hand doesn't grow
      realValue = amount / Math.pow(1 + inflation / 100, y);
      const investedGrowth = amount * Math.pow(1 + investReturn / 100, y);
      chartData.push({
        year: `Yr ${y}`,
        "Cash Value (Inflation Eroded)": Math.round(realValue),
        "Invested Value": Math.round(investedGrowth),
      });
    }

    const futureValueNominal = amount;
    const purchasingPowerFuture = Math.round(amount / Math.pow(1 + inflation / 100, years));

    // SIP needed to maintain purchasing power of `amount` after `years`
    const targetCorpus = amount * Math.pow(1 + inflation / 100, years);
    const r = investReturn / 100 / 12;
    const n = years * 12;
    const sipNeeded = r > 0 ? Math.round(targetCorpus * r / (Math.pow(1 + r, n) - 1)) : Math.round(targetCorpus / n);

    return { chartData, futureValueNominal, purchasingPowerFuture, sipNeeded };
  }, [amount, inflation, investReturn, years]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
  const fmtL = (v: number) =>
    v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : fmt(v);

  const erosionPct = (((amount - purchasingPowerFuture) / amount) * 100).toFixed(1);

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="text-emerald" /> Inflation Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Inflation silently steals purchasing power. See how much your money is really worth in the future — and what you must invest to stay ahead.
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
              <span className="text-muted-grey">Amount Today</span>
              <NumericInput value={amount} onChange={setAmount} min={10000} max={100000000} step={50000} type="currency" />
            </div>
            <input type="range" min={10000} max={10000000} step={50000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Inflation Rate (%)</span>
              <NumericInput value={inflation} onChange={setInflation} min={0} max={25} step={0.1} type="percent" className="text-red-400 focus-within:border-red-400/50" />
            </div>
            <input type="range" min={2} max={15} step={0.1} value={inflation} onChange={(e) => setInflation(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
            <p className="text-[9.5px] text-muted-grey">India CPI inflation averages ~5–6%</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Investment Return (%)</span>
              <NumericInput value={investReturn} onChange={setInvestReturn} min={1} max={50} step={0.5} type="percent" />
            </div>
            <input type="range" min={4} max={20} step={0.5} value={investReturn} onChange={(e) => setInvestReturn(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Years</span>
              <NumericInput value={years} onChange={setYears} min={1} max={50} step={1} type="years" />
            </div>
            <input type="range" min={1} max={40} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          {/* SIP to beat inflation */}
          <div className="p-3 rounded-xl border border-emerald/30 bg-emerald/5 space-y-1">
            <p className="text-[10px] font-bold text-emerald uppercase">Monthly SIP to Preserve Value</p>
            <p className="text-xl font-extrabold text-emerald glow-emerald">{fmt(sipNeeded)}</p>
            <p className="text-[9px] text-muted-grey">To maintain {fmtL(amount)} of purchasing power at {inflation}% inflation</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Money Today</span>
              <p className="text-lg font-bold text-white mt-1">{fmtL(amount)}</p>
              <span className="text-[9px] text-muted-grey">Nominal value</span>
            </div>
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
              <span className="text-[10px] uppercase font-bold text-red-400 block">Real Value in {years}Y</span>
              <p className="text-lg font-bold text-red-400 mt-1">{fmtL(purchasingPowerFuture)}</p>
              <span className="text-[9px] text-muted-grey">Purchasing power lost: {erosionPct}%</span>
            </div>
            <div className="p-4 rounded-xl border border-emerald/30 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">If Invested at {investReturn}%</span>
              <p className="text-lg font-bold text-emerald glow-emerald mt-1">{fmtL(chartData[years - 1]?.["Invested Value"] ?? 0)}</p>
              <span className="text-[9px] text-muted-grey">Beats inflation</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Purchasing Power Erosion vs. Investment Growth</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="cash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="invest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} interval={Math.floor(years / 6)} />
                  <YAxis tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} tickFormatter={(v) => v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : `${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Invested Value" stroke="#22c55e" fill="url(#invest)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Cash Value (Inflation Eroded)" stroke="#ef4444" fill="url(#cash)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><TrendingDown size={15} className="text-red-400" /> Why Holding Cash is a Slow Financial Suicide</h3>
            <p className="text-xs text-muted-grey leading-relaxed">
              Inflation at 6% means prices double every ~12 years. A ₹1 Lakh kept in a savings account (earning 3%) <strong className="text-white">loses real value every single day</strong>. The only way to preserve and grow purchasing power is by investing in assets that <strong className="text-white">return more than the inflation rate</strong> — ideally equities, which historically return 12–15% in India.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
              {[
                { asset: "Savings Account", ret: "~3%", beat: false },
                { asset: "Fixed Deposit", ret: "~7%", beat: inflation <= 7 },
                { asset: "Nifty 50 Index", ret: "~12%", beat: true },
              ].map((a) => (
                <div key={a.asset} className={`p-2.5 rounded-lg border ${a.beat ? "border-emerald/30 bg-emerald/5" : "border-red-500/30 bg-red-500/5"}`}>
                  <p className="font-bold text-white">{a.asset}</p>
                  <p className="text-muted-grey">{a.ret}</p>
                  <p className={a.beat ? "text-emerald" : "text-red-400"}>{a.beat ? "✅ Beats inflation" : "❌ Loses to inflation"}</p>
                </div>
              ))}
            </div>
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
              <p>Real Value = Nominal Amount ÷ (1 + inflation%)^years</p>
              <p>Investment Value = Amount × (1 + return%)^years</p>
              <p>SIP to Preserve = Target × r / [(1+r)^n − 1]</p>
              <p>where Target = Amount × (1 + inflation%)^years</p>
            </div>
            <p className="text-[10px] text-amber-500 mt-2">⚠️ <strong>Disclaimer:</strong> CPI inflation and investment returns vary annually. This is illustrative.</p>
          </div>
        )}
      </div>
    </div>
  );
}
