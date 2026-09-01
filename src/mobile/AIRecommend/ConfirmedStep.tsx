import React from "react";
import { PartyPopper, Star } from "lucide-react";
import { Button } from "../../design-system/components";
import { cardStyle } from "../mobileStyles";

interface ConfirmedStepProps {
  eventTitle: string;
  hostName?: string;
  chosenEmoji: string;
  chosenName: string;
  rating: number;
  priceLevel: string;
  address: string;
  mapsUrl: string;
  reasonText: string;
  onCopySuccess: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export const ConfirmedStep: React.FC<ConfirmedStepProps> = ({
  eventTitle,
  hostName,
  chosenEmoji,
  chosenName,
  rating,
  priceLevel,
  address,
  mapsUrl,
  reasonText,
  onCopySuccess,
  onRestart,
  onClose,
}) => {
  const broadcast = `🎉 ${eventTitle}｜推薦餐廳結果已確認！\n${chosenEmoji} ${chosenName}（⭐${rating.toFixed(1)} · ${priceLevel}）\n📍 ${address}\n🔗 ${mapsUrl}\n${reasonText}\n— 由主揪${hostName ? ` ${hostName}` : ""}拍板`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(broadcast);
      onCopySuccess();
    } catch {
      window.prompt("複製確認通知：", broadcast);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "var(--color-ink)", color: "#fff", borderRadius: "var(--radius-card)", padding: 16, textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: "var(--radius-pill)",
            background: "rgba(90,158,90,0.25)",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          <PartyPopper size={12} />
          餐廳已確認
        </span>
        <div style={{ fontSize: 32, marginTop: 12 }}>{chosenEmoji}</div>
        <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "var(--font-display)", marginTop: 4 }}>{chosenName}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, fontSize: 12, opacity: 0.85 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <Star size={12} fill="var(--color-secondary)" color="var(--color-secondary)" />
            {rating.toFixed(1)}
          </span>
          <span>{priceLevel}</span>
        </div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>{reasonText}</div>
      </div>

      <div style={{ ...cardStyle, background: "rgba(90,158,90,0.06)", borderColor: "rgba(90,158,90,0.3)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>一鍵複製確認通知</div>
        <div style={{ background: "#fff", borderRadius: "var(--radius-md)", padding: 10, fontSize: 11, whiteSpace: "pre-line", overflowWrap: "anywhere", lineHeight: 1.6, color: "var(--color-ink)", marginBottom: 8 }}>
          {broadcast}
        </div>
        <Button variant="dark" fullWidth onClick={handleCopy}>
          一鍵複製通知
        </Button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="muted" fullWidth onClick={onRestart}>
          重新選一次
        </Button>
        <Button variant="primary" fullWidth onClick={onClose}>
          完成，關閉
        </Button>
      </div>
    </div>
  );
};
