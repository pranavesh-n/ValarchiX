import {
  HISTORICAL_DATABASE,
  MonthlyDataPoint,
  AssetClassKey,
  getHistoricalSlice
} from "./historicalData";

export interface AllocationConfig {
  equity: number;
  niftyNext50: number;
  international: number;
  debt: number;
  gold: number;
  ppf: number;
  liquid: number;
  cash: number;
}

export interface SimulationConfig {
  monthlySip: number;
  lumpSum: number;
  startYear: number;
  endYear: number;
  allocation: AllocationConfig;
  annualStepUpPct?: number; // e.g. 10 = 10% annual increase in SIP
  rebalanceAnnual?: boolean;
  pauseSipMonths?: number;  // Pause SIP for X months midway
  bonusYearly?: number;     // Lump sum added every December
}

export interface MonthlyResultPoint {
  dateStr: string;
  year: number;
  month: number;
  monthlyInvested: number;
  cumulativeInvested: number;
  portfolioValue: number;
  monthlyReturnPct: number;
  peakValue: number;
  drawdownPct: number;
  assetValues: Record<AssetClassKey, number>;
}

export interface YearResultPoint {
  year: number;
  investedDuringYear: number;
  cumulativeInvested: number;
  yearEndValue: number;
  annualReturnPct: number;
  drawdownInYearPct: number;
}

export interface RollingReturnStats {
  periodYears: number;
  min: number;
  max: number;
  average: number;
  median: number;
  positiveRatioPct: number;
}

export interface SimulationOutput {
  config: SimulationConfig;
  timeline: MonthlyResultPoint[];
  annualBreakdown: YearResultPoint[];
  totalInvested: number;
  finalValue: number;
  totalGain: number;
  absoluteReturnPct: number;
  cagrPct: number;
  xirrPct: number;
  annualizedVolatilityPct: number;
  maxDrawdownPct: number;
  maxDrawdownPeriod: { peakDate: string; troughDate: string; recoveryDate: string | null };
  maxRecoveryMonths: number;
  bestYear: { year: number; returnPct: number };
  worstYear: { year: number; returnPct: number };
  sharpeRatio: number;
  sortinoRatio: number;
  rollingReturns: {
    threeYear: RollingReturnStats;
    fiveYear: RollingReturnStats;
    tenYear?: RollingReturnStats;
  };
}

import { calculateXirrDetailed } from "../engine/xirr";

/**
 * Solves XIRR numerically using robust Brent-Dekker engine
 */
export function calculateXIRR(cashFlows: { date: Date; amount: number }[]): number {
  if (cashFlows.length < 2) return 0;
  const res = calculateXirrDetailed(cashFlows);
  return res.success ? Math.round(res.rate * 10000) / 100 : 0;
}

/**
 * Primary Historical Simulation Core Engine
 */
