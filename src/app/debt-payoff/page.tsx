"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { Scissors, Plus, Trash2, ChevronDown, HelpCircle, TrendingDown, Zap, PieChart as PieIcon, Flame, Calendar, Table } from "lucide-react";
import NumericInput from "@/components/NumericInput";

interface Debt {
  id: number;
  name: string;
  balance: number;
  rate: number;  // annual %
  minPayment: number;
}

let uid = 10;

function simulatePayoff(debts: Debt[], strategy: "snowball" | "avalanche", extraPayment: number, adjustInflation: boolean, inflation: number) {
  let active = debts.filter(d => d.balance > 0).map(d => ({ ...d, balance: d.balance }));

  if (strategy === "snowball") {
    active.sort((a, b) => a.balance - b.balance);
  } else {
    active.sort((a, b) => b.rate - a.rate);
  }

  let totalInterest = 0;
  let months = 0;
  const MAX_MONTHS = 600;
  const monthlyInfRate = inflation / 100 / 12;

  while (active.length > 0 && months < MAX_MONTHS) {
    months++;
    active.forEach(d => {
      const interest = d.balance * (d.rate / 100 / 12);
      d.balance += interest;
      totalInterest += adjustInflation ? (interest / Math.pow(1 + monthlyInfRate, months)) : interest;
    });

    active.forEach(d => {
      d.balance = Math.max(0, d.balance - d.minPayment);
    });

    let extra = extraPayment;
    for (let i = 0; i < active.length && extra > 0; i++) {
      const pay = Math.min(extra, active[i].balance);
      active[i].balance -= pay;
      extra -= pay;
    }

    active = active.filter(d => d.balance > 0.01);
  }

  return { months, totalInterest: Math.round(totalInterest) };
}

