"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  Info,
  HelpCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ChevronDown,
  Sparkles
} from "lucide-react";
import NumericInput from "@/components/NumericInput";
import {
  calculateXirrDetailed,
  addMonths,
  parseLocalDate,
  FlowType,
  Frequency,
  CustomFlowItem,
  CashFlow,
  XirrResult
} from "@/lib/engine/xirr";

export default function XirrCalculator() {
  const [activeTab, setActiveTab] = useState<"sip" | "custom">("sip");
  const [currency, setCurrency] = useState("INR");

  // --- Quick SIP Mode State ---
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipDuration, setSipDuration] = useState(3);
  const [sipDurationUnit, setSipDurationUnit] = useState<"years" | "months">("years");
  const [sipCurrentValue, setSipCurrentValue] = useState(450000);

  // --- Custom Cash Flows Mode State (Default matching 1-year ₹1L to ₹1.35L 35% benchmark) ---
  const [customFlows, setCustomFlows] = useState<CustomFlowItem[]>([
    { id: "1", type: "invested", amount: 100000, date: "2025-09-01", frequency: "monthly", count: 1 },
    { id: "2", type: "withdrawn", amount: 135000, date: "2026-09-01", frequency: "one-off", count: 1 }
  ]);

  // --- Inflation Adjustment State (User Configurable) ---
  const [adjustInflation, setAdjustInflation] = useState(false);
  const [inflation, setInflation] = useState(5.09);

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => setInflation(data.inflationRate || 5.09))
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // --- Helper to add a custom flow ---
  const addFlow = (type: FlowType) => {
    const today = new Date().toISOString().split("T")[0];
    const newId = Math.random().toString(36).substring(2, 9);
    setCustomFlows((prev) => [
      ...prev,
      {
        id: newId,
        type,
        amount: type === "invested" ? 10000 : 50000,
        date: today,
        frequency: "one-off",
        count: 1
      }
    ]);
  };

  const removeFlow = (id: string) => {
    if (customFlows.length <= 1) {
      alert("At least 1 cash flow entry is required.");
      return;
    }
    setCustomFlows((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFlow = <K extends keyof CustomFlowItem>(id: string, field: K, val: CustomFlowItem[K]) => {
    setCustomFlows((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: val } : f))
    );
  };

  // --- Currency Formatting Helpers ---
  const fmtCurrency = (v: number) => {
    try {
      return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 0
      }).format(v);
    } catch {
      return `₹${Math.round(v).toLocaleString("en-IN")}`;
    }
  };

  const fmtCompact = (v: number) => {
    const sym = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
    const abs = Math.abs(v);
    const sign = v < 0 ? "-" : "";

    if (currency === "INR") {
      if (abs >= 10000000) return `${sign}${sym}${(abs / 10000000).toFixed(2).replace(/\.00$/, "")}Cr`;
      if (abs >= 100000) return `${sign}${sym}${(abs / 100000).toFixed(1).replace(/\.0$/, "")}L`;
      if (abs >= 1000) return `${sign}${sym}${(abs / 1000).toFixed(0)}K`;
      return `${sign}${sym}${abs}`;
    } else {
      if (abs >= 1000000) return `${sign}${sym}${(abs / 1000000).toFixed(2).replace(/\.00$/, "")}M`;
      if (abs >= 1000) return `${sign}${sym}${(abs / 1000).toFixed(1).replace(/\.0$/, "")}K`;
      return `${sign}${sym}${abs}`;
    }
  };

  // --- Helper for individual card subtext description ---
  const getFlowSummary = (flow: CustomFlowItem) => {
    const count = Math.max(1, flow.count || 1);
    const totalAmount = flow.amount * (flow.frequency === "one-off" ? 1 : count);
    const startDate = parseLocalDate(flow.date);
    const typeLabel = flow.type === "invested" ? "Invested" : "Withdrawn";

    const startMonth = startDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

    if (flow.frequency === "one-off" || count <= 1) {
      return `1 payment ${typeLabel} • ${fmtCompact(totalAmount)} total • ${startMonth} to ${startMonth}`;
    }

    const stepMonths =
      flow.frequency === "monthly"
        ? 1
        : flow.frequency === "quarterly"
        ? 3
        : flow.frequency === "half-yearly"
        ? 6
        : 12;

    const endDate = addMonths(startDate, (count - 1) * stepMonths);
    const endMonth = endDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

    return `${count} payments ${typeLabel} • ${fmtCompact(totalAmount)} total • ${startMonth} to ${endMonth}`;
  };

  // --- Expand recurring custom flows into explicit cash flows ---
  const expandedCashFlows = useMemo<CashFlow[]>(() => {
    if (activeTab === "sip") {
      const totalMonths = sipDurationUnit === "years" ? sipDuration * 12 : sipDuration;
      const flows: CashFlow[] = [];
      const startDate = new Date();
      startDate.setDate(1);

      for (let m = 0; m < totalMonths; m++) {
        const d = addMonths(startDate, m);
        flows.push({ date: d, amount: -Math.abs(sipMonthly) });
      }
      const endDate = addMonths(startDate, totalMonths);
      flows.push({ date: endDate, amount: Math.abs(sipCurrentValue) });
      return flows;
    }

    // Custom Mode Expansion
    const flows: CashFlow[] = [];
    customFlows.forEach((item) => {
      const baseDate = parseLocalDate(item.date);
      const sign = item.type === "invested" ? -1 : 1;
      const val = Math.abs(item.amount) * sign;

      if (item.frequency === "one-off") {
        flows.push({ date: baseDate, amount: val });
      } else {
        const occurrences = Math.max(1, item.count || 1);
        const monthStep =
          item.frequency === "monthly"
            ? 1
            : item.frequency === "quarterly"
            ? 3
            : item.frequency === "half-yearly"
            ? 6
            : 12;

        for (let i = 0; i < occurrences; i++) {
          const d = addMonths(baseDate, i * monthStep);
          flows.push({ date: d, amount: val });
        }
      }
    });

    return flows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activeTab, sipMonthly, sipDuration, sipDurationUnit, sipCurrentValue, customFlows]);

  // --- Calculate XIRR using the robust Brent's method engine ---
  const xirrResult = useMemo<XirrResult>(() => {
    return calculateXirrDetailed(expandedCashFlows, inflation);
  }, [expandedCashFlows, inflation]);

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 px-3 sm:px-6 md:px-8 animate-fadeIn text-light-grey max-w-5xl mx-auto w-full">
      {/* Header Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
          <Calculator className="text-emerald shrink-0" size={30} />
          <span>XIRR Calculator</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-grey max-w-2xl mx-auto px-2">
          Find the true annualized return on your SIPs, mutual funds, and any investments made on different dates. Enter your cash flows and get your XIRR instantly.
        </p>
      </div>

      {/* Main Card Container */}
      <div className="p-4 sm:p-6 md:p-8 glass-card border border-border-navy/80 rounded-2xl sm:rounded-3xl space-y-5 sm:space-y-6 shadow-2xl">
        {/* Top Header: Title / Currency / Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-navy/60 pb-4">
            <h2 className="text-sm sm:text-base font-bold text-white">Your investments</h2>

            <div className="flex items-center gap-2 text-xs font-semibold self-end sm:self-auto">
              <span className="text-muted-grey">Currency</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-navy-bg border border-border-navy/80 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white outline-none cursor-pointer focus:border-emerald transition-all"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-navy-bg p-1 rounded-xl border border-border-navy/80 w-full max-w-sm sm:max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("sip")}
              className={`py-2 px-3 sm:px-4 text-xs font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                activeTab === "sip"
                  ? "bg-emerald text-navy-bg shadow-md"
                  : "text-muted-grey hover:text-white"
              }`}
            >
              SIP Mode
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`py-2 px-3 sm:px-4 text-xs font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                activeTab === "custom"
                  ? "bg-emerald text-navy-bg shadow-md"
                  : "text-muted-grey hover:text-white"
              }`}
            >
              Custom cash flows
            </button>
          </div>
        </div>

        {/* --- TAB 1: QUICK SIP MODE --- */}
        {activeTab === "sip" && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Monthly Investment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-grey block">Monthly investment</label>
                <NumericInput
                  value={sipMonthly}
                  onChange={setSipMonthly}
                  min={100}
                  max={10000000}
                  step={500}
                  type="currency"
                  className="w-full text-left bg-navy-bg py-2.5 px-3 rounded-xl border border-border-navy/80 text-sm font-bold"
                />
              </div>

              {/* Invested For */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-grey block">Invested for</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={sipDuration}
                    onChange={(e) => setSipDuration(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-navy-bg border border-border-navy/80 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-emerald"
                  />
                  <div className="grid grid-cols-2 bg-navy-bg p-0.5 rounded-lg border border-border-navy/80 shrink-0">
                    <button
                      onClick={() => setSipDurationUnit("years")}
                      className={`px-2.5 py-1.5 text-[11px] font-bold rounded cursor-pointer transition-all ${
                        sipDurationUnit === "years" ? "bg-emerald/20 text-emerald" : "text-muted-grey hover:text-white"
                      }`}
                    >
                      Years
                    </button>
                    <button
                      onClick={() => setSipDurationUnit("months")}
                      className={`px-2.5 py-1.5 text-[11px] font-bold rounded cursor-pointer transition-all ${
                        sipDurationUnit === "months" ? "bg-emerald/20 text-emerald" : "text-muted-grey hover:text-white"
                      }`}
                    >
                      Months
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Value / Redemption */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-grey block">Current value / Redemption</label>
                <NumericInput
                  value={sipCurrentValue}
                  onChange={setSipCurrentValue}
                  min={0}
                  max={1000000000}
                  step={5000}
                  type="currency"
                  className="w-full text-left bg-navy-bg py-2.5 px-3 rounded-xl border border-border-navy/80 text-sm font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: CUSTOM CASH FLOWS MODE --- */}
        {activeTab === "custom" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {customFlows.map((flow) => (
                <div
                  key={flow.id}
                  className={`p-3 sm:p-4 rounded-2xl bg-navy-bg/90 border transition-all ${
                    flow.type === "invested"
                      ? "border-emerald/50 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                      : "border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.08)]"
                  } space-y-2.5`}
                >
                  {/* DESKTOP ROW (md and up) */}
                  <div className="hidden md:flex items-center gap-2.5">
                    {/* 1. Type Selector */}
                    <div className="w-32 shrink-0">
                      <select
                        value={flow.type}
                        onChange={(e) => updateFlow(flow.id, "type", e.target.value as FlowType)}
                        className={`w-full bg-navy-card border rounded-xl px-3 py-2 text-xs font-extrabold outline-none cursor-pointer ${
                          flow.type === "invested"
                            ? "border-emerald/40 text-emerald"
                            : "border-blue-500/40 text-blue-400"
                        }`}
                      >
                        <option value="invested">Invested</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>

                    {/* 2. Amount Input */}
                    <div className="flex-1 min-w-[130px]">
                      <NumericInput
                        value={flow.amount}
                        onChange={(val) => updateFlow(flow.id, "amount", val)}
                        min={0}
                        max={1000000000}
                        step={1000}
                        type="currency"
                        className="w-full text-left text-xs font-bold bg-navy-card"
                      />
                    </div>

                    {/* 3. Date Input */}
                    <div className="w-36 shrink-0">
                      <input
                        type="date"
                        value={flow.date}
                        onChange={(e) => updateFlow(flow.id, "date", e.target.value)}
                        className="w-full bg-navy-card border border-border-navy/80 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-emerald"
                      />
                    </div>

                    {/* 4. Frequency Selector */}
                    <div className="w-28 shrink-0">
                      <select
                        value={flow.frequency}
                        onChange={(e) => {
                          const nextFreq = e.target.value as Frequency;
                          updateFlow(flow.id, "frequency", nextFreq);
                          if (nextFreq !== "one-off" && (!flow.count || flow.count < 1)) {
                            updateFlow(flow.id, "count", 1);
                          }
                        }}
                        className="w-full bg-navy-card border border-border-navy/80 rounded-xl px-2.5 py-2 text-xs font-semibold text-white outline-none cursor-pointer focus:border-emerald"
                      >
                        <option value="one-off">One-off</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half-yearly">Half-yearly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    {/* 5. Count Multiplier */}
                    {flow.frequency !== "one-off" && (
                      <div className="flex items-center gap-1.5 shrink-0 bg-navy-card border border-border-navy/80 rounded-xl px-2.5 py-1">
                        <span className="text-xs text-muted-grey font-bold select-none">×</span>
                        <input
                          type="number"
                          min={1}
                          max={1200}
                          value={flow.count || 1}
                          onChange={(e) => {
                            const parsed = parseInt(e.target.value, 10);
                            updateFlow(flow.id, "count", isNaN(parsed) ? 1 : Math.max(1, Math.min(1200, parsed)));
                          }}
                          className="w-10 bg-transparent text-xs font-mono font-bold text-center text-white outline-none"
                          placeholder="1"
                        />
                      </div>
                    )}

                    {/* 6. Remove Button */}
                    <button
                      onClick={() => removeFlow(flow.id)}
                      className="p-2 text-muted-grey hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-500/10 shrink-0 ml-auto"
                      title="Remove flow"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* MOBILE & TABLET LAYOUT (< md) */}
                  <div className="flex md:hidden flex-col gap-2">
                    {/* Top line: Type + Amount + Delete */}
                    <div className="flex items-center gap-2">
                      <div className="w-28 shrink-0">
                        <select
                          value={flow.type}
                          onChange={(e) => updateFlow(flow.id, "type", e.target.value as FlowType)}
                          className={`w-full bg-navy-card border rounded-xl px-2 py-2 text-xs font-extrabold outline-none cursor-pointer ${
                            flow.type === "invested"
                              ? "border-emerald/40 text-emerald"
                              : "border-blue-500/40 text-blue-400"
                          }`}
                        >
                          <option value="invested">Invested</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </div>

                      <div className="flex-1 min-w-0">
                        <NumericInput
                          value={flow.amount}
                          onChange={(val) => updateFlow(flow.id, "amount", val)}
                          min={0}
                          max={1000000000}
                          step={1000}
                          type="currency"
                          className="w-full text-left text-xs font-bold bg-navy-card"
                        />
                      </div>

                      <button
                        onClick={() => removeFlow(flow.id)}
                        className="p-2 text-muted-grey hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-500/10 shrink-0"
                        title="Remove flow"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Bottom line: Date + Frequency + (Optional Count) */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-[120px]">
                        <input
                          type="date"
                          value={flow.date}
                          onChange={(e) => updateFlow(flow.id, "date", e.target.value)}
                          className="w-full bg-navy-card border border-border-navy/80 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-emerald"
                        />
                      </div>

                      <div className="w-28 shrink-0">
                        <select
                          value={flow.frequency}
                          onChange={(e) => {
                            const nextFreq = e.target.value as Frequency;
                            updateFlow(flow.id, "frequency", nextFreq);
                            if (nextFreq !== "one-off" && (!flow.count || flow.count < 1)) {
                              updateFlow(flow.id, "count", 1);
                            }
                          }}
                          className="w-full bg-navy-card border border-border-navy/80 rounded-xl px-2 py-2 text-xs font-semibold text-white outline-none cursor-pointer focus:border-emerald"
                        >
                          <option value="one-off">One-off</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="half-yearly">Half-yearly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      {flow.frequency !== "one-off" && (
                        <div className="flex items-center gap-1 shrink-0 bg-navy-card border border-border-navy/80 rounded-xl px-2 py-1">
                          <span className="text-xs text-muted-grey font-bold select-none">×</span>
                          <input
                            type="number"
                            min={1}
                            max={1200}
                            value={flow.count || 1}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value, 10);
                              updateFlow(flow.id, "count", isNaN(parsed) ? 1 : Math.max(1, Math.min(1200, parsed)));
                            }}
                            className="w-8 bg-transparent text-xs font-mono font-bold text-center text-white outline-none"
                            placeholder="1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Subtext: Count • Total • Date Span */}
                  <div className="text-[11px] text-muted-grey font-medium pl-1 leading-snug">
                    {getFlowSummary(flow)}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions: + Investment / + Withdrawal & Hint */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addFlow("invested")}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2.5 bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald hover:text-navy-bg rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> + Investment
                </button>
                <button
                  onClick={() => addFlow("withdrawn")}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> + Withdrawal
                </button>
              </div>
              <p className="text-[11px] text-muted-grey text-center sm:text-right">
                Set a frequency to add a whole series in one card. Skip years by just not adding them.
              </p>
            </div>
          </div>
        )}

        {/* --- INFLATION ADJUSTMENT SECTION (User Adjustable with Slider & Number Input) --- */}
        <div className="border-t border-border-navy/60 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-grey flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
                className="rounded border-border-navy text-emerald focus:ring-emerald accent-emerald h-4 w-4 cursor-pointer"
              />
              <span className="text-white font-bold">Adjust for Inflation</span>
              <span
                className="text-muted-grey/60 cursor-help inline-flex"
                title="Discounts nominal returns by expected inflation rate to calculate real purchasing power annualized growth."
              >
                <HelpCircle size={14} />
              </span>
            </label>

            {adjustInflation && (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                Real XIRR Active
              </span>
            )}
          </div>

          {adjustInflation && (
            <div className="p-4 rounded-2xl bg-navy-bg/80 border border-amber-500/30 space-y-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-semibold">
                <div>
                  <span className="text-white font-bold block">Expected Annual Inflation Rate</span>
                  <span className="text-[11px] text-muted-grey">Adjust rate to test nominal vs real purchasing power</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <NumericInput
                    value={inflation}
                    onChange={setInflation}
                    min={0}
                    max={25}
                    step={0.1}
                    type="percent"
                    className="text-amber-400 focus-within:border-amber-500/50 bg-navy-card w-28 text-right"
                  />
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.1}
                  value={inflation}
                  onChange={(e) => setInflation(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-navy-card h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-grey font-mono">
                  <span>0% (No Inflation)</span>
                  <span>5.09% (Current CPI)</span>
                  <span>10% (High)</span>
                  <span>20% (Severe)</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-muted-grey font-bold uppercase tracking-wider">Presets:</span>
                {[
                  { label: "CPI Baseline (5.09%)", rate: 5.09 },
                  { label: "Moderate (6.0%)", rate: 6.0 },
                  { label: "Conservative (7.0%)", rate: 7.0 },
                  { label: "High Inflation (8.5%)", rate: 8.5 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setInflation(preset.rate)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer border ${
                      Math.abs(inflation - preset.rate) < 0.05
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                        : "bg-navy-card/60 border-border-navy/60 text-muted-grey hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- HERO RESULTS DISPLAY BOX --- */}
        <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-navy-bg/95 border border-border-navy/90 space-y-5 sm:space-y-6 shadow-xl">
          {xirrResult.success ? (
            <div className="space-y-5 sm:space-y-6">
              {/* Header result row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-border-navy/60 pb-4">
                <div>
                  <span className="text-xs font-bold text-muted-grey block">Annualized return (XIRR)</span>
                  {adjustInflation ? (
                    <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                      Real (Inflation Adjusted @ {inflation}%)
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-grey/70 font-semibold block mt-0.5">
                      Nominal Return
                    </span>
                  )}
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <span
                    className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-mono block ${
                      Number(xirrResult.xirrNominal) >= 0 ? "text-emerald" : "text-red-400"
                    }`}
                  >
                    {adjustInflation ? `${xirrResult.xirrReal}%` : `${xirrResult.xirrNominal}%`}
                  </span>
                </div>
              </div>

              {/* 4 Key Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
                <div className="bg-navy-card/40 p-2.5 sm:p-0 rounded-xl sm:rounded-none">
                  <span className="text-muted-grey block text-[10px] uppercase font-bold tracking-wider">Invested</span>
                  <span className="font-extrabold text-white text-sm sm:text-base md:text-lg mt-0.5 block font-mono truncate">
                    {fmtCurrency(xirrResult.totalInvested)}
                  </span>
                </div>
                <div className="bg-navy-card/40 p-2.5 sm:p-0 rounded-xl sm:rounded-none">
                  <span className="text-muted-grey block text-[10px] uppercase font-bold tracking-wider">Current value</span>
                  <span className="font-extrabold text-white text-sm sm:text-base md:text-lg mt-0.5 block font-mono truncate">
                    {fmtCurrency(xirrResult.totalRedeemed)}
                  </span>
                </div>
                <div className="bg-navy-card/40 p-2.5 sm:p-0 rounded-xl sm:rounded-none">
                  <span className="text-muted-grey block text-[10px] uppercase font-bold tracking-wider">Gain</span>
                  <span
                    className={`font-extrabold text-sm sm:text-base md:text-lg mt-0.5 block font-mono truncate ${
                      xirrResult.netGain >= 0 ? "text-emerald" : "text-red-400"
                    }`}
                  >
                    {xirrResult.netGain >= 0 ? "+" : ""}
                    {fmtCurrency(xirrResult.netGain)}
                  </span>
                </div>
                <div className="bg-navy-card/40 p-2.5 sm:p-0 rounded-xl sm:rounded-none">
                  <span className="text-muted-grey block text-[10px] uppercase font-bold tracking-wider">Absolute return</span>
                  <span
                    className={`font-extrabold text-sm sm:text-base md:text-lg mt-0.5 block font-mono truncate ${
                      Number(xirrResult.absoluteReturn) >= 0 ? "text-emerald" : "text-red-400"
                    }`}
                  >
                    {Number(xirrResult.absoluteReturn) >= 0 ? "+" : ""}
                    {xirrResult.absoluteReturn}%
                  </span>
                </div>
              </div>

              {/* Ratio Progress Bar */}
              <div className="space-y-2 pt-1 sm:pt-2">
                <div className="h-2.5 sm:h-3 w-full bg-navy-card rounded-full overflow-hidden flex border border-border-navy/40">
                  {xirrResult.netGain >= 0 ? (
                    <>
                      <div
                        className="bg-muted-grey/50 h-full transition-all"
                        style={{
                          width: `${Math.max(
                            5,
                            Math.min(95, (xirrResult.totalInvested / Math.max(xirrResult.totalRedeemed, 1)) * 100)
                          )}%`
                        }}
                      />
                      <div className="bg-emerald h-full transition-all flex-1" />
                    </>
                  ) : (
                    <>
                      <div
                        className="bg-emerald h-full transition-all"
                        style={{
                          width: `${Math.max(
                            5,
                            Math.min(95, (xirrResult.totalRedeemed / Math.max(xirrResult.totalInvested, 1)) * 100)
                          )}%`
                        }}
                      />
                      <div className="bg-red-500/70 h-full transition-all flex-1" />
                    </>
                  )}
                </div>
                <div className="flex justify-between text-[11px] sm:text-xs text-muted-grey font-bold">
                  <span>Invested {fmtCompact(xirrResult.totalInvested)}</span>
                  <span>
                    {xirrResult.netGain >= 0 ? "Gains" : "Loss"} {fmtCompact(xirrResult.netGain)}
                  </span>
                </div>
              </div>

              {/* Explanatory Footer Text */}
              <p className="text-[11px] sm:text-xs text-muted-grey/80 leading-relaxed pt-2 border-t border-border-navy/40">
                XIRR annualizes returns across investments made on different dates. It is the money-weighted rate that makes your cash flows balance. Calculated in your browser. Nothing is stored.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs font-semibold space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info size={16} /> Calculation Notice
              </div>
              <p>{xirrResult.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Educational Guide */}
      <section className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-border-navy bg-navy-card/45 space-y-3 sm:space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Info className="text-emerald shrink-0" size={20} />
          <span>Why XIRR is the number that matters</span>
        </h3>
        <p className="text-xs sm:text-sm text-muted-grey leading-relaxed">
          Most people judge an investment by how much it grew: put in 1 lakh, now it is worth 1.35 lakh, so a 35% gain. That absolute return hides the one thing that lets you compare investments fairly: <strong className="text-white">time</strong>. A 35% gain over six months is extraordinary; the same gain over ten years barely keeps up with inflation.
        </p>
        <p className="text-xs sm:text-sm text-muted-grey leading-relaxed">
          XIRR (Extended Internal Rate of Return) solves this by calculating your exact money-weighted annualized return, accounting for the timing and amount of every single cash flow.
        </p>
      </section>
    </div>
  );
}
