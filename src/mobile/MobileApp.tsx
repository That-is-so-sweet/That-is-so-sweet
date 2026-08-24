import React from "react";
import { EventData, CreateEventInput, SubmitResponseInput, SubmitCommentInput, UpdateEventInput, ToastMessage } from "../types";
import { VisitedEventItem } from "../lib/api";
import { CreateWizard } from "./CreateWizard";
import { EventScreen } from "./EventScreen";
import { ShareModal } from "./ShareModal";
import { HistoryModal } from "./HistoryModal";
import { Toast } from "./Toast";

interface MobileAppProps {
  currentEventId: string | null;
  eventData: EventData | null;
  currentHostToken: string | null;
  initialTab: "vote" | "heatmap" | null;
  isLoading: boolean;
  pageError: string | null;
  onGoHome: () => void;
  onCreateEvent: (input: CreateEventInput) => Promise<void>;
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: (newDeadline?: string) => Promise<void>;
  onCancelEvent: () => Promise<void>;
  onUpdateEvent?: (input: Omit<UpdateEventInput, "hostToken">) => Promise<void>;
  onSubmitComment: (input: SubmitCommentInput) => Promise<void>;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  historyList: VisitedEventItem[];
  onSelectEvent: (id: string) => void;
  onLoadDemo: (id: string) => void;
  onCopySuccess: () => void;
  toasts: ToastMessage[];
}

export const MobileApp: React.FC<MobileAppProps> = ({
  currentEventId,
  eventData,
  currentHostToken,
  initialTab,
  isLoading,
  pageError,
  onGoHome,
  onCreateEvent,
  onRespond,
  onFinalize,
  onReopen,
  onCancelEvent,
  onUpdateEvent,
  onSubmitComment,
  isShareModalOpen,
  setIsShareModalOpen,
  isHistoryOpen,
  setIsHistoryOpen,
  historyList,
  onSelectEvent,
  onLoadDemo,
  onCopySuccess,
  toasts,
}) => {
  const isHost = Boolean(eventData && currentHostToken && currentHostToken === eventData.hostToken);

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", background: "#EAE0CC", fontFamily: "var(--font-body)" }}>
      <div
        id="app"
        style={{
          width: 390,
          minHeight: "100dvh",
          maxHeight: "100dvh",
          overflow: "hidden",
          background: "var(--color-cream)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {isLoading && !eventData && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--color-muted)" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>正在載入活動內容...</div>
          </div>
        )}

        {pageError && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--color-ink)" }}>讀取失敗</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{pageError}</div>
            <button
              onClick={onGoHome}
              style={{ padding: "10px 20px", borderRadius: "var(--radius-pill)", border: "none", background: "var(--color-ink)", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}
            >
              返回建立新活動
            </button>
          </div>
        )}

        {!isLoading && !pageError && !currentEventId && (
          <CreateWizard onSubmit={onCreateEvent} isLoading={isLoading} onOpenHistory={() => setIsHistoryOpen(true)} />
        )}

        {!pageError && currentEventId && eventData && (
          <EventScreen
            event={eventData}
            isHost={isHost}
            initialTab={initialTab || undefined}
            onRespond={onRespond}
            onFinalize={onFinalize}
            onReopen={onReopen}
            onCancelEvent={onCancelEvent}
            onUpdateEvent={onUpdateEvent}
            onSubmitComment={onSubmitComment}
            onNewEvent={onGoHome}
            onOpenShare={() => setIsShareModalOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onCopySuccess={onCopySuccess}
            isLoading={isLoading}
          />
        )}

        {isShareModalOpen && eventData && (
          <ShareModal event={eventData} hostToken={currentHostToken || undefined} onClose={() => setIsShareModalOpen(false)} onCopySuccess={onCopySuccess} />
        )}

        {isHistoryOpen && (
          <HistoryModal onClose={() => setIsHistoryOpen(false)} eventsList={historyList} onSelectEvent={onSelectEvent} onLoadDemo={onLoadDemo} />
        )}

        <Toast items={toasts} />
      </div>
    </div>
  );
};
