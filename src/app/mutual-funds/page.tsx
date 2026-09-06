"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Layers, Search, Info, ShieldAlert, RefreshCw, HelpCircle, GitCompare, BookOpen, Filter, ArrowUpDown, ChevronRight, TrendingUp, ExternalLink, Lock, ShieldCheck, Coins, BarChart2, Zap, GraduationCap, Download, X, Sparkles } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { getCurrentUserSession } from "@/lib/supabase/auth";

interface SearchResult {
  schemeCode: number;
  schemeName: string;
}

interface NavPoint {
  date: string; // DD-MM-YYYY
  nav: number;
}

interface ParsedMetrics {
  name: string;
  category: string;
  house: string;
  code: number;
  currentNav: number;
  cagr1Y: number | null;
  cagr3Y: number | null;
  cagr5Y: number | null;
  volatility: number;
  sharpe: number;
  sortino: number;
  chartData: NavPoint[];
  rawNavs: NavPoint[];
}

const AMC_FACTSHEETS = [
  { name: "SBI Mutual Fund", code: "SBI", logo: "🏛️", website: "https://www.sbimf.com", pdfUrl: "https://www.sbimf.com/factsheets" },
  { name: "HDFC Mutual Fund", code: "HDFC", logo: "🏦", website: "https://www.hdfcfund.com", pdfUrl: "https://www.hdfcfund.com/mutual-funds/factsheets" },
  { name: "ICICI Prudential MF", code: "ICICI", logo: "🏢", website: "https://www.icicipruamc.com", pdfUrl: "https://digitalfactsheet.icicipruamc.com/fact/icici-prudential-flexicap-fund.php" },
  { name: "Nippon India MF", code: "NIPPON", logo: "🇯🇵", website: "https://mf.nipponindiaim.com", pdfUrl: "https://mf.nipponindiaim.com/investor-service/downloads/factsheet-portfolio-and-other-disclosures" },
  { name: "Kotak Mahindra MF", code: "KOTAK", logo: "💳", website: "https://www.kotakmf.com", pdfUrl: "https://www.kotak.bank.in//MF_Factsheet/equity.html" },
  { name: "Parag Parikh (PPFAS)", code: "PPFAS", logo: "🐢", website: "https://amc.ppfas.com", pdfUrl: "https://amc.ppfas.com/downloads/factsheet/" },
  { name: "Quant Mutual Fund", code: "QUANT", logo: "⚡", website: "https://quantmutual.com", pdfUrl: "https://www.quantmutual.com/downloads/factsheet" },
  { name: "Axis Mutual Fund", code: "AXIS", logo: "📈", website: "https://www.axismf.com", pdfUrl: "https://transact.axismf.com/downloads" },
  { name: "Mirae Asset MF", code: "MIRAE", logo: "🌐", website: "https://www.miraeassetmf.co.in", pdfUrl: "https://www.miraeassetmf.co.in/downloads/factsheet" },
  { name: "Motilal Oswal MF", code: "MO", logo: "🎯", website: "https://www.motilaloswalmf.com", pdfUrl: "https://www.motilaloswalmf.com/downloads/factsheets" },
  { name: "UTI Mutual Fund", code: "UTI", logo: "🏛️", website: "https://www.utimf.com", pdfUrl: "https://www.utimf.com/downloads/fact-sheet" },
  { name: "DSP Mutual Fund", code: "DSP", logo: "🌲", website: "https://www.dspim.com", pdfUrl: "https://www.dspim.com/downloads?category=Information%20Documents&sub_category=Factsheets" },
  { name: "Tata Mutual Fund", code: "TATA", logo: "⚙️", website: "https://www.tatamutualfund.com", pdfUrl: "https://www.tatamutualfund.com/information-documents/factsheets" },
  { name: "Bandhan Mutual Fund", code: "BANDHAN", logo: "💎", website: "https://bandhanmutual.com", pdfUrl: "https://bandhanmutual.com/downloads/factsheet/all-schemes" },
  { name: "Canara Robeco MF", code: "CANARA", logo: "🛡️", website: "https://www.canararobeco.com", pdfUrl: "https://www.canararobeco.com/documents/forms-downloads/forms-information-documents/information-documents/factsheets/" },
  { name: "Edelweiss MF", code: "EDELWEISS", logo: "🚀", website: "https://www.edelweissmf.com", pdfUrl: "https://www.edelweissmf.com/downloads/factsheets" },
  { name: "Sundaram MF", code: "SUNDARAM", logo: "☀️", website: "https://www.sundarammutual.com", pdfUrl: "https://www.sundarammutual.com/fundwise-factsheet" },
  { name: "Invesco Mutual Fund", code: "INVESCO", logo: "🦅", website: "https://www.invescomutualfund.com", pdfUrl: "https://www.invescomutualfund.com/literature-forms/factsheets" },
  { name: "HSBC Mutual Fund", code: "HSBC", logo: "🌍", website: "https://www.assetmanagement.hsbc.co.in", pdfUrl: "https://www.assetmanagement.hsbc.co.in/en/mutual-funds/investor-resources?Date=&Cap=&Doc=fund-factsheets#&module-21=1" },
  { name: "Franklin Templeton", code: "FRANKLIN", logo: "📜", website: "https://www.franklintempletonindia.com", pdfUrl: "https://www.franklintempletonindia.com/downloads/fund-documents?category=Factsheets" },
  { name: "Aditya Birla Sun Life", code: "ABSL", logo: "🌞", website: "https://www.adityabirlacapital.com", pdfUrl: "https://mutualfund.adityabirlacapital.com/forms-and-downloads/factsheets" },
  { name: "PGIM India MF", code: "PGIM", logo: "🔷", website: "https://www.pgimindia.com", pdfUrl: "https://www.pgimindia.com/mutual-funds/forms-and-product-updates/Fund-Factsheet" },
  { name: "Union Mutual Fund", code: "UNION", logo: "🤝", website: "https://www.unionmf.com", pdfUrl: "https://www.unionmf.com/about-us/downloads/factsheets" },
  { name: "Baroda BNP Paribas MF", code: "BARODA", logo: "🏛️", website: "https://www.barodabnpparibasmf.in", pdfUrl: "https://www.barodabnpparibasmf.in/downloads/monthly-factsheet" },
  { name: "Mahindra Manulife MF", code: "MAHINDRA", logo: "🚜", website: "https://www.mahindramanulife.com", pdfUrl: "https://www.mahindramanulife.com/downloads#factsheets" },
  { name: "JM Financial MF", code: "JM", logo: "📊", website: "https://www.jmfl.com", pdfUrl: "https://www.jmfinancialmf.com/downloads/Factsheet" },
  { name: "LIC Mutual Fund", code: "LIC", logo: "🛡️", website: "https://www.licmf.com", pdfUrl: "https://www.licmf.com/downloads/factsheet" },
  { name: "Navi Mutual Fund", code: "NAVI", logo: "📱", website: "https://www.navimutualfund.com", pdfUrl: "https://navi.com/mutual-fund/downloads/factsheet" },
  { name: "Groww Mutual Fund", code: "GROWW", logo: "🌱", website: "https://www.growwmf.in", pdfUrl: "https://www.growwmf.in/downloads/fact-sheet" },
  { name: "Zerodha Fund House", code: "ZERODHA", logo: "📐", website: "https://www.zerodhafundhouse.com", pdfUrl: "https://www.zerodhafundhouse.com/resources/fund-documents" },
  { name: "WhiteOak Capital MF", code: "WHITEOAK", logo: "🌳", website: "https://mf.whiteoakcapital.com", pdfUrl: "https://mf.whiteoakamc.com/regulatory-disclosures/scheme-summary-document" },
  { name: "Samco Mutual Fund", code: "SAMCO", logo: "🎯", website: "https://www.samco.in", pdfUrl: "https://www.samcomf.com/downloads#factsheets" },
  { name: "NJ Mutual Fund", code: "NJ", logo: "💼", website: "https://www.njgroup.in", pdfUrl: "https://downloads.njmutualfund.com/downloads.php" },
  { name: "360 ONE MF (IIFL)", code: "360ONE", logo: "⭕", website: "https://www.360.one", pdfUrl: "https://www.360.one/asset/mutual-funds/downloads/" },
  { name: "ITI Mutual Fund", code: "ITI", logo: "🏭", website: "https://www.itiamc.com", pdfUrl: "https://www.itiamc.com/downloads#factsheets" },
  { name: "Trust Mutual Fund", code: "TRUST", logo: "🤝", website: "https://www.trustgroup.in", pdfUrl: "https://www.trustmf.com/downloads?activeTab=factsheets" },
  { name: "Taurus Mutual Fund", code: "TAURUS", logo: "🐂", website: "https://www.taurusmutualfund.com", pdfUrl: "https://www.taurusmutualfund.com/factsheet" },
  { name: "Quantum Mutual Fund", code: "QUANTUM", logo: "⚛️", website: "https://www.quantumamc.com", pdfUrl: "https://www.quantumamc.com/factsheets/combined/-1/0/0" },
  { name: "Shriram Mutual Fund", code: "SHRIRAM", logo: "🏛️", website: "https://www.shrirammf.in", pdfUrl: "https://www.shriramamc.in/factsheet" },
  { name: "Helios Mutual Fund", code: "HELIOS", logo: "☀️", website: "https://www.helioscapital.in", pdfUrl: "https://www.heliosmf.in/downloads#factsheets" },
  { name: "Old Bridge MF", code: "OLDBRIDGE", logo: "🌉", website: "https://www.oldbridgemf.com", pdfUrl: "https://www.oldbridgemf.com/factsheet.html" },
  { name: "Bajaj Finserv MF", code: "BAJAJ", logo: "⚡", website: "https://www.bajajfinservamc.in", pdfUrl: "https://www.bajajamc.com/downloads?factsheet" },
  { name: "BOI Mutual Fund", code: "BOI", logo: "🏦", website: "https://www.boimf.in", pdfUrl: "https://www.boimf.in/investor-corner#factsheets" },
  { name: "The Wealth Company MF", code: "WEALTHCOMPANY", logo: "💎", website: "https://www.wealthcompanyamc.in", pdfUrl: "https://www.wealthcompanyamc.in/literature-forms/scheme-documents/factsheets/" },
  { name: "Unifi Mutual Fund", code: "UNIFI", logo: "🏛️", website: "https://www.unifimf.com", pdfUrl: "https://unifimf.com/factsheet" },
  { name: "Capitalmind MF", code: "CAPITALMIND", logo: "🧠", website: "https://capitalmindmf.com", pdfUrl: "https://capitalmindmf.com/factsheet.html#" },
  { name: "Jio BlackRock MF", code: "JIOBLACKROCK", logo: "🌐", website: "https://www.jioblackrock.com", pdfUrl: "https://www.jioblackrockamc.com/statutory-disclosure/fund-documents/factsheet" },
  { name: "Angel One MF", code: "ANGELONE", logo: "👼", website: "https://www.angelonemf.com", pdfUrl: "https://www.angelonemf.com/downloads#factsheets" }
];

