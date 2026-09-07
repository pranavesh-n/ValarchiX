"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Info, HelpCircle, TrendingUp, AlertTriangle, Landmark, ShieldCheck, ChevronDown, GitCompare, ArrowRight, Scale, Coins, CheckCircle2 } from "lucide-react";
import NumericInput from "@/components/NumericInput";

const FREQUENCY_MAP = {
  daily: { label: "Daily", periods: 365 },
  weekly: { label: "Weekly", periods: 52 },
  monthly: { label: "Monthly", periods: 12 },
  quarterly: { label: "Quarterly", periods: 4 },
  yearly: { label: "Yearly", periods: 1 }
};

const FD_COMPOUNDING_MAP = {
  quarterly: { label: "Quarterly (Bank Std)", periods: 4 },
  monthly: { label: "Monthly", periods: 12 },
  "half-yearly": { label: "Half-Yearly", periods: 2 },
  annually: { label: "Annually", periods: 1 }
};

const SIP_LIMITS_MAP = {
  daily: { default: 500, min: 100, max: 50000, step: 100, minSlider: 100, maxSlider: 50000 },
  weekly: { default: 2000, min: 200, max: 200000, step: 500, minSlider: 200, maxSlider: 200000 },
  monthly: { default: 10000, min: 500, max: 2000000, step: 500, minSlider: 500, maxSlider: 500000 },
  quarterly: { default: 25000, min: 1000, max: 5000000, step: 1000, minSlider: 1000, maxSlider: 1000000 },
  yearly: { default: 100000, min: 5000, max: 20000000, step: 5000, minSlider: 500, maxSlider: 5000000 }
};

