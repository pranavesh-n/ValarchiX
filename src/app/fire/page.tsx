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
import { Info, HelpCircle, Flame, ShieldCheck, ChevronDown, Landmark, Sparkles } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function FireCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [currentAge, setCurrentAge] = useState(28);
  const [targetAge, setTargetAge] = useState(45);
  const [expenses, setExpenses] = useState(50000); // monthly expenses today
  const [savings, setSavings] = useState(500000); // current net worth
  const [preRate, setPreRate] = useState(12); // expected index returns
  const [postRate, setPostRate] = useState(7); // safe retirement yields (nominal)
  const [inflation, setInflation] = useState(5.09); // baseline inflation
  const [swr, setSwr] = useState(3.0); // Safe Withdrawal Rate (3.0% India benchmark)
  const [fireMultiplier, setFireMultiplier] = useState(1.0); // lifestyle toggle
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

  // Set default post-retirement rates when changing FIRE lifestyles
  const handleFireMultiplierChange = (multiplier: number) => {
    setFireMultiplier(multiplier);
  };

  const calculations = useMemo(() => {
    const years = Math.max(0, targetAge - currentAge);
    const rPre = preRate / 100;
    const rPost = postRate / 100;
    const inf = inflation / 100;

    // Monthly pre-retirement return rate
    const monthlyPreRate = rPre / 12;

    // Safe withdrawal rate (SWR) post-retirement (user-configured, default 3% India benchmark)
    const safeWithdrawalRate = Math.max(0.01, Math.min(0.10, swr / 100));

    // Inflated annual expenses at retirement
    const annualExpensesToday = expenses * 12 * fireMultiplier;
    const annualExpensesRetirement = annualExpensesToday * Math.pow(1 + inf, years);

    // Target corpus needed at retirement age (Annual Expenses / SWR)
    const targetCorpus = Math.round(annualExpensesRetirement / safeWithdrawalRate);

    // Compounded growth of current savings alone (no additional SIP)
    const projectedSavingsOnly = Math.round(savings * Math.pow(1 + rPre, years));

    // Shortfall to bridge
    const shortfall = Math.max(0, targetCorpus - projectedSavingsOnly);

    // Required monthly SIP to bridge the shortfall
    let requiredSip = 0;
    if (shortfall > 0 && years > 0) {
      const months = years * 12;
      const compoundFactor = ((Math.pow(1 + monthlyPreRate, months) - 1) / monthlyPreRate) * (1 + monthlyPreRate);
      requiredSip = Math.round(shortfall / compoundFactor);
    }

    // Build timeline data for chart
    const chartData = [];
    for (let y = 0; y <= years; y++) {
      const yearExpenses = annualExpensesToday * Math.pow(1 + inf, y);
      const yearTargetCorpus = Math.round(yearExpenses / safeWithdrawalRate);

      // Compounded current savings
      const savingsGrowth = savings * Math.pow(1 + rPre, y);

      // Compounded SIP contributions
      let sipGrowth = 0;
      if (requiredSip > 0 && y > 0) {
        const months = y * 12;
        sipGrowth = requiredSip * (((Math.pow(1 + monthlyPreRate, months) - 1) / monthlyPreRate) * (1 + monthlyPreRate));
      }

      const totalNetWorth = Math.round(savingsGrowth + sipGrowth);

      chartData.push({
        year: `Age ${currentAge + y}`,
        "Target FIRE Corpus": yearTargetCorpus,
        "Projected Net Worth": totalNetWorth,
      });
    }

    return {
      years,
      annualExpensesRetirement,
      targetCorpus,
      projectedSavingsOnly,
      shortfall,
      requiredSip,
      safeWithdrawalRate,
      chartData
    };
  }, [currentAge, targetAge, expenses, savings, preRate, postRate, inflation, swr, fireMultiplier]);

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
    <div className="space-y-10 py-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Flame className="text-emerald animate-pulse" />
            FIRE Early Retirement Simulator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Determine your early financial independence target corpus using safe withdrawal rates and calculate the monthly SIP needed to reach it.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sliders and Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-6">
            <h2 className="text-lg font-bold text-white">FIRE Parameters</h2>

            {/* Current Age & Target Age */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Current Age</span>
                  <NumericInput
                    value={currentAge}
                    onChange={(val) => setCurrentAge(Math.max(18, Math.min(targetAge - 1, val)))}
                    min={18}
                    max={70}
                    step={1}
                    type="years"
                  />
                </div>
                <input
                  type="range"
                  min={18}
                  max={60}
                  step={1}
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Math.max(18, Math.min(targetAge - 1, Number(e.target.value))))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Target FIRE Age</span>
                  <NumericInput
                    value={targetAge}
                    onChange={(val) => setTargetAge(Math.max(currentAge + 1, Math.min(80, val)))}
                    min={currentAge + 1}
                    max={80}
                    step={1}
                    type="years"
                  />
                </div>
                <input
                  type="range"
                  min={25}
                  max={75}
                  step={1}
                  value={targetAge}
                  onChange={(e) => setTargetAge(Math.max(currentAge + 1, Math.min(80, Number(e.target.value))))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Monthly Expenses Today */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Monthly Expenses Today</span>
                <NumericInput
                  value={expenses}
                  onChange={setExpenses}
                  min={1000}
                  max={1000000}
                  step={1000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={5000}
                max={250000}
                step={5000}
                value={expenses}
                onChange={(e) => setExpenses(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹5K</span>
                <span>₹2.5L</span>
              </div>
            </div>

            {/* Lifestyle Target Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-grey block">FIRE Lifestyle Model</label>
              <div className="flex bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => handleFireMultiplierChange(0.75)}
                  className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
                    fireMultiplier === 0.75 ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                  }`}
                >
                  Lean FIRE (75%)
                </button>
                <button
                  type="button"
                  onClick={() => handleFireMultiplierChange(1.0)}
                  className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
                    fireMultiplier === 1.0 ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                  }`}
                >
                  Standard (100%)
                </button>
                <button
                  type="button"
                  onClick={() => handleFireMultiplierChange(1.25)}
                  className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
                    fireMultiplier === 1.25 ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                  }`}
                >
                  Fat FIRE (125%)
                </button>
              </div>
            </div>

            {/* Current Savings */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Current Accumulated Savings</span>
                <NumericInput
                  value={savings}
                  onChange={setSavings}
                  min={0}
                  max={100000000}
                  step={10000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={0}
                max={5000000}
                step={25000}
                value={savings}
                onChange={(e) => setSavings(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹0</span>
                <span>₹50L</span>
              </div>
            </div>

            {/* Returns and Inflation */}
            <div className="space-y-4 border-t border-border-navy/60 pt-4">
              {/* Pre-retirement equity yields */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Pre-retirement Return Rate</span>
                  <NumericInput
                    value={preRate}
                    onChange={setPreRate}
                    min={1}
                    max={30}
                    step={0.1}
                    type="percent"
                  />
                </div>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={0.5}
                  value={preRate}
                  onChange={(e) => setPreRate(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Post-retirement annuity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Post-retirement Safe Yield</span>
                  <NumericInput
                    value={postRate}
                    onChange={setPostRate}
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
                  step={0.5}
                  value={postRate}
                  onChange={(e) => setPostRate(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Safe Withdrawal Rate (SWR) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Safe Withdrawal Rate (SWR)</span>
                  <NumericInput
                    value={swr}
                    onChange={setSwr}
                    min={1}
                    max={10}
                    step={0.1}
                    type="percent"
                  />
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={0.25}
                  value={swr}
                  onChange={(e) => setSwr(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-grey">
                  <span>2% (Ultra-Safe)</span>
                  <span>3% (India Benchmark)</span>
                  <span>4% (US Trinity)</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSwr(3.0)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                      swr === 3.0 ? "bg-emerald text-navy-bg" : "text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10"
                    }`}
                  >
                    🇮🇳 India 3.0% (33.3x)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSwr(4.0)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                      swr === 4.0 ? "bg-emerald text-navy-bg" : "text-white border border-border-navy bg-navy-light/40 hover:bg-navy-light"
                    }`}
                  >
                    4.0% Trinity (25x)
                  </button>
                </div>
              </div>

              {/* Economic Inflation Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Economic Inflation Rate</span>
                  <NumericInput
                    value={inflation}
                    onChange={setInflation}
                    min={0}
                    max={20}
                    step={0.1}
                    type="percent"
                  />
                </div>
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={0.5}
                  value={inflation}
                  onChange={(e) => setInflation(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results and Visual Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Target FIRE Corpus</span>
              <p className="text-xl font-bold text-emerald mt-1">
                {formatCurrency(calculations.targetCorpus)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                SWR: {(calculations.safeWithdrawalRate * 100).toFixed(1)}% ({Math.round(1/calculations.safeWithdrawalRate)}x)
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Required Monthly SIP</span>
              <p className="text-xl font-bold text-emerald glow-emerald mt-1">
                {calculations.requiredSip > 0 ? formatCurrency(calculations.requiredSip) : "₹0 (Surplus!)"}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                To reach target in {calculations.years} Yrs
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Projected Savings Growth</span>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {formatCurrency(calculations.projectedSavingsOnly)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                Compounded Current Savings
              </span>
            </div>
          </div>

          {/* Chart Display */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Compounding Timeline: Net Worth vs. Target FIRE Corpus
              </h3>
              <span className="text-[10px] text-muted-grey bg-navy-bg px-2 py-0.5 border border-border-navy rounded font-mono">
                {calculations.years} Yr Runway
              </span>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 15, left: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTargetCorpus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
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
                    name="Target FIRE Corpus"
                    dataKey="Target FIRE Corpus"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorTargetCorpus)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    name="Projected Net Worth"
                    dataKey="Projected Net Worth"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorNetWorth)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Educational Concept Section */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
              <Sparkles className="text-emerald" size={18} />
              Educational Concept: Demystifying the FIRE Movement
            </h3>

            <div className="text-xs text-muted-grey leading-relaxed space-y-4 border-t border-border-navy/60 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-white">FIRE Flavors: Lean vs. Standard vs. Fat</h4>
                  <p>
                    Different lifestyles yield different retirements. valarchiX maps three core styles:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px]">
                    <li><strong>Lean FIRE:</strong> Living frugally on 75% of your current lifestyle expenses. Requires a smaller corpus, allowing retirement years earlier.</li>
                    <li><strong>Standard FIRE:</strong> Replicating 100% of your current standard of living.</li>
                    <li><strong>Fat FIRE:</strong> Retirement with 125% of current expenses, leaving a solid buffer for travel, luxury, and premium healthcare.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white">Rule of 25x & Safe Withdrawal Rate (SWR)</h4>
                  <p>
                    The cornerstone of FIRE mathematical modeling. Safe withdrawal rate is the percentage of your corpus you can withdraw in Year 1 of retirement (adjusting for inflation subsequently) with a near-zero risk of running out of money for 30+ years.
                  </p>
                  <p className="text-[11px] text-muted-grey/80">
                    <strong>The Math:</strong> The famous Trinity Study suggests a SWR of **4%** (implying a corpus that is 25 times your annual expenses). If your safe yields exceed inflation by 3% (e.g. safe annuity yields 8% vs 5% inflation), a safe withdrawal rate of 3% is used (which translates to a **33x corpus target**).
                  </p>
                </div>
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
                      Years to retirement (Y) = Target_Age - Current_Age
                    </p>
                    <p>
                      Annual Expenses today (E_ann) = Expenses * 12 * Multiplier
                    </p>
                    <p>
                      Inflated Expenses at Retirement (E_ret) = E_ann * (1 + Inflation)^Y
                    </p>
                    <p>
                      Safe Withdrawal Rate (SWR) = Post_Retirement_Yield - Inflation
                      <br />
                      *SWR is clamped between 2% and 10% for mathematical safety.
                    </p>
                    <p>
                      Target FIRE Corpus = E_ret / SWR
                    </p>
                    <p>
                      Projected Current Savings = Savings * (1 + Pre_Retirement_Yield)^Y
                    </p>
                    <p>
                      Required Monthly SIP = Shortfall / [ ((1 + i)^n - 1) / i * (1 + i) ]
                      <br />
                      where: i = Pre_Retirement_Yield / 12, n = Y * 12.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel Replication Formulas</h4>
                  <p>In Excel, calculate the required monthly SIP to hit your target using the PMT function:</p>
                  <div className="bg-navy-bg/50 p-3 rounded-xl font-mono text-emerald">
                    =-PMT({preRate}%/12, {targetAge - currentAge}*12, {savings}, -{calculations.targetCorpus}, 1)
                  </div>
                  <p className="text-[10px] text-muted-grey mt-2">
                    *The Excel formula `=PMT(rate, nper, pv, fv, type)` determines the monthly payment. Here, `pv` is your current savings (compounding forward), `fv` is your negative target corpus, and `type` is 1 (payment made at the beginning of periods).
                  </p>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This tool is for training purposes only and represents a mathematical compound interest simulator. It does not provide SEBI-registered retirement planning or advisory services.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
