import React from "react";
import { PartyPopper } from "lucide-react";

type ProgressVariant = "primary" | "hot" | "success";
type ProgressSize = "sm" | "md" | "lg";

interface ProgressBarProps {
  value?: number;
  max?: number;
  label?: React.ReactNode;
  showCount?: boolean;
  variant?: ProgressVariant;
  size?: ProgressSize;
  animate?: boolean;
}

const heights: Record<ProgressSize, number> = { sm: 6, md: 10, lg: 14 };

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  max = 100,
  label,
  showCount = true,
  variant = "primary",
  size = "md",
  animate = true,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const full = pct >= 100;
  const variants: Record<ProgressVariant, { track: string; fill: string }> = {
    primary: { track: "var(--color-primary-subtle)", fill: "var(--color-primary)" },
    hot: { track: "var(--color-hot-subtle)", fill: full ? "var(--color-success)" : "var(--color-hot)" },
    success: { track: "var(--color-success-subtle)", fill: "var(--color-success)" },
  };
  const h = heights[size] || 10;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--font-body)" }}>
      {(label || showCount) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {label && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>{label}</span>}
          {showCount && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 900,
                fontFamily: "var(--font-display)",
                color: full ? "var(--color-success)" : "var(--color-primary)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {full ? (
                <>
                  已成團！
                  <PartyPopper size={13} />
                </>
              ) : (
                `${value} / ${max} 人`
              )}
            </span>
          )}
        </div>
      )}
      <div style={{ width: "100%", height: h, background: variants[variant].track, borderRadius: 999, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: variants[variant].fill,
            borderRadius: 999,
            transition: animate ? "width 600ms var(--ease-spring)" : "none",
          }}
        />
      </div>
    </div>
  );
};
