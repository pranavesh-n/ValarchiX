import { FinancialDigitalTwin, FinancialDnaScore, DnaPillarScore } from "./types";

export function calculateFinancialDna(twin: FinancialDigitalTwin): FinancialDnaScore {
  const { income, expenses, savings, investments, debts, protection, goals } = twin;

  const totalMonthlyIncome = Math.max(1, income.monthlySalary + income.secondaryMonthlyIncome);
  const totalMonthlyExpenses = Math.max(1, expenses.essentialMonthly + expenses.discretionaryMonthly);
  const totalAnnualExpenses = (totalMonthlyExpenses * 12) + expenses.recurringAnnual + expenses.irregularAnnual;
  const essentialMonthlyExpenses = Math.max(1, expenses.essentialMonthly);

  // 1. Cash Flow Health (Income vs Expenses vs Savings)
  const savingsRate = Math.max(0, (totalMonthlyIncome - totalMonthlyExpenses) / totalMonthlyIncome) * 100;
  let cashFlowScore = Math.min(100, Math.max(10, savingsRate * 2.5));
  let cashFlowRating: DnaPillarScore["rating"] = cashFlowScore >= 80 ? "Strong" : cashFlowScore >= 65 ? "Healthy" : cashFlowScore >= 45 ? "Needs Attention" : "Weak";

  // 2. Emergency Readiness (Months of essential expenses covered)
  const totalLiquid = savings.liquidBankBalance + savings.cashReserves;
  const emergencyMonths = totalLiquid / essentialMonthlyExpenses;
  let emergencyScore = Math.min(100, Math.max(10, (emergencyMonths / 6) * 100));
  let emergencyRating: DnaPillarScore["rating"] = emergencyScore >= 85 ? "Strong" : emergencyScore >= 65 ? "Healthy" : emergencyScore >= 45 ? "Needs Attention" : "Weak";

  // 3. Debt Health (EMI burden vs income & interest rate)
  const totalEmi = debts.reduce((sum, d) => sum + d.monthlyEmi, 0);
  const emiToIncomeRatio = (totalEmi / totalMonthlyIncome) * 100;
  let debtScore = 100 - (emiToIncomeRatio * 1.8);
  if (debts.some((d) => d.category === "credit_card" || d.interestRatePct > 18)) {
    debtScore -= 20; // Penalty for high-cost debt
  }
  debtScore = Math.min(100, Math.max(10, debtScore));
  let debtRating: DnaPillarScore["rating"] = debtScore >= 80 ? "Strong" : debtScore >= 65 ? "Healthy" : debtScore >= 45 ? "Needs Attention" : "Weak";

  // 4. Investment Health (Diversification, growth assets, consistency)
  const totalInvestmentVal = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const monthlyInvestmentSum = investments.reduce((sum, i) => sum + i.monthlyContribution, 0);
  const investmentRatio = (monthlyInvestmentSum / totalMonthlyIncome) * 100;
  let investmentScore = Math.min(100, Math.max(15, (investmentRatio * 3) + (totalInvestmentVal > 100000 ? 30 : 10)));
  let investmentRating: DnaPillarScore["rating"] = investmentScore >= 80 ? "Strong" : investmentScore >= 65 ? "Healthy" : investmentScore >= 45 ? "Needs Attention" : "Weak";

  // 5. Goal Readiness (Funding progress across active goals)
  let goalScore = 70;
  if (goals.length > 0) {
    const readinessSum = goals.reduce((acc, g) => {
      const targetCorpus = g.targetAmountToday * Math.pow(1.06, Math.max(1, g.targetYear - new Date().getFullYear()));
      const projectedCorpus = g.currentAllocatedCorpus + (g.currentMonthlySip * 12 * (g.targetYear - new Date().getFullYear()));
      const ratio = Math.min(1.2, projectedCorpus / Math.max(1, targetCorpus));
      return acc + ratio;
    }, 0);
    goalScore = Math.min(100, Math.max(10, (readinessSum / goals.length) * 100));
  }
  let goalRating: DnaPillarScore["rating"] = goalScore >= 80 ? "Strong" : goalScore >= 65 ? "Healthy" : goalScore >= 45 ? "Needs Attention" : "Weak";

  // 6. Retirement Readiness (Compounding & wealth trajectory)
  const epfNpsValue = investments
    .filter((i) => i.category === "epf" || i.category === "nps" || i.category === "ppf")
    .reduce((sum, i) => sum + i.currentValue, 0);
  let retirementScore = Math.min(100, Math.max(15, (totalInvestmentVal + epfNpsValue) / (totalAnnualExpenses * 0.5) * 10));
  let retirementRating: DnaPillarScore["rating"] = retirementScore >= 80 ? "Strong" : retirementScore >= 65 ? "Healthy" : retirementScore >= 45 ? "Needs Attention" : "Weak";

  // 7. Protection Readiness (Insurance relative to dependants & annual income)
  const requiredLifeCover = (totalMonthlyIncome * 12 * 10) + debts.reduce((sum, d) => sum + d.outstandingPrincipal, 0);
  const lifeCoverRatio = protection.lifeInsuranceCover / Math.max(1, requiredLifeCover);
  const healthCoverRatio = protection.healthInsuranceCover / 1000000; // 10L target
  let protectionScore = Math.min(100, Math.max(10, (lifeCoverRatio * 50) + (healthCoverRatio * 50)));
  if (protection.dependantsCount > 0 && protection.lifeInsuranceCover < totalMonthlyIncome * 12 * 5) {
    protectionScore -= 25;
  }
  protectionScore = Math.min(100, Math.max(10, protectionScore));
  let protectionRating: DnaPillarScore["rating"] = protectionScore >= 80 ? "Strong" : protectionScore >= 65 ? "Healthy" : protectionScore >= 45 ? "Needs Attention" : "Weak";

  // 8. Financial Resilience (Ability to withstand income shock or sudden crash)
  let resilienceScore = (emergencyScore * 0.4) + (debtScore * 0.3) + (protectionScore * 0.3);
  resilienceScore = Math.min(100, Math.max(10, resilienceScore));
  let resilienceRating: DnaPillarScore["rating"] = resilienceScore >= 80 ? "Strong" : resilienceScore >= 65 ? "Healthy" : resilienceScore >= 45 ? "Needs Attention" : "Weak";

  const pillars: DnaPillarScore[] = [
    {
      id: "cash_flow",
      name: "Cash Flow Health",
      score: Math.round(cashFlowScore),
      rating: cashFlowRating,
      weight: 15,
      explanation: `You are saving approx ${savingsRate.toFixed(1)}% of your monthly income (₹${(totalMonthlyIncome - totalMonthlyExpenses).toLocaleString('en-IN')}/mo).`,
      recommendation: savingsRate < 20 ? "Target a minimum 20% savings rate by auditing discretionary monthly expenses." : "Healthy cash flow generation supporting wealth building.",
      impactOfFix: "Boosts overall DNA score by up to +8 points.",
    },
    {
      id: "emergency",
      name: "Emergency Readiness",
      score: Math.round(emergencyScore),
      rating: emergencyRating,
      weight: 15,
      explanation: `You currently have approximately ${emergencyMonths.toFixed(1)} months of essential expenses (₹${essentialMonthlyExpenses.toLocaleString('en-IN')}) covered in liquid reserves.`,
      recommendation: emergencyMonths < 6 ? `Build your liquid emergency reserve to ₹${(essentialMonthlyExpenses * 6).toLocaleString('en-IN')} (6 months of essential expenses).` : "Excellent emergency cushion protecting against job loss or shocks.",
      impactOfFix: `Increasing reserve to 6 months boosts Emergency score to 100 (+${Math.round(100 - emergencyScore)} pts).`,
    },
    {
      id: "debt",
      name: "Debt Health",
      score: Math.round(debtScore),
      rating: debtRating,
      weight: 15,
      explanation: `EMIs take up ${emiToIncomeRatio.toFixed(1)}% of monthly income. Total outstanding debt principal is ₹${debts.reduce((s, d) => s + d.outstandingPrincipal, 0).toLocaleString('en-IN')}.`,
      recommendation: emiToIncomeRatio > 35 ? "Prioritize aggressive debt avalanche/snowball payoff on non-tax-deductible liabilities." : "Debt level is well within manageable thresholds.",
      impactOfFix: "Eliminating credit card / personal debt improves resilience significantly.",
    },
    {
      id: "investment",
      name: "Investment Health",
      score: Math.round(investmentScore),
      rating: investmentRating,
      weight: 15,
      explanation: `Monthly investment contribution is ${investmentRatio.toFixed(1)}% of income (₹${monthlyInvestmentSum.toLocaleString('en-IN')}/mo).`,
      recommendation: investmentRatio < 15 ? "Increase monthly systematic investment plans (SIP) to compound faster." : "Strong monthly investment discipline.",
      impactOfFix: "Accelerates long-term wealth accumulation velocity.",
    },
    {
      id: "goal_readiness",
      name: "Goal Readiness",
      score: Math.round(goalScore),
      rating: goalRating,
      weight: 10,
      explanation: `Current savings and SIP trajectory match ${Math.round(goalScore)}% of total inflation-adjusted goal targets.`,
      recommendation: goalScore < 80 ? "Use GoalX reverse mode to optimize step-up SIP rates or extend target horizons." : "Stated goals are well-funded under current assumptions.",
      impactOfFix: "Aligns monthly cash flow directly with your future financial milestones.",
    },
    {
      id: "retirement",
      name: "Retirement Readiness",
      score: Math.round(retirementScore),
      rating: retirementRating,
      weight: 10,
      explanation: `Accumulated retirement & long-term growth corpus equals ${(totalInvestmentVal / Math.max(1, totalAnnualExpenses)).toFixed(1)}x annual living expenses.`,
      recommendation: retirementScore < 60 ? "Increase allocation to high-CAGR equity assets and maximum EPF/NPS contributions." : "Solid compounding velocity towards retirement freedom.",
      impactOfFix: "Reduces risk of outliving retirement corpus.",
    },
    {
      id: "protection",
      name: "Protection Readiness",
      score: Math.round(protectionScore),
      rating: protectionRating,
      weight: 10,
      explanation: `Life cover is ₹${(protection.lifeInsuranceCover / 100000).toFixed(1)}L (vs recommended ₹${(requiredLifeCover / 100000).toFixed(1)}L). Health cover is ₹${(protection.healthInsuranceCover / 100000).toFixed(1)}L.`,
      recommendation: protectionScore < 70 ? "Ensure pure term insurance covers at least 10x annual income + outstanding debts." : "Comprehensive protection buffer for your dependants.",
      impactOfFix: "Protects family against black swan health or life events.",
    },
    {
      id: "resilience",
      name: "Financial Resilience",
      score: Math.round(resilienceScore),
      rating: resilienceRating,
      weight: 10,
      explanation: `Overall capacity to withstand market downturns, income disruption, or sudden medical emergencies.`,
      recommendation: resilienceScore < 70 ? "Focus on Emergency Reserve and Debt payoff to harden your financial foundation." : "Robust financial fortress.",
      impactOfFix: "Prevents panic selling during economic crises.",
    },
  ];

  const totalWeightedScore = pillars.reduce((sum, p) => sum + (p.score * p.weight), 0) / 100;
  const overallScore = Math.round(totalWeightedScore);

  let grade: FinancialDnaScore["grade"] = "B";
  if (overallScore >= 90) grade = "S";
  else if (overallScore >= 80) grade = "A+";
  else if (overallScore >= 70) grade = "A";
  else if (overallScore >= 55) grade = "B";
  else grade = "C";

  // Find biggest gap
  const sortedPillars = [...pillars].sort((a, b) => a.score - b.score);
  const weakestPillar = sortedPillars[0];

  // Calculate potential score if weakest pillar is improved to 85
  const improvedPillars = pillars.map((p) => p.id === weakestPillar.id ? { ...p, score: 85 } : p);
  const improvedScoreIfFixed = Math.round(improvedPillars.reduce((sum, p) => sum + (p.score * p.weight), 0) / 100);

  let summaryText = "";
  if (overallScore >= 85) {
    summaryText = "Outstanding financial health! Exceptional resilience, emergency buffer, and disciplined goal alignment.";
  } else if (overallScore >= 70) {
    summaryText = "Solid financial foundation. High compounding capacity with minor gaps in emergency cushion or protection.";
  } else if (overallScore >= 50) {
    summaryText = "Moderate financial fitness. Needs focused attention on emergency reserves, debt reduction, or goal SIPs.";
  } else {
    summaryText = "Financial vulnerability detected. Prioritize building an emergency fund and clearing expensive debts first.";
  }

  return {
    overallScore,
    grade,
    summaryText,
    pillars,
    biggestGap: {
      pillarId: weakestPillar.id,
      title: weakestPillar.name,
      explanation: weakestPillar.explanation,
      improvedScoreIfFixed,
      recommendedAction: weakestPillar.recommendation,
    },
    snapshotDate: new Date().toISOString().split("T")[0],
  };
}
