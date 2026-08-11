"use client";

import React, { useState } from "react";
import { 
  Hourglass, Play, Sparkles, RefreshCw, Layers, Sliders, 
  TrendingUp, AlertTriangle, ArrowRight, Shield, Zap
} from "lucide-react";
import { simulateTimeMachine, parseNaturalLanguageScenario } from "@/lib/engine/time-machine";
import { FinancialDigitalTwin, TimeMachineUniverse } from "@/lib/engine/types";
import { formatINRWords } from "@/lib/engine/numeric";

const SAMPLE_TWIN: FinancialDigitalTwin = {
  updatedAt: new Date().toISOString(),
  income: { monthlySalary: 120000, secondaryMonthlyIncome: 15000, expectedAnnualGrowthPct: 10, stabilityRating: "high" },
  expenses: { essentialMonthly: 45000, discretionaryMonthly: 25000, recurringAnnual: 60000, irregularAnnual: 30000 },
  savings: { liquidBankBalance: 150000, cashReserves: 30000 },
  investments: [
    { id: "1", name: "Flexi Cap Fund", category: "mutual_fund", currentValue: 500000, monthlyContribution: 20000, expectedReturnPct: 13 },
    { id: "2", name: "Index Fund", category: "mutual_fund", currentValue: 300000, monthlyContribution: 10000, expectedReturnPct: 12 },
  ],
  debts: [],
  protection: { healthInsuranceCover: 500000, lifeInsuranceCover: 5000000, dependantsCount: 1, annualHealthPremium: 15000, annualLifePremium: 18000 },
  goals: [],
  dnaHistory: [],
  decisions: [],
  universes: [],
};

export default function TimeMachinePage() {
  const [scrubYearIndex, setScrubYearIndex] = useState(9); // Default 10 years (index 9)
  const [nlQuery, setNlQuery] = useState("");
  const [previewParams, setPreviewParams] = useState<TimeMachineUniverse["parameters"] | null>(null);

  const universes = simulateTimeMachine(SAMPLE_TWIN);

  const handleParseQuery = () => {
    if (!nlQuery.trim()) return;
    const params = parseNaturalLanguageScenario(nlQuery);
    setPreviewParams(params);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1 uppercase tracking-wider">
          <Hourglass className="w-4 h-4" /> Engine 4: Financial Time Machine
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">Parallel Financial Universes</h1>
        <p className="text-slate-400 text-sm mt-1">
          «Simulate alternate financial futures, scrub through timeline horizons, and stress test your decisions.»
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Natural Language Scenario Prompt Bar */}
        <div className="bg-slate-900 border border-indigo-900/50 rounded-3xl p-6 shadow-2xl">
          <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 block flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Ask a Natural-Language Scenario
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g. What if I invest another ₹5,000 and Nifty crashes 20% in Year 2?"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleParseQuery}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Parse & Simulate
            </button>
          </div>

          {/* Quick Scenario Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs text-slate-500 self-center">Quick Scenarios:</span>
            {[
              "What if I invest another ₹3,000/mo?",
              "What if I add a 10% annual step-up?",
              "What if Nifty drops 20%?",
              "What if I pause SIP for 1 year?",
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => { setNlQuery(chip); setPreviewParams(parseNaturalLanguageScenario(chip)); }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-xl border border-slate-800 transition"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Assumption Preview Modal / Banner */}
          {previewParams && (
            <div className="mt-6 bg-indigo-950/60 border border-indigo-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-indigo-300 uppercase">Parsed Assumptions Preview</div>
                <div className="text-xs text-indigo-200 mt-1">
                  {previewParams.monthlySipDelta && `• Monthly SIP Delta: +₹${previewParams.monthlySipDelta} `}
                  {previewParams.stepUpPctDelta && `• Annual Step-Up: +${previewParams.stepUpPctDelta}% `}
                  {previewParams.marketCrashPct && `• Market Stress: -${previewParams.marketCrashPct}% Crash `}
                  {previewParams.sipPauseMonths && `• Pause SIP: ${previewParams.sipPauseMonths} months `}
                </div>
              </div>
              <button
                onClick={() => setPreviewParams(null)}
                className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
              >
                Confirm & Run Calculation
              </button>
            </div>
          )}
        </div>

        {/* Timeline Scrubbing Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" /> Timeline Scrubbing Horizon
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Scrub timeline to compare future corpus across parallel financial universes.
              </p>
            </div>

            <span className="text-xl font-extrabold text-indigo-300 bg-indigo-950 border border-indigo-800/80 px-4 py-1.5 rounded-2xl self-start sm:self-auto">
              Year {universes[0]?.projections[scrubYearIndex]?.year || 2036} ({scrubYearIndex + 1} Years Out)
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={19}
            step={1}
            value={scrubYearIndex}
            onChange={(e) => setScrubYearIndex(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>1 Year</span>
            <span>5 Years</span>
            <span>10 Years</span>
            <span>15 Years</span>
            <span>20 Years</span>
          </div>
        </div>

        {/* Parallel Universes Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universes.map((u) => {
            const proj = u.projections[scrubYearIndex];
            const realityProj = universes[0].projections[scrubYearIndex];
            const delta = proj.corpus - realityProj.corpus;

            return (
              <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-base">{u.name}</span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: u.color }}></span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">{u.description}</p>

                  <div className="space-y-3 bg-slate-950 border border-slate-800/80 p-4 rounded-2xl mb-4">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-medium">Nominal Future Corpus</div>
                      <div className="text-2xl font-black text-white mt-0.5">{formatINRWords(proj.corpus)}</div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2 flex justify-between text-xs">
                      <span className="text-slate-400">Purchasing Power Today:</span>
                      <span className="font-bold text-slate-200">{formatINRWords(proj.purchasingPower)}</span>
                    </div>
                  </div>
                </div>

                {u.id !== "reality" && (
                  <div className={`text-xs font-semibold px-3 py-2 rounded-xl flex items-center justify-between ${
                    delta >= 0 ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                  }`}>
                    <span>vs Status Quo:</span>
                    <span>{delta >= 0 ? "+" : ""}{formatINRWords(delta)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
