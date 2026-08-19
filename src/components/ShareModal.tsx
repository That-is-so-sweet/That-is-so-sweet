import React from "react";
import { X, Check, Crown } from "lucide-react";
import { EventData } from "../types";
import { Button } from "../design-system/components";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData;
  hostToken?: string;
  onCopySuccess: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, event, hostToken, onCopySuccess }) => {
  if (!isOpen) return null;

  const appOrigin = window.location.origin;
  const shareUrl = `${appOrigin}/#event=${event.id}`;
  const lineText = `📢【${event.title}】聚會時間調查邀請！
主揪：${event.hostName || "熱心朋友"}
${event.description ? `說明：${event.description}\n` : ""}
不用註冊登入，點擊連結即可選擇你有空的時間：
${shareUrl}`;

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onCopySuccess();
    } catch {
      window.prompt(msg, text);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 24, width: "100%", maxWidth: 440, maxHeight: "85vh", overflowY: "auto", position: "relative" }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <X size={18} />
        </button>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-pill)",
              background: "rgba(90,158,90,0.12)",
              color: "var(--color-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
            }}
          >
            <Check size={26} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>活動建立成功！</div>
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>{event.title}</div>
        </div>
        <Button variant="primary" fullWidth onClick={() => copy(lineText, "複製 LINE 分享文字：")}>複製 LINE 分享文字</Button>
        <div style={{ background: "var(--color-cream)", borderRadius: "var(--radius-md)", padding: 14, marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--color-ink)" }}>專屬參與者填寫連結</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={shareUrl} style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: "var(--radius-input)", border: "1px solid var(--color-border)", fontSize: 12, background: "#fff", color: "var(--color-ink)" }} />
            <Button variant="dark" size="sm" onClick={() => copy(shareUrl, "複製活動連結：")}>複製</Button>
          </div>
        </div>
        {hostToken && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: "var(--radius-md)", background: "var(--color-cream)", fontSize: 12, color: "var(--color-muted)", lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <Crown size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>此瀏覽器已自動儲存您為主揪。更換裝置時可使用含有主揪密鑰的管理網址來管理此活動。</span>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <Button variant="ghost" fullWidth onClick={onClose}>進入活動統計頁面</Button>
        </div>
      </div>
    </div>
  );
};
