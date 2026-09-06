"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Target, Home, Car, Heart, GraduationCap, ShieldAlert, Palmtree, HelpCircle, ChevronDown } from "lucide-react";
import NumericInput from "@/components/NumericInput";

interface GoalType {
  id: string;
  name: string;
  defaultAmount: number;
  defaultYears: number;
  icon: React.ComponentType<any>;
  guideline: string;
}

const GOAL_TYPES: GoalType[] = [
  {
    id: "house",
    name: "House Down Payment",
    defaultAmount: 2000000,
    defaultYears: 8,
    icon: Home,
    guideline: "Long-term goal. Equity assets can be considered if the horizon is > 5 years. Start with index funds or diversified equity."
  },
  {
    id: "car",
    name: "Car Purchase",
    defaultAmount: 800000,
    defaultYears: 4,
    icon: Car,
    guideline: "Medium-term goal. Protect capital by utilizing high-quality short duration debt funds or hybrid arbitrage funds."
  },
  {
    id: "marriage",
    name: "Marriage/Family Event",
    defaultAmount: 1500000,
    defaultYears: 5,
    icon: Heart,
    guideline: "Medium-term goal. Volatility should be minimised. A mix of conservative hybrid and multi-asset allocation could work."
  },
  {
    id: "education",
    name: "Higher Education / Course",
    defaultAmount: 1200000,
    defaultYears: 6,
    icon: GraduationCap,
    guideline: "Target educational cost inflation. Combine equity indexing with a safe exit buffer in debt as target date approaches."
  },
  {
    id: "retirement",
    name: "Retirement Target Buffer",
    defaultAmount: 5000000,
    defaultYears: 15,
    icon: Palmtree,
    guideline: "Very long term. Rely heavily on compounding via safe passive index models and debt allocations."
  }
];

