import { NextResponse } from "next/server";

export async function GET() {
  // Current real-world economic benchmarks for India
  // Policy Repo Rate: 6.50% (RBI Monetary Policy Committee standard)
  // 10-Year Sovereign Bond Yield: ~6.95% (India Government Bond Benchmark)
  // Standard Inflation Baseline: 7.00% (Prudent long-term Indian household & lifestyle inflation)
  // Optimal Post-Tax Equity Compounding: 10.00% (Net realized after 12.5% LTCG tax & TER drag)
  const rates = {
    repoRate: 6.50,
    bondYield10Y: 6.95,
    inflationRate: 7.0,
    equityPostTaxReturn: 10.0,
    lastUpdated: new Date().toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric"
    })
  };

  return NextResponse.json(rates);
}
