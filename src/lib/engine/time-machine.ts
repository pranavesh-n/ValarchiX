import { FinancialDigitalTwin, TimeMachineUniverse } from "./types";

export function simulateTimeMachine(
  twin: FinancialDigitalTwin,
  customUniverses?: TimeMachineUniverse[]
): TimeMachineUniverse[] {
  const currentYear = new Date().getFullYear();
  const yearsToSimulate = 20;

  const totalMonthlySip = twin.investments.reduce((sum, i) => sum + i.monthlyContribution, 0);
  const currentInvestedVal = twin.investments.reduce((sum, i) => sum + i.currentValue, 0);
  const baseReturn = 0.12; // 12% CAGR base assumption
  const baseInflation = 0.06; // 6% CPI inflation

  // Define default universes if custom ones not passed
  const defaultUniverses: { id: string; name: string; description: string; color: string; params: TimeMachineUniverse["parameters"] }[] = [
    {
      id: "reality",
      name: "Reality (Status Quo)",
      description: `Current SIP rate ₹${totalMonthlySip.toLocaleString('en-IN')}/mo with 12% expected returns.`,
      color: "#3b82f6", // Blue
      params: {},
    },
    {
      id: "universe_a",
      name: "Universe A: +₹5,000 Monthly SIP",
      description: `Boost monthly investment by ₹5,000/mo immediately.`,
      color: "#10b981", // Emerald
      params: { monthlySipDelta: 5000 },
    },
    {
      id: "universe_b",
      name: "Universe B: 10% Annual Step-Up",
      description: `Increase monthly SIP by 10% every year.`,
      color: "#8b5cf6", // Purple
      params: { stepUpPctDelta: 10 },
    },
    {
      id: "universe_c",
      name: "Universe C: Market Fall -20% Stress",
      description: `Nifty market crash of 20% in Year 2 followed by recovery.`,
      color: "#f43f5e", // Rose
      params: { marketCrashPct: 20 },
    },
    {
      id: "universe_d",
      name: "Universe D: 12-Month SIP Interruption",
      description: `Pause all monthly investments for 1 year due to career transition.`,
      color: "#f59e0b", // Amber
      params: { sipPauseMonths: 12 },
    },
  ];

  return defaultUniverses.map((u) => {
    const projections: TimeMachineUniverse["projections"] = [];
    let corpus = currentInvestedVal;
    let currentSip = Math.max(0, totalMonthlySip + (u.params.monthlySipDelta || 0));

    for (let y = 1; y <= yearsToSimulate; y++) {
      const yearLabel = currentYear + y;
      
      // Check for market crash in Year 2
      let annualReturn = baseReturn;
      if (u.params.marketCrashPct && y === 2) {
        annualReturn = - (u.params.marketCrashPct / 100);
      }

      // Check for SIP pause in Year 1
      const isPaused = u.params.sipPauseMonths && y === 1;

      for (let m = 0; m < 12; m++) {
        const monthlySip = isPaused ? 0 : currentSip;
        corpus = (corpus + monthlySip) * (1 + annualReturn / 12);
      }

      // Apply step up
      if (u.params.stepUpPctDelta) {
        currentSip *= (1 + u.params.stepUpPctDelta / 100);
      }

      const purchasingPower = corpus / Math.pow(1 + baseInflation, y);

      projections.push({
        year: yearLabel,
        corpus: Math.round(corpus),
        purchasingPower: Math.round(purchasingPower),
      });
    }

    return {
      id: u.id,
      name: u.name,
      description: u.description,
      color: u.color,
      parameters: u.params,
      projections,
    };
  });
}

/**
 * Parses natural language scenario query into structured Time Machine parameters
 */
export function parseNaturalLanguageScenario(text: string): TimeMachineUniverse["parameters"] {
  const lower = text.toLowerCase();
  const params: TimeMachineUniverse["parameters"] = {};

  // SIP increase
  const sipMatch = lower.match(/(?:invest|add|increase|sip)\s+(?:another|by)?\s*₹?\s*(\d+k?|\d+l?|\d+)/i);
  if (sipMatch) {
    let numStr = sipMatch[1].toLowerCase();
    let num = parseFloat(numStr);
    if (numStr.endsWith("k")) num *= 1000;
    if (numStr.endsWith("l")) num *= 100000;
    if (num > 0) params.monthlySipDelta = num;
  }

  // Step up
  if (lower.includes("step up") || lower.includes("increase every year") || lower.includes("step-up")) {
    params.stepUpPctDelta = 10;
  }

  // Crash
  if (lower.includes("crash") || lower.includes("fall") || lower.includes("drop") || lower.includes("nifty")) {
    params.marketCrashPct = 20;
  }

  // Pause
  if (lower.includes("stop sip") || lower.includes("pause") || lower.includes("interruption")) {
    params.sipPauseMonths = 12;
  }

  return params;
}
