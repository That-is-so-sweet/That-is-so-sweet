import React from "react";
import { Circle, Triangle, X, LucideIcon, MailCheck, MailX } from "lucide-react";

export const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  borderRadius: "var(--radius-card)",
  padding: 14,
  border: "1px solid var(--color-border)",
};

// Marks whether a participant left an Email, so the host can see at a glance
// how much of the roster is covered by automatic notifications (and who needs
// a manual forward). Visible to everyone viewing the roster/attendance list —
// it never reveals the address itself, only whether one was given.
export const EmailIndicator: React.FC<{ hasEmail: boolean }> = ({ hasEmail }) => (
  <span
    title={hasEmail ? "有填寫通知mail" : "未填寫通知mail"}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 20,
      height: 20,
      borderRadius: "var(--radius-pill)",
      background: hasEmail ? "var(--color-success)" : "var(--color-muted)",
      color: "#fff",
      flexShrink: 0,
    }}
  >
    {hasEmail ? <MailCheck size={12} strokeWidth={2.5} /> : <MailX size={12} strokeWidth={2.5} />}
  </span>
);

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
  width: 38,
  height: 30,
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

export function SectionLabel({
  title,
  hint,
  icon,
  iconBg = "var(--color-primary)",
  right,
  titleExtra,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  right?: React.ReactNode;
  titleExtra?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {icon && (
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: "var(--radius-lg)",
                background: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
          <span
            style={{
              fontFamily: icon ? "var(--font-display)" : undefined,
              fontWeight: icon ? 900 : 800,
              fontSize: icon ? 14 : 13,
              letterSpacing: icon ? "-0.01em" : undefined,
              color: "var(--color-ink)",
            }}
          >
            {title}
          </span>
          {titleExtra}
        </div>
        {right && (
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--color-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
            {right}
          </span>
        )}
      </div>
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
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 9,
          fontWeight: 900,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px solid var(--color-surface)",
          boxSizing: "border-box",
        }}
      >
        {badgeCount > 99 ? "99+" : badgeCount}
      </span>
    )}
  </div>
);
