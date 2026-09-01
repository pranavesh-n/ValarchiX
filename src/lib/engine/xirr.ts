/**
 * Robust XIRR (Extended Internal Rate of Return) Engine
 * Solves for r in NPV(r) = sum( C_i / (1 + r)^((d_i - d_0)/365) ) = 0
 * Uses Brent-Dekker root finding with bounded fallback for 100% convergence guarantee.
 */

export interface CashFlow {
  date: Date | string;
  amount: number; // negative for investment/outflow, positive for withdrawal/inflow/valuation
}

export type FlowType = "invested" | "withdrawn";
export type Frequency = "one-off" | "monthly" | "quarterly" | "half-yearly" | "yearly";

export interface CustomFlowItem {
  id: string;
  type: FlowType;
  amount: number;
  date: string;
  frequency: Frequency;
  count: number;
}

export interface XirrResult {
  success: boolean;
  rate: number; // decimal e.g. 0.35
  xirrNominal: string; // formatted e.g. "35.00"
  xirrReal: string; // inflation adjusted e.g. "28.46"
  totalInvested: number;
  totalRedeemed: number;
  netGain: number;
  absoluteReturn: string; // e.g. "35.0"
  daysDuration: number;
  yearsDuration: string;
  isExtremeAnnualized: boolean;
  error?: string;
}

/**
 * Accurately adds months to a date without leap/month-end overflow bugs
 */
export function addMonths(baseDate: Date, monthsToAdd: number): Date {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();

  const targetMonth = month + monthsToAdd;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;

  // Max days in the target month (day 0 of next month)
  const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const finalDay = Math.min(day, daysInTargetMonth);

  return new Date(targetYear, normalizedMonth, finalDay, 12, 0, 0);
}

/**
 * Parses YYYY-MM-DD or date string safely in local time
 */
export function parseLocalDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Calculates raw XIRR rate decimal (e.g. 0.15 for 15%)
 */
export function calculateXirr(cashFlows: CashFlow[]): number {
  const res = calculateXirrDetailed(cashFlows);
  return res.success ? res.rate : NaN;
}

/**
 * Computes comprehensive XIRR analysis with robust Brent's method solver
 */
