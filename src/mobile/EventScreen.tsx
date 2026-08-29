import React, { useState, useEffect } from "react";
import { Share2, History, Plus, CalendarDays, ChevronLeft } from "lucide-react";
import { EventData, SubmitResponseInput, SubmitCommentInput, UpdateEventInput } from "../types";
import { getUserNickname, getUserEmail } from "../lib/api";
import { getLifecycleStatus } from "../lib/eventStatus";
import { Badge } from "../design-system/components";
import { TopBar } from "./TopBar";
import { VoteTab } from "./VoteTab";
import { HeatmapTab } from "./HeatmapTab";
import { FinalizedView } from "./FinalizedView";
import { CancelledView } from "./CancelledView";
import { CommentBoard } from "./CommentBoard";
import { EventInfoCard } from "./EventInfoCard";
import { iconBtnStyle } from "./mobileStyles";

interface EventScreenProps {
  event: EventData;
  isHost: boolean;
  initialTab?: "vote" | "heatmap";
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: (newDeadline?: string) => Promise<void>;
  onCancelEvent: () => Promise<void>;
  onUpdateEvent?: (input: Omit<UpdateEventInput, "hostToken">) => Promise<void>;
  onSubmitComment: (input: SubmitCommentInput) => Promise<void>;
  onNewEvent: () => void;
  onOpenShare: () => void;
  onOpenHistory: () => void;
  onCopySuccess: () => void;
  isLoading: boolean;
}

export const EventScreen: React.FC<EventScreenProps> = ({
  event,
  isHost,
  initialTab,
  onRespond,
  onFinalize,
  onReopen,
  onCancelEvent,
  onUpdateEvent,
  onSubmitComment,
  onNewEvent,
  onOpenShare,
  onOpenHistory,
  onCopySuccess,
  isLoading,
}) => {
  const [nickname, setNickname] = useState(() => getUserNickname());
  const [email, setEmail] = useState(() => getUserEmail());

  // 第一次進來一律先看熱點圖（目前大家的投票狀態）；只有明確點了「我要投票」
  // 或透過帶 tab=vote 的邀請連結進來，才會直接顯示投票輸入畫面。
  const [view, setView] = useState<"identify_vote" | "heatmap">(
    initialTab === "vote" ? "identify_vote" : "heatmap"
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
      <TopBar
        title={event.title}
        right={
          <>
            <button style={iconBtnStyle} onClick={onNewEvent} title="新增活動"><Plus size={15} /></button>
            <button style={iconBtnStyle} onClick={onOpenShare}><Share2 size={15} /></button>
            <button style={iconBtnStyle} onClick={onOpenHistory}><History size={15} /></button>
          </>
        }
      />
      {(view === "identify_vote" || isHost) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", flexShrink: 0, overflowX: "auto" }}>
          {view === "identify_vote" && (
            <button
              onClick={() => setView("heatmap")}
              style={{ display: "inline-flex", alignItems: "center", gap: 2, border: "none", background: "none", color: "var(--color-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, padding: 0, whiteSpace: "nowrap" }}
            >
              <ChevronLeft size={13} />
              返回統計頁面
            </button>
          )}
          {isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
        </div>
      )}

      {event.status === "cancelled" ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <CancelledView event={event} />
          <div style={{ marginTop: 10, borderTop: "8px solid var(--color-cream)", padding: "16px 14px 14px" }}>
            <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
          </div>
        </div>
      ) : event.status === "finalized" ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <FinalizedView event={event} isHost={isHost} onReopen={onReopen} onCancelEvent={isHost ? onCancelEvent : undefined} isLoading={isLoading} onCopySuccess={onCopySuccess} />
          <div style={{ marginTop: 10, borderTop: "8px solid var(--color-cream)", padding: "16px 14px 14px" }}>
            <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {view === "identify_vote" && (
            <VoteTab event={event} nickname={nickname} setNickname={setNickname} email={email} setEmail={setEmail} onSubmit={onRespond} isLoading={isLoading} onSubmitted={() => setView("heatmap")} />
          )}
          {view === "heatmap" && (
            <>
              <div style={{ padding: "14px 14px 0" }}>
                <EventInfoCard
                  title={event.title}
                  hostName={event.hostName}
                  location={event.location}
                  description={event.description}
                  responseDeadlineIso={event.responseDeadline}
                  statusLabel={lifecycle.label}
                  statusColor={lifecycle.color}
                />
              </div>
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
              <div style={{ marginTop: 10, borderTop: "8px solid var(--color-cream)", padding: "16px 14px 14px" }}>
                <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
