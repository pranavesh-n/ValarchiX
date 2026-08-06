"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Coins, Info, HelpCircle, ChevronDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

const APY_CONTRIBUTIONS: Record<number, number[]> = {
  18: [42, 84, 126, 168, 210],
  19: [46, 92, 138, 183, 228],
  20: [50, 100, 150, 198, 248],
  21: [54, 108, 162, 215, 269],
  22: [59, 117, 177, 234, 292],
  23: [64, 127, 192, 254, 318],
  24: [69, 138, 207, 276, 346],
  25: [76, 151, 226, 302, 376],
  26: [82, 164, 246, 328, 409],
  27: [90, 178, 268, 356, 446],
  28: [97, 194, 292, 388, 485],
  29: [106, 212, 318, 422, 529],
  30: [116, 231, 347, 462, 577],
  31: [126, 252, 379, 504, 630],
  32: [138, 276, 414, 551, 689],
  33: [151, 302, 453, 602, 752],
  34: [165, 330, 495, 659, 824],
  35: [181, 362, 543, 722, 902],
  36: [198, 396, 594, 792, 990],
  37: [218, 436, 654, 870, 1087],
  38: [240, 480, 720, 957, 1196],
  39: [264, 528, 792, 1054, 1318],
  40: [291, 582, 873, 1164, 1454]
};

const PENSION_LEVELS = [1000, 2000, 3000, 4000, 5000];

