import React from "react";
import { History, X, ChevronRight, Crown, Calendar, Sparkles } from "lucide-react";
import { VisitedEventItem } from "../lib/api";

interface MyEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventsList: VisitedEventItem[];
  onSelectEvent: (id: string) => void;
  onLoadDemo: () => void;
}

export const MyEventsModal: React.FC<MyEventsModalProps> = ({
  isOpen,
  onClose,
  eventsList,
  onSelectEvent,
  onLoadDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <History className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-lg text-slate-900">我的聚會紀錄</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {eventsList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p>目前尚無紀錄，點擊「發起活動」開始吧！</p>
            </div>
          ) : (
            eventsList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectEvent(item.id);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-amber-700">
                      {item.title}
                    </span>
                    {item.isHost && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 text-amber-600" /> 主揪
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    上次查看：{new Date(item.updatedAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 mt-2 flex gap-2">
          <button
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            載入體驗示範活動
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
