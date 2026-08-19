import React from "react";
import { CalendarHeart } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, right }) => {
  return (
    <div style={{ background: "var(--color-primary)", padding: "10px 16px", flexShrink: 0, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
          <CalendarHeart size={16} style={{ flexShrink: 0, opacity: 0.9 }} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              fontFamily: "var(--font-display)",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: 11,
                opacity: 0.85,
                whiteSpace: "nowrap",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ opacity: 0.6 }}>·</span>
              {subtitle}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>{right}</div>
      </div>
    </div>
  );
};
