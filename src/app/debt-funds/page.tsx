"use client";

import React, { useState, useEffect } from "react";
import { Shield, Info, HelpCircle, CheckCircle2, ChevronRight, TrendingUp } from "lucide-react";

interface DebtCategory {
  name: string;
  duration: string;
  risk: string;
  volatility: string;
  suitableFor: string;
  description: string;
  creditQuality: string;
}

const DEBT_CATEGORIES: DebtCategory[] = [
  {
    name: "Liquid Funds",
    duration: "Up to 91 Days",
    risk: "Low",
    volatility: "Extremely Low",
    suitableFor: "Parking immediate emergency cash, business reserves, or lump sums before transferring to equities.",
    description: "Invests in highly secure certificate of deposits (CDs) and commercial papers with maturities under 91 days. Yields track central bank interest rates closely.",
    creditQuality: "High (Sovereign / AAA)"
  },
  {
    name: "Money Market Funds",
    duration: "Up to 1 Year",
    risk: "Low-Medium",
    volatility: "Very Low",
    suitableFor: "Conservative investors seeking returns slightly higher than liquid funds for an horizon of 3-12 months.",
    description: "Invests in money market instruments like treasury bills (T-bills) and commercial papers with a maximum maturity of 1 year.",
    creditQuality: "High (AAA)"
  },
  {
    name: "Ultra Short Duration",
    duration: "3 to 6 Months",
    risk: "Low-Medium",
    volatility: "Low",
    suitableFor: "Investors looking to deploy capital for a few months with slightly more return premium than liquid cash.",
    description: "Maintains a portfolio duration between 3 to 6 months. Slightly exposed to minor bond price shifts if interest rates move.",
    creditQuality: "High-Medium"
  },
  {
    name: "Low Duration Funds",
    duration: "6 to 12 Months",
    risk: "Medium",
    volatility: "Low-Medium",
    suitableFor: "Short-term goals like wedding costs, down payments, or fees coming up in 6-12 months.",
    description: "Portfolio duration is maintained between 6 to 12 months. Yield to maturity (YTM) is higher than money market categories.",
    creditQuality: "High-Medium"
  },
  {
    name: "Banking & PSU Funds",
    duration: "1 to 3 Years",
    risk: "Medium",
    volatility: "Medium",
    suitableFor: "Investors seeking high safety of principal (almost zero default risk) for an horizon of 1.5 to 3 years.",
    description: "At least 80% of assets must be lent to banks, public sector undertakings (PSUs), and municipal bodies. Highly secure against defaults.",
    creditQuality: "Extremely High (Sovereign/PSU)"
  },
  {
    name: "Corporate Bond Funds",
    duration: "1 to 3 Years",
    risk: "Medium",
    volatility: "Medium",
    suitableFor: "Conservative savers wanting higher yield than bank deposits, holding for a 2-3 year term.",
    description: "At least 80% of assets are invested in highest-rated AAA corporate bonds. Secure, but sensitive to interest rate cycles.",
    creditQuality: "High (AAA)"
  },
  {
    name: "Credit Risk Funds",
    duration: "1 to 4 Years",
    risk: "High (Default Risk)",
    volatility: "High",
    suitableFor: "Experienced investors willing to take risk of company defaults in exchange for high double-digit yields.",
    description: "Must invest at least 65% of its portfolio in below-AA rated corporate bonds. The fund manager bets on company turnarounds.",
    creditQuality: "Low-Medium (AA / A / BBB)"
  }
];

