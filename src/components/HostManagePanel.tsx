import React, { useState } from "react";
import { Crown, CheckCircle2, AlertTriangle, Sparkles, Send, Lock } from "lucide-react";
import { TimeSlot, EventData } from "../types";
import { formatChineseWeekday } from "../lib/calendar";

interface HostManagePanelProps {
  event: EventData;
  hostToken: string;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  isLoading: boolean;
  preSelectedSlotId?: string;
}

export const HostManagePanel: React.FC<HostManagePanelProps> = ({
  event,
  hostToken,
  onFinalize,
  isLoading,
  preSelectedSlotId,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    preSelectedSlotId || event.slots[0]?.id || ""
  );
  const [finalNote, setFinalNote] = useState<string>(
    event.description ? `地點/備註：${event.description}` : ""
  );
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const chosenSlot = event.slots.find((s) => s.id === selectedSlotId);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;
    setShowConfirmModal(true);
  };

  const handleExecuteFinalize = async () => {
    setShowConfirmModal(false);
    await onFinalize(selectedSlotId, finalNote);
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-2xl p-6 border-2 border-amber-300 shadow-md space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              主揪拍板定案控制台
            </h3>
            <p className="text-xs text-amber-800">
              參考下方統計，選擇最佳時間並一鍵發布結果
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs">
          👑 權限已驗證
        </span>
      </div>

      <form onSubmit={handleOpenConfirm} className="space-y-4">
        {/* Slot selector radio group */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2">
            請選擇聚會最終確定時段：
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {event.slots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              // Count available
              const freeCount = event.responses.filter(
                (r) => r.availability[slot.id] === "available"
              ).length;

              return (
                <label
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                      : "bg-white border-slate-200 hover:border-amber-300 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="finalSlot"
                      checked={isSelected}
                      onChange={() => setSelectedSlotId(slot.id)}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-sm">
                        {slot.date} ({formatChineseWeekday(slot.date)}) • {slot.time}
                      </div>
                      {slot.label && (
                        <div
                          className={`text-xs mt-0.5 ${
                            isSelected ? "text-amber-100" : "text-slate-500"
                          }`}
                        >
                          {slot.label}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {freeCount} 人出席
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Note / Announcement message */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            定案給大家的備註訊息 <span className="text-slate-400 font-normal">(選填，如地點、注意事項)</span>
          </label>
          <input
            type="text"
            value={finalNote}
            onChange={(e) => setFinalNote(e.target.value)}
            placeholder="例如：訂位名義阿傑，大家 18:00 中山捷運站出口集合！"
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-xs font-medium"
          />
        </div>

        {/* Finalize Button */}
        <button
          type="submit"
          disabled={isLoading || !selectedSlotId}
          className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>確認最終時間並定案 🔒</span>
        </button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h4 className="font-bold text-lg text-slate-900 mb-2">
              確認要將此時段拍板定案嗎？
            </h4>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 my-3">
              <div className="font-bold text-sm">
                📅 {chosenSlot?.date} ({formatChineseWeekday(chosenSlot?.date || "")})
              </div>
              <div className="font-semibold text-amber-950">
                ⏰ {chosenSlot?.time}
              </div>
              {finalNote && <div className="text-slate-600 pt-1">💬 {finalNote}</div>}
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              ⚠️ 定案後，活動頁面將轉為「已拍板通知模式」，暫停開放新投票。所有點進此連結的朋友皆會看到此最終聚會時間。
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                返回修改
              </button>
              <button
                type="button"
                onClick={handleExecuteFinalize}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-sm"
              >
                拍板確定！🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
