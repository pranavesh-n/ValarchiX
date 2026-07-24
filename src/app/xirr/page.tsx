"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Calculator, Info, HelpCircle, Plus, Trash2, Calendar, TrendingUp, Download, Upload, AlertCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import NumericInput from "@/components/NumericInput";

type FlowType = "invested" | "withdrawn";
type Frequency = "one-off" | "monthly" | "quarterly" | "yearly";

interface CustomFlow {
  id: string;
  type: FlowType;
  amount: number;
  date: string;
  frequency: Frequency;
  count?: number; // for recurring series
}

export default function XirrCalculator() {
  const [activeTab, setActiveTab] = useState<"sip" | "custom">("custom");
  const [currency, setCurrency] = useState("INR");

  // --- Quick SIP Mode State ---
  const [sipMonthly, setSipMonthly] = useState(5000);
  const [sipDuration, setSipDuration] = useState(3);
  const [sipDurationUnit, setSipDurationUnit] = useState<"years" | "months">("years");
  const [sipCurrentValue, setSipCurrentValue] = useState(220000);

  // --- Custom Cash Flows Mode State ---
  const [customFlows, setCustomFlows] = useState<CustomFlow[]>([
    { id: "1", type: "invested", amount: 100000, date: "2025-07-24", frequency: "one-off" },
    { id: "2", type: "withdrawn", amount: 135000, date: "2026-07-24", frequency: "one-off" }
  ]);

  const [adjustInflation, setAdjustInflation] = useState(false);
  const [inflation, setInflation] = useState(5.09);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => setInflation(data.inflationRate || 5.09))
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // --- Helper to add a custom flow ---
  const addFlow = (type: FlowType) => {
    const today = new Date().toISOString().split("T")[0];
    setCustomFlows([
      ...customFlows,
      {
        id: Math.random().toString(),
        type,
        amount: 10000,
        date: today,
        frequency: "one-off"
      }
    ]);
  };

  const removeFlow = (id: string) => {
    if (customFlows.length <= 1) {
      alert("At least 1 flow row is required.");
      return;
    }
    setCustomFlows(customFlows.filter((f) => f.id !== id));
  };

  const updateFlow = (id: string, field: keyof CustomFlow, val: any) => {
    setCustomFlows(
      customFlows.map((f) => (f.id === id ? { ...f, [field]: val } : f))
    );
  };

  // --- Expand recurring custom flows into explicit cash flows ---
  const expandedCashFlows = useMemo(() => {
    if (activeTab === "sip") {
      const totalMonths = sipDurationUnit === "years" ? sipDuration * 12 : sipDuration;
      const flows: { date: Date; amount: number }[] = [];
      const startDate = new Date();
      
      for (let m = 0; m < totalMonths; m++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + m);
        flows.push({ date: d, amount: -sipMonthly });
      }
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + totalMonths);
      flows.push({ date: endDate, amount: sipCurrentValue });
      return flows;
    }

    // Custom Mode Expansion
    const flows: { date: Date; amount: number }[] = [];
    customFlows.forEach((item) => {
      const baseDate = new Date(item.date);
      const sign = item.type === "invested" ? -1 : 1;
      const val = Math.abs(item.amount) * sign;

      if (item.frequency === "one-off") {
        flows.push({ date: baseDate, amount: val });
      } else {
        const occurrences = item.count || 12;
        const monthStep = item.frequency === "monthly" ? 1 : item.frequency === "quarterly" ? 3 : 12;
        for (let i = 0; i < occurrences; i++) {
          const d = new Date(baseDate);
          d.setMonth(d.getMonth() + i * monthStep);
          flows.push({ date: d, amount: val });
        }
      }
    });

    return flows.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeTab, sipMonthly, sipDuration, sipDurationUnit, sipCurrentValue, customFlows]);

  // --- XIRR Solver Engine (Newton-Raphson + Bisection) ---
  const xirrResult = useMemo(() => {
    const amounts = expandedCashFlows.map((f) => f.amount);
    const hasNegative = amounts.some((a) => a < 0);
    const hasPositive = amounts.some((a) => a > 0);

    if (!hasNegative || !hasPositive || expandedCashFlows.length < 2) {
      return {
        success: false,
        error: "XIRR requires both investment cashflows (negative) and redemption/valuation cashflows (positive).",
        xirrNominal: "0.00",
        xirrReal: "0.00",
        totalInvested: 0,
        totalRedeemed: 0,
        netGain: 0,
        absoluteReturn: "0.0",
        daysDuration: 0,
        yearsDuration: "0.00",
        isExtremeAnnualized: false
      };
    }

    const d1 = expandedCashFlows[0].date.getTime();
    const dLast = expandedCashFlows[expandedCashFlows.length - 1].date.getTime();
    const daysDuration = Math.max(1, (dLast - d1) / (1000 * 60 * 60 * 24));
    const yearsDuration = daysDuration / 365;

    const f = (r: number) => {
      let sum = 0;
      for (let i = 0; i < expandedCashFlows.length; i++) {
        const days = (expandedCashFlows[i].date.getTime() - d1) / (1000 * 60 * 60 * 24);
        sum += expandedCashFlows[i].amount / Math.pow(1 + r, days / 365);
      }
      return sum;
    };

    const df = (r: number) => {
      let sum = 0;
      for (let i = 0; i < expandedCashFlows.length; i++) {
        const days = (expandedCashFlows[i].date.getTime() - d1) / (1000 * 60 * 60 * 24);
        sum -= (days / 365) * expandedCashFlows[i].amount / Math.pow(1 + r, (days / 365) + 1);
      }
      return sum;
    };

    let r = 0.1;
    let converged = false;
    for (let iter = 0; iter < 100; iter++) {
      const val = f(r);
      const deriv = df(r);
      if (Math.abs(deriv) < 1e-12) break;
      const nextR = r - val / deriv;
      if (Math.abs(nextR - r) < 1e-7) {
        r = nextR;
        converged = true;
        break;
      }
      r = nextR;
    }

    if (!converged) {
      let low = -0.99;
      let high = 10.0;
      for (let iter = 0; iter < 100; iter++) {
        const mid = (low + high) / 2;
        const val = f(mid);
        if (Math.abs(val) < 1e-5) {
          r = mid;
          converged = true;
          break;
        }
        if (f(low) * val < 0) high = mid;
        else low = mid;
      }
    }

    const xirrNominal = r * 100;
    const infRate = inflation / 100;
    const xirrReal = ((1 + r) / (1 + infRate) - 1) * 100;

    let totalInvested = 0;
    let totalRedeemed = 0;
    amounts.forEach((a) => {
      if (a < 0) totalInvested += Math.abs(a);
      else totalRedeemed += a;
    });

    const netGain = totalRedeemed - totalInvested;
    const absoluteReturn = totalInvested > 0 ? (netGain / totalInvested) * 100 : 0;
    const isExtremeAnnualized = Math.abs(xirrNominal) > 200 && yearsDuration < 1.0;

    return {
      success: true,
      xirrNominal: xirrNominal.toFixed(2),
      xirrReal: xirrReal.toFixed(2),
      totalInvested,
      totalRedeemed,
      netGain,
      absoluteReturn: absoluteReturn.toFixed(1),
      daysDuration: Math.round(daysDuration),
      yearsDuration: yearsDuration.toFixed(2),
      isExtremeAnnualized
    };
  }, [expandedCashFlows, inflation]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: currency, maximumFractionDigits: 0 }).format(v);

  const fmtCompact = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  return (
    <div className="space-y-8 py-6 animate-fadeIn text-light-grey max-w-5xl mx-auto">
      {/* Header Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
          <Calculator className="text-emerald" size={32} />
          XIRR Calculator
        </h1>
        <p className="text-sm text-muted-grey max-w-2xl mx-auto">
          Find the true annualized return on your SIPs, mutual funds, and any investments made on different dates. Enter your cash flows and get your XIRR instantly.
        </p>
      </div>

      {/* Main Container */}
      <div className="p-6 md:p-8 glass-card border border-border-navy/80 rounded-3xl space-y-6 shadow-2xl">
        {/* Top Controls Bar: Tabs & Currency */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-border-navy/60 pb-4">
          <div className="grid grid-cols-2 bg-navy-bg p-1 rounded-xl border border-border-navy/80 w-full sm:w-80">
            <button
              onClick={() => setActiveTab("sip")}
              className={`py-2 px-4 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                activeTab === "sip" ? "bg-emerald text-navy-bg shadow-md" : "text-muted-grey hover:text-white"
              }`}
            >
              SIP Mode
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`py-2 px-4 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                activeTab === "custom" ? "bg-emerald text-navy-bg shadow-md" : "text-muted-grey hover:text-white"
              }`}
            >
              Custom cash flows
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-muted-grey">Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-navy-bg border border-border-navy/80 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>

        {/* --- TAB 1: QUICK SIP MODE --- */}
        {activeTab === "sip" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-grey">Monthly investment</label>
                <NumericInput
                  value={sipMonthly}
                  onChange={setSipMonthly}
                  min={100}
                  max={10000000}
                  step={500}
                  type="currency"
                  className="w-full text-left bg-navy-bg py-2.5 rounded-xl border-border-navy text-sm font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-grey">Invested for</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={sipDuration}
                    onChange={(e) => setSipDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-navy-bg border border-border-navy/80 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-emerald"
                  />
                  <div className="grid grid-cols-2 bg-navy-bg p-0.5 rounded-lg border border-border-navy/80 shrink-0">
                    <button
                      onClick={() => setSipDurationUnit("years")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer ${
                        sipDurationUnit === "years" ? "bg-emerald/20 text-emerald" : "text-muted-grey"
                      }`}
                    >
                      Years
                    </button>
                    <button
                      onClick={() => setSipDurationUnit("months")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer ${
                        sipDurationUnit === "months" ? "bg-emerald/20 text-emerald" : "text-muted-grey"
                      }`}
                    >
                      Months
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-grey">Current value</label>
                <NumericInput
                  value={sipCurrentValue}
                  onChange={setSipCurrentValue}
                  min={0}
                  max={1000000000}
                  step={5000}
                  type="currency"
                  className="w-full text-left bg-navy-bg py-2.5 rounded-xl border-border-navy text-sm font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: CUSTOM CASH FLOWS MODE --- */}
        {activeTab === "custom" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {customFlows.map((flow) => (
                <div
                  key={flow.id}
                  className={`grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-2xl bg-navy-bg border ${
                    flow.type === "invested" ? "border-emerald/40" : "border-blue-500/40"
                  } transition-all`}
                >
                  {/* Type Selector */}
                  <div className="col-span-2 sm:col-span-3">
                    <select
                      value={flow.type}
                      onChange={(e) => updateFlow(flow.id, "type", e.target.value as FlowType)}
                      className={`w-full bg-navy-card/80 border rounded-xl px-3 py-2 text-xs font-extrabold outline-none cursor-pointer ${
                        flow.type === "invested" ? "border-emerald/40 text-emerald" : "border-blue-500/40 text-blue-400"
                      }`}
                    >
                      <option value="invested">📉 Invested</option>
                      <option value="withdrawn">📈 Withdrawn</option>
                    </select>
                  </div>

                  {/* Amount Input */}
                  <div className="col-span-2 sm:col-span-3">
                    <NumericInput
                      value={flow.amount}
                      onChange={(val) => updateFlow(flow.id, "amount", val)}
                      min={0}
                      max={1000000000}
                      step={1000}
                      type="currency"
                      className="w-full text-left text-xs font-bold"
                    />
                  </div>

                  {/* Date Input */}
                  <div className="col-span-1 sm:col-span-3">
                    <input
                      type="date"
                      value={flow.date}
                      onChange={(e) => updateFlow(flow.id, "date", e.target.value)}
                      className="w-full bg-navy-card/80 border border-border-navy rounded-xl px-2 sm:px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-emerald"
                    />
                  </div>

                  {/* Frequency Input */}
                  <div className="col-span-1 sm:col-span-2">
                    <select
                      value={flow.frequency}
                      onChange={(e) => updateFlow(flow.id, "frequency", e.target.value as Frequency)}
                      className="w-full bg-navy-card/80 border border-border-navy rounded-xl px-2 py-2 text-xs font-semibold text-white outline-none cursor-pointer"
                    >
                      <option value="one-off">One-off</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button
                      onClick={() => removeFlow(flow.id)}
                      className="p-1.5 text-muted-grey hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove flow"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions: + Investment / + Withdrawal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addFlow("invested")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald hover:text-navy-bg rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  <Plus size={14} /> + Investment
                </button>
                <button
                  onClick={() => addFlow("withdrawn")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  <Plus size={14} /> + Withdrawal
                </button>
              </div>
              <p className="text-[10px] text-muted-grey">
                Set a frequency to add a whole series in one card. Skip years by just not adding them.
              </p>
            </div>
          </div>
        )}

        {/* --- HERO RESULTS DISPLAY BOX (FINBOOM EXACT DESIGN) --- */}
        <div className="p-6 rounded-2xl bg-navy-bg/90 border border-border-navy/80 space-y-6">
          {xirrResult.success ? (
            <div className="space-y-6">
              {/* Header result row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-navy/60 pb-4">
                <div>
                  <span className="text-xs font-bold text-muted-grey block">Annualized return (XIRR)</span>
                  {adjustInflation && (
                    <span className="text-[10px] text-amber-500 font-semibold">Real (Inflation Adjusted @ {inflation}%)</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-4xl md:text-5xl font-black text-emerald tracking-tight">
                    {adjustInflation ? `${xirrResult.xirrReal}%` : `${xirrResult.xirrNominal}%`}
                  </span>
                </div>
              </div>

              {/* 4 Key Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted-grey block text-[10px] uppercase font-bold">Invested</span>
                  <span className="font-extrabold text-white text-base mt-0.5 block">{fmt(xirrResult.totalInvested)}</span>
                </div>
                <div>
                  <span className="text-muted-grey block text-[10px] uppercase font-bold">Current value</span>
                  <span className="font-extrabold text-white text-base mt-0.5 block">{fmt(xirrResult.totalRedeemed)}</span>
                </div>
                <div>
                  <span className="text-muted-grey block text-[10px] uppercase font-bold">Gain</span>
                  <span className="font-extrabold text-emerald text-base mt-0.5 block">{fmt(xirrResult.netGain)}</span>
                </div>
                <div>
                  <span className="text-muted-grey block text-[10px] uppercase font-bold">Absolute return</span>
                  <span className="font-extrabold text-emerald text-base mt-0.5 block">{xirrResult.absoluteReturn}%</span>
                </div>
              </div>

              {/* Ratio Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="h-3 w-full bg-navy-card rounded-full overflow-hidden flex border border-border-navy/40">
                  <div
                    className="bg-muted-grey/40 h-full transition-all"
                    style={{ width: `${Math.min(100, (xirrResult.totalInvested / Math.max(xirrResult.totalRedeemed, 1)) * 100)}%` }}
                  />
                  <div
                    className="bg-emerald h-full transition-all flex-1"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-grey font-bold">
                  <span>Invested {fmtCompact(xirrResult.totalInvested)}</span>
                  <span>Gains {fmtCompact(xirrResult.netGain)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">
              {xirrResult.error}
            </div>
          )}
        </div>
      </div>

      {/* Educational Guide */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={18} />
          Why XIRR is the number that matters
        </h3>
        <p className="text-xs text-muted-grey leading-relaxed">
          Most people judge an investment by how much it grew: put in 1 lakh, now it is worth 1.35 lakh, so a 35% gain. That absolute return hides the one thing that lets you compare investments fairly: <strong className="text-white">time</strong>. A 35% gain over six months is extraordinary; the same gain over ten years barely keeps up with inflation.
        </p>
        <p className="text-xs text-muted-grey leading-relaxed">
          XIRR (Extended Internal Rate of Return) solves this by calculating your exact money-weighted annualized return, accounting for the timing and amount of every single cash flow.
        </p>
      </section>
    </div>
  );
}
