import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { CreateEvent } from "./components/CreateEvent";
import { EventView } from "./components/EventView";
import { ShareModal } from "./components/ShareModal";
import { MyEventsModal } from "./components/MyEventsModal";
import { Toast } from "./components/Toast";
import { MobileApp } from "./mobile/MobileApp";
import { useViewport } from "./lib/useViewport";
import {
  EventData,
  CreateEventInput,
  SubmitResponseInput,
  ToastMessage,
} from "./types";
import {
  fetchEvent,
  createEvent,
  submitResponse,
  finalizeEvent,
  reopenEvent,
  getHostToken,
  getVisitedEvents,
  VisitedEventItem
} from "./lib/api";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function App() {
  const { isMobile } = useViewport();
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentHostToken, setCurrentHostToken] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Modals & Toasts
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [historyList, setHistoryList] = useState<VisitedEventItem[]>([]);

  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to parse URL hash parameters e.g. #event=xxx&hostToken=yyy
  const parseHashParams = () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const eventId = params.get("event");
    const token = params.get("hostToken");
    return { eventId, token };
  };

  const loadEvent = async (id: string, tokenParam?: string) => {
    setIsLoading(true);
    setPageError(null);
    try {
      // Priority: tokenParam -> LocalStorage token
      const storedToken = getHostToken(id);
      const effectiveToken = tokenParam || storedToken || undefined;

      const data = await fetchEvent(id, effectiveToken);
      setEventData(data);
      setCurrentEventId(id);
      setCurrentHostToken(effectiveToken || null);
    } catch (err: any) {
      setPageError(err.message || "載入活動失敗");
      setEventData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // On mount and on hash change
  useEffect(() => {
    const handleHashChange = () => {
      const { eventId, token } = parseHashParams();
      if (eventId) {
        loadEvent(eventId, token || undefined);
      } else {
        // No event in hash -> show create event form
        setCurrentEventId(null);
        setEventData(null);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update history list whenever modal opens
  useEffect(() => {
    if (isHistoryOpen) {
      setHistoryList(getVisitedEvents());
    }
  }, [isHistoryOpen]);

  // Handlers
  const handleCreateEvent = async (input: CreateEventInput) => {
    setIsLoading(true);
    try {
      const result = await createEvent(input);
      setEventData(result.event);
      setCurrentEventId(result.event.id);
      setCurrentHostToken(result.hostToken);

      // Update URL hash without full reload
      window.location.hash = `event=${result.event.id}&hostToken=${result.hostToken}`;

      addToast("success", "活動成功建立！專屬連結已產生");
      setIsShareModalOpen(true);
    } catch (err: any) {
      addToast("error", err.message || "建立活動失敗，請重試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (input: SubmitResponseInput) => {
    if (!currentEventId) return;
    setIsLoading(true);
    try {
      const updated = await submitResponse(currentEventId, input);
      setEventData(updated);
      addToast("success", "您的時間已成功記錄與更新！");
    } catch (err: any) {
      addToast("error", err.message || "送出時間失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async (finalSlotId: string, finalNote?: string) => {
    if (!currentEventId || !currentHostToken) return;
    setIsLoading(true);
    try {
      const updated = await finalizeEvent(currentEventId, {
        hostToken: currentHostToken,
        finalSlotId,
        finalNote,
      });
      setEventData(updated);
      addToast("success", "聚會時間已拍板定案！結果已發布");
    } catch (err: any) {
      addToast("error", err.message || "拍板定案失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!currentEventId || !currentHostToken) return;
    setIsLoading(true);
    try {
      const updated = await reopenEvent(currentEventId, currentHostToken);
      setEventData(updated);
      addToast("info", "活動已重新開放投票統計");
    } catch (err: any) {
      addToast("error", err.message || "重新開放失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResponse = async (participantId: string) => {
    if (!currentEventId) return;
    if (!window.confirm("確定要刪除這筆填寫紀錄嗎？")) return;

    setIsLoading(true);
    try {
      const token = currentHostToken || undefined;
      const res = await fetch(
        `/api/events/${currentEventId}/responses/${participantId}${
          token ? `?hostToken=${token}` : ""
        }`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("刪除失敗");
      const data = await res.json();
      setEventData(data.event);
      addToast("info", "已刪除該填寫紀錄");
    } catch (err: any) {
      addToast("error", err.message || "刪除失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => {
    window.location.hash = "";
    setCurrentEventId(null);
    setEventData(null);
  };

  const handleLoadDemo = () => {
    window.location.hash = "event=demo-gathering";
  };

  if (isMobile) {
    return (
      <MobileApp
        currentEventId={currentEventId}
        eventData={eventData}
        currentHostToken={currentHostToken}
        isLoading={isLoading}
        pageError={pageError}
        onGoHome={handleGoHome}
        onCreateEvent={handleCreateEvent}
        onRespond={handleRespond}
        onFinalize={handleFinalize}
        onReopen={handleReopen}
        onDeleteResponse={handleDeleteResponse}
        isShareModalOpen={isShareModalOpen}
        setIsShareModalOpen={setIsShareModalOpen}
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        historyList={historyList}
        onSelectEvent={(id) => {
          window.location.hash = `event=${id}`;
        }}
        onLoadDemo={handleLoadDemo}
        onCopySuccess={() => addToast("success", "已成功複製到剪貼簿！")}
        toasts={toasts}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col antialiased selection:bg-amber-200 selection:text-amber-900">
      {/* Top Header */}
      <Header
        onNewEvent={handleGoHome}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onLoadDemo={handleLoadDemo}
        activeEventTitle={eventData?.title}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoading && !eventData && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">正在載入活動內容...</p>
          </div>
        )}

        {pageError && (
          <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-rose-200 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">讀取失敗</h3>
            <p className="text-xs text-slate-500">{pageError}</p>
            <button
              onClick={handleGoHome}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-md"
            >
              返回建立新活動
            </button>
          </div>
        )}

        {!isLoading && !pageError && !currentEventId && (
          <CreateEvent onSubmit={handleCreateEvent} isLoading={isLoading} />
        )}

        {!pageError && currentEventId && eventData && (
          <EventView
            event={eventData}
            hostToken={currentHostToken || undefined}
            onRespond={handleRespond}
            onFinalize={handleFinalize}
            onReopen={handleReopen}
            onDeleteResponse={handleDeleteResponse}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onCopySuccess={() => addToast("success", "已成功複製到剪貼簿！")}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-6 text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-700">
          聚會時間協調神器 • 免註冊免登入 • 快速搞定朋友聚餐
        </p>
        <p className="text-[11px] text-slate-400">
          支援跨裝置熱點圖、LINE 群組廣播與 Google 日曆匯出
        </p>
      </footer>

      {/* Share Modal */}
      {eventData && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          event={eventData}
          hostToken={currentHostToken || undefined}
          onCopySuccess={() => addToast("success", "已成功複製連結！")}
        />
      )}

      {/* My Events Modal */}
      <MyEventsModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        eventsList={historyList}
        onSelectEvent={(id) => {
          window.location.hash = `event=${id}`;
        }}
        onLoadDemo={handleLoadDemo}
      />

      {/* Floating Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
