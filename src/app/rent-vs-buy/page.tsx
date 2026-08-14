"use client";

import React, { useState, useMemo } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  Home, Building, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, 
  Award, ShieldAlert, Sparkles, Sliders, ChevronRight, Zap, RefreshCw
} from "lucide-react";
import { formatINR, formatINRWords } from "@/lib/engine/numeric";

type PropertyType = "ready" | "under_construction" | "affordable";

export default function RentVsBuyPage() {
  // Inputs
  const [city, setCity] = useState("Bangalore");
  const [salary, setSalary] = useState(100000);
  const [propertySizeSqft, setPropertySizeSqft] = useState(1000);
  const [pricePerSqft, setPricePerSqft] = useState(12000);
  const [propertyType, setPropertyType] = useState<PropertyType>("ready");
  const [monthlyRent, setMonthlyRent] = useState(35000);

  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);

  const [equityReturn, setEquityReturn] = useState(12.0);
  const [propertyAppreciation, setPropertyAppreciation] = useState(6.0);
  const [rentInflation, setRentInflation] = useState(7.0);
  const [horizonYears, setHorizonYears] = useState(20);

  // Derived Property Price
  const propertyPrice = propertySizeSqft * pricePerSqft;

  // Upfront Costs Breakdown Calculations
  const calc = useMemo(() => {
    const stampDutyRateMap: Record<string, number> = {
      "Bangalore": 0.05,
      "Mumbai": 0.06,
      "Delhi NCR": 0.06,
      "Chennai": 0.07,
      "Hyderabad": 0.06,
      "Pune": 0.06,
      "Other": 0.05,
    };
    const stampDutyRate = stampDutyRateMap[city] || 0.05;
    const stampDuty = propertyPrice * stampDutyRate;
    const registration = propertyPrice * 0.01; // 1%
    const gstRate = propertyType === "under_construction" ? 0.05 : propertyType === "affordable" ? 0.01 : 0.0;
    const gst = propertyPrice * gstRate;
    const interiorsMisc = propertyPrice * 0.04; // 4%

    const totalActualCost = propertyPrice + stampDuty + registration + gst + interiorsMisc;
    const downPaymentAmount = propertyPrice * (downPaymentPct / 100);
    const hiddenCashOutflow = stampDuty + registration + gst + interiorsMisc;
    const cashYouNeedUpfront = downPaymentAmount + hiddenCashOutflow;

    const loanAmount = Math.max(0, propertyPrice - downPaymentAmount);
    const monthlyRate = loanRate / 100 / 12;
    const totalMonths = loanTenure * 12;
    
    let monthlyEmi = 0;
    if (monthlyRate > 0 && totalMonths > 0) {
      monthlyEmi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1));
    }

    const emiToSalaryPct = Math.round((monthlyEmi / Math.max(1, salary)) * 100);
    const requiredSalaryFor30PctEmi = Math.round(monthlyEmi / 0.30);
    const salaryShortfall = Math.max(0, requiredSalaryFor30PctEmi - salary);

    // 20-Year Simulation Curves
    const monthlyEquityRate = equityReturn / 100 / 12;
    const monthlyRentInflationRate = rentInflation / 100 / 12;
    const monthlyPropApprecRate = propertyAppreciation / 100 / 12;

    const chartData = [];
    let currentPropVal = propertyPrice;
    let remainingLoan = loanAmount;
    
    // Rent Path: starts with seed capital equal to total upfront cash
    let rentInvestedCorpus = cashYouNeedUpfront;
    let currentRentFee = monthlyRent;
    let totalRentPaidCum = 0;
    let totalEmiPaidCum = 0;

    for (let y = 0; y <= horizonYears; y++) {
      chartData.push({
        year: y,
        buyNetWorth: Math.round(currentPropVal - remainingLoan),
        rentNetWorth: Math.round(rentInvestedCorpus),
      });

      if (y === horizonYears) break;

      // Simulate 12 months for year
      for (let m = 0; m < 12; m++) {
        // Buy path updates
        currentPropVal *= (1 + monthlyPropApprecRate);
        
        // Loan balance principal reduction
        if (remainingLoan > 0) {
          const interestPayment = remainingLoan * monthlyRate;
          const principalPayment = Math.min(remainingLoan, monthlyEmi - interestPayment);
          remainingLoan -= principalPayment;
          totalEmiPaidCum += monthlyEmi;
        }

        // Rent & Invest path updates
        const monthlyMaintenance = (currentPropVal * 0.005) / 12;
        const buyMonthlyOutflow = monthlyEmi + monthlyMaintenance;
        const monthlySurplusToInvest = Math.max(0, buyMonthlyOutflow - currentRentFee);

        rentInvestedCorpus = (rentInvestedCorpus + monthlySurplusToInvest) * (1 + monthlyEquityRate);
        totalRentPaidCum += currentRentFee;
        currentRentFee *= (1 + monthlyRentInflationRate / 12);
      }
    }

    const finalBuyNetWorth = chartData[chartData.length - 1].buyNetWorth;
    const finalRentNetWorth = chartData[chartData.length - 1].rentNetWorth;
    const netWorthDelta = Math.abs(finalRentNetWorth - finalBuyNetWorth);
    const rentWins = finalRentNetWorth > finalBuyNetWorth;

    return {
      stampDuty,
      stampDutyRate,
      registration,
      gst,
      gstRate,
      interiorsMisc,
      totalActualCost,
      downPaymentAmount,
      hiddenCashOutflow,
      cashYouNeedUpfront,
      loanAmount,
      monthlyEmi,
      emiToSalaryPct,
      requiredSalaryFor30PctEmi,
      salaryShortfall,
      chartData,
      finalBuyNetWorth,
      finalRentNetWorth,
      netWorthDelta,
      rentWins,
      totalEmiPaidCum,
      totalRentPaidCum,
    };
  }, [city, propertyPrice, propertyType, downPaymentPct, loanRate, loanTenure, salary, monthlyRent, equityReturn, propertyAppreciation, rentInflation, horizonYears]);

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 animate-fadeIn max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-navy pb-4 sm:pb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald font-bold text-sm mb-1 uppercase tracking-wider">
            <Building className="w-4 h-4 text-emerald" /> Real Estate Intelligence • ValarchiX
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-heading">ValarchiX Buy vs Rent Engine</h1>
          <p className="text-xs sm:text-sm text-muted-grey mt-1">
            Compare your 20-year net worth: pay EMI and own the home, or rent cheap and invest the difference with pure discipline.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Hero: Affordability Reality Check */}
        <div className="bg-navy-card border border-border-navy rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-bold text-slate-200 text-base">
                <Building className="w-5 h-5 text-emerald-400" /> Affordability Reality Check
              </div>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-emerald-400 font-semibold text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="Bangalore">Bangalore (5% Stamp Duty)</option>
                <option value="Mumbai">Mumbai (6% Stamp Duty)</option>
                <option value="Delhi NCR">Delhi NCR (6% Stamp Duty)</option>
                <option value="Chennai">Chennai (7% Stamp Duty)</option>
                <option value="Hyderabad">Hyderabad (6% Stamp Duty)</option>
                <option value="Pune">Pune (6% Stamp Duty)</option>
                <option value="Other">Other City (5% Stamp Duty)</option>
              </select>
            </div>
            <span className="text-xs text-slate-400">Bank caps EMI at ~50% of income. The 30% rule is the &quot;sleep peacefully&quot; zone.</span>
          </div>

          {/* Property Type Tabs */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase mb-2">PROPERTY TYPE</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPropertyType("ready")}
                className={`p-3 rounded-2xl border text-left transition ${
                  propertyType === "ready"
                    ? "bg-emerald-950/80 border-emerald-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-sm">Ready / Resale</div>
                <div className="text-xs text-emerald-400 font-semibold mt-0.5">GST 0%</div>
                <div className="text-[10px] text-slate-500 mt-1">GST exempt — completion certificate received</div>
              </button>

              <button
                onClick={() => setPropertyType("under_construction")}
                className={`p-3 rounded-2xl border text-left transition ${
                  propertyType === "under_construction"
                    ? "bg-emerald-950/80 border-emerald-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-sm">Under-construction</div>
                <div className="text-xs text-emerald-400 font-semibold mt-0.5">GST 5%</div>
                <div className="text-[10px] text-slate-500 mt-1">GST applies to under-construction property</div>
              </button>

              <button
                onClick={() => setPropertyType("affordable")}
                className={`p-3 rounded-2xl border text-left transition ${
                  propertyType === "affordable"
                    ? "bg-emerald-950/80 border-emerald-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-sm">Affordable</div>
                <div className="text-xs text-emerald-400 font-semibold mt-0.5">GST 1%</div>
                <div className="text-[10px] text-slate-500 mt-1">Under ₹45L value threshold</div>
              </button>
            </div>
          </div>

          {/* Upfront Cash Breakdown Table & Salary Needed Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Breakdown List */}
            <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Property Cost</span>
                <span className="font-bold text-white">{formatINR(propertyPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>+ Stamp Duty ({(calc.stampDutyRate * 100).toFixed(0)}%)</span>
                <span>{formatINR(calc.stampDuty)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>+ Registration (1%)</span>
                <span>{formatINR(calc.registration)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>+ GST ({(calc.gstRate * 100).toFixed(0)}%)</span>
                <span>{formatINR(calc.gst)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>+ Interiors & misc (4%)</span>
                <span>{formatINR(calc.interiorsMisc)}</span>
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white">
                <span>Total Actual Cost</span>
                <span>{formatINR(calc.totalActualCost)}</span>
              </div>

              <div className="border-t border-slate-800/80 pt-2 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Down Payment ({downPaymentPct}%)</span>
                  <span>{formatINR(calc.downPaymentAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hidden Costs (cash)</span>
                  <span>{formatINR(calc.hiddenCashOutflow)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-400 text-sm">
                  <span>Cash You Need Upfront</span>
                  <span>{formatINR(calc.cashYouNeedUpfront)}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Loan Amount</span>
                  <span>{formatINR(calc.loanAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-sm">
                  <span>EMI ({loanRate}%, {loanTenure} yrs)</span>
                  <span>{formatINR(calc.monthlyEmi)} / mo</span>
                </div>
              </div>
            </div>

            {/* Right Anxiety & Salary Needed Spotlight Cards */}
            <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
              {/* Salary Needed */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">SALARY NEEDED (NET IN-HAND)</div>
                <div className="text-3xl font-black text-emerald-300 mt-1">{formatINR(calc.requiredSalaryFor30PctEmi)} / mo</div>
                <div className="text-xs text-emerald-400/80 mt-1 font-medium">so EMI stays ≤ 30% of your income</div>
              </div>

              {/* EMI Anxiety Zone Alert Card */}
              <div className={`p-5 rounded-2xl border space-y-2 ${
                calc.emiToSalaryPct > 50
                  ? "bg-rose-950/60 border-rose-600 text-rose-200"
                  : calc.emiToSalaryPct > 30
                    ? "bg-amber-950/60 border-amber-600 text-amber-200"
                    : "bg-emerald-950/60 border-emerald-600 text-emerald-200"
              }`}>
                <div className="flex items-center gap-2 font-extrabold text-sm uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> 
                  {calc.emiToSalaryPct > 50 ? "⚠️ EMI ANXIETY ZONE" : calc.emiToSalaryPct > 30 ? "⚠️ MODERATE EMI BURDEN" : "✅ SAFE EMI ZONE"}
                </div>
                <div className="text-sm font-bold">
                  Your salary: {formatINR(salary)} → EMI = {calc.emiToSalaryPct}% of income
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {calc.emiToSalaryPct > 50
                    ? `One job loss = bankruptcy risk. Do not buy this house at this salary. Shortfall: ${formatINR(calc.salaryShortfall)}/mo`
                    : calc.emiToSalaryPct > 30
                      ? `EMI exceeds the 30% safety benchmark by ${calc.emiToSalaryPct - 30}%.`
                      : "EMI is comfortably below 30% of in-hand salary."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Verdict Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">BUY — NET WORTH ({horizonYears} YRS)</div>
            <div className="text-3xl font-black text-white">{formatINRWords(calc.finalBuyNetWorth)}</div>
            <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-2 space-y-0.5">
              <div>Property Val: {formatINRWords(calc.finalBuyNetWorth)}</div>
              <div>Loan Left: ₹0</div>
              <div>Total EMI Paid: {formatINRWords(calc.totalEmiPaidCum)}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 shadow-xl space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="text-xs font-bold text-emerald-400 uppercase">RENT + INVEST — NET WORTH</div>
            <div className="text-3xl font-black text-emerald-300">{formatINRWords(calc.finalRentNetWorth)}</div>
            <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2 space-y-0.5">
              <div>Invested Corpus: {formatINRWords(calc.finalRentNetWorth)}</div>
              <div>Total Rent Paid: {formatINRWords(calc.totalRentPaidCum)}</div>
              <div>Upfront Seed: {formatINR(calc.cashYouNeedUpfront)}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/60 rounded-3xl p-6 shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-widest">
              <Award className="w-4 h-4" /> VERDICT
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {calc.rentWins ? "Renting Wins" : "Buying Wins"}
            </div>
            <div className="text-xs text-slate-300 space-y-1 pt-1">
              <div>Δ Net Worth Advantage: <strong>{formatINR(calc.netWorthDelta)}</strong></div>
              <div>EMI: <strong>{formatINR(calc.monthlyEmi)} / mo</strong></div>
              <div>EMI / Salary Ratio: <strong>{calc.emiToSalaryPct}%</strong></div>
            </div>
          </div>
        </div>

        {/* 20-Year Net Worth Over Time Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Net Worth Over Time Comparison
          </h3>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calc.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" tickFormatter={(y) => `Yr ${y}`} />
                <YAxis stroke="#64748b" tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                  formatter={(val: any) => [formatINR(Number(val)), "Net Worth"]}
                />
                <Legend />
                <Line type="monotone" dataKey="buyNetWorth" name="Buy Path" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="rentNetWorth" name="Rent + Invest Path" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Left Interactive Input Sliders Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" /> Property & Loan Inputs
            </h3>

            {/* City */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">City Preset</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm mt-1 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Bangalore">Bangalore</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>

            {/* Salary */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400 uppercase">Net Monthly Salary</span>
                <span className="text-emerald-400 font-bold">{formatINR(salary)}</span>
              </div>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-bold text-sm mb-2"
              />
              <input
                type="range"
                min={25000}
                max={500000}
                step={5000}
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Property Size & Price/sqft */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-400 uppercase">Size (sqft)</span>
                  <span className="text-emerald-400">{propertySizeSqft} sqft</span>
                </div>
                <input
                  type="number"
                  value={propertySizeSqft}
                  onChange={(e) => setPropertySizeSqft(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-400 uppercase">Price / sqft</span>
                  <span className="text-emerald-400">{formatINR(pricePerSqft)}</span>
                </div>
                <input
                  type="number"
                  value={pricePerSqft}
                  onChange={(e) => setPricePerSqft(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            {/* Monthly Rent */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400 uppercase">Current Monthly Rent</span>
                <span className="text-emerald-400 font-bold">{formatINR(monthlyRent)}</span>
              </div>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm mb-2"
              />
              <input
                type="range"
                min={10000}
                max={150000}
                step={2000}
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Loan parameters */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 uppercase">Down Pmt %</label>
                <input
                  type="number"
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 uppercase">Loan Rate %</label>
                <input
                  type="number"
                  value={loanRate}
                  onChange={(e) => setLoanRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 uppercase">Tenure (Yrs)</label>
                <input
                  type="number"
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm mt-1"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Economic Assumptions
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400 uppercase">Equity SIP CAGR Return</span>
                    <span className="text-emerald-400 font-bold">{equityReturn}%</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={18}
                    step={0.5}
                    value={equityReturn}
                    onChange={(e) => setEquityReturn(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400 uppercase">Property Appreciation %</span>
                    <span className="text-emerald-400 font-bold">{propertyAppreciation}%</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    step={0.5}
                    value={propertyAppreciation}
                    onChange={(e) => setPropertyAppreciation(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400 uppercase">Rent Inflation %</span>
                    <span className="text-emerald-400 font-bold">{rentInflation}%</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    step={0.5}
                    value={rentInflation}
                    onChange={(e) => setRentInflation(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* ValarchiX 6-Engine Connect Action Banner */}
            <div className="bg-slate-950 border border-emerald-900/60 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase">ValarchiX 6-Engine Connect</div>
              <p className="text-xs text-slate-400">
                Project this home purchase decision into your Time Machine parallel universes or update your Financial DNA debt pillars.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="/time-machine"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl text-center transition"
                >
                  Simulate in Time Machine
                </a>
                <a
                  href="/financial-dna"
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2 px-3 rounded-xl text-center transition"
                >
                  Update Financial DNA
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
