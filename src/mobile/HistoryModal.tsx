import React from "react";
import { VisitedEventItem } from "../lib/api";
import { getLifecycleStatusFromSnapshot } from "../lib/eventStatus";
import { DEMO_EVENTS } from "../lib/demoEvents";
import { Badge, Button } from "../design-system/components";

interface HistoryModalProps {
  onClose: () => void;
  eventsList: VisitedEventItem[];
  onSelectEvent: (id: string) => void;
  onLoadDemo: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, eventsList, onSelectEvent, onLoadDemo }) => {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 20, width: "100%", maxHeight: "80%", overflowY: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>我的聚會紀錄</div>
        {eventsList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-muted)", fontSize: 12 }}>
            目前尚無紀錄，發起活動後會顯示在這裡！
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {eventsList.map((h) => {
              const lifecycle = getLifecycleStatusFromSnapshot(h);
              return (
                <div
                  key={h.id}
                  onClick={() => {
                    onSelectEvent(h.id);
                    onClose();
                  }}
                  style={{ padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{h.title}</span>
                    {h.isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
                    <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : "muted"} size="sm">{lifecycle.label}</Badge>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 4 }}>
                    上次查看：{new Date(h.updatedAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 16, fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>示範活動</div>
        <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 2, marginBottom: 8 }}>不用真的建立活動，直接預覽各種狀態的畫面</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {DEMO_EVENTS.map((d) => (
            <div
              key={d.id}
              onClick={() => {
                onLoadDemo(d.id);
                onClose();
              }}
              style={{ padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border-strong)", cursor: "pointer" }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{d.label}</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 2 }}>{d.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <Button variant="muted" fullWidth onClick={onClose}>關閉</Button>
        </div>
      </div>
    </div>
  );
};
