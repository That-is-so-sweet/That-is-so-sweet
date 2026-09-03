import React, { useState, useEffect } from "react";
import { MessageCircle, BarChart3, CalendarDays, CalendarCheck, ChevronDown, ChevronUp, ChevronLeft, X, AlertTriangle, Ban, Check, Award, Info } from "lucide-react";
import { AvailabilityStatus, EventData, SlotStats, UpdateEventInput } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { computeSlotStats, formatSlotTime } from "../lib/slots";
import { getLifecycleStatus, formatDeadline } from "../lib/eventStatus";
import { Avatar, Badge, Button, Input } from "../design-system/components";
import { cardStyle, countInAdjacentMonth, EmailIndicator, MonthNavButton, SectionLabel, STATUS_META } from "./mobileStyles";
import { ReopenModal } from "./ReopenModal";
import { CancelEventModal } from "./CancelEventModal";
import { EditEventModal } from "./EditEventModal";

interface HeatmapTabProps {
  event: EventData;
  userNickname: string;
  onGoToVote: () => void;
  isHost?: boolean;
  onFinalize?: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen?: (newDeadline?: string) => Promise<void>;
  onCancelEvent?: () => Promise<void>;
  onUpdateEvent?: (input: Omit<UpdateEventInput, "hostToken">) => Promise<void>;
  isLoading?: boolean;
  /** Desktop has room to show the calendar and its selected-date detail side by side. */
  layout?: "mobile" | "desktop";
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

const heatColor = (ratio: number) =>
  ratio >= 0.75 ? "var(--color-success)" : ratio >= 0.4 ? "rgba(90,158,90,0.3)" : ratio > 0 ? "rgba(90,158,90,0.12)" : "var(--color-cream)";

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => (
  <span
    style={{
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "var(--color-ink)",
      color: "#fff",
      fontSize: 10,
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {rank}
  </span>
);

const BREAKDOWN_ITEMS: { status: AvailabilityStatus; metaKey: "available" | "if_needed" | "unavailable" }[] = [
  { status: "available", metaKey: "available" },
  { status: "if_needed", metaKey: "if_needed" },
  { status: "unavailable", metaKey: "unavailable" },
];

const BreakdownIcons: React.FC<{ s: SlotStats; color?: string; size?: number; onSelect?: (status: AvailabilityStatus) => void }> = ({ s, color, size = 10, onSelect }) => {
  const counts: Record<AvailabilityStatus, number> = { available: s.availableCount, if_needed: s.ifNeededCount, unavailable: s.unavailableCount };
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {BREAKDOWN_ITEMS.map(({ status, metaKey }) => {
        const meta = STATUS_META[metaKey];
        const itemColor = color || meta.color;
        const content = (
          <>
            <meta.icon size={size} color={itemColor} />
            {counts[status]}
          </>
        );
        return onSelect ? (
          <button
            key={status}
            onClick={(e) => { e.stopPropagation(); onSelect(status); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 2, color: itemColor, background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer" }}
          >
            {content}
          </button>
        ) : (
          <span key={status} style={{ display: "inline-flex", alignItems: "center", gap: 2, color: itemColor }}>
            {content}
          </span>
        );
      })}
    </div>
  );
};

const NamesPanel: React.FC<{ s: SlotStats }> = ({ s }) => (
  <div style={{ marginTop: 6, padding: 8, background: "var(--color-cream)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 6 }}>
    {s.availableNames.length > 0 && (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11 }}>
        <STATUS_META.available.icon size={11} color={STATUS_META.available.color} style={{ flexShrink: 0, marginTop: 2 }} />
        <span><span style={{ fontWeight: 800 }}>確定有空</span>：{s.availableNames.join("、")}</span>
      </div>
    )}
    {s.ifNeededNames.length > 0 && (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11 }}>
        <STATUS_META.if_needed.icon size={11} color={STATUS_META.if_needed.color} style={{ flexShrink: 0, marginTop: 2 }} />
        <span><span style={{ fontWeight: 800 }}>可能／視情況</span>：{s.ifNeededNames.join("、")}</span>
      </div>
    )}
    {s.unavailableNames.length > 0 && (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "var(--color-muted)" }}>
        <STATUS_META.unavailable.icon size={11} color={STATUS_META.unavailable.color} style={{ flexShrink: 0, marginTop: 2 }} />
        <span><span style={{ fontWeight: 800 }}>不行</span>：{s.unavailableNames.join("、")}</span>
      </div>
    )}
  </div>
);

