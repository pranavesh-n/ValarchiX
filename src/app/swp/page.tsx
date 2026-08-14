"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ArrowDownLeft, Info, HelpCircle, AlertTriangle, ShieldCheck, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function SwpCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [initialCorpus, setInitialCorpus] = useState(5000000); // 50 Lakhs
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(30000);
  const [withdrawalRate, setWithdrawalRate] = useState(7.2); // 7.2% annual rate (30K*12 / 50L)
  const [expectedReturn, setExpectedReturn] = useState(8.5); // Moderate return on conservative allocation
  const [years, setYears] = useState(20);
  const [adjustWithdrawal, setAdjustWithdrawal] = useState(true); // Inflating withdrawals yearly
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // Synchronize corpus changes
  const handleCorpusChange = (newCorpus: number) => {
    setInitialCorpus(newCorpus);
    const calculatedMonthly = Math.round((newCorpus * (withdrawalRate / 100)) / 12);
    setMonthlyWithdrawal(calculatedMonthly);
  };

  // Synchronize withdrawal rate slider/input
  const handleWithdrawalRateChange = (newRate: number) => {
    setWithdrawalRate(newRate);
    const calculatedMonthly = Math.round((initialCorpus * (newRate / 100)) / 12);
    setMonthlyWithdrawal(calculatedMonthly);
  };

  // Synchronize monthly pension input/slider
  const handleMonthlyWithdrawalChange = (newMonthly: number) => {
    setMonthlyWithdrawal(newMonthly);
    if (initialCorpus > 0) {
      const calculatedRate = Number(((newMonthly * 12 / initialCorpus) * 100).toFixed(2));
      setWithdrawalRate(calculatedRate);
    }
  };

  const calculations = useMemo(() => {
    const data = [];
    const monthlyRate = expectedReturn / 100 / 12;
    const infRate = inflation / 100;

    let currentCorpus = initialCorpus;
    let totalWithdrawn = 0;
    let depletionYear = null;
    let baseWithdrawal = monthlyWithdrawal;

    data.push({
      year: "Start",
      "Remaining Corpus": initialCorpus,
      "Cumulative Withdrawn": 0
    });

    for (let y = 1; y <= years; y++) {
      let yearlyWithdrawn = 0;

      for (let m = 1; m <= 12; m++) {
        if (currentCorpus > 0) {
          currentCorpus = currentCorpus * (1 + monthlyRate);
          const withdrawAmt = Math.min(currentCorpus, baseWithdrawal);
          currentCorpus = currentCorpus - withdrawAmt;

          yearlyWithdrawn += withdrawAmt;
          totalWithdrawn += withdrawAmt;

          if (currentCorpus <= 0 && depletionYear === null) {
            depletionYear = y;
          }
        } else {
          if (depletionYear === null) {
            depletionYear = y;
          }
        }
      }

      if (adjustWithdrawal) {
        baseWithdrawal = baseWithdrawal * (1 + infRate);
      }

      data.push({
        year: `Yr ${y}`,
        "Remaining Corpus": Math.max(0, Math.round(currentCorpus)),
        "Cumulative Withdrawn": Math.round(totalWithdrawn)
      });
    }

    const monthTable = [];
    let tableCorpus = initialCorpus;
    let currentMonthlyWithdrawal = monthlyWithdrawal;
    const totalMonths = years * 12;

    for (let m = 1; m <= totalMonths; m++) {
      if (tableCorpus <= 0) {
        monthTable.push({
          month: m,
          opening: 0,
          withdrawal: 0,
          returns: 0,
          closing: 0,
        });
        continue;
      }
      const opening = tableCorpus;
      const returns = opening * monthlyRate;
      const withdrawal = Math.min(opening + returns, currentMonthlyWithdrawal);
      const closing = Math.max(0, opening + returns - withdrawal);

      monthTable.push({
        month: m,
        opening: Math.round(opening),
        withdrawal: Math.round(withdrawal),
        returns: Math.round(returns),
        closing: Math.round(closing),
      });

      tableCorpus = closing;
      if (adjustWithdrawal && m % 12 === 0) {
        currentMonthlyWithdrawal = currentMonthlyWithdrawal * (1 + infRate);
      }
    }

    const calculatedWithdrawalRate = initialCorpus > 0 ? ((monthlyWithdrawal * 12) / initialCorpus) * 100 : 0;

    return {
      totalWithdrawn: Math.round(totalWithdrawn),
      remainingCorpus: Math.max(0, Math.round(currentCorpus)),
      depletionYear,
      withdrawalRate: calculatedWithdrawalRate,
      chartData: data,
      monthTable,
    };
  }, [initialCorpus, monthlyWithdrawal, expectedReturn, years, adjustWithdrawal, inflation]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-navy pb-4 sm:pb-6 gap-3 min-w-0 w-full">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight flex items-center gap-2">
            <ArrowDownLeft className="text-emerald shrink-0" />
            <span className="truncate">SWP Calculator</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-grey mt-1 leading-relaxed">
            Simulate monthly cash flow generation from a mutual fund and track safe withdrawal corpus lifetime.
          </p>
        </div>
        <div className="hidden sm:block text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg shrink-0">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 min-w-0 w-full">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6 min-w-0 w-full">
          <div className="p-3.5 sm:p-6 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-4 sm:space-y-5 shadow-xl min-w-0 w-full overflow-hidden">
            <h2 className="text-base sm:text-lg font-bold text-heading">Investment Settings</h2>

            {/* Initial Corpus Slider */}
            <div className="space-y-1.5 min-w-0 w-full">
              <div className="flex justify-between items-center text-xs font-semibold gap-2 min-w-0 w-full">
                <span className="text-muted-grey min-w-0 truncate">Initial Corpus</span>
                <NumericInput
                  value={initialCorpus}
                  onChange={handleCorpusChange}
                  min={100000}
                  max={1000000000}
                  step={100000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={100000}
                max={500000000}
                step={500000}
                value={initialCorpus}
                onChange={(e) => handleCorpusChange(Number(e.target.value))}
                className="w-full max-w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-grey min-w-0 w-full">
                <span>₹1L</span>
                <span>₹50 Cr</span>
              </div>
            </div>

            {/* Annual Withdrawal Rate (%) Slider */}
            <div className="space-y-1.5 min-w-0 w-full">
              <div className="flex justify-between items-center text-xs font-semibold gap-2 min-w-0 w-full">
                <span className="text-muted-grey min-w-0 truncate">Annual Withdrawal Rate</span>
                <NumericInput
                  value={withdrawalRate}
                  onChange={handleWithdrawalRateChange}
                  min={0.5}
                  max={25}
                  step={0.1}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={0.1}
                value={withdrawalRate}
                onChange={(e) => handleWithdrawalRateChange(Number(e.target.value))}
                className="w-full max-w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-grey min-w-0 w-full">
                <span>1% (Safe)</span>
                <span>3% Benchmark</span>
                <span>15% (High)</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1 min-w-0 w-full text-center">
                <button
                  type="button"
                  onClick={() => handleWithdrawalRateChange(3.0)}
                  className={`text-[9px] sm:text-[10px] font-bold px-1 py-1 rounded transition-all cursor-pointer truncate ${withdrawalRate === 3.0 ? "bg-emerald text-navy-bg" : "text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10"
                    }`}
                >
                  🇮🇳 3% Safe
                </button>
                <button
                  type="button"
                  onClick={() => handleWithdrawalRateChange(4.0)}
                  className={`text-[9px] sm:text-[10px] font-bold px-1 py-1 rounded transition-all cursor-pointer truncate ${withdrawalRate === 4.0 ? "bg-emerald text-navy-bg" : "text-heading border border-border-navy bg-navy-light/40 hover:bg-navy-light"
                    }`}
                >
                  4% Trinity
                </button>
                <button
                  type="button"
                  onClick={() => handleWithdrawalRateChange(6.0)}
                  className={`text-[9px] sm:text-[10px] font-bold px-1 py-1 rounded transition-all cursor-pointer truncate ${withdrawalRate === 6.0 ? "bg-amber-400 text-navy-bg" : "text-amber-400 border border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10"
                    }`}
                >
                  6% Moderate
                </button>
              </div>
            </div>

            {/* Monthly Withdrawal Slider */}
            <div className="space-y-1.5 min-w-0 w-full">
              <div className="flex justify-between items-center text-xs font-semibold gap-2 min-w-0 w-full">
                <span className="text-muted-grey min-w-0 truncate">Desired Monthly Pension</span>
                <NumericInput
                  value={monthlyWithdrawal}
                  onChange={handleMonthlyWithdrawalChange}
                  min={1000}
                  max={10000000}
                  step={1000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={5000}
                max={5000000}
                step={5000}
                value={monthlyWithdrawal}
                onChange={(e) => handleMonthlyWithdrawalChange(Number(e.target.value))}
                className="w-full max-w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-grey min-w-0 w-full">
                <span>₹5K</span>
                <span>₹50L / Mo</span>
              </div>
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-1.5 min-w-0 w-full">
              <div className="flex justify-between items-center text-xs font-semibold gap-2 min-w-0 w-full">
                <span className="text-muted-grey min-w-0 truncate">Expected Yield (p.a.)</span>
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
                max={30}
                step={0.5}
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full max-w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-grey min-w-0 w-full">
                <span>4%</span>
                <span>30%</span>
              </div>
              <div className="pt-1 min-w-0 w-full">
                <button
                  type="button"
                  onClick={() => setExpectedReturn(rates.bondYield10Y)}
                  className="w-full text-[9px] sm:text-[10px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-1 rounded transition-all cursor-pointer truncate text-center"
                >
                  Sovereign 10Y Yield ({rates.bondYield10Y}%)
                </button>
              </div>
            </div>

            {/* SWP Horizon Slider */}
            <div className="space-y-1.5 min-w-0 w-full">
              <div className="flex justify-between items-center text-xs font-semibold gap-2 min-w-0 w-full">
                <span className="text-muted-grey min-w-0 truncate">SWP Horizon</span>
                <NumericInput
                  value={years}
                  onChange={setYears}
                  min={1}
                  max={100}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full max-w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-grey min-w-0 w-full">
                <span>5 Yrs</span>
                <span>100 Yrs</span>
              </div>
            </div>

            {/* Adjust Withdrawal for Inflation */}
            <div className="border-t border-border-navy pt-3 space-y-3 min-w-0 w-full">
              <div className="flex items-center justify-between min-w-0 w-full">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5 min-w-0 truncate">
                  <span className="truncate">Inflate Pension Annually</span>
                  <span className="text-muted-grey/60 cursor-help inline-flex shrink-0" title="Increases monthly withdrawals annually by inflation to preserve purchasing power."><HelpCircle size={14} /></span>
                </label>
                <input
                  type="checkbox"
                  checked={adjustWithdrawal}
                  onChange={(e) => setAdjustWithdrawal(e.target.checked)}
                  className="rounded border-border-navy text-emerald focus:ring-emerald accent-emerald h-4 w-4 cursor-pointer shrink-0"
                />
              </div>

              {adjustWithdrawal && (
                <div className="space-y-1.5 animate-fadeIn min-w-0 w-full">
                  <div className="flex justify-between items-center text-xs font-semibold gap-2 min-w-0 w-full">
                    <span className="text-muted-grey min-w-0 truncate">Expected Inflation</span>
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
                    max={20}
                    step={0.5}
                    value={inflation}
                    onChange={(e) => setInflation(Number(e.target.value))}
                    className="w-full max-w-full accent-amber-500 bg-navy-bg h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-grey min-w-0 w-full">
                    <span>3%</span>
                    <span>20%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0 w-full">
          {/* Status Banners */}
          {calculations.depletionYear !== null || calculations.remainingCorpus <= 0 ? (
            <div className="p-3.5 sm:p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-2.5 sm:gap-3 text-red-400 text-xs leading-relaxed animate-pulse min-w-0 w-full">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <div className="min-w-0 flex-1">
                <strong className="text-sm font-bold block text-red-400">⚠️ Alert: Corpus Depleted Prematurely</strong>
                Your annual withdrawal rate of <strong>{calculations.withdrawalRate.toFixed(2)}%</strong> is unsustainably high for your return yield. Your retirement nest egg ran completely dry in <strong>Year {calculations.depletionYear || years}</strong>. Reduce monthly withdrawals or increase equity allocation to protect your capital.
              </div>
            </div>
          ) : calculations.remainingCorpus < initialCorpus ? (
            <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-2.5 sm:gap-3 text-amber-400 text-xs leading-relaxed min-w-0 w-full">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <div className="min-w-0 flex-1">
                <strong className="text-sm font-bold block text-amber-400">⚠️ Capital Erosion SWP Strategy</strong>
                Your annual withdrawal rate of <strong>{calculations.withdrawalRate.toFixed(2)}%</strong> exceeds your net real yield, resulting in gradual principal draw-down. Your nest egg drops from <strong>{formatCurrency(initialCorpus)}</strong> to <strong>{formatCurrency(calculations.remainingCorpus)}</strong> over {years} years. Consider trimming withdrawals to preserve principal long-term.
              </div>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-xl border border-emerald/20 bg-emerald/10 flex items-start gap-2.5 sm:gap-3 text-emerald text-xs leading-relaxed min-w-0 w-full">
              <ShieldCheck className="shrink-0 mt-0.5" size={18} />
              <div className="min-w-0 flex-1">
                <strong className="text-sm font-bold block">🛡️ Safe & Self-Sustaining SWP Strategy</strong>
                Your annual withdrawal rate of <strong>{calculations.withdrawalRate.toFixed(2)}%</strong> is well within safe limits. Your retirement corpus compounds faster than withdrawals, allowing the nest egg to grow to <strong>{formatCurrency(calculations.remainingCorpus)}</strong> across the {years}-year term.
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 min-w-0 w-full">
            <div className="p-3 sm:p-4 rounded-xl border border-border-navy bg-navy-card min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-grey block truncate">Initial Principal</span>
              <p className="text-xs sm:text-lg font-bold text-heading mt-1 truncate">
                {formatCurrency(initialCorpus)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 truncate">
                Rate: {calculations.withdrawalRate.toFixed(1)}%/yr
              </span>
            </div>
            <div className="p-3 sm:p-4 rounded-xl border border-border-navy bg-navy-card min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-grey block truncate">Total Pension Paid</span>
              <p className="text-xs sm:text-lg font-bold text-emerald mt-1 truncate">
                {formatCurrency(calculations.totalWithdrawn)}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl border border-border-navy bg-navy-card min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-grey block truncate">Withdrawal Rate</span>
              <p className={`text-xs sm:text-lg font-bold mt-1 truncate ${calculations.withdrawalRate <= 4 ? "text-emerald" : calculations.withdrawalRate <= 6 ? "text-amber-400" : "text-red-400"}`}>
                {calculations.withdrawalRate.toFixed(2)}%
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 truncate">
                {calculations.withdrawalRate <= 4 ? "Safe (< 4%)" : calculations.withdrawalRate <= 6 ? "Moderate" : "High"}
              </span>
            </div>
            <div className="p-3 sm:p-4 rounded-xl border border-border-navy bg-navy-card min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-grey block truncate">Remaining Balance</span>
              <p className={`text-xs sm:text-lg font-bold mt-1 truncate ${calculations.remainingCorpus >= initialCorpus ? "text-emerald" : calculations.remainingCorpus > 0 ? "text-amber-400" : "text-red-400"}`}>
                {formatCurrency(calculations.remainingCorpus)}
              </p>
            </div>
          </div>

          {/* Chart Display */}
          <div className="p-3.5 sm:p-6 rounded-2xl border border-border-navy bg-navy-card space-y-4 shadow-xl min-w-0 w-full overflow-hidden">
            <h3 className="text-xs sm:text-sm font-bold text-heading uppercase tracking-wider truncate">
              SWP Wealth Exhaustion Curve Map
            </h3>
            <div className="h-[220px] sm:h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWithdrawn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    width={45}
                    tickFormatter={(val) => val >= 10000000 ? `${(val / 10000000).toFixed(0)}Cr` : val >= 100000 ? `${(val / 100000).toFixed(0)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : `${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#081c3a",
                      borderColor: "#112d55",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                      fontSize: "12px"
                    }}
                    formatter={(v: any, name: any) => [formatCurrency(v), name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  <Area
                    type="monotone"
                    dataKey="Remaining Corpus"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorCorpus)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Cumulative Withdrawn"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorWithdrawn)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Month-by-Month Breakdown Table (12-month paginated ledger style) */}
          {(() => {
            const itemsPerPage = 12;
            const totalPages = Math.max(1, Math.ceil(calculations.monthTable.length / itemsPerPage));
            const currentPageBounded = Math.min(currentPage, totalPages);
            const paginatedRows = calculations.monthTable.slice(
              (currentPageBounded - 1) * itemsPerPage,
              currentPageBounded * itemsPerPage
            );

            return (
              <div className="p-3.5 sm:p-6 rounded-2xl border border-border-navy bg-navy-card space-y-4 shadow-xl min-w-0 w-full overflow-hidden">
                <div className="flex items-center justify-between min-w-0 w-full gap-2">
                  <h3 className="text-xs sm:text-base font-extrabold text-heading truncate">Month-by-Month Breakdown</h3>
                  <span className="text-[10px] sm:text-xs text-muted-grey shrink-0">Yr {currentPageBounded}/{totalPages}</span>
                </div>

                <div className="overflow-x-auto border border-border-navy/60 rounded-xl min-w-0 w-full">
                  <table className="w-full text-left text-xs min-w-[340px]">
                    <thead className="bg-navy-bg border-b border-border-navy text-muted-grey uppercase font-bold text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Mo</th>
                        <th className="py-2.5 px-3">Opening</th>
                        <th className="py-2.5 px-3">Withdrawal</th>
                        <th className="py-2.5 px-3">Returns</th>
                        <th className="py-2.5 px-3">Closing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-navy/40">
                      {paginatedRows.map((row) => (
                        <tr key={row.month} className="hover:bg-navy-light/40 transition">
                          <td className="py-2 px-3 font-bold text-heading">#{row.month}</td>
                          <td className="py-2 px-3 text-light-grey">{formatCurrency(row.opening)}</td>
                          <td className="py-2 px-3 font-semibold text-rose-400">-{formatCurrency(row.withdrawal)}</td>
                          <td className="py-2 px-3 text-emerald">+{formatCurrency(row.returns)}</td>
                          <td className="py-2 px-3 font-bold text-heading">{formatCurrency(row.closing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-2 min-w-0 w-full gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPageBounded === 1}
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border border-border-navy bg-navy-bg text-light-grey disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald/40 transition cursor-pointer shrink-0"
                  >
                    <ChevronLeft size={14} /> Prev Year
                  </button>
                  <span className="text-[10px] sm:text-xs font-semibold text-muted-grey truncate text-center">
                    Yr {currentPageBounded} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPageBounded === totalPages}
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border border-border-navy bg-navy-bg text-light-grey disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald/40 transition cursor-pointer shrink-0"
                  >
                    Next Year <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
