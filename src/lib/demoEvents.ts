import { peekEvent } from "./localEventStore.js";
import { getLifecycleStatus, isLinkExpired } from "./eventStatus.js";

export interface DemoEventInfo {
  id: string;
  label: string;
  desc: string;
  /** When set, loading this demo also supplies the event's real hostToken, so the app resolves the viewer as the host — lets a scenario be demoed from both the participant and host perspective. */
  hostToken?: string;
}

export interface DemoEventBadge {
  label: string;
  variant: "success" | "hot" | "muted";
}

// Mirrors the badge shown in "我揪的團" (see HostDashboard/HostHome/HistoryModal),
// but reads straight off the seeded demo record so the badge always reflects
// that demo's actual current lifecycle instead of a hand-written guess.
export function getDemoEventBadge(id: string): DemoEventBadge | undefined {
  const event = peekEvent(id);
  if (!event) return undefined;
  if (isLinkExpired(event)) {
    return { label: "連結已失效", variant: "hot" };
  }
  const lifecycle = getLifecycleStatus(event);
  const variant = lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted";
  return { label: lifecycle.label, variant };
}

// Fixed set of seeded scenarios (see localEventStore.ts's seedDemoEvents) so
// people can jump straight into any lifecycle state without creating it first.
export const DEMO_EVENTS: DemoEventInfo[] = [
  { id: "demo-gathering", label: "進行中・含時段", desc: "多個候選時段，正在收集投票" },
  { id: "demo-date-only", label: "進行中・僅選日期", desc: "簡化模式：參與者只需勾選日期" },
  { id: "demo-voting-closed", label: "投票已截止・尚未定案", desc: "截止時間已過，主揪尚未拍板" },
  { id: "demo-voting-closed", label: "投票已截止・尚未定案（主揪視角）", desc: "以主揪身份查看，可直接挑選時段拍板定案", hostToken: "demo-host-token-closed" },
  { id: "demo-finalized-upcoming", label: "已敲定・尚未舉辦", desc: "時間已定案，活動尚未開始" },
  { id: "demo-finalized-upcoming", label: "已敲定・尚未舉辦（主揪視角）", desc: "以主揪身份查看，可重新開放投票或取消活動", hostToken: "demo-host-token-upcoming" },
  { id: "demo-finalized-ended", label: "活動已結束（3 天前）", desc: "活動已結束，連結 4 天後將失效" },
  { id: "demo-expired-link", label: "連結已失效範例", desc: "活動結束超過 7 天，示範失效畫面" },
  { id: "demo-cancelled", label: "主揪已取消範例", desc: "主揪臨時取消活動，示範取消畫面" },
];
