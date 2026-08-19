import React, { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  Clock, 
  Share2, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  Send, 
  Crown, 
  MessageSquare, 
  Edit3, 
  Trash2,
  Lock,
  Sparkles,
  Info,
  Copy,
  Mail,
  Smartphone,
  MapPin,
  Zap,
  Timer,
  Utensils,
  Pin,
  ArrowRight,
  RotateCw,
  Rocket,
  User,
  MessageCircle
} from "lucide-react";
import { 
  EventData, 
  AvailabilityStatus, 
  SubmitResponseInput, 
  ParticipantResponse,
  TimeSlot 
} from "../types";
import { HeatmapView } from "./HeatmapView";
import { HostManagePanel } from "./HostManagePanel";
import { FinalizedView } from "./FinalizedView";
import { getUserNickname, getUserEmail } from "../lib/api";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, parseSlotTimes } from "../lib/slots";

interface EventViewProps {
  event: EventData;
  hostToken?: string;
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen?: () => Promise<void>;
  onDeleteResponse?: (participantId: string) => Promise<void>;
  onOpenShareModal: () => void;
  onCopySuccess: () => void;
  isLoading: boolean;
}

export const EventView: React.FC<EventViewProps> = ({
  event,
  hostToken,
  onRespond,
  onFinalize,
  onReopen,
  onDeleteResponse,
  onOpenShareModal,
  onCopySuccess,
  isLoading,
}) => {
  const isHost = Boolean(hostToken && hostToken === event.hostToken);

  // Participant nickname state
  const [nickname, setNickname] = useState(() => getUserNickname());
  const [email, setEmail] = useState(() => getUserEmail());
  const [comment, setComment] = useState("");

  // Map of slotId -> AvailabilityStatus
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);

  // Tab view switch: 'voting' | 'heatmap' | 'host'
  const [activeTab, setActiveTab] = useState<"voting" | "heatmap" | "host">("voting");

  // If user previously responded to this event, pre-fill form
  useEffect(() => {
    if (nickname.trim()) {
      const existing = event.responses.find(
        (r) => r.nickname.toLowerCase() === nickname.trim().toLowerCase()
      );
      if (existing) {
        setEditingParticipantId(existing.id);
        setAvailability(existing.availability || {});
        if (existing.email) setEmail(existing.email);
        if (existing.comment) setComment(existing.comment);
      } else {
        // Initialize default all available
        const initialMap: Record<string, AvailabilityStatus> = {};
        event.slots.forEach((s) => {
          initialMap[s.id] = "available";
        });
        setAvailability(initialMap);
      }
    } else {
      const initialMap: Record<string, AvailabilityStatus> = {};
      event.slots.forEach((s) => {
        initialMap[s.id] = "available";
      });
      setAvailability(initialMap);
    }
  }, [event.id, nickname]);

  const handleStatusChange = (slotId: string, status: AvailabilityStatus) => {
    setAvailability((prev) => ({
      ...prev,
      [slotId]: status,
    }));
  };

  const handleSelectAllAvailable = () => {
    const updated: Record<string, AvailabilityStatus> = {};
    event.slots.forEach((s) => {
      updated[s.id] = "available";
    });
    setAvailability(updated);
  };

  const handleSelectAllUnavailable = () => {
    const updated: Record<string, AvailabilityStatus> = {};
    event.slots.forEach((s) => {
      updated[s.id] = "unavailable";
    });
    setAvailability(updated);
  };

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    await onRespond({
      participantId: editingParticipantId || undefined,
      nickname: nickname.trim(),
      email: email.trim(),
      availability,
      comment: comment.trim(),
    });
  };

  // Group slots by date
  const groupedSlots = event.slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, typeof event.slots>);

  // If event is finalized, show Finalized View directly
  if (event.status === "finalized") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <FinalizedView
          event={event}
          isHost={isHost}
          onReopen={onReopen}
          onCopySuccess={onCopySuccess}
        />
        {/* Heatmap summary as reference */}
        <div className="pt-4">
          <HeatmapView slots={event.slots} responses={event.responses} finalSlotId={event.finalSlotId} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Event Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              統計時間中 • 免登入
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isHost && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                <Crown className="w-3.5 h-3.5" /> 主揪管理中
              </span>
            )}

            <button
              onClick={onOpenShareModal}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="inline-flex items-center gap-1">
                分享活動連結
                <Smartphone className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {event.title}
          </h2>
          {event.description && (
            <p className="text-slate-600 text-sm mt-1.5 leading-relaxed flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{event.description}</span>
            </p>
          )}
          {event.hostName && (
            <p className="text-xs text-slate-500 mt-2">
              主揪發起人：<span className="font-semibold text-slate-800">{event.hostName}</span>
              <span className="mx-2">•</span>
              目前已收到 <span className="font-bold text-amber-600">{event.responses.length}</span> 份回覆
            </p>
          )}
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab("voting")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "voting"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            03. 勾選我的時間 ({editingParticipantId ? "重新編輯" : "填寫"})
          </button>

          <button
            onClick={() => setActiveTab("heatmap")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "heatmap"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            04. 共同時間熱點圖 ({event.responses.length} 人已填)
          </button>

          {isHost && (
            <button
              onClick={() => setActiveTab("host")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "host"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-amber-100 text-amber-900 hover:bg-amber-200"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              05. 主揪拍板定案
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Participant Voting Form */}
      {activeTab === "voting" && (
        <form onSubmit={handleSubmitVote} className="space-y-6">
          {/* User Nickname & Email input */}
          <div className="bg-white rounded-lg p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                輸入您的基本資訊
              </h3>

              {editingParticipantId && (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
                  <Edit3 className="w-3 h-3" />
                  正在編輯此暱稱的紀錄
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  您的暱稱 <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="例如：小明、莉莉"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  聯絡 Email / LINE ID
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="例如：name@example.com 或 LINE ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-sm font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-amber-500 shrink-0" />
                  若填寫 Email，當主揪敲定定案時間時可收到通知
                </p>
              </div>
            </div>
          </div>

          {/* Time Slots Selector */}
          <div className="bg-white rounded-lg p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                勾選您有空的時間
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllAvailable}
                  className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition inline-flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  全部點選有空
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllUnavailable}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium transition"
                >
                  全選不方便
                </button>
              </div>
            </div>

            {/* Matrix grouped by date in Timeline View */}
            <div className="space-y-6">
              {(Object.entries(groupedSlots) as [string, TimeSlot[]][]).map(([date, dateSlots]) => (
                <div key={date} className="space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-mono flex items-center gap-1.5 shadow-xs">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      {date} ({formatChineseWeekday(date)})
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      ({dateSlots.length} 個候選時段)
                    </span>
                  </div>

                  {/* Vertical Timeline container */}
                  <div className="relative pl-6 sm:pl-8 border-l-2 border-orange-200 space-y-4 ml-3 sm:ml-4 my-2">
                    {dateSlots.map((slot) => {
                      const currentStatus = availability[slot.id] || "available";
                      const parsedTime = parseSlotTimes(slot.time);
                      const durationStr = calculateSlotDuration(slot.time);

                      return (
                        <div key={slot.id} className="relative group">
                          {/* Timeline Dot Node */}
                          <div
                            className={`absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 transition-all shadow-xs ${
                              currentStatus === "available"
                                ? "bg-emerald-500 border-white ring-4 ring-emerald-100"
                                : currentStatus === "if_needed"
                                ? "bg-amber-500 border-white ring-4 ring-amber-100"
                                : "bg-slate-300 border-white ring-2 ring-slate-100"
                            }`}
                          />

                          {/* Timeline Slot Card */}
                          <div
                            className={`p-4 rounded-lg border-2 transition-all ${
                              currentStatus === "available"
                                ? "bg-emerald-50/80 border-emerald-300 shadow-2xs"
                                : currentStatus === "if_needed"
                                ? "bg-amber-50/80 border-amber-300 shadow-2xs"
                                : "bg-slate-50/80 border-slate-200 opacity-80"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              {/* Time Badges: Start & End times */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {parsedTime.end ? (
                                  <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs font-mono text-xs">
                                    <span className="text-slate-400 font-bold">開始</span>
                                    <span className="font-black text-slate-900 text-sm">{parsedTime.start}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-300 mx-0.5" />
                                    <span className="text-slate-400 font-bold">結束</span>
                                    <span className="font-black text-slate-900 text-sm">{parsedTime.end}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-black text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
                                    {slot.time}
                                  </span>
                                )}

                                {durationStr && (
                                  <span className="px-2 py-1 rounded-lg bg-amber-100/90 text-amber-950 text-xs font-bold border border-amber-200 inline-flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {durationStr}
                                  </span>
                                )}

                                {parsedTime.periodLabel && (
                                  <span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-950 text-xs font-bold border border-orange-200 inline-flex items-center gap-1">
                                    <Utensils className="w-3 h-3" />
                                    {parsedTime.periodLabel}
                                  </span>
                                )}

                                {slot.label && (
                                  <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 inline-flex items-center gap-1">
                                    <Pin className="w-3 h-3" />
                                    {slot.label}
                                  </span>
                                )}
                              </div>

                              {/* Selected Status Badge */}
                              <div className="text-xs font-black shrink-0">
                                {currentStatus === "available" && (
                                  <span className="text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    可以
                                  </span>
                                )}
                                {currentStatus === "if_needed" && (
                                  <span className="text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
                                    <HelpCircle className="w-3 h-3" />
                                    視情況
                                  </span>
                                )}
                                {currentStatus === "unavailable" && (
                                  <span className="text-slate-600 bg-slate-200/90 px-2.5 py-1 rounded-full border border-slate-300 inline-flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    不行
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 3 Mobile-Optimized Status Toggle Buttons */}
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(slot.id, "available")}
                                className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                                  currentStatus === "available"
                                    ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/30"
                                    : "bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200"
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>可以</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(slot.id, "if_needed")}
                                className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                                  currentStatus === "if_needed"
                                    ? "bg-amber-500 text-white shadow-md ring-2 ring-amber-400/30"
                                    : "bg-white text-slate-700 hover:bg-amber-50 border border-slate-200"
                                }`}
                              >
                                <HelpCircle className="w-4 h-4" />
                                <span>視情況</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(slot.id, "unavailable")}
                                className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                                  currentStatus === "unavailable"
                                    ? "bg-slate-700 text-white shadow-md"
                                    : "bg-white text-slate-700 hover:bg-rose-50 border border-slate-200"
                                }`}
                              >
                                <XCircle className="w-4 h-4" />
                                <span>不行</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Note */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                給主揪的話 / 備註
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="例如：週六需要 19:00 才能到，或者可車接車送！"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !nickname.trim()}
            className="w-full py-4 px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 text-amber-400" />
                <span className="inline-flex items-center gap-1.5">
                  {editingParticipantId ? (
                    <>
                      更新我的回覆
                      <RotateCw className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      送出我的時間
                      <Rocket className="w-4 h-4" />
                    </>
                  )}
                </span>
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 2: Heatmap Visualizer */}
      {activeTab === "heatmap" && (
        <div className="space-y-6">
          <HeatmapView
            slots={event.slots}
            responses={event.responses}
            finalSlotId={event.finalSlotId}
            onSelectSlotForFinalize={(slotId) => {
              if (isHost) setActiveTab("host");
            }}
            isHost={isHost}
          />

          {/* Participant Responses Roster */}
          <div className="bg-white rounded-lg p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
              <span>已填寫名冊 ({event.responses.length} 人)</span>
            </h3>

            {event.responses.length === 0 ? (
              <p className="text-xs text-slate-400">目前尚無人填寫</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {event.responses.map((r) => {
                  const availableCount = Object.values(r.availability).filter(
                    (v) => v === "available"
                  ).length;

                  return (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {r.nickname}
                          {r.nickname === nickname && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                              (您)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                            {availableCount}/{event.slots.length} 時段有空
                          </span>

                          {(isHost || r.nickname === nickname) && onDeleteResponse && (
                            <button
                              onClick={() => onDeleteResponse(r.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition"
                              title="刪除此紀錄"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {r.comment && (
                        <div className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60 text-[11px] flex items-start gap-1">
                          <MessageCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{r.comment}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Host Finalize Controls */}
      {activeTab === "host" && isHost && (
        <HostManagePanel
          event={event}
          hostToken={hostToken || ""}
          onFinalize={onFinalize}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
