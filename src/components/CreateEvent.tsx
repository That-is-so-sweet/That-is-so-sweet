import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  User, 
  Mail,
  FileText, 
  ArrowRight,
  Zap,
  Check,
  CalendarDays,
  Timer,
  Layers,
  Info
} from "lucide-react";
import { CreateEventInput, TimeSlot } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, addMinutesToTime, getNextWeekdayDate } from "../lib/slots";

interface CreateEventProps {
  onSubmit: (input: CreateEventInput) => Promise<void>;
  isLoading: boolean;
}

const MEAL_PRESETS = [
  { label: "⚡ 週末雙餐", times: ["12:00 - 14:00 (午餐)", "18:00 - 21:00 (晚餐)"] },
  { label: "⚡ 經典全天 3 時段", times: ["10:00 - 12:00 (早午餐)", "12:00 - 14:00 (午餐)", "18:00 - 21:00 (晚餐)"] },
  { label: "⚡ 晚間聚餐續攤", times: ["18:00 - 21:00 (晚餐)", "21:00 - 23:30 (酒吧續攤)"] },
  { label: "⚡ 下午茶聊天", times: ["14:00 - 17:00 (下午茶)"] },
];

const ONE_HOUR_MEETING_PRESETS = [
  { start: "10:00", end: "11:00", label: "上午會議" },
  { start: "11:00", end: "12:00", label: "午前對齊" },
  { start: "14:00", end: "15:00", label: "下午會議" },
  { start: "15:30", end: "16:30", label: "下午茶對接" },
  { start: "16:00", end: "17:00", label: "傍晚總結" },
  { start: "20:00", end: "21:00", label: "晚間線上會" },
];

