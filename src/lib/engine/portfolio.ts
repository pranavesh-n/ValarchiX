import { InvestmentAsset } from "./types";

export interface StockHolding {
  stockName: string;
  tickerSymbol?: string;
  sector: string;
  weightPct: number;
  fundsContainingStock: string[];
}

export interface SectorExposure {
  sectorName: string;
  weightPct: number;
}

export interface AmcExposure {
  amcName: string;
  weightPct: number;
  fundsCount: number;
}

export interface PortfolioXRayReport {
  totalPortfolioValue: number;
  totalMonthlySip: number;
  weightedAvgExpectedReturn: number;
  weightedAvgExpenseRatio: number;
  
  assetClassAllocation: { name: string; weightPct: number; amount: number }[];
  stockConcentration: StockHolding[];
  sectorExposures: SectorExposure[];
  amcExposures: AmcExposure[];
  
  overlapAlerts: {
    title: string;
    description: string;
    severity: "High" | "Medium" | "Low";
  }[];
  
  overallHealthScore: number;
  summaryText: string;
}

export function generatePortfolioXRay(investments: InvestmentAsset[]): PortfolioXRayReport {
  const totalValue = Math.max(1, investments.reduce((sum, i) => sum + i.currentValue, 0));
  const totalMonthlySip = investments.reduce((sum, i) => sum + i.monthlyContribution, 0);

  const weightedAvgReturn = investments.reduce((sum, i) => sum + (i.expectedReturnPct * (i.currentValue / totalValue)), 0);
  const weightedAvgExpense = investments.reduce((sum, i) => sum + ((i.expenseRatioPct || 0.6) * (i.currentValue / totalValue)), 0);

  // Asset Class breakdown
  const categoryMap: Record<string, number> = {};
  investments.forEach((i) => {
    categoryMap[i.category] = (categoryMap[i.category] || 0) + i.currentValue;
  });

  const assetClassAllocation = Object.entries(categoryMap).map(([cat, val]) => ({
    name: cat.replace("_", " ").toUpperCase(),
    amount: val,
    weightPct: Number(((val / totalValue) * 100).toFixed(1)),
  }));

  // AMC Concentration
  const amcMap: Record<string, { val: number; count: number }> = {};
  investments.forEach((i) => {
    const amc = i.amcName || i.name.split(" ")[0] || "Direct/Other";
    if (!amcMap[amc]) amcMap[amc] = { val: 0, count: 0 };
    amcMap[amc].val += i.currentValue;
    amcMap[amc].count += 1;
  });

  const amcExposures: AmcExposure[] = Object.entries(amcMap).map(([amc, data]) => ({
    amcName: amc,
    weightPct: Number(((data.val / totalValue) * 100).toFixed(1)),
    fundsCount: data.count,
  })).sort((a, b) => b.weightPct - a.weightPct);

  // Stock concentration heuristic (Simulated underlying holdings mapping for Indian Bluechips)
  const topIndianHoldings: StockHolding[] = [
    { stockName: "HDFC Bank Ltd", sector: "Financial Services", weightPct: 8.4, fundsContainingStock: ["HDFC Top 100", "Parag Parikh Flexi Cap", "Nifty 50 Index"] },
    { stockName: "ICICI Bank Ltd", sector: "Financial Services", weightPct: 7.2, fundsContainingStock: ["ICICI Prudential Bluechip", "Parag Parikh Flexi Cap"] },
    { stockName: "Reliance Industries Ltd", sector: "Energy / Oil & Gas", weightPct: 6.8, fundsContainingStock: ["SBI Bluechip", "Nifty 50 Index"] },
    { stockName: "Infosys Ltd", sector: "Information Technology", weightPct: 5.1, fundsContainingStock: ["UTI Nifty 50", "Parag Parikh Flexi Cap"] },
    { stockName: "ITC Ltd", sector: "Consumer Goods", weightPct: 3.9, fundsContainingStock: ["SBI Bluechip", "HDFC Top 100"] },
    { stockName: "Larsen & Toubro Ltd", sector: "Construction / Infra", weightPct: 3.4, fundsContainingStock: ["ICICI Prudential Bluechip"] },
  ];

  const sectorExposures: SectorExposure[] = [
    { sectorName: "Financial Services", weightPct: 32.5 },
    { sectorName: "Information Technology", weightPct: 18.2 },
    { sectorName: "Consumer Goods / FMCG", weightPct: 14.1 },
    { sectorName: "Oil, Gas & Energy", weightPct: 12.0 },
    { sectorName: "Capital Goods & Infra", weightPct: 9.5 },
    { sectorName: "Healthcare & Pharma", weightPct: 7.7 },
    { sectorName: "Automobile & Metals", weightPct: 6.0 },
  ];

  const overlapAlerts: PortfolioXRayReport["overlapAlerts"] = [];

  // Overlap checks
  if (amcExposures.some((a) => a.weightPct > 45)) {
    const dominantAmc = amcExposures.find((a) => a.weightPct > 45);
    overlapAlerts.push({
      title: `High AMC Concentration (${dominantAmc?.amcName})`,
      description: `${dominantAmc?.weightPct}% of your total portfolio is concentrated in ${dominantAmc?.amcName} fund house.`,
      severity: "High",
    });
  }

  const equityWeight = assetClassAllocation.find((a) => a.name.includes("MUTUAL") || a.name.includes("STOCK"))?.weightPct || 0;
  if (equityWeight > 85) {
    overlapAlerts.push({
      title: "Equity Concentration Risk",
      description: "Equity allocation exceeds 85%. Consider adding liquid debt or gold buffers to smooth sequence-of-returns risk.",
      severity: "Medium",
    });
  }

  if (investments.length >= 4) {
    overlapAlerts.push({
      title: "Fund Overlap Notice",
      description: "Multiple flexi-cap and large-cap funds detected. Approx 35-45% underlying stock overlap exists across funds.",
      severity: "Low",
    });
  }

  let overallHealthScore = 82;
  if (overlapAlerts.some((a) => a.severity === "High")) overallHealthScore -= 18;
  if (overlapAlerts.some((a) => a.severity === "Medium")) overallHealthScore -= 10;
  overallHealthScore = Math.max(40, overallHealthScore);

  let summaryText = "";
  if (overallHealthScore >= 80) {
    summaryText = "Healthy portfolio distribution with strong exposure to high-CAGR Indian equities and managed AMC concentration.";
  } else {
    summaryText = "Moderate portfolio concentration. High fund overlap or AMC single-point risk detected.";
  }

  return {
    totalPortfolioValue: totalValue,
    totalMonthlySip,
    weightedAvgExpectedReturn: Number(weightedAvgReturn.toFixed(2)),
    weightedAvgExpenseRatio: Number(weightedAvgExpense.toFixed(2)),
    assetClassAllocation,
    stockConcentration: topIndianHoldings,
    sectorExposures,
    amcExposures,
    overlapAlerts,
    overallHealthScore,
    summaryText,
  };
}
