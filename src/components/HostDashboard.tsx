import React, { useState } from "react";
import { PlusCircle } from "lucide-react";
import { VisitedEventItem } from "../lib/api";
import { getLifecycleStatusFromSnapshot, categorizeForHostTabs, HostListTab } from "../lib/eventStatus";
import { DEMO_EVENTS, getDemoEventBadge } from "../lib/demoEvents";
import { Badge, Button } from "../design-system/components";

interface HostDashboardProps {
  events: VisitedEventItem[];
  onCreateEvent: () => void;
  onSelectEvent: (id: string) => void;
  onLoadDemo: (id: string, hostToken?: string) => void;
}

type TabKey = "demo" | HostListTab | "all";

const TABS: { key: TabKey; label: string }[] = [
  { key: "demo", label: "示範活動" },
  { key: "all", label: "全部" },
  { key: "active", label: "進行中" },
  { key: "finalized", label: "已敲定" },
  { key: "cancelled", label: "已取消" },
];

export const HostDashboard: React.FC<HostDashboardProps> = ({ events, onCreateEvent, onSelectEvent, onLoadDemo }) => {
  const [tab, setTab] = useState<TabKey>("all");
  const hostedEvents = events.filter((e) => e.isHost);
  const visibleEvents =
    tab === "all" || tab === "demo" ? hostedEvents : hostedEvents.filter((h) => categorizeForHostTabs(getLifecycleStatusFromSnapshot(h).key) === tab);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          background: "var(--color-primary)",
          color: "#fff",
          borderRadius: "var(--radius-card)",
          padding: 28,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800 }}>成團後，讓 AI 幫忙決定去哪吃</div>
        <Button variant="secondary" size="lg" icon={<PlusCircle size={18} />} onClick={onCreateEvent}>
          建立活動
        </Button>
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)", marginBottom: 12 }}>
          我揪的團
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {TABS.map((t) => {
            const isDemo = t.key === "demo";
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: 13,
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
            <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 8 }}>
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
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-muted)", fontSize: 12, border: "1px dashed var(--color-border-strong)", borderRadius: "var(--radius-md)" }}>
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
                  style={{ padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-ink)" }}>{h.title}</span>
                    <Badge variant="secondary" size="sm">主揪</Badge>
                    <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.label}</Badge>
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
  );
};