const AMC_BRAND_EMBLEMS: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  SBI: { bg: "bg-[#00529B]", text: "text-white", label: "SBI MF", icon: "🏛️" },
  HDFC: { bg: "bg-[#004B8D]", text: "text-white", label: "HDFC MF", icon: "🏦" },
  ICICI: { bg: "bg-[#F37021]", text: "text-white", label: "ICICI PRU", icon: "🏢" },
  NIPPON: { bg: "bg-[#E31E24]", text: "text-white", label: "NIPPON", icon: "🇯🇵" },
  KOTAK: { bg: "bg-[#ED1C24]", text: "text-white", label: "KOTAK MF", icon: "💳" },
  PPFAS: { bg: "bg-[#059669]", text: "text-white", label: "PPFAS", icon: "🐢" },
  QUANT: { bg: "bg-[#0f172a]", text: "text-[#00FFCC]", label: "QUANT", icon: "⚡" },
  AXIS: { bg: "bg-[#971756]", text: "text-white", label: "AXIS MF", icon: "📈" },
  MIRAE: { bg: "bg-[#F37023]", text: "text-white", label: "MIRAE", icon: "🌐" },
  MO: { bg: "bg-[#4B2E83]", text: "text-white", label: "MOTILAL", icon: "🎯" },
  UTI: { bg: "bg-[#002B66]", text: "text-[#FF8C00]", label: "UTI MF", icon: "🏛️" },
  DSP: { bg: "bg-[#00875A]", text: "text-white", label: "DSP MF", icon: "🌲" },
  TATA: { bg: "bg-[#0054A6]", text: "text-white", label: "TATA MF", icon: "⚙️" },
  BANDHAN: { bg: "bg-[#DB2777]", text: "text-white", label: "BANDHAN", icon: "💎" },
  CANARA: { bg: "bg-[#0072CE]", text: "text-white", label: "CANARA", icon: "🛡️" },
  EDELWEISS: { bg: "bg-[#1E3A8A]", text: "text-white", label: "EDELWEISS", icon: "🚀" },
  SUNDARAM: { bg: "bg-[#EAB308]", text: "text-slate-950", label: "SUNDARAM", icon: "☀️" },
  INVESCO: { bg: "bg-[#0B192C]", text: "text-white", label: "INVESCO", icon: "🦅" },
  HSBC: { bg: "bg-[#DB0011]", text: "text-white", label: "HSBC MF", icon: "🌍" },
  FRANKLIN: { bg: "bg-[#1E40AF]", text: "text-white", label: "FRANKLIN", icon: "📜" },
  ABSL: { bg: "bg-[#C2410C]", text: "text-white", label: "ABSL MF", icon: "🌞" },
  PGIM: { bg: "bg-[#1E3A8A]", text: "text-white", label: "PGIM", icon: "🔷" },
  UNION: { bg: "bg-[#2563EB]", text: "text-white", label: "UNION MF", icon: "🤝" },
  BARODA: { bg: "bg-[#047857]", text: "text-white", label: "BARODA BNP", icon: "🏛️" },
  MAHINDRA: { bg: "bg-[#DC2626]", text: "text-white", label: "MAHINDRA", icon: "🚜" },
  JM: { bg: "bg-[#334155]", text: "text-white", label: "JM MF", icon: "📊" },
  LIC: { bg: "bg-[#D97706]", text: "text-white", label: "LIC MF", icon: "🛡️" },
  NAVI: { bg: "bg-[#10B981]", text: "text-white", label: "NAVI MF", icon: "📱" },
  GROWW: { bg: "bg-[#00D09C]", text: "text-slate-950", label: "GROWW", icon: "🌱" },
  ZERODHA: { bg: "bg-[#387ED1]", text: "text-white", label: "ZERODHA", icon: "📐" },
  WHITEOAK: { bg: "bg-[#064E3B]", text: "text-white", label: "WHITEOAK", icon: "🌳" },
  SAMCO: { bg: "bg-[#B91C1C]", text: "text-white", label: "SAMCO", icon: "🎯" },
  NJ: { bg: "bg-[#1D4ED8]", text: "text-white", label: "NJ MF", icon: "💼" },
  "360ONE": { bg: "bg-[#0f172a]", text: "text-[#F59E0B]", label: "360 ONE", icon: "⭕" },
  ITI: { bg: "bg-[#6B21A8]", text: "text-white", label: "ITI MF", icon: "🏭" },
  TRUST: { bg: "bg-[#3730A3]", text: "text-white", label: "TRUST MF", icon: "🤝" },
  TAURUS: { bg: "bg-[#9F1239]", text: "text-white", label: "TAURUS", icon: "🐂" },
  QUANTUM: { bg: "bg-[#C2410C]", text: "text-white", label: "QUANTUM", icon: "⚛️" },
  SHRIRAM: { bg: "bg-[#1D4ED8]", text: "text-white", label: "SHRIRAM", icon: "🏛️" },
  HELIOS: { bg: "bg-[#F97316]", text: "text-white", label: "HELIOS", icon: "☀️" },
  OLDBRIDGE: { bg: "bg-[#1E293B]", text: "text-[#F59E0B]", label: "OLD BRIDGE", icon: "🌉" },
  BAJAJ: { bg: "bg-[#0284C7]", text: "text-white", label: "BAJAJ", icon: "⚡" },
  BOI: { bg: "bg-[#1D4ED8]", text: "text-white", label: "BOI MF", icon: "🏦" },
  WEALTHCOMPANY: { bg: "bg-[#0A2540]", text: "text-[#00D4B2]", label: "WEALTH CO", icon: "💎" },
  UNIFI: { bg: "bg-[#7C2D12]", text: "text-white", label: "UNIFI", icon: "🏛️" },
  CAPITALMIND: { bg: "bg-[#1E1B4B]", text: "text-[#A78BFA]", label: "CAPMIND", icon: "🧠" },
  JIOBLACKROCK: { bg: "bg-[#000000]", text: "text-[#0085FF]", label: "JIO B-ROCK", icon: "🌐" },
  ANGELONE: { bg: "bg-[#1E3A8A]", text: "text-[#F97316]", label: "ANGEL ONE", icon: "👼" },
  SHINE: { bg: "bg-[#059669]", text: "text-white", label: "SHINE", icon: "✨" },
};

const AMCLogo = ({ name, code }: { website: string; name: string; code?: string }) => {
  const emblem = (code && AMC_BRAND_EMBLEMS[code]) || {
    bg: "bg-gradient-to-br from-emerald/30 via-navy-card to-emerald/10",
    text: "text-emerald",
    label: (code || name.slice(0, 4)).toUpperCase(),
    icon: "🏦",
  };

  return (
    <div
      className={`w-11 h-11 rounded-2xl ${emblem.bg} ${emblem.text} flex flex-col items-center justify-center shadow-lg shrink-0 p-1 border border-white/20 relative overflow-hidden group hover:scale-105 transition-all`}
      title={name}
    >
      <span className="text-xs leading-none mb-0.5">{emblem.icon}</span>
      <span className="font-black text-[8px] tracking-tighter uppercase leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-0.5">
        {emblem.label}
      </span>
    </div>
  );
};

