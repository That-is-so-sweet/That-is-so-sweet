import React from "react";

interface TopBarProps {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, right }) => {
  return (
    <div style={{ background: "var(--color-primary)", padding: "14px 16px 12px", flexShrink: 0, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              fontFamily: "var(--font-display)",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
          {subtitle && <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>{right}</div>
      </div>
    </div>
  );
};
