import React, { useState } from "react";
import { Users, Share2, History, Plus } from "lucide-react";
import { EventData, SubmitResponseInput } from "../types";
import { getUserNickname, getUserEmail } from "../lib/api";
import { Badge } from "../design-system/components";
import { TopBar } from "./TopBar";
import { VoteTab } from "./VoteTab";
import { HeatmapTab } from "./HeatmapTab";
import { HostTab } from "./HostTab";
import { FinalizedView } from "./FinalizedView";
import { iconBtnStyle } from "./mobileStyles";

interface EventScreenProps {
  event: EventData;
  isHost: boolean;
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: () => Promise<void>;
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
  onRespond,
  onFinalize,
  onReopen,
  onNewEvent,
  onOpenShare,
  onOpenHistory,
  onCopySuccess,
  isLoading,
}) => {
  const [tab, setTab] = useState<"vote" | "heatmap" | "host">("heatmap");
  const [nickname, setNickname] = useState(() => getUserNickname());
  const [email, setEmail] = useState(() => getUserEmail());

  const visibleTabs = isHost ? TABS : TABS.filter((t) => t.id !== "host");

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
        {event.status !== "finalized" && (
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
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--color-success)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--color-success)", whiteSpace: "nowrap" }}>
            {event.status === "finalized" ? "已敲定通知模式" : "統計時間中"}
          </span>
          {isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
        </div>
      </div>

      {event.status === "finalized" ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <FinalizedView event={event} isHost={isHost} onReopen={onReopen} onCopySuccess={onCopySuccess} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "vote" && (
            <VoteTab event={event} nickname={nickname} setNickname={setNickname} email={email} setEmail={setEmail} onSubmit={onRespond} isLoading={isLoading} />
          )}
          {tab === "heatmap" && <HeatmapTab event={event} userNickname={nickname} onGoToVote={() => setTab("vote")} />}
          {tab === "host" && isHost && <HostTab event={event} onFinalize={onFinalize} isLoading={isLoading} />}
        </div>
      )}
    </div>
  );
};
