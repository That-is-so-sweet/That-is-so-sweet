import React, { useMemo, useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import { EventData } from "../../types";
import { useViewport } from "../../lib/useViewport";
import { PreferenceFormState, emptyPreferenceForm, getCandidates, candidateReason } from "../../lib/aiRecommendDemo";
import { PreferenceFormStep } from "./PreferenceFormStep";
import { RecommendResultsStep } from "./RecommendResultsStep";
import { ConfirmedStep } from "./ConfirmedStep";

type Step = "preference" | "results" | "confirmed";

interface AIRecommendFlowProps {
  event: EventData;
  onClose: () => void;
  onCopySuccess: () => void;
}

export const AIRecommendFlow: React.FC<AIRecommendFlowProps> = ({ event, onClose, onCopySuccess }) => {
  const { isMobile } = useViewport();
  const [step, setStep] = useState<Step>("preference");
  const [form, setForm] = useState<PreferenceFormState>(emptyPreferenceForm);
  const [finalChoiceId, setFinalChoiceId] = useState<string | null>(null);

  const finalSlot = event.slots.find((s) => s.id === event.finalSlotId);
  const attendingNicknames = useMemo(() => {
    const names = finalSlot
      ? event.responses.filter((r) => r.availability[finalSlot.id] === "available").map((r) => r.nickname)
      : event.responses.map((r) => r.nickname);
    return names.length > 0 ? names : ["小明", "Lily", "陳大華"];
  }, [event, finalSlot]);

  const candidates = useMemo(() => getCandidates(), []);

  const goRestart = () => {
    setStep("preference");
    setForm(emptyPreferenceForm);
    setFinalChoiceId(null);
  };

  const ctx = { count: Math.max(attendingNicknames.length, 1) };

  const chosen = useMemo(() => {
    if (!finalChoiceId) return null;
    const c = candidates.find((cc) => cc.id === finalChoiceId);
    if (!c) return null;
    return { emoji: c.emoji, name: c.name, rating: c.rating, priceLevel: c.priceLevel, address: c.address, mapsUrl: c.mapsUrl, reason: candidateReason(c, form, ctx) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalChoiceId, candidates, form]);

  const stepTitles: Record<Step, string> = {
    preference: "基本偏好（選填）",
    results: "AI 候選餐廳",
    confirmed: "確認結果",
  };

  const canGoBack = step === "results";
  const handleBack = () => {
    if (step === "results") setStep("preference");
  };

  const overlayStyle: React.CSSProperties = isMobile
    ? { position: "fixed", inset: 0, background: "var(--color-cream)", zIndex: 300, display: "flex", flexDirection: "column" }
    : { position: "fixed", inset: 0, background: "rgba(26,18,8,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };

  const cardOuterStyle: React.CSSProperties = isMobile
    ? { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }
    : { background: "var(--color-cream)", borderRadius: "var(--radius-modal)", width: "100%", maxWidth: 640, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" };

  return (
    <div style={overlayStyle}>
      <div style={cardOuterStyle}>
        {/* Header */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", flexShrink: 0, borderRadius: isMobile ? 0 : "var(--radius-modal) var(--radius-modal) 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {canGoBack && (
                <button onClick={handleBack} style={{ border: "none", background: "none", color: "var(--color-primary)", cursor: "pointer", display: "flex", flexShrink: 0 }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)" }}>🍽️ AI 推薦餐廳（示範功能）</div>
                <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {stepTitles[step]}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", display: "flex", flexShrink: 0 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {step === "preference" && (
            <PreferenceFormStep
              form={form}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              onSkip={() => setStep("results")}
              onNext={() => setStep("results")}
            />
          )}
          {step === "results" && (
            <RecommendResultsStep
              candidates={candidates}
              form={form}
              participantCount={attendingNicknames.length}
              onChoose={(id) => {
                setFinalChoiceId(id);
                setStep("confirmed");
              }}
            />
          )}
          {step === "confirmed" && chosen && (
            <ConfirmedStep
              eventTitle={event.title}
              hostName={event.hostName}
              chosenEmoji={chosen.emoji}
              chosenName={chosen.name}
              rating={chosen.rating}
              priceLevel={chosen.priceLevel}
              address={chosen.address}
              mapsUrl={chosen.mapsUrl}
              reasonText={chosen.reason}
              onCopySuccess={onCopySuccess}
              onRestart={goRestart}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};
