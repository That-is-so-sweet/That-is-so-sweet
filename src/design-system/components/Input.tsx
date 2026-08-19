import React, { useState } from "react";

type InputSize = "sm" | "md" | "lg";

interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  size?: InputSize;
  maxLength?: number;
  required?: boolean;
}

const sizes: Record<InputSize, { padding: string; fontSize: number; height: number }> = {
  sm: { padding: "8px 12px", fontSize: 13, height: 36 },
  md: { padding: "11px 16px", fontSize: 15, height: 44 },
  lg: { padding: "14px 18px", fontSize: 17, height: 52 },
};

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  type = "text",
  prefix,
  suffix,
  label,
  hint,
  error,
  disabled = false,
  size = "md",
  maxLength,
  required,
}) => {
  const [focused, setFocused] = useState(false);
  const sizeCfg = sizes[size];
  const borderColor = error ? "var(--color-error)" : focused ? "var(--color-primary)" : "var(--color-border)";
  const sidePad = sizeCfg.padding.split(" ")[1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", fontFamily: "var(--font-body)" }}>
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: required ? 700 : 500,
            color: required ? "var(--color-ink)" : "var(--color-muted)",
          }}
        >
          {label}
          {required && <span style={{ color: "var(--color-primary)", marginLeft: 4 }}>*</span>}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: disabled ? "var(--color-cream)" : "var(--color-surface)",
          border: `2px solid ${borderColor}`,
          borderRadius: "var(--radius-input)",
          height: sizeCfg.height,
          transition: "border-color 150ms ease, box-shadow 150ms ease",
          boxShadow: focused ? `0 0 0 3px ${error ? "rgba(232,54,26,0.15)" : "rgba(255,100,34,0.15)"}` : "none",
          overflow: "hidden",
          paddingLeft: prefix ? 12 : 0,
          paddingRight: suffix ? 12 : 0,
        }}
      >
        {prefix && <span style={{ color: "var(--color-muted)", display: "flex", alignItems: "center" }}>{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          required={required}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: sizeCfg.fontSize,
            color: "var(--color-ink)",
            padding: sizeCfg.padding,
            paddingLeft: prefix ? 8 : sidePad,
            paddingRight: suffix ? 8 : sidePad,
            cursor: disabled ? "not-allowed" : "text",
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix && <span style={{ color: "var(--color-muted)", display: "flex", alignItems: "center" }}>{suffix}</span>}
      </div>
      {(hint || error) && (
        <div style={{ fontSize: 12, color: error ? "var(--color-error)" : "var(--color-muted)", fontWeight: error ? 500 : 400 }}>
          {error || hint}
        </div>
      )}
    </div>
  );
};