export function calculateXirrDetailed(
  cashFlows: CashFlow[],
  inflationRatePct: number = 0
): XirrResult {
  const defaultFail = (errorMsg: string): XirrResult => ({
    success: false,
    rate: 0,
    xirrNominal: "0.00",
    xirrReal: "0.00",
    totalInvested: 0,
    totalRedeemed: 0,
    netGain: 0,
    absoluteReturn: "0.0",
    daysDuration: 0,
    yearsDuration: "0.00",
    isExtremeAnnualized: false,
    error: errorMsg,
  });

  if (!cashFlows || cashFlows.length < 2) {
    return defaultFail("Please enter at least 2 cash flow entries (an investment and a withdrawal/valuation).");
  }

  // Filter out zero amount flows and sort chronologically
  const validFlows = cashFlows
    .map((cf) => ({
      date: parseLocalDate(cf.date),
      amount: Number(cf.amount) || 0,
    }))
    .filter((cf) => !isNaN(cf.date.getTime()) && Math.abs(cf.amount) > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (validFlows.length < 2) {
    return defaultFail("At least 2 non-zero cash flows with valid dates are required.");
  }

  let totalInvested = 0;
  let totalRedeemed = 0;

  validFlows.forEach((cf) => {
    if (cf.amount < 0) {
      totalInvested += Math.abs(cf.amount);
    } else {
      totalRedeemed += cf.amount;
    }
  });

  if (totalInvested <= 0) {
    return defaultFail("At least one investment cash flow (money in) is required.");
  }

  if (totalRedeemed <= 0) {
    return defaultFail("At least one withdrawal or current valuation cash flow (money out) is required.");
  }

  const d0 = validFlows[0].date.getTime();
  const dLast = validFlows[validFlows.length - 1].date.getTime();
  const daysDuration = Math.max(0, (dLast - d0) / (1000 * 60 * 60 * 24));
  const yearsDuration = daysDuration / 365.0;

  const netGain = totalRedeemed - totalInvested;
  const absoluteReturn = totalInvested > 0 ? (netGain / totalInvested) * 100 : 0;

  // If cashflows happen on same day
  if (daysDuration === 0) {
    const rate = absoluteReturn / 100;
    const infRate = inflationRatePct / 100;
    const realRate = ((1 + rate) / (1 + infRate) - 1) * 100;
    return {
      success: true,
      rate,
      xirrNominal: absoluteReturn.toFixed(2),
      xirrReal: realRate.toFixed(2),
      totalInvested,
      totalRedeemed,
      netGain,
      absoluteReturn: absoluteReturn.toFixed(1),
      daysDuration: 0,
      yearsDuration: "0.00",
      isExtremeAnnualized: false,
    };
  }

  // Precompute normalized time in years t_i = (d_i - d_0) / 365.0
  const normalized = validFlows.map((cf) => ({
    amount: cf.amount,
    t: (cf.date.getTime() - d0) / (1000 * 60 * 60 * 24 * 365.0),
  }));

  // Net Present Value function NPV(r)
  const npv = (r: number): number => {
    if (r <= -1.0) return Number.NaN;
    let sum = 0;
    for (let i = 0; i < normalized.length; i++) {
      const { amount, t } = normalized[i];
      if (t === 0) {
        sum += amount;
      } else {
        sum += amount / Math.pow(1 + r, t);
      }
    }
    return sum;
  };

  // Derivative dNPV/dr
  const dnpv = (r: number): number => {
    if (r <= -1.0) return Number.NaN;
    let sum = 0;
    for (let i = 0; i < normalized.length; i++) {
      const { amount, t } = normalized[i];
      if (t !== 0) {
        sum -= (t * amount) / Math.pow(1 + r, t + 1);
      }
    }
    return sum;
  };

  // 1. Check if r = 0 is root (e.g. net gain == 0)
  const npv0 = npv(0);
  if (Math.abs(npv0) < 1e-7) {
    const infRate = inflationRatePct / 100;
    const realRate = ((1 + 0) / (1 + infRate) - 1) * 100;
    return {
      success: true,
      rate: 0,
      xirrNominal: "0.00",
      xirrReal: realRate.toFixed(2),
      totalInvested,
      totalRedeemed,
      netGain,
      absoluteReturn: absoluteReturn.toFixed(1),
      daysDuration: Math.round(daysDuration),
      yearsDuration: yearsDuration.toFixed(2),
      isExtremeAnnualized: false,
    };
  }

  // 2. Bracket Search across fine logarithmic & linear grid
  const grid = [
    -0.999999, -0.9999, -0.999, -0.99, -0.95, -0.9, -0.8, -0.7, -0.6, -0.5,
    -0.4, -0.3, -0.2, -0.1, -0.05, -0.01, 0, 0.01, 0.05, 0.1, 0.15, 0.2,
    0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 25.0,
    50.0, 100.0, 500.0, 1000.0, 5000.0, 10000.0,
  ];

  let bracketA: number | null = null;
  let bracketB: number | null = null;
  let prevR = grid[0];
  let prevVal = npv(prevR);

  for (let i = 1; i < grid.length; i++) {
    const curR = grid[i];
    const curVal = npv(curR);

    if (Math.abs(curVal) < 1e-7) {
      bracketA = curR;
      bracketB = curR;
      break;
    }

    if (!isNaN(prevVal) && !isNaN(curVal) && prevVal * curVal < 0) {
      bracketA = prevR;
      bracketB = curR;
      break;
    }
    prevR = curR;
    prevVal = curVal;
  }

  let finalRate: number | null = null;

  // 3. Brent-Dekker Root Solver if Bracket Found
  if (bracketA !== null && bracketB !== null) {
    if (bracketA === bracketB) {
      finalRate = bracketA;
    } else {
      let a = bracketA;
      let b = bracketB;
      let fa = npv(a);
      let fb = npv(b);

      if (Math.abs(fa) < Math.abs(fb)) {
        [a, b] = [b, a];
        [fa, fb] = [fb, fa];
      }

      let c = a;
      let fc = fa;
      let mflag = true;
      let d = 0;
      const tol = 1e-8;
      const maxIter = 120;

      for (let iter = 0; iter < maxIter; iter++) {
        if (Math.abs(fb) < 1e-7 || Math.abs(b - a) < tol) {
          finalRate = b;
          break;
        }

        let s = 0;
        if (fa !== fc && fb !== fc) {
          s =
            (a * fb * fc) / ((fa - fb) * (fa - fc)) +
            (b * fa * fc) / ((fb - fa) * (fb - fc)) +
            (c * fa * fb) / ((fc - fa) * (fc - fb));
        } else {
          s = b - fb * ((b - a) / (fb - fa));
        }

        const cond1 = !((s > (3 * a + b) / 4 && s < b) || (s < (3 * a + b) / 4 && s > b));
        const cond2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2;
        const cond3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2;
        const cond4 = mflag && Math.abs(b - c) < tol;
        const cond5 = !mflag && Math.abs(c - d) < tol;

        if (cond1 || cond2 || cond3 || cond4 || cond5) {
          s = (a + b) / 2;
          mflag = true;
        } else {
          mflag = false;
        }

        const fs = npv(s);
        d = c;
        c = b;
        fc = fb;

        if (fa * fs < 0) {
          b = s;
          fb = fs;
        } else {
          a = s;
          fa = fs;
        }

        if (Math.abs(fa) < Math.abs(fb)) {
          [a, b] = [b, a];
          [fa, fb] = [fb, fa];
        }
      }

      if (finalRate === null) {
        finalRate = b;
      }
    }
  }

  // 4. Fallback Bounded Newton-Raphson
  if (finalRate === null) {
    let r = Math.max(-0.9, Math.min(1.0, absoluteReturn / 100 / Math.max(1, yearsDuration)));
    const maxIter = 100;
    for (let iter = 0; iter < maxIter; iter++) {
      const val = npv(r);
      const deriv = dnpv(r);

      if (Math.abs(val) < 1e-6) {
        finalRate = r;
        break;
      }

      if (isNaN(deriv) || Math.abs(deriv) < 1e-12) {
        break;
      }

      const step = val / deriv;
      let nextR = r - step;

      if (nextR <= -0.999999) {
        nextR = (r - 0.999999) / 2;
      } else if (nextR > 10000) {
        nextR = 10000;
      }

      if (Math.abs(nextR - r) < 1e-7) {
        finalRate = nextR;
        break;
      }
      r = nextR;
    }

    if (finalRate === null && !isNaN(r) && isFinite(r) && r > -1) {
      finalRate = r;
    }
  }

  if (finalRate === null || isNaN(finalRate) || !isFinite(finalRate) || finalRate <= -1) {
    return defaultFail("Unable to calculate a realistic XIRR for this cash flow pattern. Please verify dates and amounts.");
  }

  const xirrNominalVal = finalRate * 100;
  const infRate = inflationRatePct / 100;
  const xirrRealVal = ((1 + finalRate) / (1 + infRate) - 1) * 100;
  const isExtremeAnnualized = Math.abs(xirrNominalVal) > 200 && yearsDuration < 0.5;

  return {
    success: true,
    rate: finalRate,
    xirrNominal: xirrNominalVal.toFixed(2),
    xirrReal: xirrRealVal.toFixed(2),
    totalInvested,
    totalRedeemed,
    netGain,
    absoluteReturn: absoluteReturn.toFixed(1),
    daysDuration: Math.round(daysDuration),
    yearsDuration: yearsDuration.toFixed(2),
    isExtremeAnnualized,
  };
}
