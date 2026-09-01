import React from "react";
import { Sparkles, Star, MapPin, ExternalLink } from "lucide-react";
import { Button, Tag } from "../../design-system/components";
import { cardStyle } from "../mobileStyles";
import { Candidate, PreferenceFormState, candidateReason, buildRestateSummary } from "../../lib/aiRecommendDemo";

interface RecommendResultsStepProps {
  candidates: Candidate[];
  form: PreferenceFormState;
  participantCount: number;
  onChoose: (candidateId: string) => void;
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

export const RecommendResultsStep: React.FC<RecommendResultsStepProps> = ({ candidates, form, participantCount, onChoose }) => {
  const ctx = { count: Math.max(participantCount, 1) };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ ...cardStyle, background: "var(--color-primary-subtle)", borderColor: "transparent", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Sparkles size={14} style={{ flexShrink: 0, marginTop: 2, color: "var(--color-primary)" }} />
        <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--color-ink)" }}>{buildRestateSummary(form)}</div>
      </div>

      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>以下 {candidates.length} 間為 AI 推薦餐廳，主揪可直接選一間拍板：</div>

      {candidates.map((c) => (
        <div key={c.id} style={cardStyle}>
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
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>{c.name}</div>
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

          <div style={{ marginTop: 10 }}>
            <Button variant="dark" fullWidth onClick={() => onChoose(c.id)}>
              選這家，就決定是這裡
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