export default function DebtPayoffCalculator() {
  const [engineMode, setEngineMode] = useState<"single" | "portfolio">("single");
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Single Loan Mode States
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  
  // Cheat Codes (Accelerators)
  const [extraEmisPerYear, setExtraEmisPerYear] = useState(0);
  const [annualStepUp, setAnnualStepUp] = useState(0);
  const [lumpsumAmount, setLumpsumAmount] = useState(0);
  const [lumpsumMonth, setLumpsumMonth] = useState(12);
  const [prepayMode, setPrepayMode] = useState<"tenure" | "emi">("tenure");

  // Amortization Schedule Filters
  const [amortView, setAmortView] = useState<"yearly" | "monthly">("yearly");
  const [amortType, setAmortType] = useState<"original" | "accelerated">("accelerated");
  const [showAmortTable, setShowAmortTable] = useState(true);

  // Portfolio Strategy States
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("avalanche");
  const [extraPayment, setExtraPayment] = useState(5000);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const [debts, setDebts] = useState<Debt[]>([
    { id: 1, name: "Credit Card", balance: 100000, rate: 36, minPayment: 3000 },
    { id: 2, name: "Personal Loan", balance: 300000, rate: 14, minPayment: 8000 },
    { id: 3, name: "Car Loan", balance: 500000, rate: 9.5, minPayment: 12000 },
  ]);

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

  // Single Loan Calculation Engine
  const singleLoanCalc = useMemo(() => {
    const P = loanAmount;
    const r = interestRate / 100 / 12;
    const n = tenureYears * 12;

    const baseEmi = P > 0 && r > 0 ? (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
    const originalTotalPaid = baseEmi * n;
    const originalTotalInterest = Math.max(0, originalTotalPaid - P);

    // Accelerated Amortization Schedule calculation
    let balance = P;
    let currentEmi = baseEmi;
    let totalPaidAcc = 0;
    let totalInterestAcc = 0;
    let monthsElapsed = 0;
    const schedule = [];

    for (let m = 1; m <= 600 && balance > 0.1; m++) {
      monthsElapsed = m;
      // Step up EMI annually
      if (m > 1 && (m - 1) % 12 === 0 && annualStepUp > 0) {
        currentEmi = currentEmi * (1 + annualStepUp / 100);
      }

      const interestForMonth = balance * r;
      let principalForMonth = currentEmi - interestForMonth;

      // Add extra EMI portion per year (distributed over months or in month 12)
      if (extraEmisPerYear > 0 && m % 12 === 0) {
        principalForMonth += currentEmi * extraEmisPerYear;
      }

      // One-time Lumpsum prepayment
      if (m === lumpsumMonth && lumpsumAmount > 0) {
        principalForMonth += lumpsumAmount;
      }

      if (principalForMonth > balance + interestForMonth) {
        principalForMonth = balance;
      }

      const actualPayment = interestForMonth + principalForMonth;
      balance = Math.max(0, balance - principalForMonth);

      totalInterestAcc += interestForMonth;
      totalPaidAcc += actualPayment;

      schedule.push({
        month: m,
        year: Math.ceil(m / 12),
        opening: Math.round(balance + principalForMonth),
        emi: Math.round(actualPayment),
        interest: Math.round(interestForMonth),
        principal: Math.round(principalForMonth),
        closing: Math.round(balance),
      });

      if (balance <= 0) break;
    }

    const interestSavedAcc = Math.max(0, originalTotalInterest - totalInterestAcc);
    const monthsSavedAcc = Math.max(0, n - monthsElapsed);

    return {
      baseEmi: Math.round(baseEmi),
      originalTotalPaid: Math.round(originalTotalPaid),
      originalTotalInterest: Math.round(originalTotalInterest),
      totalPaidAcc: Math.round(totalPaidAcc),
      totalInterestAcc: Math.round(totalInterestAcc),
      monthsElapsed,
      interestSavedAcc: Math.round(interestSavedAcc),
      monthsSavedAcc,
      schedule,
    };
  }, [loanAmount, interestRate, tenureYears, extraEmisPerYear, annualStepUp, lumpsumAmount, lumpsumMonth, prepayMode]);

  const addDebt = () => setDebts(p => [...p, { id: ++uid, name: "", balance: 100000, rate: 12, minPayment: 3000 }]);
  const removeDebt = (id: number) => setDebts(p => p.filter(d => d.id !== id));
  const changeDebt = (id: number, field: keyof Debt, val: any) =>
    setDebts(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));

  const { snowball, avalanche, chartData, totalBalance } = useMemo(() => {
    const snowball = simulatePayoff(debts, "snowball", extraPayment, adjustInflation, inflation);
    const avalanche = simulatePayoff(debts, "avalanche", extraPayment, adjustInflation, inflation);
    const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
    const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);

    const chartData = [
      { name: "Snowball\n(Lowest Balance First)", months: snowball.months, interest: Math.round(snowball.totalInterest / 1000) },
      { name: "Avalanche\n(Highest Rate First)", months: avalanche.months, interest: Math.round(avalanche.totalInterest / 1000) },
    ];

    return { snowball, avalanche, chartData, totalBalance, totalMin };
  }, [debts, extraPayment, adjustInflation, inflation]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  const interestSaved = snowball.totalInterest - avalanche.totalInterest;
  const monthsSaved = snowball.months - avalanche.months;

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-heading tracking-tight flex items-center gap-2">
            <Scissors className="text-emerald" /> Debt Payoff Engine & Amortization
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Accelerate loan freedom with cheat code prepayments, or optimize multi-debt payoff via Snowball & Avalanche.
          </p>
        </div>

        {/* Engine Mode Toggle Switch */}
        <div className="flex items-center bg-navy-card p-1 rounded-2xl border border-border-navy">
          <button
            onClick={() => setEngineMode("single")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              engineMode === "single"
                ? "bg-emerald text-navy-bg shadow-md font-extrabold"
                : "text-muted-grey hover:text-heading"
            }`}
          >
            Single Loan
          </button>
          <button
            onClick={() => setEngineMode("portfolio")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              engineMode === "portfolio"
                ? "bg-emerald text-navy-bg shadow-md font-extrabold"
                : "text-muted-grey hover:text-heading"
            }`}
          >
            Loan Portfolio (Snowball vs Avalanche)
          </button>
        </div>
      </div>

      {/* ================= ENGINE MODE 1: SINGLE LOAN ================= */}
      {engineMode === "single" ? (
        <div className="space-y-6 sm:space-y-8">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Input Column: Your Loan */}
            <div className="p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-6 shadow-xl">
              <div className="flex items-center gap-2 text-emerald font-bold text-sm uppercase tracking-wider">
                <Scissors className="w-4 h-4" /> Your Loan
              </div>

              {/* Loan Amount Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Loan Amount</span>
                  <NumericInput value={loanAmount} onChange={setLoanAmount} min={10000} max={50000000} step={50000} type="currency" />
                </div>
                <input
                  type="range"
                  min={50000}
                  max={20000000}
                  step={50000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Interest Rate</span>
                  <NumericInput value={interestRate} onChange={setInterestRate} min={1} max={30} step={0.1} type="percent" />
                </div>
                <input
                  type="range"
                  min={5}
                  max={24}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Tenure Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Tenure (Years)</span>
                  <NumericInput value={tenureYears} onChange={setTenureYears} min={1} max={35} step={1} type="number" />
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Output Column: The Brutal Reality */}
            <div className="p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wider">
                    <TrendingDown className="w-4 h-4" /> The Brutal Reality
                  </div>
                  <span className="text-xs text-muted-grey">Monthly EMI</span>
                </div>

                <div className="text-4xl md:text-5xl font-black text-heading tracking-tight mb-6">
                  {fmt(singleLoanCalc.baseEmi)}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                  <div className="bg-navy-bg p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-border-navy">
                    <span className="text-[9px] sm:text-[10px] text-muted-grey uppercase font-bold block mb-1">Principal</span>
                    <span className="text-xs font-extrabold text-heading">{fmt(loanAmount)}</span>
                  </div>
                  <div className="bg-navy-bg p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-border-navy">
                    <span className="text-[9px] sm:text-[10px] text-muted-grey uppercase font-bold block mb-1">Total Interest</span>
                    <span className="text-xs font-extrabold text-rose-400">{fmt(singleLoanCalc.originalTotalInterest)}</span>
                  </div>
                  <div className="bg-navy-bg p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-border-navy">
                    <span className="text-[9px] sm:text-[10px] text-muted-grey uppercase font-bold block mb-1">Total Paid</span>
                    <span className="text-xs font-extrabold text-heading">{fmt(singleLoanCalc.originalTotalPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Donut Chart: Principal vs Interest */}
              <div className="h-44 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Principal", value: loanAmount },
                        { name: "Total Interest", value: singleLoanCalc.originalTotalInterest },
                      ]}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip formatter={(val: any) => fmt(val)} contentStyle={{ backgroundColor: "#081c3a", borderColor: "#112d55", borderRadius: "8px", color: "#f8fafc" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-muted-grey uppercase">Interest Drag</span>
                  <span className="text-sm font-black text-rose-400">
                    {loanAmount > 0 ? ((singleLoanCalc.originalTotalInterest / loanAmount) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Acceleration Section: The Cheat Codes */}
          <div className="p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-navy pb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald" />
                <h2 className="text-lg font-extrabold text-heading">The Cheat Codes (Prepayment Accelerators)</h2>
              </div>
              {singleLoanCalc.interestSavedAcc > 0 && (
                <span className="text-xs bg-emerald/10 border border-emerald/30 text-emerald font-bold px-3 py-1 rounded-full">
                  ⚡ Saves {fmt(singleLoanCalc.interestSavedAcc)} & {singleLoanCalc.monthsSavedAcc} Months!
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Extra EMIs Per Year */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Extra EMIs Per Year</span>
                  <NumericInput value={extraEmisPerYear} onChange={setExtraEmisPerYear} min={0} max={6} step={1} type="number" />
                </div>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={1}
                  value={extraEmisPerYear}
                  onChange={(e) => setExtraEmisPerYear(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Annual Step-Up % */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Annual EMI Step-Up %</span>
                  <NumericInput value={annualStepUp} onChange={setAnnualStepUp} min={0} max={25} step={1} type="percent" />
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={annualStepUp}
                  onChange={(e) => setAnnualStepUp(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Lumpsum Prepayment Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">One-Time Lumpsum Prepayment</span>
                  <NumericInput value={lumpsumAmount} onChange={setLumpsumAmount} min={0} max={10000000} step={25000} type="currency" />
                </div>
                <input
                  type="range"
                  min={0}
                  max={2000000}
                  step={25000}
                  value={lumpsumAmount}
                  onChange={(e) => setLumpsumAmount(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Paid in Month */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Paid in Month (1 to {tenureYears * 12})</span>
                  <NumericInput value={lumpsumMonth} onChange={setLumpsumMonth} min={1} max={tenureYears * 12} step={1} type="number" />
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.min(120, tenureYears * 12)}
                  step={1}
                  value={lumpsumMonth}
                  onChange={(e) => setLumpsumMonth(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Amortization Schedule Table */}
          <div className="p-6 rounded-3xl border border-border-navy bg-navy-card space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-navy pb-4">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-emerald" />
                <h3 className="text-base font-extrabold text-heading">Amortization Schedule</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAmortView("yearly")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    amortView === "yearly" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-heading"
                  }`}
                >
                  Yearly
                </button>
                <button
                  onClick={() => setAmortView("monthly")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    amortView === "monthly" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-heading"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-border-navy/60 rounded-2xl max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-navy-bg border-b border-border-navy text-muted-grey uppercase font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">{amortView === "yearly" ? "Year" : "Month"}</th>
                    <th className="py-3 px-4">Opening Balance</th>
                    <th className="py-3 px-4">EMI / Payment</th>
                    <th className="py-3 px-4">Principal Paid</th>
                    <th className="py-3 px-4">Interest Paid</th>
                    <th className="py-3 px-4">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-navy/40 font-mono text-light-grey">
                  {singleLoanCalc.schedule
                    .filter((row) => (amortView === "yearly" ? row.month % 12 === 0 || row.closing === 0 : true))
                    .map((row) => (
                      <tr key={row.month} className="hover:bg-navy-light/40 transition">
                        <td className="py-2.5 px-4 font-sans font-bold text-heading">
                          {amortView === "yearly" ? `Yr ${row.year}` : row.month}
                        </td>
                        <td className="py-2.5 px-4">{fmt(row.opening)}</td>
                        <td className="py-2.5 px-4 font-semibold text-heading">{fmt(row.emi)}</td>
                        <td className="py-2.5 px-4 text-emerald font-medium">{fmt(row.principal)}</td>
                        <td className="py-2.5 px-4 text-rose-400 font-medium">{fmt(row.interest)}</td>
                        <td className="py-2.5 px-4 font-bold text-heading">{fmt(row.closing)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= ENGINE MODE 2: LOAN PORTFOLIO (SNOWBALL VS AVALANCHE) ================= */
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Debt List Column */}
          <div className="lg:col-span-1 space-y-5">
            <div className="p-5 glass-card space-y-4">
              <h2 className="text-base font-bold text-heading flex items-center justify-between">
                Your Debts
                <span className="text-rose-400 text-sm">{fmt(totalBalance)}</span>
              </h2>

              <div className="space-y-3">
                {debts.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl border border-border-navy/60 bg-navy-bg/40 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={d.name} onChange={(e) => changeDebt(d.id, "name", e.target.value)} placeholder="Debt name…"
                        className="flex-1 bg-transparent border-b border-border-navy/50 text-xs text-heading placeholder-muted-grey focus:outline-none focus:border-emerald/50 pb-0.5" />
                      <button onClick={() => removeDebt(d.id)} className="text-muted-grey hover:text-rose-400 transition-colors"><Trash2 size={12} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[9px] text-muted-grey mb-0.5">Balance</p>
                        <NumericInput value={d.balance} onChange={(v) => changeDebt(d.id, "balance", v)} min={0} max={10000000} step={10000} type="currency" />
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-grey mb-0.5">Rate %</p>
                        <NumericInput value={d.rate} onChange={(v) => changeDebt(d.id, "rate", v)} min={0} max={60} step={0.5} type="number" />
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-grey mb-0.5">Min EMI</p>
                        <NumericInput value={d.minPayment} onChange={(v) => changeDebt(d.id, "minPayment", v)} min={0} max={100000} step={500} type="currency" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addDebt} className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald hover:text-heading transition-colors">
                <Plus size={13} /> Add Debt
              </button>
            </div>

            <div className="p-5 glass-card space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-sm font-bold text-heading">Extra Monthly Payment</span>
                  <NumericInput value={extraPayment} onChange={setExtraPayment} min={0} max={500000} step={500} type="currency" />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={500}
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2 border-t border-border-navy/60 pt-4 flex items-center justify-between">
                <label htmlFor="adjust-inflation" className="text-xs font-semibold text-muted-grey cursor-pointer flex items-center gap-1">
                  Adjust Interest for Inflation
                  <HelpCircle size={12} className="text-muted-grey/60" />
                </label>
                <input
                  id="adjust-inflation"
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                  className="w-4 h-4 accent-emerald cursor-pointer rounded"
                />
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "avalanche" as const, label: "🏔️ Avalanche", sub: "Highest interest rate first", months: avalanche.months, interest: avalanche.totalInterest, winner: interestSaved > 0 },
                { key: "snowball" as const, label: "⛄ Snowball", sub: "Lowest balance first", months: snowball.months, interest: snowball.totalInterest, winner: interestSaved < 0 },
              ].map((s) => (
                <button key={s.key} onClick={() => setStrategy(s.key)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${strategy === s.key ? "border-emerald bg-emerald/10" : "border-border-navy bg-navy-card hover:border-emerald/30"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-heading">{s.label}</span>
                    {s.winner && <span className="text-[9px] font-bold text-emerald bg-emerald/10 border border-emerald/20 px-1.5 py-0.5 rounded-full">Saves Most ₹</span>}
                  </div>
                  <p className="text-[10px] text-muted-grey">{s.sub}</p>
                  <p className="text-xs font-bold text-heading mt-2">{s.months} months to debt-free</p>
                  <p className="text-[10px] text-rose-400">{adjustInflation ? "Total interest (Real):" : "Total interest:"} {fmt(s.interest)}</p>
                </button>
              ))}
            </div>

            {interestSaved !== 0 && (
              <div className="p-4 rounded-2xl border border-emerald/30 bg-emerald/5 flex items-center gap-4">
                <Zap className="text-emerald shrink-0" size={24} />
                <div>
                  <p className="text-sm font-bold text-heading">
                    Avalanche saves <span className="text-emerald">{fmt(Math.abs(interestSaved))}</span> in {adjustInflation ? "real interest" : "interest"}
                    {Math.abs(monthsSaved) > 0 && <> and <span className="text-emerald">{Math.abs(monthsSaved)} months</span> vs Snowball</>}
                  </p>
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl border border-border-navy bg-navy-card space-y-3">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">Strategy Comparison</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} tickLine={false} />
                    <YAxis yAxisId="months" orientation="left" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} />
                    <YAxis yAxisId="interest" orientation="right" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} tickFormatter={(v) => `${v}K`} />
                    <Tooltip contentStyle={{ background: "#081c3a", border: "1px solid #112d55", borderRadius: 8, fontSize: 11, color: "#f8fafc" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="months" dataKey="months" fill="#22c55e" name="Months to Payoff" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="interest" dataKey="interest" fill="#ef4444" name="Interest Paid (₹K)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
