import React from "react";
import { Sparkles } from "lucide-react";
import { Button, Tag } from "../../design-system/components";
import { cardStyle } from "../mobileStyles";
import {
  Candidate,
  ItineraryCandidate,
  PreferenceFormState,
  RecommendTier,
  candidateReason,
  itineraryReason,
  isFormFilled,
} from "../../lib/aiRecommendDemo";

interface RecommendResultsStepProps {
  tier: RecommendTier;
  candidates: Candidate[];
  itineraries: ItineraryCandidate[];
  form: PreferenceFormState;
  participantCount: number;
  onNext: () => void;
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
  tier,
  candidates,
  itineraries,
  form,
  participantCount,
  onNext,
}) => {
  const ctx = { count: Math.max(participantCount, 1) };
  const personalized = isFormFilled(form);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
        {personalized ? "已依你填寫的偏好產生以下推薦：" : "尚未填寫偏好，以下為「當地最適合」的預設推薦："}
      </div>

      {tier !== "itinerary" &&
        candidates.map((c) => (
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

            <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
              {c.meta.map((m) => (
                <div key={m.label} style={{ fontSize: 11 }}>
                  <span style={{ color: "var(--color-muted)" }}>{m.label}：</span>
                  <span style={{ fontWeight: 800, color: "var(--color-ink)" }}>{m.value}</span>
                </div>
              ))}
            </div>

            <div style={reasonBoxStyle}>
              <Sparkles size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{candidateReason(c, form, ctx)}</span>
            </div>
          </div>
        ))}

      {tier === "itinerary" &&
        itineraries.map((it) => (
          <div key={it.id} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>{it.name}</div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--color-muted)", whiteSpace: "nowrap" }}>{it.totalDuration}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{it.summary}</div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 0 }}>
              {it.stops.map((s, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "var(--color-secondary-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      {s.emoji}
                    </span>
                    {idx < it.stops.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 18, background: "var(--color-border)", marginTop: 2 }} />}
                  </div>
                  <div style={{ paddingBottom: idx < it.stops.length - 1 ? 12 : 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-primary)" }}>{s.time}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-ink)" }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{s.note}</div>
                    {s.transit && (
                      <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 2 }}>
                        {s.transit.includes("開車") ? "🚗" : s.transit.includes("大眾運輸") ? "🚌" : "🚶"} {s.transit}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={reasonBoxStyle}>
              <Sparkles size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{itineraryReason(it, form, ctx)}</span>
            </div>
          </div>
        ))}

      <Button variant="primary" fullWidth onClick={onNext}>
        開始共識確認
      </Button>
    </div>
  );
};