export default function SipCalculator() {
  const [calcMode, setCalcMode] = useState<"sip" | "lumpsum" | "fd">("sip");
  const [sipFrequency, setSipFrequency] = useState<"daily" | "weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [fdCompounding, setFdCompounding] = useState<"quarterly" | "monthly" | "half-yearly" | "annually">("quarterly");
  const [showAudit, setShowAudit] = useState(false);
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(12);
  const [fdRate, setFdRate] = useState(7.0);
  const [taxSlab, setTaxSlab] = useState(30); // 0%, 10%, 20%, 30%
  const [years, setYears] = useState(15);
  const [inflation, setInflation] = useState(7.0);
  const [adjustInflation, setAdjustInflation] = useState(true);
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

  // Sync amount bounds when frequency or mode changes
  useEffect(() => {
    if (calcMode === "sip") {
      const limits = SIP_LIMITS_MAP[sipFrequency];
      setAmount(limits.default);
    } else {
      setAmount(100000);
    }
  }, [calcMode, sipFrequency]);

  const handleModeChange = (mode: "sip" | "lumpsum" | "fd") => {
    setCalcMode(mode);
    if (mode === "sip") {
      const limits = SIP_LIMITS_MAP[sipFrequency];
      setAmount(limits.default);
      setRate(12);
    } else if (mode === "lumpsum") {
      setAmount(100000);
      setRate(12);
    } else {
      setAmount(100000);
    }
  };

  // Re-calculate the numbers based on state changes
  const calculations = useMemo(() => {
    const data = [];
    let totalInvested = 0;
    let futureValue = 0;
    let inflationAdjustedValue = 0;
    let grossMaturity = 0;
    let totalInterest = 0;
    let postTaxMaturity = 0;

    const r = rate / 100;
    const infRate = inflation / 100;
    
    if (calcMode === "sip") {
      const freqObj = FREQUENCY_MAP[sipFrequency];
      const p = freqObj.periods;
      const ratePerPeriod = r / p;

      for (let y = 1; y <= years; y++) {
        const totalPeriods = y * p;
        const fvValue = amount * (((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod) * (1 + ratePerPeriod));
        const invested = amount * totalPeriods;
        const infAdjustedFv = fvValue / Math.pow(1 + infRate, y);

        totalInvested = invested;
        futureValue = fvValue;
        inflationAdjustedValue = infAdjustedFv;

        data.push({
          year: `Yr ${y}`,
          "Amount Invested": Math.round(invested),
          "Future Value": Math.round(fvValue),
          "Inflation Adjusted": Math.round(infAdjustedFv)
        });
      }
    } else if (calcMode === "lumpsum") {
      for (let y = 1; y <= years; y++) {
        const fvValue = amount * Math.pow(1 + r, y);
        const infAdjustedFv = fvValue / Math.pow(1 + infRate, y);

        totalInvested = amount;
        futureValue = fvValue;
        inflationAdjustedValue = infAdjustedFv;

        data.push({
          year: `Yr ${y}`,
          "Amount Invested": Math.round(amount),
          "Future Value": Math.round(fvValue),
          "Inflation Adjusted": Math.round(infAdjustedFv)
        });
      }
    } else {
      // Standalone FD Mode in SIP Simulator
      const rf = fdRate / 100;
      const m = FD_COMPOUNDING_MAP[fdCompounding].periods;
      const taxRate = taxSlab / 100;

      totalInvested = amount;

      for (let y = 1; y <= years; y++) {
        // Compound interest formula: A = P * (1 + r/m)^(m*y)
        const nominalMaturity = amount * Math.pow(1 + rf / m, m * y);
        const interestEarned = nominalMaturity - amount;
        const taxDeducted = interestEarned * taxRate;
        const netMaturity = nominalMaturity - taxDeducted;
        const realNetMaturity = netMaturity / Math.pow(1 + infRate, y);

        data.push({
          year: `Yr ${y}`,
          "Maturity Value (Gross)": Math.round(nominalMaturity),
          "Post-Tax Maturity Value": Math.round(netMaturity),
          "Inflation Adjusted (Real)": Math.round(realNetMaturity),
          "Principal Invested": Math.round(amount)
        });
      }

      grossMaturity = amount * Math.pow(1 + rf / m, m * years);
      totalInterest = grossMaturity - amount;
      const totalTax = totalInterest * taxRate;
      postTaxMaturity = grossMaturity - totalTax;
      futureValue = postTaxMaturity;
      inflationAdjustedValue = postTaxMaturity / Math.pow(1 + infRate, years);
    }

    return {
      totalInvested,
      futureValue: Math.round(futureValue),
      inflationAdjustedValue: Math.round(inflationAdjustedValue),
      grossMaturity: Math.round(grossMaturity),
      totalInterest: Math.round(totalInterest),
      postTaxMaturity: Math.round(postTaxMaturity),
      chartData: data
    };
  }, [calcMode, amount, rate, fdRate, fdCompounding, taxSlab, years, inflation, sipFrequency]);

  // Dedicated SIP vs FD Real-time Comparison metrics
  const sipVsFdComparison = useMemo(() => {
    const isSip = calcMode === "sip";
    const infRate = inflation / 100;
    const taxRate = taxSlab / 100;
    const mfR = (rate || 12) / 100;
    const fdR = (fdRate || 7) / 100;
    
    let totalInvested = 0;
    let sipNominal = 0;
    let fdNominal = 0;

    if (isSip) {
      const periods = FREQUENCY_MAP[sipFrequency].periods;
      const ratePerPeriod = mfR / periods;
      const totalPeriods = years * periods;
      
      totalInvested = amount * totalPeriods;
      sipNominal = amount * (((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod) * (1 + ratePerPeriod));
      
      // Equivalent RD / Recurring FD compounded quarterly
      let rdMaturity = 0;
      const quarterlyRate = fdR / 4;
      for (let p = 1; p <= totalPeriods; p++) {
        const remainingYears = (totalPeriods - p + 1) / periods;
        rdMaturity += amount * Math.pow(1 + quarterlyRate, 4 * remainingYears);
      }
      fdNominal = rdMaturity;
    } else {
      totalInvested = amount;
      sipNominal = amount * Math.pow(1 + mfR, years);
      fdNominal = amount * Math.pow(1 + fdR / 4, 4 * years);
    }

    // Taxes
    const sipGains = Math.max(0, sipNominal - totalInvested);
    // Indian LTCG: 12.5% on gains exceeding ₹1,25,000 at final redemption
    const sipTax = Math.max(0, sipGains - 125000) * 0.125;
    const sipPostTax = sipNominal - sipTax;
    const sipReal = sipPostTax / Math.pow(1 + infRate, years);

    // FD Tax: marginal slab rate (0% to 30%)
    const fdInterest = Math.max(0, fdNominal - totalInvested);
    const fdTax = fdInterest * taxRate;
    const fdPostTax = totalInvested + (fdInterest - fdTax);
    const fdReal = fdPostTax / Math.pow(1 + infRate, years);

    const extraWealth = sipPostTax - fdPostTax;
    const wealthMultiplier = fdPostTax > 0 ? (sipPostTax / fdPostTax) : 1;
    const sipRealCagr = (Math.pow(sipPostTax / totalInvested, 1 / years) - 1) * 100 - inflation;
    const fdRealCagr = (Math.pow(fdPostTax / totalInvested, 1 / years) - 1) * 100 - inflation;

    return {
      isSip,
      totalInvested: Math.round(totalInvested),
      sipNominal: Math.round(sipNominal),
      sipTax: Math.round(sipTax),
      sipPostTax: Math.round(sipPostTax),
      sipReal: Math.round(sipReal),
      sipRealCagr: sipRealCagr.toFixed(1),
      fdNominal: Math.round(fdNominal),
      fdTax: Math.round(fdTax),
      fdPostTax: Math.round(fdPostTax),
      fdReal: Math.round(fdReal),
      fdRealCagr: fdRealCagr.toFixed(1),
      extraWealth: Math.round(extraWealth),
      wealthMultiplier: wealthMultiplier.toFixed(1)
    };
  }, [calcMode, amount, years, rate, fdRate, taxSlab, inflation, sipFrequency]);

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
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 animate-fadeIn max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-navy pb-4 sm:pb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight flex items-center gap-2">
            <TrendingUp className="text-emerald shrink-0" />
            <span>Compounding & Yield Simulator</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-grey mt-1">
            Simulate compounding speeds, adjust for inflation, and compare Fixed Deposits against Index Mutual Funds.
          </p>
        </div>
        <div className="hidden sm:block text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg shrink-0">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Sliders and Controls */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-4 sm:space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-heading">Investment Parameters</h2>
              <Link
                href="/sip-vs-fd"
                className="text-[10px] font-bold text-emerald hover:text-emerald/80 flex items-center gap-1 bg-emerald/5 border border-emerald/20 px-2 py-1 rounded transition-colors"
                title="Open dedicated SIP vs FD comparison calculator"
              >
                <GitCompare size={12} />
                <span>SIP vs FD Tool</span>
                <ArrowRight size={10} />
              </Link>
            </div>

            {/* Toggle Switch */}
            <div className="flex bg-navy-bg p-1.5 rounded-xl border border-border-navy text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => handleModeChange("sip")}
                className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                  calcMode === "sip" ? "bg-emerald text-slate-950 font-black shadow-sm" : "text-heading bg-navy-card/80 hover:bg-navy-light border border-border-navy/60 font-bold"
                }`}
              >
                SIP Simulator
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("lumpsum")}
                className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                  calcMode === "lumpsum" ? "bg-emerald text-slate-950 font-black shadow-sm" : "text-heading bg-navy-card/80 hover:bg-navy-light border border-border-navy/60 font-bold"
                }`}
              >
                Lumpsum
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("fd")}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
                  calcMode === "fd" ? "bg-emerald text-slate-950 font-black shadow-sm" : "text-heading bg-navy-card/80 hover:bg-navy-light border border-border-navy/60 font-bold"
                }`}
              >
                <Landmark size={14} />
                <span>FD Calculator</span>
              </button>
            </div>

            {/* SIP Frequency Selector */}
            {calcMode === "sip" && (
              <div className="space-y-2 pt-2 animate-fadeIn">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-grey block">
                  SIP Frequency
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-navy-bg p-1.5 rounded-xl border border-border-navy text-[11px] sm:text-xs font-bold">
                  {(["daily", "weekly", "monthly", "quarterly", "yearly"] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setSipFrequency(freq)}
                      className={`py-1.5 px-1 rounded-lg capitalize transition-all cursor-pointer text-center truncate ${
                        sipFrequency === freq 
                          ? "bg-emerald text-slate-950 font-black shadow-sm" 
                          : "text-heading bg-navy-card/80 hover:bg-navy-light border border-border-navy/60 font-bold"
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">
                  {calcMode === "sip" 
                    ? `${FREQUENCY_MAP[sipFrequency].label} SIP Amount` 
                    : calcMode === "fd" 
                    ? "Fixed Deposit Principal" 
                    : "Lumpsum Principal"}
                </span>
                <NumericInput
                  value={amount}
                  onChange={setAmount}
                  min={calcMode === "sip" ? SIP_LIMITS_MAP[sipFrequency].min : 1000}
                  max={calcMode === "sip" ? SIP_LIMITS_MAP[sipFrequency].max : 100000000}
                  step={calcMode === "sip" ? SIP_LIMITS_MAP[sipFrequency].step : 10000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={calcMode === "sip" ? SIP_LIMITS_MAP[sipFrequency].minSlider : 10000}
                max={calcMode === "sip" ? SIP_LIMITS_MAP[sipFrequency].maxSlider : 2500000}
                step={calcMode === "sip" ? SIP_LIMITS_MAP[sipFrequency].step : 10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>
                  {formatCurrency(calcMode === "sip" ? SIP_LIMITS_MAP[sipFrequency].minSlider : 10000)}
                </span>
                <span>
                  {formatCurrency(calcMode === "sip" ? SIP_LIMITS_MAP[sipFrequency].maxSlider : 2500000)}
                </span>
              </div>
            </div>

            {/* Return Slider for SIP & Lumpsum */}
            {calcMode !== "fd" && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Expected Return Rate (p.a.)</span>
                  <NumericInput
                    value={rate}
                    onChange={setRate}
                    min={1}
                    max={50}
                    step={0.1}
                    type="percent"
                  />
                </div>
                <input
                  type="range"
                  min={4}
                  max={25}
                  step={0.5}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-grey">
                  <span>4%</span>
                  <span>25%</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setRate(rates.bondYield10Y)}
                    className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all"
                  >
                    Sovereign 10Y Yield ({rates.bondYield10Y}%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRate(10)}
                    className="text-[9px] font-bold text-white border border-border-navy bg-navy-light/40 hover:bg-navy-light px-2 py-0.5 rounded transition-all"
                  >
                    Equity Index (10% Post-Tax)
                  </button>
                </div>
              </div>
            )}

            {/* FD Controls (Rate, Compounding & Tax Slab) */}
            {calcMode === "fd" && (
              <div className="space-y-4 pt-2 border-t border-border-navy/60 animate-fadeIn">
                {/* FD Interest Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-grey">FD Interest Rate (p.a.)</span>
                    <NumericInput
                      value={fdRate}
                      onChange={setFdRate}
                      min={1}
                      max={20}
                      step={0.1}
                      type="percent"
                    />
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    step={0.1}
                    value={fdRate}
                    onChange={(e) => setFdRate(Number(e.target.value))}
                    className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-grey">
                    <span>4%</span>
                    <span>12%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setFdRate(rates.repoRate)}
                      className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all"
                    >
                      RBI Repo Rate ({rates.repoRate}%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFdRate(7.0)}
                      className="text-[9px] font-bold text-white border border-border-navy bg-navy-light/40 hover:bg-navy-light px-2 py-0.5 rounded transition-all"
                    >
                      Bank FD Standard (7.0%)
                    </button>
                  </div>
                </div>

                {/* Compounding Frequency */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-grey block">
                    Compounding Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                    {(Object.keys(FD_COMPOUNDING_MAP) as (keyof typeof FD_COMPOUNDING_MAP)[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFdCompounding(key)}
                        className={`py-1.5 px-2 rounded transition-colors text-center ${
                          fdCompounding === key ? "bg-emerald text-navy-bg font-extrabold" : "text-muted-grey hover:text-white"
                        }`}
                      >
                        {FD_COMPOUNDING_MAP[key].label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] text-muted-grey block">
                    *Standard Indian commercial banks (SBI, HDFC, ICICI) compound FD interest quarterly.
                  </span>
                </div>

                {/* Tax Slab selector with Full New Tax Regime Slabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                    <span className="text-heading font-bold">
                      New Tax Regime Slab (FY 2025-26)
                    </span>
                    <span className="text-xs text-amber-500 font-extrabold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      {taxSlab}% Bracket
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 bg-navy-bg p-1.5 rounded-xl border border-border-navy text-xs font-bold">
                    {[0, 5, 10, 15, 20, 25, 30].map((slab) => (
                      <button
                        key={slab}
                        type="button"
                        onClick={() => setTaxSlab(slab)}
                        className={`py-2 rounded-lg transition-all text-center cursor-pointer font-bold ${
                          taxSlab === slab
                            ? "bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400/40"
                            : "text-heading bg-navy-card/80 hover:bg-navy-light border border-border-navy/60"
                        }`}
                      >
                        {slab}%
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-grey leading-relaxed space-y-1 bg-navy-bg/80 p-3 rounded-xl border border-border-navy">
                    <div className="flex justify-between text-heading font-semibold">
                      <span>Income Bracket:</span>
                      <span className="text-amber-500 dark:text-amber-400 font-extrabold">
                        {taxSlab === 0 && "Up to ₹4L / Sec 87A Rebate (Nil)"}
                        {taxSlab === 5 && "₹4L to ₹8L (5%)"}
                        {taxSlab === 10 && "₹8L to ₹12L (10%)"}
                        {taxSlab === 15 && "₹12L to ₹16L (15%)"}
                        {taxSlab === 20 && "₹16L to ₹20L (20%)"}
                        {taxSlab === 25 && "₹20L to ₹24L (25%)"}
                        {taxSlab === 30 && "Above ₹24L (30%)"}
                      </span>
                    </div>
                    <p className="text-muted-grey text-xs pt-1 leading-normal">
                      *Under New Regime, income up to ₹12 Lakh receives a full tax rebate under Section 87A (effective tax = 0%).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Time Horizon Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Time Horizon</span>
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
                max={30}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>1 Yr</span>
                <span>30 Yrs</span>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the final value by inflation rate to show real purchasing power."><HelpCircle size={14} /></span>
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

            {/* Quick banner linking to SIP vs FD comparison */}
            <div className="p-3.5 rounded-xl border border-border-navy bg-navy-bg/60 text-xs text-muted-grey space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-heading text-[11px]">
                <GitCompare size={14} className="text-emerald" />
                <span>Want to compare SIP vs FD side-by-side?</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Compare monthly SIP equity wealth vs bank fixed deposits under real-world taxation and post-2024 LTCG rules.
              </p>
              <Link
                href="/sip-vs-fd"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald hover:underline pt-0.5"
              >
                <span>Launch SIP vs FD Simulator</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Results and Visual Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl border border-border-navy bg-navy-card shadow-sm">
              <span className="text-xs uppercase font-bold text-muted-grey block">
                {calcMode === "fd" ? "Deposit Principal" : "Total Invested"}
              </span>
              <p className="text-xl sm:text-2xl font-black text-heading mt-1">
                {formatCurrency(calculations.totalInvested)}
              </p>
              {calcMode === "fd" && (
                <span className="text-xs text-muted-grey block mt-0.5">
                  Interest: +{formatCurrency(calculations.totalInterest)}
                </span>
              )}
            </div>
            
            <div className="p-4 sm:p-5 rounded-2xl border border-border-navy bg-navy-card shadow-sm">
              <span className="text-xs uppercase font-bold text-muted-grey block">
                {calcMode === "fd" ? "Maturity (Post-Tax)" : "Estimated Future Value"}
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald mt-1">
                {formatCurrency(calculations.futureValue)}
              </p>
              {calcMode === "fd" && (
                <span className="text-xs text-muted-grey block mt-0.5">
                  Gross: {formatCurrency(calculations.grossMaturity)} ({taxSlab}% tax)
                </span>
              )}
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-border-navy bg-navy-card shadow-sm col-span-2 md:col-span-1">
              <span className="text-xs uppercase font-bold text-muted-grey block">
                Inflation Adjusted Value
              </span>
              <p className={`text-xl sm:text-2xl font-black mt-1 ${
                calcMode === "fd" && calculations.inflationAdjustedValue < amount ? "text-rose-500" : "text-amber-500 dark:text-amber-400"
              }`}>
                {formatCurrency(calculations.inflationAdjustedValue)}
              </p>
              {calcMode === "fd" && calculations.inflationAdjustedValue < amount && (
                <span className="text-xs text-rose-500 font-semibold block leading-tight mt-0.5">
                  ⚠️ Negative Real Return! Purchasing power shrank.
                </span>
              )}
              {calcMode === "fd" && calculations.inflationAdjustedValue >= amount && (
                <span className="text-xs text-emerald font-semibold block leading-tight mt-0.5">
                  ✓ Purchasing power preserved above inflation.
                </span>
              )}
            </div>
          </div>

          {/* Chart Display */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {calcMode === "fd"
                  ? `Fixed Deposit Growth (${FD_COMPOUNDING_MAP[fdCompounding].label})` 
                  : "Compounding Growth Area Map"}
              </h3>
              <span className="text-[10px] text-muted-grey bg-navy-bg px-2 py-0.5 border border-border-navy rounded font-mono">
                {years} Yr Timeline
              </span>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 15, left: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    width={75}
                    tickFormatter={(val) => `₹${val >= 10000000 ? `${(val/10000000).toFixed(1)}Cr` : val >= 100000 ? `${(val/100000).toFixed(0)}L` : `${(val/1000).toFixed(0)}K`}`}
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
                  <Legend iconType="circle" />
                  
                  {calcMode === "fd" ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="Maturity Value (Gross)"
                        stroke="#38bdf8"
                        fillOpacity={1}
                        fill="url(#colorGross)"
                        strokeWidth={1.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="Post-Tax Maturity Value"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorFv)"
                        strokeWidth={2}
                      />
                      {adjustInflation && (
                        <Area
                          type="monotone"
                          dataKey="Inflation Adjusted (Real)"
                          stroke="#f59e0b"
                          fillOpacity={1}
                          fill="url(#colorReal)"
                          strokeWidth={2}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <Area
                        type="monotone"
                        dataKey="Future Value"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorFv)"
                        strokeWidth={2}
                      />
                      {adjustInflation && (
                        <Area
                          type="monotone"
                          dataKey="Inflation Adjusted"
                          stroke="#f59e0b"
                          fillOpacity={1}
                          fill="url(#colorReal)"
                          strokeWidth={2}
                        />
                      )}
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Educational Note cards */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Info className="text-emerald" size={18} />
              {calcMode === "fd" ? "Fixed Deposit Mechanics & Tax Slabs" : "Educational Concept: Compounding & Purchasing Power"}
            </h3>

            {calcMode === "fd" ? (
              <div className="text-xs text-muted-grey leading-relaxed space-y-3 border-t border-border-navy/60 pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-border-navy bg-navy-bg/50 space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald" />
                      <span>The 0% Tax Slab &amp; Form 15G / 15H</span>
                    </h4>
                    <p>
                      If your total annual income does not exceed the basic tax exemption limit (₹3,00,000 under the New Tax Regime or ₹2,50,000 under the Old Regime), or if your net tax payable is zero due to the Section 87A rebate, you fall in the <strong>0% tax slab</strong>.
                    </p>
                    <p>
                      You can submit <strong>Form 15G</strong> (or <strong>Form 15H</strong> for senior citizens aged 60+) to your bank so that zero TDS is deducted from your FD interest payout.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border-navy bg-navy-bg/50 space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <AlertTriangle size={16} className="text-amber-500" />
                      <span>Real Purchasing Power vs Inflation</span>
                    </h4>
                    <p>
                      With a nominal FD interest rate of <strong>{fdRate}%</strong> and an inflation rate of <strong>{inflation}%</strong>, your post-tax yield at the {taxSlab}% tax bracket is <strong>{(fdRate * (1 - taxSlab / 100)).toFixed(2)}%</strong>.
                    </p>
                    <p>
                      {fdRate * (1 - taxSlab / 100) < inflation ? (
                        <span className="text-red-400 font-semibold">
                          Your money is losing purchasing power by {(inflation - fdRate * (1 - taxSlab / 100)).toFixed(2)}% annually because inflation outpaces your post-tax interest.
                        </span>
                      ) : (
                        <span className="text-emerald font-semibold">
                          Your investment is beating inflation by +{(fdRate * (1 - taxSlab / 100) - inflation).toFixed(2)}% in real purchasing power.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald/5 border border-emerald/20 text-emerald text-xs">
                  <span>Want to see how this FD compares against Index Mutual Funds &amp; SIPs under LTCG tax?</span>
                  <Link href="/sip-vs-fd" className="font-bold underline flex items-center gap-1">
                    Compare SIP vs FD <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-grey leading-relaxed grid md:grid-cols-2 gap-6 border-t border-border-navy/60 pt-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-white">The Compounding Engine</h4>
                  <p>
                    Compounding builds wealth exponentially. Over 15 years, a ₹10,000 monthly SIP (total invested: ₹18 Lakhs) growing at 12% compounds to more than ₹50 Lakhs! Time is the most critical variable—starting 3 years earlier can increase your final wealth by 40% due to late-stage exponential curves.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white">Why Adjust for Inflation?</h4>
                  <p>
                    At 5% inflation, a cup of coffee costing ₹100 today will cost ₹208 in 15 years. While your nominal corpus might reach ₹50 Lakhs, its purchasing power (real value) is equivalent to only ₹24 Lakhs today. Always calibrate your targets using the <strong>Inflation Adjusted</strong> toggle to ensure you budget enough!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Math Audit Section */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <button 
              onClick={() => setShowAudit(!showAudit)} 
              className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="text-emerald" size={18} />
                User Manual &amp; Mathematical Audit
              </span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
            </button>
            
            {showAudit && (
              <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Mathematical Formulas</h4>
                  <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                    {calcMode === "fd" ? (
                      <>
                        <p>
                          <strong>Fixed Deposit Compound Interest:</strong>
                          <br />
                          A = P * (1 + r / m)^(m * y)
                          <br />
                          <span className="text-[10px] text-muted-grey">where: P = principal, r = annual interest rate, m = compounding periods per year ({FD_COMPOUNDING_MAP[fdCompounding].periods} for {FD_COMPOUNDING_MAP[fdCompounding].label}), y = years.</span>
                        </p>
                        <p>
                          <strong>Post-Tax Maturity Value:</strong>
                          <br />
                          Net = P + (A - P) * (1 - taxSlab / 100)
                          <br />
                          <span className="text-[10px] text-muted-grey">where: taxSlab is 0%, 10%, 20%, or 30%. At 0% slab, Net = A (full interest preserved).</span>
                        </p>
                        <p>
                          <strong>Real Value (Inflation Adjusted):</strong>
                          <br />
                          Real Value = Net / (1 + inflation / 100)^y
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong>SIP Future Value ({FREQUENCY_MAP[sipFrequency].label}):</strong>
                          <br />
                          FV = P * [ ((1 + i)^n - 1) / i ] * (1 + i)
                          <br />
                          <span className="text-[10px] text-muted-grey">where: P = deposit, i = period interest rate (r / {FREQUENCY_MAP[sipFrequency].periods}), n = number of periods (years * {FREQUENCY_MAP[sipFrequency].periods}).</span>
                        </p>
                        <p>
                          <strong>Lumpsum Future Value:</strong>
                          <br />
                          FV = P * (1 + r)^y
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Macroeconomic Reference Metrics</h4>
                  <p>
                    • <strong>RBI Repo Rate:</strong> Current benchmark policy rate at <strong>{rates.repoRate}%</strong>. Commercial bank FD deposit rates closely track this rate plus bank margin.
                    <br />
                    • <strong>Sovereign 10Y Yield:</strong> Zero-credit-risk government bond baseline at <strong>{rates.bondYield10Y}%</strong>.
                    <br />
                    • <strong>Baseline Inflation:</strong> Re-calibrated against the CPI inflation index at <strong>{rates.inflationRate}%</strong> to compute real purchasing power.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel Replication (Audit Script)</h4>
                  <p>To replicate the calculations in Excel or Google Sheets, use the following formulas:</p>
                  <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                    <thead>
                      <tr className="bg-navy-bg/60">
                        <th className="border border-border-navy/80 p-2 text-left">Calculation</th>
                        <th className="border border-border-navy/80 p-2 text-left">Excel / Sheets Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calcMode === "fd" ? (
                        <>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">FD Gross Maturity</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">=-FV({fdRate}%/{FD_COMPOUNDING_MAP[fdCompounding].periods}, {years}*{FD_COMPOUNDING_MAP[fdCompounding].periods}, 0, {amount})</td>
                          </tr>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">FD Post-Tax Maturity</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">={amount} + (-FV({fdRate}%/{FD_COMPOUNDING_MAP[fdCompounding].periods}, {years}*{FD_COMPOUNDING_MAP[fdCompounding].periods}, 0, {amount}) - {amount}) * (1 - {taxSlab}%)</td>
                          </tr>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">FD Real Purchasing Power</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">=PostTaxMaturity / (1 + {inflation}%)^{years}</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">SIP Future Value</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">=-FV({rate}%/{FREQUENCY_MAP[sipFrequency].periods}, {years}*{FREQUENCY_MAP[sipFrequency].periods}, {amount}, 0, 1)</td>
                          </tr>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">Lumpsum Future Value</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">=-FV({rate}%, {years}, 0, {amount})</td>
                          </tr>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">Inflation Real Value</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">=-FV(((1 + {rate}%/{FREQUENCY_MAP[sipFrequency].periods})/(1 + {inflation}%/{FREQUENCY_MAP[sipFrequency].periods}) - 1), {years}*{FREQUENCY_MAP[sipFrequency].periods}, {amount}, 0, 1)</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This tool is for educational purposes only and provides mathematical models. Bank rates, TDS regulations, and tax slab treatments are subject to Reserve Bank of India (RBI) notifications and Income Tax Department rules.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⭐ DEDICATED SIP VS FD SECTION BELOW THE SIMULATOR ⭐ */}
      <div className="rounded-3xl border border-border-navy bg-navy-card p-5 sm:p-7 shadow-xl space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-navy pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald/10 text-emerald border border-emerald/20">
                <Scale size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-heading tracking-tight">
                SIP vs Fixed Deposit (FD) Head-to-Head Comparison
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-grey">
              Live mathematical comparison between Equity Index SIP and Bank FD using your active parameters ({formatCurrency(amount)} {calcMode === "sip" ? `${FREQUENCY_MAP[sipFrequency].label} SIP` : "Principal"} over {years} years at {taxSlab}% marginal tax slab and {inflation}% economic inflation).
            </p>
          </div>
          <Link
            href="/sip-vs-fd"
            className="inline-flex items-center gap-2 bg-emerald hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md shrink-0 cursor-pointer"
          >
            <span>Open Dedicated SIP vs FD Solver</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* 3 Comparative Cards */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {/* Equity MF (SIP) Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-emerald/30 bg-navy-bg space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald flex items-center gap-1.5">
                <TrendingUp size={15} />
                <span>Equity Mutual Fund ({rate}%)</span>
              </span>
              <span className="text-xs font-bold text-emerald bg-emerald/10 border border-emerald/30 px-2.5 py-0.5 rounded-full">
                12.5% LTCG Tax
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-muted-grey block">Take-Home Wealth (Post-Tax)</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald mt-0.5">
                {formatCurrency(sipVsFdComparison.sipPostTax)}
              </p>
              <span className="text-xs text-muted-grey block mt-0.5">
                Gross: {formatCurrency(sipVsFdComparison.sipNominal)} • Tax: {formatCurrency(sipVsFdComparison.sipTax)}
              </span>
            </div>
            <div className="pt-2 border-t border-border-navy space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-grey">Real Purchasing Power:</span>
                <span className="font-bold text-heading">{formatCurrency(sipVsFdComparison.sipReal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-grey">Inflation-Adjusted Real CAGR:</span>
                <span className="font-bold text-emerald">+{sipVsFdComparison.sipRealCagr}% / yr</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald/10 border border-emerald/20 text-xs font-semibold text-emerald text-center">
              ✓ Tax deferred until redemption (no annual TDS drag)
            </div>
          </div>

          {/* Fixed Deposit (FD) Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-navy-bg space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                <Landmark size={15} />
                <span>Fixed Deposit ({fdRate}%)</span>
              </span>
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                {taxSlab}% Slab Tax
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-muted-grey block">Take-Home Wealth (Post-Tax)</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 mt-0.5">
                {formatCurrency(sipVsFdComparison.fdPostTax)}
              </p>
              <span className="text-xs text-muted-grey block mt-0.5">
                Gross: {formatCurrency(sipVsFdComparison.fdNominal)} • TDS/Tax: {formatCurrency(sipVsFdComparison.fdTax)}
              </span>
            </div>
            <div className="pt-2 border-t border-border-navy space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-grey">Real Purchasing Power:</span>
                <span className={`font-bold ${sipVsFdComparison.fdReal < sipVsFdComparison.totalInvested ? "text-rose-500" : "text-heading"}`}>
                  {formatCurrency(sipVsFdComparison.fdReal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-grey">Inflation-Adjusted Real CAGR:</span>
                <span className={`font-bold ${Number(sipVsFdComparison.fdRealCagr) < 0 ? "text-rose-500" : "text-amber-500 dark:text-amber-400"}`}>
                  {sipVsFdComparison.fdRealCagr}% / yr
                </span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border text-xs font-semibold text-center ${
              sipVsFdComparison.fdReal < sipVsFdComparison.totalInvested
                ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
            }`}>
              {sipVsFdComparison.fdReal < sipVsFdComparison.totalInvested
                ? "⚠️ Loses purchasing power after taxes & inflation"
                : "Capital preserved with guaranteed interest"}
            </div>
          </div>

          {/* Head-to-Head Verdict / Wealth Difference */}
          <div className="p-4 sm:p-5 rounded-2xl border border-sky-500/30 bg-navy-bg space-y-3 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-500 dark:text-sky-400 flex items-center gap-1.5">
                  <Coins size={15} />
                  <span>The Wealth Gap</span>
                </span>
                <span className="text-xs font-bold text-sky-500 bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
                  {sipVsFdComparison.wealthMultiplier}x Multiplier
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-grey block">SIP Extra Post-Tax Wealth</span>
                <p className="text-2xl sm:text-3xl font-black text-sky-500 dark:text-sky-400 mt-0.5">
                  +{formatCurrency(sipVsFdComparison.extraWealth)}
                </p>
                <span className="text-xs text-muted-grey block mt-0.5">
                  Net surplus over Fixed Deposit after paying all taxes
                </span>
              </div>
              <div className="p-3 rounded-xl bg-navy-card border border-border-navy space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-heading">
                  <CheckCircle2 size={16} className="text-emerald shrink-0" />
                  <span>Total Capital Invested: {formatCurrency(sipVsFdComparison.totalInvested)}</span>
                </div>
                <p className="text-muted-grey text-xs leading-relaxed">
                  Over {years} years, choosing Equity SIP over FD creates <strong>{formatCurrency(sipVsFdComparison.extraWealth)}</strong> in additional wealth due to compounding at {rate}% vs {fdRate}% and superior tax treatment under Section 112A.
                </p>
              </div>
            </div>

            <Link
              href="/sip-vs-fd"
              className="w-full text-center py-2.5 px-4 rounded-xl border border-border-navy bg-navy-card hover:bg-navy-light text-heading font-bold text-xs transition flex items-center justify-center gap-2 mt-2"
            >
              <span>Explore Multi-Asset Stress Test in SIP vs FD</span>
              <ArrowRight size={14} className="text-emerald" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
