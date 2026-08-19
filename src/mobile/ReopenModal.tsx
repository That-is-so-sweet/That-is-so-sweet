import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "../design-system/components";
import { getDefaultDeadlineLocalValue, getNowLocalValue, isoToLocalValue, localValueToIso, isVotingOpen } from "../lib/eventStatus";

interface ReopenModalProps {
  currentDeadline?: string;
  onConfirm: (newDeadline: string) => void;
  onCancel: () => void;
}

export const ReopenModal: React.FC<ReopenModalProps> = ({ currentDeadline, onConfirm, onCancel }) => {
  const stillOpen = currentDeadline ? isVotingOpen({ status: "active", responseDeadline: currentDeadline }) : false;
  const [deadline, setDeadline] = useState(() =>
    currentDeadline && stillOpen ? isoToLocalValue(currentDeadline) : getDefaultDeadlineLocalValue()
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 18, width: "100%", maxWidth: 380 }}>
        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <RotateCcw size={15} />
          重新開放投票
        </div>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 14, lineHeight: 1.6 }}>
          活動將重新開放給大家投票，請設定新的投票截止時間：
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-ink)", display: "block", marginBottom: 6 }}>投票截止時間</label>
        <input
          type="datetime-local"
          value={deadline}
          min={getNowLocalValue()}
          onChange={(e) => setDeadline(e.target.value)}
          style={{ width: "100%", padding: "9px 10px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", fontSize: 13, fontWeight: 700, marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="muted" fullWidth onClick={onCancel}>取消</Button>
          <Button variant="hot" fullWidth disabled={!deadline} onClick={() => onConfirm(localValueToIso(deadline))}>
            確認重新開放
          </Button>
        </div>
      </div>
    </div>
  );
};
