import React from "react";
import { Ban, Mail } from "lucide-react";
import { Button } from "../design-system/components";

interface CancelEventModalProps {
  eventTitle: string;
  notifyCount: number;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CancelEventModal: React.FC<CancelEventModalProps> = ({ eventTitle, notifyCount, isLoading, onCancel, onConfirm }) => {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 18, width: "100%", maxWidth: 380 }}>
        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, color: "var(--color-error)" }}>
          <Ban size={15} />
          確定要取消「{eventTitle}」嗎？
        </div>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 10, lineHeight: 1.6 }}>
          取消後活動將標示為「已取消」，所有人將無法再投票或拍板定案，此操作無法復原。
        </div>
        {notifyCount > 0 && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: 10, borderRadius: "var(--radius-md)", background: "var(--color-info-subtle)", marginBottom: 14 }}>
            <Mail size={14} color="var(--color-info)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: "var(--color-ink)", lineHeight: 1.5 }}>
              系統將自動寄送取消通知信給 {notifyCount} 位留下 Email 的參與者。
            </span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: notifyCount > 0 ? 0 : 14 }}>
          <Button variant="muted" fullWidth onClick={onCancel} disabled={isLoading}>返回</Button>
          <Button variant="hot" fullWidth onClick={onConfirm} disabled={isLoading}>確認取消活動</Button>
        </div>
      </div>
    </div>
  );
};
