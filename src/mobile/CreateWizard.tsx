import React, { useState, useEffect, useRef } from "react";
import { History, X, AlertTriangle, Rocket, Plus, Info } from "lucide-react";
import { CreateEventInput, EventLocation, EventMode, TimeSlot } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, formatSlotTime, getNextWeekdayDate } from "../lib/slots";
import { getDefaultDeadlineLocalValue, getNowLocalValue, localValueToIso } from "../lib/eventStatus";
import { parseLocationInput, extractPlaceNameFromFullUrl, mockResolveShortLink } from "../lib/location";
import { Button, Input } from "../design-system/components";
import { TopBar } from "./TopBar";
import { MonthCalendar } from "./MonthCalendar";
import { MiniMonthPicker } from "./MiniMonthPicker";
import { EventInfoCard } from "./EventInfoCard";
import { cardStyle, iconBtnStyle } from "./mobileStyles";
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

const STEP_LABELS = ["基本資訊", "候選日期與時段", "活動投票預覽"];

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
  const [openInfo, setOpenInfo] = useState<"hostName" | "hostEmail" | null>(null);
  const [showDateHint, setShowDateHint] = useState(false);
  const [location, setLocation] = useState<EventLocation | undefined>(undefined);
  const [locationInput, setLocationInput] = useState("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const locationRequestRef = useRef(0);

  const isDateOnly = mode === "date_only";

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocationInput(raw);
    const requestId = ++locationRequestRef.current;
    const parsed = parseLocationInput(raw);

    if (!parsed) {
      setIsResolvingLocation(false);
      setLocation(raw.trim() ? { text: raw.trim() } : undefined);
      return;
    }

    if (!parsed.isShortLink) {
      setIsResolvingLocation(false);
      const name = extractPlaceNameFromFullUrl(parsed.url);
      setLocation({ text: name || "Google Maps 地點", url: parsed.url });
      return;
    }

    setIsResolvingLocation(true);
    setLocation({ text: raw.trim(), url: parsed.url });
    mockResolveShortLink(parsed.url).then((name) => {
      if (locationRequestRef.current !== requestId) return;
      setIsResolvingLocation(false);
      setLocation({ text: name, url: parsed.url });
      setLocationInput(name);
    });
  };

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
      location,
      mode,
      responseDeadline: localValueToIso(responseDeadline),
      slots,
    });
  };

  const stepLabels = isDateOnly ? ["基本資訊", "候選日期", "活動投票預覽"] : STEP_LABELS;

  const infoLabel = (text: string, key: "hostName" | "hostEmail") => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {text}
      <button
        type="button"
        onClick={() => setOpenInfo((p) => (p === key ? null : key))}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", padding: 0 }}
        aria-label="更多資訊"
      >
        <Info size={13} />
      </button>
    </span>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <TopBar
        title={title.trim() || "未命名活動"}
        right={<button style={iconBtnStyle} onClick={onOpenHistory}><History size={15} /></button>}
      />
      <div style={{ padding: "8px 16px", flexShrink: 0, background: "var(--color-primary-subtle)" }}>
        <div style={{ display: "flex", gap: 3 }}>
          {stepLabels.map((stepLabel, i) => {
            const filled = i <= step;
            const isClickable = i < step;
            return (
              <div
                key={stepLabel}
                onClick={isClickable ? () => setStep(i) : undefined}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  background: filled ? "var(--color-primary)" : "rgba(26,12,4,0.12)",
                  cursor: isClickable ? "pointer" : "default",
                }}
              />
            );
          })}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-primary)", letterSpacing: "-0.01em" }}>{stepLabels[step]}</span>
            {step === 1 && (
              <button
                onClick={() => setShowDateHint((v) => !v)}
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
                  background: showDateHint ? "var(--color-primary-subtle)" : "transparent",
                  color: "var(--color-primary)",
                }}
              >
                <Info size={13} />
              </button>
            )}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted)" }}>
            步驟 {step + 1}/{stepLabels.length}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: 16, background: step === 0 ? "var(--color-surface)" : undefined }}>
        {step === 0 && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input label="活動名稱" required placeholder="例如：組內聚餐" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={30} />

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)", display: "block", marginBottom: 6 }}>
                  投票截止時間<span style={{ color: "var(--color-primary)", marginLeft: 4 }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={responseDeadline}
                  min={getNowLocalValue()}
                  onChange={(e) => setResponseDeadline(e.target.value)}
                  style={{ width: "100%", padding: "9px 10px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", fontSize: 13, fontWeight: 700 }}
                />
              </div>

              <Input
                label={infoLabel("主揪暱稱", "hostName")}
                placeholder="例如：阿傑、Wally"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                hint={openInfo === "hostName" ? "這個主揪暱稱將會顯示在任何活動名稱的地方，以及之後會使用這個暱稱作為登入的依據" : undefined}
              />
              <Input
                label={infoLabel("主揪 Email", "hostEmail")}
                placeholder="例如：host@example.com"
                type="email"
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
                hint={openInfo === "hostEmail" ? "後續如果有相對應的內容更新，會從這個 email 來做登入，並且會寄信通知" : undefined}
              />
              <Input
                label="地點"
                placeholder="輸入地點，或貼上 Google Maps 連結"
                value={locationInput}
                onChange={handleLocationChange}
                hint={isResolvingLocation ? "解析地點中..." : location?.url ? "已附上 Google Maps 連結" : undefined}
              />
              <Input label="活動說明（選填）" placeholder="例如：想吃鍋物，歡迎推薦口袋名單" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            {showDateHint && (
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 10 }}>
                點擊或拖曳即可新增／取消
              </div>
            )}
            <div style={cardStyle}>
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
            </div>
            {selectedDates.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--color-hot)", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} />
                請至少選擇一個日期
              </div>
            )}

            {selectedDates.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-muted)" }}>
                    已選日期（{selectedDates.length}）
                  </div>
                  {isDateOnly ? (
                    <button
                      onClick={() => {
                        setMode("time_slots");
                        if (!activeDate || !selectedDates.includes(activeDate)) {
                          setActiveDate([...selectedDates].sort()[0]);
                        }
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "none", color: "var(--color-primary)", fontSize: 11, fontWeight: 800, cursor: "pointer", padding: 0, flexShrink: 0 }}
                    >
                      <Plus size={12} />
                      新增時段
                    </button>
                  ) : (
                    <button
                      onClick={() => setMode("date_only")}
                      style={{ border: "none", background: "none", color: "var(--color-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, padding: 0, whiteSpace: "nowrap" }}
                    >
                      ◀ 改回只選日期
                    </button>
                  )}
                </div>
                {isDateOnly && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[...selectedDates].sort().map((date) => (
                      <div
                        key={date}
                        style={{ padding: "8px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700 }}>
                          {date} ({formatChineseWeekday(date)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isDateOnly && activeDate && selectedDates.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 8 }}>
                  {activeDate} ({formatChineseWeekday(activeDate)})
                </div>

                {activeSlots.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 10 }}>此日期尚未設定時段</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
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

                <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 8, borderRadius: "var(--radius-md)", background: "var(--color-primary-subtle)", border: "1.5px solid var(--color-primary-light)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{ flex: 1, minWidth: 0, padding: "7px 8px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 700 }}
                    />
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => {
                        addCustom();
                        setLabel("");
                      }}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="標籤（選填，例：午餐）"
                    style={{ width: "100%", padding: "7px 8px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13 }}
                  />

                  {quickPresets.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {quickPresets.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => addPreset(p)}
                          style={{ padding: "6px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          {formatSlotTime(p.start)}{p.label ? ` · ${p.label}` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedDates.length > 1 && (
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed var(--color-border)" }}>
                    <Button
                      variant="secondary"
                      size="xs"
                      fullWidth
                      onClick={() => {
                        addCustomToAll();
                        setLabel("");
                      }}
                    >
                      + 套用目前時段到全部已選日期（{selectedDates.length} 天）
                    </Button>
                  </div>
                )}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <EventInfoCard
              title={title}
              hostName={hostName}
              location={location}
              description={description}
              responseDeadlineIso={responseDeadline ? localValueToIso(responseDeadline) : undefined}
            />

            <div style={cardStyle}>
              <MiniMonthPicker
                selectedDates={selectedDates}
                slots={slots}
                viewDate={viewDate}
                setViewDate={setViewDate}
                activeDate={activeDate}
                setActiveDate={setActiveDate}
                isDateOnly={isDateOnly}
              />

              {isDateOnly ? (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-muted)", marginBottom: 8 }}>
                    候選日期（{selectedDates.length}）
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[...selectedDates].sort().map((date) => (
                      <div
                        key={date}
                        style={{ padding: "6px 10px", borderRadius: "var(--radius-md)", background: "var(--color-cream)", fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}
                      >
                        {date.slice(5).replace("-", "/")}（{formatChineseWeekday(date)}）
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-muted)", marginBottom: 8 }}>
                    候選時段（共 {groupedEntries.length} 天・{slots.length} 個時段）
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {groupedEntries.map(([date, list]) => (
                      <div key={date}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 6 }}>
                          {date} ({formatChineseWeekday(date)})
                        </div>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
