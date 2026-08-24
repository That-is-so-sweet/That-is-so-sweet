import React, { useState, useEffect } from "react";
import { Users, Share2, History, Plus, Clock, CalendarDays } from "lucide-react";
import { EventData, SubmitResponseInput, SubmitCommentInput, UpdateEventInput } from "../types";
import { getUserNickname, getUserEmail } from "../lib/api";
import { getLifecycleStatus } from "../lib/eventStatus";
import { Badge } from "../design-system/components";
import { TopBar } from "../mobile/TopBar";
import { VoteTab } from "../mobile/VoteTab";
import { HeatmapTab } from "../mobile/HeatmapTab";
import { FinalizedView } from "../mobile/FinalizedView";
import { CancelledView } from "../mobile/CancelledView";
import { CommentBoard } from "../mobile/CommentBoard";
import { iconBtnStyle } from "../mobile/mobileStyles";

interface EventViewProps {
  event: EventData;
  hostToken?: string;
  initialTab?: "vote" | "heatmap";
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: (newDeadline?: string) => Promise<void>;
  onCancelEvent: () => Promise<void>;
  onUpdateEvent?: (input: Omit<UpdateEventInput, "hostToken">) => Promise<void>;
  onSubmitComment: (input: SubmitCommentInput) => Promise<void>;
  onNewEvent: () => void;
  onOpenShareModal: () => void;
  onOpenHistory: () => void;
  onCopySuccess: () => void;
  isLoading: boolean;
}

export const EventView: React.FC<EventViewProps> = ({
  event,
  hostToken,
  initialTab,
  onRespond,
  onFinalize,
  onReopen,
  onCancelEvent,
  onUpdateEvent,
  onSubmitComment,
  onNewEvent,
  onOpenShareModal,
  onOpenHistory,
  onCopySuccess,
  isLoading,
}) => {
  const isHost = Boolean(hostToken && hostToken === event.hostToken);
  const [nickname, setNickname] = useState(() => getUserNickname());
  const [email, setEmail] = useState(() => getUserEmail());

  const isIdentifiedParticipant =
    !isHost &&
    !!nickname.trim() &&
    event.responses.some((r) => r.nickname.toLowerCase() === nickname.trim().toLowerCase());
  const defaultView: "identify_vote" | "heatmap" = isHost || isIdentifiedParticipant ? "heatmap" : "identify_vote";
  const [view, setView] = useState<"identify_vote" | "heatmap">(
    initialTab === "vote" ? "identify_vote" : initialTab === "heatmap" ? "heatmap" : defaultView
  );

  // Re-apply the requested view whenever the URL asks for one — covers not just the
  // first mount but also navigating here via a hash-only change (e.g. pasting the
  // participant link while the app is already open in the same tab).
  useEffect(() => {
    if (initialTab === "vote") setView("identify_vote");
    else if (initialTab === "heatmap") setView("heatmap");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, initialTab]);

  const lifecycle = getLifecycleStatus(event);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 24px 60px" }}>
      <div style={{ position: "relative", borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-md)", background: "var(--color-surface)" }}>
        <TopBar
          title={event.title}
          subtitle={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Users size={11} />
              {event.responses.length} 人已回覆
            </span>
          }
          right={
            <>
              <button style={iconBtnStyle} onClick={onNewEvent} title="新增活動"><Plus size={15} /></button>
              <button style={iconBtnStyle} onClick={onOpenShareModal}><Share2 size={15} /></button>
              <button style={iconBtnStyle} onClick={onOpenHistory}><History size={15} /></button>
            </>
          }
        />
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", overflowX: "auto" }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: lifecycle.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: lifecycle.color, whiteSpace: "nowrap" }}>{lifecycle.label}</span>
          <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.sublabel}</Badge>
          {isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
        </div>

        {event.status === "cancelled" ? (
          <>
            <CancelledView event={event} />
            <div style={{ marginTop: 12, borderTop: "8px solid var(--color-cream)", padding: "20px 20px 20px" }}>
              <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
            </div>
          </>
        ) : event.status === "finalized" ? (
          <>
            <FinalizedView event={event} isHost={isHost} onReopen={onReopen} onCancelEvent={isHost ? onCancelEvent : undefined} isLoading={isLoading} onCopySuccess={onCopySuccess} />
            <div style={{ marginTop: 12, borderTop: "8px solid var(--color-cream)", padding: "20px 20px 20px" }}>
              <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
            </div>
          </>
        ) : (
          <>
            {view === "identify_vote" && (
              <VoteTab event={event} nickname={nickname} setNickname={setNickname} email={email} setEmail={setEmail} onSubmit={onRespond} isLoading={isLoading} onSubmitted={() => setView("heatmap")} />
            )}
            {view === "heatmap" && (
              <>
                <HeatmapTab
                  event={event}
                  userNickname={nickname}
                  onGoToVote={() => setView("identify_vote")}
                  isHost={isHost}
                  onFinalize={onFinalize}
                  onReopen={onReopen}
                  onCancelEvent={onCancelEvent}
                  onUpdateEvent={onUpdateEvent}
                  isLoading={isLoading}
                />
                <div style={{ marginTop: 12, borderTop: "8px solid var(--color-cream)", padding: "20px 20px 20px" }}>
                  <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
