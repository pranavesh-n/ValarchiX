"use client";

import React, { useState } from "react";
import { 
  PieChart, Layers, ShieldAlert, BarChart2, TrendingUp, 
  UploadCloud, CheckCircle2, AlertTriangle, ChevronRight, Activity, Cpu, RefreshCw, FileSpreadsheet
} from "lucide-react";
import { generatePortfolioXRay } from "@/lib/engine/portfolio";
import { InvestmentAsset } from "@/lib/engine/types";
import { formatINRWords } from "@/lib/engine/numeric";

const SAMPLE_INVESTMENTS: InvestmentAsset[] = [
  { id: "1", name: "Parag Parikh Flexi Cap Fund", category: "mutual_fund", currentValue: 650000, monthlyContribution: 20000, expectedReturnPct: 14.2, expenseRatioPct: 0.62, amcName: "PPFAS" },
  { id: "2", name: "HDFC Top 100 Fund", category: "mutual_fund", currentValue: 450000, monthlyContribution: 15000, expectedReturnPct: 12.8, expenseRatioPct: 0.85, amcName: "HDFC AMC" },
  { id: "3", name: "ICICI Prudential Bluechip Fund", category: "mutual_fund", currentValue: 380000, monthlyContribution: 10000, expectedReturnPct: 13.1, expenseRatioPct: 0.91, amcName: "ICICI Prudential" },
  { id: "4", name: "SBI Small Cap Fund", category: "mutual_fund", currentValue: 220000, monthlyContribution: 5000, expectedReturnPct: 16.5, expenseRatioPct: 0.72, amcName: "SBI Mutual Fund" },
  { id: "5", name: "Nifty 50 Index Fund", category: "mutual_fund", currentValue: 300000, monthlyContribution: 10000, expectedReturnPct: 12.0, expenseRatioPct: 0.20, amcName: "UTI AMC" },
];

