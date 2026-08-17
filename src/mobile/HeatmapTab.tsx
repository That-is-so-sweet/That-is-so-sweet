import React from "react";
import { EventData, SlotStats } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { computeSlotStats } from "../lib/slots";
import { Avatar, Badge, ProgressBar } from "../design-system/components";
import { cardStyle, SectionLabel } from "./mobileStyles";

interface HeatmapTabProps {
  event: EventData;
  onDelete: (participantId: string) => void;
  userNickname: string;
}

const medals = ["🥇", "🥈", "🥉"];

export const HeatmapTab: React.FC<HeatmapTabProps> = ({ event, onDelete, userNickname }) => {
  const stats = computeSlotStats(event.slots, event.responses);
  const top = [...stats].filter((s) => s.availableCount + s.ifNeededCount > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  const grouped = stats.reduce((acc, s) => {
    (acc[s.slot.date] = acc[s.slot.date] || []).push(s);
    return acc;
  }, {} as Record<string, typeof stats>);

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      {event.responses.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: "var(--color-muted)", fontSize: 12 }}>
          目前尚無任何人填寫，快分享連結邀請朋友！
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <SectionLabel title="熱門推薦時段" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {top.map((s, i) => (
                <div key={s.slot.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 900 }}>
                      {medals[i]} {s.slot.date} ({formatChineseWeekday(s.slot.date)}) {s.slot.time}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--color-success)" }}>
                      {s.availableCount}/{event.responses.length}
                    </span>
                  </div>
                  <ProgressBar value={s.availableCount} max={event.responses.length} variant={i === 0 ? "hot" : "primary"} size="sm" />
                </div>
              ))}
            </div>
          </div>
          <div style={cardStyle}>
            <SectionLabel title="時間熱點分佈" />
            {(Object.entries(grouped) as [string, SlotStats[]][]).map(([date, list]) => (
              <div key={date} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--color-muted)" }}>
                  {date} ({formatChineseWeekday(date)})
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
                  {list.map((s) => {
                    const ratio = event.responses.length ? s.availableCount / event.responses.length : 0;
                    const bg = ratio >= 0.75 ? "var(--color-success)" : ratio >= 0.4 ? "rgba(90,158,90,0.3)" : ratio > 0 ? "rgba(90,158,90,0.12)" : "var(--color-cream)";
                    const fg = ratio >= 0.75 ? "#fff" : "var(--color-ink)";
                    return (
                      <div key={s.slot.id} style={{ borderRadius: "var(--radius-md)", padding: 8, background: bg, color: fg, border: "1px solid var(--color-border)" }}>
                        <div style={{ fontSize: 11, fontWeight: 800 }}>{s.slot.time}</div>
                        <div style={{ fontSize: 10, marginTop: 2, opacity: 0.9 }}>{s.availableCount}/{event.responses.length} 有空</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={cardStyle}>
        <SectionLabel title={`已填寫名冊 (${event.responses.length} 人)`} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {event.responses.map((r) => {
            const availCount = Object.values(r.availability).filter((v) => v === "available").length;
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: "var(--radius-md)", background: "var(--color-cream)" }}>
                <Avatar name={r.nickname} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>
                    {r.nickname}
                    {r.nickname === userNickname && <span style={{ fontSize: 9, marginLeft: 6, color: "var(--color-primary)" }}>(您)</span>}
                  </div>
                  {r.comment && <div style={{ fontSize: 10, color: "var(--color-muted)" }}>💬 {r.comment}</div>}
                </div>
                <Badge variant="success" size="sm">{availCount}/{event.slots.length}</Badge>
                <button onClick={() => onDelete(r.id)} style={{ border: "none", background: "none", color: "var(--color-muted)", fontSize: 13, cursor: "pointer" }}>✕</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
