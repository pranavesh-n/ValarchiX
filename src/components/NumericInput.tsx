"use client";

import React, { useState } from "react";

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

  const handleFocus = () => {
    setIsFocused(true);
    setTempValue(value.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value;
    setTempValue(rawStr);
    
    if (rawStr === "") {
      onChange(0);
      return;
    }
    
    const parsed = Number(rawStr);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = Number(tempValue);
    if (isNaN(parsed) || tempValue === "") {
      parsed = 0;
    }
    
    const validNumber = Math.max(0, parsed);
    const finalVal = Number(validNumber.toFixed(4));

    onChange(finalVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const displayValue = isFocused ? tempValue : formatValue(value);

  return (
    <div className={`flex items-center gap-1 bg-navy-bg/55 border border-border-navy/60 focus-within:border-emerald/50 rounded-lg px-2 py-0.5 text-xs text-emerald font-bold transition-all w-24 md:w-28 shrink-0 ${className}`}>
      {type === "currency" && (
        <span className="text-muted-grey/60 text-[10px] select-none">₹</span>
      )}
      <input
        type={isFocused ? "number" : "text"}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        step="any"
        className="w-full bg-transparent text-emerald font-bold text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {type === "percent" && (
        <span className="text-muted-grey/60 text-[10px] ml-0.5 select-none">%</span>
      )}
      {type === "years" && (
        <span className="text-muted-grey/60 text-[10px] ml-0.5 select-none">Yr{value !== 1 ? "s" : ""}</span>
      )}
    </div>
  );
}
