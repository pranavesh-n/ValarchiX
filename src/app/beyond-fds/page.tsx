"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import {
  Info,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Layers,
  Coins,
  Target,
  Hourglass,
  PieChart,
  Calculator,
  Landmark,
  ShieldAlert,
  Award,
  ArrowRightLeft
} from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function BeyondFdsPage() {
  const [mounted, setMounted] = useState(false);

  // States for Compounding Story (Rohan vs Priya)
  const [monthlyInvest, setMonthlyInvest] = useState(10000);
  const [compoundingRate, setCompoundingRate] = useState(10);

  // States for FD Destroyer
  const [fdDeposit, setFdDeposit] = useState(1000000); // 10 Lakhs
  const [fdRate, setFdRate] = useState(7.0);
  const [fdTaxSlab, setFdTaxSlab] = useState(30); // 0%, 10%, 20%, 30%
  const [fdInflation, setFdInflation] = useState(7.0);
  const [fdYears, setFdYears] = useState(15);

  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 7.0 });

  useEffect(() => {
    setMounted(true);
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setFdInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error fetching live rates", err));
  }, []);

  // Compounding story calculation
  const compoundingStoryData = useMemo(() => {
    const data = [];
    const r = compoundingRate / 100 / 12; // monthly rate
    let rohanBalance = 0;
    let priyaBalance = 0;

    // We simulate year by year from age 25 to age 60 (35 years)
    for (let age = 25; age <= 60; age++) {
      if (age > 25) {
        // Rohan: Invests from age 25 to 35 (10 years)
        const yearsPassed = age - 25;
        if (yearsPassed <= 10) {
          // Investing monthly
          for (let m = 0; m < 12; m++) {
            rohanBalance = (rohanBalance + monthlyInvest) * (1 + r);
          }
        } else {
          // Compounding only (no new deposits)
          for (let m = 0; m < 12; m++) {
            rohanBalance = rohanBalance * (1 + r);
          }
        }

        // Priya: Invests from age 35 to 60 (25 years)
        if (age > 35) {
          for (let m = 0; m < 12; m++) {
            priyaBalance = (priyaBalance + monthlyInvest) * (1 + r);
          }
        }
      }

      data.push({
        age: age,
        "Rohan (Starts at 25)": Math.round(rohanBalance),
        "Priya (Starts at 35)": Math.round(priyaBalance)
      });
    }

    const finalRohanInvested = monthlyInvest * 12 * 10;
    const finalPriyaInvested = monthlyInvest * 12 * 25;

    return {
      chartData: data,
      rohanFinal: Math.round(rohanBalance),
      priyaFinal: Math.round(priyaBalance),
      rohanInvested: finalRohanInvested,
      priyaInvested: finalPriyaInvested
    };
  }, [monthlyInvest, compoundingRate]);

  // FD Destroyer calculations
  const fdDestroyerData = useMemo(() => {
    const data = [];
    const rf = fdRate / 100;
    const taxRate = fdTaxSlab / 100;
    const infRate = fdInflation / 100;

    const postTaxFdNominalRate = rf * (1 - taxRate);

    for (let y = 0; y <= fdYears; y++) {
      const nominalVal = fdDeposit * Math.pow(1 + rf, y);
      const postTaxNominalVal = fdDeposit * Math.pow(1 + postTaxFdNominalRate, y);
      const realVal = postTaxNominalVal / Math.pow(1 + infRate, y);

      data.push({
        year: `Yr ${y}`,
        "Nominal Statement Balance": Math.round(nominalVal),
        "Post-Tax Balance": Math.round(postTaxNominalVal),
        "Real Purchasing Power": Math.round(realVal)
      });
    }

    const finalNominal = fdDeposit * Math.pow(1 + rf, fdYears);
    const finalPostTax = fdDeposit * Math.pow(1 + postTaxFdNominalRate, fdYears);
    const finalReal = finalPostTax / Math.pow(1 + infRate, fdYears);
    const destroyedPower = finalNominal - finalReal;

    return {
      chartData: data,
      finalNominal: Math.round(finalNominal),
      finalPostTax: Math.round(finalPostTax),
      finalReal: Math.round(finalReal),
      destroyedPower: Math.round(destroyedPower),
      interestEarned: Math.round(finalNominal - fdDeposit),
      taxLoss: Math.round(finalNominal - finalPostTax),
      inflationLoss: Math.round(finalPostTax - finalReal)
    };
  }, [fdDeposit, fdRate, fdTaxSlab, fdInflation, fdYears]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16 py-6 animate-fadeIn text-light-grey">

      {/* Header Banner */}
      <section className="relative flex flex-col items-center justify-center text-center py-12 md:py-16 px-4 rounded-3xl overflow-hidden bg-gradient-to-b from-navy-card/45 to-transparent border border-border-navy/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_50%)]" />

        <div className="relative space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-4 py-1.5 text-xs font-semibold text-emerald glow-emerald tracking-wide">
            🎓 Personal Finance Foundations
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl text-white">
            Beyond Fixed Deposits: <br />
            <span className="gradient-green">The Wealth Building Masterclass</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm md:text-base text-muted-grey leading-relaxed">
            Understand why traditional FDs decay your purchasing power over time, why people fear equity markets, and how to harness compounding using low-risk diversified principles.
          </p>
        </div>
      </section>

      {/* Hero of the Story: Compounding */}
      <section className="space-y-6">
        <div className="border-b border-border-navy/60 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="text-emerald animate-pulse" />
            The Hero of the Story: Compounding
          </h2>
          <p className="text-sm text-muted-grey mt-1">
            Why Albert Einstein called Compounding the “8th Wonder of the World.”
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Theory and Inputs */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 glass-card space-y-6">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Simulate Compounding</h3>

              {/* Monthly Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Monthly Investment</span>
                  <NumericInput
                    value={monthlyInvest}
                    onChange={setMonthlyInvest}
                    min={500}
                    max={10000000}
                    step={500}
                    type="currency"
                  />
                </div>
                <input
                  type="range"
                  min={2000}
                  max={50000}
                  step={1000}
                  value={monthlyInvest}
                  onChange={(e) => setMonthlyInvest(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-muted-grey">
                  <span>₹2,000</span>
                  <span>₹50,000</span>
                </div>
              </div>

              {/* Rate of return */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Average Equity Return</span>
                  <NumericInput
                    value={compoundingRate}
                    onChange={setCompoundingRate}
                    min={1}
                    max={50}
                    step={0.1}
                    type="percent"
                  />
                </div>
                <input
                  type="range"
                  min={8}
                  max={16}
                  step={0.5}
                  value={compoundingRate}
                  onChange={(e) => setCompoundingRate(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-muted-grey">
                  <span>8% (Conservative)</span>
                  <span>16% (Aggressive)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-light/10 text-xs text-muted-grey leading-relaxed space-y-2">
                <p className="font-bold text-white flex items-center gap-1">
                  💡 What is Compounding?
                </p>
                <p>
                  Compounding is earning returns on top of your previously earned returns. Over short horizons (1–5 years), nominal gains look flat. However, as time extends, the curve bends vertically. This is why <strong>time in the market</strong> is your greatest asset.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Graph & Results */}
          <div className="lg:col-span-2 space-y-6">

            {/* Rohan vs Priya Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Rohan Card */}
              <div className="p-5 rounded-2xl border border-emerald/30 bg-emerald/5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="bg-emerald/10 text-emerald text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald/20">
                      Rohan: Started Early (Age 25)
                    </span>
                    <span className="text-[10px] text-muted-grey">10 yrs only</span>
                  </div>
                  <h4 className="text-2xl font-black text-white mt-3">
                    {formatCurrency(compoundingStoryData.rohanFinal)}
                  </h4>
                  <p className="text-[10px] text-muted-grey mt-1">
                    Accumulated balance at age 60
                  </p>
                </div>
                <div className="border-t border-border-navy/60 pt-3 mt-4 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-grey">Total Invested:</span>
                    <span className="text-white font-bold">{formatCurrency(compoundingStoryData.rohanInvested)}</span>
                  </div>
                  <div className="flex justify-between text-emerald">
                    <span>Wealth Multiplier:</span>
                    <span className="font-bold">{(compoundingStoryData.rohanFinal / compoundingStoryData.rohanInvested).toFixed(1)}x</span>
                  </div>
                </div>
              </div>

              {/* Priya Card */}
              <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/35 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="bg-navy-light text-muted-grey text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-border-navy">
                      Priya: Started Late (Age 35)
                    </span>
                    <span className="text-[10px] text-muted-grey">25 yrs active</span>
                  </div>
                  <h4 className="text-2xl font-black text-white mt-3">
                    {formatCurrency(compoundingStoryData.priyaFinal)}
                  </h4>
                  <p className="text-[10px] text-muted-grey mt-1">
                    Accumulated balance at age 60
                  </p>
                </div>
                <div className="border-t border-border-navy/60 pt-3 mt-4 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-grey">Total Invested:</span>
                    <span className="text-white font-bold">{formatCurrency(compoundingStoryData.priyaInvested)}</span>
                  </div>
                  <div className="flex justify-between text-amber-500">
                    <span>Wealth Multiplier:</span>
                    <span className="font-bold">{(compoundingStoryData.priyaFinal / compoundingStoryData.priyaInvested).toFixed(1)}x</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Explanatory Banner */}
            <div className="p-4 rounded-xl border border-emerald/25 bg-emerald/5 text-xs text-light-grey leading-relaxed">
              <span className="font-black text-emerald mr-1">🔥 THE MIND-BLOWING FACT:</span>
              Rohan invested <strong>only 10 years </strong> starting at age 25, while Priya invested for <strong>25 years </strong> starting at age 35. Yet, Rohan retires with <strong>{formatCurrency(compoundingStoryData.rohanFinal - compoundingStoryData.priyaFinal)} MORE</strong> than Priya! Rohan&apos;s money had an extra 10 years to compound in silence, proving that starting early beats trying to make up for lost time.
            </div>

            {/* Rohan vs Priya chart */}
            <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Compounding Growth Path (Rohan vs. Priya)
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={compoundingStoryData.chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRohan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPriya" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                    <XAxis dataKey="age" stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(val) => `Age ${val}`} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
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
                      dataKey="Rohan (Starts at 25)"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorRohan)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Priya (Starts at 35)"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#colorPriya)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* The Silent Wealth Destroyer: FD Decay */}
      <section className="space-y-6">
        <div className="border-b border-border-navy/60 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Landmark className="text-amber-500" />
            The Silent Wealth Destroyer: Inflation & Taxes on FDs
          </h2>
          <p className="text-sm text-muted-grey mt-1">
            Fixed Deposits look safe, but they guarantee a loss in purchasing power.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 glass-card space-y-5">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">FD Parameter Settings</h3>

              {/* Deposit amount */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">FD Deposit</span>
                  <NumericInput
                    value={fdDeposit}
                    onChange={setFdDeposit}
                    min={1000}
                    max={1000000000}
                    step={5000}
                    type="currency"
                  />
                </div>
                <input
                  type="range"
                  min={100000}
                  max={5000000}
                  step={100000}
                  value={fdDeposit}
                  onChange={(e) => setFdDeposit(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
              </div>

              {/* FD rate */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">FD Yield Rate</span>
                  <NumericInput
                    value={fdRate}
                    onChange={setFdRate}
                    min={1}
                    max={25}
                    step={0.1}
                    type="percent"
                  />
                </div>
                <input
                  type="range"
                  min={4.0}
                  max={9.0}
                  step={0.1}
                  value={fdRate}
                  onChange={(e) => setFdRate(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
              </div>

              {/* Tax Slab */}
              <div className="space-y-2">
                <label className="text-xs text-muted-grey block">Your Income Tax Slab</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10, 20, 30].map((slab) => (
                    <button
                      key={slab}
                      onClick={() => setFdTaxSlab(slab)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${fdTaxSlab === slab
                          ? "bg-amber-500 border-amber-500 text-navy-bg"
                          : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                        }`}
                    >
                      {slab}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Inflation */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">Avg. Inflation Rate</span>
                  <NumericInput
                    value={fdInflation}
                    onChange={setFdInflation}
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
                  max={10}
                  step={0.1}
                  value={fdInflation}
                  onChange={(e) => setFdInflation(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-navy-bg h-1 rounded-lg"
                />
              </div>

              {/* Horizon */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">Horizon (Years)</span>
                  <NumericInput
                    value={fdYears}
                    onChange={setFdYears}
                    min={1}
                    max={50}
                    step={1}
                    type="years"
                  />
                </div>
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={1}
                  value={fdYears}
                  onChange={(e) => setFdYears(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Chart & Real Loss Dashboard */}
          <div className="lg:col-span-2 space-y-6">

            {/* Destroyer stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
                <span className="text-[10px] uppercase font-bold text-muted-grey block">Nominal Statement</span>
                <p className="text-lg font-bold text-white mt-1">
                  {formatCurrency(fdDestroyerData.finalNominal)}
                </p>
                <span className="text-[9px] text-muted-grey block mt-0.5">What the bank shows</span>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
                <span className="text-[10px] uppercase font-bold text-muted-grey block">Post-Tax Balance</span>
                <p className="text-lg font-bold text-white mt-1">
                  {formatCurrency(fdDestroyerData.finalPostTax)}
                </p>
                <span className="text-[9px] text-red-400 block mt-0.5">- {formatCurrency(fdDestroyerData.taxLoss)} lost to taxes</span>
              </div>

              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 col-span-2 md:col-span-1">
                <span className="text-[10px] uppercase font-bold text-red-400 block">Real Purchasing Power</span>
                <p className="text-lg font-bold text-white mt-1">
                  {formatCurrency(fdDestroyerData.finalReal)}
                </p>
                <span className="text-[9px] text-red-400 block mt-0.5">- {formatCurrency(fdDestroyerData.inflationLoss)} lost to inflation</span>
              </div>
            </div>

            {/* Warning callout */}
            <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-3 flex items-start gap-3">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-white uppercase">The Erosion Breakdown</h4>
                <p className="text-muted-grey leading-relaxed">
                  You deposited {formatCurrency(fdDeposit)}. After {fdYears} years, although your statement will say you have {formatCurrency(fdDestroyerData.finalNominal)}, its actual buying power is only <strong>{formatCurrency(fdDestroyerData.finalReal)}</strong>.
                  Taxes took {formatCurrency(fdDestroyerData.taxLoss)} and inflation took another {formatCurrency(fdDestroyerData.inflationLoss)}.
                  Your money did not grow; it decayed by <strong>{formatCurrency(fdDestroyerData.destroyedPower)}</strong> in real value!
                </p>
              </div>
            </div>

            {/* Real vs Nominal Chart */}
            <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                FD Value Decay Over Time
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={fdDestroyerData.chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRealFd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
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
                      dataKey="Nominal Statement Balance"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorNominal)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Real Purchasing Power"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorRealFd)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Demystifying Mutual Funds & Managing Volatility */}
      <section className="space-y-8">
        <div className="border-b border-border-navy/60 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-emerald" />
            Demystifying Mutual Funds & Managing Volatility
          </h2>
          <p className="text-sm text-muted-grey mt-1">
            Understanding mutual funds, assets, and why the &quot;fear of market volatility&quot; is managed by time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 text-xs text-muted-grey leading-relaxed">
          {/* What are Mutual Funds */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <div className="flex items-center gap-2 border-b border-border-navy/40 pb-2">
              <div className="p-1.5 bg-emerald/10 border border-emerald/20 text-emerald rounded">
                <Layers size={16} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase">What is a Mutual Fund & its Types</h3>
            </div>

            <p>
              A Mutual Fund is a pooled asset managed by an AMC (Asset Management Company) that invests in a diversified list of shares or bonds. Rather than buying single stocks (which has default risk), index and mutual funds bundle 50+ companies.
            </p>

            <div className="space-y-3 font-semibold text-light-grey">
              <div className="p-3 bg-navy-bg rounded-xl border border-border-navy/60">
                <p className="text-white text-[11px] font-bold">1. Equity Mutual Funds</p>
                <p className="text-[10px] text-muted-grey font-medium mt-0.5">Invests in company shares. Offers high growth over long horizons (Large Cap, Mid Cap, Small Cap, Sectoral).</p>
              </div>
              <div className="p-3 bg-navy-bg rounded-xl border border-border-navy/60">
                <p className="text-white text-[11px] font-bold">2. Debt Mutual Funds</p>
                <p className="text-[10px] text-muted-grey font-medium mt-0.5">Invests in government bonds and corporate certificates. Stable yield, low volatility, replaces bank deposits.</p>
              </div>
              <div className="p-3 bg-navy-bg rounded-xl border border-border-navy/60">
                <p className="text-white text-[11px] font-bold">3. Hybrid Mutual Funds</p>
                <p className="text-[10px] text-muted-grey font-medium mt-0.5">Blends equity and debt. Best for moderate volatility risk-appetites (Aggressive hybrid, Balanced advantage).</p>
              </div>
              <div className="p-3 bg-navy-bg rounded-xl border border-border-navy/60">
                <p className="text-white text-[11px] font-bold">4. Passive Index Funds</p>
                <p className="text-[10px] text-muted-grey font-medium mt-0.5">Replicates stock indices (like Nifty 50) directly. Lowest fee ratios and guarantees matching market returns.</p>
              </div>
            </div>
          </div>

          {/* Fear and Volatility Shield */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <div className="flex items-center gap-2 border-b border-border-navy/40 pb-2">
              <div className="p-1.5 bg-emerald/10 border border-emerald/20 text-emerald rounded">
                <ShieldCheck size={16} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase">The Shield: How to Manage Volatility</h3>
            </div>

            <p>
              Many people avoid investing in mutual funds because they fear losing money. While equity has short-term volatility (fluctuations), long-term investing uses structural shields:
            </p>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <h4 className="text-white font-bold flex items-center gap-1.5 text-[11px]">
                  🟢 1. Systematic Investment Plan (SIP)
                </h4>
                <p className="text-[10px] pl-5 leading-normal">
                  Instead of timing the market, an SIP automates monthly deposits. During market crashes, your fixed deposit buys more units at lower NAVs. This <strong>Rupee Cost Averaging</strong> converts market corrections into discount sales.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-white font-bold flex items-center gap-1.5 text-[11px]">
                  🟢 2. Time Horizon (The Volatility Killer)
                </h4>
                <p className="text-[10px] pl-5 leading-normal">
                  Over a 1-year holding period, the probability of equity losses can be up to 25%. However, as your holding period expands to 7+ years, historical index data shows the probability of a negative return drops to <strong>0%</strong>. Time absorbs market cycles.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-white font-bold flex items-center gap-1.5 text-[11px]">
                  🟢 3. Asset Allocation
                </h4>
                <p className="text-[10px] pl-5 leading-normal">
                  Never put all your savings in one asset. Balance your portfolio with Debt (for short-term security), Equity Index (for inflation-beating growth), and Gold (for inflation hedge). Rebalance once a year.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guided Personal Finance Roadmap */}
      <section className="space-y-6">
        <div className="border-b border-border-navy/60 pb-4">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="text-emerald" />
            Your Personal Finance Action Plan
          </h2>
          <p className="text-sm text-muted-grey mt-1">
            Follow this structural road map to implement smarter financial habits on ValarchiX.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Step 1 */}
          <div className="p-6 glass-card flex flex-col justify-between hover:border-emerald/40 transition-all duration-300">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Step 1: Safety First
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Emergency Fund & Safety Net</h3>
              <p className="text-xs text-muted-grey leading-relaxed">
                Before putting money in equity, secure 6 months of expenses in a liquid fund/FD. Open a PPF for tax-free riskless debt allocations.
              </p>
            </div>
            <Link
              href="/ppf"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-white transition-colors mt-6 pt-2 border-t border-border-navy/60"
            >
              <span>Explore PPF Planner</span>
              <Coins size={12} />
            </Link>
          </div>

          {/* Step 2 */}
          <div className="p-6 glass-card flex flex-col justify-between hover:border-emerald/40 transition-all duration-300">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-emerald uppercase tracking-wider bg-emerald/10 px-2 py-0.5 rounded border border-emerald/20">
                Step 2: Beat Inflation
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Automate Compounding via SIP</h3>
              <p className="text-xs text-muted-grey leading-relaxed">
                Set up a monthly systematic investment in index funds or diversified equity mutual funds to beat long-term CPI inflation.
              </p>
            </div>
            <Link
              href="/sip"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-white transition-colors mt-6 pt-2 border-t border-border-navy/60"
            >
              <span>SIP & FD Simulator</span>
              <Hourglass size={12} />
            </Link>
          </div>

          {/* Step 3 */}
          <div className="p-6 glass-card flex flex-col justify-between hover:border-emerald/40 transition-all duration-300">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-emerald uppercase tracking-wider bg-emerald/10 px-2 py-0.5 rounded border border-emerald/20">
                Step 3: Define Goals
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Inflation-Adjusted Goal Planning</h3>
              <p className="text-xs text-muted-grey leading-relaxed">
                Map out milestones (car, wedding, retirement) and calculate exactly how much monthly investment is needed.
              </p>
            </div>
            <Link
              href="/goal"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-white transition-colors mt-6 pt-2 border-t border-border-navy/60"
            >
              <span>Goal Planner</span>
              <Target size={12} />
            </Link>
          </div>

          {/* Step 4 */}
          <div className="p-6 glass-card flex flex-col justify-between hover:border-emerald/40 transition-all duration-300">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-emerald uppercase tracking-wider bg-emerald/10 px-2 py-0.5 rounded border border-emerald/20">
                Step 4: Diversify
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Portfolio Asset Allocation</h3>
              <p className="text-xs text-muted-grey leading-relaxed">
                Check overlap, calculate weighted expense ratios, and maintain the correct mix of Equity, Debt, and Gold.
              </p>
            </div>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-white transition-colors mt-6 pt-2 border-t border-border-navy/60"
            >
              <span>Portfolio Allocator</span>
              <PieChart size={12} />
            </Link>
          </div>

          {/* Step 5 */}
          <div className="p-6 glass-card flex flex-col justify-between hover:border-emerald/40 transition-all duration-300">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-emerald uppercase tracking-wider bg-emerald/10 px-2 py-0.5 rounded border border-emerald/20">
                Step 5: Tax Optimization
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Old vs New Slabs & Harvesters</h3>
              <p className="text-xs text-muted-grey leading-relaxed">
                Compare tax regimes and structure investments in NPS or ELSS funds to optimize post-tax compound rates.
              </p>
            </div>
            <Link
              href="/tax"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-white transition-colors mt-6 pt-2 border-t border-border-navy/60"
            >
              <span>Tax Regime Hub</span>
              <Calculator size={12} />
            </Link>
          </div>

          {/* Screener Link */}
          <div className="p-6 glass-card flex flex-col justify-between hover:border-emerald/40 transition-all duration-300 bg-gradient-to-br from-emerald/10 to-emerald/5 border-emerald/30">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-emerald/25 px-2 py-0.5 rounded border border-emerald/30">
                Action: Search Funds
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Explore the Screener</h3>
              <p className="text-xs text-muted-grey leading-relaxed">
                Compare actual active and passive mutual funds dynamically, assessing Sharpe ratios, Sortino ratios, and rolling returns.
              </p>
            </div>
            <Link
              href="/mutual-funds"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-white transition-colors mt-6 pt-2 border-t border-border-navy/60"
            >
              <span>Launch Screener</span>
              <Layers size={12} />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