interface HeatSlotRowProps {
  s: SlotStats;
  primaryLabel: string;
  rank?: number;
  total: number;
  isHost?: boolean;
  isFinalizePick: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectFinalize: () => void;
  onSelectBreakdown?: (status: AvailabilityStatus) => void;
}

const HeatSlotRow: React.FC<HeatSlotRowProps> = ({ s, primaryLabel, rank, total, isHost, isFinalizePick, isExpanded, onToggleExpand, onSelectFinalize, onSelectBreakdown }) => {
  const availPct = total ? (s.availableCount / total) * 100 : 0;
  const ifNeededPct = total ? (s.ifNeededCount / total) * 100 : 0;
  const unavailPct = total ? (s.unavailableCount / total) * 100 : 0;
  return (
    <div
      style={{
        border: isFinalizePick ? "2px solid var(--color-primary)" : "2px solid transparent",
        borderRadius: "var(--radius-md)",
        background: isFinalizePick ? "var(--color-primary-subtle)" : "transparent",
        padding: isHost ? 6 : 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div onClick={onToggleExpand} style={{ marginBottom: 6, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--color-ink)", display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                {rank !== undefined && <RankBadge rank={rank} />}
                {primaryLabel}
              </span>
              <BreakdownIcons s={s} size={10} onSelect={onSelectBreakdown} />
            </div>
            {s.slot.label && (
              <div style={{ fontSize: 10, fontWeight: 500, color: "var(--color-muted)", marginTop: 1, marginLeft: rank !== undefined ? 22 : 0 }}>
                {s.slot.label}
              </div>
            )}
          </div>
          <div
            onClick={onToggleExpand}
            style={{ width: "100%", height: 14, borderRadius: 999, background: "var(--color-cream)", overflow: "hidden", display: "flex", cursor: "pointer" }}
          >
            {availPct > 0 && <div style={{ width: `${availPct}%`, background: "var(--color-success)", transition: "width 600ms var(--ease-spring)" }} />}
            {ifNeededPct > 0 && <div style={{ width: `${ifNeededPct}%`, background: "var(--color-secondary)", transition: "width 600ms var(--ease-spring)" }} />}
            {unavailPct > 0 && <div style={{ width: `${unavailPct}%`, background: "var(--color-border-strong)", transition: "width 600ms var(--ease-spring)" }} />}
          </div>
        </div>
        {isHost && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelectFinalize(); }}
            title="設為定案時段"
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              flexShrink: 0,
              padding: 0,
              cursor: "pointer",
              border: isFinalizePick ? "none" : "2px solid var(--color-border-strong)",
              background: isFinalizePick ? "var(--color-primary)" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isFinalizePick && <Check size={12} color="#fff" strokeWidth={3} />}
          </button>
        )}
      </div>
      {isExpanded && <NamesPanel s={s} />}
    </div>
  );
};

