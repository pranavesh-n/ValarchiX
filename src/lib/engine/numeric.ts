/**
 * Numeric & Formatting Utilities for ValarchiX 1.2
 * Supports arbitrary monetary values from ₹1 to ₹1,000Cr+
 */

export function formatINR(val: number | bigint): string {
  const num = typeof val === "bigint" ? Number(val) : val;
  if (isNaN(num) || !isFinite(num)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatINRWords(val: number): string {
  if (isNaN(val) || !isFinite(val) || val <= 0) return "₹0";
  
  if (val >= 10000000000) { // 1,000 Cr+
    return `₹${(val / 10000000).toFixed(0)} Cr`;
  }
  if (val >= 10000000) { // 1 Cr
    const cr = val / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (val >= 100000) { // 1 Lakh
    const lakh = val / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh`;
  }
  if (val >= 1000) { // 1K
    const k = val / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  
  return formatINR(val);
}

/**
 * Logarithmic slider mapping for wide numeric ranges (₹1,000 to ₹100 Crore)
 * Range: 0 to 100 on slider scale
 */
const MIN_LOG_VAL = 1000; // ₹1,000
const MAX_LOG_VAL = 1000000000; // ₹100 Crore

export function valueToSliderPos(val: number): number {
  if (val <= MIN_LOG_VAL) return 0;
  if (val >= MAX_LOG_VAL) return 100;
  
  const minLog = Math.log10(MIN_LOG_VAL);
  const maxLog = Math.log10(MAX_LOG_VAL);
  const valLog = Math.log10(val);
  
  return ((valLog - minLog) / (maxLog - minLog)) * 100;
}

export function sliderPosToValue(pos: number): number {
  if (pos <= 0) return MIN_LOG_VAL;
  if (pos >= 100) return MAX_LOG_VAL;
  
  const minLog = Math.log10(MIN_LOG_VAL);
  const maxLog = Math.log10(MAX_LOG_VAL);
  const logVal = minLog + (pos / 100) * (maxLog - minLog);
  
  const rawVal = Math.pow(10, logVal);
  
  // Round to friendly increments
  if (rawVal < 10000) return Math.round(rawVal / 500) * 500;
  if (rawVal < 100000) return Math.round(rawVal / 5000) * 5000;
  if (rawVal < 1000000) return Math.round(rawVal / 25000) * 25000;
  if (rawVal < 10000000) return Math.round(rawVal / 100000) * 100000;
  if (rawVal < 100000000) return Math.round(rawVal / 5000000) * 5000000;
  return Math.round(rawVal / 10000000) * 10000000;
}
