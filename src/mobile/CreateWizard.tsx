import React, { useState, useEffect } from "react";
import { CreateEventInput, TimeSlot } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, addMinutesToTime, getNextWeekdayDate } from "../lib/slots";
import { Button, Input, Tag } from "../design-system/components";
import { TopBar } from "./TopBar";
import { MonthCalendar } from "./MonthCalendar";
import { MiniMonthPicker } from "./MiniMonthPicker";
import { cardStyle, iconBtnStyle, SectionLabel } from "./mobileStyles";

interface CreateWizardProps {
  onSubmit: (input: CreateEventInput) => Promise<void>;
  isLoading: boolean;
  onOpenHistory: () => void;
}

const SAT = getNextWeekdayDate(6);
const SUN = getNextWeekdayDate(0);

const DEFAULT_SLOTS: Omit<TimeSlot, "id">[] = [
  { date: SAT, time: "10:00 - 11:00", label: "上午會議" },
  { date: SAT, time: "14:00 - 15:00", label: "下午討論" },
  { date: SUN, time: "10:00 - 11:00", label: "上午會議" },
  { date: SUN, time: "14:00 - 15:00", label: "下午討論" },
];

const MEAL_PRESETS = [
  { label: "週末雙餐", times: ["12:00 - 14:00 (午餐)", "18:00 - 21:00 (晚餐)"] },
  { label: "下午茶聊天", times: ["14:00 - 17:00 (下午茶)"] },
  { label: "晚間續攤", times: ["18:00 - 21:00 (晚餐)", "21:00 - 23:30 (續攤)"] },
];

const MEETING_PRESETS = [
  { start: "10:00", end: "11:00", label: "上午對齊" },
  { start: "14:00", end: "15:00", label: "下午討論" },
  { start: "20:00", end: "21:00", label: "晚間線上會" },
];

const DURATIONS = [
  { label: "30分", mins: 30 },
  { label: "1小時", mins: 60 },
  { label: "1.5小時", mins: 90 },
  { label: "2小時", mins: 120 },
];

const STEP_LABELS = ["基本資訊", "選擇日期", "設定時間", "確認送出"];

