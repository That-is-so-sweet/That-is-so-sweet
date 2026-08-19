import React, { useState, useEffect } from "react";
import { Zap, RotateCw, ChevronUp, ChevronDown, List, CalendarDays } from "lucide-react";
import { EventData, AvailabilityStatus, SubmitResponseInput } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { Button, Input } from "../design-system/components";
import { cardStyle, navBtnStyle, quickBtnStyle, STATUS_META } from "./mobileStyles";

interface VoteTabProps {
  event: EventData;
  nickname: string;
  setNickname: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  onSubmit: (input: SubmitResponseInput) => Promise<void>;
  isLoading: boolean;
}

interface VoteRowProps {
  slot: EventData["slots"][number];
  status: AvailabilityStatus;
  onChange: (id: string, status: AvailabilityStatus) => void;
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const STATUS_LABEL: Record<AvailabilityStatus, string> = { available: "有空", if_needed: "可能", unavailable: "不行" };

interface BulkTarget {
  key: string;
  label: string;
  pred: (dow: number) => boolean;
}

const BULK_TARGETS: BulkTarget[] = [
  { key: "all", label: "全部", pred: () => true },
  { key: "weekday", label: "平日", pred: (d) => d >= 1 && d <= 5 },
  { key: "weekend", label: "週末", pred: (d) => d === 0 || d === 6 },
  ...WEEK.map((w, dow) => ({ key: `dow-${dow}`, label: w, pred: (d: number) => d === dow })),
];

const VoteRow: React.FC<VoteRowProps> = (props) => {
  const { slot, status, onChange } = props;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{slot.time}</div>
        {slot.label && <div style={{ fontSize: 10, color: "var(--color-muted)" }}>{slot.label}</div>}
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {(["available", "if_needed", "unavailable"] as AvailabilityStatus[]).map((k) => {
          const active = status === k;
          const meta = STATUS_META[k];
          return (
            <button
              key={k}
              onClick={() => onChange(slot.id, k)}
              style={{
                width: 30,
                height: 30,
                borderRadius: "var(--radius-md)",
                border: active ? `2px solid ${meta.color}` : "1.5px solid var(--color-border)",
                background: active ? meta.color : "#fff",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <meta.icon size={14} color={active ? "#fff" : meta.color} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const VoteTab: React.FC<VoteTabProps> = ({ event, nickname, setNickname, email, setEmail, onSubmit, isLoading }) => {
  const [comment, setComment] = useState("");
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [bulkTargetKey, setBulkTargetKey] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [calActiveDate, setCalActiveDate] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = nickname.trim();
    const existing = trimmed
      ? event.responses.find((r) => r.nickname.toLowerCase() === trimmed.toLowerCase())
      : undefined;
    if (existing) {
      setEditingParticipantId(existing.id);
      setAvailability(existing.availability || {});
      if (existing.email) setEmail(existing.email);
      if (existing.comment) setComment(existing.comment);
    } else {
      setEditingParticipantId(null);
      const initial: Record<string, AvailabilityStatus> = {};
      event.slots.forEach((s) => (initial[s.id] = "available"));
      setAvailability(initial);
    }
  }, [event.id, nickname]);

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

  const applyBulk = (status: AvailabilityStatus) => {
    const target = BULK_TARGETS.find((t) => t.key === bulkTargetKey) || BULK_TARGETS[0];
    setAvailability((prev) => {
      const next = { ...prev };
      event.slots.forEach((s) => {
        if (target.pred(new Date(s.date).getDay())) next[s.id] = status;
      });
      return next;
    });
  };

  const grouped = event.slots.reduce((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {} as Record<string, EventData["slots"]>);

  const handleChange = (id: string, st: AvailabilityStatus): void => setAvailability((p) => ({ ...p, [id]: st }));

  const handleSubmit = () => {
    if (!nickname.trim()) return;
    onSubmit({
      participantId: editingParticipantId || undefined,
      nickname: nickname.trim(),
      email: email.trim(),
      availability,
      comment: comment.trim(),
    });
  };

  const calYear = calViewDate.getFullYear();
  const calMonth = calViewDate.getMonth();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calStartDay = new Date(calYear, calMonth, 1).getDay();
  const calDateStr = (d: number) => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const calCells: (number | null)[] = [...Array(calStartDay).fill(null), ...Array.from({ length: calDaysInMonth }, (_, i) => i + 1)];
  const dateSet = new Set(allDates);

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <Input size="sm" label="您的暱稱" required placeholder="例如：小明" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      <Input size="sm" label="聯絡 Email" placeholder="例如：name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

      <div>
        <button
          onClick={() => setToolsOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            padding: "7px 0",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--color-border-strong)",
            background: toolsOpen ? "var(--color-cream)" : "#fff",
            color: "var(--color-muted)",
            cursor: "pointer",
          }}
        >
          <Zap size={12} />
          批次快速勾選
          {toolsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {toolsOpen && (
          <div style={{ marginTop: 10, ...cardStyle, padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", marginBottom: 6 }}>套用對象（依星期批次勾選）</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              {BULK_TARGETS.slice(0, 3).map((t) => {
                const active = bulkTargetKey === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setBulkTargetKey(t.key)}
                    style={{
                      ...quickBtnStyle,
                      flex: 1,
                      border: active ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background: active ? "var(--color-primary)" : "#fff",
                      color: active ? "#fff" : "var(--color-ink)",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {BULK_TARGETS.slice(3).map((t) => {
                const active = bulkTargetKey === t.key;
                const isWeekend = t.key === "dow-0" || t.key === "dow-6";
                return (
                  <button
                    key={t.key}
                    onClick={() => setBulkTargetKey(t.key)}
                    style={{
                      ...quickBtnStyle,
                      flex: 1,
                      border: active ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background: active ? "var(--color-primary)" : "#fff",
                      color: active ? "#fff" : isWeekend ? "var(--color-hot)" : "var(--color-ink)",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", marginBottom: 6 }}>設定為</div>
            <div style={{ display: "flex", gap: 4 }}>
              {(["available", "if_needed", "unavailable"] as AvailabilityStatus[]).map((k) => {
                const meta = STATUS_META[k];
                return (
                  <button
                    key={k}
                    onClick={() => applyBulk(k)}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "7px 4px",
                      borderRadius: "var(--radius-md)",
                      border: `1.5px solid ${meta.color}`,
                      background: "#fff",
                      color: "var(--color-ink)",
                      cursor: "pointer",
                    }}
                  >
                    <meta.icon size={11} color={meta.color} />
                    {STATUS_LABEL[k]}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 2, background: "var(--color-cream)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 3 }}>
        {[{ k: "list" as const, label: "清單檢視", icon: List }, { k: "calendar" as const, label: "行事曆檢視", icon: CalendarDays }].map((m) => (
          <button
            key={m.k}
            onClick={() => setViewMode(m.k)}
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
              background: viewMode === m.k ? "var(--color-primary)" : "transparent",
              color: viewMode === m.k ? "#fff" : "var(--color-ink)",
              transition: "background 150ms ease, color 150ms ease",
            }}
          >
            <m.icon size={12} />
            {m.label}
          </button>
        ))}
      </div>

      {viewMode === "list" && (
        <div style={cardStyle}>
          {(Object.entries(grouped) as [string, EventData["slots"]][]).map(([date, list]) => (
            <div key={date} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--color-muted)", padding: "4px 0" }}>
                {date} ({formatChineseWeekday(date)})
              </div>
              {list.map((s) => {
                const status: AvailabilityStatus = availability[s.id] || "available";
                return <VoteRow key={s.id} slot={s} status={status} onChange={handleChange} />;
              })}
            </div>
          ))}
        </div>
      )}

      {viewMode === "calendar" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 6 }}>
            <button style={navBtnStyle} onClick={() => setCalViewDate(new Date(calYear, calMonth - 1, 1))}>‹</button>
            <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-display)" }}>{calYear}年{calMonth + 1}月</div>
            <button style={navBtnStyle} onClick={() => setCalViewDate(new Date(calYear, calMonth + 1, 1))}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
            {WEEK.map((w, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: i === 0 || i === 6 ? "var(--color-hot)" : "var(--color-muted)" }}>
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
              const statuses = dateSlots.map((s) => availability[s.id] || "available");
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
                    background: hasSlots ? "var(--color-cream)" : "transparent",
                    color: hasSlots ? "var(--color-ink)" : "var(--color-border)",
                    fontSize: 11,
                    fontWeight: hasSlots ? 800 : 400,
                    cursor: hasSlots ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    padding: "4px 0",
                  }}
                >
                  <span>{d}</span>
                  {hasSlots && (
                    <span style={{ display: "flex", gap: 1.5 }}>
                      {statuses.slice(0, 4).map((st, idx) => (
                        <span key={idx} style={{ width: 4, height: 4, borderRadius: "50%", background: STATUS_META[st].color }} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {calActiveDate && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 6 }}>
                {calActiveDate} ({formatChineseWeekday(calActiveDate)})
              </div>
              {(grouped[calActiveDate] || []).map((s) => {
                const status: AvailabilityStatus = availability[s.id] || "available";
                return <VoteRow key={s.id} slot={s} status={status} onChange={handleChange} />;
              })}
            </div>
          )}
        </div>
      )}

      <Input size="sm" label="給主揪的話" placeholder="例如：19:00 才能到" value={comment} onChange={(e) => setComment(e.target.value)} />
      <Button variant="dark" fullWidth disabled={!nickname.trim() || isLoading} onClick={handleSubmit}>
        {editingParticipantId ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            更新我的回覆
            <RotateCw size={14} />
          </span>
        ) : (
          "送出我的時間"
        )}
      </Button>
    </div>
  );
};
