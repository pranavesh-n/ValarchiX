"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  Info,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Landmark,
  Scale,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
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
import NumericInput from "@/components/NumericInput";

interface DebtCategory {
  name: string;
  duration: string;
  risk: string;
  volatility: string;
  suitableFor: string;
  description: string;
  creditQuality: string;
  typicalYield: number;
}

const DEBT_CATEGORIES: DebtCategory[] = [
  {
    name: "Liquid Funds",
    duration: "Up to 91 Days",
    risk: "Low",
    volatility: "Extremely Low",
    suitableFor: "Parking immediate emergency cash, business reserves, or lump sums before transferring to equities.",
    description: "Invests in highly secure certificate of deposits (CDs) and commercial papers with maturities under 91 days. Yields track central bank interest rates closely.",
    creditQuality: "High (Sovereign / AAA)",
    typicalYield: 6.85
  },
  {
    name: "Money Market Funds",
    duration: "Up to 1 Year",
    risk: "Low-Medium",
    volatility: "Very Low",
    suitableFor: "Conservative investors seeking returns slightly higher than liquid funds for an horizon of 3-12 months.",
    description: "Invests in money market instruments like treasury bills (T-bills) and commercial papers with a maximum maturity of 1 year.",
    creditQuality: "High (AAA)",
    typicalYield: 7.15
  },
  {
    name: "Ultra Short Duration",
    duration: "3 to 6 Months",
    risk: "Low-Medium",
    volatility: "Low",
    suitableFor: "Investors looking to deploy capital for a few months with slightly more return premium than liquid cash.",
    description: "Maintains a portfolio duration between 3 to 6 months. Slightly exposed to minor bond price shifts if interest rates move.",
    creditQuality: "High-Medium",
    typicalYield: 7.10
  },
  {
    name: "Low Duration Funds",
    duration: "6 to 12 Months",
    risk: "Medium",
    volatility: "Low-Medium",
    suitableFor: "Short-term goals like wedding costs, down payments, or fees coming up in 6-12 months.",
    description: "Portfolio duration is maintained between 6 to 12 months. Yield to maturity (YTM) is higher than money market categories.",
    creditQuality: "High-Medium",
    typicalYield: 7.30
  },
  {
    name: "Banking & PSU Funds",
    duration: "1 to 3 Years",
    risk: "Medium",
    volatility: "Medium",
    suitableFor: "Investors seeking high safety of principal (almost zero default risk) for an horizon of 1.5 to 3 years.",
    description: "At least 80% of assets must be lent to banks, public sector undertakings (PSUs), and municipal bodies. Highly secure against defaults.",
    creditQuality: "Extremely High (Sovereign/PSU)",
    typicalYield: 7.45
  },
  {
    name: "Corporate Bond Funds",
    duration: "1 to 3 Years",
    risk: "Medium",
    volatility: "Medium",
    suitableFor: "Conservative savers wanting higher yield than bank deposits, holding for a 2-3 year term.",
    description: "At least 80% of assets are invested in highest-rated AAA corporate bonds. Secure, but sensitive to interest rate cycles.",
    creditQuality: "High (AAA)",
    typicalYield: 7.65
  },
  {
    name: "Credit Risk Funds",
    duration: "1 to 4 Years",
    risk: "High (Default Risk)",
    volatility: "High",
    suitableFor: "Experienced investors willing to take risk of company defaults in exchange for high double-digit yields.",
    description: "Must invest at least 65% of its portfolio in below-AA rated corporate bonds. The fund manager bets on company turnarounds.",
    creditQuality: "Low-Medium (AA / A / BBB)",
    typicalYield: 8.50
  }
];

