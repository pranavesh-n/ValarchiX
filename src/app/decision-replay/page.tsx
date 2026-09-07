"use client";

import React, { useState } from "react";
import { 
  RotateCcw, Plus, Download, Upload, CheckCircle2, 
  Clock, Award, AlertCircle, FileText, Sparkles, Trash2
} from "lucide-react";
import { evaluateDecisionRetrospective, exportFinancialMemory } from "@/lib/engine/decision-replay";
import { DecisionLogEntry, FinancialDigitalTwin } from "@/lib/engine/types";
import { formatINRWords } from "@/lib/engine/numeric";

const SAMPLE_DECISIONS: DecisionLogEntry[] = [
  {
    id: "dec-1",
    date: "2026-01-15",
    title: "Increased Flexi Cap Monthly SIP from ₹10k to ₹15k",
    category: "investment",
    rationale: "Received annual salary increment of 12%. Allocated 50% of raise to equities.",
    assumptions: { expectedReturnPct: 12, monthlyContribution: 15000, timelineYears: 5 },
    expectedOutcomeAmount: 1200000,
    actualOutcomeAmount: 1280000,
    retrospectiveEvaluation: {
      status: "Exceeded",
      hindsightFreeAnalysis: "Actual corpus exceeded expected target by 6.6%. Execution discipline matched planned assumptions at decision time.",
    },
  },
  {
    id: "dec-2",
    date: "2026-04-10",
    title: "Prepaid ₹1.5L Lump Sum on Car Loan Principal",
    category: "debt",
    rationale: "Bonus payout received. Cleared high-interest 9.2% car loan principal early to save EMI interest drag.",
    assumptions: { notes: "Saved approx ₹38,000 in future interest payments." },
    retrospectiveEvaluation: {
      status: "On Track",
      hindsightFreeAnalysis: "Prepayment guaranteed an effective 9.2% tax-free risk-free return.",
    },
  },
];

export default function DecisionReplayPage() {
  const [decisions, setDecisions] = useState<DecisionLogEntry[]>(SAMPLE_DECISIONS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<DecisionLogEntry["category"]>("investment");
  const [newRationale, setNewRationale] = useState("");

  const handleAddDecision = () => {
    if (!newTitle.trim()) return;
    const entry: DecisionLogEntry = {
      id: `dec-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      title: newTitle,
      category: newCategory,
      rationale: newRationale,
      assumptions: {},
    };
    setDecisions([entry, ...decisions]);
    setNewTitle("");
    setNewRationale("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 animate-fadeIn text-light-grey">
      {/* Header */}
      <div className="border-b border-border-navy pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm mb-1 uppercase tracking-wider">
            <RotateCcw className="w-4 h-4" /> Engine 5: Decision Replay
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-heading tracking-tight">Record &amp; Replay Financial Decisions</h1>
          <p className="text-muted-grey text-xs sm:text-sm mt-1">
            «Record significant financial choices and evaluate expected vs actual outcomes without hindsight bias.»
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record New Decision
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Timeline of Decisions */}
        {decisions.map((dec) => {
          const evalRes = evaluateDecisionRetrospective(dec);

          return (
            <div key={dec.id} className="bg-navy-card border border-border-navy rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-navy pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-navy-bg text-muted-grey border border-border-navy px-2.5 py-1 rounded-lg">
                    {dec.date}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {dec.category}
                  </span>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  evalRes?.status === "Exceeded" || evalRes?.status === "On Track"
                    ? "bg-emerald-500/10 text-emerald border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                }`}>
                  {evalRes?.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-heading">{dec.title}</h3>
                <p className="text-sm text-muted-grey mt-1 leading-relaxed">{dec.rationale}</p>
              </div>

              {/* Hindsight-Free Evaluation Spotlight */}
              <div className="bg-navy-bg border border-border-navy/80 rounded-2xl p-4 text-xs">
                <div className="font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Hindsight-Free Retrospective Audit
                </div>
                <div className="text-muted-grey leading-relaxed">{evalRes?.hindsightFreeAnalysis}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Decision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-navy-bg/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-navy-card border border-border-navy rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-heading">Record Financial Decision</h3>

            <div>
              <label className="text-xs font-semibold text-muted-grey uppercase">Decision Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Started ₹5k Step-Up SIP in Nifty 50"
                className="w-full bg-navy-bg border border-border-navy rounded-xl px-4 py-2.5 text-heading text-sm mt-1 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-grey uppercase">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-navy-bg border border-border-navy rounded-xl px-3 py-2.5 text-heading text-sm mt-1 focus:border-rose-500 focus:outline-none"
              >
                <option value="investment">Investment</option>
                <option value="debt">Debt Payoff</option>
                <option value="expense">Expense Choice</option>
                <option value="goal">Goal Creation</option>
                <option value="career">Career / Income</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-grey uppercase">Reasoning / Rationale</label>
              <textarea
                value={newRationale}
                onChange={(e) => setNewRationale(e.target.value)}
                placeholder="Why did you make this decision based on what you know today?"
                className="w-full bg-navy-bg border border-border-navy rounded-xl p-3 text-heading text-sm mt-1 h-24 focus:border-rose-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-muted-grey hover:text-heading text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDecision}
                className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition cursor-pointer shadow-md"
              >
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
