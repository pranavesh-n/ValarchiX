"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Info, HelpCircle, ArrowUpRight, AlertTriangle, ShieldCheck, ChevronDown, Coins, Percent, Landmark } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function StepUpSipCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(12);
  const [stepUpType, setStepUpType] = useState<"percent" | "fixed">("percent");
  const [stepUpValue, setStepUpValue] = useState(10); // 10% or ₹1,000
  const [years, setYears] = useState(15);
  const [inflation, setInflation] = useState(5.09);
  const [adjustInflation, setAdjustInflation] = useState(false);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        if (!adjustInflation) {
          setInflation(data.inflationRate);
        }
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // Update step up value defaults when type toggles to maintain sensible bounds
  const handleStepUpTypeChange = (type: "percent" | "fixed") => {
    setStepUpType(type);
    if (type === "percent") {
      setStepUpValue(10); // 10%
    } else {
      setStepUpValue(1000); // ₹1,000
    }
  };

  // Re-calculate the numbers based on state changes
  const calculations = useMemo(() => {
    const data = [];
    const r = rate / 100;
    const infRate = inflation / 100;
    const monthlyRate = r / 12;

    let stepUpInvested = 0;
    let stepUpFutureValue = 0;

    for (let y = 1; y <= years; y++) {
      // Calculate monthly SIP contribution for this specific year
      let currentMonthlySip = amount;
      if (stepUpType === "percent") {
        currentMonthlySip = amount * Math.pow(1 + stepUpValue / 100, y - 1);
      } else {
        currentMonthlySip = amount + (y - 1) * stepUpValue;
      }

      const yearlyInvested = currentMonthlySip * 12;
      stepUpInvested += yearlyInvested;

      // Compound step-up nominal FV
      const stepUpFVPrevCompounded = stepUpFutureValue * Math.pow(1 + monthlyRate, 12);
      const stepUpFVNewCompounded = currentMonthlySip * (((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate) * (1 + monthlyRate));
      stepUpFutureValue = stepUpFVPrevCompounded + stepUpFVNewCompounded;

      // Compound step-up real FV (discounted by inflation to today's purchasing power)
      const stepUpRealFutureValue = stepUpFutureValue / Math.pow(1 + infRate, y);

      // Normal SIP calculations (stays flat at the initial 'amount')
      const normalInvested = amount * y * 12;
      const normalFutureValue = amount * (((Math.pow(1 + monthlyRate, y * 12) - 1) / monthlyRate) * (1 + monthlyRate));
      const normalRealFutureValue = normalFutureValue / Math.pow(1 + infRate, y);

      data.push({
        year: `Yr ${y}`,
        "Step-Up SIP FV": Math.round(adjustInflation ? stepUpRealFutureValue : stepUpFutureValue),
        "Step-Up Invested": Math.round(stepUpInvested),
        "Normal SIP FV": Math.round(adjustInflation ? normalRealFutureValue : normalFutureValue),
        "Normal Invested": Math.round(normalInvested),
      });
    }

    const finalStepUpFV = Math.round(stepUpFutureValue);
    const finalStepUpRealFV = Math.round(stepUpFutureValue / Math.pow(1 + infRate, years));
    const finalStepUpInvested = Math.round(stepUpInvested);

    const finalNormalNominalFV = amount * (((Math.pow(1 + monthlyRate, years * 12) - 1) / monthlyRate) * (1 + monthlyRate));
    const finalNormalFV = Math.round(finalNormalNominalFV);
    const finalNormalRealFV = Math.round(finalNormalNominalFV / Math.pow(1 + infRate, years));
    const finalNormalInvested = Math.round(amount * years * 12);

    return {
      chartData: data,
      stepUpFutureValue: adjustInflation ? finalStepUpRealFV : finalStepUpFV,
      stepUpInvested: finalStepUpInvested,
      normalFutureValue: adjustInflation ? finalNormalRealFV : finalNormalFV,
      normalInvested: finalNormalInvested,
      wealthDifference: (adjustInflation ? finalStepUpRealFV : finalStepUpFV) - (adjustInflation ? finalNormalRealFV : finalNormalFV),
      investedDifference: finalStepUpInvested - finalNormalInvested
    };
  }, [amount, rate, stepUpType, stepUpValue, years, inflation, adjustInflation]);

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
            <ArrowUpRight className="text-emerald shrink-0" />
            <span>Step Up SIP Compounding Simulator</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-grey mt-1">
            Simulate how a yearly increase in SIP contributions accelerates your long-term wealth compounding versus a normal flat SIP.
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
            <h2 className="text-base sm:text-lg font-bold text-heading">Investment Parameters</h2>

            {/* Initial Monthly SIP Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Initial Monthly SIP</span>
                <NumericInput
                  value={amount}
                  onChange={setAmount}
                  min={500}
                  max={1000000}
                  step={500}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={500}
                max={100000}
                step={500}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹500</span>
                <span>₹1L</span>
              </div>
            </div>

            {/* Step Up Type Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-grey block">Annual Step Up Type</label>
              <div className="flex bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => handleStepUpTypeChange("percent")}
                  className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
                    stepUpType === "percent" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => handleStepUpTypeChange("fixed")}
                  className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
                    stepUpType === "fixed" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                  }`}
                >
                  Fixed Amount (₹)
                </button>
              </div>
            </div>

            {/* Step Up Value Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">
                  {stepUpType === "percent" ? "Annual Step Up Percentage" : "Annual Step Up Amount"}
                </span>
                <NumericInput
                  value={stepUpValue}
                  onChange={setStepUpValue}
                  min={stepUpType === "percent" ? 1 : 100}
                  max={stepUpType === "percent" ? 50 : 500000}
                  step={stepUpType === "percent" ? 1 : 100}
                  type={stepUpType === "percent" ? "percent" : "currency"}
                />
              </div>
              <input
                type="range"
                min={stepUpType === "percent" ? 1 : 100}
                max={stepUpType === "percent" ? 30 : 20000}
                step={stepUpType === "percent" ? 1 : 500}
                value={stepUpValue}
                onChange={(e) => setStepUpValue(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>{stepUpType === "percent" ? "1%" : "₹100"}</span>
                <span>{stepUpType === "percent" ? "30%" : "₹20K"}</span>
              </div>
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Expected Return Rate (p.a.)</span>
                <NumericInput
                  value={rate}
                  onChange={setRate}
                  min={1}
                  max={30}
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
                  className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  Sovereign 10Y Yield ({rates.bondYield10Y}%)
                </button>
                <button
                  type="button"
                  onClick={() => setRate(12)}
                  className="text-[9px] font-bold text-white border border-border-navy bg-navy-light/40 hover:bg-navy-light px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  Equity Index (12%)
                </button>
              </div>
            </div>

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
                max={40}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>1 Yr</span>
                <span>40 Yrs</span>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the future compounding value to reflect today's real purchasing power."><HelpCircle size={14} /></span>
                </label>
                <input
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                  className="rounded border-border-navy text-emerald focus:ring-emerald accent-emerald h-4 w-4 cursor-pointer"
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
                      className="text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      CPI Inflation Baseline ({rates.inflationRate}%)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results and Visual Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Step-Up Maturity Value</span>
              <p className="text-xl font-bold text-emerald mt-1">
                {formatCurrency(calculations.stepUpFutureValue)}
              </p>
              <span className="text-[9.5px] text-muted-grey block mt-1">
                Invested: {formatCurrency(calculations.stepUpInvested)}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Normal SIP Maturity Value</span>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {formatCurrency(calculations.normalFutureValue)}
              </p>
              <span className="text-[9.5px] text-muted-grey block mt-1">
                Invested: {formatCurrency(calculations.normalInvested)}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-emerald block">Additional Wealth Gained</span>
              <p className="text-xl font-bold text-emerald glow-emerald mt-1">
                {formatCurrency(calculations.wealthDifference)}
              </p>
              <span className="text-[9.5px] text-muted-grey block mt-1">
                Extra Invested: {formatCurrency(calculations.investedDifference)}
              </span>
            </div>
          </div>

          {/* Chart Display */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Compounding Growth Area Map: Step-Up vs. Normal SIP
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
                    <linearGradient id="colorStepUp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    width={75}
                    tickFormatter={(val) => `₹${val >= 10000000 ? `${(val/10000000).toFixed(1)}Cr` : val >= 100000 ? `${(val/100000).toFixed(1)}L` : `${val/1000}K`}`}
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
                    name="Step-Up SIP FV"
                    dataKey="Step-Up SIP FV"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorStepUp)"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    name="Normal SIP FV"
                    dataKey="Normal SIP FV"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorNormal)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    name="Step-Up Invested"
                    dataKey="Step-Up Invested"
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    fillOpacity={0}
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    name="Normal Invested"
                    dataKey="Normal Invested"
                    stroke="#64748b"
                    strokeDasharray="4 4"
                    fillOpacity={0}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Educational Concept Section */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Info className="text-emerald" size={18} />
              Educational Concept: Normal SIP vs. Step Up SIP
            </h3>

            <div className="text-xs text-muted-grey leading-relaxed space-y-4 border-t border-border-navy/60 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <Landmark size={14} className="text-blue-400" />
                    Normal SIP (Flat Contributions)
                  </h4>
                  <p>
                    A normal SIP is a flat commitment. You allocate a fixed amount (e.g. ₹10,000 every month) for the entire duration of 15-20 years. 
                  </p>
                  <p className="text-[11px] text-muted-grey/80">
                    <strong>Caveat:</strong> While standard compounding still works wonders, your contribution size remains static even as your income/salary increases over time. Your surplus cash is left idle or gets spent, leading to under-investing relative to your capacity.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <ArrowUpRight size={14} className="text-emerald" />
                    Step Up SIP (Dynamic Compounding)
                  </h4>
                  <p>
                    A Step Up SIP dynamically mirrors your financial progression. It increases your monthly contribution at a set frequency (usually annually) by a fixed percentage (e.g. 10%) or a flat amount (e.g. ₹1,000).
                  </p>
                  <p className="text-[11px] text-muted-grey/80">
                    <strong>Compounding Speed:</strong> By stepping up contributions as your salary grows, you invest much more early on and accelerate the compounding curve. This generates a massive wealth surplus (the &quot;wealth gap&quot; seen above) with very little incremental lifestyle friction.
                  </p>
                </div>
              </div>

              <div className="bg-emerald/5 border border-emerald/20 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-[13px] flex items-center gap-1">
                  <ShieldCheck className="text-emerald" size={16} />
                  How it accelerates your compounding curve:
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 mt-1 text-[11px] text-muted-grey">
                  <li><strong>Rupee Cost Averaging Multiplied:</strong> As markets fluctuate, your increasing contribution buys more units when prices fall, multiplying the averaging benefits.</li>
                  <li><strong>Mitigating Lifestyle Creep:</strong> Automatically routing a slice of your annual salary increments to investments prevents you from blowing increments on depreciating luxury liabilities.</li>
                  <li><strong>Dramatic End-Stage Growth:</strong> Because you add more capital each year, the late-stage compounding curve is supercharged, yielding up to 60-120% more wealth compared to a flat SIP.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Mathematical Audit & Sheet Replication */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <button 
              onClick={() => setShowAudit(!showAudit)} 
              className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="text-emerald" size={18} />
                How This is Calculated & Excel Replication
              </span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
            </button>
            
            {showAudit && (
              <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Mathematical Model</h4>
                  <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                    <p>
                      Let monthly return rate i = r / 12
                    </p>
                    <p>
                      For year y from 1 to Y:
                      <br />
                      Monthly SIP in Year y (P_y):
                      <br />
                      &bull; If % step up: P_y = P_1 * (1 + S_pct/100)^(y-1)
                      <br />
                      &bull; If flat step up: P_y = P_1 + (y - 1) * S_amt
                    </p>
                    <p>
                      Maturity Future Value at the end of year y (FV_y):
                      <br />
                      FV_y = FV_y-1 * (1 + i)^12 + P_y * [ ((1 + i)^12 - 1) / i ] * (1 + i)
                      <br />
                      <span className="text-[10px] text-muted-grey">where: FV_0 = 0. The first term compounds existing holdings, and the second compounds the new year&apos;s contributions.</span>
                    </p>
                    <p>
                      Total Invested at Year y:
                      <br />
                      Invested_y = Invested_y-1 + P_y * 12
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel / Google Sheets Replication Code</h4>
                  <p>Since the monthly contribution increases yearly, we model this in Excel using a year-by-year schedule rather than a single formula. Create a table with the following structure:</p>
                  <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                    <thead>
                      <tr className="bg-navy-bg/60">
                        <th className="border border-border-navy/80 p-2 text-left">Column</th>
                        <th className="border border-border-navy/80 p-2 text-left">Formula / Value (For row 2, Year 1)</th>
                        <th className="border border-border-navy/80 p-2 text-left">Formula / Value (For row 3, Year 2)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Year (A)</td>
                        <td className="border border-border-navy/80 p-2">1</td>
                        <td className="border border-border-navy/80 p-2 font-mono">=A2 + 1</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Monthly SIP (B)</td>
                        <td className="border border-border-navy/80 p-2 font-mono">{amount}</td>
                        <td className="border border-border-navy/80 p-2 font-mono">
                          {stepUpType === "percent" 
                            ? `=B2 * (1 + ${stepUpValue}%)` 
                            : `=B2 + ${stepUpValue}`}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Yearly Invested (C)</td>
                        <td className="border border-border-navy/80 p-2 font-mono">=B2 * 12</td>
                        <td className="border border-border-navy/80 p-2 font-mono">=B3 * 12</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Cumulative Invested (D)</td>
                        <td className="border border-border-navy/80 p-2 font-mono">=C2</td>
                        <td className="border border-border-navy/80 p-2 font-mono">=D2 + C3</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Maturity FV (E)</td>
                        <td className="border border-border-navy/80 p-2 font-mono">
                          =-FV({rate}%/12, 12, B2, 0, 1)
                        </td>
                        <td className="border border-border-navy/80 p-2 font-mono">
                          =-FV({rate}%/12, 12, B3, E2, 1)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-muted-grey mt-2">
                    *The formula in cell <strong>E3</strong> compounds the previous year&apos;s ending balance <strong>E2</strong> for 12 months, while compounding the current year&apos;s monthly contribution <strong>B3</strong>. Drag this row down for <strong>{years} rows</strong> to find your exact final maturity value!
                  </p>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This tool is for training purposes only and represents a mathematical compound interest simulator. It does not provide SEBI-registered investment advice or guarantee any capital performance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