const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case "Large Cap":
      return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    case "Index":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "Mid Cap":
      return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    case "Small Cap":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "Flexi / Multi Cap":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "ELSS":
      return "bg-pink-500/10 text-pink-400 border-pink-500/30";
    case "Hybrid":
      return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    case "Debt & Liquid":
      return "bg-teal-500/10 text-teal-400 border-teal-500/30";
    default:
      return "bg-navy-light text-muted-grey border-border-navy";
  }
};

export default function MutualFundAnalyzer() {
  const [viewMode, setViewMode] = useState<"screener" | "analyzer" | "factsheets">("screener");
  const [session, setSession] = useState<any>(null);
  const [amcSearch, setAmcSearch] = useState("");
  const [screenerFunds, setScreenerFunds] = useState<any[]>([]);
  const [loadingScreener, setLoadingScreener] = useState(false);
  const [screenerFilterCategory, setScreenerFilterCategory] = useState("All");
  const [screenerSearch, setScreenerSearch] = useState("");
  const [screenerSort, setScreenerSort] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "cagr3Y",
    direction: "desc"
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingMain, setLoadingMain] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Selected Fund Keys (AMFI Scheme Codes)
  const [mainCode, setMainCode] = useState<number>(122639); // Default: Parag Parikh Flexi Cap Fund Direct Growth
  const [compareCode, setCompareCode] = useState<number | null>(null);

  // Loaded Fund details
  const [mainFund, setMainFund] = useState<ParsedMetrics | null>(null);
  const [compareFund, setCompareFund] = useState<ParsedMetrics | null>(null);
  const [timeHorizon, setTimeHorizon] = useState<"1Y" | "3Y" | "5Y">("3Y");

  // Inflation States
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(7.0);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 7.0 });

  const getRealCagr = (nominalCagr: number | null | undefined) => {
    if (nominalCagr === null || nominalCagr === undefined) return null;
    return ((1 + nominalCagr / 100) / (1 + inflation / 100) - 1) * 100;
  };

  // Fetch screener data on mount
  useEffect(() => {
    setLoadingScreener(true);
    fetch("/api/mutual-funds/screener")
      .then((res) => res.json())
      .then((data) => {
        if (data.funds) {
          setScreenerFunds(data.funds);
        }
      })
      .catch((err) => console.error("Error loading screener data", err))
      .finally(() => setLoadingScreener(false));
  }, []);

  useEffect(() => {
    setMounted(true);
    getCurrentUserSession().then((s) => setSession(s)).catch(() => { });
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  // Search Debounce Trigger
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      searchMutualFunds(searchQuery);
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Load Initial Default Fund
  useEffect(() => {
    loadFundData(mainCode, "main");
  }, [mainCode]);

  // Load Compare Fund if set
  useEffect(() => {
    if (compareCode) {
      loadFundData(compareCode, "compare");
    } else {
      setCompareFund(null);
    }
  }, [compareCode]);

  const searchMutualFunds = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/mutual-funds?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Error searching funds", err);
    } finally {
      setIsSearching(false);
    }
  };

  const parseDateString = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const loadFundData = async (code: number, target: "main" | "compare", retryCount = 0) => {
    if (target === "main") { setLoadingMain(true); setErrorMsg(null); }
    else setLoadingCompare(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(`/api/mutual-funds?code=${code}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const parsed: ParsedMetrics = {
        name: data.meta.scheme_name,
        category: data.meta.scheme_category,
        house: data.meta.fund_house,
        code: data.meta.scheme_code,
        currentNav: data.currentNav,
        cagr1Y: data.cagr1Y,
        cagr3Y: data.cagr3Y,
        cagr5Y: data.cagr5Y,
        volatility: data.volatility,
        sharpe: data.sharpe,
        sortino: data.sortino,
        chartData: data.downSampledChartData,
        rawNavs: data.downSampledChartData
      };

      if (target === "main") setMainFund(parsed);
      else setCompareFund(parsed);

    } catch (err: any) {
      console.warn("Error loading fund data:", err.message || err);
      // Auto-retry once on network/timeout failures
      if (retryCount < 1) {
        console.log("Retrying fund load...");
        return loadFundData(code, target, retryCount + 1);
      }
      if (target === "main") {
        setErrorMsg(`Failed to load fund data for scheme ${code}. The AMFI API may be temporarily unavailable.`);
      }
    } finally {
      if (target === "main") setLoadingMain(false);
      else setLoadingCompare(false);
    }
  };

  const sortedAndFilteredScreenerFunds = useMemo(() => {
    return screenerFunds
      .filter((fund) => {
        // Text Search Filter
        const query = screenerSearch.trim().toLowerCase();
        const matchesSearch = !query ||
          (fund.name && fund.name.toLowerCase().includes(query)) ||
          (fund.category && fund.category.toLowerCase().includes(query)) ||
          (fund.schemeCategory && fund.schemeCategory.toLowerCase().includes(query)) ||
          (fund.code && fund.code.toString().includes(query));
        if (!matchesSearch) return false;

        // Category Filter
        if (screenerFilterCategory === "All") return true;
        if (screenerFilterCategory === "Large Cap") {
          return fund.category === "Large Cap" || fund.category === "Index" || (fund.schemeCategory && fund.schemeCategory.toLowerCase().includes("large cap"));
        }
        if (screenerFilterCategory === "Mid Cap") {
          return fund.category === "Mid Cap" || (fund.schemeCategory && fund.schemeCategory.toLowerCase().includes("mid cap"));
        }
        if (screenerFilterCategory === "Small Cap") {
          return fund.category === "Small Cap" || (fund.schemeCategory && fund.schemeCategory.toLowerCase().includes("small cap"));
        }
        if (screenerFilterCategory === "Flexi / Multi Cap") {
          return fund.category === "Flexi / Multi Cap" || (fund.schemeCategory && (fund.schemeCategory.toLowerCase().includes("flexi") || fund.schemeCategory.toLowerCase().includes("multi")));
        }
        if (screenerFilterCategory === "ELSS") {
          return fund.category === "ELSS" || (fund.schemeCategory && fund.schemeCategory.toLowerCase().includes("elss"));
        }
        if (screenerFilterCategory === "Hybrid") {
          return fund.category === "Hybrid" || (fund.schemeCategory && fund.schemeCategory.toLowerCase().includes("hybrid"));
        }
        if (screenerFilterCategory === "Debt & Liquid") {
          return fund.category === "Debt & Liquid" || (fund.schemeCategory && (fund.schemeCategory.toLowerCase().includes("debt") || fund.schemeCategory.toLowerCase().includes("liquid") || fund.schemeCategory.toLowerCase().includes("gilt") || fund.schemeCategory.toLowerCase().includes("bond")));
        }
        return true;
      })
      .sort((a, b) => {
        const key = screenerSort.key;
        const valA = a[key];
        const valB = b[key];

        // Handle nulls
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === "string") {
          return screenerSort.direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return screenerSort.direction === "asc"
            ? valA - valB
            : valB - valA;
        }
      });
  }, [screenerFunds, screenerSearch, screenerFilterCategory, screenerSort]);

  // Compute category counts for tab badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: screenerFunds.length,
      "Large Cap": 0,
      "Mid Cap": 0,
      "Small Cap": 0,
      "Flexi / Multi Cap": 0,
      ELSS: 0,
      Hybrid: 0,
      "Debt & Liquid": 0
    };
    screenerFunds.forEach((f) => {
      if (f.category === "Large Cap" || f.category === "Index") counts["Large Cap"]++;
      if (f.category === "Mid Cap") counts["Mid Cap"]++;
      if (f.category === "Small Cap") counts["Small Cap"]++;
      if (f.category === "Flexi / Multi Cap") counts["Flexi / Multi Cap"]++;
      if (f.category === "ELSS") counts["ELSS"]++;
      if (f.category === "Hybrid") counts["Hybrid"]++;
      if (f.category === "Debt & Liquid") counts["Debt & Liquid"]++;
    });
    return counts;
  }, [screenerFunds]);

  // Compute rebased comparison chart data based on time horizon
  const rebasedChartData = useMemo(() => {
    if (!mainFund) return [];

    const getDaysLimit = () => {
      if (timeHorizon === "1Y") return 365;
      if (timeHorizon === "3Y") return 1095;
      return 1825; // 5Y
    };

    const daysLimit = getDaysLimit();
    const latestDate = parseDateString(mainFund.rawNavs[mainFund.rawNavs.length - 1].date);
    const targetCutoffTime = latestDate.getTime() - daysLimit * 24 * 60 * 60 * 1000;

    const filteredMain = mainFund.rawNavs.filter(
      (p) => parseDateString(p.date).getTime() >= targetCutoffTime
    );

    if (filteredMain.length === 0) return [];

    const mainStartNav = filteredMain[0].nav;

    const compareDataMap = new Map<string, number>();
    if (compareFund) {
      const filteredCompare = compareFund.rawNavs.filter(
        (p) => parseDateString(p.date).getTime() >= targetCutoffTime
      );
      if (filteredCompare.length > 0) {
        const compareStartNav = filteredCompare[0].nav;
        filteredCompare.forEach((p) => {
          compareDataMap.set(p.date, (p.nav / compareStartNav) * 100);
        });
      }
    }

    return filteredMain.map((p) => {
      const dateObj = parseDateString(p.date);
      const formattedDate = dateObj.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit"
      });

      const mainVal = compareFund
        ? Math.round((p.nav / mainStartNav) * 100 * 100) / 100
        : p.nav;

      return {
        dateLabel: formattedDate,
        [mainFund.name]: mainVal,
        ...(compareFund && compareDataMap.has(p.date)
          ? { [compareFund.name]: Math.round((compareDataMap.get(p.date) || 0) * 100) / 100 }
          : {})
      };
    });
  }, [mainFund, compareFund, timeHorizon]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(val);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10 py-4 sm:py-6 animate-fadeIn min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-5 sm:pb-6 gap-4 min-w-0 w-full">
        <div className="space-y-1.5 min-w-0 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Layers className="text-emerald shrink-0" />
              <span>Mutual Funds Screener & Analyzer</span>
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              👑 ValarchiX Flagship Model
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-grey">
            Search real-world mutual funds, compare risk ratios, filter categories, and analyze compounding.
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 flex-wrap text-[10px]">
            <span className="text-emerald bg-emerald/5 border border-emerald/20 px-2 py-0.5 rounded font-semibold">
              Data Source: AMFI Daily NAV Cache
            </span>
            <span className="text-muted-grey bg-navy-card/40 border border-border-navy px-2 py-0.5 rounded">
              NAV Updated Daily Post 9:00 PM IST
            </span>
            <span className="text-muted-grey bg-navy-card/40 border border-border-navy px-2 py-0.5 rounded">
              Benchmarks Approximated via Index Trackers
            </span>
          </div>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg shrink-0 self-start md:self-auto">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      {/* Tabs & Inflation Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-navy/60 pb-px gap-3 min-w-0 w-full">
        <div className="flex overflow-x-auto no-scrollbar scrollbar-none whitespace-nowrap min-w-0 w-full pb-1 md:pb-0">
          <button
            onClick={() => setViewMode("screener")}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 border-b-2 text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${viewMode === "screener"
              ? "border-emerald text-emerald bg-emerald/5"
              : "border-transparent text-muted-grey hover:text-white"
              }`}
          >
            <Filter size={15} />
            <span>Mutual Fund Screener</span>
          </button>
          <button
            onClick={() => setViewMode("analyzer")}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 border-b-2 text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${viewMode === "analyzer"
              ? "border-emerald text-emerald bg-emerald/5"
              : "border-transparent text-muted-grey hover:text-white"
              }`}
          >
            <Layers size={15} />
            <span>Detail Fund Analyzer & Compare</span>
          </button>
          <button
            onClick={() => setViewMode("factsheets")}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 border-b-2 text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${viewMode === "factsheets"
              ? "border-emerald text-emerald bg-emerald/5"
              : "border-transparent text-muted-grey hover:text-white"
              }`}
          >
            <BookOpen size={15} />
            <span>AMC Factsheets & Selection Rules</span>
          </button>
        </div>

        {/* Inflation Adjustment Switcher */}
        <div className="flex items-center gap-4 px-4 py-2 bg-navy-card/25 border border-border-navy rounded-xl text-xs font-semibold self-end md:self-auto mb-2 md:mb-0">
          <div className="flex items-center gap-1.5">
            <input
              id="mf-adjust-inflation"
              type="checkbox"
              checked={adjustInflation}
              onChange={(e) => setAdjustInflation(e.target.checked)}
              className="w-4 h-4 accent-emerald cursor-pointer rounded"
            />
            <label htmlFor="mf-adjust-inflation" className="text-muted-grey cursor-pointer flex items-center gap-1">
              Adjust CAGRs for Inflation ({inflation}%)
              <span className="text-muted-grey/60 cursor-help inline-flex" title="Subtracts CPI inflation from CAGRs to show real compound growth rates."><HelpCircle size={12} /></span>
            </label>
          </div>
          {adjustInflation && (
            <div className="flex items-center gap-1.5 border-l border-border-navy pl-3">
              <input
                type="range"
                min={2}
                max={12}
                step={0.1}
                value={inflation}
                onChange={(e) => setInflation(Number(e.target.value))}
                className="w-24 accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer animate-fadeIn"
              />
              <button
                type="button"
                onClick={() => setInflation(rates.inflationRate)}
                className="text-[9px] text-emerald/80 hover:text-emerald hover:underline cursor-pointer"
                title="Reset to India CPI Baseline"
              >
                Reset ({rates.inflationRate}%)
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === "screener" ? (
        <div className="space-y-6 animate-fadeIn min-w-0 w-full">
          {/* Controls Bar: Category Filter & Text Search */}
          <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-navy-card/40 p-4 sm:p-5 rounded-2xl border border-border-navy/80 shadow-lg min-w-0 w-full">
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold min-w-0">
              {[
                { key: "All", label: "All" },
                { key: "Large Cap", label: "Large Cap & Index" },
                { key: "Mid Cap", label: "Mid Cap" },
                { key: "Small Cap", label: "Small Cap" },
                { key: "Flexi / Multi Cap", label: "Flexi / Multi Cap" },
                { key: "ELSS", label: "ELSS (Tax Saver)" },
                { key: "Hybrid", label: "Hybrid" },
                { key: "Debt & Liquid", label: "Debt & Liquid" },
              ].map((tab) => {
                const count = categoryCounts[tab.key === "Large Cap & Index" ? "Large Cap" : tab.key] ?? 0;
                const isActive = screenerFilterCategory === (tab.key === "Large Cap & Index" ? "Large Cap" : tab.key);
                const filterKey = tab.key === "Large Cap & Index" ? "Large Cap" : tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setScreenerFilterCategory(filterKey)}
                    className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold ${isActive
                      ? "bg-emerald text-navy-bg shadow-md font-bold scale-[1.02]"
                      : "bg-navy-bg/80 border border-border-navy text-muted-grey hover:text-white hover:border-emerald/40"
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isActive ? "bg-navy-bg/25 text-navy-bg" : "bg-navy-card text-muted-grey/80"}`}>
                      {categoryCounts[filterKey] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Text Search Box */}
            <div className="w-full xl:w-84 flex items-center gap-2.5 glass-input focus-within:border-emerald py-2 px-3 shrink-0">
              <Search className="text-muted-grey shrink-0" size={16} />
              <input
                type="text"
                value={screenerSearch}
                onChange={(e) => setScreenerSearch(e.target.value)}
                placeholder="Search fund name, code, category..."
                className="w-full bg-transparent outline-none text-white text-xs placeholder:text-muted-grey/60"
              />
              {screenerSearch && (
                <button
                  onClick={() => setScreenerSearch("")}
                  className="text-muted-grey hover:text-white p-0.5"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Screener Meta Bar: Count & Real-time Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-muted-grey">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                Showing <strong className="text-white font-mono">{sortedAndFilteredScreenerFunds.length}</strong> of <strong className="text-white font-mono">{screenerFunds.length}</strong> verified funds
              </span>
              {screenerFilterCategory !== "All" && (
                <span className="bg-emerald/10 text-emerald text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald/20">
                  Filtered by: {screenerFilterCategory}
                </span>
              )}
              {screenerSearch && (
                <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-sky-500/20">
                  Query: &ldquo;{screenerSearch}&rdquo;
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald font-semibold">
                <Sparkles size={12} />
                {adjustInflation ? `Real CAGRs (CPI ${inflation}% Adjusted)` : "Nominal CAGRs"}
              </span>
              <span className="text-muted-grey/40">•</span>
              <span className="text-muted-grey">Direct Plan Growth Only</span>
            </div>
          </div>

          {/* Loading State */}
          {loadingScreener ? (
            <div className="space-y-3 py-8">
              <div className="flex items-center justify-center gap-3 text-emerald text-sm font-semibold pb-4">
                <RefreshCw className="animate-spin text-emerald" size={22} />
                <span>Loading real-time AMFI scheme metrics...</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="h-36 rounded-2xl bg-navy-card/30 border border-border-navy/60 animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP & TABLET: Broad Full-Width Screener Table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-border-navy/80 bg-navy-card/25 shadow-xl min-w-0 w-full">
                <table className="w-full text-left border-collapse text-xs min-w-full">
                  <thead>
                    <tr className="border-b border-border-navy bg-navy-card/60 text-[11px] text-muted-grey font-bold uppercase tracking-wider select-none">
                      {[
                        { label: "Fund Scheme Name", key: "name", width: "w-4/12" },
                        { label: "Category", key: "category", width: "w-2/12" },
                        { label: "NAV", key: "currentNav", width: "w-1/12" },
                        { label: adjustInflation ? "1Y Real" : "1Y CAGR", key: "cagr1Y", width: "w-1/12" },
                        { label: adjustInflation ? "3Y Real" : "3Y CAGR", key: "cagr3Y", width: "w-1/12" },
                        { label: adjustInflation ? "5Y Real" : "5Y CAGR", key: "cagr5Y", width: "w-1/12" },
                        { label: "Vol.", key: "volatility", width: "w-1/12" },
                        { label: "Sharpe", key: "sharpe", width: "w-1/12" },
                        { label: "Sortino", key: "sortino", width: "w-1/12" }
                      ].map((col) => {
                        const isCurrent = screenerSort.key === col.key;
                        return (
                          <th
                            key={col.key}
                            onClick={() => {
                              setScreenerSort({
                                key: col.key,
                                direction: isCurrent && screenerSort.direction === "desc" ? "asc" : "desc"
                              });
                            }}
                            className={`px-4 py-3.5 cursor-pointer hover:text-white hover:bg-navy-light/40 transition-all ${col.width || ""}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={isCurrent ? "text-emerald" : ""}>{col.label}</span>
                              <ArrowUpDown size={11} className={isCurrent ? "text-emerald" : "text-muted-grey/40"} />
                            </div>
                          </th>
                        );
                      })}
                      <th className="px-4 py-3.5 text-center w-1/12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-navy/50">
                    {sortedAndFilteredScreenerFunds.length > 0 ? (
                      sortedAndFilteredScreenerFunds.map((fund) => {
                        const displayCagr1Y = adjustInflation ? getRealCagr(fund.cagr1Y) : fund.cagr1Y;
                        const displayCagr3Y = adjustInflation ? getRealCagr(fund.cagr3Y) : fund.cagr3Y;
                        const displayCagr5Y = adjustInflation ? getRealCagr(fund.cagr5Y) : fund.cagr5Y;

                        return (
                          <tr
                            key={fund.code}
                            className="hover:bg-navy-light/25 transition-all font-semibold text-light-grey group cursor-pointer"
                            onClick={() => {
                              setMainCode(fund.code);
                              setViewMode("analyzer");
                            }}
                          >
                            {/* Fund Name */}
                            <td className="px-4 py-4">
                              <div className="space-y-1 max-w-[340px]">
                                <p className="text-white font-bold leading-snug group-hover:text-emerald transition-colors line-clamp-2" title={fund.name}>
                                  {fund.name}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                                  <span className="font-mono text-muted-grey bg-navy-bg/90 border border-border-navy px-1.5 py-0.2 rounded">
                                    Code: {fund.code}
                                  </span>
                                  {fund.schemeCategory && (
                                    <span className="text-muted-grey/70 truncate max-w-[200px]" title={fund.schemeCategory}>
                                      {fund.schemeCategory}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Category Badge */}
                            <td className="px-4 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center border whitespace-nowrap ${getCategoryBadgeClass(fund.category)}`}>
                                {fund.category}
                              </span>
                            </td>

                            {/* NAV */}
                            <td className="px-4 py-4 font-mono text-white text-sm font-bold whitespace-nowrap">
                              ₹{fund.currentNav.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* 1Y CAGR */}
                            <td className="px-4 py-4 font-mono whitespace-nowrap">
                              {displayCagr1Y !== null && displayCagr1Y !== undefined ? (
                                <span className={`font-bold ${displayCagr1Y >= 12 ? "text-emerald" : displayCagr1Y >= 0 ? "text-emerald/80" : "text-rose-400"}`}>
                                  {displayCagr1Y >= 0 ? "+" : ""}{displayCagr1Y.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-muted-grey/60">-</span>
                              )}
                            </td>

                            {/* 3Y CAGR */}
                            <td className="px-4 py-4 font-mono whitespace-nowrap">
                              {displayCagr3Y !== null && displayCagr3Y !== undefined ? (
                                <span className={`font-extrabold ${displayCagr3Y >= 15 ? "text-emerald drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : displayCagr3Y >= 0 ? "text-emerald/90" : "text-rose-400"}`}>
                                  {displayCagr3Y >= 0 ? "+" : ""}{displayCagr3Y.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-muted-grey/60">-</span>
                              )}
                            </td>

                            {/* 5Y CAGR */}
                            <td className="px-4 py-4 font-mono whitespace-nowrap">
                              {displayCagr5Y !== null && displayCagr5Y !== undefined ? (
                                <span className={`font-bold ${displayCagr5Y >= 15 ? "text-emerald" : displayCagr5Y >= 0 ? "text-emerald/80" : "text-rose-400"}`}>
                                  {displayCagr5Y >= 0 ? "+" : ""}{displayCagr5Y.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-muted-grey/60">-</span>
                              )}
                            </td>

                            {/* Volatility */}
                            <td className="px-4 py-4 font-mono whitespace-nowrap">
                              <span className={fund.volatility < 3 ? "text-sky-400" : fund.volatility > 16 ? "text-amber-400" : "text-muted-grey"}>
                                {fund.volatility}%
                              </span>
                            </td>

                            {/* Sharpe */}
                            <td className="px-4 py-4 font-mono whitespace-nowrap">
                              <span className={fund.sharpe >= 0.7 ? "text-emerald font-bold" : fund.sharpe < 0 ? "text-rose-400" : "text-muted-grey"}>
                                {fund.sharpe !== null && fund.sharpe !== undefined ? fund.sharpe : "-"}
                              </span>
                            </td>

                            {/* Sortino */}
                            <td className="px-4 py-4 font-mono whitespace-nowrap">
                              <span className={fund.sortino >= 1.0 ? "text-emerald font-bold" : fund.sortino < 0 ? "text-rose-400" : "text-muted-grey"}>
                                {fund.sortino !== null && fund.sortino !== undefined ? fund.sortino : "-"}
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="px-4 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setMainCode(fund.code);
                                  setViewMode("analyzer");
                                }}
                                className="bg-emerald hover:bg-emerald/90 text-navy-bg font-extrabold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer text-[10px] shadow-sm hover:scale-105"
                              >
                                <span>Analyze</span>
                                <ChevronRight size={11} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-16 text-center text-muted-grey italic">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Layers className="text-muted-grey/40" size={32} />
                            <span>No funds match the selected category or search filter.</span>
                            <button
                              onClick={() => {
                                setScreenerSearch("");
                                setScreenerFilterCategory("All");
                              }}
                              className="text-xs text-emerald underline mt-1 cursor-pointer"
                            >
                              Reset filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE: Responsive Cards View (< 768px) */}
              <div className="block md:hidden space-y-3.5">
                {sortedAndFilteredScreenerFunds.length > 0 ? (
                  sortedAndFilteredScreenerFunds.map((fund) => {
                    const displayCagr1Y = adjustInflation ? getRealCagr(fund.cagr1Y) : fund.cagr1Y;
                    const displayCagr3Y = adjustInflation ? getRealCagr(fund.cagr3Y) : fund.cagr3Y;
                    const displayCagr5Y = adjustInflation ? getRealCagr(fund.cagr5Y) : fund.cagr5Y;

                    return (
                      <div
                        key={fund.code}
                        className="bg-navy-card/40 border border-border-navy/80 rounded-2xl p-4 space-y-3.5 shadow-md hover:border-emerald/40 transition-all"
                      >
                        {/* Header: Name, Code, Category */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="space-y-1 min-w-0 flex-1">
                            <h3 className="text-white font-bold text-sm leading-snug line-clamp-2">
                              {fund.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap text-[10px]">
                              <span className="font-mono text-muted-grey bg-navy-bg px-1.5 py-0.5 rounded border border-border-navy">
                                #{fund.code}
                              </span>
                              {fund.schemeCategory && (
                                <span className="text-muted-grey/70 truncate max-w-[180px]">
                                  {fund.schemeCategory}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shrink-0 border ${getCategoryBadgeClass(fund.category)}`}>
                            {fund.category}
                          </span>
                        </div>

                        {/* NAV & Key Metric Banner */}
                        <div className="flex items-center justify-between bg-navy-bg/70 px-3 py-2 rounded-xl border border-border-navy/60">
                          <div>
                            <span className="text-[10px] text-muted-grey block">Current NAV</span>
                            <span className="text-white font-mono font-bold text-sm">
                              ₹{fund.currentNav.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-muted-grey block">
                              {adjustInflation ? "3Y Real CAGR" : "3Y CAGR"}
                            </span>
                            <span className={`font-mono font-extrabold text-sm ${displayCagr3Y && displayCagr3Y >= 14 ? "text-emerald" : displayCagr3Y && displayCagr3Y >= 0 ? "text-emerald/90" : "text-rose-400"}`}>
                              {displayCagr3Y !== null && displayCagr3Y !== undefined ? `${displayCagr3Y >= 0 ? "+" : ""}${displayCagr3Y.toFixed(2)}%` : "-"}
                            </span>
                          </div>
                        </div>

                        {/* 3-Column CAGR Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center bg-navy-card/25 p-2.5 rounded-xl border border-border-navy/40 text-xs">
                          <div>
                            <span className="text-[10px] text-muted-grey block">1Y CAGR</span>
                            <span className={`font-mono font-bold text-xs ${displayCagr1Y && displayCagr1Y >= 0 ? "text-emerald" : "text-rose-400"}`}>
                              {displayCagr1Y !== null && displayCagr1Y !== undefined ? `${displayCagr1Y >= 0 ? "+" : ""}${displayCagr1Y.toFixed(1)}%` : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-grey block">5Y CAGR</span>
                            <span className={`font-mono font-bold text-xs ${displayCagr5Y && displayCagr5Y >= 0 ? "text-emerald" : "text-rose-400"}`}>
                              {displayCagr5Y !== null && displayCagr5Y !== undefined ? `${displayCagr5Y >= 0 ? "+" : ""}${displayCagr5Y.toFixed(1)}%` : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-grey block">Sharpe</span>
                            <span className="font-mono font-bold text-xs text-white">
                              {fund.sharpe ?? "-"}
                            </span>
                          </div>
                        </div>

                        {/* Action CTA */}
                        <button
                          onClick={() => {
                            setMainCode(fund.code);
                            setViewMode("analyzer");
                          }}
                          className="w-full bg-emerald hover:bg-emerald/90 text-navy-bg font-extrabold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all shadow-md active:scale-95"
                        >
                          <span>Analyze in Depth</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-navy-card/30 border border-border-navy rounded-2xl p-8 text-center text-muted-grey italic">
                    <p className="text-xs">No mutual funds match your filter criteria.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Educational Glossary on Parameters */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-6">
            <div className="flex items-center gap-2 border-b border-border-navy/60 pb-3">
              <BookOpen className="text-emerald" size={20} />
              <h2 className="text-lg font-bold text-white tracking-tight">Mutual Fund Evaluation Glossary</h2>
            </div>

            <p className="text-xs text-muted-grey leading-relaxed">
              When investing in mutual funds, returns are only half the equation. Risk and risk-adjusted metrics tell you whether the fund manager is actually delivering value, or simply taking excessive, dangerous risks.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Rolling Returns
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Unlike simple point-to-point CAGR (which only measures returns between two arbitrary dates), rolling returns calculate averages across multiple overlapping holding periods (e.g. every 3-year window in the last 15 years). This reveals the true consistency of a fund manager and filters out luck or market timing.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Sharpe Ratio
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Measures the excess return generated per unit of total risk (volatility). A Sharpe ratio &gt; 1 indicates the fund is generating excellent return for the volatility it takes. Formulated as <code>(CAGR - Risk Free Rate) / Volatility</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Sortino Ratio
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Similar to Sharpe, but only penalizes <em>downside</em> or negative volatility. It ignores upside swings (which are actually good for investors!). Essential for conservative investors to look at.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Annual Volatility
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Represents the standard deviation of daily returns annualized. Higher volatility means larger swings in value. Equity small caps have 18-20% volatility, while liquid debt funds have &lt; 1%.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Alpha
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  The outperformance of the fund relative to its benchmark index (like Nifty 50). If the benchmark yields 12% and the fund yields 15%, it has an Alpha of +3.0. A positive Alpha indicates active fund management success.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Beta
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Measures the price sensitivity of the fund relative to the market benchmark. A Beta of 1.0 means the fund moves in tandem with the index; &gt; 1.0 means it is more reactive (riskier but faster), &lt; 1.0 means it is defensive.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "analyzer" ? (
        <div className="space-y-10 animate-fadeIn">
          {/* Main Search Panel */}
          <div className="relative max-w-xl mx-auto z-20">
            <div className="flex items-center gap-3 glass-input focus-within:border-emerald">
              <Search className="text-muted-grey" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mutual funds (e.g. Nippon Large Cap, Parag Parikh)..."
                className="w-full bg-transparent outline-none text-white text-sm"
              />
              {isSearching && <RefreshCw className="text-emerald animate-spin" size={16} />}
            </div>

            {/* Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-14 left-0 w-full rounded-xl border border-border-navy bg-navy-bg shadow-2xl p-2 space-y-1 max-h-[250px] overflow-y-auto z-50">
                {searchResults.map((fundItem) => (
                  <button
                    key={fundItem.schemeCode}
                    onClick={() => {
                      setMainCode(fundItem.schemeCode);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-left text-xs font-semibold text-light-grey hover:bg-navy-light hover:text-emerald transition-colors"
                  >
                    <span className="truncate max-w-[85%]">{fundItem.schemeName}</span>
                    <span className="text-[9px] text-muted-grey border border-border-navy px-1 py-0.5 rounded">
                      {fundItem.schemeCode}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading state indicator */}
          {(loadingMain || loadingCompare) && (
            <div className="flex items-center justify-center gap-2 text-sm text-emerald py-8">
              <RefreshCw className="animate-spin" size={16} />
              <span>Crunching real-time historical NAV charts and risk ratios...</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && !loadingMain && (
            <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3 text-center">
              <p className="text-sm text-red-400 font-semibold">{errorMsg}</p>
              <button
                onClick={() => loadFundData(mainCode, "main")}
                className="inline-flex items-center gap-2 bg-emerald hover:bg-emerald/90 text-navy-bg px-5 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <RefreshCw size={14} />
                Retry Loading
              </button>
            </div>
          )}

          {/* Dashboard Grid */}
          {mainFund && !loadingMain && (
            <div className="grid lg:grid-cols-3 gap-8 animate-fadeIn">
              {/* Left Column: Fund info & Comparisons */}
              <div className="lg:col-span-1 space-y-6">
                <div className="p-6 glass-card space-y-5">
                  <div>
                    <span className="text-[10px] font-bold text-emerald uppercase tracking-wider bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded">
                      {mainFund.category || "Equity Fund"}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-2 leading-snug">{mainFund.name}</h2>
                    <span className="text-xs text-muted-grey block mt-1">Fund House: {mainFund.house}</span>
                  </div>

                  <div className="border-t border-border-navy/60 pt-4 space-y-3 text-xs text-light-grey">
                    <div className="flex justify-between border-b border-border-navy/40 pb-2">
                      <span className="text-muted-grey">Current NAV</span>
                      <span className="text-white font-extrabold">{formatCurrency(mainFund.currentNav)}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-navy/40 pb-2">
                      <span className="text-muted-grey">Benchmark Sourcing</span>
                      <span className="text-white font-semibold">AMFI Daily Nav Feed</span>
                    </div>
                    <div className="flex justify-between border-b border-border-navy/40 pb-2">
                      <span className="text-muted-grey">Scheme Code</span>
                      <span className="text-white font-semibold font-mono">{mainFund.code}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Comparison Panel */}
                <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/30 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <GitCompare className="text-emerald" size={18} />
                    Side-by-Side Comparison
                  </h3>
                  <p className="text-xs text-muted-grey leading-relaxed">
                    Add another fund to overlay their performances on the rebased graph, comparing returns and risks.
                  </p>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-grey block">COMPARE MAIN FUND WITH:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (compareFund) {
                            setCompareCode(null);
                          } else {
                            setCompareCode(120716);
                          }
                        }}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-colors cursor-pointer ${compareFund
                          ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                          : "bg-navy-light border-border-navy text-white hover:border-emerald/40"
                          }`}
                      >
                        {compareFund ? "Clear Comparison" : "Overlay Nifty 50 Index"}
                      </button>
                    </div>
                  </div>

                  {compareFund && !loadingCompare && (
                    <div className="p-4 rounded-xl border border-border-navy bg-navy-bg text-xs space-y-2">
                      <span className="text-[10px] font-bold text-emerald uppercase block">Comparing Against:</span>
                      <span className="font-bold text-white block leading-snug">{compareFund.name}</span>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-navy/60 text-[10px]">
                        <div>
                          <span className="text-muted-grey">{adjustInflation ? "Real CAGR (3Y)" : "CAGR (3Y)"}</span>
                          <span className="text-white font-semibold block">
                            {compareFund.cagr3Y ? `${(adjustInflation ? getRealCagr(compareFund.cagr3Y) : compareFund.cagr3Y)?.toFixed(2)}%` : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-grey">Volatility</span>
                          <span className="text-white font-semibold block">{compareFund.volatility}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* General Advice warning */}
                <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45 space-y-2 text-xs text-muted-grey leading-relaxed">
                  <div className="flex items-center gap-1 text-amber-500">
                    <ShieldAlert size={16} />
                    <span className="font-bold uppercase tracking-wider">Education Disclaimer</span>
                  </div>
                  <p>
                    Ratios are derived strictly from mathematical calculations over daily historical NAV endpoints. Ratios of past return metrics do not guarantee future performance values.
                  </p>
                </div>
              </div>

              {/* Right Column: Math metrics and rebased chart */}
              <div className="lg:col-span-2 space-y-6">
                {/* CAGR returns and Volatilities */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
                    <span className="text-[10px] uppercase font-bold text-muted-grey block">
                      {adjustInflation ? "1Y Real CAGR return" : "1Y CAGR return"}
                    </span>
                    <p className="text-lg font-bold text-white mt-1">
                      {mainFund.cagr1Y ? `${(adjustInflation ? getRealCagr(mainFund.cagr1Y) : mainFund.cagr1Y)?.toFixed(2)}%` : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
                    <span className="text-[10px] uppercase font-bold text-muted-grey block">
                      {adjustInflation ? "3Y Real CAGR return" : "3Y CAGR return"}
                    </span>
                    <p className="text-lg font-bold text-emerald mt-1">
                      {mainFund.cagr3Y ? `${(adjustInflation ? getRealCagr(mainFund.cagr3Y) : mainFund.cagr3Y)?.toFixed(2)}%` : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
                    <span className="text-[10px] uppercase font-bold text-muted-grey block">Annual Volatility</span>
                    <p className="text-lg font-bold text-white mt-1">{mainFund.volatility}%</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
                    <span className="text-[10px] uppercase font-bold text-muted-grey block flex items-center gap-1">
                      Sharpe Ratio
                      <span className="text-muted-grey/60 cursor-help inline-flex" title="Returns excess over 6.95% risk-free rate, divided by volatility."><HelpCircle size={12} /></span>
                    </span>
                    <p className="text-lg font-bold text-white mt-1">{mainFund.sharpe || "N/A"}</p>
                  </div>
                </div>

                {/* Performance Chart with Rebased Comparison */}
                <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        {compareFund ? "Comparative Performance (Rebased to 100)" : "Fund Net Performance"}
                      </h3>
                      <p className="text-xs text-muted-grey mt-0.5">
                        {compareFund
                          ? "Both funds started at 100 to compare compound return speeds"
                          : `NAV growth over the selected timeframe`}
                      </p>
                    </div>

                    {/* Horizon Switcher */}
                    <div className="flex bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                      {(["1Y", "3Y", "5Y"] as const).map((h) => (
                        <button
                          key={h}
                          onClick={() => setTimeHorizon(h)}
                          className={`px-3 py-1 rounded transition-colors cursor-pointer ${timeHorizon === h ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                            }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart container */}
                  <div className="h-[280px]">
                    {rebasedChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={rebasedChartData}
                          margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCompare" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                          <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            width={65}
                            domain={["dataMin - 10", "dataMax + 10"]}
                            tickFormatter={(val) => compareFund ? `${Number(val).toFixed(2)}` : `₹${Number(val).toFixed(2)}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#081c3a",
                              borderColor: "#112d55",
                              borderRadius: "8px",
                              color: "#f1f5f9"
                            }}
                            formatter={(value: any) => [compareFund ? `${Number(value).toFixed(2)}` : `₹${Number(value).toFixed(2)}`, "NAV"]}
                          />
                          <Legend iconType="circle" />
                          <Area
                            type="monotone"
                            dataKey={mainFund.name}
                            stroke="#22c55e"
                            fillOpacity={1}
                            fill="url(#colorMain)"
                            strokeWidth={2}
                          />
                          {compareFund && (
                            <Area
                              type="monotone"
                              dataKey={compareFund.name}
                              stroke="#ef4444"
                              fillOpacity={1}
                              fill="url(#colorCompare)"
                              strokeWidth={2}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-grey italic">
                        Historical data not stretching back far enough for {timeHorizon} view.
                      </div>
                    )}
                  </div>
                  {compareFund && (
                    <p className="text-[10px] text-muted-grey text-right pt-2">
                      * <strong>Benchmark Disclosure:</strong> Benchmarks (like Nifty 50 TRI) are approximated using passive index-tracking mutual fund schemes as direct proxies.
                    </p>
                  )}
                </div>

                {/* Volatility Ratios Explanation card */}
                <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Info className="text-emerald" size={18} />
                    Volatility Risk Indicators (Education Card)
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6 text-xs text-muted-grey leading-relaxed border-t border-border-navy/60 pt-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-white">1. Annualized Volatility</h4>
                      <p>
                        Volatility measures the magnitude of daily price swings. A fund with 18% volatility will experience much larger index corrections than a conservative fund with 9% volatility. Ensure your time horizon supports the fund&apos;s volatility level.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-white">2. Sharpe & Sortino ratios</h4>
                      <p>
                        <strong>Sharpe Ratio</strong> evaluates the excess yield relative to standard deviation. If the Sharpe is high, the manager took efficient risks. <strong>Sortino Ratio</strong> only penalizes downside volatility, making it the preferred metric to examine for conservative portfolios.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* ===== VIEW MODE 3: AMC FACTSHEETS VAULT & 5-PILLAR SELECTION GUIDE ===== */}
          {/* SECTION 1: How to Pick a Mutual Fund Masterclass */}
          <div className="p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-navy pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 text-emerald font-bold text-xs uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-emerald" /> ValarchiX Masterclass • 6 Golden Rules
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-heading mt-1">
                  How to Select the Right Mutual Fund Category & Scheme
                </h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  &ldquo;We don&apos;t tell what to pick, we tell how to pick.&rdquo; Evaluate these 6 core metrics before investing a single rupee.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* 1. AUM */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border-navy/80 bg-navy-bg/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-emerald bg-emerald/10 border border-emerald/20 px-2.5 py-1 rounded-lg">
                    1. AUM (Assets Under Management)
                  </span>
                  <Coins className="text-emerald shrink-0" size={18} />
                </div>
                <p className="text-xs text-light-grey leading-relaxed">
                  Total capital pool invested in the fund by all investors.
                </p>
                <div className="p-3 rounded-xl bg-navy-card/60 border border-border-navy/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-rose-400">
                    <span>🚫 &lt; ₹1,000 Cr</span>
                    <span className="font-bold">Liquidity Risk</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald font-bold">
                    <span>✅ ₹3,000 Cr – ₹10,000 Cr</span>
                    <span>Sweet Spot</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-400">
                    <span>⚠️ &gt; ₹10,000 Cr – ₹15,000 Cr</span>
                    <span className="font-bold">Size Burden</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-grey leading-normal">
                  <strong>Why size matters:</strong> Very large funds (especially Small/Mid cap) struggle to deploy cash quickly without buying huge stakes or driving up stock purchase costs (impact cost).
                </p>
              </div>

              {/* 2. Standard Deviation */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border-navy/80 bg-navy-bg/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-emerald bg-emerald/10 border border-emerald/20 px-2.5 py-1 rounded-lg">
                    2. Standard Deviation (σ)
                  </span>
                  <BarChart2 className="text-emerald shrink-0" size={18} />
                </div>
                <p className="text-xs text-light-grey leading-relaxed">
                  Measures the annual dispersion of fund returns from its historical average (volatility & journey smoothness).
                </p>
                <div className="p-3 rounded-xl bg-navy-card/60 border border-border-navy/60 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-grey">Lower Standard Dev:</span>
                    <span className="text-emerald font-bold">Smoother Ride</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-grey">Higher Standard Dev:</span>
                    <span className="text-rose-400 font-bold">Wild Volatility Swings</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-grey leading-normal">
                  <strong>ValarchiX Rule:</strong> Compare two funds with equal 15% CAGR. The fund with lower Standard Deviation offers a far more stress-free compounding journey.
                </p>
              </div>

              {/* 3. Alpha */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border-navy/80 bg-navy-bg/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-emerald bg-emerald/10 border border-emerald/20 px-2.5 py-1 rounded-lg">
                    3. Alpha (α)
                  </span>
                  <TrendingUp className="text-emerald shrink-0" size={18} />
                </div>
                <p className="text-xs text-light-grey leading-relaxed">
                  Excess return generated by the fund manager above the benchmark index (e.g., Nifty 50).
                </p>
                <div className="p-3 rounded-xl bg-navy-card/60 border border-border-navy/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-emerald font-bold">
                    <span>α &gt; 1.0 (Positive Alpha)</span>
                    <span>Outperforms Index</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-400">
                    <span>α = 0 (Zero Alpha)</span>
                    <span>Index Hugger</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-400">
                    <span>α &lt; 0 (Negative Alpha)</span>
                    <span>Underperforms Index</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-grey leading-normal">
                  <strong>Example:</strong> If Nifty returns 12% and Fund A returns 15%, Alpha is <strong>+3.0%</strong>. If Fund B returns 10%, Alpha is <strong>-2.0%</strong> (destroying value after active fees).
                </p>
              </div>

              {/* 4. Beta */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border-navy/80 bg-navy-bg/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-emerald bg-emerald/10 border border-emerald/20 px-2.5 py-1 rounded-lg">
                    4. Beta (β)
                  </span>
                  <Zap className="text-emerald shrink-0" size={18} />
                </div>
                <p className="text-xs text-light-grey leading-relaxed">
                  Market sensitivity ratio — measures how violently the fund moves relative to market swings.
                </p>
                <div className="p-3 rounded-xl bg-navy-card/60 border border-border-navy/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-rose-400">
                    <span>β &gt; 1.0 (High Beta)</span>
                    <span>More Volatile</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-400">
                    <span>β = 1.0</span>
                    <span>Syncs with Market</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald font-bold">
                    <span>β &lt; 1.0 (Low Beta)</span>
                    <span>Defensive / Protected</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-grey leading-normal">
                  <strong>Example:</strong> If Nifty crashes 10%, a fund with <strong>β = 0.85</strong> drops only ~8.5%, protecting your capital during market crashes.
                </p>
              </div>

              {/* 5. Sharpe Ratio */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border-navy/80 bg-navy-bg/50 space-y-3 md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-emerald bg-emerald/10 border border-emerald/20 px-2.5 py-1 rounded-lg">
                    5. Sharpe Ratio (Risk-Adjusted Return)
                  </span>
                  <ShieldCheck className="text-emerald shrink-0" size={18} />
                </div>
                <p className="text-xs text-light-grey leading-relaxed">
                  Calculates excess return per unit of total risk taken: <code className="text-emerald font-mono font-bold bg-emerald/10 px-2 py-0.5 rounded">Sharpe = (Fund Return - Risk Free Rate) / Standard Deviation</code>
                </p>
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-navy-card/60 border border-border-navy/60 text-xs space-y-1">
                    <span className="text-muted-grey font-semibold block">Sharpe Ratio &gt; 1.2:</span>
                    <span className="text-emerald font-bold block">Excellent Risk-Adjusted Reward</span>
                    <p className="text-[10px] text-muted-grey">The fund manager generates high compounding returns while controlling downside risk.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-card/60 border border-border-navy/60 text-xs space-y-1">
                    <span className="text-muted-grey font-semibold block">Sharpe Ratio &lt; 0.6:</span>
                    <span className="text-rose-400 font-bold block">Poor Risk Reward</span>
                    <p className="text-[10px] text-muted-grey">Taking excessive volatility risk for mediocre returns.</p>
                  </div>
                </div>
              </div>

              {/* 6. Rolling Returns (The Ultimate Truth Ratio) */}
              <div className="p-4 sm:p-6 rounded-2xl border border-emerald/40 bg-gradient-to-br from-navy-bg/90 via-navy-card to-emerald/5 space-y-4 md:col-span-2 lg:col-span-3 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-navy/60 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold uppercase text-emerald bg-emerald/10 border border-emerald/20 px-2.5 py-1 rounded-lg">
                      6. Rolling Returns (The Ultimate Consistency Benchmark)
                    </span>
                    <span className="text-[10px] text-emerald font-bold bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded">
                      ValarchiX Gold Standard
                    </span>
                  </div>
                  <a
                    href="https://www.advisorkhoj.com/mutual-funds-research/rolling-returns"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald text-navy-bg font-extrabold text-xs hover:bg-emerald/90 transition cursor-pointer shadow-md"
                  >
                    <span>Explore Live Rolling Returns on AdvisorKhoj</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-xs text-light-grey leading-relaxed">
                  <div className="space-y-2 p-3.5 rounded-xl bg-navy-card/60 border border-border-navy/60">
                    <h4 className="font-bold text-rose-400 flex items-center gap-1.5 text-xs">
                      <span>⚠️ Why 1Y, 3Y, 5Y Trailing CAGR is Misleading</span>
                    </h4>
                    <p className="text-[11px] text-muted-grey leading-relaxed">
                      Point-to-point trailing CAGR depends heavily on luck and start/end dates. If the market peaked today, trailing 3Y returns look artificially high. If the market crashed yesterday, trailing 3Y returns look unfairly poor.
                    </p>
                  </div>

                  <div className="space-y-2 p-3.5 rounded-xl bg-navy-card/60 border border-border-navy/60">
                    <h4 className="font-bold text-emerald flex items-center gap-1.5 text-xs">
                      <span>✅ What is Rolling Returns Consistency?</span>
                    </h4>
                    <p className="text-[11px] text-muted-grey leading-relaxed">
                      Rolling returns evaluate performance across hundreds of overlapping holding windows (e.g., 3-year returns evaluated every single day for 10 years). It tells you the exact percentage probability of achieving 12%+ returns regardless of when you start investing.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-emerald/10 border border-emerald/20 text-xs">
                  <span className="text-light-grey text-center sm:text-left text-[11px]">
                    💡 <strong>ValarchiX Recommendation:</strong> Always analyze 3-year and 5-year rolling returns matrices on AdvisorKhoj to verify if a fund manager delivers consistent returns across all market cycles.
                  </span>
                  <a
                    href="https://www.advisorkhoj.com/mutual-funds-research/rolling-returns"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-4 py-2 rounded-xl bg-emerald/20 border border-emerald/40 text-emerald hover:bg-emerald hover:text-navy-bg font-bold text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <span>AdvisorKhoj Rolling Tool</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: AMC Official Factsheets Vault */}
          <div className="p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-border-navy bg-navy-card space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-navy pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 text-emerald font-bold text-xs uppercase tracking-wider">
                  <Download className="w-4 h-4 text-emerald" /> Free Investor Vault • Official AMC Factsheets
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-heading mt-1">
                  Official AMC Monthly Factsheet Download Hub
                </h2>
                <p className="text-xs sm:text-sm text-muted-grey mt-1">
                  Direct official monthly factsheets, scheme portfolios, and fund manager commentary for all 44 Indian AMCs.
                </p>
              </div>
            </div>

            {!session?.user ? (
              /* LOCKED VAULT BANNER (for logged-out visitors) */
              <div className="p-6 sm:p-10 rounded-3xl border border-emerald/30 bg-gradient-to-br from-navy-card via-navy-bg to-emerald/10 text-center space-y-5 shadow-2xl animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-emerald/10 border border-emerald/30 text-emerald flex items-center justify-center mx-auto text-3xl shadow-lg">
                  🔒
                </div>
                <div className="max-w-xl mx-auto space-y-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-heading">
                    Official AMC Factsheets Vault is Locked
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-grey leading-relaxed">
                    Accessing official monthly factsheet downloads across all 48 Indian Asset Management Companies is exclusively free for signed-in ValarchiX account holders.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald hover:bg-emerald/90 text-navy-bg font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald/20 transition-all cursor-pointer"
                  >
                    <Lock size={16} />
                    <span>Sign In to Unlock Official AMC Factsheets</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* UNLOCKED VAULT (for signed-in users) */
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-navy-bg/60 p-4 rounded-2xl border border-border-navy">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 text-muted-grey" size={16} />
                    <input
                      type="text"
                      placeholder="Search AMC (e.g. SBI, Quant, PPFAS)..."
                      value={amcSearch}
                      onChange={(e) => setAmcSearch(e.target.value)}
                      className="w-full bg-navy-card border border-border-navy rounded-xl pl-9 pr-4 py-2 text-xs text-light-grey outline-none focus:border-emerald"
                    />
                  </div>
                  <div className="text-xs font-semibold text-emerald bg-emerald/10 border border-emerald/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span>Official AMC Vault Active • Direct Factsheet Access</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {AMC_FACTSHEETS.filter((amc) =>
                    amc.name.toLowerCase().includes(amcSearch.toLowerCase()) ||
                    amc.code.toLowerCase().includes(amcSearch.toLowerCase())
                  ).map((amc) => (
                    <div key={amc.code} className="p-4 rounded-2xl border border-border-navy bg-navy-bg/60 hover:border-emerald/40 transition space-y-3 flex flex-col justify-between shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <AMCLogo website={amc.website} name={amc.name} code={amc.code} />
                          <span className="text-[10px] font-bold text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded">
                            Latest Factsheet
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-heading">{amc.name}</h4>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <a
                          href={amc.pdfUrl || amc.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald hover:text-navy-bg transition text-xs font-bold cursor-pointer"
                        >
                          <Download size={14} />
                          <span>Factsheet PDF</span>
                        </a>
                        <a
                          href={amc.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl border border-border-navy bg-navy-card text-muted-grey hover:text-white hover:border-emerald/40 transition cursor-pointer"
                          title="Visit Official AMC Portal"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
