import { EventData } from "../types.js";

const DAY_MS = 86400000;
const EXPIRE_AFTER_DAYS = 7;

// Local YYYY-MM-DDTHH:mm string (in the browser's local timezone) suitable for
// <input type="datetime-local">, defaulting to "now + 7 days".
export function getDefaultDeadlineLocalValue(): string {
  const d = new Date(Date.now() + 7 * DAY_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Same shape, but for "now" — used as the `min` attribute on the picker.
export function getNowLocalValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isoToLocalValue(iso: string): string {
  if (!iso) return getDefaultDeadlineLocalValue();
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localValueToIso(value: string): string {
  return new Date(value).toISOString();
}

export function isVotingOpen(event: Pick<EventData, "status" | "responseDeadline">): boolean {
  if (event.status !== "active") return false;
  if (!event.responseDeadline) return true;
  return Date.now() <= new Date(event.responseDeadline).getTime();
}

// Comments stay open for the whole lifetime of the link — active, voting
// closed, or finalized — they only stop once the link itself expires.
export function canComment(event: Pick<EventData, "status" | "finalSlotId" | "slots">): boolean {
  return !isLinkExpired(event);
}

function dateOnlyDiffDays(dateStr: string): number {
  // Whole calendar days between "today" and dateStr (positive = dateStr is in the past).
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const a = new Date(`${todayStr}T00:00:00`);
  const b = new Date(`${dateStr}T00:00:00`);
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

export function getMeetupEndInfoFromDate(status: EventData["status"] | undefined, finalSlotDate: string | undefined): { hasEnded: boolean; daysSinceEnded: number } | null {
  if (status !== "finalized" || !finalSlotDate) return null;
  const daysSinceEnded = dateOnlyDiffDays(finalSlotDate);
  return { hasEnded: daysSinceEnded > 0, daysSinceEnded };
}

export function getMeetupEndInfo(event: Pick<EventData, "status" | "finalSlotId" | "slots">): { hasEnded: boolean; daysSinceEnded: number } | null {
  if (event.status !== "finalized" || !event.finalSlotId) return null;
  const slot = event.slots.find((s) => s.id === event.finalSlotId);
  if (!slot) return null;
  return getMeetupEndInfoFromDate(event.status, slot.date);
}

export function isLinkExpired(event: Pick<EventData, "status" | "finalSlotId" | "slots">): boolean {
  const info = getMeetupEndInfo(event);
  return !!info && info.daysSinceEnded > EXPIRE_AFTER_DAYS;
}

export type LifecycleKey = "collecting" | "voting_closed" | "finalized_upcoming" | "finalized_ended" | "cancelled";

export interface LifecycleStatus {
  key: LifecycleKey;
  label: string;
  sublabel: "尚未投完" | "已投完" | "已取消";
  color: string;
}

export function getLifecycleStatusCore(status: EventData["status"] | undefined, responseDeadline: string | undefined, finalSlotDate: string | undefined): LifecycleStatus {
  if (status === "cancelled") {
    return { key: "cancelled", label: "活動已取消", sublabel: "已取消", color: "var(--color-error)" };
  }
  if (status === "finalized") {
    const info = getMeetupEndInfoFromDate(status, finalSlotDate);
    if (info?.hasEnded) {
      return { key: "finalized_ended", label: "活動已結束", sublabel: "已投完", color: "var(--color-muted)" };
    }
    return { key: "finalized_upcoming", label: "已敲定，待舉辦", sublabel: "已投完", color: "var(--color-primary)" };
  }
  if (!isVotingOpen({ status: status || "active", responseDeadline: responseDeadline || "" })) {
    return { key: "voting_closed", label: "投票已截止", sublabel: "已投完", color: "var(--color-hot)" };
  }
  return { key: "collecting", label: "統計時間中", sublabel: "尚未投完", color: "var(--color-success)" };
}

export function getLifecycleStatus(event: Pick<EventData, "status" | "responseDeadline" | "finalSlotId" | "slots">): LifecycleStatus {
  const slot = event.finalSlotId ? event.slots.find((s) => s.id === event.finalSlotId) : undefined;
  return getLifecycleStatusCore(event.status, event.responseDeadline, slot?.date);
}

// Lightweight variant for history-list snapshots that only stored the
// resolved final-slot date (see VisitedEventItem), not the full slots array.
export function getLifecycleStatusFromSnapshot(snapshot: { status?: EventData["status"]; responseDeadline?: string; finalSlotDate?: string }): LifecycleStatus {
  return getLifecycleStatusCore(snapshot.status, snapshot.responseDeadline, snapshot.finalSlotDate);
}

export function formatDeadline(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getMonth() + 1}/${d.getDate()} (週${weekdays[d.getDay()]}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatCommentDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatRemaining(iso: string): string {
  if (!iso) return "";
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "已截止";
  const days = Math.floor(diffMs / DAY_MS);
  const hours = Math.floor((diffMs % DAY_MS) / 3600000);
  if (days > 0) return `剩餘 ${days} 天`;
  if (hours > 0) return `剩餘 ${hours} 小時`;
  return "剩餘不到 1 小時";
}