export function runPortfolioSimulation(config: SimulationConfig): SimulationOutput {
  const slice = getHistoricalSlice(config.startYear, config.endYear);
  if (slice.length === 0) {
    throw new Error(`No historical data available for range ${config.startYear} - ${config.endYear}`);
  }

  const keys: AssetClassKey[] = [
    "equity",
    "niftyNext50",
    "international",
    "debt",
    "gold",
    "ppf",
    "liquid",
    "cash"
  ];

  // Normalize weights to sum = 1.0
  const totalWeight = keys.reduce((sum, k) => sum + (config.allocation[k] || 0), 0);
  const weights: Record<AssetClassKey, number> = {} as any;
  keys.forEach((k) => {
    weights[k] = totalWeight > 0 ? (config.allocation[k] || 0) / totalWeight : 0;
  });

  // Units held for index-based assets, cash balance for interest-based assets
  const assetUnits: Record<AssetClassKey, number> = {
    equity: 0,
    niftyNext50: 0,
    international: 0,
    debt: 0,
    gold: 0,
    ppf: 0,
    liquid: 0,
    cash: 0
  };

  const cashFlows: { date: Date; amount: number }[] = [];
  const timeline: MonthlyResultPoint[] = [];

  let cumulativeInvested = 0;
  let currentMonthlySip = config.monthlySip;
  let peakValue = 0;
  let maxDrawdownPct = 0;
  let currentDrawdownMonths = 0;
  let maxRecoveryMonths = 0;

  let peakDate = slice[0].dateStr;
  let troughDate = slice[0].dateStr;
  let recoveryDate: string | null = null;
  let currentTroughPct = 0;

  // Month-by-month backtest loop
  slice.forEach((point, idx) => {
    // Annual Step-Up check at month 0 (January) except year 1
    if (idx > 0 && point.month === 0 && config.annualStepUpPct && config.annualStepUpPct > 0) {
      currentMonthlySip *= (1 + config.annualStepUpPct / 100);
    }

    let monthlyInvestment = 0;

    // Initial Lump Sum injection in month 0
    if (idx === 0 && config.lumpSum > 0) {
      monthlyInvestment += config.lumpSum;
    }

    // Monthly SIP injection (unless paused)
    const isPaused = config.pauseSipMonths && idx >= 12 && idx < 12 + config.pauseSipMonths;
    if (!isPaused && currentMonthlySip > 0) {
      monthlyInvestment += currentMonthlySip;
    }

    // Optional Annual Bonus injection in December
    if (point.month === 11 && config.bonusYearly && config.bonusYearly > 0) {
      monthlyInvestment += config.bonusYearly;
    }

    if (monthlyInvestment > 0) {
      cumulativeInvested += monthlyInvestment;
      const [y, m] = point.dateStr.split("-").map(Number);
      cashFlows.push({ date: new Date(y, m - 1, 1), amount: -monthlyInvestment });

      // Buy assets according to target allocation
      keys.forEach((k) => {
        const allocatedAmount = monthlyInvestment * weights[k];
        if (allocatedAmount > 0) {
          if (k === "ppf" || k === "liquid" || k === "cash") {
            assetUnits[k] += allocatedAmount;
          } else {
            const price = point[k] as number;
            if (price > 0) assetUnits[k] += allocatedAmount / price;
          }
        }
      });
    }

    // Interest accrual for PPF, Liquid, Cash for this month
    assetUnits.ppf *= (1 + point.ppfRate / 100 / 12);
    assetUnits.liquid *= (1 + point.liquidRate / 100 / 12);
    assetUnits.cash *= (1 + point.cashRate / 100 / 12);

    // Annual rebalancing (if enabled) at end of December
    if (config.rebalanceAnnual && point.month === 11) {
      const currentTotalVal = keys.reduce((sum, k) => {
        if (k === "ppf" || k === "liquid" || k === "cash") return sum + assetUnits[k];
        return sum + assetUnits[k] * (point[k] as number);
      }, 0);

      keys.forEach((k) => {
        const targetVal = currentTotalVal * weights[k];
        if (k === "ppf" || k === "liquid" || k === "cash") {
          assetUnits[k] = targetVal;
        } else {
          const price = point[k] as number;
          if (price > 0) assetUnits[k] = targetVal / price;
        }
      });
    }

    // Calculate month-end valuation
    const assetValues: Record<AssetClassKey, number> = {
      equity: assetUnits.equity * point.equity,
      niftyNext50: assetUnits.niftyNext50 * point.niftyNext50,
      international: assetUnits.international * point.international,
      debt: assetUnits.debt * point.debt,
      gold: assetUnits.gold * point.gold,
      ppf: assetUnits.ppf,
      liquid: assetUnits.liquid,
      cash: assetUnits.cash
    };

    const portfolioValue = keys.reduce((sum, k) => sum + assetValues[k], 0);

    // Peak and Drawdown analysis
    if (portfolioValue > peakValue) {
      if (currentDrawdownMonths > maxRecoveryMonths) {
        maxRecoveryMonths = currentDrawdownMonths;
        recoveryDate = point.dateStr;
      }
      peakValue = portfolioValue;
      peakDate = point.dateStr;
      currentDrawdownMonths = 0;
    } else {
      currentDrawdownMonths++;
    }

    const drawdownPct = peakValue > 0 ? ((peakValue - portfolioValue) / peakValue) * 100 : 0;
    if (drawdownPct > maxDrawdownPct) {
      maxDrawdownPct = drawdownPct;
      troughDate = point.dateStr;
      currentTroughPct = drawdownPct;
    }

    const prevValue = idx > 0 ? timeline[idx - 1].portfolioValue : cumulativeInvested;
    const monthlyReturnPct = prevValue > 0 ? ((portfolioValue - (prevValue + monthlyInvestment)) / prevValue) * 100 : 0;

    timeline.push({
      dateStr: point.dateStr,
      year: point.year,
      month: point.month,
      monthlyInvested: monthlyInvestment,
      cumulativeInvested,
      portfolioValue: Math.round(portfolioValue),
      monthlyReturnPct: Math.round(monthlyReturnPct * 100) / 100,
      peakValue: Math.round(peakValue),
      drawdownPct: Math.round(drawdownPct * 100) / 100,
      assetValues: {
        equity: Math.round(assetValues.equity),
        niftyNext50: Math.round(assetValues.niftyNext50),
        international: Math.round(assetValues.international),
        debt: Math.round(assetValues.debt),
        gold: Math.round(assetValues.gold),
        ppf: Math.round(assetValues.ppf),
        liquid: Math.round(assetValues.liquid),
        cash: Math.round(assetValues.cash)
      }
    });
  });

  const finalPoint = timeline[timeline.length - 1];
  const finalValue = finalPoint.portfolioValue;
  const totalInvested = finalPoint.cumulativeInvested;
  const totalGain = finalValue - totalInvested;
  const absoluteReturnPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Add final portfolio cash flow entry for XIRR computation
  const [lastY, lastM] = finalPoint.dateStr.split("-").map(Number);
  cashFlows.push({ date: new Date(lastY, lastM - 1, 28), amount: finalValue });

  const xirrPct = calculateXIRR(cashFlows);

  // CAGR calculation
  const totalYears = slice.length / 12;
  const cagrPct = totalInvested > 0 && totalYears > 0
    ? (Math.pow(finalValue / totalInvested, 1 / totalYears) - 1) * 100
    : 0;

  // Monthly Returns & Volatility
  const monthlyReturns = timeline.map((t) => t.monthlyReturnPct);
  const avgMonthlyReturn = monthlyReturns.reduce((sum, r) => sum + r, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - avgMonthlyReturn, 2), 0) / (monthlyReturns.length - 1);
  const monthlyStdDev = Math.sqrt(variance);
  const annualizedVolatilityPct = monthlyStdDev * Math.sqrt(12);

  // Sharpe & Sortino Ratios (Assumed 6.0% risk free rate)
  const riskFreeRate = 6.0;
  const excessReturn = cagrPct - riskFreeRate;
  const sharpeRatio = annualizedVolatilityPct > 0 ? excessReturn / annualizedVolatilityPct : 0;

  const downsideReturns = monthlyReturns.filter((r) => r < 0);
  const downsideVariance = downsideReturns.length > 0
    ? downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length
    : 1e-4;
  const downsideVolatilityPct = Math.sqrt(downsideVariance) * Math.sqrt(12);
  const sortinoRatio = downsideVolatilityPct > 0 ? excessReturn / downsideVolatilityPct : 0;

  // Annual Breakdown
  const years = Array.from(new Set(timeline.map((t) => t.year)));
  const annualBreakdown: YearResultPoint[] = years.map((yr) => {
    const pointsInYear = timeline.filter((t) => t.year === yr);
    const startVal = pointsInYear[0].portfolioValue - pointsInYear[0].monthlyInvested;
    const endVal = pointsInYear[pointsInYear.length - 1].portfolioValue;
    const investedDuringYear = pointsInYear.reduce((sum, p) => sum + p.monthlyInvested, 0);
    const cumulativeInvestedYear = pointsInYear[pointsInYear.length - 1].cumulativeInvested;
    
    const baseForReturn = startVal + investedDuringYear;
    const returnPct = baseForReturn > 0 ? ((endVal - baseForReturn) / baseForReturn) * 100 : 0;
    const maxDrawdownInYear = Math.max(...pointsInYear.map((p) => p.drawdownPct));

    return {
      year: yr,
      investedDuringYear,
      cumulativeInvested: cumulativeInvestedYear,
      yearEndValue: endVal,
      annualReturnPct: Math.round(returnPct * 100) / 100,
      drawdownInYearPct: Math.round(maxDrawdownInYear * 100) / 100
    };
  });

  // Best and Worst Years
  let bestYear = { year: annualBreakdown[0]?.year || config.startYear, returnPct: -999 };
  let worstYear = { year: annualBreakdown[0]?.year || config.startYear, returnPct: 999 };

  annualBreakdown.forEach((ab) => {
    if (ab.annualReturnPct > bestYear.returnPct) bestYear = { year: ab.year, returnPct: ab.annualReturnPct };
    if (ab.annualReturnPct < worstYear.returnPct) worstYear = { year: ab.year, returnPct: ab.annualReturnPct };
  });

  // Rolling Returns helper
  function computeRollingStats(windowYears: number): RollingReturnStats {
    const windowMonths = windowYears * 12;
    if (timeline.length < windowMonths) {
      return { periodYears: windowYears, min: 0, max: 0, average: 0, median: 0, positiveRatioPct: 100 };
    }

    const cagrs: number[] = [];
    for (let i = 0; i <= timeline.length - windowMonths; i++) {
      const startPt = timeline[i];
      const endPt = timeline[i + windowMonths - 1];
      const startV = startPt.portfolioValue;
      const endV = endPt.portfolioValue;
      if (startV > 0) {
        const cagr = (Math.pow(endV / startV, 1 / windowYears) - 1) * 100;
        cagrs.push(cagr);
      }
    }

    cagrs.sort((a, b) => a - b);
    const min = Math.round(cagrs[0] * 100) / 100;
    const max = Math.round(cagrs[cagrs.length - 1] * 100) / 100;
    const avg = Math.round((cagrs.reduce((s, c) => s + c, 0) / cagrs.length) * 100) / 100;
    const median = Math.round(cagrs[Math.floor(cagrs.length / 2)] * 100) / 100;
    const positiveCount = cagrs.filter((c) => c > 0).length;
    const positiveRatioPct = Math.round((positiveCount / cagrs.length) * 1000) / 10;

    return { periodYears: windowYears, min, max, average: avg, median, positiveRatioPct };
  }

  return {
    config,
    timeline,
    annualBreakdown,
    totalInvested: Math.round(totalInvested),
    finalValue: Math.round(finalValue),
    totalGain: Math.round(totalGain),
    absoluteReturnPct: Math.round(absoluteReturnPct * 100) / 100,
    cagrPct: Math.round(cagrPct * 100) / 100,
    xirrPct: Math.round(xirrPct * 100) / 100,
    annualizedVolatilityPct: Math.round(annualizedVolatilityPct * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdownPct * 100) / 100,
    maxDrawdownPeriod: { peakDate, troughDate, recoveryDate },
    maxRecoveryMonths,
    bestYear,
    worstYear,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    sortinoRatio: Math.round(sortinoRatio * 100) / 100,
    rollingReturns: {
      threeYear: computeRollingStats(3),
      fiveYear: computeRollingStats(5),
      tenYear: timeline.length >= 120 ? computeRollingStats(10) : undefined
    }
  };
}