export default function DebtFundExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<DebtCategory>(DEBT_CATEGORIES[0]);
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 7.0, lastUpdated: "" });

  // Simulator State: Debt MF vs Bank FD under New Tax Regime
  const [simAmount, setSimAmount] = useState(100000);
  const [simYears, setSimYears] = useState(3);
  const [debtYield, setDebtYield] = useState(7.45);
  const [fdRate, setFdRate] = useState(7.0);
  const [taxSlab, setTaxSlab] = useState(20); // 0%, 5%, 10%, 15%, 20%, 25%, 30%
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(7.0);
  const [showSimAudit, setShowSimAudit] = useState(false);

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

  const filteredCategories = DEBT_CATEGORIES.filter((c) => {
    if (timelineFilter === "short") {
      return c.name.includes("Liquid") || c.name.includes("Money") || c.name.includes("Ultra");
    }
    if (timelineFilter === "mid") {
      return c.name.includes("Low") || c.name.includes("Corporate") || c.name.includes("PSU");
    }
    if (timelineFilter === "credit") {
      return c.name.includes("Credit");
    }
    return true;
  });

  // Debt MF vs Bank FD calculations
  const simCalculations = useMemo(() => {
    const P = simAmount;
    const t = simYears;
    const rDebt = debtYield / 100;
    const rFd = fdRate / 100;
    const slabRate = taxSlab / 100;
    const infRate = inflation / 100;

    // Fixed deposit: Interest taxed annually on accrual basis (compounding interrupted by TDS)
    const fdEffectiveAnnualRate = rFd * (1 - slabRate);

    const chartData = [];
    let debtFinalPostTax = 0;
    let debtFinalReal = 0;
    let fdFinalPostTax = 0;
    let fdFinalReal = 0;

    for (let y = 1; y <= t; y++) {
      // Debt MF: compounds at rDebt without tax deduction during holding
      const debtGross = P * Math.pow(1 + rDebt, y);
      const debtGain = debtGross - P;
      const debtTax = debtGain * slabRate; // Section 50AA: taxed at marginal slab on redemption
      const debtNet = debtGross - debtTax;
      const debtReal = debtNet / Math.pow(1 + infRate, y);

      // Bank FD: quarterly compounding with annual tax drag
      const fdGross = P * Math.pow(1 + rFd / 4, 4 * y);
      const fdNet = P * Math.pow(1 + fdEffectiveAnnualRate / 4, 4 * y);
      const fdReal = fdNet / Math.pow(1 + infRate, y);

      chartData.push({
        year: `Yr ${y}`,
        "Debt Mutual Fund (Net)": Math.round(debtNet),
        "Bank FD (Net)": Math.round(fdNet),
        "Debt MF Real Value": Math.round(debtReal),
        "Bank FD Real Value": Math.round(fdReal),
        "Principal": Math.round(P)
      });

      if (y === t) {
        debtFinalPostTax = debtNet;
        debtFinalReal = debtReal;
        fdFinalPostTax = fdNet;
        fdFinalReal = fdReal;
      }
    }

    const netAdvantage = debtFinalPostTax - fdFinalPostTax;

    return {
      principal: P,
      debtFinalPostTax: Math.round(debtFinalPostTax),
      debtFinalReal: Math.round(debtFinalReal),
      fdFinalPostTax: Math.round(fdFinalPostTax),
      fdFinalReal: Math.round(fdFinalReal),
      netAdvantage: Math.round(netAdvantage),
      chartData
    };
  }, [simAmount, simYears, debtYield, fdRate, taxSlab, inflation]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 sm:space-y-10 py-6 animate-fadeIn text-light-grey">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="text-emerald" />
            <span>Debt Funds &amp; Fixed Income Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-grey mt-1">
            Analyze debt mutual fund categories, explore yields, and compare Debt MFs vs Bank FDs under the Default New Tax Regime (Section 50AA).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/fd"
            className="text-xs font-bold text-muted-grey hover:text-white bg-navy-bg border border-border-navy px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
          >
            <Landmark size={14} />
            <span>FD Calculator</span>
          </Link>
          <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg hidden sm:block">
            💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
          </div>
        </div>
      </div>

      {/* Sovereign Baselines Dashboard */}
      <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/30 grid grid-cols-3 gap-4 shadow-lg">
        <div className="text-center md:text-left">
          <span className="text-[10px] uppercase font-bold text-muted-grey block">RBI Policy Repo Rate</span>
          <span className="text-lg md:text-xl font-extrabold text-white block mt-1">{rates.repoRate}%</span>
        </div>
        <div className="text-center md:text-left border-l border-r border-border-navy/60 px-4">
          <span className="text-[10px] uppercase font-bold text-muted-grey block">Sovereign 10Y Bond Yield</span>
          <span className="text-lg md:text-xl font-extrabold text-emerald block mt-1">{rates.bondYield10Y}%</span>
        </div>
        <div className="text-center md:text-left">
          <span className="text-[10px] uppercase font-bold text-muted-grey block">CPI Inflation Baseline</span>
          <span className="text-lg md:text-xl font-extrabold text-amber-400 block mt-1">{rates.inflationRate}%</span>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE DEBT MF vs BANK FD SIMULATOR (NEW TAX REGIME SLABS)
          ========================================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl border border-border-navy bg-navy-card space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-navy pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="text-emerald" size={20} />
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Debt Mutual Fund vs Bank FD Simulator
              </h2>
            </div>
            <p className="text-xs text-muted-grey mt-0.5">
              Simulate tax drag, tax deferral advantage, and real purchasing power under Section 50AA and New Tax Regime Slabs.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald/10 text-emerald border border-emerald/25">
            Section 50AA Compliant
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Principal */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Investment Amount</span>
                <NumericInput
                  value={simAmount}
                  onChange={setSimAmount}
                  min={1000}
                  max={50000000}
                  step={5000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={10000}
                max={2500000}
                step={10000}
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹10,000</span>
                <span>₹25 Lakhs</span>
              </div>
            </div>

            {/* Tenure */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Tenure (Years)</span>
                <NumericInput
                  value={simYears}
                  onChange={setSimYears}
                  min={1}
                  max={10}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={simYears}
                onChange={(e) => setSimYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>1 Yr</span>
                <span>10 Yrs</span>
              </div>
            </div>

            {/* Debt Fund Yield */}
            <div className="space-y-2 border-t border-border-navy/60 pt-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-emerald font-bold">Debt Fund YTM / Return (p.a.)</span>
                <NumericInput
                  value={debtYield}
                  onChange={setDebtYield}
                  min={1}
                  max={15}
                  step={0.05}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={4}
                max={12}
                step={0.1}
                value={debtYield}
                onChange={(e) => setDebtYield(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setDebtYield(rates.bondYield10Y)}
                  className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all"
                >
                  Sovereign 10Y ({rates.bondYield10Y}%)
                </button>
                <button
                  type="button"
                  onClick={() => setDebtYield(7.45)}
                  className="text-[9px] font-bold text-white border border-border-navy bg-navy-light/40 hover:bg-navy-light px-2 py-0.5 rounded transition-all"
                >
                  Banking &amp; PSU (7.45%)
                </button>
              </div>
            </div>

            {/* Bank FD Rate */}
            <div className="space-y-2 border-t border-border-navy/60 pt-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-amber-400 font-bold">Bank Fixed Deposit Rate (p.a.)</span>
                <NumericInput
                  value={fdRate}
                  onChange={setFdRate}
                  min={1}
                  max={15}
                  step={0.05}
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
                className="w-full accent-amber-500 bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setFdRate(rates.repoRate)}
                  className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all"
                >
                  RBI Repo Benchmark ({rates.repoRate}%)
                </button>
              </div>
            </div>

            {/* Income Tax Slab - Full 7 New Tax Regime Slabs */}
            <div className="space-y-2 border-t border-border-navy/60 pt-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">New Tax Regime Slab (FY 2025-26)</span>
                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  {taxSlab}% Bracket
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-navy-bg p-1.5 rounded-xl border border-border-navy text-[10px] font-bold">
                {[0, 5, 10, 15, 20, 25, 30].map((slab) => (
                  <button
                    key={slab}
                    type="button"
                    onClick={() => setTaxSlab(slab)}
                    className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                      taxSlab === slab
                        ? "bg-amber-500 text-navy-bg font-extrabold shadow"
                        : "text-muted-grey hover:text-white hover:bg-navy-light/40"
                    }`}
                  >
                    {slab}%
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-muted-grey leading-tight space-y-0.5 bg-navy-bg/50 p-2 rounded-lg border border-border-navy/40">
                <div className="flex justify-between text-white font-medium">
                  <span>Income Bracket:</span>
                  <span className="text-amber-400 font-bold">
                    {taxSlab === 0 && "Up to ₹4,00,000 / Sec 87A Rebate (Nil)"}
                    {taxSlab === 5 && "₹4,00,001 to ₹8,00,000 (5%)"}
                    {taxSlab === 10 && "₹8,00,001 to ₹12,00,000 (10%)"}
                    {taxSlab === 15 && "₹12,00,001 to ₹16,00,000 (15%)"}
                    {taxSlab === 20 && "₹16,00,001 to ₹20,00,000 (20%)"}
                    {taxSlab === 25 && "₹20,00,001 to ₹24,00,000 (25%)"}
                    {taxSlab === 30 && "Above ₹24,00,000 (30%)"}
                  </span>
                </div>
                <p className="text-muted-grey text-[9px] pt-0.5">
                  *Under New Regime, income up to ₹12 Lakh gets 100% tax rebate under Section 87A (effective tax = 0%).
                </p>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy/60 pt-3 flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                <span>Adjust for Inflation ({inflation}%)</span>
              </label>
              <input
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
                className="rounded border-border-navy text-emerald focus:ring-emerald accent-emerald h-4 w-4"
              />
            </div>
          </div>

          {/* Results & Visuals */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-emerald/30 bg-emerald/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Debt Mutual Fund (Net)</span>
                </span>
                <p className="text-xl font-extrabold text-white mt-1">
                  {formatCurrency(simCalculations.debtFinalPostTax)}
                </p>
                <span className="text-[10px] text-muted-grey block">
                  Real Value: <strong className="text-emerald">{formatCurrency(simCalculations.debtFinalReal)}</strong>
                </span>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                  <Landmark size={12} />
                  <span>Bank Fixed Deposit (Net)</span>
                </span>
                <p className="text-xl font-extrabold text-white mt-1">
                  {formatCurrency(simCalculations.fdFinalPostTax)}
                </p>
                <span className="text-[10px] text-muted-grey block">
                  Real Value: <strong className={simCalculations.fdFinalReal < simAmount ? "text-red-400" : "text-amber-400"}>
                    {formatCurrency(simCalculations.fdFinalReal)}
                  </strong>
                </span>
              </div>

              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-1 col-span-2 md:col-span-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                  <Scale size={12} />
                  <span>Tax Deferral Benefit</span>
                </span>
                <p className="text-xl font-extrabold text-cyan-300 mt-1">
                  {simCalculations.netAdvantage >= 0 ? `+${formatCurrency(simCalculations.netAdvantage)}` : formatCurrency(simCalculations.netAdvantage)}
                </p>
                <span className="text-[10px] text-muted-grey block">
                  Extra wealth earned by unbroken compounding
                </span>
              </div>
            </div>

            {/* Key takeaway note */}
            <div className="p-3.5 rounded-xl border border-border-navy bg-navy-bg/50 text-xs text-muted-grey leading-relaxed space-y-1">
              <strong className="text-white font-bold flex items-center gap-1.5">
                <Info size={14} className="text-emerald" />
                <span>Why Debt Mutual Funds beat Fixed Deposits at the same tax slab:</span>
              </strong>
              <p>
                Under Section 50AA, both instruments are taxed at your marginal slab rate ({taxSlab}%). However, in a bank FD, tax is deducted every year via TDS, reducing your reinvested principal. In a Debt Mutual Fund, <strong>100% of your capital continues to compound</strong> until you redeem your units, earning interest on money that would otherwise have gone to taxes!
              </p>
            </div>

            {/* Area Chart */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border-navy bg-navy-bg/40 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {adjustInflation ? "Real Purchasing Power Comparison" : "Post-Tax Capital Growth Trajectory"}
                </h4>
                <span className="text-[10px] text-muted-grey font-mono">{simYears} Yr Horizon</span>
              </div>

              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simCalculations.chartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorBankFd" x1="0" y1="0" x2="0" y2="1">
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
                        `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${(val / 1000).toFixed(0)}K`}`
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
                      dataKey={adjustInflation ? "Debt MF Real Value" : "Debt Mutual Fund (Net)"}
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorDebt)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey={adjustInflation ? "Bank FD Real Value" : "Bank FD (Net)"}
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#colorBankFd)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Principal"
                      stroke="#64748b"
                      fill="none"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="space-y-3">
        <h3 className="text-lg font-extrabold text-white">Explore Debt Instrument Categories</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTimelineFilter("all")}
            className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer ${
              timelineFilter === "all"
                ? "bg-emerald text-navy-bg border-emerald font-bold"
                : "border-border-navy text-muted-grey hover:border-emerald/40 hover:text-white"
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setTimelineFilter("short")}
            className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer ${
              timelineFilter === "short"
                ? "bg-emerald text-navy-bg border-emerald font-bold"
                : "border-border-navy text-muted-grey hover:border-emerald/40 hover:text-white"
            }`}
          >
            Immediate / Short Term (&lt; 1 Year)
          </button>
          <button
            onClick={() => setTimelineFilter("mid")}
            className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer ${
              timelineFilter === "mid"
                ? "bg-emerald text-navy-bg border-emerald font-bold"
                : "border-border-navy text-muted-grey hover:border-emerald/40 hover:text-white"
            }`}
          >
            Medium Term (1 to 3 Years)
          </button>
          <button
            onClick={() => setTimelineFilter("credit")}
            className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer ${
              timelineFilter === "credit"
                ? "bg-emerald text-navy-bg border-emerald font-bold"
                : "border-border-navy text-muted-grey hover:border-emerald/40 hover:text-white"
            }`}
          >
            High Yield / Credit Risk
          </button>
        </div>
      </div>

      {/* Split Dashboard */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side List */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] uppercase font-bold text-muted-grey tracking-wider block px-1">
            Debt Instruments Categories:
          </span>
          <div className="space-y-2">
            {filteredCategories.map((c) => {
              const isSelected = selectedCategory.name === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    setSelectedCategory(c);
                    setDebtYield(c.typicalYield);
                  }}
                  className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-navy-light border-emerald text-emerald"
                      : "bg-navy-card/25 border-border-navy text-muted-grey hover:bg-navy-light/50 hover:text-white"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold block">{c.name}</span>
                    <span className="text-[10px] text-muted-grey block">Maturity: {c.duration} | Benchmark: ~{c.typicalYield}%</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side Detail Screen */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCategory && (
            <div className="p-6 glass-card space-y-6 animate-fadeIn">
              <div className="flex justify-between items-start border-b border-border-navy/60 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCategory.name}</h2>
                  <p className="text-xs text-muted-grey mt-1">Average Duration: {selectedCategory.duration}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDebtYield(selectedCategory.typicalYield)}
                    className="text-[10px] font-bold text-emerald border border-emerald/30 bg-emerald/10 px-2 py-1 rounded hover:bg-emerald/20 transition-all cursor-pointer"
                  >
                    Test in Simulator ({selectedCategory.typicalYield}%)
                  </button>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    selectedCategory.risk.includes("High") 
                      ? "bg-red-500/10 text-red-400 border border-red-500/25" 
                      : "bg-emerald/10 text-emerald border border-emerald/25"
                  }`}>
                    {selectedCategory.risk} Risk
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-navy-bg border border-border-navy/60">
                  <span className="text-[10px] uppercase font-bold text-muted-grey">Volatility</span>
                  <span className="text-sm font-bold text-white block mt-1">{selectedCategory.volatility}</span>
                </div>
                <div className="p-4 rounded-xl bg-navy-bg border border-border-navy/60">
                  <span className="text-[10px] uppercase font-bold text-muted-grey">Credit Quality Target</span>
                  <span className="text-sm font-bold text-emerald block mt-1">{selectedCategory.creditQuality}</span>
                </div>
                <div className="p-4 rounded-xl bg-navy-bg border border-border-navy/60">
                  <span className="text-[10px] uppercase font-bold text-muted-grey">Maturity Limit</span>
                  <span className="text-sm font-bold text-white block mt-1">{selectedCategory.duration}</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-grey block">How it works:</span>
                  <p className="text-xs text-light-grey leading-relaxed mt-1">{selectedCategory.description}</p>
                </div>

                <div className="p-4 rounded-xl border border-emerald/20 bg-emerald/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald tracking-wide block">Who is this suitable for?</span>
                  <p className="text-xs text-light-grey leading-relaxed">{selectedCategory.suitableFor}</p>
                </div>
              </div>
            </div>
          )}

          {/* Educational Check */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Info className="text-emerald" size={18} />
              <span>Section 50AA Taxation &amp; Default New Tax Regime Guide</span>
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 text-xs text-muted-grey leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald" /> Section 50AA Tax Rules</h4>
                <p>
                  Since April 1, 2023, indexation benefits have been removed for specified mutual funds holding under 35% in domestic equities. Capital gains are added to your gross total income and taxed at your marginal slab rate (0% to 30%).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald" /> The Tax Deferral Alpha</h4>
                <p>
                  While the final tax percentage is identical to Fixed Deposits, Debt MFs have zero TDS and zero annual tax deduction. 100% of your interest compounds until redemption, creating a significant wealth bonus over 3-10 year periods.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
