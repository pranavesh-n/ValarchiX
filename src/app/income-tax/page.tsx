"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Calculator, Info, HelpCircle, TrendingUp, ChevronDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function IncomeTaxCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [grossIncome, setGrossIncome] = useState(1200000);
  
  // Deductions for Old Regime
  const [sec80C, setSec80C] = useState(150000); // Max 1.5L
  const [sec80D, setSec80D] = useState(25000);  // Max 25K/50K
  const [hraExempt, setHraExempt] = useState(50000);
  const [homeLoanInterest, setHomeLoanInterest] = useState(0); // Max 2L under 24b
  const [npsExtra, setNpsExtra] = useState(0); // Max 50K under 80CCD(1B)

  // Bracket Creep Simulator Inputs
  const [salaryGrowth, setSalaryGrowth] = useState(5); // 5% salary growth (matching inflation)
  const [inflation, setInflation] = useState(5.09);
  const [projectionYears, setProjectionYears] = useState(10);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
        setSalaryGrowth(Math.round(data.inflationRate));
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // Tax calculation engine
  const calculateTax = (income: number, deductions: number, isOldRegime: boolean) => {
    if (isOldRegime) {
      const standardDeduction = 50000;
      const taxable = Math.max(0, income - deductions - standardDeduction);
      let tax = 0;

      // Old Regime Slabs:
      // Up to 2.5L: Nil
      // 2.5L to 5L: 5%
      // 5L to 10L: 20%
      // Above 10L: 30%
      if (taxable <= 250000) {
        tax = 0;
      } else if (taxable <= 500000) {
        tax = (taxable - 250000) * 0.05;
      } else if (taxable <= 1000000) {
        tax = (250000 * 0.05) + (taxable - 500000) * 0.20;
      } else {
        tax = (250000 * 0.05) + (500000 * 0.20) + (taxable - 1000000) * 0.30;
      }

      // Rebate under 87A: Tax is zero if taxable income <= 5L
      if (taxable <= 500000) {
        tax = 0;
      }

      return Math.round(tax * 1.04); // including 4% cess
    } else {
      // New Regime (FY 2025-26 rules / Budget 2025)
      const standardDeduction = 75000;
      const taxable = Math.max(0, income - standardDeduction);
      let tax = 0;

      // Slabs:
      // Up to 4L: Nil
      // 4L to 8L: 5%
      // 8L to 12L: 10%
      // 12L to 16L: 15%
      // 16L to 20L: 20%
      // 20L to 24L: 25%
      // Above 24L: 30%
      if (taxable <= 400000) {
        tax = 0;
      } else if (taxable <= 800000) {
        tax = (taxable - 400000) * 0.05;
      } else if (taxable <= 1200000) {
        tax = (400000 * 0.05) + (taxable - 800000) * 0.10;
      } else if (taxable <= 1600000) {
        tax = (400000 * 0.05) + (400000 * 0.10) + (taxable - 1200000) * 0.15;
      } else if (taxable <= 2000000) {
        tax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (taxable - 1600000) * 0.20;
      } else if (taxable <= 2400000) {
        tax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (400000 * 0.20) + (taxable - 2000000) * 0.25;
      } else {
        tax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (400000 * 0.20) + (400000 * 0.25) + (taxable - 2400000) * 0.30;
      }

      // Rebate under 87A (New Regime): Tax is zero if taxable income <= 12L (gross income <= 12.75L with standard deduction)
      if (taxable <= 1200000) {
        tax = 0;
      }

      return Math.round(tax * 1.04); // including 4% cess
    }
  };

  const calculations = useMemo(() => {
    // Deductions Sum for Old Regime
    const oldDeductions = Math.min(150000, sec80C) + 
                          Math.min(50000, sec80D) + 
                          hraExempt + 
                          Math.min(200000, homeLoanInterest) + 
                          Math.min(50000, npsExtra);

    const oldTax = calculateTax(grossIncome, oldDeductions, true);
    const newTax = calculateTax(grossIncome, 0, false);

    // Bracket Creep Simulation
    // We assume the user's salary grows exactly at the salary growth rate (e.g. 5% to cover inflation)
    // Slabs and standard deductions are static. We calculate tax liability each year.
    const creepData = [];
    let currentNominalSalary = grossIncome;

    for (let yr = 0; yr <= projectionYears; yr++) {
      if (yr > 0) {
        currentNominalSalary = currentNominalSalary * (1 + salaryGrowth / 100);
      }

      const nominalTax = calculateTax(currentNominalSalary, 0, false); // New Regime
      const effectiveRate = (nominalTax / currentNominalSalary) * 100;
      const realPurchasingPowerSalary = currentNominalSalary / Math.pow(1 + inflation / 100, yr);
      const realTaxPaid = nominalTax / Math.pow(1 + inflation / 100, yr);

      creepData.push({
        year: `Yr ${yr}`,
        "Nominal Salary": Math.round(currentNominalSalary),
        "Real Salary (Purchasing Power)": Math.round(realPurchasingPowerSalary),
        "Tax Paid (Nominal)": Math.round(nominalTax),
        "Real Tax Paid": Math.round(realTaxPaid),
        "Effective Tax Rate (%)": Number(effectiveRate.toFixed(2))
      });
    }

    return {
      oldDeductions,
      oldTaxLiability: oldTax,
      newTaxLiability: newTax,
      savings: Math.abs(oldTax - newTax),
      preferredRegime: oldTax > newTax ? "New Regime" : "Old Regime",
      creepData
    };
  }, [grossIncome, sec80C, sec80D, hraExempt, homeLoanInterest, npsExtra, salaryGrowth, inflation, projectionYears]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-10 py-6 animate-fadeIn text-light-grey">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calculator className="text-emerald" />
            Advanced Income Tax Hub
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Compare Old vs. New regimes (FY 2025-26 rules) and model the silent impact of Inflation-driven Bracket Creep.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      {/* Side-by-side Regime Calculator */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-5">
            <h2 className="text-lg font-bold text-white">Salary & Deduction Settings</h2>

            {/* Income Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-grey">Gross Annual Salary</label>
              <NumericInput
                value={grossIncome}
                onChange={setGrossIncome}
                min={0}
                max={50000000}
                step={10000}
                type="currency"
                className="w-full"
              />
            </div>

            <div className="border-t border-border-navy/60 pt-4 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Old Regime Deductions</h3>

              {/* 80C */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">Sec 80C (PPF, ELSS, EPF)</span>
                  <NumericInput
                    value={sec80C}
                    onChange={setSec80C}
                    min={0}
                    max={150000}
                    step={1000}
                    type="currency"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={150000}
                  step={5000}
                  value={sec80C}
                  onChange={(e) => setSec80C(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* 80D */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">Sec 80D (Health Premium)</span>
                  <NumericInput
                    value={sec80D}
                    onChange={setSec80D}
                    min={0}
                    max={100000}
                    step={500}
                    type="currency"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={5000}
                  value={sec80D}
                  onChange={(e) => setSec80D(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* HRA Exempt */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">HRA Exemption Claim</span>
                  <NumericInput
                    value={hraExempt}
                    onChange={setHraExempt}
                    min={0}
                    max={1000000}
                    step={1000}
                    type="currency"
                  />
                </div>
              </div>

              {/* Home Loan Interest (24b) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">Home Loan Interest (Sec 24b)</span>
                  <NumericInput
                    value={homeLoanInterest}
                    onChange={setHomeLoanInterest}
                    min={0}
                    max={500000}
                    step={5000}
                    type="currency"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={200000}
                  step={10000}
                  value={homeLoanInterest}
                  onChange={(e) => setHomeLoanInterest(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* NPS extra (80CCD) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">NPS Voluntary (80CCD(1B))</span>
                  <NumericInput
                    value={npsExtra}
                    onChange={setNpsExtra}
                    min={0}
                    max={100000}
                    step={1000}
                    type="currency"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={5000}
                  value={npsExtra}
                  onChange={(e) => setNpsExtra(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Old Regime Tax</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.oldTaxLiability)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Deductions: {formatCurrency(calculations.oldDeductions)}</span>
            </div>

            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">New Regime Tax</span>
              <p className="text-xl font-extrabold text-emerald mt-1">
                {formatCurrency(calculations.newTaxLiability)}
              </p>
              <span className="text-[9px] text-emerald block mt-0.5">Standard Deduct: ₹75,000</span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald/20 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">Preferred Regime</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {calculations.preferredRegime}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">
                Saves you <strong>{formatCurrency(calculations.savings)}</strong> / yr
              </span>
            </div>
          </div>

          {/* Slabs breakdown */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">FY 2025-26 / FY 2026-27 Slabs (New Regime)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-navy-bg rounded-lg border border-border-navy">
                <span className="text-muted-grey">Up to ₹4 Lakhs</span>
                <p className="font-bold text-white mt-0.5">No Tax</p>
              </div>
              <div className="p-3 bg-navy-bg rounded-lg border border-border-navy">
                <span className="text-muted-grey">₹4L - ₹8 Lakhs</span>
                <p className="font-bold text-white mt-0.5">5% Tax</p>
              </div>
              <div className="p-3 bg-navy-bg rounded-lg border border-border-navy">
                <span className="text-muted-grey">₹8L - ₹12 Lakhs</span>
                <p className="font-bold text-white mt-0.5">10% Tax</p>
              </div>
              <div className="p-3 bg-navy-bg rounded-lg border border-border-navy">
                <span className="text-muted-grey">₹12L - ₹16 Lakhs</span>
                <p className="font-bold text-white mt-0.5">15% Tax</p>
              </div>
            </div>
            <div className="p-3 bg-emerald/5 border border-emerald/20 text-emerald text-[11px] rounded-lg">
              💡 **Rebate Rule:** Income tax is completely **waived (zero)** under Section 87A if taxable income does not exceed **₹12 Lakhs** in the New Regime.
            </div>
          </div>
        </div>
      </div>

      {/* Bracket Creep Section */}
      <section className="space-y-6 border-t border-border-navy/60 pt-10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-amber-500" />
            The Bracket Creep Simulator (Inflation Tax)
          </h2>
          <p className="text-sm text-muted-grey mt-1">
            See how inflation-aligned wage increases push you into higher tax brackets, hiking your real tax rate even if your purchasing power doesn&apos;t change.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 p-6 glass-card space-y-5">
            <h3 className="text-base font-bold text-white uppercase">Creep Settings</h3>
            
            {/* Salary Growth rate */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-grey">Annual Salary Growth (%)</span>
                <NumericInput
                  value={salaryGrowth}
                  onChange={setSalaryGrowth}
                  min={0}
                  max={30}
                  step={0.5}
                  type="percent"
                />
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.5}
                value={salaryGrowth}
                onChange={(e) => setSalaryGrowth(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] text-muted-grey block leading-tight">
                *Typically matches or slightly beats average inflation.
              </span>
            </div>

            {/* Inflation rate */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-grey font-semibold">Expected Inflation Rate</span>
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
                max={10}
                step={0.5}
                value={inflation}
                onChange={(e) => setInflation(Number(e.target.value))}
                className="w-full accent-amber-500 bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Projection period */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-grey">Simulation Tenure (Years)</span>
                <NumericInput
                  value={projectionYears}
                  onChange={setProjectionYears}
                  min={1}
                  max={25}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={5}
                max={15}
                step={1}
                value={projectionYears}
                onChange={(e) => setProjectionYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Graph and Explanation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warning callout */}
            <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-red-400 mr-1">⚠️ The Bracket Creep Warning:</span>
              If your salary grows by <strong>{salaryGrowth}%</strong> annually to match inflation, your real purchasing power stays exactly the same. However, because tax brackets are fixed in nominal terms, you will slide into higher tax brackets. Over <strong>{projectionYears} years</strong>, your effective tax rate climbs from <strong>{calculations.creepData[0]["Effective Tax Rate (%)"]}%</strong> to <strong>{calculations.creepData[projectionYears]["Effective Tax Rate (%)"]}%</strong>! You are paying more tax on the *same* real purchasing power.
            </div>

            {/* Chart of effective tax rate rising */}
            <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Rising Effective Tax Rate over Time</h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={calculations.creepData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#081c3a",
                        borderColor: "#112d55",
                        borderRadius: "8px",
                        color: "#f1f5f9"
                      }}
                      formatter={(v: any, name?: any) => {
                        if (name === "Effective Tax Rate (%)") return [`${v}%`, name];
                        return [formatCurrency(v), name];
                      }}
                    />
                    <Legend iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="Effective Tax Rate (%)"
                      stroke="#ef4444"
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Real Salary (Purchasing Power)"
                      stroke="#64748b"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collapsible Math Audit Section */}
      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button 
          onClick={() => setShowAudit(!showAudit)} 
          className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="text-emerald" size={18} />
            Tax Computation Mechanics & Bracket Creep Excel Formula
          </span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
        </button>
        
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Regime Tax Slabs Summary</h4>
              <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                <p>
                  <strong>New Regime:</strong> Standard Deduction ₹75,000 + Standard Slabs (0-3L 0%, 3-7L 5%, 7-10L 10%, 10-12L 15%, 12-15L 20%, &gt;15L 30%). Rebate Sec 87A up to ₹7 Lakhs taxable income.
                </p>
                <p>
                  <strong>Old Regime:</strong> Standard Deduction ₹50,000 + 80C + 80D + HRA + Home Loan Interest + 80CCD(1B). Rebate Sec 87A up to ₹5 Lakhs taxable income.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white">Bracket Creep & Real Income Discounting Formula</h4>
              <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                <thead>
                  <tr className="bg-navy-bg/60">
                    <th className="border border-border-navy/80 p-2 text-left">Calculation</th>
                    <th className="border border-border-navy/80 p-2 text-left">Excel / Sheets Formula</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Projected Nominal Salary (Year Y)</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Gross_Income * ((1 + {salaryGrowth}%)^{`Y`})</td>
                  </tr>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Real Purchasing Power Salary</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Nominal_Salary / ((1 + {inflation}%)^{`Y`})</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
