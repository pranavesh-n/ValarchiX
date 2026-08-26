"use client";

import React, { useState, useEffect } from "react";

interface FinancialInputProps {
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "md" | "lg";
  allowZeroBlank?: boolean;
}

export default function FinancialInput({
  value,
  onChange,
  prefix = "₹",
  suffix = "",
  placeholder = "0",
  min = 0,
  max,
  className = "",
  inputClassName = "",
  size = "md",
  allowZeroBlank = true,
}: FinancialInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState<string>(
    value > 0 ? new Intl.NumberFormat("en-IN").format(value) : ""
  );

  // Sync external value changes when not actively typing/focused
  useEffect(() => {
    if (!isFocused) {
      if (value > 0) {
        setLocalText(new Intl.NumberFormat("en-IN").format(value));
      } else {
        setLocalText("");
      }
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    if (value > 0) {
      setLocalText(value.toString());
    } else {
      setLocalText("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (raw.trim() === "") {
      setLocalText("");
      onChange(0);
      return;
    }

    // Strip out non-digits except single decimal point
    const sanitized = raw.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    const cleanNumberStr = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : sanitized;

    setLocalText(cleanNumberStr);

    const parsed = parseFloat(cleanNumberStr);
    if (!isNaN(parsed)) {
      let finalVal = parsed;
      if (max !== undefined && finalVal > max) finalVal = max;
      onChange(finalVal);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = parseFloat(localText.replace(/,/g, ""));
    if (isNaN(parsed) || parsed <= 0) {
      parsed = 0;
    } else {
      if (min !== undefined && parsed < min) parsed = min;
      if (max !== undefined && parsed > max) parsed = max;
    }

    onChange(parsed);
    if (parsed > 0) {
      setLocalText(new Intl.NumberFormat("en-IN").format(parsed));
    } else {
      setLocalText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const isFilled = value > 0;

  const sizeClasses = {
    sm: "py-1.5 px-2.5 text-xs",
    md: "py-2 px-3.5 text-sm",
    lg: "py-3 px-4 text-base font-extrabold",
  };

  return (
    <div
      className={`relative flex items-center rounded-xl transition-all duration-200 ${
        isFilled
          ? "financial-input-filled"
          : isFocused
          ? "bg-navy-bg border-2 border-indigo-500 ring-2 ring-indigo-500/20"
          : "financial-input-unfilled hover:opacity-90"
      } ${className}`}
    >
      {prefix && (
        <span
          className={`pl-3.5 pr-0.5 font-bold select-none text-xs sm:text-sm shrink-0 transition-all ${
            isFilled
              ? "text-emerald font-black scale-105"
              : isFocused
              ? "text-indigo-500 dark:text-indigo-400"
              : "text-muted-grey/60"
          }`}
        >
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={localText}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-transparent font-mono outline-none text-heading transition-all ${
          isFilled
            ? "font-extrabold"
            : "placeholder:text-muted-grey/50 placeholder:italic placeholder:font-normal"
        } ${sizeClasses[size]} ${inputClassName}`}
      />
      {suffix && (
        <span
          className={`pr-3.5 pl-1 font-semibold select-none text-xs shrink-0 transition-colors ${
            isFilled ? "text-emerald font-bold" : "text-muted-grey/60"
          }`}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
