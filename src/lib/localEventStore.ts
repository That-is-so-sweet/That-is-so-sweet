// Client-only replacement for the old Express + data/events.json backend.
// GitHub Pages only serves static files, so there is no server to talk to —
// everything now lives in this browser's localStorage. That means each
// device/browser has its own independent copy of "demo" data; there is no
// cross-device sync. Fine for this prototype (see project notes), but a real
// multi-device deployment would need an actual backend/database instead.
import {
  EventData,
  CreateEventInput,
  SubmitResponseInput,
  FinalizeEventInput,
  SubmitCommentInput,
  UpdateEventInput,
  ParticipantResponse,
  EventComment,
  TimeSlot,
} from "../types.js";
import { isVotingOpen, isLinkExpired, canComment } from "./eventStatus.js";

const STORAGE_KEY = "gathertime_events_db";

// Demo events (fixed "demo-*" ids) are only written once, the first time a
// browser has an empty store. Bump this whenever seedDemoEvents()'s content
// changes so browsers that already seeded an older version pick up the fix —
// otherwise the stale localStorage copy would silently outlive any source edit.
const DEMO_SEED_VERSION_KEY = "gathertime_demo_seed_version";
const DEMO_SEED_VERSION = "2";

function generateId(prefix: string = ""): string {
  const randomStr = Math.random().toString(36).substring(2, 10);
  const timeStr = Date.now().toString(36);
  return prefix ? `${prefix}_${timeStr}${randomStr}` : `${timeStr}${randomStr}`;
}

function loadEvents(): Map<string, EventData> {
  const map = new Map<string, EventData>();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: EventData[] = JSON.parse(raw);
      data.forEach((ev) => map.set(ev.id, ev));
    }
  } catch (err) {
    console.error("[Data] Failed to load events:", err);
  }

  const seededVersion = localStorage.getItem(DEMO_SEED_VERSION_KEY);
  if (map.size === 0 || seededVersion !== DEMO_SEED_VERSION) {
    seedDemoEvents(map);
    localStorage.setItem(DEMO_SEED_VERSION_KEY, DEMO_SEED_VERSION);
    persist(map);
  }

  return map;
}

function persist(map: Map<string, EventData>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(map.values())));
  } catch (err) {
    console.error("[Data] Failed to save events:", err);
  }
}

