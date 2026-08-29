import React, { useState } from "react";
import { CheckCircle2, MessageCircle, RotateCcw, Archive, Ban } from "lucide-react";
import { EventData } from "../types";
import { formatChineseWeekday, generateGoogleCalendarUrl, downloadIcsFile } from "../lib/calendar";
import { getMeetupEndInfo } from "../lib/eventStatus";
import { formatSlotTime } from "../lib/slots";
import { buildFinalizedBroadcast } from "../lib/shareText";
import { Button } from "../design-system/components";
import { cardStyle, SectionLabel } from "./mobileStyles";
import { ReopenModal } from "./ReopenModal";
import { CancelEventModal } from "./CancelEventModal";

interface FinalizedViewProps {
  event: EventData;
  isHost?: boolean;
  onReopen?: (newDeadline?: string) => Promise<void>;
  onCancelEvent?: () => Promise<void>;
  isLoading?: boolean;
  onCopySuccess: () => void;
}

export const FinalizedView: React.FC<FinalizedViewProps> = ({ event, isHost, onReopen, onCancelEvent, isLoading, onCopySuccess }) => {
  const [reopening, setReopening] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const slot = event.slots.find((s) => s.id === event.finalSlotId) || event.slots[0];
  const attending = event.responses.filter((r) => r.availability[slot.id] === "available").map((r) => r.nickname);
  const isDateOnly = event.mode === "date_only";
  const hasEnded = !!getMeetupEndInfo(event)?.hasEnded;
  const locationDescriptionFallback = [event.location?.text, event.description].filter(Boolean).join("\n");

  const broadcast = buildFinalizedBroadcast(event);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(broadcast);
      onCopySuccess();
    } catch {
      window.prompt("複製定案通知：", broadcast);
    }
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: hasEnded ? "var(--color-muted)" : "var(--color-ink)", color: "#fff", borderRadius: "var(--radius-card)", padding: 16 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: "var(--radius-pill)",
            background: hasEnded ? "rgba(255,255,255,0.2)" : "rgba(90,158,90,0.25)",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {hasEnded ? <Archive size={12} /> : <CheckCircle2 size={12} />}
          {hasEnded ? "活動已結束" : "活動時間已敲定"}
        </span>
        <div style={{ fontSize: 17, fontWeight: 900, fontFamily: "var(--font-display)", marginTop: 10 }}>{event.title}</div>
        {event.hostName && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>發起人：{event.hostName}</div>}
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", padding: 12, marginTop: 12 }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>聚會日期</div>
          <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "var(--font-display)" }}>
            {slot.date} ({formatChineseWeekday(slot.date)})
          </div>
          {!isDateOnly && (
            <>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>時段</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{formatSlotTime(slot.time)}</div>
            </>
          )}
          {event.finalNote && (
            <div style={{ fontSize: 11, marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "flex-start", gap: 4 }}>
              <MessageCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{event.finalNote}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() =>
              window.open(
                generateGoogleCalendarUrl(event.title, slot.date, slot.time, event.finalNote || locationDescriptionFallback, `主揪：${event.hostName || ""}`, isDateOnly),
                "_blank"
              )
            }
          >
            加到日曆
          </Button>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => downloadIcsFile(event.title, slot.date, slot.time, event.finalNote || locationDescriptionFallback, `主揪：${event.hostName || ""}`, isDateOnly)}
          >
            下載 .ics
          </Button>
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title={`出席名單 (${attending.length} 人)`} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {attending.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--color-muted)" }}>尚無標示為確定出席的名單</span>
          ) : (
            attending.map((n, i) => (
              <span
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: "var(--radius-pill)",
                  background: "rgba(90,158,90,0.12)",
                  color: "var(--color-success)",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-success)" }} />
                {n}
              </span>
            ))
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, background: "rgba(90,158,90,0.06)", borderColor: "rgba(90,158,90,0.3)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>一鍵複製聚會敲定通知</div>
        <div style={{ background: "#fff", borderRadius: "var(--radius-md)", padding: 10, fontSize: 11, whiteSpace: "pre-line", lineHeight: 1.6, color: "var(--color-ink)", marginBottom: 8 }}>
          {broadcast}
        </div>
        <Button variant="dark" fullWidth onClick={handleCopy}>一鍵複製定案通知</Button>
      </div>

      {isHost && (onReopen || onCancelEvent) && (
        <div style={{ display: "flex", gap: 8 }}>
          {onReopen && (
            <Button variant="muted" fullWidth onClick={() => setReopening(true)}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <RotateCcw size={13} />
                重新開放投票
              </span>
            </Button>
          )}
          {onCancelEvent && (
            <Button variant="hot" fullWidth disabled={isLoading} onClick={() => setCancelling(true)}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Ban size={13} />
                取消活動
              </span>
            </Button>
          )}
        </div>
      )}
      {reopening && onReopen && (
        <ReopenModal
          currentDeadline={event.responseDeadline}
          onCancel={() => setReopening(false)}
          onConfirm={(newDeadline) => {
            setReopening(false);
            onReopen(newDeadline);
          }}
        />
      )}
      {cancelling && onCancelEvent && (
        <CancelEventModal
          eventTitle={event.title}
          isLoading={isLoading}
          onCancel={() => setCancelling(false)}
          onConfirm={() => {
            setCancelling(false);
            onCancelEvent();
          }}
        />
      )}
    </div>
  );
};
