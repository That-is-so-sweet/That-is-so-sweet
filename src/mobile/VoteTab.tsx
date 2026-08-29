import React, { useState, useEffect } from "react";
import { Zap, RotateCw, ChevronUp, ChevronDown, List, CalendarDays, AlertTriangle, Info } from "lucide-react";
import { EventData, AvailabilityStatus, SubmitResponseInput } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { isVotingOpen, formatDeadline, getLifecycleStatus } from "../lib/eventStatus";
import { formatSlotTime } from "../lib/slots";
import { Button, Input } from "../design-system/components";
import { cardStyle, MonthNavButton, countInAdjacentMonth, quickBtnStyle, STATUS_META } from "./mobileStyles";
import { EventInfoCard } from "./EventInfoCard";

interface VoteTabProps {
  event: EventData;
  nickname: string;
  setNickname: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  onSubmit: (input: SubmitResponseInput) => Promise<void>;
  isLoading: boolean;
  onSubmitted?: () => void;
  /** The desktop shell wraps this in an `overflow: hidden` card, which breaks `position: sticky`. */
  stickyFooter?: boolean;
}

interface VoteRowProps {
  slot: EventData["slots"][number];
  status: AvailabilityStatus;
  onChange: (id: string, status: AvailabilityStatus) => void;
  primaryText?: string;
  disabled?: boolean;
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
  const { slot, status, onChange, primaryText, disabled } = props;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", borderBottom: "1px solid var(--color-border)", opacity: disabled ? 0.55 : 1 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{primaryText ?? formatSlotTime(slot.time)}</div>
        {slot.label && <div style={{ fontSize: 10, color: "var(--color-muted)" }}>{slot.label}</div>}
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {(["available", "if_needed", "unavailable"] as AvailabilityStatus[]).map((k) => {
          const active = status === k;
          const meta = STATUS_META[k];
          return (
            <button
              key={k}
              disabled={disabled}
              onClick={() => onChange(slot.id, k)}
              style={{
                width: 30,
                height: 30,
                borderRadius: "var(--radius-md)",
                border: active ? `2px solid ${meta.color}` : "1.5px solid var(--color-border)",
                background: active ? meta.color : "#fff",
                fontSize: 14,
                cursor: disabled ? "not-allowed" : "pointer",
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

export const VoteTab: React.FC<VoteTabProps> = ({ event, nickname, setNickname, email, setEmail, onSubmit, isLoading, onSubmitted, stickyFooter = true }) => {
  const [comment, setComment] = useState("");
  const [password, setPassword] = useState("");
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [bulkTargetKey, setBulkTargetKey] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [calActiveDate, setCalActiveDate] = useState<string | null>(null);

  const trimmedNickname = nickname.trim();
  const matchedExisting = trimmedNickname
    ? event.responses.find((r) => r.nickname.toLowerCase() === trimmedNickname.toLowerCase())
    : undefined;
  const needsPassword = !!matchedExisting?.password;
  // 比對到的既有回覆有設密碼、但目前輸入的密碼不相符時鎖定：不自動帶入既有作答
  // 內容（避免沒輸對密碼就看到別人的勾選結果），送出按鈕也會被鎖住。
  const isLocked = needsPassword && password !== matchedExisting?.password;

  useEffect(() => {
    if (matchedExisting && !isLocked) {
      setEditingParticipantId(matchedExisting.id);
      setAvailability(matchedExisting.availability || {});
      if (matchedExisting.email) setEmail(matchedExisting.email);
      if (matchedExisting.comment) setComment(matchedExisting.comment);
    } else if (!matchedExisting) {
      setEditingParticipantId(null);
      const initial: Record<string, AvailabilityStatus> = {};
      event.slots.forEach((s) => (initial[s.id] = "available"));
      setAvailability(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, trimmedNickname, isLocked]);

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

  const isDateOnly = event.mode === "date_only";
  const votingClosed = !isVotingOpen(event);
  const lifecycle = getLifecycleStatus(event);

  const handleChange = (id: string, st: AvailabilityStatus): void => setAvailability((p) => ({ ...p, [id]: st }));

  const handleSubmit = async () => {
    if (!nickname.trim() || isLocked) return;
    try {
      await onSubmit({
        participantId: editingParticipantId || undefined,
        nickname: nickname.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        availability,
        comment: comment.trim(),
      });
      onSubmitted?.();
    } catch {
      // onSubmit already surfaces the failure (e.g. an error toast); nothing more to do here.
    }
  };

  const calYear = calViewDate.getFullYear();
  const calMonth = calViewDate.getMonth();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calStartDay = new Date(calYear, calMonth, 1).getDay();
  const calDateStr = (d: number) => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const calCells: (number | null)[] = [...Array(calStartDay).fill(null), ...Array.from({ length: calDaysInMonth }, (_, i) => i + 1)];
  const dateSet = new Set(allDates);
  const calPrevCount = countInAdjacentMonth(event.slots, calYear, calMonth, -1);
  const calNextCount = countInAdjacentMonth(event.slots, calYear, calMonth, 1);

  const bulkToolsButton = (
    <button
      onClick={() => setToolsOpen((v) => !v)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "4px 8px",
        borderRadius: "var(--radius-pill)",
        border: toolsOpen ? "1.5px solid var(--color-muted)" : "1px solid var(--color-border-strong)",
        background: toolsOpen ? "var(--color-muted)" : "#fff",
        color: toolsOpen ? "#fff" : "var(--color-muted)",
        fontSize: 10,
        fontWeight: 800,
        cursor: "pointer",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      <Zap size={10} />
      批次勾選
      {toolsOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
    </button>
  );

  const bulkToolsPanel = toolsOpen && (
    <div style={{ marginBottom: 10, padding: 10, border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", background: "var(--color-cream)" }}>
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
                color: active ? "#fff" : isWeekend ? "var(--color-weekend)" : "var(--color-ink)",
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
  );

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <EventInfoCard
        title={event.title}
        hostName={event.hostName}
        location={event.location}
        description={event.description}
        responseDeadlineIso={event.responseDeadline}
        statusLabel={lifecycle.label}
        statusColor={lifecycle.color}
      />
      {votingClosed && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: 10, borderRadius: "var(--radius-md)", background: "var(--color-hot-subtle)", border: "1px solid rgba(214,48,60,0.25)" }}>
          <AlertTriangle size={14} color="var(--color-hot)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: "var(--color-ink)", lineHeight: 1.5 }}>
            投票已於 {formatDeadline(event.responseDeadline)} 截止，如需補投請聯繫主揪重新開放投票。
          </span>
        </div>
      )}
      {!votingClosed && (
        <span style={{ fontSize: 15, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>填寫我的時間</span>
      )}
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 10 }}>
      {!votingClosed && (
        <>
          <Input size="sm" label="您的暱稱" required placeholder="例如：小明" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <Input
            size="sm"
            label={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                聯絡 Email
                <button
                  type="button"
                  onClick={() => setShowEmailInfo((v) => !v)}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", padding: 0 }}
                  aria-label="更多資訊"
                >
                  <Info size={13} />
                </button>
              </span>
            }
            placeholder="例如：name@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint={showEmailInfo ? "後續如果有留言、活動內容更新，或活動確定時間，會寄信通知這個 email" : undefined}
          />
          <Input
            size="sm"
            label={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                密碼（選填）
                <button
                  type="button"
                  onClick={() => setShowPasswordInfo((v) => !v)}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", padding: 0 }}
                  aria-label="更多資訊"
                >
                  <Info size={13} />
                </button>
              </span>
            }
            placeholder={needsPassword ? "此暱稱已有人使用，請輸入密碼" : "設定密碼可在其他裝置回來編輯"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={showPasswordInfo ? "設定密碼後，就可以在其他裝置回來編輯；下次要用同樣的暱稱登入時，也需要輸入這組密碼。" : undefined}
          />
        </>
      )}
      {!votingClosed && isLocked && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: 10, borderRadius: "var(--radius-md)", background: "var(--color-hot-subtle)", border: "1px solid rgba(214,48,60,0.25)" }}>
          <AlertTriangle size={14} color="var(--color-hot)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: "var(--color-ink)", lineHeight: 1.5 }}>
            密碼不正確，暫時無法查看或編輯這個暱稱的既有回覆。
          </span>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--color-border)" }} />

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
              background: viewMode === m.k ? "var(--color-ink)" : "transparent",
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
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
            {bulkToolsButton}
          </div>
          {bulkToolsPanel}
          {(Object.entries(grouped) as [string, EventData["slots"]][]).map(([date, list]) => (
            <div key={date} style={{ marginBottom: 3 }}>
              {!isDateOnly && (
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", padding: "3px 0 1px" }}>
                  {date} ({formatChineseWeekday(date)})
                </div>
              )}
              {list.map((s) => {
                const status: AvailabilityStatus = availability[s.id] || "available";
                return (
                  <VoteRow
                    key={s.id}
                    slot={s}
                    status={status}
                    onChange={handleChange}
                    primaryText={isDateOnly ? `${date} (${formatChineseWeekday(date)})` : undefined}
                    disabled={votingClosed || isLocked}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {viewMode === "calendar" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
            {bulkToolsButton}
          </div>
          {bulkToolsPanel}
          <div style={{ maxWidth: 260, margin: "0 auto" }}>
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
                      border: hasSlots ? "1px solid var(--color-border)" : "1px solid transparent",
                      outline: isActive ? "2px solid var(--color-primary)" : "none",
                      outlineOffset: isActive ? 2 : 0,
                      borderRadius: "var(--radius-md)",
                      background: hasSlots ? "var(--color-cream)" : "transparent",
                      color: hasSlots ? "var(--color-ink)" : "var(--color-border)",
                      fontSize: 10,
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
          </div>

          {calActiveDate && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
              {!isDateOnly && (
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 6 }}>
                  {calActiveDate} ({formatChineseWeekday(calActiveDate)})
                </div>
              )}
              {(grouped[calActiveDate] || []).map((s) => {
                const status: AvailabilityStatus = availability[s.id] || "available";
                return (
                  <VoteRow
                    key={s.id}
                    slot={s}
                    status={status}
                    onChange={handleChange}
                    primaryText={isDateOnly ? `${calActiveDate} (${formatChineseWeekday(calActiveDate)})` : undefined}
                    disabled={votingClosed || isLocked}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      <Input size="sm" label="對此發起此次投票的留言" placeholder="例如：19:00 才能到" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <div
        style={
          stickyFooter
            ? { position: "sticky", bottom: 0, margin: "4px -14px -14px", padding: "10px 14px calc(14px + env(safe-area-inset-bottom))", background: "var(--color-cream)", borderTop: "1px solid var(--color-border)" }
            : undefined
        }
      >
        <Button variant="primary" fullWidth disabled={!nickname.trim() || isLoading || votingClosed || isLocked} onClick={handleSubmit}>
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
    </div>
  );
};
