"use client";

import React from "react";
import { ShieldCheck, Info, AlertTriangle, Scale, UserCheck } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="border-b border-border-navy pb-5 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-black text-heading tracking-tight flex items-center justify-center md:justify-start gap-2.5">
          <ShieldCheck className="text-emerald w-7 h-7" />
          <span>Legal &amp; Educational Disclaimer</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-grey mt-1.5">
          Please read this disclosure carefully before using the ValarchiX platform.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-5">
        
        {/* Core Philosophy Banner */}
        <div className="p-5 sm:p-6 card-stat-emerald rounded-2xl space-y-2.5 border">
          <div className="flex items-center gap-2 font-black text-sm">
            <Info className="w-5 h-5" />
            <span>Core Principle: Education, Not Recommendations</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed">
            ValarchiX is built solely as an interactive educational simulator to help users understand business economics, tax regimes, compounding mathematics, and valuation metrics. 
            <strong> We strictly adhere to our motto: “We don&apos;t tell what to pick, we tell how to pick.”</strong> The platform never issues buy, sell, or hold recommendations for any security or asset class.
          </p>
        </div>

        {/* Major Guardrails Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* No Advisory Services */}
          <div className="p-5 card-tile-neutral rounded-2xl space-y-2.5 border">
            <div className="flex items-center gap-2 text-heading font-extrabold text-sm">
              <Scale className="text-emerald w-5 h-5" />
              <h4>No Unregistered Investment Advice</h4>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              ValarchiX is not a registered investment advisor with the Securities and Exchange Board of India (SEBI). The metrics, CAGR comparisons, planners, and calculator outputs shown on this site are purely mathematical simulations based on user-supplied inputs and historical feeds. They do not constitute personalized financial planning, taxation advice, or investment recommendations.
            </p>
          </div>

          {/* Seek Professional Help */}
          <div className="p-5 card-tile-neutral rounded-2xl space-y-2.5 border">
            <div className="flex items-center gap-2 text-heading font-extrabold text-sm">
              <UserCheck className="text-emerald w-5 h-5" />
              <h4>Consult Certified Professionals</h4>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              Financial decisions involve risks. The planners and estimators provided are designed as learning aids, not guarantees. We highly recommend that you seek the services of a certified financial planner, tax consultant, or SEBI-registered investment advisor before making real-world investments or filing taxes.
            </p>
          </div>
        </div>

        {/* Calculation Risk Warning */}
        <div className="p-5 banner-alert-amber rounded-2xl space-y-2 border">
          <div className="flex items-center gap-2 font-black text-sm text-amber-500">
            <AlertTriangle className="w-5 h-5" />
            <span>Mathematical Estimates &amp; Historical Data</span>
          </div>
          <ul className="text-xs text-muted-grey space-y-1 list-disc pl-5 leading-relaxed">
            <li><strong>Historical Performance:</strong> Past NAV data, index growth, or rate returns are strictly for retrospective analysis and do not guarantee future returns.</li>
            <li><strong>Tax Calculations:</strong> Slabs and exemptions reflect current Indian Income Tax provisions (Old vs New Regime) but are subject to legislative changes. Verify with an official CA.</li>
            <li><strong>Inflation Variations:</strong> Future costs are projected using standard category estimates (e.g. 10% for education, 6% general CPI). Actual real-world inflation may vary.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
