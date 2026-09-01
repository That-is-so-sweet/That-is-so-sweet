import {
  EventData,
  CreateEventInput,
  SubmitResponseInput,
  FinalizeEventInput,
  SubmitCommentInput,
  UpdateEventInput,
  EventMode,
} from "../types.js";
import * as store from "./localEventStore.js";
import { isOlderThanDays } from "./eventStatus.js";

const LOCAL_HOST_TOKENS_KEY = "gathertime_host_tokens"; // { [eventId]: hostToken }
const LOCAL_USER_NICKNAME_KEY = "gathertime_user_nickname";
const LOCAL_USER_EMAIL_KEY = "gathertime_user_email";
const LOCAL_MY_EVENTS_KEY = "gathertime_my_events"; // Array of event IDs visited or created
const LOCAL_RECENT_SLOT_PRESETS_KEY = "gathertime_recent_slot_presets"; // Array of { start, label } from the last created event

// Everything below reads/writes this browser's localStorage only (see
// ./localEventStore.ts) — there is no server, so nothing here syncs across
// devices. Kept as async functions so callers don't need to change.

export async function fetchEvent(id: string, hostToken?: string): Promise<EventData & { isHost?: boolean }> {
  const data = store.getEvent(id, hostToken);
  saveVisitedEvent(data);
  return data;
}

export async function createEvent(input: CreateEventInput): Promise<{ event: EventData; hostToken: string }> {
  const data = store.createEvent(input);
  saveHostToken(data.event.id, data.hostToken);
  saveVisitedEvent(data.event);
  return data;
}

export async function submitResponse(eventId: string, input: SubmitResponseInput): Promise<EventData> {
  const data = store.submitResponse(eventId, input);
  if (input.nickname) saveUserNickname(input.nickname);
  if (input.email) saveUserEmail(input.email);
  saveVisitedEvent(data.event);
  return data.event;
}

export async function finalizeEvent(eventId: string, input: FinalizeEventInput): Promise<EventData> {
  const event = store.finalizeEvent(eventId, input);
  saveVisitedEvent(event);
  return event;
}

export async function submitComment(eventId: string, input: SubmitCommentInput): Promise<EventData> {
  const event = store.submitComment(eventId, input);
  if (input.nickname) saveUserNickname(input.nickname);
  saveVisitedEvent(event);
  return event;
}

export async function cancelEvent(eventId: string, hostToken: string): Promise<EventData> {
  const event = store.cancelEvent(eventId, hostToken);
  saveVisitedEvent(event);
  return event;
}

export async function reopenEvent(eventId: string, hostToken: string, responseDeadline?: string): Promise<EventData> {
  const event = store.reopenEvent(eventId, hostToken, responseDeadline);
  saveVisitedEvent(event);
  return event;
}

export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<EventData> {
  const event = store.updateEvent(eventId, input);
  saveVisitedEvent(event);
  return event;
}

// --- LOCAL STORAGE HELPERS --- //

export function getHostToken(eventId: string): string | null {
  try {
    const raw = localStorage.getItem(LOCAL_HOST_TOKENS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[eventId] || null;
  } catch {
    return null;
  }
}

export function saveHostToken(eventId: string, hostToken: string) {
  try {
    const raw = localStorage.getItem(LOCAL_HOST_TOKENS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[eventId] = hostToken;
    localStorage.setItem(LOCAL_HOST_TOKENS_KEY, JSON.stringify(map));
  } catch (err) {
    console.error("Failed to save host token:", err);
  }
}

export function getUserNickname(): string {
  try {
    return localStorage.getItem(LOCAL_USER_NICKNAME_KEY) || "";
  } catch {
    return "";
  }
}

export function saveUserNickname(nickname: string) {
  try {
    localStorage.setItem(LOCAL_USER_NICKNAME_KEY, nickname);
  } catch {}
}

export function getUserEmail(): string {
  try {
    return localStorage.getItem(LOCAL_USER_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

export function saveUserEmail(email: string) {
  try {
    localStorage.setItem(LOCAL_USER_EMAIL_KEY, email);
  } catch {}
}

export interface VisitedEventItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isHost: boolean;
  mode?: EventMode;
  status?: EventData["status"];
  responseDeadline?: string;
  finalSlotDate?: string;
}

// Accepts either a full event snapshot (preferred — lets the history list show
// an up-to-date status badge) or just an id+title for backward compatibility.
export function saveVisitedEvent(event: Pick<EventData, "id" | "title" | "mode" | "status" | "responseDeadline" | "slots" | "finalSlotId" | "createdAt">) {
  try {
    const { id, title, createdAt } = event;
    const isHost = Boolean(getHostToken(id));
    const raw = localStorage.getItem(LOCAL_MY_EVENTS_KEY);
    let list: VisitedEventItem[] = raw ? JSON.parse(raw) : [];

    const finalSlotDate = event.finalSlotId ? event.slots?.find((s) => s.id === event.finalSlotId)?.date : undefined;

    // Remove if exists
    list = list.filter((item) => item.id !== id);
    // Add to top
    list.unshift({
      id,
      title,
      createdAt,
      updatedAt: new Date().toISOString(),
      isHost,
      mode: event.mode,
      status: event.status,
      responseDeadline: event.responseDeadline,
      finalSlotDate,
    });
    // Keep max 20
    list = list.slice(0, 20);
    localStorage.setItem(LOCAL_MY_EVENTS_KEY, JSON.stringify(list));
  } catch {}
}

// Hides events created more than 7 days ago from the host's "我揪的團" list
// (PRD 2.3) — items saved before this field existed have no createdAt and are
// kept rather than treated as expired.
export function getVisitedEvents(): VisitedEventItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_MY_EVENTS_KEY);
    const list: VisitedEventItem[] = raw ? JSON.parse(raw) : [];
    return list.filter((item) => !item.createdAt || !isOlderThanDays(item.createdAt, 7));
  } catch {
    return [];
  }
}

export interface RecentSlotPreset {
  start: string;
  label: string;
}

export function getRecentSlotPresets(): RecentSlotPreset[] {
  try {
    const raw = localStorage.getItem(LOCAL_RECENT_SLOT_PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentSlotPresets(slots: { time: string; label?: string }[]) {
  try {
    const seen = new Set<string>();
    const presets: RecentSlotPreset[] = [];
    slots.forEach((s) => {
      const key = `${s.time}__${s.label || ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      presets.push({ start: s.time, label: s.label || "" });
    });
    localStorage.setItem(LOCAL_RECENT_SLOT_PRESETS_KEY, JSON.stringify(presets.slice(0, 10)));
  } catch {}
}
