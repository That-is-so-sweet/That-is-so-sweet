import React, { useMemo, useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import { EventData } from "../../types";
import { useViewport } from "../../lib/useViewport";
import {
  RecommendTier,
  PreferenceFormState,
  emptyPreferenceForm,
  getCandidates,
  getItineraryCandidates,
  candidateReason,
  itineraryReason,
  TIER_META,
} from "../../lib/aiRecommendDemo";
import { PreferenceFormStep } from "./PreferenceFormStep";
import { RecommendResultsStep } from "./RecommendResultsStep";
import { ConsensusStep, ConsensusItem } from "./ConsensusStep";
import { ConfirmedStep } from "./ConfirmedStep";

type Step = "preference" | "results" | "consensus" | "confirmed";

interface AIRecommendFlowProps {
  event: EventData;
  onClose: () => void;
  onCopySuccess: () => void;
}

const TIERS: RecommendTier[] = ["restaurant", "activity", "itinerary"];

export const AIRecommendFlow: React.FC<AIRecommendFlowProps> = ({ event, onClose, onCopySuccess }) => {
  const { isMobile } = useViewport();
  const [tier, setTier] = useState<RecommendTier>("restaurant");
  const [step, setStep] = useState<Step>("preference");
  const [form, setForm] = useState<PreferenceFormState>(emptyPreferenceForm);
  const [myVotes, setMyVotes] = useState<Record<string, "accept" | "reject" | undefined>>({});
  const [finalChoiceId, setFinalChoiceId] = useState<string | null>(null);

  const finalSlot = event.slots.find((s) => s.id === event.finalSlotId);
  const attendingNicknames = useMemo(() => {
    const names = finalSlot
      ? event.responses.filter((r) => r.availability[finalSlot.id] === "available").map((r) => r.nickname)
      : event.responses.map((r) => r.nickname);
    return names.length > 0 ? names : ["小明", "Lily", "陳大華"];
  }, [event, finalSlot]);

  const candidates = useMemo(() => (tier === "itinerary" ? [] : getCandidates(tier)), [tier]);
  const itineraries = useMemo(() => (tier === "itinerary" ? getItineraryCandidates() : []), [tier]);

  const consensusItems: ConsensusItem[] = useMemo(() => {
    if (tier === "itinerary") return itineraries.map((it) => ({ id: it.id, emoji: "🗺️", name: it.name }));
    return candidates.map((c) => ({ id: c.id, emoji: c.emoji, name: c.name }));
  }, [tier, candidates, itineraries]);

  const switchTier = (t: RecommendTier) => {
    if (t === tier) return;
    setTier(t);
    setStep("preference");
    setForm(emptyPreferenceForm);
    setMyVotes({});
    setFinalChoiceId(null);
  };

  const goRestart = () => {
    setStep("preference");
    setForm(emptyPreferenceForm);
    setMyVotes({});
    setFinalChoiceId(null);
  };

  const ctx = { count: Math.max(attendingNicknames.length, 1) };

  const chosen = useMemo(() => {
    if (!finalChoiceId) return null;
    if (tier === "itinerary") {
      const it = itineraries.find((i) => i.id === finalChoiceId);
      if (!it) return null;
      return { emoji: "🗺️", name: it.name, reason: itineraryReason(it, form, ctx) };
    }
    const c = candidates.find((cc) => cc.id === finalChoiceId);
    if (!c) return null;
    return { emoji: c.emoji, name: c.name, reason: candidateReason(c, form, ctx) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalChoiceId, tier, candidates, itineraries, form]);

  const stepTitles: Record<Step, string> = {
    preference: "基本偏好（選填）",
    results: `AI ${TIER_META[tier].outputLabel}`,
    consensus: "共識確認",
    confirmed: "確認結果",
  };

  const canGoBack = step === "results" || step === "consensus";
  const handleBack = () => {
    if (step === "results") setStep("preference");
    else if (step === "consensus") setStep("results");
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
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)" }}>AI 推薦（示範功能）</div>
                <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {stepTitles[step]}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", display: "flex", flexShrink: 0 }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto" }}>
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => switchTier(t)}
                style={{
                  flexShrink: 0,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-pill)",
                  border: t === tier ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
                  background: t === tier ? "var(--color-primary)" : "#fff",
                  color: t === tier ? "#fff" : "var(--color-ink)",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {TIER_META[t].icon} {TIER_META[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {step === "preference" && (
            <PreferenceFormStep
              tier={tier}
              form={form}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              onSkip={() => setStep("results")}
              onNext={() => setStep("results")}
            />
          )}
          {step === "results" && (
            <RecommendResultsStep
              tier={tier}
              candidates={candidates}
              itineraries={itineraries}
              form={form}
              participantCount={attendingNicknames.length}
              onNext={() => setStep("consensus")}
            />
          )}
          {step === "consensus" && (
            <ConsensusStep
              items={consensusItems}
              nicknames={attendingNicknames}
              myVotes={myVotes}
              onToggleMyVote={(id, vote) => setMyVotes((v) => ({ ...v, [id]: v[id] === vote ? undefined : vote }))}
              onConfirm={(id) => {
                setFinalChoiceId(id);
                setStep("confirmed");
              }}
            />
          )}
          {step === "confirmed" && chosen && (
            <ConfirmedStep
              tier={tier}
              eventTitle={event.title}
              hostName={event.hostName}
              chosenEmoji={chosen.emoji}
              chosenName={chosen.name}
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
