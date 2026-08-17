import React from "react";
import { CalendarHeart, PlusCircle, History, Sparkles } from "lucide-react";

interface HeaderProps {
  onNewEvent: () => void;
  onOpenHistory: () => void;
  onLoadDemo: () => void;
  activeEventTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onNewEvent,
  onOpenHistory,
  onLoadDemo,
  activeEventTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand logo & Title */}
        <div 
          onClick={onNewEvent}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <CalendarHeart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 tracking-tight text-lg leading-none">
                聚會時間協調神器
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                免登入
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5 hidden sm:block">
              熱點圖即時彙整 • 一鍵 LINE 分享
            </p>
          </div>
        </div>

        {/* Current Active Event Banner or Navigation */}
        {activeEventTitle && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-700 text-xs max-w-xs truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-medium text-slate-500 shrink-0">正在瀏覽：</span>
            <span className="font-semibold truncate">{activeEventTitle}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadDemo}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition"
            title="查看範例活動體驗功能"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            體驗示範
          </button>

          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
            title="查看瀏覽或建立過的活動紀錄"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">我的聚會</span>
          </button>

          <button
            onClick={onNewEvent}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>發起活動</span>
          </button>
        </div>
      </div>
    </header>
  );
};
