import React, { useState } from "react";
import { 
  Flame, 
  Trophy, 
  Users, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info,
  Timer,
  MapPin,
  Calendar,
  ArrowRight,
  X,
  BarChart3,
  Target
} from "lucide-react";
import { TimeSlot, ParticipantResponse, SlotStats } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, computeSlotStats } from "../lib/slots";

interface HeatmapViewProps {
  slots: TimeSlot[];
  responses: ParticipantResponse[];
  finalSlotId?: string;
  onSelectSlotForFinalize?: (slotId: string) => void;
  isHost?: boolean;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  slots,
  responses,
  finalSlotId,
  onSelectSlotForFinalize,
  isHost,
}) => {
  const [selectedSlotModal, setSelectedSlotModal] = useState<SlotStats | null>(null);

  const totalParticipants = responses.length;

  // Calculate stats for each slot
  const slotStatsList: SlotStats[] = computeSlotStats(slots, responses);

  // Find max available count for relative heatmap shading
  const maxAvailable = Math.max(...slotStatsList.map((s) => s.availableCount), 1);

  // Top 3 best slots sorted by score / availableCount
  const sortedTopSlots = [...slotStatsList]
    .filter((s) => s.availableCount > 0 || s.ifNeededCount > 0)
    .sort((a, b) => b.score - a.score || b.availableCount - a.availableCount);

  const bestSlotId = sortedTopSlots[0]?.slotId;

  // Group slots by date for organized matrix view
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  // Color generator for heatmap based on availability ratio
  const getHeatmapBg = (available: number, isBest: boolean) => {
    if (totalParticipants === 0) return "bg-slate-50 border-slate-200 text-slate-700";
    if (available === 0) return "bg-slate-100/60 border-slate-200 text-slate-400";

    const ratio = available / maxAvailable;

    if (isBest && available > 0) {
      return "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white border-amber-500 shadow-md ring-2 ring-amber-400/50";
    }

    if (ratio >= 0.8) {
      return "bg-emerald-600 text-white border-emerald-700 shadow-xs";
    } else if (ratio >= 0.5) {
      return "bg-emerald-500/90 text-white border-emerald-600";
    } else if (ratio >= 0.25) {
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    } else {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Popularity Recommendations */}
      {totalParticipants > 0 && sortedTopSlots.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/80 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-600 shrink-0" />
            <h4 className="font-bold text-slate-900 text-sm">
              聚會時段熱門推薦榜 (Top Free Slots)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sortedTopSlots.slice(0, 3).map((stats, idx) => {
              const isFirst = idx === 0;
              const isSelected = finalSlotId === stats.slotId;

              return (
                <div
                  key={stats.slotId}
                  onClick={() => setSelectedSlotModal(stats)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer relative overflow-hidden group ${
                    isFirst
                      ? "bg-amber-500/15 border-amber-400 text-amber-950 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        isFirst
                          ? "bg-amber-500 text-white"
                          : idx === 1
                          ? "bg-slate-700 text-white"
                          : "bg-amber-700/80 text-white"
                      }`}
                    >
                      TOP {idx + 1}
                      {isFirst && (
                        <>
                          <Trophy className="w-3 h-3" />
                          最推薦
                        </>
                      )}
                    </span>

                    <span className="text-xs font-bold text-emerald-700">
                      {stats.availableCount}/{totalParticipants} 人可出席 ({stats.percentage}%)
                    </span>
                  </div>

                  <div className="font-bold text-sm text-slate-900 mt-1">
                    {stats.slot.date} ({formatChineseWeekday(stats.slot.date)})
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-700">
                    <span>{stats.slot.time}</span>
                    {calculateSlotDuration(stats.slot.time) && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold inline-flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {calculateSlotDuration(stats.slot.time)}
                      </span>
                    )}
                  </div>

                  {stats.slot.label && (
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {stats.slot.label}
                    </div>
                  )}

                  <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                    <span>
                      出席：{stats.availableNames.slice(0, 3).join("、")}
                      {stats.availableNames.length > 3 ? "..." : ""}
                    </span>
                    <span className="text-amber-700 font-semibold group-hover:underline inline-flex items-center gap-0.5">
                      查看詳情
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heatmap Grid Matrix */}
      <div className="bg-white rounded-lg p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">時間熱點分佈圖</h3>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500 border border-amber-600" /> 最熱門
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-600" /> 高出席
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> 部分有空
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> 尚無人
            </span>
          </div>
        </div>

        {totalParticipants === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            目前尚無任何人填寫，邀請朋友們點擊上方「一鍵複製連結」開始投票吧！
          </div>
        )}

        {/* Matrix by date */}
        <div className="space-y-4">
          {(Object.entries(groupedSlots) as [string, TimeSlot[]][]).map(([date, dateSlots]) => (
            <div key={date} className="space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {date} ({formatChineseWeekday(date)})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dateSlots.map((slot) => {
                  const stats = slotStatsList.find((s) => s.slotId === slot.id)!;
                  const isBest = stats.slotId === bestSlotId && totalParticipants > 0 && stats.availableCount > 0;
                  const isFinal = finalSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlotModal(stats)}
                      className={`p-4 rounded-xl border transition cursor-pointer relative ${getHeatmapBg(
                        stats.availableCount,
                        isBest
                      )} hover:scale-[1.01] active:scale-[0.99]`}
                    >
                      {/* Final Chosen Badge */}
                      {isFinal && (
                        <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm animate-bounce inline-flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          主揪拍板
                        </div>
                      )}

                      {!isFinal && isBest && stats.availableCount > 0 && (
                        <div className="absolute top-2 right-2 bg-amber-900/90 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          最佳熱門
                        </div>
                      )}

                      <div className="font-bold text-sm mb-1">{slot.time}</div>
                      {slot.label && (
                        <div className="text-xs opacity-90 mb-2 truncate">{slot.label}</div>
                      )}

                      {/* Participant numbers */}
                      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-current/20">
                        <span>
                          {stats.availableCount} / {totalParticipants} 人有空
                        </span>
                        {stats.ifNeededCount > 0 && (
                          <span className="opacity-90 text-[11px] font-normal">
                            ({stats.ifNeededCount} 視情況)
                          </span>
                        )}
                      </div>

                      {/* Attendee preview avatars / tags */}
                      {stats.availableNames.length > 0 && (
                        <div className="mt-2 text-[11px] opacity-90 truncate">
                          {stats.availableNames.join("、")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Details of WHO is available for clicked slot */}
      {selectedSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-slate-100 relative">
            <button
              onClick={() => setSelectedSlotModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="font-bold text-lg text-slate-900 mb-1 flex items-center gap-1.5">
              時段出席明細
              <BarChart3 className="w-4 h-4" />
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              {selectedSlotModal.slot.date} ({formatChineseWeekday(selectedSlotModal.slot.date)}) • {selectedSlotModal.slot.time}
            </p>

            <div className="space-y-4 text-sm">
              {/* Available list */}
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <div className="font-bold text-emerald-900 text-xs flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    確定有空 ({selectedSlotModal.availableCount} 人)
                  </span>
                </div>
                {selectedSlotModal.availableNames.length === 0 ? (
                  <p className="text-xs text-slate-400">目前尚無人填寫有空</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSlotModal.availableNames.map((name, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* If needed list */}
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <div className="font-bold text-amber-900 text-xs flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    視情況 / 需調整 ({selectedSlotModal.ifNeededCount} 人)
                  </span>
                </div>
                {selectedSlotModal.ifNeededNames.length === 0 ? (
                  <p className="text-xs text-slate-400">無</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSlotModal.ifNeededNames.map((name, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-semibold text-xs"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Unavailable list */}
              <div className="bg-rose-50 rounded-xl p-3 border border-rose-200">
                <div className="font-bold text-rose-900 text-xs flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    時間不行 ({selectedSlotModal.unavailableCount} 人)
                  </span>
                </div>
                {selectedSlotModal.unavailableNames.length === 0 ? (
                  <p className="text-xs text-slate-400">無</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSlotModal.unavailableNames.map((name, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-medium text-xs"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Host action shortcut if in host mode */}
            {isHost && onSelectSlotForFinalize && (
              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    onSelectSlotForFinalize(selectedSlotModal.slotId);
                    setSelectedSlotModal(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition inline-flex items-center justify-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  選擇此時段並去拍板定案
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
