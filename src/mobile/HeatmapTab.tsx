import React, { useState, useEffect } from "react";
import { Trophy, Medal, MessageCircle, BarChart3, CalendarDays, CalendarCheck, MapPin, User, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { EventData, SlotStats } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { computeSlotStats, formatSlotTime } from "../lib/slots";
import { getLifecycleStatus, formatDeadline, formatRemaining } from "../lib/eventStatus";
import { Avatar, Badge, Button } from "../design-system/components";
import { cardStyle, countInAdjacentMonth, MonthNavButton, SectionLabel, STATUS_META } from "./mobileStyles";

interface HeatmapTabProps {
  event: EventData;
  userNickname: string;
  onGoToVote: () => void;
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const medalColors = ["#d4a017", "#9aa0a6", "#b06a3d"];

const heatColor = (ratio: number) =>
  ratio >= 0.75 ? "var(--color-success)" : ratio >= 0.4 ? "rgba(90,158,90,0.3)" : ratio > 0 ? "rgba(90,158,90,0.12)" : "var(--color-cream)";

const BreakdownIcons: React.FC<{ s: SlotStats; color?: string; size?: number }> = ({ s, color, size = 10 }) => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: color || STATUS_META.available.color }}>
      <STATUS_META.available.icon size={size} color={color || STATUS_META.available.color} />
      {s.availableCount}
    </span>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: color || STATUS_META.if_needed.color }}>
      <STATUS_META.if_needed.icon size={size} color={color || STATUS_META.if_needed.color} />
      {s.ifNeededCount}
    </span>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: color || STATUS_META.unavailable.color }}>
      <STATUS_META.unavailable.icon size={size} color={color || STATUS_META.unavailable.color} />
      {s.unavailableCount}
    </span>
  </div>
);

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

