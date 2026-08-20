import React from "react";
import { Circle, Triangle, X, LucideIcon } from "lucide-react";

export const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  borderRadius: "var(--radius-card)",
  padding: 14,
  border: "1px solid var(--color-border)",
};

export const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "var(--radius-md)",
  background: "rgba(255,255,255,0.2)",
  border: "1.5px solid rgba(255,255,255,0.3)",
  color: "#fff",
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

export const navBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "#fff",
  fontSize: 15,
  fontWeight: 700,
  color: "var(--color-ink)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

export const quickBtnStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: "6px 6px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "#fff",
  color: "var(--color-ink)",
  cursor: "pointer",
};

export const STATUS_META: Record<string, { icon: LucideIcon; color: string }> = {
  available: { icon: Circle, color: "var(--color-success)" },
  if_needed: { icon: Triangle, color: "var(--color-secondary-dark)" },
  unavailable: { icon: X, color: "var(--color-muted)" },
};

export function SectionLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-ink)" }}>{title}</div>
      {hint && <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

// Counts how many of the given dated items fall in the month `offset` steps away
// from `year`/`month` — used to badge the prev/next month nav arrows so users
// know there's more to review without having to click through blindly.
export function countInAdjacentMonth(items: { date: string }[], year: number, month: number, offset: number): number {
  const d = new Date(year, month + offset, 1);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return items.filter((i) => i.date.slice(0, 7) === key).length;
}

export const MonthNavButton: React.FC<{ direction: "prev" | "next"; onClick: () => void; badgeCount?: number }> = ({
  direction,
  onClick,
  badgeCount,
}) => (
  <div style={{ position: "relative", display: "inline-flex" }}>
    <button style={navBtnStyle} onClick={onClick}>{direction === "prev" ? "‹" : "›"}</button>
    {!!badgeCount && (
      <span
        style={{
          position: "absolute",
          top: -5,
          right: -5,
          minWidth: 15,
          height: 15,
          padding: "0 3px",
          borderRadius: 999,
          background: "var(--color-hot)",
          color: "#fff",
          fontSize: 9,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px solid var(--color-surface)",
        }}
      >
        {badgeCount > 99 ? "99+" : badgeCount}
      </span>
    )}
  </div>
);
