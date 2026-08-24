import React, { useState } from "react";
import { AlertTriangle, Ban } from "lucide-react";
import { EventData } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { computeSlotStats, formatSlotTime } from "../lib/slots";
import { getLifecycleStatus, formatDeadline } from "../lib/eventStatus";
import { Button, Input } from "../design-system/components";
import { cardStyle, SectionLabel } from "./mobileStyles";
import { ReopenModal } from "./ReopenModal";
import { CancelEventModal } from "./CancelEventModal";

interface HostTabProps {
  event: EventData;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen?: (newDeadline?: string) => Promise<void>;
  onCancelEvent?: () => Promise<void>;
  isLoading: boolean;
}

export const HostTab: React.FC<HostTabProps> = ({ event, onFinalize, onReopen, onCancelEvent, isLoading }) => {
  const [selected, setSelected] = useState<string | undefined>(event.slots[0]?.id);
  const [note, setNote] = useState(event.description ? `地點/備註：${event.description}` : "");
  const [confirming, setConfirming] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const stats = computeSlotStats(event.slots, event.responses);
  const isDateOnly = event.mode === "date_only";
  const lifecycle = getLifecycleStatus(event);

  return (
    <div style={{ padding: 14 }}>
      {lifecycle.key === "voting_closed" && onReopen && (
        <div style={{ ...cardStyle, marginBottom: 12, background: "var(--color-hot-subtle)", borderColor: "rgba(214,48,60,0.25)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <AlertTriangle size={16} color="var(--color-hot)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)" }}>投票已於 {formatDeadline(event.responseDeadline)} 截止</div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>參與者暫時無法再送出新的時間，可以重新開放投票或直接拍板定案。</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <Button variant="hot" size="sm" fullWidth onClick={() => setReopening(true)}>重新開放投票</Button>
          </div>
        </div>
      )}
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
                    {s.date} ({formatChineseWeekday(s.date)}){!isDateOnly && ` · ${formatSlotTime(s.time)}`}
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
        <Input label="定案備註" placeholder="例如：訂位阿傑，18:00 集合" value={note} onChange={(e) => setNote(e.target.value)} />
        <div style={{ marginTop: 12 }}>
          <Button variant="dark" fullWidth disabled={!selected || isLoading} onClick={() => setConfirming(true)}>
            確認最終時間並定案
          </Button>
        </div>
      </div>
      {onCancelEvent && (
        <div style={{ ...cardStyle, marginTop: 12, background: "var(--color-error-subtle)", borderColor: "rgba(232,54,26,0.25)" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 2 }}>危險操作</div>
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 10 }}>取消後活動將無法復原，所有人都會看到取消狀態。</div>
          <Button variant="hot" fullWidth disabled={isLoading} onClick={() => setCancelling(true)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ban size={13} />
              取消活動
            </span>
          </Button>
        </div>
      )}
      {reopening && onReopen && (
        <ReopenModal
          currentDeadline={event.responseDeadline}
          onCancel={() => setReopening(false)}
          onConfirm={(newDeadline) => {
            setReopening(false);
            onReopen(newDeadline);
          }}
        />
      )}
      {cancelling && onCancelEvent && (
        <CancelEventModal
          eventTitle={event.title}
          isLoading={isLoading}
          onCancel={() => setCancelling(false)}
          onConfirm={() => {
            setCancelling(false);
            onCancelEvent();
          }}
        />
      )}
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
