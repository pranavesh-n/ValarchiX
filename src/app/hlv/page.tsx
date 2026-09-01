"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { HeartPulse, ChevronDown, HelpCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function HLVCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [annualIncome, setAnnualIncome] = useState(1200000);
  const [currentAge, setCurrentAge] = useState(32);
  const [retirementAge, setRetirementAge] = useState(60);
  const [inflation, setInflation] = useState(6);
  const [existingInsurance, setExistingInsurance] = useState(5000000);
  const [existingLiabilities, setExistingLiabilities] = useState(3000000);
  const [annualExpenses, setAnnualExpenses] = useState(600000); // family annual expenses
  const [existingAssets, setExistingAssets] = useState(2000000); // savings/investments

  useEffect(() => setMounted(true), []);

  const { hlv, coverageGap, pieData, yearsToRetire } = useMemo(() => {
    const yearsToRetire = Math.max(1, retirementAge - currentAge);

    // Income Replacement Method: PV of future income stream discounted at inflation
    // HLV = Annual Income × [(1 - (1/(1+r))^n) / r] where r ≈ inflation
    const r = inflation / 100;
    const pvFactor = r > 0 ? (1 - Math.pow(1 / (1 + r), yearsToRetire)) / r : yearsToRetire;
    const incomeReplacementValue = Math.round(annualIncome * pvFactor);

    // Add family expense corpus (years to retirement × annual expenses)
    const expenseCorpus = Math.round(annualExpenses * yearsToRetire);

    // Total HLV
    const totalHLV = incomeReplacementValue + existingLiabilities;

    // Net HLV after assets and existing insurance
    const hlv = Math.max(0, totalHLV - existingAssets - existingInsurance);

    const coverageGap = existingInsurance >= totalHLV - existingAssets
      ? 0
      : totalHLV - existingAssets - existingInsurance;

    const pieData = [
      { name: "Existing Insurance", value: existingInsurance, color: "#22c55e" },
      { name: "Existing Assets", value: existingAssets, color: "#3b82f6" },
      { name: "Coverage Gap", value: Math.max(0, coverageGap), color: "#ef4444" },
    ].filter(d => d.value > 0);

    return { hlv, coverageGap, pieData, yearsToRetire, incomeReplacementValue, expenseCorpus };
  }, [annualIncome, currentAge, retirementAge, inflation, existingInsurance, existingLiabilities, existingAssets, annualExpenses]);

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
            <HeartPulse className="text-emerald" /> Human Life Value (HLV) Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Calculate how much life insurance your family truly needs — based on your future income, liabilities, and existing coverage.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      {/* What is HLV banner */}
      <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/30 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald" /> What is Human Life Value?
        </h2>
        <p className="text-xs text-muted-grey leading-relaxed">
          Your <strong className="text-white">Human Life Value (HLV)</strong> is the economic value of your future earning potential to your dependants. If you were to pass away today, your family would lose all your future income. HLV quantifies this loss and tells you the <strong className="text-white">minimum life insurance cover</strong> needed to replace that income stream — so your family can maintain their lifestyle without you.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-5">
          <div className="p-5 glass-card space-y-4">
            <h2 className="text-base font-bold text-white">Your Profile</h2>
            
            {/* Annual Income */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Annual Income (Take-Home)</span>
                <NumericInput value={annualIncome} onChange={setAnnualIncome} min={100000} max={50000000} step={50000} type="currency" />
              </div>
              <input
                type="range"
                min={300000}
                max={10000000}
                step={100000}
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Current Age */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Current Age</span>
                <NumericInput value={currentAge} onChange={setCurrentAge} min={18} max={65} step={1} type="number" />
              </div>
              <input
                type="range"
                min={18}
                max={60}
                step={1}
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Retirement Age */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Planned Retirement Age</span>
                <NumericInput value={retirementAge} onChange={setRetirementAge} min={40} max={75} step={1} type="number" />
              </div>
              <input
                type="range"
                min={45}
                max={75}
                step={1}
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Annual Family Expenses */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Annual Family Expenses</span>
                <NumericInput value={annualExpenses} onChange={setAnnualExpenses} min={100000} max={10000000} step={50000} type="currency" />
              </div>
              <input
                type="range"
                min={100000}
                max={5000000}
                step={50000}
                value={annualExpenses}
                onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Inflation Rate */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Inflation Rate (%)</span>
                <NumericInput value={inflation} onChange={setInflation} min={1} max={25} step={0.5} type="percent" />
              </div>
              <input
                type="range"
                min={3}
                max={12}
                step={0.5}
                value={inflation}
                onChange={(e) => setInflation(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="p-5 glass-card space-y-4">
            <h2 className="text-base font-bold text-white">Existing Coverage</h2>

            {/* Existing Life Insurance */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Existing Life Insurance</span>
                <NumericInput value={existingInsurance} onChange={setExistingInsurance} min={0} max={100000000} step={500000} type="currency" />
              </div>
              <input
                type="range"
                min={0}
                max={30000000}
                step={500000}
                value={existingInsurance}
                onChange={(e) => setExistingInsurance(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Outstanding Liabilities */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Outstanding Liabilities</span>
                <NumericInput value={existingLiabilities} onChange={setExistingLiabilities} min={0} max={50000000} step={100000} type="currency" />
              </div>
              <input
                type="range"
                min={0}
                max={20000000}
                step={500000}
                value={existingLiabilities}
                onChange={(e) => setExistingLiabilities(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Savings & Investments */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Savings & Investments</span>
                <NumericInput value={existingAssets} onChange={setExistingAssets} min={0} max={50000000} step={100000} type="currency" />
              </div>
              <input
                type="range"
                min={0}
                max={20000000}
                step={500000}
                value={existingAssets}
                onChange={(e) => setExistingAssets(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Result */}
          <div className={`p-6 rounded-2xl border text-center space-y-2 ${coverageGap > 0 ? "border-red-500/40 bg-red-500/5" : "border-emerald/40 bg-emerald/5"}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-grey">
              {coverageGap > 0 ? "Additional Cover Required" : "Coverage is Sufficient ✅"}
            </p>
            <p className={`text-5xl font-extrabold ${coverageGap > 0 ? "text-red-400" : "text-emerald glow-emerald"}`}>
              {coverageGap > 0 ? fmtL(coverageGap) : "₹0 Gap"}
            </p>
            <p className="text-[11px] text-muted-grey">
              {coverageGap > 0
                ? `You need ${fmtL(coverageGap)} more life insurance to fully protect your family over ${yearsToRetire} years.`
                : "Your existing insurance and assets sufficiently cover your family's needs."}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Years to Retirement</span>
              <p className="text-2xl font-bold text-white mt-1">{yearsToRetire}</p>
            </div>
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Existing Insurance</span>
              <p className="text-lg font-bold text-emerald mt-1">{fmtL(existingInsurance)}</p>
            </div>
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-red-400 block">Coverage Gap</span>
              <p className="text-lg font-bold text-red-400 mt-1">{fmtL(coverageGap)}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 grid md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-3 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Insurance Coverage Breakdown</h3>
              <div className="space-y-2 text-[11px]">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-grey">{d.name}:</span>
                    <span className="text-white font-semibold ml-auto">{fmtL(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 h-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmtL(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Education */}
          <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" /> Common Mistakes in Life Insurance Planning
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-grey">
              <ul className="space-y-1.5 list-disc pl-4">
                <li><strong className="text-white">Under-insuring:</strong> "₹10L is enough" — it covers barely 1 year of a family&apos;s expenses.</li>
                <li><strong className="text-white">No term plan:</strong> Endowment + ULIPs give inadequate cover at high cost. Pure term is the only real protection.</li>
              </ul>
              <ul className="space-y-1.5 list-disc pl-4">
                <li><strong className="text-white">Ignoring liabilities:</strong> Home loans, car loans must be cleared from the death benefit — not leave your family in debt.</li>
                <li><strong className="text-white">Ignoring inflation:</strong> A ₹1Cr cover today will have far less purchasing power in 20 years.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button onClick={() => setShowAudit(!showAudit)} className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer">
          <span className="flex items-center gap-1.5"><HelpCircle className="text-emerald" size={18} />How HLV is Calculated</span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
        </button>
        {showAudit && (
          <div className="text-xs text-muted-grey pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="bg-navy-bg/50 p-3 rounded-xl font-mono space-y-1">
              <p>PV Factor = [1 − (1/(1+r))^n] / r  (annuity formula)</p>
              <p>where r = inflation rate, n = years to retirement</p>
              <p>Gross HLV = Annual Income × PV Factor + Total Liabilities</p>
              <p>Net HLV (Coverage Gap) = Gross HLV − Existing Assets − Existing Insurance</p>
            </div>
            <p className="text-[10px] text-amber-500 mt-2">⚠️ <strong>Disclaimer:</strong> This is an educational HLV estimate. Consult a SEBI/IRDAI registered advisor for actual insurance planning.</p>
          </div>
        )}
      </div>
    </div>
  );
}
