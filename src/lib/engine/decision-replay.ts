import { DecisionLogEntry, FinancialDigitalTwin } from "./types";

export function evaluateDecisionRetrospective(entry: DecisionLogEntry): DecisionLogEntry["retrospectiveEvaluation"] {
  if (!entry.expectedOutcomeAmount || !entry.actualOutcomeAmount) {
    return {
      status: "Pending",
      hindsightFreeAnalysis: `Decision recorded on ${entry.date}. Awaiting future milestone evaluation.`,
    };
  }

  const ratio = entry.actualOutcomeAmount / entry.expectedOutcomeAmount;
  let status: "On Track" | "Exceeded" | "Underperformed" | "Pending" = "On Track";
  let hindsightFreeAnalysis = "";

  if (ratio >= 1.05) {
    status = "Exceeded";
    hindsightFreeAnalysis = `Actual corpus (₹${entry.actualOutcomeAmount.toLocaleString('en-IN')}) exceeded expected target (₹${entry.expectedOutcomeAmount.toLocaleString('en-IN')}) by ${((ratio - 1) * 100).toFixed(1)}%. Given the assumptions available on ${entry.date}, your execution discipline was effective.`;
  } else if (ratio >= 0.9) {
    status = "On Track";
    hindsightFreeAnalysis = `Actual outcome (₹${entry.actualOutcomeAmount.toLocaleString('en-IN')}) aligned closely with expected outcome (₹${entry.expectedOutcomeAmount.toLocaleString('en-IN')}). The initial assumptions held true.`;
  } else {
    status = "Underperformed";
    hindsightFreeAnalysis = `Actual outcome (₹${entry.actualOutcomeAmount.toLocaleString('en-IN')}) fell short of original expected projection (₹${entry.expectedOutcomeAmount.toLocaleString('en-IN')}). Evaluating strictly from information available on ${entry.date}: Macro return assumptions or contribution consistency deviated from baseline.`;
  }

  return { status, hindsightFreeAnalysis };
}

export function exportFinancialMemory(twin: FinancialDigitalTwin): string {
  const memoryData = {
    exportDate: new Date().toISOString(),
    goals: twin.goals,
    decisions: twin.decisions,
    dnaHistory: twin.dnaHistory,
    investments: twin.investments,
    debts: twin.debts,
  };
  return JSON.stringify(memoryData, null, 2);
}

export function importFinancialMemory(jsonString: string, currentTwin: FinancialDigitalTwin): FinancialDigitalTwin {
  try {
    const imported = JSON.parse(jsonString);
    return {
      ...currentTwin,
      goals: imported.goals || currentTwin.goals,
      decisions: imported.decisions || currentTwin.decisions,
      dnaHistory: imported.dnaHistory || currentTwin.dnaHistory,
      investments: imported.investments || currentTwin.investments,
      debts: imported.debts || currentTwin.debts,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    throw new Error("Invalid ValarchiX memory JSON file.");
  }
}
