import React, { useState } from "react";
import { EventData } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { computeSlotStats } from "../lib/slots";
import { Button, Input } from "../design-system/components";
import { cardStyle, SectionLabel } from "./mobileStyles";

interface HostTabProps {
  event: EventData;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  isLoading: boolean;
}

export const HostTab: React.FC<HostTabProps> = ({ event, onFinalize, isLoading }) => {
  const [selected, setSelected] = useState<string | undefined>(event.slots[0]?.id);
  const [note, setNote] = useState(event.description ? `地點/備註：${event.description}` : "");
  const [confirming, setConfirming] = useState(false);
  const stats = computeSlotStats(event.slots, event.responses);

  return (
    <div style={{ padding: 14 }}>
      <div style={cardStyle}>
        <SectionLabel title="主揪拍板定案" hint="參考統計選擇最佳時間並發布結果" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {event.slots.map((s) => {
            const st = stats.find((x) => x.slotId === s.id)!;
            const active = selected === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelected(s.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 10px",
                  borderRadius: "var(--radius-md)",
                  border: active ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  background: active ? "var(--color-primary)" : "#fff",
                  color: active ? "#fff" : "var(--color-ink)",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>
                    {s.date} ({formatChineseWeekday(s.date)}) · {s.time}
                  </div>
                  {s.label && <div style={{ fontSize: 10, opacity: 0.8 }}>{s.label}</div>}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "var(--radius-pill)",
                    background: active ? "rgba(255,255,255,0.25)" : "rgba(90,158,90,0.15)",
                    color: active ? "#fff" : "var(--color-success)",
                  }}
                >
                  {st.availableCount} 人出席
                </span>
              </div>
            );
          })}
        </div>
        <Input label="定案備註（選填）" placeholder="例如：訂位阿傑，18:00 集合" value={note} onChange={(e) => setNote(e.target.value)} />
        <div style={{ marginTop: 12 }}>
          <Button variant="dark" fullWidth disabled={!selected || isLoading} onClick={() => setConfirming(true)}>
            確認最終時間並定案
          </Button>
        </div>
      </div>
      {confirming && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 18, width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>確認要拍板定案嗎？</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 14, lineHeight: 1.6 }}>
              定案後活動將轉為「已敲定通知模式」，暫停開放新投票。
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="muted" fullWidth onClick={() => setConfirming(false)}>返回修改</Button>
              <Button
                variant="hot"
                fullWidth
                onClick={() => {
                  setConfirming(false);
                  if (selected) onFinalize(selected, note);
                }}
              >
                拍板確定
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
