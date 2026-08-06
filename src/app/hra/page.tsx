"use client";

import React, { useState, useMemo } from "react";
import { Calculator, Info, HelpCircle, ChevronDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import NumericInput from "@/components/NumericInput";

export default function HraCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [monthlyBasic, setMonthlyBasic] = useState(60000);
  const [monthlyDa, setMonthlyDa] = useState(0);
  const [monthlyHraReceived, setMonthlyHraReceived] = useState(25000);
  const [monthlyRentPaid, setMonthlyRentPaid] = useState(20000);
  const [isMetro, setIsMetro] = useState(true);

  // Projections parameters
  const [salaryGrowth, setSalaryGrowth] = useState(6); // 6% salary growth
  const [rentGrowth, setRentGrowth] = useState(8); // 8% rent inflation

  const calculations = useMemo(() => {
    const basicDa = monthlyBasic + monthlyDa;
    const metroPercent = isMetro ? 0.5 : 0.4;

    // HRA Exemption rules (Monthly)
    const rule1 = monthlyHraReceived;
    const rule2 = Math.max(0, monthlyRentPaid - (basicDa * 0.1));
    const rule3 = basicDa * metroPercent;

    const monthlyExempt = Math.min(rule1, rule2, rule3);
    const monthlyTaxable = Math.max(0, monthlyHraReceived - monthlyExempt);

    // 5-Year Projection data (how rent inflation affects exemption efficiency)
    const chartData = [];
    let projectedBasicDa = basicDa;
    let projectedHraReceived = monthlyHraReceived;
    let projectedRentPaid = monthlyRentPaid;

    for (let yr = 1; yr <= 5; yr++) {
      projectedBasicDa = projectedBasicDa * (1 + salaryGrowth / 100);
      projectedHraReceived = projectedHraReceived * (1 + salaryGrowth / 100); // assume HRA scales with basic
      projectedRentPaid = projectedRentPaid * (1 + rentGrowth / 100);

      const pRule1 = projectedHraReceived;
      const pRule2 = Math.max(0, projectedRentPaid - (projectedBasicDa * 0.1));
      const pRule3 = projectedBasicDa * metroPercent;

      const pExempt = Math.min(pRule1, pRule2, pRule3);
      const pTaxable = Math.max(0, projectedHraReceived - pExempt);

      chartData.push({
        year: `Yr ${yr}`,
        "Rent Paid": Math.round(projectedRentPaid * 12),
        "Exempt HRA (Tax Free)": Math.round(pExempt * 12),
        "Taxable HRA": Math.round(pTaxable * 12)
      });
    }

    return {
      monthlyExempt: Math.round(monthlyExempt),
      monthlyTaxable: Math.round(monthlyTaxable),
      annualExempt: Math.round(monthlyExempt * 12),
      annualTaxable: Math.round(monthlyTaxable * 12),
      actualHraExemptionPercent: ((monthlyExempt / (monthlyHraReceived || 1)) * 100).toFixed(0),
      ruleDetails: {
        hraReceived: Math.round(rule1),
        excessRent: Math.round(rule2),
        basicLimit: Math.round(rule3)
      },
      chartData
    };
  }, [monthlyBasic, monthlyDa, monthlyHraReceived, monthlyRentPaid, isMetro, salaryGrowth, rentGrowth]);

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
            HRA Tax Exemption Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Calculate your house rent allowance income tax exemption under Section 10(13A).
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-5">
            <h2 className="text-lg font-bold text-white">Income & Rent Settings</h2>

            {/* Monthly Basic Salary */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-grey font-semibold">Monthly Basic Salary</span>
                <NumericInput
                  value={monthlyBasic}
                  onChange={setMonthlyBasic}
                  min={1000}
                  max={1000000}
                  step={1000}
                  type="currency"
                />
              </div>
            </div>

            {/* Monthly DA */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-grey font-semibold">Dearness Allowance (DA)</span>
                <NumericInput
                  value={monthlyDa}
                  onChange={setMonthlyDa}
                  min={0}
                  max={500000}
                  step={1000}
                  type="currency"
                />
              </div>
            </div>

            {/* Monthly HRA Received */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-grey font-semibold">Monthly HRA Received</span>
                <NumericInput
                  value={monthlyHraReceived}
                  onChange={setMonthlyHraReceived}
                  min={0}
                  max={1000000}
                  step={500}
                  type="currency"
                />
              </div>
            </div>

            {/* Rent Paid */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-grey font-semibold">Monthly Rent Paid</span>
                <NumericInput
                  value={monthlyRentPaid}
                  onChange={setMonthlyRentPaid}
                  min={0}
                  max={1000000}
                  step={500}
                  type="currency"
                />
              </div>
            </div>

            {/* Location Metro Button */}
            <div className="space-y-2">
              <label className="text-xs text-muted-grey block font-semibold">Residential Location</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsMetro(true)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${isMetro
                    ? "bg-emerald border-emerald text-navy-bg"
                    : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                  }`}
                >
                  Metro City (50% basic)
                </button>
                <button
                  onClick={() => setIsMetro(false)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${!isMetro
                    ? "bg-emerald border-emerald text-navy-bg"
                    : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                  }`}
                >
                  Non-Metro City (40% basic)
                </button>
              </div>
              <span className="text-[9px] text-muted-grey block leading-normal">
                *Metros: Mumbai, Delhi, Kolkata, Chennai.
              </span>
            </div>

            {/* Projections Segment */}
            <div className="border-t border-border-navy/60 pt-4 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Inflation & Growth Settings</h3>

              {/* Rent inflation rate */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">Rent Growth (Inflation)</span>
                  <NumericInput
                    value={rentGrowth}
                    onChange={setRentGrowth}
                    min={0}
                    max={25}
                    step={0.5}
                    type="percent"
                    className="text-amber-500 focus-within:border-amber-500/50"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={0.5}
                  value={rentGrowth}
                  onChange={(e) => setRentGrowth(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-navy-bg h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Salary growth rate */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-grey">Salary Growth Rate</span>
                  <NumericInput
                    value={salaryGrowth}
                    onChange={setSalaryGrowth}
                    min={0}
                    max={25}
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
              </div>
            </div>
          </div>
        </div>

        {/* Results & Graph Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Annual HRA Received</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(monthlyHraReceived * 12)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">₹{monthlyHraReceived.toLocaleString("en-IN")}/month</span>
            </div>

            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Exempt HRA (Tax Free)</span>
              <p className="text-xl font-extrabold text-emerald mt-1">
                {formatCurrency(calculations.annualExempt)}
              </p>
              <span className="text-[9px] text-emerald block mt-0.5">{calculations.actualHraExemptionPercent}% of HRA is tax-free</span>
            </div>

            <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
              <span className="text-[10px] uppercase font-bold text-red-400 block">Taxable HRA Portion</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.annualTaxable)}
              </p>
              <span className="text-[9px] text-red-400 block mt-0.5">Taxed at your income slab</span>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/25 space-y-3.5 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">The 3-Rule Statutory Breakdown (Monthly)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-light-grey">
              <div className="p-4 rounded-xl bg-navy-bg border border-border-navy">
                <span className="text-[10px] text-muted-grey font-bold block">1. Actual HRA</span>
                <p className="text-base font-bold text-white mt-1">{formatCurrency(calculations.ruleDetails.hraReceived)}</p>
                <span className="text-[9px] text-muted-grey block leading-tight mt-0.5">HRA component of salary</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-bg border border-border-navy">
                <span className="text-[10px] text-muted-grey font-bold block">2. Rent - 10% Salary</span>
                <p className="text-base font-bold text-white mt-1">{formatCurrency(calculations.ruleDetails.excessRent)}</p>
                <span className="text-[9px] text-muted-grey block leading-tight mt-0.5">Rent minus 10% of basic + DA</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-bg border border-border-navy">
                <span className="text-[10px] text-muted-grey font-bold block">3. Basic Salary Limit</span>
                <p className="text-base font-bold text-white mt-1">{formatCurrency(calculations.ruleDetails.basicLimit)}</p>
                <span className="text-[9px] text-muted-grey block leading-tight mt-0.5">{isMetro ? "50%" : "40%"} of Basic + DA</span>
              </div>
            </div>
            <div className="p-3 bg-emerald/5 border border-emerald/20 text-emerald text-[11px] rounded-lg">
              💡 **Rule:** The tax exemption amount is the **lowest** of the three values above, which equals **{formatCurrency(calculations.monthlyExempt)}/month**.
            </div>
          </div>

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">5-Year Rent Inflation Projection</h3>
              <span className="text-[10px] text-muted-grey">Rent growing at {rentGrowth}% vs Salary at {salaryGrowth}%</span>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}K`}
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
                  <Legend iconType="rect" />
                  <Bar dataKey="Rent Paid" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Exempt HRA (Tax Free)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Taxable HRA" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Section */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          Understanding HRA Exemption Mechanics
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">The 3 Statutory Limits Explained</h4>
            <p>
              To claim tax exemption on HRA under Section 10(13A), you must satisfy all three criteria dictated by the Income Tax Act.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Actual HRA:</strong> This is the literal amount your employer assigns to the HRA component in your salary structure. You cannot claim more than this component.</li>
              <li><strong>Rent minus 10% of Basic Salary:</strong> The law assumes that at least 10% of your basic income should be spent on housing. Tax exemption only applies to rent paid *in excess* of that 10%. If your rent is less than 10% of basic, your HRA exemption is <strong>zero</strong>.</li>
              <li><strong>Basic Limit (40%/50%):</strong> An absolute cap designed to restrict high deductions. Residents of Mumbai, Delhi, Kolkata, or Chennai can claim up to 50% of Basic + DA, while other cities are capped at 40%.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Why Rent Inflation Matters to HRA</h4>
            <p>
              <strong>Inflation Reality:</strong> While direct inflation adjustment is not required to calculate current year taxes, rent inflation in metro cities often grows at 8–10% per year, outpacing average basic salary appraisal rates.
            </p>
            <p>
              As your rent inflates faster than your basic salary, your &quot;Excess Rent (Rent - 10% Basic)&quot; increases. This can push your tax-free exempt HRA higher (saving you taxes) until it hits the statutory limit of your actual HRA received.
            </p>
            <p>
              Use the projection chart to simulate how your tax liability and HRA exemption will shift in the future as rent inflates.
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
            HRA Exemption Formula & Excel Replication
          </span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
        </button>
        
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Section 10(13A) Exemption Rule</h4>
              <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                <p>
                  <strong>Monthly Exempt HRA = MIN(Rule 1, Rule 2, Rule 3)</strong>
                </p>
                <p className="text-[10px] text-muted-grey">
                  Rule 1: Actual HRA Received
                  <br />
                  Rule 2: Rent Paid - 10% of (Basic + DA)
                  <br />
                  Rule 3: 50% of (Basic + DA) for Metros / 40% for Non-Metros
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white">Excel / Google Sheets Replication Formula</h4>
              <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                <thead>
                  <tr className="bg-navy-bg/60">
                    <th className="border border-border-navy/80 p-2 text-left">Calculation</th>
                    <th className="border border-border-navy/80 p-2 text-left">Excel / Sheets Formula</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Monthly Exempt HRA</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=MIN(HRA_Received, MAX(0, Rent_Paid - 0.1*(Basic+DA)), (Basic+DA)*IF(IsMetro, 0.5, 0.4))</td>
                  </tr>
                  <tr>
                    <td className="border border-border-navy/80 p-2 font-medium text-white">Annual Taxable HRA</td>
                    <td className="border border-border-navy/80 p-2 font-mono text-emerald">=(HRA_Received - Monthly_Exempt_HRA) * 12</td>
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
