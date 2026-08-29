import React from "react";
import { X } from "lucide-react";
import { VisitedEventItem } from "../lib/api";
import { getLifecycleStatusFromSnapshot } from "../lib/eventStatus";
import { DEMO_EVENTS, getDemoEventBadge } from "../lib/demoEvents";
import { Badge } from "../design-system/components";

interface HistoryModalProps {
  onClose: () => void;
  eventsList: VisitedEventItem[];
  onSelectEvent: (id: string) => void;
  onLoadDemo: (id: string, hostToken?: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, eventsList, onSelectEvent, onLoadDemo }) => {
  return (
    <div
      style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.6)", zIndex: 200, animation: "gt-fade-in 200ms ease-out" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "85%",
          maxWidth: 360,
          background: "#fff",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          animation: "gt-slide-in-right 260ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 900 }}>我的聚會紀錄</span>
          <button onClick={onClose} style={{ background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-ink)" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
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
                    <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.label}</Badge>
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
          {DEMO_EVENTS.map((d) => {
            const badge = getDemoEventBadge(d.id);
            return (
              <div
                key={d.id + (d.hostToken || "")}
                onClick={() => {
                  onLoadDemo(d.id, d.hostToken);
                  onClose();
                }}
                style={{ padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border-strong)", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{d.label}</span>
                  {d.hostToken && <Badge variant="secondary" size="sm">主揪</Badge>}
                  {badge && <Badge variant={badge.variant} size="sm">{badge.label}</Badge>}
                </div>
                <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 2 }}>{d.desc}</div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
};
