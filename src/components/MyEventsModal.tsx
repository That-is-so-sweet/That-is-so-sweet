import React from "react";
import { X } from "lucide-react";
import { VisitedEventItem } from "../lib/api";
import { Badge, Button } from "../design-system/components";

interface MyEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventsList: VisitedEventItem[];
  onSelectEvent: (id: string) => void;
  onLoadDemo: () => void;
}

export const MyEventsModal: React.FC<MyEventsModalProps> = ({
  isOpen,
  onClose,
  eventsList,
  onSelectEvent,
  onLoadDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 20, width: "100%", maxWidth: 440, maxHeight: "80vh", overflowY: "auto", position: "relative" }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 14, border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <X size={18} />
        </button>
        <div style={{ fontSize: 15, fontWeight: 900, fontFamily: "var(--font-display)", marginBottom: 12, color: "var(--color-ink)" }}>我的聚會紀錄</div>
        {eventsList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-muted)", fontSize: 12 }}>
            目前尚無紀錄，發起活動後會顯示在這裡！
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {eventsList.map((h) => (
              <div
                key={h.id}
                onClick={() => {
                  onSelectEvent(h.id);
                  onClose();
                }}
                style={{ padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-ink)" }}>{h.title}</span>
                  {h.isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
                </div>
                <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 4 }}>
                  上次查看：{new Date(h.updatedAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
          >
            載入體驗示範活動
          </Button>
          <Button variant="muted" onClick={onClose}>關閉</Button>
        </div>
      </div>
    </div>
  );
};