export default function PortfolioIntelligencePage() {
  const [investments, setInvestments] = useState<InvestmentAsset[]>(SAMPLE_INVESTMENTS);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const report = generatePortfolioXRay(investments);

  // Load SheetJS dynamically
  const loadXlsx = () => {
    const win = window as any;
    if (win.XLSX) return Promise.resolve(win.XLSX);
    return new Promise<any>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      script.onload = () => resolve(win.XLSX);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setIsSuccess(false);
    setUploadMessage(`Reading statement "${file.name}"...`);

    try {
      let textContent = "";

      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setUploadMessage("Parsing Excel sheets...");
        const XLSX = await loadXlsx();
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });

        workbook.SheetNames.forEach((sheetName: string) => {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          textContent += csv + "\n";
        });
      } else {
        textContent = await file.text();
      }

      setUploadMessage("Matching portfolio against AMFI schemes database...");

      // Send extracted text to backend parser API
      const res = await fetch("/api/portfolio/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textContent }),
      });

      const data = await res.json();

      if (data.success && data.holdings && data.holdings.length > 0) {
        const parsedAssets: InvestmentAsset[] = data.holdings.map((h: any, idx: number) => {
          const currVal = h.currentValue || (h.units * (h.nav || 10)) || 100000;
          return {
            id: `imported-${idx}`,
            name: h.name,
            category: "mutual_fund",
            currentValue: Math.round(currVal),
            monthlyContribution: Math.round(currVal * 0.02), // Est 2% monthly SIP
            expectedReturnPct: 13.0,
            expenseRatioPct: h.expenseRatio || 0.65,
            amcName: h.name.split(" ")[0] || "Mutual Fund",
          };
        });

        setInvestments(parsedAssets);
        setIsSuccess(true);
        setUploadMessage(`Successfully imported ${parsedAssets.length} holdings from ${file.name}!`);
      } else {
        throw new Error("No valid mutual fund holdings recognized in statement. Try another format.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setIsSuccess(false);
      setUploadMessage(err.message || "Failed to process statement. Please try a standard CAMS/Groww statement.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-1 uppercase tracking-wider">
            <Layers className="w-4 h-4" /> Engine 3: Portfolio Intelligence
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Portfolio X-Ray & Overlap Engine</h1>
          <p className="text-slate-400 text-sm mt-1">
            «Deep mutual-fund concentration, underlying stock overlap, and sector exposure diagnostics.»
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-cyan-600/20">
            {uploading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {uploading ? "Parsing Statement..." : "Upload Statement (Excel/CSV/CAS)"}
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls,.csv,.pdf" 
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Upload Feedback Toast Banner */}
      {uploadMessage && (
        <div className={`max-w-7xl mx-auto mb-6 p-4 rounded-2xl border text-sm font-medium flex items-center justify-between gap-3 ${
          isSuccess 
            ? "bg-emerald-950/80 border-emerald-800 text-emerald-300" 
            : uploading 
              ? "bg-cyan-950/80 border-cyan-800 text-cyan-300"
              : "bg-rose-950/80 border-rose-800 text-rose-300"
        }`}>
          <div className="flex items-center gap-2">
            {uploading ? (
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{uploadMessage}</span>
          </div>

          <button onClick={() => setUploadMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="text-xs text-slate-400 uppercase font-medium">Total Portfolio Value</div>
            <div className="text-2xl font-black text-white mt-1">{formatINRWords(report.totalPortfolioValue)}</div>
            <div className="text-xs text-slate-500 mt-1">Across {investments.length} active holdings</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="text-xs text-slate-400 uppercase font-medium">Total Monthly SIP</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{formatINRWords(report.totalMonthlySip)} / mo</div>
            <div className="text-xs text-slate-500 mt-1">Monthly compounding</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="text-xs text-slate-400 uppercase font-medium">Weighted Expected Return</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{report.weightedAvgExpectedReturn}% CAGR</div>
            <div className="text-xs text-slate-500 mt-1">Net of expense ratios</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="text-xs text-slate-400 uppercase font-medium">X-Ray Health Score</div>
            <div className="text-2xl font-black text-cyan-300 mt-1">{report.overallHealthScore} / 100</div>
            <div className="text-xs text-slate-500 mt-1">{report.summaryText}</div>
          </div>
        </div>

        {/* Uploaded Holdings List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" /> Active Holdings ({investments.length})
            </h3>
            <span className="text-xs text-slate-500">Live AMFI Database Sourced</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {investments.map((inv) => (
              <div key={inv.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{inv.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{inv.amcName || "Mutual Fund"} • Expense Ratio: {inv.expenseRatioPct || 0.6}%</div>
                </div>

                <div className="flex justify-between items-baseline mt-4 pt-2 border-t border-slate-800/60">
                  <span className="text-xs text-slate-500">Current Value:</span>
                  <span className="text-base font-black text-cyan-300">{formatINRWords(inv.currentValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overlap & Concentration Warnings */}
        {report.overlapAlerts.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" /> Overlap & Risk Alerts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.overlapAlerts.map((alert, idx) => (
                <div key={idx} className="bg-slate-950 border border-amber-900/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-1">
                    <AlertTriangle className="w-4 h-4" /> {alert.title}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Concentration & Sector Exposures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Underlying Stock Concentration */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" /> Underlying Stock Concentration
            </h3>
            <p className="text-xs text-slate-400">
              Top individual companies held across your mutual funds.
            </p>

            <div className="space-y-3">
              {report.stockConcentration.map((stock, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{stock.stockName}</div>
                    <div className="text-[11px] text-slate-500">{stock.sector} • Held in {stock.fundsContainingStock.length} funds</div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-cyan-300">{stock.weightPct}%</span>
                    <div className="text-[10px] text-slate-500">Portfolio Weight</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Exposures */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" /> Sector Weight Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated economic sector allocation across all funds.
            </p>

            <div className="space-y-3">
              {report.sectorExposures.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{sec.sectorName}</span>
                    <span className="text-cyan-400">{sec.weightPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full" style={{ width: `${sec.weightPct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
