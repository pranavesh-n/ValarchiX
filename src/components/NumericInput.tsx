"use client";

import React, { useState, useEffect } from "react";

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  type: "currency" | "percent" | "years" | "number";
  className?: string;
}

export default function NumericInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  type,
  className = ""
}: NumericInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  // Format value for display when blurred
  const formatValue = (val: number) => {
    if (type === "currency") {
      return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0
      }).format(val);
    }
    if (type === "percent") {
      return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
      }).format(val);
    }
    return val.toString();
  };

  useEffect(() => {
    if (!isFocused) {
      setTempValue(formatValue(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setTempValue(value === 0 ? "" : value.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value;
    setTempValue(rawStr);
    
    if (rawStr.trim() === "") {
      onChange(0);
      return;
    }
    
    const cleanStr = rawStr.replace(/[^0-9.]/g, "");
    const parsed = Number(cleanStr);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = Number(tempValue.replace(/,/g, ""));
    if (isNaN(parsed) || tempValue.trim() === "") {
      parsed = 0;
    }
    
    const validNumber = Math.max(min ?? 0, parsed);
    const finalVal = max !== undefined ? Math.min(max, validNumber) : validNumber;

    onChange(finalVal);
    setTempValue(formatValue(finalVal));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const displayValue = isFocused ? tempValue : formatValue(value);

  const hasCustomWidth = className.includes("w-");

  return (
    <div className={`flex items-center gap-1 bg-navy-bg/75 border border-border-navy/60 focus-within:border-emerald/60 rounded-lg px-2 py-1 text-xs text-emerald font-bold transition-all ${hasCustomWidth ? "" : "w-28 sm:w-32 md:w-36 shrink-0"} ${className}`}>
      {type === "currency" && (
        <span className="text-muted-grey/60 text-[10px] sm:text-xs select-none shrink-0">₹</span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent text-emerald font-mono font-bold text-right text-xs sm:text-sm outline-none min-w-0"
      />
      {type === "percent" && (
        <span className="text-muted-grey/60 text-[10px] sm:text-xs ml-0.5 select-none shrink-0">%</span>
      )}
      {type === "years" && (
        <span className="text-muted-grey/60 text-[10px] sm:text-xs ml-0.5 select-none shrink-0">Yr{value !== 1 ? "s" : ""}</span>
      )}
    </div>
  );
}