export default function DebtFundExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<DebtCategory>(DEBT_CATEGORIES[0]);
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 7.0, lastUpdated: "" });

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => setRates(data))
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  const filteredCategories = DEBT_CATEGORIES.filter((c) => {
    if (timelineFilter === "short") {
      return c.name.includes("Liquid") || c.name.includes("Money") || c.name.includes("Ultra");
    }
    if (timelineFilter === "mid") {
      return c.name.includes("Low") || c.name.includes("Corporate") || c.name.includes("PSU");
    }
    if (timelineFilter === "credit") {
      return c.name.includes("Credit");
    }
    return true;
  });

  return (
    <div className="space-y-10 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="text-emerald" />
            Debt Fund Explorer
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Compare credit qualities, maturity durations, and default risks of fixed-income instruments.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      {/* Sovereign Baselines Dashboard */}
      <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/30 grid grid-cols-3 gap-4">
        <div className="text-center md:text-left">
          <span className="text-[10px] uppercase font-bold text-muted-grey block">RBI Policy Repo Rate</span>
          <span className="text-lg md:text-xl font-extrabold text-white block mt-1">{rates.repoRate}%</span>
        </div>
        <div className="text-center md:text-left border-l border-r border-border-navy/60 px-4">
          <span className="text-[10px] uppercase font-bold text-muted-grey block">Sovereign 10Y Bond Yield</span>
          <span className="text-lg md:text-xl font-extrabold text-emerald block mt-1">{rates.bondYield10Y}%</span>
        </div>
        <div className="text-center md:text-left">
          <span className="text-[10px] uppercase font-bold text-muted-grey block">CPI Inflation Baseline</span>
          <span className="text-lg md:text-xl font-extrabold text-white block mt-1">{rates.inflationRate}%</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setTimelineFilter("all")}
          className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
            timelineFilter === "all"
              ? "bg-emerald text-navy-bg border-emerald"
              : "border-border-navy text-muted-grey hover:border-emerald/40 hover:text-white"
          }`}
        >
          All Categories
        </button>
        <button
          onClick={() => setTimelineFilter("short")}
          className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
            timelineFilter === "short"
              ? "bg-emerald text-navy-bg border-emerald"
              : "border-border-navy text-muted-grey hover:border-emerald/40 hover:text-white"
          }`}
        >
          Immediate / Short Term (&lt; 1 Year)
        </button>
        <button
          onClick={() => setTimelineFilter("mid")}
          className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
            timelineFilter === "mid"
              ? "bg-emerald text-navy-bg border-emerald"
              : "border-border-navy text-muted-grey hover:border-emerald/40 hover:text-white"
          }`}
        >
          Medium Term (1 to 3 Years)
        </button>
        <button
          onClick={() => setTimelineFilter("credit")}
          className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
            timelineFilter === "credit"
              ? "bg-emerald text-navy-bg border-emerald"
              : "border-border-navy text-muted-grey hover:border-emerald/40 hover:text-white"
          }`}
        >
          High Yield / Credit Risk
        </button>
      </div>

      {/* Split Dashboard */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side List */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] uppercase font-bold text-muted-grey tracking-wider block px-1">
            Debt Instruments Categories:
          </span>
          <div className="space-y-2">
            {filteredCategories.map((c) => {
              const isSelected = selectedCategory.name === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedCategory(c)}
                  className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                    isSelected
                      ? "bg-navy-light border-emerald text-emerald"
                      : "bg-navy-card/25 border-border-navy text-muted-grey hover:bg-navy-light/50 hover:text-white"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold block">{c.name}</span>
                    <span className="text-[10px] text-muted-grey block">Maturity: {c.duration}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side Detail Screen */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCategory && (
            <div className="p-6 glass-card space-y-6 animate-fadeIn">
              <div className="flex justify-between items-start border-b border-border-navy/60 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCategory.name}</h2>
                  <p className="text-xs text-muted-grey mt-1">Average Duration: {selectedCategory.duration}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedCategory.risk.includes("High") 
                    ? "bg-red-500/10 text-red-400 border border-red-500/25" 
                    : "bg-emerald/10 text-emerald border border-emerald/25"
                }`}>
                  {selectedCategory.risk} Risk
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-navy-bg border border-border-navy/60">
                  <span className="text-[10px] uppercase font-bold text-muted-grey">Volatility</span>
                  <span className="text-sm font-bold text-white block mt-1">{selectedCategory.volatility}</span>
                </div>
                <div className="p-4 rounded-xl bg-navy-bg border border-border-navy/60">
                  <span className="text-[10px] uppercase font-bold text-muted-grey">Credit Quality Target</span>
                  <span className="text-sm font-bold text-emerald block mt-1">{selectedCategory.creditQuality}</span>
                </div>
                <div className="p-4 rounded-xl bg-navy-bg border border-border-navy/60">
                  <span className="text-[10px] uppercase font-bold text-muted-grey">Maturity Limit</span>
                  <span className="text-sm font-bold text-white block mt-1">{selectedCategory.duration}</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-grey block">How it works:</span>
                  <p className="text-xs text-light-grey leading-relaxed mt-1">{selectedCategory.description}</p>
                </div>

                <div className="p-4 rounded-xl border border-emerald/20 bg-emerald/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald tracking-wide block">Who is this suitable for?</span>
                  <p className="text-xs text-light-grey leading-relaxed">{selectedCategory.suitableFor}</p>
                </div>
              </div>
            </div>
          )}

          {/* Educational Check */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Info className="text-emerald" size={18} />
              Debt Fund Risk Parameters (Education Card)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 text-xs text-muted-grey leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald" /> 1. Credit Risk (Default)</h4>
                <p>
                  This is the risk that companies borrowing from the fund fail to pay back the principal or interest. Sovereign debt (issued by RBI) has zero default risk, while lower-tier corporates carry higher risk.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald" /> 2. Interest Rate Risk (Duration)</h4>
                <p>
                  When central bank interest rates **rise**, bond prices **fall**. Long-duration funds suffer heavy price drops during interest rate hike cycles. Short-duration funds are highly protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
