import React, { useMemo, useState } from "react";
import { X, ChevronLeft, Info } from "lucide-react";
import { EventData, AiSelectedRestaurant } from "../../types";
import { useViewport } from "../../lib/useViewport";
import { PreferenceFormState, emptyPreferenceForm, getCandidates, Candidate, candidateReason, partySizeForCount } from "../../lib/aiRecommendDemo";
import { buildFinalizedBroadcast } from "../../lib/shareText";
import { getMonthlyAiUsage, hasReachedMonthlyAiLimit, recordAiUsage } from "../../lib/aiUsage";
import { PreferenceFormStep } from "./PreferenceFormStep";
import { RecommendResultsStep } from "./RecommendResultsStep";

type Step = "preference" | "results";

interface AIRecommendFlowProps {
  event: EventData;
  onClose: () => void;
  onCopySuccess: () => void;
  onSelectAiRestaurant: (restaurant: AiSelectedRestaurant) => void;
}

export const AIRecommendFlow: React.FC<AIRecommendFlowProps> = ({ event, onClose, onCopySuccess, onSelectAiRestaurant }) => {
  const { isMobile } = useViewport();

  const finalSlot = event.slots.find((s) => s.id === event.finalSlotId);
  const attendingNicknames = useMemo(() => {
    const names = finalSlot
      ? event.responses.filter((r) => r.availability[finalSlot.id] === "available").map((r) => r.nickname)
      : event.responses.map((r) => r.nickname);
    return names.length > 0 ? names : ["小明", "Lily", "陳大華"];
  }, [event, finalSlot]);

  // Pre-fills 人數規格 from the event's actual attending count — still just a
  // starting point, the host can change the tag like any other.
  const buildInitialForm = (): PreferenceFormState => ({
    ...emptyPreferenceForm,
    partySize: partySizeForCount(attendingNicknames.length),
  });

  const [step, setStep] = useState<Step>("preference");
  const [form, setForm] = useState<PreferenceFormState>(buildInitialForm);
  const [candidates, setCandidates] = useState<Candidate[]>(() => getCandidates());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [usage, setUsage] = useState(() => getMonthlyAiUsage());
  const [showInfo, setShowInfo] = useState(false);

  const eventBroadcast = useMemo(() => buildFinalizedBroadcast(event), [event]);

  const chosen = candidates.find((c) => c.id === selectedId) || null;

  const goRestart = () => {
    setStep("preference");
    setForm(buildInitialForm());
    setCandidates(getCandidates());
    setSelectedId(null);
  };

  // Any way of leaving the flow while a restaurant is selected counts as
  // confirming it — there's no separate "confirm" step anymore (merged into
  // the results screen), so this is the one place the choice gets persisted.
  const handleClose = () => {
    if (chosen) {
      onSelectAiRestaurant({
        emoji: chosen.emoji,
        name: chosen.name,
        rating: chosen.rating,
        priceLevel: chosen.priceLevel,
        address: chosen.address,
        mapsUrl: chosen.mapsUrl,
        reason: candidateReason(chosen, form, { count: Math.max(attendingNicknames.length, 1) }),
        selectedAt: new Date().toISOString(),
      });
    }
    onClose();
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
        <div style={{ position: "relative", padding: "14px 16px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", flexShrink: 0, borderRadius: isMobile ? 0 : "var(--radius-modal) var(--radius-modal) 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {canGoBack && (
                <button onClick={handleBack} style={{ border: "none", background: "none", color: "var(--color-primary)", cursor: "pointer", display: "flex", flexShrink: 0 }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <div style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap", overflow: "hidden" }}>
                <span style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)", flexShrink: 0 }}>
                  AI 推薦餐廳
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                  本月已用 {usage.count}/{usage.limit} 次
                </span>
                {step === "preference" && (
                  <button
                    onClick={() => setShowInfo((v) => !v)}
                    style={{ border: "none", background: "none", padding: 0, display: "flex", alignItems: "center", color: "var(--color-muted)", cursor: "pointer", flexShrink: 0 }}
                  >
                    <Info size={13} />
                  </button>
                )}
              </div>
            </div>
            <button onClick={handleClose} style={{ border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", display: "flex", flexShrink: 0 }}>
              <X size={20} />
            </button>
          </div>

          {showInfo && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 310 }} onClick={() => setShowInfo(false)} />
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 16,
                  right: 16,
                  marginTop: 6,
                  background: "#fff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-md)",
                  padding: 10,
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: "var(--color-ink)",
                  zIndex: 320,
                }}
              >
                以下每個選項都是選填。填了可以幫 AI 縮小推薦範圍；略過的話，會直接用「當地最適合」的預設邏輯推薦。
              </div>
            </>
          )}
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
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};
