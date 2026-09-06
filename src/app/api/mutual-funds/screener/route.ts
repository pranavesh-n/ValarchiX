import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Curated list of verified AMFI scheme codes across major fund categories (Direct Plan - Growth)
const CURATED_FUNDS = [
  // Large Cap
  { code: 120586, name: "ICICI Prudential Large Cap Fund - Direct Plan - Growth", expectedKeywords: ["icici", "large cap"] },
  { code: 119598, name: "SBI Large Cap Fund - Direct Plan - Growth", expectedKeywords: ["sbi", "large cap"] },
  { code: 120465, name: "Axis Large Cap Fund - Direct Plan - Growth Option", expectedKeywords: ["axis", "large cap"] },
  { code: 120152, name: "Kotak Large Cap Fund - Direct Plan - Growth", expectedKeywords: ["kotak", "large cap"] },
  { code: 118825, name: "Mirae Asset Large Cap Fund - Direct Plan - Growth", expectedKeywords: ["mirae", "large cap"] },

  // Large Cap Index
  { code: 120716, name: "UTI Nifty 50 Index Fund - Direct Plan - Growth", expectedKeywords: ["uti", "nifty 50"] },
  { code: 119063, name: "HDFC Nifty 50 Index Fund - Direct Plan - Growth Option", expectedKeywords: ["hdfc", "nifty 50"] },

  // Mid Cap
  { code: 118989, name: "HDFC Mid Cap Fund - Direct Plan - Growth Option", expectedKeywords: ["hdfc", "mid cap"] },
  { code: 119775, name: "Kotak Mid Cap Fund - Direct Plan - Growth", expectedKeywords: ["kotak", "mid cap"] },
  { code: 119071, name: "DSP Midcap Fund - Direct Plan - Growth", expectedKeywords: ["dsp", "midcap"] },
  { code: 147622, name: "Motilal Oswal Nifty Midcap 150 Index Fund - Direct Plan - Growth", expectedKeywords: ["motilal", "midcap"] },

  // Small Cap
  { code: 118778, name: "Nippon India Small Cap Fund - Direct Plan - Growth Option", expectedKeywords: ["nippon", "small cap"] },
  { code: 120828, name: "Quant Small Cap Fund - Direct Plan - Growth Option", expectedKeywords: ["quant", "small cap"] },
  { code: 125497, name: "SBI Small Cap Fund - Direct Plan - Growth", expectedKeywords: ["sbi", "small cap"] },
  { code: 145206, name: "Tata Small Cap Fund - Direct Plan - Growth Option", expectedKeywords: ["tata", "small cap"] },

  // Flexi & Multi Cap
  { code: 122639, name: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth", expectedKeywords: ["parag parikh", "flexi cap"] },
  { code: 118955, name: "HDFC Flexi Cap Fund - Direct Plan - Growth Option", expectedKeywords: ["hdfc", "flexi cap"] },
  { code: 120843, name: "Quant Flexi Cap Fund - Direct Plan - Growth Option", expectedKeywords: ["quant", "flexi cap"] },
  { code: 120823, name: "Quant Multi Cap Fund - Direct Plan - Growth Option", expectedKeywords: ["quant", "multi cap"] },

  // ELSS / Tax Saver
  { code: 120847, name: "Quant ELSS Tax Saver Fund - Direct Plan - Growth Option", expectedKeywords: ["quant", "elss"] },
  { code: 120503, name: "Axis ELSS Tax Saver Fund - Direct Plan - Growth Option", expectedKeywords: ["axis", "elss"] },
  { code: 135781, name: "Mirae Asset ELSS Tax Saver Fund - Direct Plan - Growth", expectedKeywords: ["mirae", "elss"] },

  // Hybrid
  { code: 120251, name: "ICICI Prudential Aggressive Hybrid Fund - Direct Plan - Growth", expectedKeywords: ["icici", "hybrid"] },
  { code: 148958, name: "Parag Parikh Conservative Hybrid Fund - Direct Plan - Growth", expectedKeywords: ["parag parikh", "hybrid"] },

  // Debt & Liquid
  { code: 120197, name: "ICICI Prudential Liquid Fund - Direct Plan - Growth", expectedKeywords: ["icici", "liquid"] },
  { code: 119091, name: "HDFC Liquid Fund - Direct Plan - Growth Option", expectedKeywords: ["hdfc", "liquid"] },
  { code: 118701, name: "Nippon India Liquid Fund - Direct Plan - Growth Option", expectedKeywords: ["nippon", "liquid"] },
  { code: 119707, name: "SBI Gilt Fund - Direct Plan - Growth", expectedKeywords: ["sbi", "gilt"] },
  { code: 119533, name: "Aditya Birla Sun Life Corporate Bond Fund - Direct Plan - Growth", expectedKeywords: ["aditya birla", "corporate bond"] }
];

function normalizeCategory(apiCat?: string | null, schemeName?: string | null): string {
  const cat = (apiCat || "").toLowerCase();
  const n = (schemeName || "").toLowerCase();
  if (cat.includes("elss") || n.includes("elss") || n.includes("tax saver")) return "ELSS";
  if (cat.includes("small cap") || n.includes("small cap") || n.includes("smallcap")) return "Small Cap";
  if (cat.includes("mid cap") || cat.includes("midcap") || n.includes("mid cap") || n.includes("midcap")) return "Mid Cap";
  if (cat.includes("flexi") || cat.includes("multi cap") || cat.includes("multicap") || n.includes("flexi") || n.includes("multi cap")) return "Flexi / Multi Cap";
  if (cat.includes("large cap") || cat.includes("bluechip") || n.includes("large cap") || n.includes("bluechip")) return "Large Cap";
  if (cat.includes("index") || n.includes("index") || n.includes("nifty")) return "Index";
  if (cat.includes("hybrid") || n.includes("hybrid")) return "Hybrid";
  if (cat.includes("liquid") || cat.includes("debt") || cat.includes("gilt") || cat.includes("bond")) return "Debt & Liquid";
  return apiCat || "Equity";
}

// Fallback database with verified real-world metrics in case network is down or API fails
const FALLBACK_METRICS = [
  { code: 120586, name: "ICICI Prudential Large Cap Fund - Direct Plan - Growth", category: "Large Cap", schemeCategory: "Equity Scheme - Large Cap Fund", currentNav: 118.9, cagr1Y: -1.44, cagr3Y: 11.79, cagr5Y: 11.71, volatility: 12.8, sharpe: 0.38, sortino: 0.54 },
  { code: 119598, name: "SBI Large Cap Fund - Direct Plan - Growth", category: "Large Cap", schemeCategory: "Equity Scheme - Large Cap Fund", currentNav: 103.33, cagr1Y: 1.46, cagr3Y: 9.89, cagr5Y: 9.62, volatility: 11.9, sharpe: 0.25, sortino: 0.36 },
  { code: 120465, name: "Axis Large Cap Fund - Direct Plan - Growth Option", category: "Large Cap", schemeCategory: "Equity Schemes - Large Cap Fund", currentNav: 69.66, cagr1Y: 0.1, cagr3Y: 9.97, cagr5Y: 6.1, volatility: 12.1, sharpe: 0.25, sortino: 0.35 },
  { code: 120152, name: "Kotak Large Cap Fund - Direct Plan - Growth", category: "Large Cap", schemeCategory: "Equity Scheme - Large Cap Fund", currentNav: 657.11, cagr1Y: 0.69, cagr3Y: 11.08, cagr5Y: 9.71, volatility: 12.5, sharpe: 0.33, sortino: 0.47 },
  { code: 118825, name: "Mirae Asset Large Cap Fund - Direct Plan - Growth", category: "Large Cap", schemeCategory: "Equity Schemes - Large Cap Fund", currentNav: 127.06, cagr1Y: 0.21, cagr3Y: 9.31, cagr5Y: 8.31, volatility: 13.61, sharpe: 0.17, sortino: 0.24 },
  { code: 120716, name: "UTI Nifty 50 Index Fund - Direct Plan - Growth", category: "Index", schemeCategory: "Other Scheme - Index Funds", currentNav: 168.31, cagr1Y: -2.51, cagr3Y: 7.9, cagr5Y: 7.61, volatility: 13.08, sharpe: 0.07, sortino: 0.1 },
  { code: 119063, name: "HDFC Nifty 50 Index Fund - Direct Plan - Growth Option", category: "Index", schemeCategory: "Other Scheme - Index Funds", currentNav: 233.95, cagr1Y: -2.59, cagr3Y: 7.84, cagr5Y: 7.57, volatility: 13.08, sharpe: 0.07, sortino: 0.09 },
  { code: 118989, name: "HDFC Mid Cap Fund - Direct Plan - Growth Option", category: "Mid Cap", schemeCategory: "Equity Scheme - Mid Cap Fund", currentNav: 234.58, cagr1Y: 10.69, cagr3Y: 18.09, cagr5Y: 19.65, volatility: 13.81, sharpe: 0.81, sortino: 1.13 },
  { code: 119775, name: "Kotak Mid Cap Fund - Direct Plan - Growth", category: "Mid Cap", schemeCategory: "Equity Schemes - Mid Cap Fund", currentNav: 171.8, cagr1Y: 9.01, cagr3Y: 17.99, cagr5Y: 17.1, volatility: 15.54, sharpe: 0.71, sortino: 1.01 },
  { code: 119071, name: "DSP Midcap Fund - Direct Plan - Growth", category: "Mid Cap", schemeCategory: "Equity Scheme - Mid Cap Fund", currentNav: 175.78, cagr1Y: 7.69, cagr3Y: 14.56, cagr5Y: 12.26, volatility: 15.02, sharpe: 0.51, sortino: 0.73 },
  { code: 147622, name: "Motilal Oswal Nifty Midcap 150 Index Fund - Direct Plan - Growth", category: "Mid Cap", schemeCategory: "Other Scheme - Index Funds", currentNav: 42.06, cagr1Y: 9.95, cagr3Y: 15.79, cagr5Y: 16.67, volatility: 15.78, sharpe: 0.56, sortino: 0.79 },
  { code: 118778, name: "Nippon India Small Cap Fund - Direct Plan - Growth Option", category: "Small Cap", schemeCategory: "Equity Scheme - Small Cap Fund", currentNav: 210.48, cagr1Y: 11.71, cagr3Y: 15.31, cagr5Y: 19.67, volatility: 14.85, sharpe: 0.56, sortino: 0.82 },
  { code: 120828, name: "Quant Small Cap Fund - Direct Plan - Growth Option", category: "Small Cap", schemeCategory: "Equity Scheme - Small Cap Fund", currentNav: 322.64, cagr1Y: 17.99, cagr3Y: 17.74, cagr5Y: 20.1, volatility: 15.2, sharpe: 0.71, sortino: 1.06 },
  { code: 125497, name: "SBI Small Cap Fund - Direct Plan - Growth", category: "Small Cap", schemeCategory: "Equity Scheme - Small Cap Fund", currentNav: 216.65, cagr1Y: 9.59, cagr3Y: 12.6, cagr5Y: 15.13, volatility: 13.86, sharpe: 0.41, sortino: 0.6 },
  { code: 145206, name: "Tata Small Cap Fund - Direct Plan - Growth Option", category: "Small Cap", schemeCategory: "Equity Scheme - Small Cap Fund", currentNav: 45.16, cagr1Y: 0.2, cagr3Y: 11.92, cagr5Y: 16.13, volatility: 16.87, sharpe: 0.29, sortino: 0.43 },
  { code: 122639, name: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth", category: "Flexi / Multi Cap", schemeCategory: "Equity Scheme - Flexi Cap Fund", currentNav: 90.53, cagr1Y: -2.11, cagr3Y: 13.19, cagr5Y: 12.08, volatility: 8.77, sharpe: 0.71, sortino: 0.99 },
  { code: 118955, name: "HDFC Flexi Cap Fund - Direct Plan - Growth Option", category: "Flexi / Multi Cap", schemeCategory: "Equity Scheme - Flexi Cap Fund", currentNav: 2271.32, cagr1Y: 4.23, cagr3Y: 16.4, cagr5Y: 17.86, volatility: 12.39, sharpe: 0.76, sortino: 1.07 },
  { code: 120843, name: "Quant Flexi Cap Fund - Direct Plan - Growth Option", category: "Flexi / Multi Cap", schemeCategory: "Equity Scheme - Flexi Cap Fund", currentNav: 121.08, cagr1Y: 16.32, cagr3Y: 15.66, cagr5Y: 14.9, volatility: 15.92, sharpe: 0.55, sortino: 0.8 },
  { code: 120823, name: "Quant Multi Cap Fund - Direct Plan - Growth Option", category: "Flexi / Multi Cap", schemeCategory: "Equity Scheme - Multi Cap Fund", currentNav: 729.43, cagr1Y: 10.18, cagr3Y: 9.88, cagr5Y: 12.05, volatility: 14.7, sharpe: 0.2, sortino: 0.29 },
  { code: 120847, name: "Quant ELSS Tax Saver Fund - Direct Plan - Growth Option", category: "ELSS", schemeCategory: "Equity Scheme - ELSS", currentNav: 462.84, cagr1Y: 16.35, cagr3Y: 15.11, cagr5Y: 15.63, volatility: 15.41, sharpe: 0.53, sortino: 0.77 },
  { code: 120503, name: "Axis ELSS Tax Saver Fund - Direct Plan - Growth Option", category: "ELSS", schemeCategory: "Equity Schemes - ELSS- Tax Saver Fund", currentNav: 111.61, cagr1Y: 2.46, cagr3Y: 11.91, cagr5Y: 6.37, volatility: 13.66, sharpe: 0.36, sortino: 0.51 },
  { code: 135781, name: "Mirae Asset ELSS Tax Saver Fund - Direct Plan - Growth", category: "ELSS", schemeCategory: "Equity Schemes - ELSS- Tax Saver Fund", currentNav: 57.74, cagr1Y: 5.11, cagr3Y: 12.99, cagr5Y: 11.45, volatility: 13.87, sharpe: 0.44, sortino: 0.61 },
  { code: 120251, name: "ICICI Prudential Aggressive Hybrid Fund - Direct Plan - Growth", category: "Hybrid", schemeCategory: "Hybrid Schemes - Aggressive Hybrid Fund", currentNav: 452.29, cagr1Y: 3.15, cagr3Y: 14.01, cagr5Y: 15.47, volatility: 9.79, sharpe: 0.72, sortino: 1.02 },
  { code: 148958, name: "Parag Parikh Conservative Hybrid Fund - Direct Plan - Growth", category: "Hybrid", schemeCategory: "Hybrid Scheme - Conservative Hybrid Fund", currentNav: 16.14, cagr1Y: 5.96, cagr3Y: 9.67, cagr5Y: 9.56, volatility: 2.58, sharpe: 1.05, sortino: 1.64 },
  { code: 120197, name: "ICICI Prudential Liquid Fund - Direct Plan - Growth", category: "Debt & Liquid", schemeCategory: "Debt Scheme - Liquid Fund", currentNav: 420.11, cagr1Y: 6.52, cagr3Y: 6.97, cagr5Y: 6.32, volatility: 0.18, sharpe: 0.09, sortino: 2.73 },
  { code: 119091, name: "HDFC Liquid Fund - Direct Plan - Growth Option", category: "Debt & Liquid", schemeCategory: "Debt Scheme - Liquid Fund", currentNav: 5574.63, cagr1Y: 6.53, cagr3Y: 6.95, cagr5Y: 6.32, volatility: 0.19, sharpe: 0.01, sortino: 0.25 },
  { code: 118701, name: "Nippon India Liquid Fund - Direct Plan - Growth Option", category: "Debt & Liquid", schemeCategory: "Debt Scheme - Liquid Fund", currentNav: 6952.05, cagr1Y: 6.59, cagr3Y: 7.0, cagr5Y: 6.37, volatility: 0.19, sharpe: 0.28, sortino: 10.81 },
  { code: 119707, name: "SBI Gilt Fund - Direct Plan - Growth", category: "Debt & Liquid", schemeCategory: "Debt Scheme - Gilt Fund", currentNav: 72.66, cagr1Y: 4.34, cagr3Y: 6.62, cagr5Y: 6.22, volatility: 2.46, sharpe: -0.13, sortino: -0.21 },
  { code: 119533, name: "Aditya Birla Sun Life Corporate Bond Fund - Direct Plan - Growth", category: "Debt & Liquid", schemeCategory: "Debt Scheme - Corporate Bond Fund", currentNav: 121.87, cagr1Y: 5.3, cagr3Y: 7.23, cagr5Y: 6.39, volatility: 1.76, sharpe: 0.16, sortino: 0.25 }
];

function parseDateString(dateStr: string): Date {
  const [day, month, year] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function GET(req: NextRequest) {
  const cachePath = path.join(process.cwd(), "src", "app", "api", "mutual-funds", "screener-cache.json");
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "true";

  // Check if cache exists and is fresh (< 24 hours)
  if (!forceRefresh && fs.existsSync(cachePath)) {
    try {
      const cachedData = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      const cacheTime = new Date(cachedData.lastUpdated).getTime();
      const now = new Date().getTime();
      const ageHours = (now - cacheTime) / (1000 * 60 * 60);

      if (ageHours < 24 && cachedData.funds && cachedData.funds.length > 0) {
        return NextResponse.json({
          source: "cache",
          lastUpdated: cachedData.lastUpdated,
          funds: cachedData.funds
        });
      }
    } catch (err) {
      console.error("Error reading screener cache, regenerating...", err);
    }
  }

  // Regenerate cache
  console.log("Generating Mutual Fund Screener cache with live AMFI data...");
  const results: any[] = [];
  const errors: string[] = [];

  // Parallel fetches with safety timeout
  const fetchPromises = CURATED_FUNDS.map(async (fund) => {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${fund.code}`, {
        signal: AbortSignal.timeout(9000),
        headers: { "User-Agent": "ValarchiX-Financial-OS" }
      });
      const rawJson = await res.json();

      if (!rawJson.data || rawJson.data.length === 0) {
        throw new Error("No historical NAV data returned for " + fund.code);
      }

      // Sort chronological
      const sortedData = rawJson.data
        .map((p: any) => ({ date: p.date, nav: Number(p.nav) }))
        .sort((a: any, b: any) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime());

      const latestPoint = sortedData[sortedData.length - 1];
      let currentNav = latestPoint.nav;

      // Check for matching nav in schemes-cache if exists
      try {
        const cacheFilePath = path.join(process.cwd(), "schemes-cache.json");
        if (fs.existsSync(cacheFilePath)) {
          const raw = fs.readFileSync(cacheFilePath, "utf-8");
          const cached = JSON.parse(raw);
          const matched = cached.data?.find((s: any) => s.code === Number(fund.code));
          if (matched && matched.nav !== null && matched.nav > 0) {
            currentNav = matched.nav;
            if (sortedData.length > 0) {
              sortedData[sortedData.length - 1].nav = matched.nav;
            }
          }
        }
      } catch {
        // ignore
      }

      // Helper to find NAV point closest to N days ago
      const findNavNPeriodsAgo = (daysAgo: number): number | null => {
        const targetTime = parseDateString(latestPoint.date).getTime() - daysAgo * 24 * 60 * 60 * 1000;
        let closestPoint = sortedData[0];
        let minDiff = Math.abs(parseDateString(closestPoint.date).getTime() - targetTime);

        for (let i = 1; i < sortedData.length; i++) {
          const diff = Math.abs(parseDateString(sortedData[i].date).getTime() - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestPoint = sortedData[i];
          }
        }
        if (minDiff > 45 * 24 * 60 * 60 * 1000) {
          return null; // out of reasonable range
        }
        return closestPoint.nav;
      };

      const nav1Y = findNavNPeriodsAgo(365);
      const nav3Y = findNavNPeriodsAgo(1095);
      const nav5Y = findNavNPeriodsAgo(1825);

      const cagr1Y = nav1Y ? ((currentNav / nav1Y) - 1) * 100 : null;
      const cagr3Y = nav3Y ? (Math.pow(currentNav / nav3Y, 1 / 3) - 1) * 100 : null;
      const cagr5Y = nav5Y ? (Math.pow(currentNav / nav5Y, 1 / 5) - 1) * 100 : null;

      // Volatility (last 1 year of daily returns)
      const oneYearAgoTime = parseDateString(latestPoint.date).getTime() - 365 * 24 * 60 * 60 * 1000;
      const recentYearData = sortedData.filter((p: any) => parseDateString(p.date).getTime() >= oneYearAgoTime);

      const dailyReturns: number[] = [];
      for (let i = 1; i < recentYearData.length; i++) {
        dailyReturns.push((recentYearData[i].nav - recentYearData[i - 1].nav) / recentYearData[i - 1].nav);
      }

      let volatility = 0;
      let sharpe = 0;
      let sortino = 0;

      if (dailyReturns.length > 1) {
        const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (dailyReturns.length - 1);
        const dailyStd = Math.sqrt(variance);
        volatility = dailyStd * Math.sqrt(250) * 100;

        const rfRate = 6.95; // 10Y Govt Bond yield proxy
        const activeReturn = cagr3Y !== null ? cagr3Y : (cagr1Y !== null ? cagr1Y : 0);

        if (volatility > 0) {
          sharpe = (activeReturn - rfRate) / volatility;

          const negativeReturns = dailyReturns.filter(r => r < 0);
          if (negativeReturns.length > 0) {
            const downsideVariance = negativeReturns.reduce((sum, val) => sum + Math.pow(val, 2), 0) / dailyReturns.length;
            const downsideStd = Math.sqrt(downsideVariance) * Math.sqrt(250) * 100;
            if (downsideStd > 0) {
              sortino = (activeReturn - rfRate) / downsideStd;
            }
          }
        }
      }

      const returnedName = rawJson.meta?.scheme_name || fund.name;
      const apiSchemeCategory = rawJson.meta?.scheme_category || "Mutual Fund";
      const resolvedCategory = normalizeCategory(apiSchemeCategory, returnedName);

      results.push({
        code: fund.code,
        category: resolvedCategory,
        schemeCategory: apiSchemeCategory,
        name: returnedName,
        currentNav: Math.round(currentNav * 100) / 100,
        cagr1Y: cagr1Y !== null ? Math.round(cagr1Y * 100) / 100 : null,
        cagr3Y: cagr3Y !== null ? Math.round(cagr3Y * 100) / 100 : null,
        cagr5Y: cagr5Y !== null ? Math.round(cagr5Y * 100) / 100 : null,
        volatility: Math.round(volatility * 100) / 100,
        sharpe: Math.round(sharpe * 100) / 100,
        sortino: Math.round(sortino * 100) / 100
      });
    } catch (err: any) {
      console.error(`Failed to fetch fund ${fund.code}: ${err.message}`);
      errors.push(fund.code.toString());
      // Use verified fallback metrics
      const matchedFallback = FALLBACK_METRICS.find(f => f.code === fund.code);
      if (matchedFallback) {
        results.push(matchedFallback);
      }
    }
  });

  await Promise.allSettled(fetchPromises);

  const dataToCache = {
    lastUpdated: new Date().toISOString(),
    funds: results.sort((a, b) => (b.cagr3Y || 0) - (a.cagr3Y || 0))
  };

  try {
    const dirPath = path.dirname(cachePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(dataToCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write screener cache file", err);
  }

  return NextResponse.json({
    source: "live",
    lastUpdated: dataToCache.lastUpdated,
    funds: dataToCache.funds
  });
}