// Day-offset helpers so seeded demo data always looks "current" relative to
// whenever the browser first loads it, instead of drifting into the past.
function addDays(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDaysIso(offsetDays: number, hour = 23, minute = 59): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function seedDemoEvents(map: Map<string, EventData>) {
  // 1. 進行中・含時段候選 — normal collecting state, deadline still open.
  const slots: TimeSlot[] = [
    { id: "slot_1", date: addDays(2), time: "12:00", label: "燒肉店聚餐" },
    { id: "slot_2", date: addDays(2), time: "18:00", label: "餐酒館小酌" },
    { id: "slot_3", date: addDays(3), time: "14:00", label: "甜點咖啡廳" },
    { id: "slot_4", date: addDays(3), time: "18:00", label: "火鍋吃到飽" },
    { id: "slot_5", date: addDays(9), time: "18:00", label: "週末熱炒夜" },
  ];
  const responses: ParticipantResponse[] = [
    {
      id: "p_1", nickname: "主揪阿傑", email: "ajai@example.com",
      availability: { slot_1: "available", slot_2: "available", slot_3: "if_needed", slot_4: "available", slot_5: "available" },
      comment: "大家快來選時間！我這幾天都算方便～", updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "p_2", nickname: "小明",
      availability: { slot_1: "available", slot_2: "available", slot_3: "unavailable", slot_4: "available", slot_5: "if_needed" },
      comment: "週六整天都可以，週日下午不行要加班", updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "p_3", nickname: "Lily 莉莉", email: "lily@example.com",
      availability: { slot_1: "if_needed", slot_2: "available", slot_3: "available", slot_4: "available", slot_5: "unavailable" },
      comment: "最想吃晚餐！", updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "p_4", nickname: "陳大華",
      availability: { slot_1: "unavailable", slot_2: "available", slot_3: "if_needed", slot_4: "available", slot_5: "available" },
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];
  const gatheringComments: EventComment[] = [
    { id: "cmt_1", nickname: "主揪阿傑", message: "大家記得先看一下熱點圖再投票喔～", createdAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString() },
    { id: "cmt_2", nickname: "小明", message: "推燒肉店那個時段！", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "cmt_3", nickname: "Lily 莉莉", message: "+1 燒肉，晚餐時段也可以", createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  ];
  map.set("demo-gathering", {
    id: "demo-gathering", hostToken: "demo-host-token-123",
    title: "八月好友暑期歡聚小酌隊",
    description: "很久沒聚聚囉！挑個週末大家有空的時間吃頓好的 🍻",
    hostName: "阿傑", mode: "time_slots", responseDeadline: addDaysIso(4),
    slots, responses, comments: gatheringComments, status: "active",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date().toISOString(),
  });

  // 2. 進行中・僅選日期模式範例 — date_only mode, one slot per date.
  const dateOnlySlots: TimeSlot[] = [
    { id: "d_1", date: addDays(3), time: "", label: "" },
    { id: "d_2", date: addDays(4), time: "", label: "" },
    { id: "d_3", date: addDays(10), time: "", label: "" },
  ];
  map.set("demo-date-only", {
    id: "demo-date-only", hostToken: "demo-host-token-date-only",
    title: "部門秋季小旅行敲日期",
    description: "先喬出大家都有空的日子，細節之後再討論",
    hostName: "PM Sandy", mode: "date_only", responseDeadline: addDaysIso(5),
    slots: dateOnlySlots,
    responses: [
      { id: "dp_1", nickname: "Sandy", availability: { d_1: "available", d_2: "available", d_3: "if_needed" }, comment: "我這三天都可以喬", updatedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "dp_2", nickname: "Marco", availability: { d_1: "if_needed", d_2: "available", d_3: "unavailable" }, updatedAt: new Date(Date.now() - 3600000 * 6).toISOString() },
    ],
    comments: [],
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date().toISOString(),
  });

  // 3. 投票已截止・尚未定案 — deadline already passed, host hasn't finalized yet.
  map.set("demo-voting-closed", {
    id: "demo-voting-closed", hostToken: "demo-host-token-closed",
    title: "老同學久違聚餐",
    description: "終於要約出來吃飯了！",
    hostName: "阿凱", mode: "time_slots", responseDeadline: addDaysIso(-2),
    slots: [
      { id: "c_1", date: addDays(6), time: "18:30", label: "日式居酒屋" },
      { id: "c_2", date: addDays(7), time: "12:00", label: "義式餐廳" },
    ],
    responses: [
      { id: "cp_1", nickname: "阿凱", availability: { c_1: "available", c_2: "if_needed" }, updatedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
      { id: "cp_2", nickname: "小玉", availability: { c_1: "available", c_2: "available" }, updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: "cp_3", nickname: "阿宏", availability: { c_1: "unavailable", c_2: "available" }, updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    ],
    comments: [],
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  });

  // 4. 已敲定・尚未舉辦 — finalized, meetup date still in the future.
  map.set("demo-finalized-upcoming", {
    id: "demo-finalized-upcoming", hostToken: "demo-host-token-upcoming",
    title: "生日慶生趴",
    description: "壽星指定要吃火鍋！",
    hostName: "小雨", mode: "time_slots", responseDeadline: addDaysIso(-1),
    slots: [
      { id: "u_1", date: addDays(7), time: "18:00", label: "麻辣鍋" },
      { id: "u_2", date: addDays(8), time: "18:00", label: "石頭火鍋" },
    ],
    responses: [
      { id: "up_1", nickname: "小雨", availability: { u_1: "available", u_2: "if_needed" }, updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: "up_2", nickname: "阿福", availability: { u_1: "available", u_2: "available" }, updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: "up_3", nickname: "美美", availability: { u_1: "available", u_2: "unavailable" }, updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    ],
    comments: [
      { id: "cmt_u1", nickname: "小雨", message: "麻辣鍋不吃辣的可以點鴛鴦喔！", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    ],
    status: "finalized", finalSlotId: "u_1", finalNote: "訂位小雨，18:00 準時集合",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  });

  // 5. 活動已結束（3 天前）— finalized, meetup date 3 days in the past, within the 7-day grace window.
  map.set("demo-finalized-ended", {
    id: "demo-finalized-ended", hostToken: "demo-host-token-ended",
    title: "週末露營活動",
    description: "新手露營團，裝備不夠可以跟團友借",
    hostName: "阿凱", mode: "time_slots", responseDeadline: addDaysIso(-10),
    slots: [
      { id: "e_1", date: addDays(-3), time: "14:00", label: "溪畔營地" },
      { id: "e_2", date: addDays(-2), time: "14:00", label: "溪畔營地（備案）" },
    ],
    responses: [
      { id: "ep_1", nickname: "阿凱", availability: { e_1: "available", e_2: "if_needed" }, updatedAt: new Date(Date.now() - 86400000 * 12).toISOString() },
      { id: "ep_2", nickname: "婷婷", availability: { e_1: "available", e_2: "available" }, updatedAt: new Date(Date.now() - 86400000 * 11).toISOString() },
      { id: "ep_3", nickname: "老王", availability: { e_1: "available", e_2: "unavailable" }, updatedAt: new Date(Date.now() - 86400000 * 11).toISOString() },
    ],
    comments: [],
    status: "finalized", finalSlotId: "e_1", finalNote: "營地入口見，記得帶睡袋！",
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  });

  // 6. 連結已失效範例 — finalized, meetup date more than 7 days ago -> lookup should 404.
  map.set("demo-expired-link", {
    id: "demo-expired-link", hostToken: "demo-host-token-expired",
    title: "上個月的讀書會",
    description: "示範連結過期後的畫面",
    hostName: "書僮", mode: "time_slots", responseDeadline: addDaysIso(-17),
    slots: [{ id: "x_1", date: addDays(-10), time: "19:00", label: "線上讀書會" }],
    responses: [
      { id: "xp_1", nickname: "書僮", availability: { x_1: "available" }, updatedAt: new Date(Date.now() - 86400000 * 19).toISOString() },
      { id: "xp_2", nickname: "小安", availability: { x_1: "available" }, updatedAt: new Date(Date.now() - 86400000 * 18).toISOString() },
    ],
    comments: [],
    status: "finalized", finalSlotId: "x_1", finalNote: "",
    createdAt: new Date(Date.now() - 86400000 * 21).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  });

  // 7. 主揪已取消範例 — cancelled by the host before the meetup happened.
  map.set("demo-cancelled", {
    id: "demo-cancelled", hostToken: "demo-host-token-cancelled",
    title: "颱風天爬山團",
    description: "臨時取消，改期再約",
    hostName: "阿凱", mode: "time_slots", responseDeadline: addDaysIso(-1),
    slots: [{ id: "y_1", date: addDays(5), time: "08:00", label: "象山步道" }],
    responses: [
      { id: "yp_1", nickname: "阿凱", email: "kai@example.com", availability: { y_1: "available" }, updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: "yp_2", nickname: "小玉", email: "yuyu@example.com", availability: { y_1: "available" }, updatedAt: new Date(Date.now() - 86400000).toISOString() },
    ],
    comments: [
      { id: "cmt_y1", nickname: "阿凱", message: "颱風要來了，這週先取消，之後再約新時間！", createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
    ],
    status: "cancelled", cancelledAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  });
}

// --- "API" functions, mirroring the old Express routes 1:1 --- //

export function getEvent(id: string, hostToken?: string): EventData & { isHost?: boolean } {
  const events = loadEvents();
  const event = events.get(id);
  if (!event) {
    throw new Error("找不到此活動，可能已被刪除或網址錯誤");
  }
  if (isLinkExpired(event)) {
    throw new Error("此活動連結已失效（活動結束超過 7 天）");
  }

  const isHost = Boolean(hostToken && hostToken === event.hostToken);
  return {
    ...event,
    hostToken: isHost ? event.hostToken : undefined,
    isHost,
  };
}

export function createEvent(input: CreateEventInput): { event: EventData; hostToken: string } {
  const { title, description, location, hostName, hostEmail, mode, responseDeadline, slots } = input;

  if (!title || !title.trim()) {
    throw new Error("請輸入活動名稱");
  }
  if (title.length > 30) {
    throw new Error("活動名稱不可超過 30 字");
  }
  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    throw new Error("請至少新增一個候選時段");
  }

  const events = loadEvents();
  const id = generateId("event");
  const hostToken = generateId("token");

  const formattedSlots: TimeSlot[] = slots.map((s, idx) => ({
    id: `slot_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
    date: s.date,
    time: s.time,
    label: s.label || "",
  }));

  const newEvent: EventData = {
    id,
    hostToken,
    title: title.trim(),
    description: description ? description.trim() : "",
    location: location && location.text.trim() ? { text: location.text.trim(), url: location.url } : undefined,
    hostName: hostName ? hostName.trim() : "",
    hostEmail: hostEmail ? hostEmail.trim() : "",
    mode: mode === "date_only" ? "date_only" : "time_slots",
    responseDeadline: responseDeadline ? new Date(responseDeadline).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
    slots: formattedSlots,
    responses: [],
    comments: [],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  events.set(id, newEvent);
  persist(events);

  return { event: newEvent, hostToken };
}

export function submitResponse(id: string, input: SubmitResponseInput): { event: EventData; participantResponse: ParticipantResponse } {
  const { participantId, nickname, email, password, availability, comment } = input;

  const events = loadEvents();
  const event = events.get(id);
  if (!event) {
    throw new Error("找不到此活動");
  }
  if (event.status === "cancelled") {
    throw new Error("此活動已由主揪取消，暫停接受新投票");
  }
  if (event.status === "finalized") {
    throw new Error("此活動時間已由主揪拍板定案，暫停接受新投票");
  }
  if (!isVotingOpen(event)) {
    throw new Error("投票已截止，請聯繫主揪重新開放投票");
  }
  if (!nickname || !nickname.trim()) {
    throw new Error("請輸入您的暱稱");
  }

  const cleanNickname = nickname.trim();
  const now = new Date().toISOString();

  let existingIndex = -1;
  if (participantId) {
    existingIndex = event.responses.findIndex((r) => r.id === participantId);
  }
  if (existingIndex === -1) {
    existingIndex = event.responses.findIndex((r) => r.nickname.toLowerCase() === cleanNickname.toLowerCase());
  }

  // 比對到既有回覆時，如果那筆回覆有設密碼，送出的密碼必須完全相符才能覆蓋——
  // 不管是靠 participantId 還是暱稱比對到的，都套用同一個檢查，避免有人偽造
  // participantId 繞過暱稱層級的密碼保護。
  const existing = existingIndex >= 0 ? event.responses[existingIndex] : undefined;
  if (existing?.password && existing.password !== password) {
    throw new Error("此暱稱已被使用，密碼不正確");
  }

  const newResponse: ParticipantResponse = {
    id: existing ? existing.id : (participantId || generateId("p")),
    nickname: cleanNickname,
    email: email ? email.trim() : "",
    // 密碼一旦設定就不可修改：既有回覆一律沿用原本的密碼，只有全新回覆才會採用這次送出的密碼。
    password: existing ? existing.password : (password ? password.trim() : undefined),
    availability: availability || {},
    comment: comment ? comment.trim() : "",
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    event.responses[existingIndex] = newResponse;
  } else {
    event.responses.push(newResponse);
  }

  event.updatedAt = now;
  events.set(id, event);
  persist(events);

  return { event, participantResponse: newResponse };
}

export function finalizeEvent(id: string, input: FinalizeEventInput): EventData {
  const { hostToken, finalSlotId, finalNote } = input;

  const events = loadEvents();
  const event = events.get(id);
  if (!event) {
    throw new Error("找不到此活動");
  }
  if (event.hostToken !== hostToken) {
    throw new Error("主揪驗證失敗，您沒有此活動的管理權限");
  }
  if (event.status === "cancelled") {
    throw new Error("此活動已取消，無法拍板定案");
  }

  const targetSlot = event.slots.find((s) => s.id === finalSlotId);
  if (!targetSlot) {
    throw new Error("選擇的最終時段無效");
  }

  event.status = "finalized";
  event.finalSlotId = finalSlotId;
  event.finalNote = finalNote ? finalNote.trim() : "";
  event.updatedAt = new Date().toISOString();

  events.set(id, event);
  persist(events);
  return event;
}

export function reopenEvent(id: string, hostToken: string, responseDeadline?: string): EventData {
  const events = loadEvents();
  const event = events.get(id);
  if (!event) {
    throw new Error("找不到此活動");
  }
  if (event.hostToken !== hostToken) {
    throw new Error("主揪驗證失敗");
  }

  event.status = "active";
  event.finalSlotId = undefined;
  if (responseDeadline) {
    event.responseDeadline = new Date(responseDeadline).toISOString();
  } else if (!isVotingOpen({ ...event, status: "active" })) {
    event.responseDeadline = new Date(Date.now() + 7 * 86400000).toISOString();
  }
  event.updatedAt = new Date().toISOString();

  events.set(id, event);
  persist(events);
  return event;
}

export function submitComment(id: string, input: SubmitCommentInput): EventData {
  const { nickname, message } = input;

  const events = loadEvents();
  const event = events.get(id);
  if (!event) {
    throw new Error("找不到此活動");
  }
  if (isLinkExpired(event)) {
    throw new Error("此活動連結已失效（活動結束超過 7 天）");
  }
  if (!canComment(event)) {
    throw new Error("此活動目前無法留言");
  }
  if (!nickname || !nickname.trim()) {
    throw new Error("請輸入您的暱稱");
  }
  if (!message || !message.trim()) {
    throw new Error("請輸入留言內容");
  }
  if (message.trim().length > 300) {
    throw new Error("留言內容不可超過 300 字");
  }

  const comment: EventComment = {
    id: generateId("cmt"),
    nickname: nickname.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!event.comments) event.comments = [];
  event.comments.push(comment);
  event.updatedAt = comment.createdAt;

  events.set(id, event);
  persist(events);
  return event;
}

export function cancelEvent(id: string, hostToken: string): EventData {
  const events = loadEvents();
  const event = events.get(id);
  if (!event) {
    throw new Error("找不到此活動");
  }
  if (event.hostToken !== hostToken) {
    throw new Error("主揪驗證失敗，您沒有此活動的管理權限");
  }
  if (event.status === "cancelled") {
    throw new Error("此活動已經取消");
  }

  const now = new Date().toISOString();
  event.status = "cancelled";
  event.cancelledAt = now;
  event.updatedAt = now;

  events.set(id, event);
  persist(events);
  return event;
}

export function updateEvent(id: string, input: UpdateEventInput): EventData {
  const { hostToken, title, description, location, hostName, hostEmail, responseDeadline } = input;

  const events = loadEvents();
  const event = events.get(id);
  if (!event) {
    throw new Error("找不到此活動");
  }
  if (event.hostToken !== hostToken) {
    throw new Error("主揪驗證失敗，您沒有此活動的管理權限");
  }

  if (title !== undefined) {
    if (!title.trim()) {
      throw new Error("請輸入活動名稱");
    }
    if (title.length > 30) {
      throw new Error("活動名稱不可超過 30 字");
    }
    event.title = title.trim();
  }
  if (description !== undefined) {
    event.description = description.trim();
  }
  if (location !== undefined) {
    event.location = location.text.trim() ? { text: location.text.trim(), url: location.url } : undefined;
  }
  if (hostName !== undefined) {
    event.hostName = hostName.trim();
  }
  if (hostEmail !== undefined) {
    event.hostEmail = hostEmail.trim();
  }
  if (responseDeadline !== undefined) {
    event.responseDeadline = new Date(responseDeadline).toISOString();
  }
  event.updatedAt = new Date().toISOString();

  events.set(id, event);
  persist(events);
  return event;
}