export const CreateWizard: React.FC<CreateWizardProps> = ({ onSubmit, isLoading, onOpenHistory }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([SAT, SUN]);
  const [slots, setSlots] = useState<Omit<TimeSlot, "id">[]>(DEFAULT_SLOTS);
  const [timeMode, setTimeMode] = useState<"precise" | "meal">("precise");
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState("10:00");
  const [label, setLabel] = useState("");
  const [activeDate, setActiveDate] = useState<string | null>(selectedDates[0] || null);

  useEffect(() => {
    if (!activeDate || !selectedDates.includes(activeDate)) setActiveDate(selectedDates[0] || null);
  }, [selectedDates]);

  useEffect(() => {
    if (step === 2 && activeDate) {
      const [y, m] = activeDate.split("-").map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [step]);

  const toggleDate = (d: string) => setSelectedDates((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort()));

  const addSlot = (date: string, time: string, lbl: string) =>
    setSlots((p) => [...p, { date, time, label: lbl }]);

  const addPrecise = () => {
    if (!activeDate) return;
    const end = addMinutesToTime(startTime, duration);
    addSlot(activeDate, `${startTime} - ${end}`, label.trim());
  };

  const addPreset = (p: { start: string; end: string; label: string }) => {
    if (!activeDate) return;
    addSlot(activeDate, `${p.start} - ${p.end}`, p.label);
  };

  const applyMeal = (times: string[]) => {
    if (!activeDate) return;
    setSlots((p) => [
      ...p.filter((s) => s.date !== activeDate),
      ...times.map((t) => ({ date: activeDate, time: t, label: "" })),
    ]);
  };

  const removeSlot = (idx: number) => setSlots((p) => p.filter((_, i) => i !== idx));

  const grouped = slots.reduce((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {} as Record<string, Omit<TimeSlot, "id">[]>);
  const activeSlots = slots.filter((s) => s.date === activeDate);

  const canNext = step === 0 ? !!title.trim() : step === 1 ? selectedDates.length > 0 : step === 2 ? slots.length > 0 : true;

  const handleSubmit = () => {
    onSubmit({
      title: title.trim(),
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim(),
      description: description.trim(),
      slots,
    });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <TopBar
        title="揪團時間"
        subtitle={`步驟 ${step + 1}/4 · ${STEP_LABELS[step]}`}
        right={<button style={iconBtnStyle} onClick={onOpenHistory}>🕒</button>}
      />
      <div style={{ padding: "10px 16px 0", flexShrink: 0 }}>
        <div style={{ height: 4, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((step + 1) / 4) * 100}%`,
              background: "var(--color-primary)",
              transition: "width 250ms var(--ease-out)",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {step === 0 && (
          <div style={cardStyle}>
            <SectionLabel title="基本活動資訊" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input label="活動 / 會議名稱 *" placeholder="例如：產品專案週對齊會議" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={30} />
              <Input label="主揪暱稱（選填）" placeholder="例如：阿傑、Wally" value={hostName} onChange={(e) => setHostName(e.target.value)} />
              <Input label="主揪 Email（選填）" placeholder="例如：host@example.com" type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
              <Input label="地點或說明（選填）" placeholder="例如：捷運中山站火鍋" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={cardStyle}>
            <SectionLabel title="候選日期" hint="點選日期，或用下方批次工具快速選取" />
            <MonthCalendar selectedDates={selectedDates} onChange={setSelectedDates} viewDate={viewDate} setViewDate={setViewDate} />
            {selectedDates.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 10, color: "var(--color-muted)", marginBottom: 4 }}>已選 {selectedDates.length} 天</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {selectedDates.map((d) => (
                    <span
                      key={d}
                      onClick={() => toggleDate(d)}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--color-muted)",
                        background: "var(--color-cream)",
                        padding: "3px 7px",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      {d.slice(5)}({formatChineseWeekday(d).replace("週", "")})<span style={{ opacity: 0.6 }}>✕</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedDates.length === 0 && <div style={{ marginTop: 12, fontSize: 11, color: "var(--color-hot)" }}>⚠️ 請至少選擇一個日期</div>}
          </div>
        )}

        {step === 2 && (
          <div style={cardStyle}>
            <SectionLabel title="設定時段" hint={`已建立 ${slots.length} 個時段 · 點選日期分別設定該天的候選時段`} />
            <MiniMonthPicker selectedDates={selectedDates} slots={slots} viewDate={viewDate} setViewDate={setViewDate} activeDate={activeDate} setActiveDate={setActiveDate} />
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 10, paddingBottom: 2 }}>
              {selectedDates.map((d) => {
                const cnt = slots.filter((s) => s.date === d).length;
                const active = d === activeDate;
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setActiveDate(d);
                      const [y, m] = d.split("-").map(Number);
                      setViewDate(new Date(y, m - 1, 1));
                    }}
                    style={{
                      flexShrink: 0,
                      padding: "6px 10px",
                      borderRadius: "var(--radius-md)",
                      border: active ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background: active ? "var(--color-primary)" : cnt > 0 ? "var(--color-cream)" : "#fff",
                      color: active ? "#fff" : "var(--color-ink)",
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {d.slice(5)}({formatChineseWeekday(d).replace("週", "")}){cnt > 0 ? ` ·${cnt}` : ""}
                  </button>
                );
              })}
            </div>

            {activeDate && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 8 }}>
                  {activeDate} ({formatChineseWeekday(activeDate)}) 的候選時段
                </div>
                <div style={{ display: "flex", gap: 6, background: "var(--color-cream)", padding: 4, borderRadius: "var(--radius-md)", marginBottom: 12 }}>
                  {[{ k: "precise" as const, label: "精準時間" }, { k: "meal" as const, label: "聚餐時段" }].map((m) => (
                    <button
                      key={m.k}
                      onClick={() => setTimeMode(m.k)}
                      style={{
                        flex: 1,
                        padding: "7px 4px",
                        borderRadius: "var(--radius-md)",
                        fontSize: 12,
                        fontWeight: 800,
                        border: "none",
                        cursor: "pointer",
                        background: timeMode === m.k ? "var(--color-surface)" : "transparent",
                        color: timeMode === m.k ? "var(--color-primary)" : "var(--color-muted)",
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {timeMode === "precise" && (
                  <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-ink)", marginBottom: 6 }}>約定時長</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      {DURATIONS.map((d) => (
                        <Tag key={d.mins} active={duration === d.mins} onClick={() => setDuration(d.mins)} size="sm">
                          {d.label}
                        </Tag>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", display: "block", marginBottom: 4 }}>開始時間</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          style={{ width: "100%", padding: "7px 8px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", fontSize: 13, fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", display: "block", marginBottom: 4 }}>標籤（選填）</label>
                        <input
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          placeholder="例：討論"
                          style={{ width: "100%", padding: "7px 8px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", fontSize: 13 }}
                        />
                      </div>
                    </div>
                    <Button variant="primary" size="sm" fullWidth onClick={addPrecise}>+ 加入此時段</Button>
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", marginBottom: 6 }}>一鍵常用時段</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {MEETING_PRESETS.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => addPreset(p)}
                            style={{ textAlign: "left", padding: "7px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            {p.start} - {p.end} · {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {timeMode === "meal" && (
                  <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-ink)", marginBottom: 8 }}>套用組合（取代此日期目前清單）</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {MEAL_PRESETS.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => applyMeal(p.times)}
                          style={{ textAlign: "left", padding: "9px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer" }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{p.label}</div>
                          <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{p.times.join(" • ")}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
                  {activeSlots.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--color-muted)" }}>此日期尚未設定時段</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {activeSlots.map((s, i) => {
                        const originalIndex = slots.indexOf(s);
                        const durationStr = calculateSlotDuration(s.time);
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>
                              {s.time}
                              {s.label ? ` · ${s.label}` : ""}
                              {durationStr && <span style={{ color: "var(--color-muted)", fontWeight: 400 }}> ({durationStr})</span>}
                            </span>
                            <button onClick={() => removeSlot(originalIndex)} style={{ border: "none", background: "none", color: "var(--color-muted)", fontSize: 13, cursor: "pointer" }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            {slots.length === 0 && <div style={{ marginTop: 10, fontSize: 11, color: "var(--color-hot)" }}>⚠️ 尚未建立任何候選時段</div>}
          </div>
        )}

        {step === 3 && (
          <div style={cardStyle}>
            <SectionLabel title="確認活動內容" />
            <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", marginBottom: 4 }}>{title || "（尚未命名）"}</div>
            {hostName && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>主揪：{hostName}</div>}
            {description && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>📍 {description}</div>}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
              {(Object.entries(grouped) as [string, Omit<TimeSlot, "id">[]][]).map(([date, list]) => (
                <div key={date} style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--color-muted)" }}>
                    {date} ({formatChineseWeekday(date)})
                  </span>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{list.map((s) => s.time).join("、")}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, flexShrink: 0 }}>
        {step > 0 && <Button variant="muted" onClick={() => setStep((s) => s - 1)}>上一步</Button>}
        {step < 3 ? (
          <Button variant="primary" fullWidth disabled={!canNext} onClick={() => setStep((s) => s + 1)}>下一步</Button>
        ) : (
          <Button variant="hot" fullWidth disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? "正在產生活動連結..." : "產生活動連結 🚀"}
          </Button>
        )}
      </div>
    </div>
  );
};
