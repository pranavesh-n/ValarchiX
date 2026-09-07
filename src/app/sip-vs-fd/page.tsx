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
import {
  GitCompare,
  TrendingUp,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  Info,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Layers,
  Percent,
  Coins,
  Scale
} from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function SipVsFdCalculator() {
  const [comparisonMode, setComparisonMode] = useState<"sip" | "lumpsum">("sip");
  const [fundCategory, setFundCategory] = useState<"equity" | "debt">("equity");
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(15);
  const [mfRate, setMfRate] = useState(12.0);
  const [fdRate, setFdRate] = useState(7.0);
  const [fdTaxSlab, setFdTaxSlab] = useState(30); // 0%, 5%, 10%, 15%, 20%, 25%, 30%
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(7.0);
  const [showAudit, setShowAudit] = useState(false);

  // Live dynamic macroeconomic rates
  const [rates, setRates] = useState({
    repoRate: 6.5,
    bondYield10Y: 6.95,
    inflationRate: 7.0,
    equityPostTaxReturn: 10.0
  });

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        if (data.inflationRate) {
          setInflation(data.inflationRate);
        }
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // Update default amount based on mode
  const handleModeChange = (mode: "sip" | "lumpsum") => {
    setComparisonMode(mode);
    if (mode === "sip") {
      setAmount(10000);
    } else {
      setAmount(500000);
    }
  };

  const handleFundCategoryChange = (cat: "equity" | "debt") => {
    setFundCategory(cat);
    if (cat === "debt") {
      setMfRate(7.5);
    } else {
      setMfRate(12.0);
    }
  };

  const calculations = useMemo(() => {
    const data = [];
    const infRate = inflation / 100;
    const rMf = mfRate / 100;
    const rFd = fdRate / 100;
    const taxRate = fdTaxSlab / 100;

    // Fixed deposit post-tax nominal rate (compounded with annual tax drag)
    const fdPostTaxAnnualRate = rFd * (1 - taxRate);

    let totalInvested = 0;
    let mfFinalNominal = 0;
    let mfFinalPostTax = 0;
    let mfFinalReal = 0;

    let fdFinalNominal = 0;
    let fdFinalPostTax = 0;
    let fdFinalReal = 0;

    if (comparisonMode === "sip") {
      // Monthly SIP vs Monthly Recurring Deposit (compounded quarterly)
      const monthlyRateMf = rMf / 12;
      const monthlyRateFd = Math.pow(1 + rFd / 4, 1 / 3) - 1; // quarterly to monthly equivalent
      const monthlyRateFdPostTax = Math.pow(1 + fdPostTaxAnnualRate / 4, 1 / 3) - 1;

      for (let y = 1; y <= years; y++) {
        const totalMonths = y * 12;
        const invested = amount * totalMonths;

        // Mutual Fund Compounding: FV = P * [((1 + i)^n - 1) / i] * (1 + i)
        const mfNominal =
          amount *
          (((Math.pow(1 + monthlyRateMf, totalMonths) - 1) / monthlyRateMf) *
            (1 + monthlyRateMf));
        
        const mfGain = Math.max(0, mfNominal - invested);
        // Taxation model: Equity MF = 12.5% LTCG above ₹1.25L, Debt MF = Slab rate under Section 50AA with tax deferral!
        const mfTax =
          fundCategory === "equity"
            ? Math.max(0, mfGain - 125000) * 0.125
            : mfGain * taxRate;

        const mfPostTax = mfNominal - mfTax;
        const mfReal = mfPostTax / Math.pow(1 + infRate, y);

        // Fixed Deposit (Recurring Deposit quarterly compounding)
        let fdNom = 0;
        let fdPost = 0;
        for (let m = 1; m <= totalMonths; m++) {
          fdNom = (fdNom + amount) * (1 + monthlyRateFd);
          fdPost = (fdPost + amount) * (1 + monthlyRateFdPostTax);
        }
        const fdReal = fdPost / Math.pow(1 + infRate, y);

        data.push({
          year: `Yr ${y}`,
          "Mutual Fund (Real)": Math.round(mfReal),
          "Fixed Deposit (Real)": Math.round(fdReal),
          "Mutual Fund (Nominal)": Math.round(mfPostTax),
          "Fixed Deposit (Nominal)": Math.round(fdPost),
          "Total Invested": Math.round(invested)
        });

        if (y === years) {
          totalInvested = invested;
          mfFinalNominal = mfNominal;
          mfFinalPostTax = mfPostTax;
          mfFinalReal = mfReal;
          fdFinalNominal = fdNom;
          fdFinalPostTax = fdPost;
          fdFinalReal = fdReal;
        }
      }
    } else {
      // Lumpsum Mutual Fund vs Standard Bank FD (quarterly compounding)
      totalInvested = amount;

      for (let y = 1; y <= years; y++) {
        // Mutual fund nominal
        const mfNominal = amount * Math.pow(1 + rMf, y);
        const mfGain = Math.max(0, mfNominal - amount);
        const mfTax =
          fundCategory === "equity"
            ? Math.max(0, mfGain - 125000) * 0.125
            : mfGain * taxRate;

        const mfPostTax = mfNominal - mfTax;
        const mfReal = mfPostTax / Math.pow(1 + infRate, y);

        // Bank FD with quarterly compounding: A = P * (1 + r/4)^(4y)
        const fdGross = amount * Math.pow(1 + rFd / 4, 4 * y);
        const fdInterest = fdGross - amount;
        const fdTax = fdInterest * taxRate;
        const fdPost = fdGross - fdTax;
        const fdReal = fdPost / Math.pow(1 + infRate, y);

        data.push({
          year: `Yr ${y}`,
          "Mutual Fund (Real)": Math.round(mfReal),
          "Fixed Deposit (Real)": Math.round(fdReal),
          "Mutual Fund (Nominal)": Math.round(mfPostTax),
          "Fixed Deposit (Nominal)": Math.round(fdPost),
          "Total Invested": Math.round(amount)
        });

        if (y === years) {
          mfFinalNominal = mfNominal;
          mfFinalPostTax = mfPostTax;
          mfFinalReal = mfReal;
          fdFinalNominal = fdGross;
          fdFinalPostTax = fdPost;
          fdFinalReal = fdReal;
        }
      }
    }

    const wealthGapNominal = mfFinalPostTax - fdFinalPostTax;
    const wealthGapReal = mfFinalReal - fdFinalReal;
    const mfMultiplier = fdFinalPostTax > 0 ? mfFinalPostTax / fdFinalPostTax : 1;

    return {
      totalInvested,
      mfFinalPostTax: Math.round(mfFinalPostTax),
      mfFinalReal: Math.round(mfFinalReal),
      fdFinalPostTax: Math.round(fdFinalPostTax),
      fdFinalReal: Math.round(fdFinalReal),
      wealthGapNominal: Math.round(wealthGapNominal),
      wealthGapReal: Math.round(wealthGapReal),
      mfMultiplier: Number(mfMultiplier.toFixed(2)),
      chartData: data
    };
  }, [comparisonMode, amount, years, mfRate, fdRate, fdTaxSlab, inflation]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 animate-fadeIn max-w-full overflow-x-hidden text-light-grey">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-navy pb-4 sm:pb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight flex items-center gap-2">
            <Scale className="text-emerald shrink-0" />
            <span>SIP vs Fixed Deposit (FD) Comparison</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-grey mt-1">
            Compare Equity Index Mutual Funds against Fixed Deposits under real-world taxation (12.5% LTCG vs 0%-30% Income Tax) and economic inflation.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/fd"
            className="text-xs font-bold text-muted-grey hover:text-white bg-navy-bg border border-border-navy px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Landmark size={14} />
            <span>Standalone FD</span>
          </Link>
          <Link
            href="/sip"
            className="text-xs font-bold text-emerald bg-emerald/10 border border-emerald/30 hover:bg-emerald/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <TrendingUp size={14} />
            <span>SIP Simulator</span>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-4 sm:space-y-5 shadow-xl">
            <h2 className="text-base sm:text-lg font-bold text-heading">Comparison Setup</h2>

            {/* Mode Switch: SIP vs Lumpsum */}
            <div className="flex bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
              <button
                type="button"
                onClick={() => handleModeChange("sip")}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  comparisonMode === "sip" ? "bg-emerald text-navy-bg font-extrabold shadow" : "text-muted-grey hover:text-white"
                }`}
              >
                <TrendingUp size={12} />
                <span>Monthly SIP vs RD</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("lumpsum")}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  comparisonMode === "lumpsum" ? "bg-emerald text-navy-bg font-extrabold shadow" : "text-muted-grey hover:text-white"
                }`}
              >
                <Coins size={12} />
                <span>Lumpsum MF vs FD</span>
              </button>
            </div>

            {/* Investment Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">
                  {comparisonMode === "sip" ? "Monthly Investment" : "Lumpsum Principal"}
                </span>
                <NumericInput
                  value={amount}
                  onChange={setAmount}
                  min={comparisonMode === "sip" ? 500 : 10000}
                  max={comparisonMode === "sip" ? 2000000 : 50000000}
                  step={comparisonMode === "sip" ? 500 : 10000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={comparisonMode === "sip" ? 1000 : 50000}
                max={comparisonMode === "sip" ? 200000 : 2500000}
                step={comparisonMode === "sip" ? 1000 : 25000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>{comparisonMode === "sip" ? "₹1,000" : "₹50,000"}</span>
                <span>{comparisonMode === "sip" ? "₹2 Lakhs" : "₹25 Lakhs"}</span>
              </div>
            </div>

            {/* Time Horizon */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Time Horizon</span>
                <NumericInput
                  value={years}
                  onChange={setYears}
                  min={1}
                  max={35}
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

            {/* Mutual Fund Parameters */}
            <div className="space-y-3 border-t border-border-navy/60 pt-3">
              <div>
                <label className="text-xs font-semibold text-muted-grey block mb-1.5">
                  Fund Type for Comparison
                </label>
                <div className="grid grid-cols-2 gap-1 bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => handleFundCategoryChange("equity")}
                    className={`py-1.5 rounded transition-all text-center ${
                      fundCategory === "equity"
                        ? "bg-emerald text-navy-bg font-extrabold shadow"
                        : "text-muted-grey hover:text-white"
                    }`}
                  >
                    Equity Index MF (12.5% LTCG)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFundCategoryChange("debt")}
                    className={`py-1.5 rounded transition-all text-center ${
                      fundCategory === "debt"
                        ? "bg-emerald text-navy-bg font-extrabold shadow"
                        : "text-muted-grey hover:text-white"
                    }`}
                  >
                    Debt MF (Slab Rate / Sec 50AA)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-emerald font-bold flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>{fundCategory === "equity" ? "Equity MF Expected CAGR" : "Debt MF Expected YTM / Return"}</span>
                  </span>
                  <NumericInput
                    value={mfRate}
                    onChange={setMfRate}
                    min={1}
                    max={40}
                    step={0.1}
                    type="percent"
                  />
                </div>
                <input
                  type="range"
                  min={fundCategory === "equity" ? 6 : 4}
                  max={fundCategory === "equity" ? 20 : 12}
                  step={0.5}
                  value={mfRate}
                  onChange={(e) => setMfRate(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs font-semibold text-muted-grey">
                  <span>{fundCategory === "equity" ? "6%" : "4%"}</span>
                  <span>{fundCategory === "equity" ? "20%" : "12%"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {fundCategory === "equity" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setMfRate(12.0)}
                        className="text-xs font-bold text-emerald border border-emerald/30 bg-emerald/10 hover:bg-emerald/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Nifty 50 Historical (12.0%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMfRate(14.0)}
                        className="text-xs font-bold text-heading border border-border-navy bg-navy-light/60 hover:bg-navy-light px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Flexi Cap (14.0%)
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setMfRate(rates.bondYield10Y)}
                        className="text-xs font-bold text-emerald border border-emerald/30 bg-emerald/10 hover:bg-emerald/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Sovereign 10Y Yield ({rates.bondYield10Y}%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMfRate(7.5)}
                        className="text-xs font-bold text-heading border border-border-navy bg-navy-light/60 hover:bg-navy-light px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Corporate Bond (7.5%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMfRate(7.0)}
                        className="text-xs font-bold text-cyan-400 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Money Market (7.0%)
                      </button>
                    </>
                  )}
                </div>
                <span className="text-xs text-muted-grey block leading-relaxed mt-1">
                  {fundCategory === "equity"
                    ? "*Taxed at 12.5% LTCG on gains exceeding ₹1.25L/year after 12 months."
                    : `*Taxed at your marginal slab rate (${fdTaxSlab}%) under Section 50AA, but tax is deferred until redemption (no annual TDS drag!).`}
                </span>
              </div>
            </div>

            {/* Fixed Deposit Parameters */}
            <div className="space-y-3 border-t border-border-navy/60 pt-3">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span className="text-amber-500 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <Landmark size={14} />
                  <span>Fixed Deposit Rate (p.a.)</span>
                </span>
                <NumericInput
                  value={fdRate}
                  onChange={setFdRate}
                  min={1}
                  max={18}
                  step={0.1}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={4}
                max={10}
                step={0.1}
                value={fdRate}
                onChange={(e) => setFdRate(Number(e.target.value))}
                className="w-full accent-amber-500 bg-navy-bg h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs font-semibold text-muted-grey">
                <span>4%</span>
                <span>10%</span>
              </div>
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setFdRate(rates.repoRate)}
                  className="text-xs font-bold text-emerald border border-emerald/30 bg-emerald/10 hover:bg-emerald/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  RBI Repo Benchmark ({rates.repoRate}%)
                </button>
              </div>

              {/* Tax Slab Selection with all 7 New Tax Regime Slabs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                  <span className="text-heading font-bold">New Tax Regime Slab (FY 2025-26)</span>
                  <span className="text-xs text-amber-500 font-extrabold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">{fdTaxSlab}%</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 bg-navy-bg p-1.5 rounded-xl border border-border-navy text-xs font-bold">
                  {[0, 5, 10, 15, 20, 25, 30].map((slab) => (
                    <button
                      key={slab}
                      type="button"
                      onClick={() => setFdTaxSlab(slab)}
                      className={`py-2 rounded-lg transition-all text-center cursor-pointer font-bold ${
                        fdTaxSlab === slab
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
                    <span>Tax Bracket:</span>
                    <span className="text-amber-500 dark:text-amber-400 font-extrabold">
                      {fdTaxSlab === 0 && "Up to ₹4L / Sec 87A Rebate (Nil)"}
                      {fdTaxSlab === 5 && "₹4L to ₹8L (5%)"}
                      {fdTaxSlab === 10 && "₹8L to ₹12L (10%)"}
                      {fdTaxSlab === 15 && "₹12L to ₹16L (15%)"}
                      {fdTaxSlab === 20 && "₹16L to ₹20L (20%)"}
                      {fdTaxSlab === 25 && "₹20L to ₹24L (25%)"}
                      {fdTaxSlab === 30 && "Above ₹24L (30%)"}
                    </span>
                  </div>
                  <p className="text-muted-grey text-xs pt-1 leading-normal">
                    *Applies to FD interest annually (TDS) and Debt MF at final redemption under Section 50AA. Income up to ₹12L has full 87A rebate (0% tax).
                  </p>
                </div>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-heading flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Calculates real purchasing power.">
                    <HelpCircle size={14} />
                  </span>
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
                    <span className="text-muted-grey">Inflation Benchmark</span>
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
                  <div className="pt-0.5 text-left">
                    <button
                      type="button"
                      onClick={() => setInflation(rates.inflationRate)}
                      className="text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded transition-all"
                    >
                      CPI Baseline ({rates.inflationRate}%)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results & Visuals Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl border border-emerald/30 bg-emerald/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald flex items-center gap-1">
                <TrendingUp size={12} />
                <span>Mutual Fund Final (Post-Tax)</span>
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.mfFinalPostTax)}
              </p>
              <div className="text-[10px] text-muted-grey pt-1">
                Real Purchasing Power: <strong className="text-emerald">{formatCurrency(calculations.mfFinalReal)}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <Landmark size={12} />
                <span>Fixed Deposit Final (Post-Tax)</span>
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.fdFinalPostTax)}
              </p>
              <div className="text-[10px] text-muted-grey pt-1">
                Real Purchasing Power:{" "}
                <strong className={calculations.fdFinalReal < calculations.totalInvested ? "text-red-400" : "text-amber-400"}>
                  {formatCurrency(calculations.fdFinalReal)}
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-1 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                <Scale size={12} />
                <span>Wealth Gap (Opportunity Cost)</span>
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-cyan-300 mt-1">
                +{formatCurrency(calculations.wealthGapNominal)}
              </p>
              <div className="text-[10px] text-muted-grey pt-1">
                Mutual Funds created <strong className="text-cyan-300">{calculations.mfMultiplier}x</strong> the wealth of FD!
              </div>
            </div>
          </div>

          {/* Key Insight Alert */}
          <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck size={16} className="text-emerald" />
              <span>The Mathematics of Real Wealth Divergence</span>
            </div>
            <p className="text-muted-grey">
              Over {years} years, investing {comparisonMode === "sip" ? `₹${amount.toLocaleString("en-IN")}/month` : `₹${amount.toLocaleString("en-IN")} lumpsum`} (total invested: <strong>{formatCurrency(calculations.totalInvested)}</strong>) results in an extra <strong>{formatCurrency(calculations.wealthGapNominal)}</strong> in Mutual Funds after accounting for 12.5% LTCG tax.
            </p>
            {calculations.fdFinalReal < calculations.totalInvested && (
              <p className="text-red-400 font-semibold flex items-center gap-1.5 pt-0.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>FD Wealth Erosion: At {fdTaxSlab}% tax and {inflation}% inflation, your fixed deposit lost purchasing power in real terms.</span>
              </p>
            )}
          </div>

          {/* Area Chart: Real Purchasing Power Comparison */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {adjustInflation ? "Real Purchasing Power Trajectory (Inflation Adjusted)" : "Nominal Post-Tax Growth Trajectory"}
              </h3>
              <span className="text-[10px] text-muted-grey bg-navy-bg px-2 py-0.5 border border-border-navy rounded font-mono">
                {years} Yr Timeline
              </span>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 15, left: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="compMf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="compFd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    width={75}
                    tickFormatter={(val) =>
                      `₹${val >= 10000000 ? `${(val / 10000000).toFixed(1)}Cr` : val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${(val / 1000).toFixed(0)}K`}`
                    }
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
                  <Area
                    type="monotone"
                    dataKey={adjustInflation ? "Mutual Fund (Real)" : "Mutual Fund (Nominal)"}
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#compMf)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey={adjustInflation ? "Fixed Deposit (Real)" : "Fixed Deposit (Nominal)"}
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#compFd)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Total Invested"
                    stroke="#64748b"
                    fill="none"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Manual & Math Audit */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <button
              onClick={() => setShowAudit(!showAudit)}
              className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="text-emerald" size={18} />
                <span>Educational Manual: Comparative Taxation &amp; Mathematical Audit</span>
              </span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
            </button>

            {showAudit && (
              <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-border-navy bg-navy-bg/50 space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-emerald" />
                      <span>Equity Mutual Fund Taxation</span>
                    </h4>
                    <p>
                      <strong>Deferred Tax Advantage:</strong> No tax is payable until units are redeemed. During the compounding phase, 100% of your earnings stay invested and compound tax-free.
                    </p>
                    <p>
                      <strong>Budget 2024 LTCG Rules:</strong> Long-Term Capital Gains (holding &gt; 12 months) are taxed at a flat 12.5% rate with an annual exemption of <strong>₹1,25,000</strong> on profits. Short-Term Capital Gains (&lt; 12 months) are taxed at 20%.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border-navy bg-navy-bg/50 space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <Landmark size={16} className="text-amber-400" />
                      <span>Fixed Deposit Annual Tax Drag</span>
                    </h4>
                    <p>
                      <strong>Annual Accrual Taxation:</strong> Even if your FD is cumulative (payout at maturity), Indian tax laws require you to pay tax every year on the interest accrued under &quot;Income from Other Sources&quot;.
                    </p>
                    <p>
                      <strong>0% Tax Slab vs 30% Slab:</strong> Non-taxable individuals (using Form 15G/15H) keep full interest, but even at 0% tax, a 7% nominal return only matches 7% inflation. For 30% slab investors, the yield drops to 4.90%, shrinking purchasing power every single year.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel / Google Sheets Audit Formulas</h4>
                  <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                    <thead>
                      <tr className="bg-navy-bg/60">
                        <th className="border border-border-navy/80 p-2 text-left">Metric</th>
                        <th className="border border-border-navy/80 p-2 text-left">Excel Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonMode === "sip" ? (
                        <>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">SIP Nominal Future Value</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">=-FV({mfRate}%/12, {years}*12, {amount}, 0, 1)</td>
                          </tr>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">RD Post-Tax Future Value</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">=-FV(({fdRate}*(1-{fdTaxSlab}%)/4+1)^(1/3)-1, {years}*12, {amount}, 0, 1)</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">Lumpsum MF Gross</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">={amount}*(1+{mfRate}%)^{years}</td>
                          </tr>
                          <tr>
                            <td className="border border-border-navy/80 p-2 font-medium text-white">FD Quarterly Post-Tax</td>
                            <td className="border border-border-navy/80 p-2 font-mono text-emerald">={amount} + (-FV({fdRate}%/4, {years}*4, 0, {amount}) - {amount}) * (1 - {fdTaxSlab}%)</td>
                          </tr>
                        </>
                      )}
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Inflation Real Value</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=NominalValue / (1 + {inflation}%)^{years}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This comparison engine is intended for educational purposes to illustrate the impact of compounding, asset taxation, and inflation on capital. Equities are subject to market volatility and do not offer guaranteed returns.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
