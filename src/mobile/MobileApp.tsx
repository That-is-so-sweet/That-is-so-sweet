import React from "react";
import { EventData, CreateEventInput, SubmitResponseInput, SubmitCommentInput, UpdateEventInput, AiSelectedRestaurant, ToastMessage } from "../types";
import { VisitedEventItem } from "../lib/api";
import { CreateWizard } from "./CreateWizard";
import { EventScreen } from "./EventScreen";
import { ShareModal } from "./ShareModal";
import { HistoryModal } from "./HistoryModal";
import { Toast } from "./Toast";
import { LoginScreen } from "./LoginScreen";
import { HostHome } from "./HostHome";
import { GoogleLoginOverlay } from "./GoogleLoginOverlay";
import { FakeUser } from "../lib/fakeAuth";

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
  onSelectAiRestaurant: (restaurant: AiSelectedRestaurant) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  historyList: VisitedEventItem[];
  onSelectEvent: (id: string) => void;
  onLoadDemo: (id: string, hostToken?: string) => void;
  onCopySuccess: () => void;
  toasts: ToastMessage[];
  user: FakeUser | null;
  isAuthenticating: boolean;
  onLogin: () => void;
  onLogout: () => void;
  homeView: "dashboard" | "create";
  onOpenCreate: () => void;
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
  onSelectAiRestaurant,
  isShareModalOpen,
  setIsShareModalOpen,
  isHistoryOpen,
  setIsHistoryOpen,
  historyList,
  onSelectEvent,
  onLoadDemo,
  onCopySuccess,
  toasts,
  user,
  isAuthenticating,
  onLogin,
  onLogout,
  homeView,
  onOpenCreate,
}) => {
  // Host identity is only honored while "logged in" — logging out strips
  // host-only UI immediately even on an event page already open, without
  // touching the stored per-event hostToken (logging back in restores it).
  const effectiveHostToken = user ? currentHostToken : null;
  const isHost = Boolean(eventData && effectiveHostToken && effectiveHostToken === eventData.hostToken);

  return (
    <div style={{ height: "100dvh", overflow: "hidden", overscrollBehavior: "none", display: "flex", justifyContent: "center", background: "#EAE0CC", fontFamily: "var(--font-body)" }}>
      <div
        id="app"
        style={{
          width: 390,
          height: "100dvh",
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
          !user ? (
            <LoginScreen onLogin={onLogin} />
          ) : homeView === "create" ? (
            <CreateWizard onSubmit={onCreateEvent} isLoading={isLoading} onOpenHistory={() => setIsHistoryOpen(true)} hostEmail={user.email} />
          ) : (
            <HostHome
              user={user}
              onLogout={onLogout}
              events={historyList}
              onCreateEvent={onOpenCreate}
              onSelectEvent={onSelectEvent}
              onLoadDemo={onLoadDemo}
            />
          )
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
            onSelectAiRestaurant={onSelectAiRestaurant}
            onNewEvent={onGoHome}
            onOpenShare={() => setIsShareModalOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onCopySuccess={onCopySuccess}
            isLoading={isLoading}
          />
        )}

        {isShareModalOpen && eventData && (
          <ShareModal event={eventData} hostToken={effectiveHostToken || undefined} onClose={() => setIsShareModalOpen(false)} onCopySuccess={onCopySuccess} />
        )}

        {isHistoryOpen && (
          <HistoryModal onClose={() => setIsHistoryOpen(false)} eventsList={historyList} onSelectEvent={onSelectEvent} onLoadDemo={onLoadDemo} />
        )}

        <Toast items={toasts} />

        {isAuthenticating && <GoogleLoginOverlay />}
      </div>
    </div>
  );
};
