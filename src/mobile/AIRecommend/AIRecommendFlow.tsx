import React, { useMemo, useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import { EventData } from "../../types";
import { useViewport } from "../../lib/useViewport";
import { PreferenceFormState, emptyPreferenceForm, getCandidates, Candidate } from "../../lib/aiRecommendDemo";
import { buildFinalizedBroadcast } from "../../lib/shareText";
import { getMonthlyAiUsage, hasReachedMonthlyAiLimit, recordAiUsage } from "../../lib/aiUsage";
import { PreferenceFormStep } from "./PreferenceFormStep";
import { RecommendResultsStep } from "./RecommendResultsStep";

type Step = "preference" | "results";

interface AIRecommendFlowProps {
  event: EventData;
  onClose: () => void;
  onCopySuccess: () => void;
}

export const AIRecommendFlow: React.FC<AIRecommendFlowProps> = ({ event, onClose, onCopySuccess }) => {
  const { isMobile } = useViewport();
  const [step, setStep] = useState<Step>("preference");
  const [form, setForm] = useState<PreferenceFormState>(emptyPreferenceForm);
  const [candidates, setCandidates] = useState<Candidate[]>(() => getCandidates());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [usage, setUsage] = useState(() => getMonthlyAiUsage());

  const finalSlot = event.slots.find((s) => s.id === event.finalSlotId);
  const attendingNicknames = useMemo(() => {
    const names = finalSlot
      ? event.responses.filter((r) => r.availability[finalSlot.id] === "available").map((r) => r.nickname)
      : event.responses.map((r) => r.nickname);
    return names.length > 0 ? names : ["小明", "Lily", "陳大華"];
  }, [event, finalSlot]);

  const eventBroadcast = useMemo(() => buildFinalizedBroadcast(event), [event]);

  const goRestart = () => {
    setStep("preference");
    setForm(emptyPreferenceForm);
    setCandidates(getCandidates());
    setSelectedId(null);
  };

  const generateResults = (shuffle: boolean) => {
    if (hasReachedMonthlyAiLimit()) return;
    recordAiUsage();
    setUsage(getMonthlyAiUsage());
    setCandidates(getCandidates(shuffle));
    setSelectedId(null);
    setStep("results");
  };

  const limitReached = usage.count >= usage.limit;

  const stepTitles: Record<Step, string> = {
    preference: "基本偏好（選填）",
    results: "AI 候選餐廳",
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
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)" }}>
                  🍽️ AI 推薦餐廳（示範功能）· 本月已用 {usage.count}/{usage.limit} 次
                </div>
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
          {step === "preference" &&
            (limitReached ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--color-muted)", fontSize: 13, lineHeight: 1.7 }}>
                本月 AI 選餐廳使用次數已達上限（{usage.limit} 次），請下個月再試。
              </div>
            ) : (
              <PreferenceFormStep
                form={form}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                onSkip={() => generateResults(false)}
                onNext={() => generateResults(false)}
              />
            ))}
          {step === "results" && (
            <RecommendResultsStep
              candidates={candidates}
              form={form}
              participantCount={attendingNicknames.length}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              onRefresh={() => generateResults(true)}
              refreshDisabled={limitReached}
              eventBroadcast={eventBroadcast}
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
