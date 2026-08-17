import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  EventData, 
  CreateEventInput, 
  SubmitResponseInput, 
  FinalizeEventInput,
  ParticipantResponse,
  TimeSlot 
} from "./src/types.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// File persistence setup
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let eventsMap: Map<string, EventData> = new Map();

// Helper to generate simple unique IDs
function generateId(prefix: string = ""): string {
  const randomStr = Math.random().toString(36).substring(2, 10);
  const timeStr = Date.now().toString(36);
  return prefix ? `${prefix}_${timeStr}${randomStr}` : `${timeStr}${randomStr}`;
}

// Load data from disk
function loadEvents() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const data: EventData[] = JSON.parse(raw);
      data.forEach((ev) => eventsMap.set(ev.id, ev));
      console.log(`[Data] Loaded ${eventsMap.size} events from disk.`);
    }
  } catch (err) {
    console.error("[Data] Failed to load events:", err);
  }

  // If empty, seed a demo event so preview looks instantly alive!
  if (eventsMap.size === 0) {
    seedDemoEvent();
  }
}

// Save data to disk
function saveEvents() {
  try {
    const list = Array.from(eventsMap.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("[Data] Failed to save events:", err);
  }
}

function seedDemoEvent() {
  const demoId = "demo-gathering";
  const demoHostToken = "demo-host-token-123";

  const slots: TimeSlot[] = [
    { id: "slot_1", date: "2026-08-15", time: "12:00 - 14:00 (午餐)", label: "燒肉店聚餐" },
    { id: "slot_2", date: "2026-08-15", time: "18:00 - 21:00 (晚餐)", label: "餐酒館小酌" },
    { id: "slot_3", date: "2026-08-16", time: "14:00 - 17:00 (下午茶)", label: "甜點咖啡廳" },
    { id: "slot_4", date: "2026-08-16", time: "18:00 - 21:00 (晚餐)", label: "火鍋吃到飽" },
    { id: "slot_5", date: "2026-08-22", time: "18:00 - 21:00 (晚餐)", label: "週末熱炒夜" },
  ];

  const responses: ParticipantResponse[] = [
    {
      id: "p_1",
      nickname: "主揪阿傑",
      email: "ajai@example.com",
      availability: {
        slot_1: "available",
        slot_2: "available",
        slot_3: "if_needed",
        slot_4: "available",
        slot_5: "available",
      },
      comment: "大家快來選時間！我這幾天都算方便～",
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "p_2",
      nickname: "小明",
      availability: {
        slot_1: "available",
        slot_2: "available",
        slot_3: "unavailable",
        slot_4: "available",
        slot_5: "if_needed",
      },
      comment: "週六整天都可以，週日下午不行要加班",
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "p_3",
      nickname: "Lily 莉莉",
      email: "lily@example.com",
      availability: {
        slot_1: "if_needed",
        slot_2: "available",
        slot_3: "available",
        slot_4: "available",
        slot_5: "unavailable",
      },
      comment: "最想吃晚餐！",
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "p_4",
      nickname: "陳大華",
      availability: {
        slot_1: "unavailable",
        slot_2: "available",
        slot_3: "if_needed",
        slot_4: "available",
        slot_5: "available",
      },
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  const demoEvent: EventData = {
    id: demoId,
    hostToken: demoHostToken,
    title: "八月好友暑期歡聚小酌隊",
    description: "很久沒聚聚囉！挑個週末大家有空的時間吃頓好的 🍻",
    hostName: "阿傑",
    slots,
    responses,
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  eventsMap.set(demoId, demoEvent);
  saveEvents();
}

loadEvents();

// --- API ROUTES --- //

// 01. Create new event
app.post("/api/events", (req, res) => {
  const { title, description, hostName, hostEmail, slots } = req.body as CreateEventInput;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "請輸入活動名稱" });
  }

  if (title.length > 30) {
    return res.status(400).json({ error: "活動名稱不可超過 30 字" });
  }

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: "請至少新增一個候選時段" });
  }

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
    hostName: hostName ? hostName.trim() : "",
    hostEmail: hostEmail ? hostEmail.trim() : "",
    slots: formattedSlots,
    responses: [],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  eventsMap.set(id, newEvent);
  saveEvents();

  // Return created event with hostToken
  return res.status(201).json({
    event: newEvent,
    hostToken,
  });
});

