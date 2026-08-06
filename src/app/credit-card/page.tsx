"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CreditCard, ChevronDown, HelpCircle, AlertTriangle } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function CreditCardPayoffCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState(100000);
  const [annualRate, setAnnualRate] = useState(36);
  const [paymentMode, setPaymentMode] = useState<"minimum" | "fixed" | "aggressive">("fixed");
  const [fixedPayment, setFixedPayment] = useState(5000);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  useEffect(() => {
    setMounted(true);
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  const { scenarios, chartData } = useMemo(() => {
    const monthlyInfRate = inflation / 100 / 12;

    const simulate = (monthlyPayment: number | "min") => {
      let bal = balance;
      let totalInterest = 0;
      let months = 0;
      const chartPoints: number[] = [];
      const MAX = 600;

      while (bal > 0 && months < MAX) {
        months++;
        const interest = bal * (annualRate / 100 / 12);
        totalInterest += adjustInflation ? (interest / Math.pow(1 + monthlyInfRate, months)) : interest;
        bal += interest;

        const payment = monthlyPayment === "min" ? Math.max(bal * 0.02, 500) : monthlyPayment;
        bal = Math.max(0, bal - payment);
        chartPoints.push(Math.round(adjustInflation ? (bal / Math.pow(1 + monthlyInfRate, months)) : bal));
      }

      return { months, totalInterest: Math.round(totalInterest), chartPoints };
    };

    const minResult = simulate("min");
    const fixedResult = simulate(fixedPayment);
    const aggressivePayment = Math.round(balance / 12);
    const aggressiveResult = simulate(aggressivePayment);

    const maxLen = Math.max(minResult.months, fixedResult.months, aggressiveResult.months);
    const chartData = Array.from({ length: maxLen }, (_, i) => ({
      month: `M${i + 1}`,
      "Minimum Payment": minResult.chartPoints[i] ?? 0,
      "Fixed Payment": fixedResult.chartPoints[i] ?? 0,
      [`Aggressive (${fmt(aggressivePayment)}/mo)`]: aggressiveResult.chartPoints[i] ?? 0,
    }));

    return {
      scenarios: [
        { label: "Minimum Only (~2%)", months: minResult.months, interest: minResult.totalInterest, payment: "~2% of balance", color: "#ef4444" },
        { label: `Fixed: ${fmt(fixedPayment)}/mo`, months: fixedResult.months, interest: fixedResult.totalInterest, payment: fmt(fixedPayment), color: "#f59e0b" },
        { label: `Aggressive: ${fmt(aggressivePayment)}/mo`, months: aggressiveResult.months, interest: aggressiveResult.totalInterest, payment: fmt(aggressivePayment), color: "#22c55e" },
      ],
      chartData,
    };
  }, [balance, annualRate, fixedPayment, inflation, adjustInflation]);

  function fmt(v: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
  }

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="text-emerald" /> Credit Card Payoff Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Credit card interest can reach 36–42% p.a. See how minimum payments trap you for years — and what it truly costs you.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 p-6 glass-card space-y-6">
          <h2 className="text-lg font-bold text-white">Card Details</h2>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-grey">Outstanding Balance</span>
              <NumericInput value={balance} onChange={setBalance} min={1000} max={10000000} step={5000} type="currency" />
            </div>
            <input type="range" min={1000} max={1000000} step={5000} value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Annual Interest Rate (%)</span>
              <NumericInput value={annualRate} onChange={setAnnualRate} min={1} max={60} step={0.5} type="percent" className="text-red-400 focus-within:border-red-400/50" />
            </div>
            <input type="range" min={12} max={48} step={0.5} value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
            <p className="text-[9.5px] text-muted-grey">Most Indian credit cards: 36–42% p.a.</p>
          </div>

          <div className="space-y-2 border-t border-border-navy/60 pt-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-grey">Fixed Monthly Payment Amount</span>
              <NumericInput value={fixedPayment} onChange={setFixedPayment} min={500} max={500000} step={500} type="currency" />
            </div>
            <input type="range" min={500} max={100000} step={500} value={fixedPayment} onChange={(e) => setFixedPayment(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
          </div>

          {/* Danger meter */}
          <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/5 space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase">Monthly Interest Charge</p>
            <p className="text-xl font-extrabold text-red-400">{fmt(Math.round(balance * annualRate / 100 / 12))}</p>
            <p className="text-[9px] text-muted-grey">Just to stay in place each month</p>
          </div>

          {/* Inflation Toggle */}
          <div className="space-y-2 border-t border-border-navy/60 pt-4 flex items-center justify-between">
            <label htmlFor="adjust-inflation" className="text-xs font-semibold text-muted-grey cursor-pointer flex items-center gap-1">
              Adjust for Inflation
              <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the future remaining balance and interest paid to show their value in today's purchasing power."><HelpCircle size={12} /></span>
            </label>
            <input
              id="adjust-inflation"
              type="checkbox"
              checked={adjustInflation}
              onChange={(e) => setAdjustInflation(e.target.checked)}
              className="w-4 h-4 accent-emerald cursor-pointer rounded"
            />
          </div>

          {adjustInflation && (
            <div className="space-y-2 border-t border-border-navy/60 pt-4 animate-fadeIn">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Expected Inflation Rate</span>
                <NumericInput value={inflation} onChange={setInflation} min={0} max={25} step={0.1} type="percent" />
              </div>
              <input
                type="range"
                min={2}
                max={15}
                step={0.1}
                value={inflation}
                onChange={(e) => setInflation(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>2%</span>
                <span>15%</span>
              </div>
              <button
                type="button"
                onClick={() => setInflation(rates.inflationRate)}
                className="text-[9px] text-left text-emerald/80 hover:text-emerald block mt-1 hover:underline cursor-pointer font-semibold animate-fadeIn"
              >
                CPI Inflation Baseline ({rates.inflationRate}%)
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Scenario comparison */}
          <div className="grid grid-cols-3 gap-3">
            {scenarios.map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
                <div className="w-2.5 h-2.5 rounded-full mb-2" style={{ background: s.color }} />
                <p className="text-[10px] font-bold text-white leading-tight">{s.label}</p>
                <p className="text-base font-bold mt-2" style={{ color: s.color }}>
                  {s.months >= 600 ? "50+ years" : `${s.months} months`}
                </p>
                <p className="text-[9px] text-red-400">Interest: {fmt(s.interest)}</p>
              </div>
            ))}
          </div>

          {/* Key insight */}
          <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-start gap-3">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-white">The Minimum Payment Trap</p>
              <p className="text-xs text-muted-grey mt-0.5">
                Paying only the minimum keeps you in debt for <strong className="text-red-400">{scenarios[0].months >= 600 ? "50+ years" : `${scenarios[0].months} months`}</strong> and costs <strong className="text-red-400">{fmt(scenarios[0].interest)}</strong> in interest — often <strong className="text-white">more than the original balance</strong>.
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Balance Paydown — 3 Strategies {adjustInflation ? "(Adjusted for Inflation)" : "(Nominal)"}
            </h3>
            <p className="text-[10px] text-muted-grey">Truncated to first 60 months for readability</p>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={scenarios[0].months > 0 ? Array.from({ length: Math.min(60, scenarios[0].months) }, (_, i) => {
                    const monthlyInfRate = inflation / 100 / 12;
                    const discountFactor = adjustInflation ? Math.pow(1 + monthlyInfRate, i) : 1;
                    return {
                      month: `M${i + 1}`,
                      "Minimum Payment": Math.max(0, balance * Math.pow(1 + annualRate / 100 / 12, i) * Math.pow(0.98, i)) / discountFactor,
                      [`Fixed ${fmt(fixedPayment)}`]: (Math.max(0, balance * Math.pow(1 + annualRate / 100 / 12, i) - fixedPayment * ((Math.pow(1 + annualRate / 100 / 12, i) - 1) / (annualRate / 100 / 12)))) / discountFactor,
                    };
                  }) : []}
                  margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="min" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fix" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="month" tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} interval={11} />
                  <YAxis tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} width={75} tickFormatter={(v) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => fmt(Math.max(0, v))} contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Minimum Payment" stroke="#ef4444" fill="url(#min)" strokeWidth={2} />
                  <Area type="monotone" dataKey={`Fixed ${fmt(fixedPayment)}`} stroke="#f59e0b" fill="url(#fix)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45 space-y-3">
            <h3 className="text-sm font-bold text-white">📖 Why Credit Cards are the Most Dangerous Debt</h3>
            <p className="text-xs text-muted-grey leading-relaxed">
              At 36% p.a. (3% per month), credit card debt <strong className="text-white">doubles in just 2 years</strong> if you only make minimum payments. Banks deliberately design minimum payments to maximise the time (and interest) you stay in debt. Treat any credit card balance as a <strong className="text-white">financial emergency</strong> — pay it off before any investment.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button onClick={() => setShowAudit(!showAudit)} className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer">
          <span className="flex items-center gap-1.5"><HelpCircle className="text-emerald" size={18} />How This is Calculated</span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
        </button>
        {showAudit && (
          <div className="text-xs text-muted-grey pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="bg-navy-bg/50 p-3 rounded-xl font-mono space-y-1">
              <p>Monthly Interest = Balance × (Annual Rate / 12)</p>
              <p>New Balance = (Balance + Interest) − Payment</p>
              {adjustInflation && <p>Real Balance at month m = Nominal Balance ÷ (1 + monthly_inflation)^m</p>}
              <p>Minimum payment = max(2% of balance, ₹500)</p>
              <p>Months to payoff = iterations until balance ≤ 0</p>
            </div>
            <p className="text-[10px] text-amber-500 mt-2">⚠️ <strong>Disclaimer:</strong> Credit card terms vary by issuer. Check your actual card agreement.</p>
          </div>
        )}
      </div>
    </div>
  );
}
