import React from "react";
import { Ban } from "lucide-react";
import { EventData } from "../types";
import { cardStyle, SectionLabel } from "./mobileStyles";

interface CancelledViewProps {
  event: EventData;
}

export const CancelledView: React.FC<CancelledViewProps> = ({ event }) => {
  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "var(--color-error)", color: "#fff", borderRadius: "var(--radius-card)", padding: 16 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: "var(--radius-pill)",
            background: "rgba(255,255,255,0.2)",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          <Ban size={12} />
          活動已取消
        </span>
        <div style={{ fontSize: 17, fontWeight: 900, fontFamily: "var(--font-display)", marginTop: 10 }}>{event.title}</div>
        {event.hostName && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>發起人：{event.hostName}</div>}
        {event.cancelledAt && (
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 8 }}>
            取消時間：{new Date(event.cancelledAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <SectionLabel title="說明" />
        <div style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.6 }}>
          主揪已取消此活動，所有投票與拍板功能皆已關閉。如有疑問請直接聯繫主揪。
        </div>
      </div>
    </div>
  );
};