// 02. Get event details
app.get("/api/events/:id", (req, res) => {
  const { id } = req.params;
  const { hostToken } = req.query;

  const event = eventsMap.get(id);
  if (!event) {
    return res.status(404).json({ error: "找不到此活動，可能已被刪除或網址錯誤" });
  }

  const isHost = Boolean(hostToken && hostToken === event.hostToken);

  // Return event. Hide hostToken from non-host response for security.
  const responseData = {
    ...event,
    hostToken: isHost ? event.hostToken : undefined,
    isHost,
  };

  return res.json(responseData);
});

// 03. Submit / Update participant response
app.post("/api/events/:id/respond", (req, res) => {
  const { id } = req.params;
  const { participantId, nickname, email, availability, comment } = req.body as SubmitResponseInput;

  const event = eventsMap.get(id);
  if (!event) {
    return res.status(404).json({ error: "找不到此活動" });
  }

  if (event.status === "finalized") {
    return res.status(400).json({ error: "此活動時間已由主揪拍板定案，暫停接受新投票" });
  }

  if (!nickname || !nickname.trim()) {
    return res.status(400).json({ error: "請輸入您的暱稱" });
  }

  const cleanNickname = nickname.trim();
  const now = new Date().toISOString();

  let pId = participantId;
  let existingIndex = -1;

  if (pId) {
    existingIndex = event.responses.findIndex((r) => r.id === pId);
  }

  if (existingIndex === -1) {
    // Also check if nickname already exists
    existingIndex = event.responses.findIndex((r) => r.nickname.toLowerCase() === cleanNickname.toLowerCase());
  }

  const newResponse: ParticipantResponse = {
    id: existingIndex >= 0 ? event.responses[existingIndex].id : (pId || generateId("p")),
    nickname: cleanNickname,
    email: email ? email.trim() : "",
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
  eventsMap.set(id, event);
  saveEvents();

  return res.json({
    message: "回覆已成功送出！",
    participantResponse: newResponse,
    event,
  });
});

// Remove a response (e.g. if participant wants to withdraw or host manages)
app.delete("/api/events/:id/responses/:participantId", (req, res) => {
  const { id, participantId } = req.params;
  const { hostToken } = req.query;

  const event = eventsMap.get(id);
  if (!event) {
    return res.status(404).json({ error: "找不到此活動" });
  }

  const isHost = Boolean(hostToken && hostToken === event.hostToken);

  const initialLength = event.responses.length;
  event.responses = event.responses.filter((r) => r.id !== participantId);

  if (event.responses.length === initialLength) {
    return res.status(404).json({ error: "找不到該填寫紀錄" });
  }

  event.updatedAt = new Date().toISOString();
  eventsMap.set(id, event);
  saveEvents();

  return res.json({ message: "已刪除該填寫紀錄", event });
});

// 04. Host confirms final time slot
app.post("/api/events/:id/finalize", (req, res) => {
  const { id } = req.params;
  const { hostToken, finalSlotId, finalNote } = req.body as FinalizeEventInput;

  const event = eventsMap.get(id);
  if (!event) {
    return res.status(404).json({ error: "找不到此活動" });
  }

  if (event.hostToken !== hostToken) {
    return res.status(403).json({ error: "主揪驗證失敗，您沒有此活動的管理權限" });
  }

  const targetSlot = event.slots.find((s) => s.id === finalSlotId);
  if (!targetSlot) {
    return res.status(400).json({ error: "選擇的最終時段無效" });
  }

  event.status = "finalized";
  event.finalSlotId = finalSlotId;
  event.finalNote = finalNote ? finalNote.trim() : "";
  event.updatedAt = new Date().toISOString();

  eventsMap.set(id, event);
  saveEvents();

  return res.json({
    message: "最終聚會時間已確認定案！",
    event,
  });
});

// 05. Host re-open event (optional)
app.post("/api/events/:id/reopen", (req, res) => {
  const { id } = req.params;
  const { hostToken } = req.body;

  const event = eventsMap.get(id);
  if (!event) {
    return res.status(404).json({ error: "找不到此活動" });
  }

  if (event.hostToken !== hostToken) {
    return res.status(403).json({ error: "主揪驗證失敗" });
  }

  event.status = "active";
  event.finalSlotId = undefined;
  event.updatedAt = new Date().toISOString();

  eventsMap.set(id, event);
  saveEvents();

  return res.json({
    message: "活動已重新開放投票統計",
    event,
  });
});

// Serve frontend / Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Gathering Coordinator running on http://localhost:${PORT}`);
  });
}

startServer();