export default function GoalPlanner() {
  const [showAudit, setShowAudit] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(GOAL_TYPES[0]);
  const [targetAmount, setTargetAmount] = useState(selectedGoal.defaultAmount);
  const [years, setYears] = useState(selectedGoal.defaultYears);
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [adjustInflation, setAdjustInflation] = useState(false);
  const [inflation, setInflation] = useState(7.0);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 7.0 });

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // Handle changing goal category
  const handleSelectGoal = (goal: GoalType) => {
    setSelectedGoal(goal);
    setTargetAmount(goal.defaultAmount);
    setYears(goal.defaultYears);
  };

  // Math to calculate Monthly Investment (Annuity payment) with inflation adjustments
  const calculations = useMemo(() => {
    const r = expectedReturn / 100;
    const inf = inflation / 100;
    const monthlyRate = r / 12;
    const totalMonths = years * 12;

    // Inflated goal value
    const inflatedTarget = adjustInflation ? targetAmount * Math.pow(1 + inf, years) : targetAmount;

    let monthlySip = 0;
    if (monthlyRate > 0) {
      monthlySip = (inflatedTarget * monthlyRate) / ((Math.pow(1 + monthlyRate, totalMonths) - 1) * (1 + monthlyRate));
    } else {
      monthlySip = inflatedTarget / totalMonths;
    }

    const totalInvested = monthlySip * totalMonths;
    const estReturnsNeeded = Math.max(0, inflatedTarget - totalInvested);

    const chartData = [
      {
        name: "Breakdown",
        "Principal Invested": Math.round(totalInvested),
        "Market Returns Needed": Math.round(estReturnsNeeded)
      }
    ];

    return {
      inflatedTarget: Math.round(inflatedTarget),
      monthlySip: Math.round(monthlySip),
      totalInvested: Math.round(totalInvested),
      estReturnsNeeded: Math.round(estReturnsNeeded),
      chartData
    };
  }, [targetAmount, years, expectedReturn, inflation, adjustInflation]);

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
      {/* Header and Motto */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Target className="text-emerald" />
            Financial Goal Planner
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Map your objectives and discover how much you need to set aside monthly.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      {/* Goal Icons Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {GOAL_TYPES.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal.id === goal.id;
          return (
            <button
              key={goal.id}
              onClick={() => handleSelectGoal(goal)}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                isSelected
                  ? "bg-navy-light text-emerald border-emerald"
                  : "bg-navy-card/25 border-border-navy text-muted-grey hover:bg-navy-light hover:text-white"
              }`}
            >
              <Icon size={24} className={isSelected ? "text-emerald" : "text-muted-grey"} />
              <span className="text-xs font-bold">{goal.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <selectedGoal.icon size={20} className="text-emerald" />
              {selectedGoal.name} Parameters
            </h2>

            {/* Target Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Target Amount Required</span>
                <NumericInput
                  value={targetAmount}
                  onChange={setTargetAmount}
                  min={1000}
                  max={1000000000}
                  step={5000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={50000}
                max={10000000}
                step={50000}
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹50K</span>
                <span>₹1Cr</span>
              </div>
            </div>

            {/* Years to Goal */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Time Horizon (Years)</span>
                <NumericInput
                  value={years}
                  onChange={setYears}
                  min={1}
                  max={50}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={1}
                max={25}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>1 Year</span>
                <span>25 Years</span>
              </div>
            </div>

            {/* Expected Returns */}
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
                min={4}
                max={18}
                step={0.5}
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>4% (Debt)</span>
                <span>18% (High Equity)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setExpectedReturn(rates.bondYield10Y)}
                  className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all"
                >
                  Sovereign 10Y Yield ({rates.bondYield10Y}%)
                </button>
                <button
                  type="button"
                  onClick={() => setExpectedReturn(10)}
                  className="text-[9px] font-bold text-white border border-border-navy bg-navy-light/40 hover:bg-navy-light px-2 py-0.5 rounded transition-all"
                >
                  Equity Index (10% Post-Tax)
                </button>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Inflates the target corpus based on annual inflation rate to reflect actual purchasing power."><HelpCircle size={14} /></span>
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
                  <div className="pt-1 text-left">
                    <button
                      type="button"
                      onClick={() => setInflation(rates.inflationRate)}
                      className="text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded transition-all"
                    >
                      CPI Inflation Baseline ({rates.inflationRate}%)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Output Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Big Number output */}
          <div className="p-6 rounded-2xl border border-emerald/30 bg-gradient-to-br from-emerald/10 to-transparent flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs uppercase font-bold text-emerald tracking-wide">Monthly SIP Required</span>
              <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {formatCurrency(calculations.monthlySip)}
              </p>
              <p className="text-[11px] text-muted-grey">
                Invested monthly over {years} years at {expectedReturn}% annualized returns.
              </p>
            </div>
            <div className="bg-navy-bg/50 border border-border-navy rounded-xl p-4 text-center shrink-0">
              <span className="text-[10px] font-bold text-muted-grey block">
                {adjustInflation ? "INFLATED TARGET CORPUS" : "TOTAL TARGET CORPUS"}
              </span>
              <span className="text-lg font-bold text-white block">
                {formatCurrency(adjustInflation ? calculations.inflatedTarget : targetAmount)}
              </span>
              {adjustInflation && (
                <span className="text-[10px] text-muted-grey block mt-0.5">
                  Nominal Value: {formatCurrency(targetAmount)}
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Breakdown chart */}
            <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
              <h3 className="text-sm font-bold text-white">Target Breakdown</h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calculations.chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#112d55" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v/100000}L`} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#081c3a",
                        borderColor: "#112d55",
                        borderRadius: "8px",
                        color: "#f1f5f9"
                      }}
                      formatter={(v: any) => [formatCurrency(v), ""]}
                    />
                    <Bar dataKey="Principal Invested" stackId="a" fill="#1e293b" radius={[4, 0, 0, 4]} />
                    <Bar dataKey="Market Returns Needed" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-xs text-muted-grey">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#1e293b] rounded"></span> Invested: {formatCurrency(calculations.totalInvested)}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#22c55e] rounded"></span> Returns Needed: {formatCurrency(calculations.estReturnsNeeded)}</span>
              </div>
            </div>

            {/* Smart Asset Allocation Guide */}
            <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="text-emerald" size={16} />
                  Asset Allocation Guide
                </h3>
                <p className="text-xs text-muted-grey mt-2 leading-relaxed">
                  {selectedGoal.guideline}
                </p>
              </div>
              
              <div className="border-t border-border-navy/60 pt-3 mt-3">
                <span className="text-[10px] font-bold uppercase text-emerald tracking-wider">Timeline Rules of Thumb:</span>
                <ul className="text-[11px] text-muted-grey list-disc list-inside mt-1 space-y-1">
                  <li><strong>Short Horizon (&lt;3 years)</strong>: Debt funds / FD. 0% equity.</li>
                  <li><strong>Medium Horizon (3-7 years)</strong>: Hybrid / Multi-asset.</li>
                  <li><strong>Long Horizon (&gt;7 years)</strong>: 70% Equity Index funds.</li>
                </ul>
              </div>
            </div>
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
                  <h4 className="font-semibold text-white">Goal Future Cost & Required SIP Formulation</h4>
                  <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                    <p>
                      <strong>Inflated Goal Target (Future Value of Cost):</strong>
                      <br />
                      Inflated Target = Current Target * (1 + inflation_rate)^y
                    </p>
                    <p>
                      <strong>Monthly SIP Required:</strong>
                      <br />
                      Monthly SIP = Target_Corpus / [ ((1 + i)^n - 1) / i * (1 + i) ]
                      <br />
                      <span className="text-[10px] text-muted-grey">where: i = monthly expected return (r_expected / 12), n = number of months (years * 12).</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel Replication (Audit Script)</h4>
                  <p>To replicate this goal plan inside Excel or Google Sheets:</p>
                  <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                    <thead>
                      <tr className="bg-navy-bg/60">
                        <th className="border border-border-navy/80 p-2 text-left">Calculation</th>
                        <th className="border border-border-navy/80 p-2 text-left">Excel / Sheets Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Inflated Target Amount</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">={targetAmount} * (1 + {inflation}%)^{years}</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Required Monthly SIP</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=PMT({expectedReturn}%/12, {years}*12, 0, -{adjustInflation ? (targetAmount * Math.pow(1 + inflation / 100, years)) : targetAmount}, 1)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This tool is an educational planning model designed to teach compounding principles. It does not provide SEBI-registered investment advice or guarantee that targets will be achieved.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
