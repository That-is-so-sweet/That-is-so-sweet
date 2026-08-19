import {
  EventData,
  CreateEventInput,
  SubmitResponseInput,
  FinalizeEventInput,
} from "../types.js";

const LOCAL_HOST_TOKENS_KEY = "gathertime_host_tokens"; // { [eventId]: hostToken }
const LOCAL_USER_NICKNAME_KEY = "gathertime_user_nickname";
const LOCAL_USER_EMAIL_KEY = "gathertime_user_email";
const LOCAL_MY_EVENTS_KEY = "gathertime_my_events"; // Array of event IDs visited or created
const LOCAL_RECENT_SLOT_PRESETS_KEY = "gathertime_recent_slot_presets"; // Array of { start, label } from the last created event

export async function fetchEvent(id: string, hostToken?: string): Promise<EventData & { isHost?: boolean }> {
  const url = hostToken
    ? `/api/events/${id}?hostToken=${encodeURIComponent(hostToken)}`
    : `/api/events/${id}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "讀取活動失敗");
  }
  const data = await res.json();
  saveVisitedEvent(data.id, data.title);
  return data;
}

export async function createEvent(input: CreateEventInput): Promise<{ event: EventData; hostToken: string }> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "產生活動失敗");
  }

  const data = await res.json();
  // Save host token locally
  saveHostToken(data.event.id, data.hostToken);
  saveVisitedEvent(data.event.id, data.event.title);
  return data;
}

export async function submitResponse(eventId: string, input: SubmitResponseInput): Promise<EventData> {
  const res = await fetch(`/api/events/${eventId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "送出投票失敗");
  }

  const data = await res.json();
  // Remember user nickname and email locally
  if (input.nickname) saveUserNickname(input.nickname);
  if (input.email) saveUserEmail(input.email);
  saveVisitedEvent(data.event.id, data.event.title);

  return data.event;
}

export async function finalizeEvent(eventId: string, input: FinalizeEventInput): Promise<EventData> {
  const res = await fetch(`/api/events/${eventId}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "拍板定案失敗");
  }

  const data = await res.json();
  return data.event;
}

export async function reopenEvent(eventId: string, hostToken: string): Promise<EventData> {
  const res = await fetch(`/api/events/${eventId}/reopen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostToken }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "重新開放投票失敗");
  }

  const data = await res.json();
  return data.event;
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
  updatedAt: string;
  isHost: boolean;
}

export function saveVisitedEvent(id: string, title: string) {
  try {
    const isHost = Boolean(getHostToken(id));
    const raw = localStorage.getItem(LOCAL_MY_EVENTS_KEY);
    let list: VisitedEventItem[] = raw ? JSON.parse(raw) : [];
    
    // Remove if exists
    list = list.filter((item) => item.id !== id);
    // Add to top
    list.unshift({
      id,
      title,
      updatedAt: new Date().toISOString(),
      isHost,
    });
    // Keep max 20
    list = list.slice(0, 20);
    localStorage.setItem(LOCAL_MY_EVENTS_KEY, JSON.stringify(list));
  } catch {}
}

export function getVisitedEvents(): VisitedEventItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_MY_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
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
