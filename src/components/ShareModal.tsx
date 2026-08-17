import React, { useState } from "react";
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Share2, 
  X, 
  ExternalLink, 
  Crown,
  MessageCircle,
  QrCode
} from "lucide-react";
import { EventData } from "../types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData;
  hostToken?: string;
  onCopySuccess: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  event,
  hostToken,
  onCopySuccess,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedLineMsg, setCopiedLineMsg] = useState(false);

  if (!isOpen) return null;

  const appOrigin = window.location.origin;
  const shareUrl = `${appOrigin}/#event=${event.id}`;
  const hostUrl = hostToken ? `${appOrigin}/#event=${event.id}&hostToken=${hostToken}` : shareUrl;

  const lineMessageText = `📢【${event.title}】聚會時間調查邀請！
主揪：${event.hostName || "熱心朋友"}
${event.description ? `說明：${event.description}\n` : ""}
不用註冊登入，點擊連結即可選擇你有空的時間：
👇 直接填寫連結 👇
${shareUrl}`;

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onCopySuccess();
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback prompt
      window.prompt("複製活動連結：", shareUrl);
    }
  };

  const handleCopyLineText = async () => {
    try {
      await navigator.clipboard.writeText(lineMessageText);
      setCopiedLineMsg(true);
      onCopySuccess();
      setTimeout(() => setCopiedLineMsg(false), 2500);
    } catch {
      window.prompt("複製廣播文字：", lineMessageText);
    }
  };

  const handleLineShareDirect = () => {
    const encodedText = encodeURIComponent(lineMessageText);
    const lineUrl = `https://line.me/R/msg/text/?${encodedText}`;
    window.open(lineUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Banner */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            活動建立成功！🎉
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            活動名稱：<span className="font-semibold text-slate-800">{event.title}</span>
          </p>
        </div>

        {/* Action 1: LINE Share Button */}
        <div className="space-y-4">
          <button
            onClick={handleLineShareDirect}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-95"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>一鍵分享到 LINE 群組 📲</span>
          </button>

          {/* Action 2: Copy URL */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              專屬參與者填寫連結
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopyShareUrl}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>一鍵複製</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action 3: Copy Full LINE Text */}
          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">
                預設 LINE 群組廣播文範本
              </span>
              <button
                onClick={handleCopyLineText}
                className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
              >
                {copiedLineMsg ? "已複製廣播文！" : "複製整段文字"}
              </button>
            </div>
            <p className="text-[11px] text-amber-900/80 bg-white/80 p-3 rounded-xl font-mono leading-relaxed whitespace-pre-line border border-amber-200/50">
              {lineMessageText}
            </p>
          </div>

          {/* Host Management Note */}
          {hostToken && (
            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5">
              <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">主揪專屬權限：</span>
                此瀏覽器已自動儲存您為主揪。更換裝置時可使用含有主揪密鑰的管理網址來管理此活動。
              </div>
            </div>
          )}
        </div>

        {/* Bottom Enter Event Button */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition"
          >
            進入活動統計頁面 ➡️
          </button>
        </div>
      </div>
    </div>
  );
};
