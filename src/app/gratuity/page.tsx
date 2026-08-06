"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Coins, Info, HelpCircle, ChevronDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function GratuityCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [monthlyBasicDa, setMonthlyBasicDa] = useState(80000);
  const [yearsOfService, setYearsOfService] = useState(10);
  const [yearsUntilRetirement, setYearsUntilRetirement] = useState(15);
  const [expectedSalaryGrowth, setExpectedSalaryGrowth] = useState(6);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const TAX_EXEMPT_LIMIT = 2500000; // 25 Lakhs tax-exempt limit for private sector gratuity (recently updated)

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  const calculations = useMemo(() => {
    // Current Gratuity (if employee resigns today)
    // Formula: (15 * BasicSalary * YearsOfService) / 26
    const currentGratuity = (15 * monthlyBasicDa * yearsOfService) / 26;

    // Projected Future Gratuity (at retirement)
    const futureServiceYears = yearsOfService + yearsUntilRetirement;
    const futureSalary = monthlyBasicDa * Math.pow(1 + expectedSalaryGrowth / 100, yearsUntilRetirement);
    const futureGratuity = (15 * futureSalary * futureServiceYears) / 26;

    // Discounted Future Gratuity (Real Purchasing Power)
    const realFutureGratuity = futureGratuity / Math.pow(1 + inflation / 100, yearsUntilRetirement);

    // Accrual path data for charts (Year-by-year from now to retirement)
    const chartData = [];
    let currentSalary = monthlyBasicDa;

    for (let yr = 0; yr <= yearsUntilRetirement; yr++) {
      if (yr > 0) {
        currentSalary = currentSalary * (1 + expectedSalaryGrowth / 100);
      }
      const service = yearsOfService + yr;
      const nominalGrat = (15 * currentSalary * service) / 26;
      const realGrat = nominalGrat / Math.pow(1 + inflation / 100, yr);

      chartData.push({
        year: `Yr ${yr}`,
        "Nominal Gratuity": Math.round(nominalGrat),
        "Real Gratuity": Math.round(realGrat)
      });
    }

    return {
      currentGratuity: Math.round(currentGratuity),
      futureGratuity: Math.round(futureGratuity),
      realFutureGratuity: Math.round(realFutureGratuity),
      futureSalary: Math.round(futureSalary),
      futureServiceYears,
      chartData
    };
  }, [monthlyBasicDa, yearsOfService, yearsUntilRetirement, expectedSalaryGrowth, inflation]);

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
            <Coins className="text-emerald" />
            Gratuity Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate your gratuity benefit under the Payment of Gratuity Act and assess the inflation impact on future retirement payouts.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-6">
            <h2 className="text-lg font-bold text-white">Employment Settings</h2>

            {/* Basic Salary + DA */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Last Drawn Basic + DA (Monthly)</span>
                <NumericInput
                  value={monthlyBasicDa}
                  onChange={setMonthlyBasicDa}
                  min={1000}
                  max={5000000}
                  step={1000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={10000}
                max={300000}
                step={5000}
                value={monthlyBasicDa}
                onChange={(e) => setMonthlyBasicDa(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Current Years of Service */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Completed Years of Service</span>
                <NumericInput
                  value={yearsOfService}
                  onChange={setYearsOfService}
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
                value={yearsOfService}
                onChange={(e) => setYearsOfService(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Years until retirement */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Years until Retirement</span>
                <NumericInput
                  value={yearsUntilRetirement}
                  onChange={setYearsUntilRetirement}
                  min={0}
                  max={45}
                  step={1}
                  type="years"
                />
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={yearsUntilRetirement}
                onChange={(e) => setYearsUntilRetirement(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Salary Growth rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Expected Yearly Salary Appraisal</span>
                <NumericInput
                  value={expectedSalaryGrowth}
                  onChange={setExpectedSalaryGrowth}
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
                value={expectedSalaryGrowth}
                onChange={(e) => setExpectedSalaryGrowth(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
            </div>

            {/* Inflation Toggle */}
            <div className="border-t border-border-navy pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the future gratuity payout to show equivalent purchasing power today."><HelpCircle size={14} /></span>
                </label>
                <input
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                  className="rounded border-border-navy text-emerald focus:ring-emerald accent-emerald h-4 w-4"
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Gratuity if you leave today</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.currentGratuity)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Based on {yearsOfService} service years</span>
            </div>

            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Nominal Gratuity at Retirement</span>
              <p className="text-xl font-extrabold text-emerald mt-1">
                {formatCurrency(calculations.futureGratuity)}
              </p>
              <span className="text-[9px] text-emerald block mt-0.5">Based on {calculations.futureServiceYears} service years</span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald/20 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">
                {adjustInflation ? "Real Value (Today's Power)" : "Inflation Adjusted Value"}
              </span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(adjustInflation ? calculations.realFutureGratuity : calculations.futureGratuity)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">
                {adjustInflation 
                  ? `Purchasing power in ${yearsUntilRetirement} years` 
                  : "Turn on Inflation toggle to see purchasing power"}
              </span>
            </div>
          </div>

          {/* Tax alert */}
          <div className="p-4 rounded-xl border border-border-navy bg-navy-light/10 text-xs text-light-grey leading-relaxed space-y-1">
            <span className="font-bold text-white block">⚖️ Income Tax Rules on Gratuity:</span>
            For private sector employees, gratuity is tax-exempt up to a statutory lifetime limit of <strong>{formatCurrency(TAX_EXEMPT_LIMIT)}</strong>. Any amount received beyond this limit is fully taxable. Government employees enjoy completely tax-free gratuity.
          </div>

          {/* Warning / Explanation Banner */}
          {adjustInflation && yearsUntilRetirement > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-amber-500 mr-1">⚠️ The Future Payout Shrinkage:</span>
              Due to salary growth, your projected nominal gratuity increases to <strong>{formatCurrency(calculations.futureGratuity)}</strong> in {yearsUntilRetirement} years. However, due to <strong>{inflation}%</strong> inflation, the real buying power of that payout collapses to <strong>{formatCurrency(calculations.realFutureGratuity)}</strong> in today&apos;s terms.
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gratuity Accrual Curve (Nominal vs. Real)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gratColorNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gratColorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
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
                    dataKey="Nominal Gratuity"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#gratColorNominal)"
                    strokeWidth={2}
                  />
                  {adjustInflation && yearsUntilRetirement > 0 && (
                    <Area
                      type="monotone"
                      dataKey="Real Gratuity"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#gratColorReal)"
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Section */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          Payment of Gratuity Act Regulations
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Eligibility & Calculation Formula</h4>
            <p>
              Gratuity is a financial benefit paid by employers under the **Payment of Gratuity Act, 1972** as a gesture of appreciation for long-term service.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Eligibility:</strong> You must complete a minimum of 5 years of continuous service with the same employer (except in cases of death or disablement).</li>
              <li><strong>Formula:</strong> Gratuity is computed as 15 days of salary for every completed year of service, calculated as:
                <div className="bg-navy-bg p-3 border border-border-navy my-2 rounded-lg font-bold text-white text-center">
                  Gratuity = (15 × Last Drawn Salary × Service Tenure) / 26
                </div>
                Here, **Last Drawn Salary** is Basic Salary + Dearness Allowance (DA). A month is considered as 26 working days.
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Inflation & Tenure Impact</h4>
            <p>
              Because gratuity increases with *both* salary growth and tenure, it grows exponentially. However, since the benefit is only paid out when you leave the organization (typically at retirement), it is highly vulnerable to inflation.
            </p>
            <p>
              If you stay at a company for 25 years, the gratuity you accumulate looks substantial in nominal numbers. Factor in a 5% average yearly inflation, and the real value of the payout is slashed to less than a third of its face value.
            </p>
            <p>
              Use this calculator to determine if your retirement gratuity is sufficient to meet your long-term goals or if you should build supplementary investments.
            </p>
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
            How Gratuity is Calculated & Excel Replication
          </span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
        </button>
        
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Statutory Gratuity Formula</h4>
              <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                <p>
                  <strong>Gratuity (G) = (15 / 26) × Last Drawn Monthly Basic+DA × Total Years of Service</strong>
                </p>
                <p className="text-[10px] text-muted-grey">
                  Note: Under Section 10(10) of the Income Tax Act, non-government employee gratuity is exempt up to ₹25 Lakhs.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white">Excel / Google Sheets Replication</h4>
              <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                <thead>
                  <tr className="bg-navy-bg/60">
                    <th className="border border-border-navy/80 p-2 text-left">Calculation</th>
                    <th className="border border-border-navy/80 p-2 text-left">Excel / Sheets Formula</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Gratuity Payout</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=(15/26) * Monthly_Basic_DA * Years_Of_Service</td>
                  </tr>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Real Inflation Value</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=Gratuity_Payout / ((1 + {inflation}%)^{yearsUntilRetirement})</td>
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
