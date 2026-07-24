"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, ShieldCheck, ChevronDown, HelpCircle, Download, Upload, PieChart as PieIcon, Activity } from "lucide-react";
import NumericInput from "@/components/NumericInput";

interface LineItem {
  id: number;
  label: string;
  value: number;
  category?: string;
  isLiquid?: boolean;
}

const PRESET_ASSET_CATEGORIES = [
  "Savings & Current Accounts",
  "Fixed Deposits & RDs",
  "Stocks & Equity Shares",
  "Mutual Funds (Equity/Hybrid)",
  "Debt Funds & Bonds",
  "Employee Provident Fund (EPF)",
  "Public Provident Fund (PPF)",
  "National Pension Scheme (NPS)",
  "Physical Gold & Jewellery",
  "SGBs & Digital Gold",
  "Real Estate / Land / Property",
  "Crypto & Alternative Assets",
  "Emergency Liquid Reserve"
];

const PRESET_LIABILITY_CATEGORIES = [
  "Home Loan Outstanding",
  "Car / Vehicle Loan",
  "Personal / Education Loan",
  "Credit Card Dues",
  "Gold / Property Loan",
  "Family / Hand Loans"
];

function ItemList({
  items,
  onAdd,
  onRemove,
  onChange,
  color,
  presetCategories
}: {
  items: LineItem[];
  onAdd: (label?: string) => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: "label" | "value", val: string | number) => void;
  color: "emerald" | "red";
  presetCategories: string[];
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-navy-bg border border-border-navy/60 hover:border-emerald/30 transition-all">
          <input
            type="text"
            value={item.label}
            onChange={(e) => onChange(item.id, "label", e.target.value)}
            placeholder="Item Label..."
            className="flex-1 bg-transparent border-b border-border-navy/60 rounded px-2 py-1 text-xs text-white placeholder-muted-grey focus:outline-none focus:border-emerald"
          />
          <div className="flex items-center gap-2">
            <NumericInput
              value={item.value}
              onChange={(v) => onChange(item.id, "value", v)}
              min={0}
              max={1000000000}
              step={10000}
              type="currency"
            />
            <button
              onClick={() => onRemove(item.id)}
              className="p-1.5 text-muted-grey hover:text-red-400 transition-colors shrink-0 cursor-pointer"
              title="Delete item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={() => onAdd()}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border ${
            color === "emerald"
              ? "bg-emerald/10 border-emerald/30 text-emerald hover:bg-emerald hover:text-navy-bg"
              : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white"
          } transition-all cursor-pointer`}
        >
          <Plus size={13} /> Add Custom Item
        </button>

        {/* Quick Add Presets dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              onAdd(e.target.value);
              e.target.value = "";
            }
          }}
          className="text-[11px] font-semibold bg-navy-bg border border-border-navy rounded-lg px-2 py-1 text-muted-grey hover:text-white cursor-pointer outline-none"
        >
          <option value="">+ Quick Add Preset Category...</option>
          {presetCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

let nextId = 100;

export default function NetWorthCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<LineItem[]>([
    { id: 1, label: "Savings & Current Accounts", value: 200000, isLiquid: true },
    { id: 2, label: "Mutual Funds & Stocks", value: 500000, isLiquid: true },
    { id: 3, label: "Employee Provident Fund (EPF)", value: 300000, isLiquid: false },
    { id: 4, label: "Physical Gold & SGBs", value: 150000, isLiquid: false },
    { id: 5, label: "Real Estate / Property", value: 4500000, isLiquid: false },
  ]);

  const [liabilities, setLiabilities] = useState<LineItem[]>([
    { id: 6, label: "Home Loan Outstanding", value: 2000000 },
    { id: 7, label: "Car / Personal Loan", value: 300000 },
    { id: 8, label: "Credit Card Dues", value: 50000 },
  ]);

  useEffect(() => setMounted(true), []);

  const addAsset = (label?: string) => {
    const isLiq = label ? ["Savings & Current Accounts", "Fixed Deposits & RDs", "Stocks & Equity Shares", "Mutual Funds (Equity/Hybrid)", "Emergency Liquid Reserve"].includes(label) : false;
    setAssets((p) => [...p, { id: ++nextId, label: label || "New Asset", value: 0, isLiquid: isLiq }]);
  };
  const removeAsset = (id: number) => setAssets((p) => p.filter((x) => x.id !== id));
  const changeAsset = (id: number, field: "label" | "value", val: string | number) =>
    setAssets((p) => p.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  const addLiability = (label?: string) => {
    setLiabilities((p) => [...p, { id: ++nextId, label: label || "New Debt", value: 0 }]);
  };
  const removeLiability = (id: number) => setLiabilities((p) => p.filter((x) => x.id !== id));
  const changeLiability = (id: number, field: "label" | "value", val: string | number) =>
    setLiabilities((p) => p.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  // Export Data JSON
  const exportData = () => {
    const data = { assets, liabilities, timestamp: new Date().toISOString() };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `valarchix_net_worth_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Data JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.assets && Array.isArray(parsed.assets)) setAssets(parsed.assets);
        if (parsed.liabilities && Array.isArray(parsed.liabilities)) setLiabilities(parsed.liabilities);
      } catch (err) {
        alert("Invalid file format. Please select a valid ValarchiX Net Worth JSON export.");
      }
    };
    reader.readAsText(file);
  };

  const { totalAssets, totalLiabilities, netWorth, pieData, liquidAssets, debtToAssetRatio, liquidityRatio, solvencyScore } = useMemo(() => {
    const totalAssets = assets.reduce((s, x) => s + (Number(x.value) || 0), 0);
    const totalLiabilities = liabilities.reduce((s, x) => s + (Number(x.value) || 0), 0);
    const netWorth = totalAssets - totalLiabilities;
    const liquidAssets = assets.filter(a => a.isLiquid || a.label.toLowerCase().includes("savings") || a.label.toLowerCase().includes("mutual") || a.label.toLowerCase().includes("stocks") || a.label.toLowerCase().includes("emergency")).reduce((s, x) => s + (Number(x.value) || 0), 0);

    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const liquidityRatio = totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 0;
    const solvencyScore = totalAssets > 0 ? (netWorth / totalAssets) * 100 : 0;

    const pieData = [
      { name: "Net Equity Worth", value: Math.max(netWorth, 0), color: "#22c55e" },
      { name: "Total Liabilities", value: totalLiabilities, color: "#ef4444" },
    ];

    return { totalAssets, totalLiabilities, netWorth, pieData, liquidAssets, debtToAssetRatio, liquidityRatio, solvencyScore };
  }, [assets, liabilities]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Wallet className="text-emerald" />
            Net Worth Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Wealth = Total Assets − Total Liabilities. Multi-asset categorization, financial solvency diagnostics, and privacy-first local backups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-bg border border-border-navy text-muted-grey hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download size={14} /> Export Backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-bg border border-border-navy text-muted-grey hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <Upload size={14} /> Import Backup
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input Lists */}
        <div className="space-y-6">
          {/* Assets */}
          <div className="p-6 glass-card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald" /> Assets Breakdown
              <span className="ml-auto text-emerald font-bold text-sm">{fmt(totalAssets)}</span>
            </h2>
            <p className="text-[10px] text-muted-grey">Everything you OWN across 20+ asset classes (Stocks, MFs, Real Estate, Gold, PF, NPS, Cash).</p>
            <ItemList
              items={assets}
              onAdd={addAsset}
              onRemove={removeAsset}
              onChange={changeAsset}
              color="emerald"
              presetCategories={PRESET_ASSET_CATEGORIES}
            />
          </div>

          {/* Liabilities */}
          <div className="p-6 glass-card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingDown size={16} className="text-red-400" /> Liabilities & Debts
              <span className="ml-auto text-red-400 font-bold text-sm">{fmt(totalLiabilities)}</span>
            </h2>
            <p className="text-[10px] text-muted-grey">Everything you OWE — home loans, car loans, credit card balances, personal dues.</p>
            <ItemList
              items={liabilities}
              onAdd={addLiability}
              onRemove={removeLiability}
              onChange={changeLiability}
              color="red"
              presetCategories={PRESET_LIABILITY_CATEGORIES}
            />
          </div>
        </div>

        {/* Right: Results & Health Ratios */}
        <div className="space-y-6">
          {/* Net Worth Hero Display */}
          <div className={`p-6 rounded-2xl border ${netWorth >= 0 ? "border-emerald/40 bg-emerald/5" : "border-red-500/40 bg-red-500/5"} text-center space-y-2`}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-grey">Your Net Worth</p>
            <p className={`text-5xl font-extrabold ${netWorth >= 0 ? "text-emerald glow-emerald" : "text-red-400"}`}>
              {fmt(netWorth)}
            </p>
            <p className="text-[11px] text-muted-grey">
              {netWorth >= 0
                ? `Your assets cover ${((totalAssets / Math.max(totalLiabilities, 1)) * 100).toFixed(0)}% of your debts.`
                : "Your liabilities exceed your assets — prioritize debt snowball/avalanche elimination."}
            </p>
          </div>

          {/* Financial Health Diagnostic Ratios */}
          <div className="p-6 glass-card space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="text-emerald" size={16} /> Financial Health Diagnostic Metrics
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-navy-bg border border-border-navy/60 rounded-xl text-center">
                <span className="text-[9px] uppercase font-bold text-muted-grey block">Debt-to-Asset</span>
                <span className={`text-lg font-black mt-0.5 block ${debtToAssetRatio > 50 ? "text-red-400" : debtToAssetRatio > 30 ? "text-amber-400" : "text-emerald"}`}>
                  {debtToAssetRatio.toFixed(1)}%
                </span>
                <span className="text-[8px] text-muted-grey">{debtToAssetRatio < 40 ? "Healthy (<40%)" : "High Risk"}</span>
              </div>

              <div className="p-3 bg-navy-bg border border-border-navy/60 rounded-xl text-center">
                <span className="text-[9px] uppercase font-bold text-muted-grey block">Liquidity Ratio</span>
                <span className="text-lg font-black text-emerald mt-0.5 block">
                  {liquidityRatio.toFixed(1)}%
                </span>
                <span className="text-[8px] text-muted-grey">{fmt(liquidAssets)}</span>
              </div>

              <div className="p-3 bg-navy-bg border border-border-navy/60 rounded-xl text-center">
                <span className="text-[9px] uppercase font-bold text-muted-grey block">Solvency Score</span>
                <span className="text-lg font-black text-emerald mt-0.5 block">
                  {solvencyScore.toFixed(1)}%
                </span>
                <span className="text-[8px] text-muted-grey">Net Equity %</span>
              </div>
            </div>
          </div>

          {/* Asset Allocation Pie Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 h-[220px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
              <span className="text-[10px] text-muted-grey uppercase font-bold">Net Equity</span>
              <span className={`text-sm font-extrabold ${netWorth >= 0 ? "text-emerald" : "text-red-400"}`}>{fmt(netWorth)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Guide */}
      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button onClick={() => setShowAudit(!showAudit)} className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer">
          <span className="flex items-center gap-1.5"><HelpCircle className="text-emerald" size={18} />How This is Calculated & Financial Diagnostics</span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
        </button>
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-3 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="bg-navy-bg/50 p-3 rounded-xl font-mono space-y-1">
              <p>Net Worth = Total Assets − Total Liabilities</p>
              <p>Debt-to-Asset Ratio = (Total Liabilities / Total Assets) × 100</p>
              <p>Liquidity Ratio = (Liquid & Marketable Assets / Total Assets) × 100</p>
            </div>
            <p className="text-[10px] text-amber-500">⚠️ <strong>Disclaimer:</strong> Educational simulator only. Asset values should be reviewed periodically against live market prices.</p>
          </div>
        )}
      </div>
    </div>
  );
}