export default function ApyCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [entryAge, setEntryAge] = useState(25);
  const [pensionIndex, setPensionIndex] = useState(4); // default ₹5000 pension
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
    const age = Math.min(40, Math.max(18, entryAge));
    const pension = PENSION_LEVELS[pensionIndex];
    const premium = APY_CONTRIBUTIONS[age]?.[pensionIndex] || 0;
    const years = 60 - age;
    const totalInvested = premium * 12 * years;

    // Real Value of Pension
    const infRate = inflation / 100;
    const realPension = pension / Math.pow(1 + infRate, years);

    // Generate comparison data across years
    const chartData = [];
    for (let yr = 0; yr <= years; yr += 5) {
      const realValAtYr = pension / Math.pow(1 + infRate, yr);
      chartData.push({
        year: `Age ${60 + yr}`,
        "Nominal Pension": pension,
        "Real Pension Value": Math.round(realValAtYr)
      });
    }

    return {
      premium,
      yearsToContribute: years,
      totalInvested,
      nominalPension: pension,
      realPensionValue: Math.round(realPension),
      chartData
    };
  }, [entryAge, pensionIndex, inflation]);

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
            Atal Pension Yojana (APY) Simulator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Analyze your government contributions and reveal the inflation erosion on fixed retirement pensions.
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
            <h2 className="text-lg font-bold text-white">Scheme Settings</h2>

            {/* Entry Age Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Entry Age (18-40)</span>
                <NumericInput
                  value={entryAge}
                  onChange={setEntryAge}
                  min={18}
                  max={40}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={18}
                max={40}
                step={1}
                value={entryAge}
                onChange={(e) => setEntryAge(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>18 Years (Min)</span>
                <span>40 Years (Max)</span>
              </div>
            </div>

            {/* Pension Target Radio Buttons */}
            <div className="space-y-2">
              <label className="text-xs text-muted-grey block font-semibold">Desired Monthly Pension</label>
              <div className="grid grid-cols-5 gap-1.5">
                {PENSION_LEVELS.map((level, idx) => (
                  <button
                    key={level}
                    onClick={() => setPensionIndex(idx)}
                    className={`py-2 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${pensionIndex === idx
                      ? "bg-emerald border-emerald text-navy-bg"
                      : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                    }`}
                  >
                    ₹{level/1000}K
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-muted-grey block">
                *Guaranteed monthly pension starting from age 60.
              </span>
            </div>

            {/* Premium Indicator */}
            <div className="p-4 rounded-xl border border-border-navy bg-navy-light/20 space-y-1">
              <span className="text-[10px] font-bold text-emerald uppercase block">Required Contribution</span>
              <p className="text-base font-extrabold text-white">{formatCurrency(calculations.premium)} / month</p>
              <span className="text-[9px] text-muted-grey block leading-tight">
                *To be paid for {calculations.yearsToContribute} years (until age 60).
              </span>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the future pension value by inflation rate to show real purchasing power."><HelpCircle size={14} /></span>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Premium Paid</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.totalInvested)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Over {calculations.yearsToContribute} Years</span>
            </div>

            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Nominal Monthly Pension</span>
              <p className="text-xl font-extrabold text-emerald mt-1">
                {formatCurrency(calculations.nominalPension)} / mo
              </p>
              <span className="text-[9px] text-emerald block mt-0.5">Fixed for life at age 60</span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald/20 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">
                {adjustInflation ? "Real Pension Value (Today's Power)" : "Inflation Adjusted Value"}
              </span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(adjustInflation ? calculations.realPensionValue : calculations.nominalPension)} / mo
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">
                {adjustInflation 
                  ? `Purchasing power at retirement in ${calculations.yearsToContribute} years` 
                  : "Turn on Inflation toggle to see purchasing power"}
              </span>
            </div>
          </div>

          {/* Warning / Explanation Banner */}
          {adjustInflation && (
            <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-red-400 mr-1">⚠️ The Pension Illusion:</span>
              Your guaranteed life pension is fixed at <strong>{formatCurrency(calculations.nominalPension)}/month</strong>. However, due to <strong>{inflation}%</strong> annual inflation over the next <strong>{calculations.yearsToContribute} years</strong>, that monthly pension will buy only what <strong>{formatCurrency(calculations.realPensionValue)}</strong> does today! This fixed amount does NOT adapt to rising prices post-retirement.
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pension Purchasing Power Decay Post-Retirement</h3>
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
                  <Bar dataKey="Nominal Pension" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  {adjustInflation && (
                    <Bar dataKey="Real Pension Value" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
          Atal Pension Yojana (APY) Scheme Guide
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">How APY Contributions & Pensions Work</h4>
            <p>
              Atal Pension Yojana is a government-backed pension scheme in India targeted primarily at the unorganized sector.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Entry Age:</strong> Must be between 18 and 40 years of age.</li>
              <li><strong>Guaranteed Payout:</strong> Payout is fixed at ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000/month starting at age 60, depending on contributions.</li>
              <li><strong>Spouse/Nominee Benefit:</strong> After the subscriber&apos;s death, the same pension is paid to the spouse. If both die, the accumulated pension corpus is returned to the nominee.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">The Fatal Flaw of Fixed Pensions</h4>
            <p>
              <strong>No Inflation Indexing:</strong> The biggest risk of APY is that the pension is **fixed** at a nominal level. Unlike dearness allowance for government pensions, APY does not adjust for inflation.
            </p>
            <p>
              If an 18-year-old subscribes to a ₹5,000/month pension, that ₹5,000 starting in 42 years is worth only about ₹430 in terms of today&apos;s buying power. Post-retirement, as they age from 60 to 75, another 5% inflation will cut the real value of that pension further to under ₹200.
            </p>
            <p>
              Use this calculator to see how a nominal pension of ₹5,000 compounds to a negligible amount in real terms, and why it is crucial to supplement it with inflation-beating equity index assets.
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
            APY Formula & Inflation Purchasing Power Excel Audit
          </span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
        </button>
        
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">APY Premium & Inflation Formula</h4>
              <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                <p>
                  <strong>Total Invested = Monthly Premium × 12 × (60 - Entry Age)</strong>
                </p>
                <p>
                  <strong>Real Purchasing Power = Nominal Pension / (1 + Inflation Rate)^(60 - Entry Age)</strong>
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
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Total Out-of-Pocket Invested</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Monthly_Premium * 12 * (60 - Entry_Age)</td>
                  </tr>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Real Pension Value at Age 60</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Nominal_Pension / ((1 + {inflation}%)^(60 - Entry_Age))</td>
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
