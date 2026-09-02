import React, { useState } from "react";
import { PlusCircle } from "lucide-react";
import { TopBar } from "./TopBar";
import { UserMenu } from "./UserMenu";
import { VisitedEventItem } from "../lib/api";
import { getLifecycleStatusFromSnapshot, categorizeForHostTabs, HostListTab } from "../lib/eventStatus";
import { DEMO_EVENTS, getDemoEventBadge } from "../lib/demoEvents";
import { Badge, Button } from "../design-system/components";
import { cardStyle, SectionLabel } from "./mobileStyles";
import { FakeUser } from "../lib/fakeAuth";

interface HostHomeProps {
  user: FakeUser;
  onLogout: () => void;
  events: VisitedEventItem[];
  onCreateEvent: () => void;
  onSelectEvent: (id: string) => void;
  onLoadDemo: (id: string, hostToken?: string) => void;
}

type TabKey = "demo" | HostListTab | "all";

// "已取消" is deliberately not a filterable tab here — PRD 2026-09-02: a
// real host should never see a cancelled activity in "我揪的團" under any
// circumstance. The only place a cancelled example is still shown is the
// dashed 示範活動 tab below, which is demo data, not the host's own events.
const TABS: { key: TabKey; label: string }[] = [
  { key: "demo", label: "示範活動" },
  { key: "all", label: "全部" },
  { key: "active", label: "進行中" },
  { key: "finalized", label: "已敲定" },
];

export const HostHome: React.FC<HostHomeProps> = ({ user, onLogout, events, onCreateEvent, onSelectEvent, onLoadDemo }) => {
  const [tab, setTab] = useState<TabKey>("all");
  const hostedEvents = events.filter((e) => e.isHost && categorizeForHostTabs(getLifecycleStatusFromSnapshot(e).key) !== "cancelled");
  const visibleEvents =
    tab === "all" || tab === "demo" ? hostedEvents : hostedEvents.filter((h) => categorizeForHostTabs(getLifecycleStatusFromSnapshot(h).key) === tab);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <TopBar title="揪甘心" right={<UserMenu user={user} onLogout={onLogout} />} />
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            background: "var(--color-primary)",
            color: "#fff",
            borderRadius: "var(--radius-card)",
            padding: 20,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800 }}>成團後，讓 AI 幫忙決定去哪吃</div>
          <Button variant="secondary" fullWidth icon={<PlusCircle size={16} />} onClick={onCreateEvent}>
            建立活動
          </Button>
        </div>

        <div style={cardStyle}>
          <SectionLabel title="我揪的團" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {TABS.map((t) => {
              const isDemo = t.key === "demo";
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    border: isDemo ? "1.5px dashed var(--color-border-strong)" : active ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
                    background: active ? (isDemo ? "var(--color-surface)" : "var(--color-primary)") : "#fff",
                    color: active ? (isDemo ? "var(--color-ink)" : "#fff") : "var(--color-ink)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "demo" ? (
            <>
              <div style={{ fontSize: 10, color: "var(--color-muted)", marginBottom: 8 }}>
                不用真的建立活動，直接預覽各種狀態的畫面（虛線標示為示範資料，非你自己建立的活動）
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {DEMO_EVENTS.map((d) => {
                  const badge = getDemoEventBadge(d.id);
                  return (
                    <div
                      key={d.id + (d.hostToken || "")}
                      onClick={() => onLoadDemo(d.id, d.hostToken)}
                      style={{ padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border-strong)", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{d.label}</span>
                        {d.hostToken && <Badge variant="secondary" size="sm">主揪</Badge>}
                        {badge && <Badge variant={badge.variant} size="sm">{badge.label}</Badge>}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 2 }}>{d.desc}</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : visibleEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px 0", color: "var(--color-muted)", fontSize: 12 }}>
              {hostedEvents.length === 0 ? "目前尚無紀錄，點上方「建立活動」開始揪團吧！" : "這個分類目前沒有活動"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleEvents.map((h) => {
                const lifecycle = getLifecycleStatusFromSnapshot(h);
                return (
                  <div
                    key={h.id}
                    onClick={() => onSelectEvent(h.id)}
                    style={{ padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-ink)" }}>{h.title}</span>
                      <Badge variant="secondary" size="sm">主揪</Badge>
                      <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : "muted"} size="sm">{lifecycle.label}</Badge>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 4 }}>
                      上次查看：{new Date(h.updatedAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