export const CreateEvent: React.FC<CreateEventProps> = ({ onSubmit, isLoading }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");

  // Dates
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const nextFriday = getNextWeekdayDate(5);
  const nextSaturday = getNextWeekdayDate(6);
  const nextSunday = getNextWeekdayDate(0);

  const [selectedDates, setSelectedDates] = useState<string[]>([nextSaturday, nextSunday]);
  const [dateToAdd, setDateToAdd] = useState("");

  // Mode for time builder: 'precise' (開會/精準) | 'meal' (聚餐/時段) | 'batch' (批次產生)
  const [timeMode, setTimeMode] = useState<"precise" | "meal" | "batch">("precise");

  // Precise Mode States
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [durationMinutes, setDurationMinutes] = useState<number>(60); // default 1 hour
  const [preciseLabel, setPreciseLabel] = useState("");
  const [targetDateOption, setTargetDateOption] = useState<"all" | string>("all");

  // Batch Mode States
  const [batchStart, setBatchStart] = useState("09:00");
  const [batchEnd, setBatchEnd] = useState("17:00");
  const [batchInterval, setBatchInterval] = useState<number>(60); // 60 mins

  // Final slots list
  const [slots, setSlots] = useState<Omit<TimeSlot, "id">[]>([
    { date: nextSaturday, time: "10:00 - 11:00", label: "上午會議" },
    { date: nextSaturday, time: "14:00 - 15:00", label: "下午討論" },
    { date: nextSunday, time: "10:00 - 11:00", label: "上午會議" },
    { date: nextSunday, time: "14:00 - 15:00", label: "下午討論" },
  ]);

  // Auto-update end time when start time or duration changes in precise mode
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (durationMinutes > 0) {
      setEndTime(addMinutesToTime(newStart, durationMinutes));
    }
  };

  const handleDurationSelect = (mins: number) => {
    setDurationMinutes(mins);
    if (mins > 0 && startTime) {
      setEndTime(addMinutesToTime(startTime, mins));
    }
  };

  const [addedToast, setAddedToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setAddedToast(msg);
    setTimeout(() => setAddedToast(null), 2500);
  };

  // Toggle date helper
  const handleToggleDate = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      handleRemoveDate(dateStr);
    } else {
      const updated = [...selectedDates, dateStr].sort();
      setSelectedDates(updated);
      // Auto add default 1-hour slot for new date if none exists
      if (!slots.some((s) => s.date === dateStr)) {
        setSlots((prev) => [
          ...prev,
          { date: dateStr, time: "10:00 - 11:00", label: "會議/活動" },
        ]);
      }
    }
  };

  const handleAddDateInput = (dStr: string) => {
    if (!dStr) return;
    if (!selectedDates.includes(dStr)) {
      const updated = [...selectedDates, dStr].sort();
      setSelectedDates(updated);
      if (!slots.some((s) => s.date === dStr)) {
        setSlots((prev) => [
          ...prev,
          { date: dStr, time: "10:00 - 11:00", label: "會議/活動" },
        ]);
      }
      showToast(`已新增日期 ${dStr}`);
    }
    setDateToAdd("");
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setSelectedDates(selectedDates.filter((d) => d !== dateToRemove));
    setSlots(slots.filter((s) => s.date !== dateToRemove));
  };

  // Add precise slot
  const handleAddPreciseSlot = () => {
    if (!startTime || !endTime) return;
    const timeString = `${startTime} - ${endTime}`;
    const targetDates = targetDateOption === "all" ? selectedDates : [targetDateOption];

    if (targetDates.length === 0) return;

    let addedCount = 0;
    const newEntries: Omit<TimeSlot, "id">[] = [];
    targetDates.forEach((d) => {
      const exists = slots.some(
        (s) => s.date === d && s.time === timeString && s.label === preciseLabel.trim()
      );
      if (!exists) {
        newEntries.push({ date: d, time: timeString, label: preciseLabel.trim() });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setSlots((prev) => [...prev, ...newEntries]);
      showToast(`✨ 已新增 ${timeString} 至 ${targetDates.length} 個選定日期`);
    } else {
      showToast(`⚠️ 此時間點已存在於列表中`);
    }
  };

  // Add quick 1-hour preset
  const handleAddPresetMeetingSlot = (preset: { start: string; end: string; label: string }) => {
    const timeString = `${preset.start} - ${preset.end}`;
    const targetDates = targetDateOption === "all" ? selectedDates : [targetDateOption];

    if (targetDates.length === 0) return;

    let addedCount = 0;
    const newEntries: Omit<TimeSlot, "id">[] = [];
    targetDates.forEach((d) => {
      const exists = slots.some((s) => s.date === d && s.time === timeString);
      if (!exists) {
        newEntries.push({ date: d, time: timeString, label: preset.label });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setSlots((prev) => [...prev, ...newEntries]);
      showToast(`✨ 已新增【${preset.label} ${timeString}】`);
    } else {
      showToast(`⚠️ 此時段已存在於列表中`);
    }
  };

  // Apply meal preset to all selected dates
  const handleApplyMealPreset = (times: string[]) => {
    const newSlots: Omit<TimeSlot, "id">[] = [];
    selectedDates.forEach((d) => {
      times.forEach((t) => {
        newSlots.push({ date: d, time: t, label: "" });
      });
    });
    setSlots(newSlots);
    showToast(`✨ 已套用聚餐時段組合至 ${selectedDates.length} 個日期`);
  };

  // Generate batch slots
  const handleGenerateBatchSlots = () => {
    if (!batchStart || !batchEnd || batchInterval <= 0) return;
    const [hStart, mStart] = batchStart.split(":").map(Number);
    const [hEnd, mEnd] = batchEnd.split(":").map(Number);
    let startMins = hStart * 60 + mStart;
    const endMins = hEnd * 60 + mEnd;

    const generatedTimes: string[] = [];
    while (startMins + batchInterval <= endMins) {
      const sH = Math.floor(startMins / 60);
      const sM = startMins % 60;
      const eMins = startMins + batchInterval;
      const eH = Math.floor(eMins / 60);
      const eM = eMins % 60;

      const sStr = `${String(sH).padStart(2, "0")}:${String(sM).padStart(2, "0")}`;
      const eStr = `${String(eH).padStart(2, "0")}:${String(eM).padStart(2, "0")}`;
      generatedTimes.push(`${sStr} - ${eStr}`);

      startMins += batchInterval;
    }

    const targetDates = targetDateOption === "all" ? selectedDates : [targetDateOption];
    const newSlots: Omit<TimeSlot, "id">[] = [];

    targetDates.forEach((d) => {
      generatedTimes.forEach((t) => {
        const exists = slots.some((s) => s.date === d && s.time === t);
        if (!exists) {
          newSlots.push({ date: d, time: t, label: `${batchInterval / 60}小時會議` });
        }
      });
    });

    setSlots((prev) => [...prev, ...newSlots]);
  };

  const handleRemoveSlot = (indexToRemove: number) => {
    setSlots(slots.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAllSlots = () => {
    if (window.confirm("確定要清空所有已建立的候選時段嗎？")) {
      setSlots([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || slots.length === 0) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim(),
      slots,
    });
  };

  // Group slots by date for clean display
  const groupedSlots = slots.reduce<Record<string, { slot: Omit<TimeSlot, "id">; originalIndex: number }[]>>(
    (acc, slot, originalIndex) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push({ slot, originalIndex });
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3 border border-white/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            快速發起聚會與會議時間調查
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            主揪發起活動與約會 🗓️
          </h2>
          <p className="text-amber-100 text-sm leading-relaxed max-w-xl">
            彈性設定 1 小時精準開會時段、聚餐時段或全天區塊，專屬連結讓所有人快速勾選空檔！
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Event Info */}
        <div className="bg-white rounded-3xl p-6 border-4 border-orange-100 shadow-md space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-orange-100">
            <span className="w-7 h-7 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
              1
            </span>
            <h3 className="font-black text-slate-900 text-base">基本活動與會議資訊</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              活動 / 會議名稱 <span className="text-rose-500">*</span>
              <span className="text-slate-400 font-normal ml-1">({title.length}/30 字)</span>
            </label>
            <input
              type="text"
              required
              maxLength={30}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：產品專案週對齊會議、八月燒肉慶功宴、產品線規劃討論..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-slate-900 text-sm font-semibold transition placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-orange-500" />
                主揪 / 發起人暱稱 <span className="text-slate-400 font-normal">(選填)</span>
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="例如：阿傑、Wally"
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-slate-900 text-sm font-medium transition placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-orange-500" />
                主揪通知 Email <span className="text-slate-400 font-normal">(選填)</span>
              </label>
              <input
                type="email"
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
                placeholder="例如：host@example.com"
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-slate-900 text-sm font-medium transition placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-orange-500 shrink-0" />
                若填寫 Email，當有參與者回覆或定案時可接收通知
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              地點或開會說明 <span className="text-slate-400 font-normal">(選填)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：Google Meet 線上會議 或 捷運中山站火鍋"
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-slate-900 text-sm font-medium transition placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Step 2: Date & Time Picker */}
        <div className="bg-white rounded-3xl p-6 border-4 border-orange-100 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-orange-100">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                2
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-base">選擇候選日期與精確時間</h3>
                <p className="text-xs text-slate-500">可設定精準 1 小時會議點，或聚餐時段區塊</p>
              </div>
            </div>
            <span className="text-xs font-black text-orange-700 bg-orange-100/80 px-3 py-1.5 rounded-full border border-orange-200">
              已建立 {slots.length} 個候選時段
            </span>
          </div>

          {/* Section A: Date Selection */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-orange-600" />
                第一步：選擇候選日期
              </label>
              <span className="text-xs text-slate-500">（可複選多天）</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative inline-flex items-center">
                <input
                  type="date"
                  value={dateToAdd}
                  min={today}
                  onChange={(e) => handleAddDateInput(e.target.value)}
                  className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-800 focus:border-orange-500 bg-white shadow-xs cursor-pointer"
                />
              </div>

              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

              <span className="text-xs font-bold text-slate-600">快速點選：</span>
              {[
                { label: `今日 (${today.slice(5)})`, date: today },
                { label: `明日 (${tomorrow.slice(5)})`, date: tomorrow },
                { label: `下週六 (${nextSaturday.slice(5)})`, date: nextSaturday },
                { label: `下週日 (${nextSunday.slice(5)})`, date: nextSunday },
              ].map((item) => {
                const isSelected = selectedDates.includes(item.date);
                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => handleToggleDate(item.date)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-orange-500 text-white shadow-xs ring-2 ring-orange-400/30"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Selected Dates list */}
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedDates.length === 0 ? (
                <div className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-rose-500" />
                  請至少點選一個候選日期！
                </div>
              ) : (
                selectedDates.map((d) => (
                  <div
                    key={d}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-100/90 border border-orange-300 text-orange-950 text-xs font-bold shadow-2xs group"
                  >
                    <span>📅 {d} ({formatChineseWeekday(d)})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(d)}
                      className="p-0.5 hover:bg-orange-200 rounded-md transition text-orange-800 cursor-pointer"
                      title="移除此日期"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Toast Notification Banner */}
          {addedToast && (
            <div className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-between animate-bounce">
              <span>{addedToast}</span>
              <Check className="w-4 h-4" />
            </div>
          )}

          {/* Section B: Time Selection Builder Mode */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-600" />
                第二步：設定時間區塊與時段
              </label>

              {/* Target date dropdown */}
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-2xl border border-orange-200">
                <span className="text-xs font-black text-orange-900">🎯 時段套用至：</span>
                <select
                  value={targetDateOption}
                  onChange={(e) => setTargetDateOption(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-orange-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="all">所有選定日期 ({selectedDates.length} 天)</option>
                  {selectedDates.map((d) => (
                    <option key={d} value={d}>
                      僅 {d} ({formatChineseWeekday(d)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setTimeMode("precise")}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  timeMode === "precise"
                    ? "bg-white text-orange-600 shadow-sm border border-orange-200 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Timer className="w-4 h-4" />
                <span>開會 / 精準時間點 (如 1 小時)</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeMode("meal")}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  timeMode === "meal"
                    ? "bg-white text-orange-600 shadow-sm border border-orange-200 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>聚餐 / 休閒時段 (午餐/晚餐)</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeMode("batch")}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  timeMode === "batch"
                    ? "bg-white text-orange-600 shadow-sm border border-orange-200 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>批次自動切分區塊</span>
              </button>
            </div>

            {/* Tab 1: Precise Time / Duration Picker */}
            {timeMode === "precise" && (
              <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-200/80 space-y-4 animate-fade-in">
                {/* Duration shortcut pills */}
                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-2">
                    選擇約定時長：
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "30 分鐘", mins: 30 },
                      { label: "1 小時", mins: 60 },
                      { label: "1.5 小時", mins: 90 },
                      { label: "2 小時", mins: 120 },
                      { label: "3 小時", mins: 180 },
                    ].map((d) => (
                      <button
                        key={d.mins}
                        type="button"
                        onClick={() => handleDurationSelect(d.mins)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          durationMinutes === d.mins
                            ? "bg-orange-500 text-white border-orange-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-orange-300"
                        }`}
                      >
                        ⏱️ {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Picker Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      開始時間 (Start)
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-orange-500 text-sm font-bold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      結束時間 (End)
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        setDurationMinutes(0); // custom duration
                      }}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-orange-500 text-sm font-bold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      標籤說明 (如: 專案會議)
                    </label>
                    <input
                      type="text"
                      value={preciseLabel}
                      onChange={(e) => setPreciseLabel(e.target.value)}
                      placeholder="例：討論、對齊"
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-orange-500 text-xs font-medium text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-orange-950 font-bold flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-orange-200">
                      當前設定：{startTime} - {endTime}
                    </span>
                    {calculateSlotDuration(`${startTime} - ${endTime}`) && (
                      <span className="text-slate-600">
                        ({calculateSlotDuration(`${startTime} - ${endTime}`)})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPreciseSlot}
                    disabled={selectedDates.length === 0}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>加入此精準時間點</span>
                  </button>
                </div>

                {/* Quick 1-hour Meeting Shortcuts */}
                <div className="border-t border-amber-200/80 pt-3">
                  <span className="block text-xs font-bold text-slate-700 mb-2">
                    💡 一鍵點選常用精確會議時段：
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ONE_HOUR_MEETING_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPresetMeetingSlot(preset)}
                        className="p-2.5 rounded-xl bg-white border border-amber-200 hover:border-orange-400 hover:bg-orange-50/80 text-left transition cursor-pointer group flex items-center justify-between shadow-2xs active:scale-95"
                      >
                        <div>
                          <div className="text-xs font-black text-slate-800 group-hover:text-orange-600">
                            {preset.start} - {preset.end}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">{preset.label} (1小時)</div>
                        </div>
                        <Plus className="w-4 h-4 text-orange-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Meals & Casual Events Presets */}
            {timeMode === "meal" && (
              <div className="p-5 rounded-2xl bg-orange-50/50 border-2 border-orange-200/80 space-y-4 animate-fade-in">
                <p className="text-xs font-bold text-slate-700">
                  一鍵套用聚餐經典時段組合（午餐、下午茶、晚餐、續攤）：
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MEAL_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyMealPreset(preset.times)}
                      className="text-left p-3.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50/60 transition shadow-2xs group cursor-pointer"
                    >
                      <div className="font-bold text-xs text-slate-900 group-hover:text-orange-600 mb-1">
                        {preset.label}
                      </div>
                      <div className="text-xs text-slate-500 font-medium leading-relaxed">
                        {preset.times.join(" • ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Batch Generator */}
            {timeMode === "batch" && (
              <div className="p-5 rounded-2xl bg-indigo-50/50 border-2 border-indigo-200/80 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  自動將一段時間切分為連續的會議/活動區塊：
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      起始時間 (如 09:00)
                    </label>
                    <input
                      type="time"
                      value={batchStart}
                      onChange={(e) => setBatchStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-indigo-500 text-sm font-bold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      結束時間 (如 17:00)
                    </label>
                    <input
                      type="time"
                      value={batchEnd}
                      onChange={(e) => setBatchEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-indigo-500 text-sm font-bold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      每個區塊長度
                    </label>
                    <select
                      value={batchInterval}
                      onChange={(e) => setBatchInterval(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-indigo-500 text-xs font-bold text-slate-800 bg-white"
                    >
                      <option value={30}>30 分鐘</option>
                      <option value={60}>1 小時</option>
                      <option value={90}>1.5 小時</option>
                      <option value={120}>2 小時</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateBatchSlots}
                    disabled={selectedDates.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="w-4 h-4" />
                    <span>批次產生時段並加入</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section C: Preview of Created Candidate Slots grouped by date */}
          <div className="border-t border-orange-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-black text-slate-900">已建立的候選時段清單</h4>
                <p className="text-[11px] text-slate-500">（以下時段將提供給參與者進行有空度勾選）</p>
              </div>

              {slots.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSlots}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  清空全部
                </button>
              )}
            </div>

            {slots.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-rose-50 border-2 border-dashed border-rose-200 text-rose-700 text-xs font-bold space-y-1">
                <p>⚠️ 目前尚未建立任何候選時段！</p>
                <p className="text-rose-500 font-normal">請在上方的時間選擇器中設定時間並點選「新增」或套用範本。</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {(Object.entries(groupedSlots) as [string, { slot: Omit<TimeSlot, "id">; originalIndex: number }[]][]).map(([date, dateSlots]) => (
                  <div key={date} className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
                    <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-bold">
                        📅 {date} ({formatChineseWeekday(date)})
                      </span>
                      <span className="text-slate-400 font-normal">({dateSlots.length} 個選項)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dateSlots.map(({ slot, originalIndex }) => {
                        const durationStr = calculateSlotDuration(slot.time);
                        return (
                          <div
                            key={originalIndex}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-orange-300 text-xs shadow-2xs transition"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{slot.time}</span>
                              {durationStr && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                  ⏱️ {durationStr}
                                </span>
                              )}
                              {slot.label && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] border border-slate-200">
                                  {slot.label}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(originalIndex)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer ml-2"
                              title="刪除此選項"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !title.trim() || slots.length === 0}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-base shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer border-b-4 border-orange-700"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                正在產生活動與專屬連結...
              </>
            ) : (
              <>
                <span>產生活動連結並開啟邀請 🚀</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
