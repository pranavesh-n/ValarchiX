"use client";

import React, { useState, useEffect } from "react";
import { 
  Hourglass, Play, Sparkles, RefreshCw, Layers, Sliders, 
  TrendingUp, AlertTriangle, ArrowRight, Shield, Zap
} from "lucide-react";
import { simulateTimeMachine, parseNaturalLanguageScenario } from "@/lib/engine/time-machine";
import { FinancialDigitalTwin, TimeMachineUniverse } from "@/lib/engine/types";
import { formatINRWords } from "@/lib/engine/numeric";
import { loadDigitalTwinFromVault } from "@/lib/supabase/auth";

const DEFAULT_SAMPLE_TWIN: FinancialDigitalTwin = {
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
  const [twin, setTwin] = useState<FinancialDigitalTwin>(DEFAULT_SAMPLE_TWIN);
  const [scrubYearIndex, setScrubYearIndex] = useState(9); // Default 10 years (index 9)
  const [nlQuery, setNlQuery] = useState("");
  const [previewParams, setPreviewParams] = useState<TimeMachineUniverse["parameters"] | null>(null);

  useEffect(() => {
    async function load() {
      const loaded = await loadDigitalTwinFromVault();
      if (loaded) setTwin(loaded);
    }
    load();
  }, []);

  const universes = simulateTimeMachine(twin);

  const handleParseQuery = () => {
    if (!nlQuery.trim()) return;
    const params = parseNaturalLanguageScenario(nlQuery);
    setPreviewParams(params);
  };

  const selectedYear = scrubYearIndex + 1;
  const targetYear = new Date().getFullYear() + selectedYear;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto border-b border-border-navy pb-4">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
          <Hourglass className="w-4 h-4" /> Engine 4: Financial Time Machine
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-heading tracking-tight">Parallel Financial Universes</h1>
        <p className="text-muted-grey text-xs sm:text-sm mt-0.5">
          Simulate alternate financial futures, scrub through timeline horizons, and stress test decisions.
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Natural Language Scenario Prompt Bar */}
        <div className="bg-navy-card border border-border-navy rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
          <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Ask a Natural-Language Scenario
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g. What if I invest another ₹5,000 and Nifty crashes 20% in Year 2?"
              className="flex-1 bg-navy-bg border border-border-navy rounded-2xl px-5 py-3 text-heading text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleParseQuery}
              className="bg-indigo-600 hover:bg-indigo-500 !text-white font-extrabold text-sm px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Zap className="w-4 h-4" /> Parse & Simulate
            </button>
          </div>

          {/* Quick Scenario Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs text-muted-grey self-center">Quick Scenarios:</span>
            {[
              "What if I invest another ₹3,000/mo?",
              "What if I add a 10% annual step-up?",
              "What if Nifty drops 20%?",
              "What if I pause SIP for 1 year?",
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => { setNlQuery(chip); setPreviewParams(parseNaturalLanguageScenario(chip)); }}
                className="bg-navy-bg hover:bg-navy-light text-heading text-xs px-3 py-1.5 rounded-xl border border-border-navy transition cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Assumption Preview Modal / Banner */}
          {previewParams && (
            <div className="card-stat-indigo rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div>
                <div className="text-xs font-bold uppercase">Parsed Assumptions Preview</div>
                <div className="text-xs mt-1 space-x-2">
                  {previewParams.monthlySipDelta && (
                    <span>SIP Delta: <strong>+₹{previewParams.monthlySipDelta.toLocaleString('en-IN')}/mo</strong></span>
                  )}
                  {previewParams.stepUpPctDelta && (
                    <span>Step-Up: <strong>+{previewParams.stepUpPctDelta}%/yr</strong></span>
                  )}
                  {previewParams.marketCrashPct && (
                    <span>Crash: <strong>-{previewParams.marketCrashPct}%</strong></span>
                  )}
                  {previewParams.sipPauseMonths && (
                    <span>Pause: <strong>{previewParams.sipPauseMonths} Months</strong></span>
                  )}
                </div>
              </div>
              <button className="bg-indigo-600 !text-white text-xs font-extrabold px-4 py-2 rounded-xl hover:bg-indigo-500 transition shadow-sm cursor-pointer">
                Inject Universe
              </button>
            </div>
          )}
        </div>

        {/* Interactive Scrubbing Slider */}
        <div className="bg-navy-card border border-border-navy rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-navy pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-heading flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" /> Timeline Scrubbing Horizon
              </h3>
              <p className="text-xs text-muted-grey">Scrub timeline to compare future corpus across parallel financial universes.</p>
            </div>
            <div className="text-sm font-black text-heading bg-navy-bg px-4 py-1.5 rounded-xl border border-border-navy self-start sm:self-auto font-mono">
              Year {targetYear} ({selectedYear} Years Out)
            </div>
          </div>

          <div className="py-2">
            <input
              type="range"
              min={0}
              max={19}
              step={1}
              value={scrubYearIndex}
              onChange={(e) => setScrubYearIndex(Number(e.target.value))}
              className="w-full accent-indigo-500 h-2 bg-navy-bg rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted-grey font-mono mt-1">
              <span>1 Year</span>
              <span>5 Years</span>
              <span>10 Years</span>
              <span>15 Years</span>
              <span>20 Years</span>
            </div>
          </div>
        </div>

        {/* Universe Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {universes.map((u) => {
            const dataPoint = u.projections[scrubYearIndex] || u.projections[u.projections.length - 1];
            return (
              <div 
                key={u.id}
                className="bg-navy-card border border-border-navy rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between hover:border-indigo-500/50 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-heading">{u.name}</span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: u.color }}></span>
                  </div>
                  <p className="text-xs text-muted-grey leading-relaxed mb-4">{u.description}</p>

                  <div className="card-tile-neutral p-4 rounded-2xl border mb-3">
                    <div className="text-[10px] uppercase font-bold text-muted-grey">Projected Net Worth (Yr {targetYear})</div>
                    <div className="text-2xl sm:text-3xl font-black text-heading mt-1">
                      {formatINRWords(dataPoint?.corpus || 0)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="card-tile-neutral p-2.5 rounded-xl border">
                      <span className="text-[10px] text-muted-grey uppercase block font-bold">Purchasing Power</span>
                      <span className="font-extrabold text-heading mt-0.5 block">{formatINRWords(dataPoint?.purchasingPower || 0)}</span>
                    </div>
                    <div className="card-stat-emerald p-2.5 rounded-xl border">
                      <span className="text-[10px] uppercase block font-bold opacity-80">Inflation Adjusted</span>
                      <span className="font-extrabold mt-0.5 block">
                        6% CPI
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-navy flex justify-between items-center text-xs text-muted-grey">
                  <span>Confidence: <strong>High</strong></span>
                  <span className="text-indigo-400 font-bold flex items-center gap-1 cursor-pointer hover:underline">
                    View Trajectory <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
