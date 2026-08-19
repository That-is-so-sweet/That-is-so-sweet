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

  // Tracks an eventId whose data was just set directly in state (e.g. right
  // after creation), so the hashchange this triggers doesn't re-fetch it.
  const skipNextHashLoadRef = React.useRef<string | null>(null);

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
        // Skip re-fetching an event whose data we just set locally
        // (e.g. right after creating it) — the hash update below still
        // fires this listener, and a redundant fetch that happens to
        // fail would otherwise wipe out the data we already have.
        if (skipNextHashLoadRef.current === eventId) {
          skipNextHashLoadRef.current = null;
          return;
        }
        loadEvent(eventId, token || undefined);
      } else {
        // No event in hash -> show create event form
        setPageError(null);
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

      // Update URL hash without full reload. We already have the event data
      // in state, so tell the hashchange listener to skip its redundant fetch.
      skipNextHashLoadRef.current = result.event.id;
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

  const handleGoHome = () => {
    window.location.hash = "";
    setPageError(null);
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
    <div style={{ minHeight: "100vh", background: "var(--color-cream)", color: "var(--color-ink)", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column" }}>
      {/* Top Header */}
      <Header
        onNewEvent={handleGoHome}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onLoadDemo={handleLoadDemo}
        activeEventTitle={eventData?.title}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {isLoading && !eventData && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12, color: "var(--color-muted)" }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: "var(--color-primary)" }} />
            <p style={{ fontSize: 13, fontWeight: 700 }}>正在載入活動內容...</p>
          </div>
        )}

        {pageError && (
          <div style={{ maxWidth: 420, margin: "48px auto", padding: 24, background: "var(--color-surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-hot-subtle)", color: "var(--color-hot)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ fontWeight: 900, fontFamily: "var(--font-display)", fontSize: 17, color: "var(--color-ink)", marginBottom: 6 }}>讀取失敗</h3>
            <p style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 16 }}>{pageError}</p>
            <button
              onClick={handleGoHome}
              style={{ padding: "10px 20px", borderRadius: "var(--radius-pill)", border: "none", background: "var(--color-ink)", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}
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
            onNewEvent={handleGoHome}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onCopySuccess={() => addToast("success", "已成功複製到剪貼簿！")}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface)", padding: "20px 0", textAlign: "center", fontSize: 11, color: "var(--color-muted)" }}>
        <p style={{ fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
          聚會時間協調神器 • 免註冊免登入 • 快速搞定朋友聚餐
        </p>
        <p style={{ marginTop: 4, margin: 0 }}>
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
