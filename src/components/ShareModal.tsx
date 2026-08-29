import React from "react";
import { X, Check, Clock, PartyPopper, Ban, Crown } from "lucide-react";
import { EventData } from "../types";
import { getEventShareUrl, getShareContent, ShareKind } from "../lib/shareText";
import { Button } from "../design-system/components";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData;
  hostToken?: string;
  onCopySuccess: () => void;
}

const KIND_STYLE: Record<ShareKind, { icon: React.ReactNode; color: string; bg: string }> = {
  collecting: { icon: <Check size={26} />, color: "var(--color-success)", bg: "rgba(90,158,90,0.12)" },
  voting_closed: { icon: <Clock size={26} />, color: "var(--color-hot)", bg: "var(--color-hot-subtle)" },
  finalized: { icon: <PartyPopper size={26} />, color: "var(--color-primary)", bg: "var(--color-primary-subtle)" },
  cancelled: { icon: <Ban size={26} />, color: "var(--color-error)", bg: "var(--color-error-subtle)" },
};

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, event, hostToken, onCopySuccess }) => {
  if (!isOpen) return null;

  const appOrigin = window.location.origin;
  const shareUrl = getEventShareUrl(event, appOrigin);
  const content = getShareContent(event, shareUrl);
  const style = KIND_STYLE[content.kind];

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
              background: style.bg,
              color: style.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
            }}
          >
            {style.icon}
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>{content.headline}</div>
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>{event.title}</div>
        </div>
        <Button variant="primary" fullWidth onClick={() => copy(content.copyText, `${content.copyButtonLabel}：`)}>{content.copyButtonLabel}</Button>
        <div style={{ background: "var(--color-cream)", borderRadius: "var(--radius-md)", padding: 14, marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--color-ink)" }}>本活動專屬連結</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={shareUrl} style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: "var(--radius-input)", border: "1px solid var(--color-border)", fontSize: 12, background: "#fff", color: "var(--color-ink)" }} />
            <Button variant="dark" size="sm" onClick={() => copy(shareUrl, "複製活動連結：")}>複製</Button>
          </div>
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 8, lineHeight: 1.5 }}>
            這個連結在整個活動期間都有效，打開都會看到活動/投票進行的狀態喔！
          </div>
        </div>
        {hostToken && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: "var(--radius-md)", background: "var(--color-cream)", fontSize: 12, color: "var(--color-muted)", lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <Crown size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>此瀏覽器已自動儲存您為主揪。更換裝置時可使用含有主揪密鑰的管理網址來管理此活動。</span>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <Button variant="ghost" fullWidth onClick={onClose}>{content.kind === "collecting" ? "進入活動統計頁面" : "返回活動頁面"}</Button>
        </div>
      </div>
    </div>
  );
};
