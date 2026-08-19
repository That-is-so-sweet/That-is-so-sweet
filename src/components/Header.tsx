import React from "react";
import { CalendarHeart, PlusCircle, History, Sparkles } from "lucide-react";

interface HeaderProps {
  onNewEvent: () => void;
  onOpenHistory: () => void;
  onLoadDemo: () => void;
  activeEventTitle?: string;
}

const pillBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: "var(--radius-pill)",
  border: "1.5px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.14)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 800,
  fontFamily: "var(--font-body)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "background 150ms ease",
};

export const Header: React.FC<HeaderProps> = ({ onNewEvent, onOpenHistory, onLoadDemo, activeEventTitle }) => {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--color-primary)", color: "#fff", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div onClick={onNewEvent} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", flexShrink: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-lg)",
              background: "rgba(255,255,255,0.18)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CalendarHeart size={19} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>揪甘心</span>
              <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: "var(--radius-pill)", background: "var(--color-secondary)", color: "var(--color-ink)" }}>
                免登入
              </span>
            </div>
            <p style={{ fontSize: 11, opacity: 0.85, margin: 0, marginTop: 1 }}>聚會時間協調神器</p>
          </div>
        </div>

        {activeEventTitle && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              borderRadius: "var(--radius-lg)",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              fontSize: 12,
              maxWidth: 280,
              overflow: "hidden",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "#fff", flexShrink: 0 }} />
            <span style={{ opacity: 0.85, flexShrink: 0 }}>正在瀏覽：</span>
            <span style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeEventTitle}</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => onLoadDemo()}
            style={pillBtnStyle}
            title="查看範例活動體驗功能"
          >
            <Sparkles size={14} />
            體驗示範
          </button>
          <button onClick={onOpenHistory} style={pillBtnStyle} title="查看瀏覽或建立過的活動紀錄">
            <History size={14} />
            我的聚會
          </button>
          <button
            onClick={onNewEvent}
            style={{ ...pillBtnStyle, background: "var(--color-ink)", border: "1.5px solid var(--color-ink)" }}
          >
            <PlusCircle size={14} />
            發起活動
          </button>
        </div>
      </div>
    </header>
  );
};