export const HeatmapTab: React.FC<HeatmapTabProps> = ({ event, userNickname, onGoToVote }) => {
  const [distMode, setDistMode] = useState<"bar" | "calendar">("bar");
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [calActiveDate, setCalActiveDate] = useState<string | null>(null);
  const [showAllTop, setShowAllTop] = useState(false);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const toggleExpand = (id: string) => setExpandedSlotId((cur) => (cur === id ? null : id));
  const stats = computeSlotStats(event.slots, event.responses);
  const qualifying = [...stats].filter((s) => s.availableCount + s.ifNeededCount > 0).sort((a, b) => b.score - a.score);
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

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={cardStyle}>
        <SectionLabel title="活動資訊" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-ink)", flexWrap: "wrap" }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: lifecycle.color, flexShrink: 0 }} />
            狀態：{lifecycle.label}
            <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.sublabel}</Badge>
          </div>
          {event.responseDeadline && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-ink)" }}>
              <Clock size={12} color="var(--color-muted)" style={{ flexShrink: 0 }} />
              投票截止：{formatDeadline(event.responseDeadline)}
              <span style={{ color: "var(--color-muted)" }}>（{formatRemaining(event.responseDeadline)}）</span>
            </div>
          )}
          {event.hostName && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-ink)" }}>
              <User size={12} color="var(--color-muted)" style={{ flexShrink: 0 }} />
              主揪：{event.hostName}
            </div>
          )}
          {event.description && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--color-ink)", lineHeight: 1.5 }}>
              <MapPin size={12} color="var(--color-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{event.description}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--color-primary-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <CalendarCheck size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)" }}>
              {hasResponded ? "已收到您的時間紀錄" : "還沒有勾選您的時間？"}
            </div>
            <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 1 }}>
              {hasResponded ? "隨時可以回來更新" : "花 30 秒勾選，讓大家更快敲定時間"}
            </div>
          </div>
        </div>
        <Button variant="hot" size="sm" onClick={onGoToVote}>{hasResponded ? "更新時間" : "我要勾選時間"}</Button>
      </div>
      {event.responses.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: "var(--color-muted)", fontSize: 12 }}>
          目前尚無任何人填寫，快分享連結邀請朋友！
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <SectionLabel title="交集時段與熱點分佈" />
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
                    background: distMode === m.k ? "var(--color-primary)" : "transparent",
                    color: distMode === m.k ? "#fff" : "var(--color-ink)",
                    transition: "background 150ms ease, color 150ms ease",
                  }}
                >
                  <m.icon size={12} />
                  {m.label}
                </button>
              ))}
            </div>

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
              <div style={{ fontSize: 9, color: "var(--color-muted)", marginTop: 4, lineHeight: 1.5 }}>
                月曆的顏色深淺僅以「確定有空」人數計算，「可能」不算在內；點選時段可展開查看名單
              </div>
            </div>

            {distMode === "bar" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {top.map((s, i) => {
                    const availPct = total ? (s.availableCount / total) * 100 : 0;
                    const ifNeededPct = total ? (s.ifNeededCount / total) * 100 : 0;
                    const unavailPct = total ? (s.unavailableCount / total) * 100 : 0;
                    const isExpanded = expandedSlotId === s.slotId;
                    return (
                      <div key={s.slot.id}>
                        <button
                          onClick={() => toggleExpand(s.slotId)}
                          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--color-ink)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              {i === 0 ? (
                                <Trophy size={13} color={medalColors[0]} />
                              ) : (
                                <Medal size={13} color={medalColors[i] || medalColors[2]} />
                              )}
                              {s.slot.date} ({formatChineseWeekday(s.slot.date)}){!isDateOnly && ` ${formatSlotTime(s.slot.time)}`}
                              {s.slot.label && <span style={{ fontWeight: 500, color: "var(--color-muted)" }}> · {s.slot.label}</span>}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--color-success)" }}>{s.availableCount}/{total} 確定有空</span>
                          </div>
                          <div style={{ width: "100%", height: 14, borderRadius: 999, background: "var(--color-cream)", overflow: "hidden", display: "flex" }}>
                            {availPct > 0 && <div style={{ width: `${availPct}%`, background: "var(--color-success)", transition: "width 600ms var(--ease-spring)" }} />}
                            {ifNeededPct > 0 && <div style={{ width: `${ifNeededPct}%`, background: "var(--color-secondary)", transition: "width 600ms var(--ease-spring)" }} />}
                            {unavailPct > 0 && <div style={{ width: `${unavailPct}%`, background: "var(--color-border-strong)", transition: "width 600ms var(--ease-spring)" }} />}
                          </div>
                          <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <BreakdownIcons s={s} size={9} />
                            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--color-muted)", display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                              {isExpanded ? "收合" : "查看名單"}
                              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </span>
                          </div>
                        </button>
                        {isExpanded && <NamesPanel s={s} />}
                      </div>
                    );
                  })}
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
              </>
            )}

            {distMode === "calendar" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 6 }}>
                  <MonthNavButton direction="prev" onClick={() => setCalViewDate(new Date(calYear, calMonth - 1, 1))} badgeCount={calPrevCount} />
                  <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-display)" }}>{calYear}年{calMonth + 1}月</div>
                  <MonthNavButton direction="next" onClick={() => setCalViewDate(new Date(calYear, calMonth + 1, 1))} badgeCount={calNextCount} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
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
                          border: isActive ? "2px solid var(--color-primary)" : "1px solid transparent",
                          borderRadius: "var(--radius-md)",
                          background: bg,
                          color: hasSlots ? fg : "var(--color-border)",
                          fontSize: 11,
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

                {calActiveDate && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 6 }}>
                      {calActiveDate} ({formatChineseWeekday(calActiveDate)})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(grouped[calActiveDate] || []).map((s) => {
                        const ratio = total ? s.availableCount / total : 0;
                        const bg = heatColor(ratio);
                        const fg = ratio >= 0.75 ? "#fff" : "var(--color-ink)";
                        const isExpanded = expandedSlotId === s.slotId;
                        return (
                          <div key={s.slot.id}>
                            <button
                              onClick={() => toggleExpand(s.slotId)}
                              style={{
                                display: "block",
                                width: "100%",
                                textAlign: "left",
                                borderRadius: "var(--radius-md)",
                                padding: 8,
                                background: bg,
                                color: fg,
                                border: isExpanded ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                                cursor: "pointer",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, fontWeight: 800 }}>
                                  {isDateOnly ? "本日是否有空" : formatSlotTime(s.slot.time)}
                                  {s.slot.label && <span style={{ fontWeight: 500, opacity: 0.85 }}> · {s.slot.label}</span>}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.9 }}>{s.availableCount}/{total} 確定有空</span>
                              </div>
                              <div style={{ marginTop: 4 }}>
                                <BreakdownIcons s={s} color="currentColor" size={9} />
                              </div>
                            </button>
                            {isExpanded && <NamesPanel s={s} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
      <div style={cardStyle}>
        <SectionLabel title={`已填寫名冊 (${event.responses.length} 人)`} />
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
