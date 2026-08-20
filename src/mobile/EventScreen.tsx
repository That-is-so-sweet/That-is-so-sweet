import React, { useState, useEffect } from "react";
import { Users, Share2, History, Plus, Clock, CalendarDays } from "lucide-react";
import { EventData, SubmitResponseInput, SubmitCommentInput } from "../types";
import { getUserNickname, getUserEmail } from "../lib/api";
import { getLifecycleStatus } from "../lib/eventStatus";
import { Badge, Tag } from "../design-system/components";
import { TopBar } from "./TopBar";
import { VoteTab } from "./VoteTab";
import { HeatmapTab } from "./HeatmapTab";
import { HostTab } from "./HostTab";
import { FinalizedView } from "./FinalizedView";
import { CancelledView } from "./CancelledView";
import { CommentBoard } from "./CommentBoard";
import { iconBtnStyle } from "./mobileStyles";

interface EventScreenProps {
  event: EventData;
  isHost: boolean;
  initialTab?: "vote" | "heatmap" | "host";
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: (newDeadline?: string) => Promise<void>;
  onCancelEvent: () => Promise<void>;
  onSubmitComment: (input: SubmitCommentInput) => Promise<void>;
  onNewEvent: () => void;
  onOpenShare: () => void;
  onOpenHistory: () => void;
  onCopySuccess: () => void;
  isLoading: boolean;
}

const TABS: { id: "vote" | "heatmap" | "host"; label: string }[] = [
  { id: "heatmap", label: "熱點圖" },
  { id: "vote", label: "勾選時間" },
  { id: "host", label: "主揪定案" },
];

export const EventScreen: React.FC<EventScreenProps> = ({
  event,
  isHost,
  initialTab,
  onRespond,
  onFinalize,
  onReopen,
  onCancelEvent,
  onSubmitComment,
  onNewEvent,
  onOpenShare,
  onOpenHistory,
  onCopySuccess,
  isLoading,
}) => {
  const [tab, setTab] = useState<"vote" | "heatmap" | "host">(initialTab && (initialTab !== "host" || isHost) ? initialTab : "heatmap");
  const [nickname, setNickname] = useState(() => getUserNickname());
  const [email, setEmail] = useState(() => getUserEmail());

  // Re-apply the requested tab whenever the URL asks for one — covers not just the
  // first mount but also navigating here via a hash-only change (e.g. pasting the
  // participant link while the app is already open in the same tab).
  useEffect(() => {
    if (initialTab && (initialTab !== "host" || isHost)) {
      setTab(initialTab);
    }
  }, [event.id, initialTab, isHost]);

  const visibleTabs = isHost ? TABS : TABS.filter((t) => t.id !== "host");
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 16px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", flexShrink: 0, overflowX: "auto" }}>
        {event.status === "active" && (
          <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  position: "relative",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "9px 0",
                  fontSize: 12,
                  fontWeight: 800,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: tab === t.id ? "var(--color-primary)" : "var(--color-muted)",
                }}
              >
                {t.label}
                {tab === t.id && (
                  <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, background: "var(--color-primary)" }} />
                )}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 0", flexShrink: 0, marginLeft: "auto" }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: lifecycle.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: lifecycle.color, whiteSpace: "nowrap" }}>{lifecycle.label}</span>
          <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.sublabel}</Badge>
          {/* <Tag size="sm" emoji={event.mode === "date_only" ? <CalendarDays size={12} /> : <Clock size={12} />}>
            {event.mode === "date_only" ? "僅選日期" : "含時段"}
          </Tag> */}
          {isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
        </div>
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
          {/* Tab-switchable block: whichever tab is active renders here. Comment board
              below is a separate block, outside this switch, so it never changes with the tab. */}
          <div>
            {tab === "vote" && (
              <VoteTab event={event} nickname={nickname} setNickname={setNickname} email={email} setEmail={setEmail} onSubmit={onRespond} isLoading={isLoading} onSubmitted={() => setTab("heatmap")} />
            )}
            {tab === "heatmap" && <HeatmapTab event={event} userNickname={nickname} onGoToVote={() => setTab("vote")} />}
            {tab === "host" && isHost && <HostTab event={event} onFinalize={onFinalize} onReopen={onReopen} onCancelEvent={onCancelEvent} isLoading={isLoading} />}
          </div>
          <div style={{ marginTop: 10, borderTop: "8px solid var(--color-cream)", padding: "16px 14px 14px" }}>
            <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
};
