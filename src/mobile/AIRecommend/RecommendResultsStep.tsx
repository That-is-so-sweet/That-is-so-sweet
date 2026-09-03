import React from "react";
import { Sparkles, Star, MapPin, ExternalLink, RefreshCw, PartyPopper, Share2 } from "lucide-react";
import { Button, Tag } from "../../design-system/components";
import { cardStyle } from "../mobileStyles";
import { Candidate, PreferenceFormState, candidateReason, buildRestateSummary } from "../../lib/aiRecommendDemo";
import { canShare, shareText } from "../../lib/share";

interface RecommendResultsStepProps {
  candidates: Candidate[];
  form: PreferenceFormState;
  participantCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  refreshDisabled: boolean;
  eventBroadcast: string;
  onCopySuccess: () => void;
  onRestart: () => void;
  onClose: () => void;
}

const reasonBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  marginTop: 10,
  padding: "8px 10px",
  borderRadius: "var(--radius-md)",
  background: "var(--color-primary-subtle)",
  color: "var(--color-primary)",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.5,
};

export const RecommendResultsStep: React.FC<RecommendResultsStepProps> = ({
  candidates,
  form,
  participantCount,
  selectedId,
  onSelect,
  onRefresh,
  refreshDisabled,
  eventBroadcast,
  onCopySuccess,
  onRestart,
  onClose,
}) => {
  const ctx = { count: Math.max(participantCount, 1) };
  const chosen = candidates.find((c) => c.id === selectedId) || null;
  const chosenBroadcast = chosen
    ? `${eventBroadcast}\n\n🍽️ 推薦餐廳：${chosen.name}（⭐${chosen.rating.toFixed(1)} · ${chosen.priceLevel}）\n📍 ${chosen.address}\n🔗 ${chosen.mapsUrl}`
    : "";

  const handleCopy = async () => {
    if (!chosen) return;
    try {
      await navigator.clipboard.writeText(chosenBroadcast);
      onCopySuccess();
    } catch {
      window.prompt("複製通知：", chosenBroadcast);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ ...cardStyle, background: "var(--color-primary-subtle)", borderColor: "transparent", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Sparkles size={14} style={{ flexShrink: 0, marginTop: 2, color: "var(--color-primary)" }} />
        <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--color-ink)" }}>{buildRestateSummary(form)}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
          {chosen ? "已選定，其餘推薦僅供對照：" : `以下 ${candidates.length} 間為 AI 推薦餐廳，主揪可直接選一間拍板：`}
        </div>
        {!chosen && (
          <button
            onClick={onRefresh}
            disabled={refreshDisabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              border: "none",
              background: "none",
              color: refreshDisabled ? "var(--color-muted)" : "var(--color-primary)",
              fontSize: 11,
              fontWeight: 700,
              cursor: refreshDisabled ? "not-allowed" : "pointer",
              flexShrink: 0,
              padding: 0,
            }}
          >
            <RefreshCw size={12} />
            重新整理
          </button>
        )}
      </div>

      {candidates.map((c) => {
        const isSelected = c.id === selectedId;
        const isDimmed = chosen !== null && !isSelected;
        return (
          <div key={c.id} style={{ ...cardStyle, opacity: isDimmed ? 0.4 : 1, filter: isDimmed ? "grayscale(1)" : "none", transition: "opacity 200ms ease, filter 200ms ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-secondary-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {c.emoji}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>{c.name}</div>
                  {isSelected && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: "var(--radius-pill)", background: "rgba(90,158,90,0.15)", color: "var(--color-success)", fontSize: 10, fontWeight: 800 }}>
                      <PartyPopper size={10} />
                      已選定
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 1 }}>{c.tagline}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {c.tags.map((t) => (
                <Tag key={t} size="sm">
                  {t}
                </Tag>
              ))}
            </div>

            {/* Google Maps 單一店家欄位：評分、價格、地點、地址 */}
            <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>
                <Star size={12} fill="var(--color-secondary)" color="var(--color-secondary)" />
                {c.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{c.priceLevel}</span>
              <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{c.area}．距離 {c.distanceLabel}</span>
              <span style={{ fontSize: 11, color: "var(--color-muted)" }}>可容納 {c.capacityLabel}</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 6 }}>
              <MapPin size={12} style={{ flexShrink: 0, marginTop: 2, color: "var(--color-muted)" }} />
              <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{c.address}</span>
            </div>
            <a
              href={c.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textDecoration: "none" }}
            >
              <ExternalLink size={11} />
              在 Google Maps 開啟
            </a>

            <div style={reasonBoxStyle}>
              <Sparkles size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{candidateReason(c, form, ctx)}</span>
            </div>

            {!chosen && (
              <div style={{ marginTop: 10 }}>
                <Button variant="dark" fullWidth onClick={() => onSelect(c.id)}>
                  選這家，就決定是這裡
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {chosen && (
        <div style={{ ...cardStyle, background: "rgba(90,158,90,0.06)", borderColor: "rgba(90,158,90,0.3)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>一鍵複製確認通知</div>
          <div style={{ background: "#fff", borderRadius: "var(--radius-md)", padding: 10, fontSize: 11, whiteSpace: "pre-line", overflowWrap: "anywhere", lineHeight: 1.6, color: "var(--color-ink)", marginBottom: 8 }}>
            {chosenBroadcast}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canShare && (
              <Button variant="secondary" fullWidth icon={<Share2 size={16} />} onClick={() => shareText({ title: "推薦餐廳確認通知", text: chosenBroadcast })}>
                分享
              </Button>
            )}
            <Button variant="dark" fullWidth onClick={handleCopy}>
              一鍵複製通知
            </Button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="muted" fullWidth onClick={onRestart}>
              重新選一次
            </Button>
            <Button variant="primary" fullWidth onClick={onClose}>
              完成，關閉
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
