import React, { useState, useEffect } from "react";
import { Users, Share2, History, Plus, Clock, CalendarDays, ChevronLeft } from "lucide-react";
import { EventData, SubmitResponseInput, SubmitCommentInput, UpdateEventInput } from "../types";
import { getUserNickname, getUserEmail } from "../lib/api";
import { getLifecycleStatus, formatRemaining } from "../lib/eventStatus";
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
        subtitle={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Users size={11} />
            {event.responses.length} 人已回覆
          </span>
        }
        right={
          <>
            <button style={iconBtnStyle} onClick={onNewEvent} title="新增活動"><Plus size={15} /></button>
            <button style={iconBtnStyle} onClick={onOpenShare}><Share2 size={15} /></button>
            <button style={iconBtnStyle} onClick={onOpenHistory}><History size={15} /></button>
          </>
        }
      />
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", flexShrink: 0, overflowX: "auto" }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: lifecycle.color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: lifecycle.color, whiteSpace: "nowrap" }}>{lifecycle.label}</span>
        <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.sublabel}</Badge>
        {isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
        {event.status === "active" && event.responseDeadline && (
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "var(--color-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
            <Clock size={11} color="var(--color-muted)" />
            {formatRemaining(event.responseDeadline)}
          </span>
        )}
      </div>

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
          <div style={{ padding: "14px 14px 0" }}>
            <EventInfoCard
              title={event.title}
              hostName={event.hostName}
              location={event.location}
              description={event.description}
              responseDeadlineIso={event.responseDeadline}
            />
          </div>
          {view === "identify_vote" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "var(--color-primary-subtle)",
                  borderBottom: "1px solid var(--color-primary-light)",
                  boxShadow: "0 2px 6px rgba(224,104,40,0.08)",
                }}
              >
                <button
                  onClick={() => setView("heatmap")}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "var(--radius-md)", border: "1px solid var(--color-primary-light)", background: "#fff", color: "var(--color-primary)", cursor: "pointer", flexShrink: 0 }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-primary-dark)" }}>填寫我的時間</span>
              </div>
              <VoteTab event={event} nickname={nickname} setNickname={setNickname} email={email} setEmail={setEmail} onSubmit={onRespond} isLoading={isLoading} onSubmitted={() => setView("heatmap")} />
            </div>
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
