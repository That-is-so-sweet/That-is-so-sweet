import React, { useState } from "react";
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  RotateCcw, 
  MessageCircle,
  ExternalLink,
  Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import { EventData } from "../types";
import { generateGoogleCalendarUrl, downloadIcsFile, formatChineseWeekday } from "../lib/calendar";

interface FinalizedViewProps {
  event: EventData;
  isHost?: boolean;
  onReopen?: () => Promise<void>;
  onCopySuccess: () => void;
}

export const FinalizedView: React.FC<FinalizedViewProps> = ({
  event,
  isHost,
  onReopen,
  onCopySuccess,
}) => {
  const [copiedText, setCopiedText] = useState(false);

  // Trigger celebratory confetti on load
  React.useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  }, []);

  const finalSlot = event.slots.find((s) => s.id === event.finalSlotId) || event.slots[0];

  // Attendee list
  const attendingNames = event.responses
    .filter((r) => r.availability[finalSlot.id] === "available")
    .map((r) => r.nickname);

  const conditionalNames = event.responses
    .filter((r) => r.availability[finalSlot.id] === "if_needed")
    .map((r) => r.nickname);

  const appOrigin = window.location.origin;
  const shareUrl = `${appOrigin}/#event=${event.id}`;

  const resultBroadcastText = `🎉【聚會時間正式敲定囉！】
活動名稱：${event.title}
主揪：${event.hostName || "熱心主揪"}
📅 聚會日期：${finalSlot.date} (${formatChineseWeekday(finalSlot.date)})
⏰ 聚會時間：${finalSlot.time}
${event.finalNote ? `💬 備註事項：${event.finalNote}\n` : ""}
👥 出席名單 (${attendingNames.length}人)：
${attendingNames.join("、") || "歡迎大家參與！"}

👇 活動詳情與加到日曆連結：
${shareUrl}`;

  const handleCopyBroadcast = async () => {
    try {
      await navigator.clipboard.writeText(resultBroadcastText);
      setCopiedText(true);
      onCopySuccess();
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      window.prompt("複製廣播文字：", resultBroadcastText);
    }
  };

  const handleOpenGCal = () => {
    const url = generateGoogleCalendarUrl(
      event.title,
      finalSlot.date,
      finalSlot.time,
      event.finalNote || event.description || "",
      `主揪：${event.hostName || ""}\n出席：${attendingNames.join(", ")}`
    );
    window.open(url, "_blank");
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(
      event.title,
      finalSlot.date,
      finalSlot.time,
      event.finalNote || event.description || "",
      `主揪：${event.hostName || ""}\n出席：${attendingNames.join(", ")}`
    );
  };

  const handleLineShareResult = () => {
    const encoded = encodeURIComponent(resultBroadcastText);
    window.open(`https://line.me/R/msg/text/?${encoded}`, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Big Confirmed Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              活動時間已敲定定案 🎯
            </div>

            {isHost && onReopen && (
              <button
                onClick={onReopen}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重新開放投票
              </button>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              {event.title}
            </h2>
            {event.hostName && (
              <p className="text-emerald-200 text-xs sm:text-sm">
                發起人：<span className="font-semibold text-white">{event.hostName}</span>
              </p>
            )}
          </div>

          {/* Time & Details Highlight Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-emerald-300 shrink-0" />
              <div>
                <div className="text-xs text-emerald-200 font-medium">聚會日期</div>
                <div className="text-xl sm:text-2xl font-bold">
                  {finalSlot.date} ({formatChineseWeekday(finalSlot.date)})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-emerald-300 shrink-0" />
              <div>
                <div className="text-xs text-emerald-200 font-medium">時段</div>
                <div className="text-lg font-bold">{finalSlot.time}</div>
              </div>
            </div>

            {event.finalNote && (
              <div className="pt-2 border-t border-white/10 text-xs text-emerald-100 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-200">主揪備註/地點：</span>
                  {event.finalNote}
                </div>
              </div>
            )}
          </div>

          {/* Add to Calendar Tools */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleOpenGCal}
              className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-white hover:bg-emerald-50 text-slate-900 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>加到 Google 日曆</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={handleDownloadIcs}
              className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>下載 .ics 行事曆</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attending Roster */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              出席名單 ({attendingNames.length} 人可參與)
            </h3>
          </div>
        </div>

        {attendingNames.length === 0 ? (
          <p className="text-xs text-slate-500">尚無標示為確定出席的名單</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attendingNames.map((name, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {name}
              </span>
            ))}
          </div>
        )}

        {conditionalNames.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-500 mb-1.5">
              視情況 / 彈性人員：
            </div>
            <div className="flex flex-wrap gap-2">
              {conditionalNames.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LINE Broadcast Text Generator & Copy Box */}
      <div className="bg-emerald-50/80 rounded-2xl p-6 border border-emerald-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            一鍵複製聚會敲定通知（貼回 LINE 群組）
          </h4>

          <button
            onClick={handleLineShareResult}
            className="px-3 py-1.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
          >
            直接開啟 LINE 📲
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed shadow-inner">
          {resultBroadcastText}
        </div>

        <button
          onClick={handleCopyBroadcast}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
        >
          {copiedText ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>廣播文字已成功複製！</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>一鍵複製定案通知內容</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
