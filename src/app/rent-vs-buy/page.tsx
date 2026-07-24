"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Home, ChevronDown, HelpCircle, Landmark, TrendingUp, Percent, Calculator, Award } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function RentVsBuyCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Shared
  const [years, setYears] = useState(20);

  // Renting
  const [monthlyRent, setMonthlyRent] = useState(25000);
  const [rentIncrease, setRentIncrease] = useState(7); // % per year
  const [rentInvestmentReturn, setRentInvestmentReturn] = useState(12); // equity CAGR

  // Buying
  const [propertyPrice, setPropertyPrice] = useState(8000000);
  const [downPayment, setDownPayment] = useState(1600000); // 20%
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [propertyAppreciation, setPropertyAppreciation] = useState(6); // % per year
  const [maintenancePercent, setMaintenancePercent] = useState(1); // % of property value per year
  const [registrationCost, setRegistrationCost] = useState(400000); // stamp duty + registration
  const [taxSlab, setTaxSlab] = useState(30); // 30% tax bracket for Section 24 deduction

  useEffect(() => setMounted(true), []);

  const { chartData, breakEvenYear, rentSummary, buySummary, winner } = useMemo(() => {
    const loanAmount = propertyPrice - downPayment;
    const r = loanRate / 100 / 12;
    const n = loanTenure * 12;
    const emi = r > 0 ? (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loanAmount / n;
    const annualEMI = emi * 12;

    const dpReturn = rentInvestmentReturn / 100 / 12;
    const totalInitialOutflow = downPayment + registrationCost;

    let rentTotalPaid = 0;
    let buyTotalPaid = registrationCost + downPayment;
    let chartData = [];
    let breakEvenYear: number | null = null;

    let currentRent = monthlyRent;
    let renterWealthPort = totalInitialOutflow; // investing down payment + reg cost
    let propertyValue = propertyPrice;
    let remainingLoanBalance = loanAmount;
    let totalTaxSaved = 0;

    for (let y = 1; y <= years; y++) {
      // 1. Renting Year Math
      const rentThisYear = currentRent * 12;
      rentTotalPaid += rentThisYear;

      // Difference between EMI+Maintenance and Rent is saved/invested by renter
      const maintenanceThisYear = propertyValue * (maintenancePercent / 100);
      const buyOutflowThisYear = (y <= loanTenure ? annualEMI : 0) + maintenanceThisYear;
      const extraSavedByRenter = Math.max(0, buyOutflowThisYear - rentThisYear);

      // Renter portfolio grows with compounding + extra savings
      renterWealthPort = (renterWealthPort + extraSavedByRenter) * Math.pow(1 + dpReturn, 12);
      currentRent *= (1 + rentIncrease / 100);

      // 2. Buying Year Math & Amortization
      let interestPaidThisYear = 0;
      let principalPaidThisYear = 0;

      if (y <= loanTenure) {
        for (let m = 1; m <= 12; m++) {
          const interestMonth = remainingLoanBalance * r;
          const principalMonth = emi - interestMonth;
          interestPaidThisYear += interestMonth;
          principalPaidThisYear += principalMonth;
          remainingLoanBalance = Math.max(0, remainingLoanBalance - principalMonth);
        }
      }

      // Section 24 Tax Savings (Up to ₹2L interest capped)
      const sec24Eligible = Math.min(200000, interestPaidThisYear);
      const taxSavedThisYear = sec24Eligible * (taxSlab / 100);
      totalTaxSaved += taxSavedThisYear;

      buyTotalPaid += buyOutflowThisYear;
      propertyValue *= (1 + propertyAppreciation / 100);

      // Buyer Net Equity Wealth = Property Value - Remaining Loan Balance
      const buyerNetWealth = propertyValue - remainingLoanBalance;
      // Renter Net Equity Wealth = Value of Invested Portfolio
      const renterNetWealth = renterWealthPort;

      if (!breakEvenYear && buyerNetWealth >= renterNetWealth) {
        breakEvenYear = y;
      }

      chartData.push({
        year: `Yr ${y}`,
        "Renter Net Wealth": Math.round(renterNetWealth),
        "Buyer Net Equity": Math.round(buyerNetWealth),
        "Property Value": Math.round(propertyValue),
      });
    }

    const finalRenterWealth = Math.round(renterWealthPort);
    const finalBuyerWealth = Math.round(propertyValue - remainingLoanBalance);

    const rentSummary = {
      totalRentPaid: Math.round(rentTotalPaid),
      renterFinalWealth: finalRenterWealth,
    };
    const buySummary = {
      totalPaid: Math.round(buyTotalPaid),
      propertyValue: Math.round(propertyValue),
      totalTaxSaved: Math.round(totalTaxSaved),
      buyerFinalWealth: finalBuyerWealth,
    };

    const winner = finalBuyerWealth > finalRenterWealth ? "Buying" : "Renting";

    return { chartData, breakEvenYear, rentSummary, buySummary, winner };
  }, [years, monthlyRent, rentIncrease, rentInvestmentReturn, propertyPrice, downPayment, loanRate, loanTenure, propertyAppreciation, maintenancePercent, registrationCost, taxSlab]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
  const fmtL = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : `₹${(v / 100000).toFixed(2)}L`;

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn text-light-grey">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Home className="text-emerald" /> Home Rent vs. Buy Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Compare long-term net wealth — accounting for Sec 24 tax savings, down payment equity opportunity cost, property appreciation, and maintenance.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-5">
          <div className="p-5 glass-card space-y-5">
            <h2 className="text-base font-bold text-white">Comparison Horizon</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey font-bold">Years to Compare</span>
                <NumericInput value={years} onChange={setYears} min={1} max={50} step={1} type="years" />
              </div>
              <input type="range" min={5} max={35} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
            </div>
          </div>

          <div className="p-5 glass-card space-y-4">
            <h2 className="text-base font-bold text-blue-400 flex items-center gap-2"><Landmark size={15} /> Renting Parameters</h2>
            {[
              { label: "Monthly Rent", value: monthlyRent, set: setMonthlyRent, min: 5000, max: 200000, sliderMin: 5000, sliderMax: 100000, step: 1000, type: "currency" as const },
              { label: "Annual Rent Hike (%)", value: rentIncrease, set: setRentIncrease, min: 0, max: 20, sliderMin: 0, sliderMax: 15, step: 0.5, type: "percent" as const },
              { label: "Down Payment Investment CAGR (%)", value: rentInvestmentReturn, set: setRentInvestmentReturn, min: 4, max: 20, sliderMin: 4, sliderMax: 20, step: 0.5, type: "percent" as const },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">{f.label}</span>
                  <NumericInput value={f.value} onChange={f.set} min={f.min} max={f.max} step={f.step} type={f.type} />
                </div>
                <input type="range" min={f.sliderMin} max={f.sliderMax} step={f.step} value={f.value} onChange={(e) => f.set(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
              </div>
            ))}
          </div>

          <div className="p-5 glass-card space-y-4">
            <h2 className="text-base font-bold text-emerald flex items-center gap-2"><Home size={15} /> Buying Parameters</h2>
            {[
              { label: "Property Price", value: propertyPrice, set: setPropertyPrice, min: 1000000, max: 50000000, sliderMin: 2000000, sliderMax: 30000000, step: 500000, type: "currency" as const },
              { label: "Down Payment", value: downPayment, set: setDownPayment, min: 100000, max: 20000000, sliderMin: 500000, sliderMax: 10000000, step: 100000, type: "currency" as const },
              { label: "Home Loan Rate (%)", value: loanRate, set: setLoanRate, min: 6, max: 15, sliderMin: 6.5, sliderMax: 12, step: 0.1, type: "percent" as const },
              { label: "Property Appreciation (%)", value: propertyAppreciation, set: setPropertyAppreciation, min: 1, max: 15, sliderMin: 2, sliderMax: 12, step: 0.5, type: "percent" as const },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">{f.label}</span>
                  <NumericInput value={f.value} onChange={f.set} min={f.min} max={f.max} step={f.step} type={f.type} />
                </div>
                <input type="range" min={f.sliderMin} max={f.sliderMax} step={f.step} value={f.value} onChange={(e) => f.set(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
              </div>
            ))}
          </div>
        </div>

        {/* Results & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Winner Banner */}
          <div className={`p-6 rounded-2xl border ${winner === "Buying" ? "border-emerald/40 bg-emerald/5" : "border-blue-500/40 bg-blue-500/5"} flex flex-col md:flex-row items-center justify-between gap-4`}>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-grey flex items-center gap-1.5">
                <Award className={winner === "Buying" ? "text-emerald" : "text-blue-400"} size={16} /> 
                Financial Winner at Year {years}
              </span>
              <h3 className={`text-2xl font-black mt-1 ${winner === "Buying" ? "text-emerald" : "text-blue-400"}`}>
                {winner === "Buying" ? "Buying Outperforms Renting" : "Renting & Investing Outperforms Buying"}
              </h3>
              <p className="text-xs text-muted-grey mt-1">
                {winner === "Buying"
                  ? `Buying builds ${fmtL(buySummary.buyerFinalWealth)} in net equity vs ${fmtL(rentSummary.renterFinalWealth)} renting portfolio.`
                  : `Renter portfolio grows to ${fmtL(rentSummary.renterFinalWealth)} vs ${fmtL(buySummary.buyerFinalWealth)} buyer net home equity.`}
              </p>
            </div>
            {breakEvenYear && (
              <div className="p-3 bg-navy-bg/80 border border-border-navy rounded-xl text-center shrink-0">
                <span className="text-[10px] uppercase font-bold text-muted-grey block">Break-even Point</span>
                <span className="text-xl font-extrabold text-white">Year {breakEvenYear}</span>
              </div>
            )}
          </div>

          {/* Area Chart Comparison */}
          <div className="p-6 glass-card space-y-4">
            <h3 className="text-sm font-bold text-white">Net Equity Wealth Trajectory Over Time</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="Buyer Net Equity" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="Renter Net Wealth" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
