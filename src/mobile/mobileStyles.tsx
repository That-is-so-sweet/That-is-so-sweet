import React from "react";

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

export const STATUS_META: Record<string, { icon: string; color: string }> = {
  available: { icon: "⭕", color: "var(--color-success)" },
  if_needed: { icon: "🔺", color: "var(--color-secondary-dark)" },
  unavailable: { icon: "❌", color: "var(--color-muted)" },
};

export function SectionLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-ink)" }}>{title}</div>
      {hint && <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{hint}</div>}
    </div>
  );
}