export const HeatmapTab: React.FC<HeatmapTabProps> = ({
  event,
  userNickname,
  onGoToVote,
  isHost,
  onFinalize,
  onReopen,
  onCancelEvent,
  onUpdateEvent,
  isLoading,
  layout = "mobile",
}) => {
  const [distMode, setDistMode] = useState<"bar" | "calendar">("bar");
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [calActiveDate, setCalActiveDate] = useState<string | null>(null);
  const [showAllTop, setShowAllTop] = useState(false);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const toggleExpand = (id: string) => setExpandedSlotId((cur) => (cur === id ? null : id));
  const [namesPanel, setNamesPanel] = useState<{ slotId: string; status: AvailabilityStatus } | null>(null);
  const [rosterOpen, setRosterOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const stats = computeSlotStats(event.slots, event.responses);
  const qualifying = [...stats].filter((s) => s.availableCount + s.ifNeededCount > 0).sort((a, b) => b.score - a.score);
  // 主辦人操作區塊的 state（原本是 HostTab.tsx 的內容，併入這個檔案）
  // Defaults to the top-ranked (most-voted) slot rather than slots[0] so the
  // pre-selected row is visible in the default top-3 bar-view list.
  const [selectedFinalSlotId, setSelectedFinalSlotId] = useState<string | undefined>(qualifying[0]?.slotId ?? event.slots[0]?.id);
  const noteDefaultLines = [
    event.location ? `地點：${event.location.text}` : null,
    event.description ? `備註：${event.description}` : null,
  ].filter((line): line is string => line !== null);
  const [finalNote, setFinalNote] = useState(noteDefaultLines.join("\n"));
  const [confirmingFinalize, setConfirmingFinalize] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editing, setEditing] = useState(false);
  const top = showAllTop ? qualifying : qualifying.slice(0, 3);
  const moreCount = qualifying.length - 3;
  const grouped = stats.reduce((acc, s) => {
    (acc[s.slot.date] = acc[s.slot.date] || []).push(s);
    return acc;
  }, {} as Record<string, typeof stats>);
  const total = event.responses.length;
  const hasResponded = !!userNickname.trim() && event.responses.some((r) => r.nickname.toLowerCase() === userNickname.trim().toLowerCase());
  const isDateOnly = event.mode === "date_only";
  const lifecycle = getLifecycleStatus(event);
  const selectedSlot = event.slots.find((s) => s.id === selectedFinalSlotId);
  const selectedLabel = selectedSlot
    ? `${selectedSlot.date} (${formatChineseWeekday(selectedSlot.date)})${!isDateOnly ? " " + formatSlotTime(selectedSlot.time) : ""}`
    : "尚未選擇";
  const namesPanelSlot = namesPanel ? stats.find((x) => x.slotId === namesPanel.slotId) : undefined;
  const namesPanelLabel = namesPanel
    ? namesPanel.status === "available" ? "確定有空" : namesPanel.status === "if_needed" ? "可能／視情況" : "不行"
    : "";
  const namesPanelNames = namesPanel && namesPanelSlot
    ? namesPanel.status === "available" ? namesPanelSlot.availableNames
      : namesPanel.status === "if_needed" ? namesPanelSlot.ifNeededNames
      : namesPanelSlot.unavailableNames
    : [];

  const allDates: string[] = event.slots
    .map((s) => s.date)
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort();

  useEffect(() => {
    if (!calActiveDate || !allDates.includes(calActiveDate)) {
      const first = allDates[0] || null;
      setCalActiveDate(first);
      if (first) {
        const [y, m] = first.split("-").map(Number);
        setCalViewDate(new Date(y, m - 1, 1));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const calYear = calViewDate.getFullYear();
  const calMonth = calViewDate.getMonth();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calStartDay = new Date(calYear, calMonth, 1).getDay();
  const calDateStr = (d: number) => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const calCells: (number | null)[] = [...Array(calStartDay).fill(null), ...Array.from({ length: calDaysInMonth }, (_, i) => i + 1)];
  const dateSet = new Set(allDates);
  const calPrevCount = countInAdjacentMonth(event.slots, calYear, calMonth, -1);
  const calNextCount = countInAdjacentMonth(event.slots, calYear, calMonth, 1);

  const calendarGrid = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 6 }}>
        <MonthNavButton direction="prev" onClick={() => setCalViewDate(new Date(calYear, calMonth - 1, 1))} badgeCount={calPrevCount} />
        <select
          value={`${calYear}-${calMonth}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-").map(Number);
            setCalViewDate(new Date(y, m, 1));
          }}
          style={{
            fontSize: 12,
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            border: "none",
            background: "transparent",
            color: "var(--color-ink)",
            textAlign: "center",
          }}
        >
          {Array.from({ length: 14 }).map((_, i) => {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - 1 + i);
            return (
              <option key={i} value={`${d.getFullYear()}-${d.getMonth()}`}>
                {d.getFullYear()}年{d.getMonth() + 1}月
              </option>
            );
          })}
        </select>
        <MonthNavButton direction="next" onClick={() => setCalViewDate(new Date(calYear, calMonth + 1, 1))} badgeCount={calNextCount} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 8 }}>
        {WEEK.map((w, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: i === 0 || i === 6 ? "var(--color-weekend)" : "var(--color-muted)" }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {calCells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = calDateStr(d);
          const hasSlots = dateSet.has(ds);
          const dateSlots = hasSlots ? grouped[ds] || [] : [];
          const avgRatio = hasSlots && total && dateSlots.length
            ? dateSlots.reduce((sum, s) => sum + s.availableCount / total, 0) / dateSlots.length
            : 0;
          const bg = hasSlots ? heatColor(avgRatio) : "transparent";
          const fg = avgRatio >= 0.75 ? "#fff" : "var(--color-ink)";
          const isActive = ds === calActiveDate;
          return (
            <button
              key={i}
              disabled={!hasSlots}
              onClick={() => setCalActiveDate(ds)}
              style={{
                position: "relative",
                aspectRatio: "1",
                border: hasSlots ? "1px solid var(--color-border)" : "1px solid transparent",
                outline: isActive ? "2px solid var(--color-primary)" : "none",
                outlineOffset: isActive ? 2 : 0,
                borderRadius: "var(--radius-md)",
                background: bg,
                color: hasSlots ? fg : "var(--color-border)",
                fontSize: 10,
                fontWeight: hasSlots ? 800 : 400,
                cursor: hasSlots ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </>
  );

  const calendarDetail = calActiveDate && (
    <>
      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 6 }}>
        {calActiveDate} ({formatChineseWeekday(calActiveDate)})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(grouped[calActiveDate] || []).map((s) => (
          <HeatSlotRow
            key={s.slot.id}
            s={s}
            primaryLabel={isDateOnly ? "本日是否有空" : formatSlotTime(s.slot.time)}
            total={total}
            isHost={isHost}
            isFinalizePick={!!isHost && selectedFinalSlotId === s.slotId}
            isExpanded={expandedSlotId === s.slotId}
            onToggleExpand={() => toggleExpand(s.slotId)}
            onSelectFinalize={() => setSelectedFinalSlotId(s.slotId)}
            onSelectBreakdown={layout === "desktop" ? undefined : (status) => setNamesPanel({ slotId: s.slotId, status })}
          />
        ))}
      </div>
    </>
  );

  return (
    <div style={{ padding: layout === "desktop" ? 20 : 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        onClick={onGoToVote}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-cream)", border: "1px solid var(--color-border)", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, fontSize: 11, fontWeight: 700, color: "var(--color-muted)" }}>
          <CalendarCheck size={13} color="var(--color-muted)" style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {hasResponded ? "已收到您的時間紀錄，隨時可以回來更新" : "還沒有勾選您的時間？花 30 秒讓大家更快敲定"}
          </span>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Button variant="primary" size="sm" onClick={onGoToVote}>
            {hasResponded ? "更新時間" : "我要投票"}
          </Button>
        </div>
      </div>
      {event.responses.length === 0 && (
        <div style={{ ...cardStyle, textAlign: "center", color: "var(--color-muted)", fontSize: 12 }}>
          目前尚無任何人填寫，快分享連結邀請朋友！
        </div>
      )}
      {event.responses.length > 0 && (
        <>
          <div style={cardStyle}>
            <SectionLabel
              title="交集時段與熱點分佈"
              right={`共 ${total} 人已回覆`}
              titleExtra={
                <button
                  onClick={() => setLegendOpen((v) => !v)}
                  aria-label="說明"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    flexShrink: 0,
                    background: legendOpen ? "var(--color-ink-10)" : "transparent",
                    color: "var(--color-muted)",
                  }}
                >
                  <Info size={13} />
                </button>
              }
            />
            <div style={{ display: "flex", gap: 2, background: "var(--color-cream)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 3, marginBottom: 10 }}>
              {[{ k: "bar" as const, label: "長條圖檢視", icon: BarChart3 }, { k: "calendar" as const, label: "月曆檢視", icon: CalendarDays }].map((m) => (
                <button
                  key={m.k}
                  onClick={() => setDistMode(m.k)}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: "7px 4px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 12,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    background: distMode === m.k ? "var(--color-ink-60)" : "transparent",
                    color: distMode === m.k ? "#fff" : "var(--color-ink)",
                    transition: "background 150ms ease, color 150ms ease",
                  }}
                >
                  <m.icon size={12} />
                  {m.label}
                </button>
              ))}
            </div>

            {legendOpen && (
              <div style={{ background: "var(--color-cream)", borderRadius: "var(--radius-md)", padding: "8px 10px", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10, fontWeight: 700 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: STATUS_META.available.color }}>
                    <STATUS_META.available.icon size={10} color={STATUS_META.available.color} />
                    確定有空
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: STATUS_META.if_needed.color }}>
                    <STATUS_META.if_needed.icon size={10} color={STATUS_META.if_needed.color} />
                    可能／視情況
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: STATUS_META.unavailable.color }}>
                    <STATUS_META.unavailable.icon size={10} color={STATUS_META.unavailable.color} />
                    不行
                  </span>
                </div>
              </div>
            )}

            {distMode === "bar" && (
              <div style={layout === "desktop" ? { width: "66.6667%", margin: "0 auto", padding: "16px 0" } : undefined}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {top.map((s, i) => (
                    <HeatSlotRow
                      key={s.slot.id}
                      s={s}
                      rank={i + 1}
                      primaryLabel={`${s.slot.date} (${formatChineseWeekday(s.slot.date)})${!isDateOnly ? ` ${formatSlotTime(s.slot.time)}` : ""}`}
                      total={total}
                      isHost={isHost}
                      isFinalizePick={!!isHost && selectedFinalSlotId === s.slotId}
                      isExpanded={expandedSlotId === s.slotId}
                      onToggleExpand={() => toggleExpand(s.slotId)}
                      onSelectFinalize={() => setSelectedFinalSlotId(s.slotId)}
                      onSelectBreakdown={layout === "desktop" ? undefined : (status) => setNamesPanel({ slotId: s.slotId, status })}
                    />
                  ))}
                </div>
                {moreCount > 0 && (
                  <button
                    onClick={() => setShowAllTop((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      marginTop: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "7px 0",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed var(--color-border-strong)",
                      background: "#fff",
                      color: "var(--color-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {showAllTop ? (
                      <>
                        收合
                        <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        還有 {moreCount} 個交集時段
                        <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {distMode === "calendar" && (
              layout === "desktop" ? (
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 260, maxWidth: "100%" }}>{calendarGrid}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {calendarDetail || (
                      <div style={{ fontSize: 12, color: "var(--color-muted)", textAlign: "center", padding: "20px 0" }}>
                        請點選左側日期查看時段
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ maxWidth: 260, margin: "0 auto" }}>{calendarGrid}</div>
                  {calendarDetail && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                      {calendarDetail}
                    </div>
                  )}
                </div>
              )
            )}

            <div style={{ borderTop: "1px solid var(--color-border)", margin: "12px 0 10px" }} />
            <button
              onClick={() => setRosterOpen((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--color-muted)",
                marginBottom: rosterOpen ? 8 : 0,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              已回覆名冊（{event.responses.length} 人）
              {rosterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {rosterOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {event.responses.map((r) => {
                  const availCount = Object.values(r.availability).filter((v) => v === "available").length;
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: "var(--radius-md)", background: "var(--color-cream)" }}>
                      <Avatar name={r.nickname} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800 }}>
                          {r.nickname}
                          {r.nickname === userNickname && <span style={{ fontSize: 9, marginLeft: 6, color: "var(--color-primary)" }}>(您)</span>}
                        </div>
                        {r.comment && (
                          <div style={{ fontSize: 10, color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                            <MessageCircle size={10} />
                            {r.comment}
                          </div>
                        )}
                      </div>
                      <Badge variant="success" size="sm">{availCount}/{event.slots.length}</Badge>
                      <EmailIndicator hasEmail={!!r.email} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {isHost && (
        <div style={cardStyle}>
          <SectionLabel
            title="主揪定案"
            hint="拍板定案、管理活動"
            icon={<Award size={13} color="var(--color-ink)" strokeWidth={2.2} />}
            iconBg="var(--color-secondary)"
          />
          {lifecycle.key === "voting_closed" && onReopen && (
            <div style={{ marginBottom: 12, padding: 10, borderRadius: "var(--radius-md)", background: "var(--color-hot-subtle)", border: "1px solid rgba(214,48,60,0.25)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <AlertTriangle size={16} color="var(--color-hot)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)" }}>投票已於 {formatDeadline(event.responseDeadline)} 截止</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>參與者暫時無法再送出新的時間，可以重新開放投票或直接拍板定案。</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <Button variant="hot" size="sm" fullWidth onClick={() => setReopening(true)}>重新開放投票</Button>
              </div>
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 10 }}>
            目前已選：<span style={{ fontWeight: 800, color: "var(--color-ink)" }}>{selectedLabel}</span>
          </div>
          <Input label="定案備註" placeholder="例如：訂位阿傑，18:00 集合" value={finalNote} onChange={(e) => setFinalNote(e.target.value)} />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <Button variant="dark" size="sm" fullWidth disabled={!selectedFinalSlotId || isLoading} onClick={() => setConfirmingFinalize(true)}>
              確認最終時間並定案
            </Button>
            <Button variant="muted" size="sm" fullWidth disabled={isLoading} onClick={() => setEditing(true)}>
              編輯活動資訊
            </Button>
          </div>
          {onCancelEvent && (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setDangerOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  border: "none",
                  background: "none",
                  padding: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--color-error)",
                  cursor: "pointer",
                }}
              >
                <AlertTriangle size={12} />
                危險操作
                {dangerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {dangerOpen && (
                <div style={{ marginTop: 8, padding: 10, borderRadius: "var(--radius-md)", background: "var(--color-error-subtle)", border: "1px solid rgba(232,54,26,0.25)" }}>
                  <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 10 }}>取消後活動將無法復原，所有人都會看到取消狀態。</div>
                  <Button variant="danger" size="sm" fullWidth disabled={isLoading} onClick={() => setCancelling(true)}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Ban size={13} />
                      取消活動
                    </span>
                  </Button>
                </div>
              )}
            </div>
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
      {editing && onUpdateEvent && (
        <EditEventModal
          event={event}
          isLoading={isLoading}
          onCancel={() => setEditing(false)}
          onConfirm={(input) => {
            setEditing(false);
            onUpdateEvent(input);
          }}
        />
      )}
      {confirmingFinalize && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 18, width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>確認要拍板定案嗎？</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 14, lineHeight: 1.6 }}>
              定案後活動將轉為「已敲定通知模式」，暫停開放新投票。
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="muted" fullWidth onClick={() => setConfirmingFinalize(false)}>返回修改</Button>
              <Button
                variant="hot"
                fullWidth
                onClick={() => {
                  setConfirmingFinalize(false);
                  if (selectedFinalSlotId && onFinalize) onFinalize(selectedFinalSlotId, finalNote);
                }}
              >
                拍板確定
              </Button>
            </div>
          </div>
        </div>
      )}
      {namesPanel && (
        <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 60, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
            <button onClick={() => setNamesPanel(null)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}>
              <ChevronLeft size={20} color="var(--color-ink)" />
            </button>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-ink)" }}>{namesPanelLabel}（{namesPanelNames.length}）</span>
            <button onClick={() => setNamesPanel(null)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}>
              <X size={18} color="var(--color-ink)" />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
            {namesPanelNames.map((n) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
                <Avatar name={n} size="sm" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
