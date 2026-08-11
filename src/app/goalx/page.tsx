"use client";

import React, { useState } from "react";
import { 
  Target, TrendingUp, AlertCircle, ArrowRight, ShieldCheck, 
  Layers, Calculator, Sparkles, CheckCircle2, ChevronRight, Sliders
} from "lucide-react";
import { calculateGoalX, CATEGORY_INFLATION_DEFAULTS } from "@/lib/engine/goalx";
import { GoalItem, GoalCategory } from "@/lib/engine/types";
import { formatINR, formatINRWords, valueToSliderPos, sliderPosToValue } from "@/lib/engine/numeric";

const INITIAL_GOAL: GoalItem = {
  id: "g1",
  name: "Buy Dream Electric SUV",
  category: "vehicle",
  targetAmountToday: 1500000,
  targetYear: 2030,
  currentAllocatedCorpus: 300000,
  currentMonthlySip: 10000,
  priority: 1,
  expectedReturnPct: 12,
  customInflationPct: 5.0,
  annualStepUpPct: 10,
};

export default function GoalXPage() {
  const [goal, setGoal] = useState<GoalItem>(INITIAL_GOAL);

  const res = calculateGoalX(goal);

  const handleSliderChange = (pos: number) => {
    const val = sliderPosToValue(pos);
    setGoal({ ...goal, targetAmountToday: val });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1 uppercase tracking-wider">
          <Target className="w-4 h-4" /> Engine 2: GoalX Navigation
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">Inflation-Adjusted Goal Navigation</h1>
        <p className="text-slate-400 text-sm mt-1">
          «Your goal has a future price. We calculate the journey.»
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs Drawer */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" /> Goal Parameters
          </h2>

          {/* Goal Name & Category */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Goal Name</label>
              <input
                type="text"
                value={goal.name}
                onChange={(e) => setGoal({ ...goal, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-medium text-sm mt-1 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Category</label>
                <select
                  value={goal.category}
                  onChange={(e) => setGoal({ ...goal, category: e.target.value as GoalCategory })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="vehicle">Vehicle (5% Infl)</option>
                  <option value="education">Education (10% Infl)</option>
                  <option value="house">Housing (7% Infl)</option>
                  <option value="travel">Travel (6% Infl)</option>
                  <option value="retirement">Retirement (6% Infl)</option>
                  <option value="emergency">Emergency (6% Infl)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Target Year</label>
                <input
                  type="number"
                  value={goal.targetYear}
                  onChange={(e) => setGoal({ ...goal, targetYear: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-medium text-sm mt-1 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Target Amount Today (Unlimited Numeric Input + Adaptive Slider) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Goal Cost Today</label>
                <span className="text-sm font-black text-emerald-400">{formatINRWords(goal.targetAmountToday)}</span>
              </div>

              <input
                type="number"
                value={goal.targetAmountToday}
                onChange={(e) => setGoal({ ...goal, targetAmountToday: Math.max(1, Number(e.target.value)) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-base mb-2 focus:border-emerald-500 focus:outline-none"
              />

              {/* Logarithmic / Adaptive Slider */}
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={valueToSliderPos(goal.targetAmountToday)}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>₹1k</span>
                <span>₹10L</span>
                <span>₹1Cr</span>
                <span>₹100Cr</span>
              </div>
            </div>

            {/* Current Portfolio & Monthly SIP */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Current Corpus</label>
                <input
                  type="number"
                  value={goal.currentAllocatedCorpus}
                  onChange={(e) => setGoal({ ...goal, currentAllocatedCorpus: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Monthly SIP</label>
                <input
                  type="number"
                  value={goal.currentMonthlySip}
                  onChange={(e) => setGoal({ ...goal, currentMonthlySip: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium text-sm mt-1"
                />
              </div>
            </div>

            {/* Assumptions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Expected Return %</label>
                <input
                  type="number"
                  value={goal.expectedReturnPct}
                  onChange={(e) => setGoal({ ...goal, expectedReturnPct: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Annual Step-Up %</label>
                <input
                  type="number"
                  value={goal.annualStepUpPct || 0}
                  onChange={(e) => setGoal({ ...goal, annualStepUpPct: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Dashboard */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status & Inflation Impact Hero */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase">Goal Status Diagnosis</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                res.status === "Ahead" || res.status === "On Track"
                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                  : "bg-amber-950 text-amber-400 border-amber-800"
              }`}>
                {res.status}
              </span>
            </div>

            <p className="text-slate-300 text-sm mb-6">{res.statusExplanation}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/80 pt-4">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-medium">Cost Today</div>
                <div className="text-lg font-bold text-white mt-0.5">{formatINRWords(res.todaysCost)}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-900/50">
                <div className="text-[11px] text-emerald-400 uppercase font-medium">Est. Future Cost ({res.goal.targetYear})</div>
                <div className="text-lg font-black text-emerald-300 mt-0.5">{formatINRWords(res.nominalFutureCost)}</div>
                <div className="text-[10px] text-emerald-500 font-medium">+{(res.inflationImpactAmount / 100000).toFixed(1)}L Inflation Drag</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-medium">Projected Corpus</div>
                <div className="text-lg font-bold text-slate-200 mt-0.5">{formatINRWords(res.projectedCorpusBase)}</div>
              </div>
            </div>
          </div>

          {/* Reverse Solver: "How Can I Reach It?" */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> Goal Reverse Engine: Alternative Strategies
            </h3>

            <div className="space-y-3">
              {res.recommendedPaths.map((path, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition">
                  <div>
                    <div className="text-sm font-bold text-white">{path.optionName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{path.description}</div>
                  </div>

                  <button className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-600/30 transition self-start sm:self-auto">
                    Apply Strategy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
