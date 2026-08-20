import React, { useState, useEffect } from "react";
import { History, X, AlertTriangle, MapPin, Rocket, Clock, CalendarDays, Plus } from "lucide-react";
import { CreateEventInput, EventMode, TimeSlot } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, formatSlotTime, getNextWeekdayDate } from "../lib/slots";
import { getDefaultDeadlineLocalValue, getNowLocalValue, localValueToIso } from "../lib/eventStatus";
import { Button, Input } from "../design-system/components";
import { TopBar } from "./TopBar";
import { MonthCalendar } from "./MonthCalendar";
import { MiniMonthPicker } from "./MiniMonthPicker";
import { cardStyle, iconBtnStyle, SectionLabel } from "./mobileStyles";
import { getRecentSlotPresets, saveRecentSlotPresets } from "../lib/api";

interface CreateWizardProps {
  onSubmit: (input: CreateEventInput) => Promise<void>;
  isLoading: boolean;
  onOpenHistory: () => void;
}

const SAT = getNextWeekdayDate(6);
const SUN = getNextWeekdayDate(0);

const DEFAULT_SLOTS: Omit<TimeSlot, "id">[] = [
  { date: SAT, time: "10:00", label: "上午會議" },
  { date: SAT, time: "14:00", label: "下午討論" },
  { date: SUN, time: "10:00", label: "上午會議" },
  { date: SUN, time: "14:00", label: "下午討論" },
];

const STEP_LABELS = ["基本資訊", "候選日期與時段", "確認送出"];

