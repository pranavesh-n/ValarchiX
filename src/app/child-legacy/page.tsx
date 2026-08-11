"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Baby, Info, ArrowUpRight, TrendingUp, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function ChildLegacyEngine() {
  const [currentAge, setCurrentAge] = useState(0);
  const [targetAge, setTargetAge] = useState(21);
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
  const [adjustEducationInflation, setAdjustEducationInflation] = useState(false);
  const [educationInflationRate, setEducationInflationRate] = useState(8.0);

  const [ppfRate, setPpfRate] = useState(7.1);
  const [ssyRate, setSsyRate] = useState(8.2);
  const [sipRate, setSipRate] = useState(13.0);

  const tenureYears = Math.max(1, targetAge - currentAge);

  const calculations = useMemo(() => {
    const data = [];
    const ppfMonthlyCap = 12500; // ₹1.5L / 12 months statutory limit
    const ppfMonthlyEffective = Math.min(monthlyInvestment, ppfMonthlyCap);

    let ppfCorpus = 0;
    let ssyCorpus = 0;
    let sipCorpus = 0;

    let ppfInvested = 0;
    let ssyInvested = 0;
    let sipInvested = 0;

    const ppfMonthlyRate = ppfRate / 100 / 12;
    const ssyMonthlyRate = ssyRate / 100 / 12;
    const sipMonthlyRate = sipRate / 100 / 12;

    for (let y = 1; y <= tenureYears; y++) {
      // Calculate month by month for each year
      for (let m = 1; m <= 12; m++) {
        // PPF
        ppfCorpus = (ppfCorpus + ppfMonthlyEffective) * (1 + ppfMonthlyRate);
        ppfInvested += ppfMonthlyEffective;

        // SSY
        ssyCorpus = (ssyCorpus + ppfMonthlyEffective) * (1 + ssyMonthlyRate);
        ssyInvested += ppfMonthlyEffective;

        // Equity SIP (no statutory cap)
        sipCorpus = (sipCorpus + monthlyInvestment) * (1 + sipMonthlyRate);
        sipInvested += monthlyInvestment;
      }

      const ageAtYear = currentAge + y;
      const infDiscount = adjustEducationInflation ? Math.pow(1 + educationInflationRate / 100, y) : 1;

      data.push({
        age: ageAtYear,
        yearLabel: `Age ${ageAtYear}`,
        PPF: Math.round(ppfCorpus / infDiscount),
        SSY: Math.round(ssyCorpus / infDiscount),
        SIP: Math.round(sipCorpus / infDiscount),
      });
    }

    const finalInfDiscount = adjustEducationInflation ? Math.pow(1 + educationInflationRate / 100, tenureYears) : 1;

    return {
      ppfFinal: Math.round(ppfCorpus / finalInfDiscount),
      ssyFinal: Math.round(ssyCorpus / finalInfDiscount),
      sipFinal: Math.round(sipCorpus / finalInfDiscount),
      ppfInvested: Math.round(ppfInvested),
      ssyInvested: Math.round(ssyInvested),
      sipInvested: Math.round(sipInvested),
      chartData: data,
    };
  }, [currentAge, targetAge, monthlyInvestment, adjustEducationInflation, educationInflationRate, ppfRate, ssyRate, sipRate, tenureYears]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald font-bold text-sm mb-1 uppercase tracking-wider">
            <Baby className="w-4 h-4" /> ValarchiX Child Legacy Engine
          </div>
          <h1 className="text-3xl font-extrabold text-heading tracking-tight">
            Child College & Future Legacy Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Head-to-head battle: PPF vs Sukanya Samriddhi (SSY) vs Equity SIP. See exactly how much corpus your child gets at release age.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3.5 py-1.5 rounded-full">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-6 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider border-b border-border-navy pb-3">
            <Baby className="w-4 h-4" /> Plan Inputs
          </div>

          {/* Child's Current Age */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Child&apos;s Current Age</span>
              <span className="text-heading font-bold">{currentAge} yrs</span>
            </div>
            <input
              type="range"
              min={0}
              max={17}
              step={1}
              value={currentAge}
              onChange={(e) => {
                const newAge = Number(e.target.value);
                setCurrentAge(newAge);
                if (newAge >= targetAge) setTargetAge(newAge + 1);
              }}
              className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Target Age (Corpus Release) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Target Age (Corpus Release)</span>
              <span className="text-heading font-bold">{targetAge} yrs</span>
            </div>
            <input
              type="range"
              min={currentAge + 1}
              max={30}
              step={1}
              value={targetAge}
              onChange={(e) => setTargetAge(Number(e.target.value))}
              className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Monthly Investment Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Monthly Investment</span>
              <NumericInput value={monthlyInvestment} onChange={setMonthlyInvestment} min={500} max={500000} step={1000} type="currency" />
            </div>
            <input
              type="range"
              min={1000}
              max={100000}
              step={1000}
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
            />
            {monthlyInvestment > 12500 && (
              <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle size={11} /> PPF & SSY capped at ₹12,500/mo (₹1.5L/yr). Excess goes uninvested in government schemes.
              </p>
            )}
          </div>

          {/* Educational Inflation Toggle */}
          <div className="space-y-3 border-t border-border-navy pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-heading">Adjust for Educational Inflation</span>
              <input
                type="checkbox"
                checked={adjustEducationInflation}
                onChange={(e) => setAdjustEducationInflation(e.target.checked)}
                className="w-4 h-4 accent-emerald cursor-pointer rounded"
              />
            </div>
            {adjustEducationInflation && (
              <div className="space-y-2 bg-navy-bg p-3 rounded-2xl border border-border-navy">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">Education Inflation Rate</span>
                  <span className="text-emerald font-bold">{educationInflationRate}%</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={15}
                  step={0.5}
                  value={educationInflationRate}
                  onChange={(e) => setEducationInflationRate(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-card h-1 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Expected Return Rates Sliders */}
          <div className="space-y-4 border-t border-border-navy pt-4">
            <div className="text-xs font-bold text-heading uppercase tracking-wider">Expected Returns (%)</div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-grey">PPF Interest Rate</span>
                <span className="text-blue-400 font-bold">{ppfRate}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={10}
                step={0.1}
                value={ppfRate}
                onChange={(e) => setPpfRate(Number(e.target.value))}
                className="w-full accent-blue-500 bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-grey">SSY Interest Rate</span>
                <span className="text-purple-400 font-bold">{ssyRate}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={12}
                step={0.1}
                value={ssyRate}
                onChange={(e) => setSsyRate(Number(e.target.value))}
                className="w-full accent-purple-500 bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-grey">Equity SIP Rate</span>
                <span className="text-emerald font-bold">{sipRate}%</span>
              </div>
              <input
                type="range"
                min={8}
                max={20}
                step={0.5}
                value={sipRate}
                onChange={(e) => setSipRate(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Head to Head Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PPF Card */}
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">PPF</span>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20">{ppfRate}%</span>
              </div>
              <div className="text-2xl font-black text-heading tracking-tight">{fmt(calculations.ppfFinal)}</div>
              <div className="text-[11px] text-muted-grey pt-2 border-t border-border-navy">
                Invested: <span className="font-semibold text-heading">{fmt(calculations.ppfInvested)}</span>
              </div>
            </div>

            {/* SSY Card */}
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">SSY</span>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20">{ssyRate}%</span>
              </div>
              <div className="text-2xl font-black text-heading tracking-tight">{fmt(calculations.ssyFinal)}</div>
              <div className="text-[11px] text-muted-grey pt-2 border-t border-border-navy">
                Invested: <span className="font-semibold text-heading">{fmt(calculations.ssyInvested)}</span>
              </div>
            </div>

            {/* Equity SIP Card */}
            <div className="p-5 rounded-2xl border-2 border-emerald bg-emerald/5 space-y-2 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald uppercase tracking-wider flex items-center gap-1">
                  SIP Winner <Sparkles size={12} />
                </span>
                <span className="text-[10px] font-mono bg-emerald/20 text-emerald px-2 py-0.5 rounded-md border border-emerald/30 font-bold">{sipRate}%</span>
              </div>
              <div className="text-2xl font-black text-emerald tracking-tight">{fmt(calculations.sipFinal)}</div>
              <div className="text-[11px] text-muted-grey pt-2 border-t border-emerald/20">
                Invested: <span className="font-semibold text-heading">{fmt(calculations.sipInvested)}</span>
              </div>
            </div>
          </div>

          {/* Wealth Gap Over Time Chart */}
          <div className="p-6 rounded-3xl border border-border-navy bg-navy-card space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-heading uppercase tracking-wider">Wealth Gap Over Time (Age {currentAge} to {targetAge})</h3>
              <span className="text-xs text-emerald font-semibold">
                SIP Beats PPF by {fmt(calculations.sipFinal - calculations.ppfFinal)}
              </span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculations.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="yearLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => val >= 10000000 ? `₹${(val / 10000000).toFixed(1)}Cr` : val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#081c3a", borderColor: "#112d55", borderRadius: "10px", color: "#f8fafc" }}
                    formatter={(val: any) => fmt(val)}
                  />
                  <Legend />
                  <Bar dataKey="PPF" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SSY" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SIP" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Statutory Rules & Education Callout */}
          <div className="p-6 rounded-3xl border border-border-navy bg-navy-card/50 space-y-3">
            <h3 className="text-sm font-bold text-heading flex items-center gap-2">
              <Info className="text-emerald" size={18} /> Statutory Rules & Wealth Mechanics
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-grey leading-relaxed">
              <div>
                <p className="font-bold text-heading mb-1">🏛️ Statutory Limits (Section 80C Caps)</p>
                <p>PPF & SSY are capped at ₹1,50,000/year (₹12,500/month) by Indian law. Contributions exceeding ₹12,500/month in government schemes do not earn interest and remain uninvested in the scheme.</p>
              </div>
              <div>
                <p className="font-bold text-emerald mb-1">🚀 Equity SIP Compounding Engine</p>
                <p>SIPs have no statutory cap. Over a 15–20 year horizon, equity compounding consistently outperforms fixed-income debt schemes, building over 2x higher corpus for college fees and child legacy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