export const CreateWizard: React.FC<CreateWizardProps> = ({ onSubmit, isLoading, onOpenHistory }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<EventMode>("date_only");
  const [responseDeadline, setResponseDeadline] = useState(() => getDefaultDeadlineLocalValue());
  const [selectedDates, setSelectedDates] = useState<string[]>([SAT, SUN]);
  const [slots, setSlots] = useState<Omit<TimeSlot, "id">[]>(DEFAULT_SLOTS);
  const [startTime, setStartTime] = useState("10:00");
  const [label, setLabel] = useState("");
  const [activeDate, setActiveDate] = useState<string | null>(selectedDates[0] || null);
  const [quickPresets] = useState(() => getRecentSlotPresets());

  const isDateOnly = mode === "date_only";

  useEffect(() => {
    if (!activeDate || !selectedDates.includes(activeDate)) setActiveDate(selectedDates[0] || null);
  }, [selectedDates]);

  useEffect(() => {
    if (step === 1 && activeDate) {
      const [y, m] = activeDate.split("-").map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [step]);

  // In "date only" mode there's no separate time-entry step — each selected
  // date becomes exactly one slot behind the scenes, so downstream logic
  // (stats, finalize, etc.) doesn't need to know the data shape changed.
  useEffect(() => {
    if (!isDateOnly) return;
    setSlots(selectedDates.map((date) => ({ date, time: "", label: "" })));
  }, [isDateOnly, selectedDates]);

  // Switching out of "date only" mode leaves behind those placeholder blank-time
  // slots — drop them so dates without a real time fall into datesMissingSlots
  // and surface the "!" warning instead of rendering as empty slot rows.
  useEffect(() => {
    if (isDateOnly) return;
    setSlots((prev) => prev.filter((s) => s.time !== ""));
  }, [isDateOnly]);

  const addSlotToDates = (dates: string[], time: string, lbl: string) => {
    if (dates.length === 0 || !time) return;
    setSlots((p) => {
      const additions: Omit<TimeSlot, "id">[] = [];
      dates.forEach((date) => {
        const dup = (s: Omit<TimeSlot, "id">) => s.date === date && s.time === time;
        if (!p.some(dup) && !additions.some(dup)) additions.push({ date, time, label: lbl });
      });
      return [...p, ...additions];
    });
  };

  const addCustom = () => addSlotToDates(activeDate ? [activeDate] : [], startTime, label.trim());

  const addCustomToAll = () => addSlotToDates(selectedDates, startTime, label.trim());

  const addPreset = (p: { start: string; label: string }) => addSlotToDates(activeDate ? [activeDate] : [], p.start, p.label);

  const removeSlot = (idx: number) => setSlots((p) => p.filter((_, i) => i !== idx));

  const handleDatesChange = (dates: string[]) => {
    setSelectedDates(dates);
    setSlots((p) => p.filter((s) => dates.includes(s.date)));
  };

  const grouped = slots.reduce((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {} as Record<string, Omit<TimeSlot, "id">[]>);
  Object.values(grouped).forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
  const groupedEntries = (Object.entries(grouped) as [string, Omit<TimeSlot, "id">[]][]).sort(([a], [b]) => a.localeCompare(b));
  const activeSlots = slots.filter((s) => s.date === activeDate).sort((a, b) => a.time.localeCompare(b.time));
  const datesMissingSlots = selectedDates.filter((d) => !slots.some((s) => s.date === d));

  const canNext =
    step === 0
      ? !!title.trim() && !!responseDeadline
      : step === 1
      ? selectedDates.length > 0 && datesMissingSlots.length === 0
      : true;

  const handleSubmit = () => {
    if (!isDateOnly) saveRecentSlotPresets(slots);
    onSubmit({
      title: title.trim(),
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim(),
      description: description.trim(),
      mode,
      responseDeadline: localValueToIso(responseDeadline),
      slots,
    });
  };

  const stepLabels = isDateOnly ? ["基本資訊", "候選日期", "確認送出"] : STEP_LABELS;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <TopBar
        title={title.trim() || "未命名活動"}
        subtitle={`步驟 ${step + 1}/${stepLabels.length} · ${stepLabels[step]}`}
        right={<button style={iconBtnStyle} onClick={onOpenHistory}><History size={15} /></button>}
      />
      <div style={{ padding: "10px 16px 0", flexShrink: 0 }}>
        <div style={{ height: 4, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((step + 1) / stepLabels.length) * 100}%`,
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
              <Input label="活動 / 會議名稱" required placeholder="例如：產品專案週對齊會議" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={30} />

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)", display: "block", marginBottom: 6 }}>
                  投票截止時間<span style={{ color: "var(--color-primary)", marginLeft: 4 }}>*</span>
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={14} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                  <input
                    type="datetime-local"
                    value={responseDeadline}
                    min={getNowLocalValue()}
                    onChange={(e) => setResponseDeadline(e.target.value)}
                    style={{ flex: 1, padding: "9px 10px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", fontSize: 13, fontWeight: 700 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>預設為今天起 7 天後，可自行調整日期與時間</div>
              </div>

              <Input label="主揪暱稱" placeholder="例如：阿傑、Wally" value={hostName} onChange={(e) => setHostName(e.target.value)} />
              <Input label="主揪 Email" placeholder="例如：host@example.com" type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
              <Input label="地點或說明" placeholder="例如：捷運中山站火鍋" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={cardStyle}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)", display: "block", marginBottom: 6 }}>投票模式</label>
              <div style={{ display: "flex", gap: 2, background: "var(--color-cream)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 3 }}>
                {([
                  { k: "date_only" as EventMode, label: "只選日期", Icon: CalendarDays },
                  { k: "time_slots" as EventMode, label: "需要選時段", Icon: Clock },
                ]).map((m) => (
                  <button
                    key={m.k}
                    onClick={() => setMode(m.k)}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      padding: "8px 4px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 12,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      background: mode === m.k ? "var(--color-primary)" : "transparent",
                      color: mode === m.k ? "#fff" : "var(--color-ink)",
                      transition: "background 150ms ease, color 150ms ease",
                    }}
                  >
                    <m.Icon size={13} />
                    {m.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
                {isDateOnly ? "參與者只需勾選日期，不用細分時段" : "參與者可針對每個候選日期勾選細部時段"}
              </div>
            </div>

            <SectionLabel
              title={isDateOnly ? "候選日期" : "候選日期與時段"}
              hint={isDateOnly ? `點選日期新增候選，再點一次可取消；已選 ${selectedDates.length} 天` : `點選日期新增候選，再點一次可切換／取消；已建立 ${slots.length} 個時段`}
            />
            <MonthCalendar
              selectedDates={selectedDates}
              onChange={handleDatesChange}
              viewDate={viewDate}
              setViewDate={setViewDate}
              slots={slots}
              activeDate={activeDate}
              onActiveDateChange={setActiveDate}
              isDateOnly={isDateOnly}
            />
            {selectedDates.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--color-hot)", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} />
                請至少選擇一個日期
              </div>
            )}

            {!isDateOnly && activeDate && selectedDates.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                <div style={{ border: "1.5px dashed var(--color-border-strong)", borderRadius: "var(--radius-md)", padding: 10, marginBottom: 14, background: "var(--color-cream)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "var(--color-muted)", marginBottom: 8 }}>
                    <Plus size={12} />
                    新增候選時段
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "var(--color-ink)", display: "block", marginBottom: 4 }}>
                        開始時間<span style={{ color: "var(--color-primary)", marginLeft: 3 }}>*</span>
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        style={{ width: "100%", padding: "7px 8px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", fontSize: 13, fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 500, color: "var(--color-muted)", display: "block", marginBottom: 4 }}>標籤</label>
                      <input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="例：午餐、討論"
                        style={{ width: "100%", padding: "7px 8px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      <Button variant="primary" size="xs" fullWidth onClick={addCustom}>
                        + 加入 {activeDate.slice(5).replace("-", "/")} 的時段
                      </Button>
                    </div>
                    {selectedDates.length > 1 && (
                      <div style={{ flex: 1 }}>
                        <Button variant="secondary" size="xs" fullWidth onClick={addCustomToAll}>
                          + 加入全部日期（{selectedDates.length} 天）
                        </Button>
                      </div>
                    )}
                  </div>

                  {quickPresets.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", marginBottom: 6 }}>一鍵常用時段（上次使用）</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {quickPresets.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => addPreset(p)}
                            style={{ padding: "7px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            {formatSlotTime(p.start)}{p.label ? ` · ${p.label}` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-muted)", marginBottom: 6 }}>
                    已新增時段{activeSlots.length > 0 ? `（${activeSlots.length}）` : ""}
                  </div>
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
                              {formatSlotTime(s.time)}
                              {s.label ? ` · ${s.label}` : ""}
                              {durationStr && <span style={{ color: "var(--color-muted)", fontWeight: 400 }}> ({durationStr})</span>}
                            </span>
                            <button onClick={() => removeSlot(originalIndex)} style={{ border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={14} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedDates.length > 0 && datesMissingSlots.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--color-hot)", display: "flex", alignItems: "flex-start", gap: 4 }}>
                <AlertTriangle size={12} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>
                  以下日期尚未選擇時段：
                  {datesMissingSlots.map((d) => d.slice(5).replace("-", "/")).join("、")}
                </span>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={cardStyle}>
            <SectionLabel title="確認活動內容" />
            <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", marginBottom: 4 }}>{title || "（尚未命名）"}</div>
            {hostName && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>主揪：{hostName}</div>}
            {description && (
              <div style={{ fontSize: 11, color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} />
                {description}
              </div>
            )}
            <div style={{ fontSize: 11, color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Clock size={11} />
              投票截止：{responseDeadline ? responseDeadline.replace("T", " ") : "尚未設定"}
            </div>

            <div style={{ display: "flex", gap: 16, margin: "12px 0", paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {groupedEntries.length}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted)" }}>天</span>
              </div>
              {!isDateOnly && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {slots.length}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted)" }}>個時段</span>
                </div>
              )}
            </div>

            <MiniMonthPicker
              selectedDates={selectedDates}
              slots={slots}
              viewDate={viewDate}
              setViewDate={setViewDate}
              activeDate={activeDate}
              setActiveDate={setActiveDate}
              isDateOnly={isDateOnly}
            />

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 14 }}>
              {groupedEntries.map(([date, list]) => (
                <div key={date}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 6 }}>
                    {date} ({formatChineseWeekday(date)})
                  </div>
                  {!isDateOnly && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {list.map((s, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "9px 12px",
                            borderRadius: "var(--radius-md)",
                            background: "var(--color-cream)",
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-ink)" }}>{formatSlotTime(s.time)}</span>
                          {s.label && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted)" }}>{s.label}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, flexShrink: 0 }}>
        {step > 0 && <Button variant="muted" onClick={() => setStep((s) => s - 1)}>上一步</Button>}
        {step < 2 ? (
          <Button variant="primary" fullWidth disabled={!canNext} onClick={() => setStep((s) => s + 1)}>下一步</Button>
        ) : (
          <Button variant="hot" fullWidth disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? (
              "正在產生活動連結..."
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                產生活動連結
                <Rocket size={14} />
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
