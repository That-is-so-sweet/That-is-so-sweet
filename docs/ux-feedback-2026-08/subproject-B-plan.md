# 子專案 B 實作計畫 — 活動頁面互動重構

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 拿掉活動頁面 vote/heatmap/host 三個 Tab 的切換設計，改成依角色與識別狀態推導的路由；新增 When2meet 式「暱稱＋選填密碼」識別機制；把主辦人拍板定案／重新開放投票／取消活動／編輯活動資訊全部整合進熱點圖頁面的常駐區塊。

**Architecture:** `HostTab.tsx` 整個刪除，內容併入 `HeatmapTab.tsx`（桌面/行動共用元件）成為 `isHost` 時渲染的常駐區塊；`EventScreen.tsx`（行動）／`EventView.tsx`（桌面）各自獨立實作，`tab` state 都改成推導式 `view` state（`"identify_vote" | "heatmap"`），不再渲染任何 Tab 按鈕；新增 `EditEventModal.tsx`（比照既有 `ReopenModal`/`CancelEventModal` 手刻慣例，桌面/行動共用同一份）；資料層新增 `localEventStore.updateEvent()`、`submitResponse()` 的密碼比對驗證。

**Tech Stack:** React 19 + TypeScript，Vite build，無測試框架（純 `tsc --noEmit` 型別檢查 + 手動 dev server 驗證）。

**Spec:** [docs/ux-feedback-2026-08/subproject-B-design.md](./subproject-B-design.md)

## Global Constraints

- 本專案沒有測試框架（無 test script／無 test 檔案，見 CLAUDE.md）：每個任務的驗證方式是 `npm run lint`（`tsc --noEmit`）做型別檢查，加上啟動 `npm run dev` 手動走一遍互動流程；不要新增測試框架
- 密碼是明文存在該筆活動資料中（純前端、無後端），是防呆用途、不是加密驗證——不要試圖加雜湊或其他加密機制，超出這次範圍
- 密碼**不**存進 `localStorage`（跟暱稱/Email 不同），每次造訪都要重新輸入
- 密碼一旦在某筆回覆上設定，**不可修改**（沒有改密碼/忘記密碼流程）；更新既有回覆時一律沿用該筆回覆原本存的密碼，不接受新密碼覆蓋
- 主辦人編輯活動資訊（`updateEvent`）**只能改**標題、說明、地點、主辦人姓名/Email、投票截止時間；**不能**改候選時段（`slots`）或 `mode`——`UpdateEventInput` 型別上就不該有這兩個欄位
- `HeatmapTab.tsx`／`EditEventModal.tsx` 是桌面/行動共用元件（`EventView.tsx` 與 `EventScreen.tsx` 都直接 import mobile 元件），只需要改一次／建一次
- `EventScreen.tsx`（行動）與 `EventView.tsx`（桌面）是兩個獨立實作，路由邏輯改動必須兩邊都做
- `HostTab.tsx` 最終要整個刪除；刪除必須等到 `EventScreen.tsx` 與 `EventView.tsx` 都不再 import 它之後才能做（見 Task 8）
- 新增的 `onUpdateEvent` 相關 props 一律設計成**選填**（跟現有 `HostTab` 的 `onReopen?`/`onCancelEvent?` 一致），這樣中間任務即使還沒接上呼叫端也能維持 `npm run lint` 通過
- 這次計畫**不含**候選時段編輯、密碼修改/忘記密碼、抽出共用 `Modal` 元件——理由見 spec「暫不處理」章節

---

## File Structure

| 檔案 | 動作 | 責任 |
|---|---|---|
| `src/types.ts` | 修改 | `ParticipantResponse.password`、`SubmitResponseInput.password`、新增 `UpdateEventInput` |
| `src/lib/localEventStore.ts` | 修改 | `submitResponse()` 密碼比對驗證；新增 `updateEvent()` |
| `src/lib/api.ts` | 修改 | 新增 `updateEvent()` 薄封裝 |
| `src/mobile/VoteTab.tsx` | 修改 | 新增密碼欄位、鎖定/解鎖邏輯 |
| `src/mobile/EditEventModal.tsx` | 新建 | 主辦人編輯活動基本資訊的手刻 Modal（桌面/行動共用） |
| `src/mobile/HeatmapTab.tsx` | 修改 | 吸收 `HostTab.tsx` 全部內容成常駐主辦人區塊；CTA 提示條降權 |
| `src/mobile/EventScreen.tsx` | 修改 | 移除 Tab 按鈕列，`tab` state 改推導式 `view` state |
| `src/components/EventView.tsx` | 修改 | 同上（桌面版，獨立實作） |
| `src/mobile/HostTab.tsx` | **刪除** | 內容已併入 `HeatmapTab.tsx`，任務 8 執行刪除 |
| `src/mobile/MobileApp.tsx` | 修改 | 接收並轉傳 `onUpdateEvent`；`initialTab` 型別拿掉 `"host"` |
| `src/App.tsx` | 修改 | `initialTab` 型別拿掉 `"host"`；新增 `handleUpdateEvent` |

---

### Task 1: 資料模型 — 密碼欄位與 `UpdateEventInput`

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `ParticipantResponse.password?: string`；`SubmitResponseInput.password?: string`；`UpdateEventInput { hostToken, title?, description?, location?, hostName?, hostEmail?, responseDeadline? }` — 後續 Task 2/3/4/5/6 都依賴這些型別

- [ ] **Step 1: `ParticipantResponse` 新增 `password`**

把：

```ts
export interface ParticipantResponse {
  id: string;
  nickname: string;
  email?: string;
  availability: Record<string, AvailabilityStatus>; // slotId -> status
  comment?: string;
  updatedAt: string;
}
```

改成：

```ts
export interface ParticipantResponse {
  id: string;
  nickname: string;
  email?: string;
  password?: string; // 選填，明文防呆用途（非加密驗證），一旦設定不可修改
  availability: Record<string, AvailabilityStatus>; // slotId -> status
  comment?: string;
  updatedAt: string;
}
```

- [ ] **Step 2: `SubmitResponseInput` 新增 `password`**

把：

```ts
export interface SubmitResponseInput {
  participantId?: string; // If re-editing
  nickname: string;
  email?: string;
  availability: Record<string, AvailabilityStatus>;
  comment?: string;
}
```

改成：

```ts
export interface SubmitResponseInput {
  participantId?: string; // If re-editing
  nickname: string;
  email?: string;
  password?: string;
  availability: Record<string, AvailabilityStatus>;
  comment?: string;
}
```

- [ ] **Step 3: 新增 `UpdateEventInput`**

在 `CancelEventInput` interface 之後插入：

```ts
export interface UpdateEventInput {
  hostToken: string;
  title?: string;
  description?: string;
  location?: EventLocation;
  hostName?: string;
  hostEmail?: string;
  responseDeadline?: string;
}
```

- [ ] **Step 4: 型別檢查**

執行：`npm run lint`
預期：通過（新增欄位都是選填，`UpdateEventInput` 是全新型別，不會破壞現有程式碼）

- [ ] **Step 5: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): add participant password field and UpdateEventInput"
```

---

### Task 2: `localEventStore.ts` — 密碼驗證與 `updateEvent()`

**Files:**
- Modify: `src/lib/localEventStore.ts`

**Interfaces:**
- Consumes: `ParticipantResponse.password`、`SubmitResponseInput.password`、`UpdateEventInput`（Task 1）
- Produces: `submitResponse()` 現在會擋下密碼不符的同暱稱送出；新增 `updateEvent(id: string, input: UpdateEventInput): EventData` — Task 3 的 `api.ts` 會呼叫它

- [ ] **Step 1: import 新增 `UpdateEventInput`**

把：

```ts
import {
  EventData,
  CreateEventInput,
  SubmitResponseInput,
  FinalizeEventInput,
  SubmitCommentInput,
  ParticipantResponse,
  EventComment,
  TimeSlot,
} from "../types.js";
```

改成：

```ts
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
```

- [ ] **Step 2: `submitResponse()` 加入密碼比對，`password` 一旦設定就不可覆蓋**

把：

```ts
export function submitResponse(id: string, input: SubmitResponseInput): { event: EventData; participantResponse: ParticipantResponse } {
  const { participantId, nickname, email, availability, comment } = input;

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

  const newResponse: ParticipantResponse = {
    id: existingIndex >= 0 ? event.responses[existingIndex].id : (participantId || generateId("p")),
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
  events.set(id, event);
  persist(events);

  return { event, participantResponse: newResponse };
}
```

改成：

```ts
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
```

- [ ] **Step 3: 新增 `updateEvent()`**

在 `cancelEvent()` 函式（檔案最後一個函式）之後新增：

```ts
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
```

- [ ] **Step 4: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 5: 手動驗證（devtools console，先不透過 UI）**

啟動 `npm run dev`，開啟任一 demo 活動（如 `#event=demo-gathering`），開瀏覽器 devtools console：

```js
// 模擬送出一筆有密碼保護的回覆，再用錯誤密碼覆蓋，確認會被擋下
import("/src/lib/localEventStore.ts").then(async (store) => {
  const r1 = store.submitResponse("demo-gathering", { nickname: "測試密碼員", password: "1234", availability: {} });
  console.log("first submit ok:", r1.participantResponse);
  try {
    store.submitResponse("demo-gathering", { nickname: "測試密碼員", password: "wrong", availability: {} });
    console.error("BUG: 應該要拋錯但沒有");
  } catch (e) {
    console.log("correctly rejected:", e.message);
  }
  const r2 = store.submitResponse("demo-gathering", { nickname: "測試密碼員", password: "1234", availability: { slot_1: "available" } });
  console.log("correct password overwrite ok:", r2.participantResponse);
});
```

（如果專案的 dev server 不支援直接用瀏覽器 import TS 模組路徑，改成在瀏覽器手動操作：之後 Task 4 接上 UI 後，直接透過 `VoteTab` 表單重複這三步驟驗證即可，這裡的 console 驗證只是提前確認 store 邏輯本身正確。）

- [ ] **Step 6: Commit**

```bash
git add src/lib/localEventStore.ts
git commit -m "feat(store): validate response password on overwrite, add updateEvent()"
```

---

### Task 3: `api.ts` — `updateEvent()` 薄封裝

**Files:**
- Modify: `src/lib/api.ts`

**Interfaces:**
- Consumes: `UpdateEventInput`（Task 1）、`store.updateEvent()`（Task 2）
- Produces: `updateEvent(eventId: string, input: UpdateEventInput): Promise<EventData>` — Task 10（`App.tsx`）會呼叫它

- [ ] **Step 1: import 新增 `UpdateEventInput`**

把：

```ts
import {
  EventData,
  CreateEventInput,
  SubmitResponseInput,
  FinalizeEventInput,
  SubmitCommentInput,
  EventMode,
} from "../types.js";
```

改成：

```ts
import {
  EventData,
  CreateEventInput,
  SubmitResponseInput,
  FinalizeEventInput,
  SubmitCommentInput,
  UpdateEventInput,
  EventMode,
} from "../types.js";
```

- [ ] **Step 2: 新增 `updateEvent()`**

在 `reopenEvent()` 函式之後（`// --- LOCAL STORAGE HELPERS --- //` 那行之前）插入：

```ts
export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<EventData> {
  const event = store.updateEvent(eventId, input);
  saveVisitedEvent(event);
  return event;
}
```

- [ ] **Step 3: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 4: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat(api): add updateEvent wrapper"
```

---

### Task 4: `VoteTab.tsx` — 密碼欄位與鎖定/解鎖邏輯

**Files:**
- Modify: `src/mobile/VoteTab.tsx`

**Interfaces:**
- Consumes: `SubmitResponseInput.password`（Task 1）；`onSubmit` prop 簽章不變（`(input: SubmitResponseInput) => Promise<void>`）
- Produces: 無其他任務依賴此檔案的內部實作（`EventScreen.tsx`/`EventView.tsx` 呼叫 `<VoteTab>` 的方式不變）

- [ ] **Step 1: 新增 `password` state 與比對邏輯，取代原本的暱稱比對 `useEffect`**

把：

```tsx
export const VoteTab: React.FC<VoteTabProps> = ({ event, nickname, setNickname, email, setEmail, onSubmit, isLoading, onSubmitted }) => {
  const [comment, setComment] = useState("");
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [bulkTargetKey, setBulkTargetKey] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [calActiveDate, setCalActiveDate] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = nickname.trim();
    const existing = trimmed
      ? event.responses.find((r) => r.nickname.toLowerCase() === trimmed.toLowerCase())
      : undefined;
    if (existing) {
      setEditingParticipantId(existing.id);
      setAvailability(existing.availability || {});
      if (existing.email) setEmail(existing.email);
      if (existing.comment) setComment(existing.comment);
    } else {
      setEditingParticipantId(null);
      const initial: Record<string, AvailabilityStatus> = {};
      event.slots.forEach((s) => (initial[s.id] = "available"));
      setAvailability(initial);
    }
  }, [event.id, nickname]);
```

改成：

```tsx
export const VoteTab: React.FC<VoteTabProps> = ({ event, nickname, setNickname, email, setEmail, onSubmit, isLoading, onSubmitted }) => {
  const [comment, setComment] = useState("");
  const [password, setPassword] = useState("");
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [bulkTargetKey, setBulkTargetKey] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [calActiveDate, setCalActiveDate] = useState<string | null>(null);

  const trimmedNickname = nickname.trim();
  const matchedExisting = trimmedNickname
    ? event.responses.find((r) => r.nickname.toLowerCase() === trimmedNickname.toLowerCase())
    : undefined;
  const needsPassword = !!matchedExisting?.password;
  // 比對到的既有回覆有設密碼、但目前輸入的密碼不相符時鎖定：不自動帶入既有作答
  // 內容（避免沒輸對密碼就看到別人的勾選結果），送出按鈕也會被鎖住。
  const isLocked = needsPassword && password !== matchedExisting?.password;

  useEffect(() => {
    if (matchedExisting && !isLocked) {
      setEditingParticipantId(matchedExisting.id);
      setAvailability(matchedExisting.availability || {});
      if (matchedExisting.email) setEmail(matchedExisting.email);
      if (matchedExisting.comment) setComment(matchedExisting.comment);
    } else if (!matchedExisting) {
      setEditingParticipantId(null);
      const initial: Record<string, AvailabilityStatus> = {};
      event.slots.forEach((s) => (initial[s.id] = "available"));
      setAvailability(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, trimmedNickname, isLocked]);
```

- [ ] **Step 2: 送出時帶入密碼、鎖定時擋下送出**

把：

```tsx
  const handleSubmit = async () => {
    if (!nickname.trim()) return;
    try {
      await onSubmit({
        participantId: editingParticipantId || undefined,
        nickname: nickname.trim(),
        email: email.trim(),
        availability,
        comment: comment.trim(),
      });
      onSubmitted?.();
    } catch {
      // onSubmit already surfaces the failure (e.g. an error toast); nothing more to do here.
    }
  };
```

改成：

```tsx
  const handleSubmit = async () => {
    if (!nickname.trim() || isLocked) return;
    try {
      await onSubmit({
        participantId: editingParticipantId || undefined,
        nickname: nickname.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        availability,
        comment: comment.trim(),
      });
      onSubmitted?.();
    } catch {
      // onSubmit already surfaces the failure (e.g. an error toast); nothing more to do here.
    }
  };
```

- [ ] **Step 3: 新增密碼輸入欄位與鎖定提示（Email 欄位之後）**

把：

```tsx
      <Input size="sm" label="您的暱稱" required placeholder="例如：小明" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      <Input size="sm" label="聯絡 Email" placeholder="例如：name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
```

改成：

```tsx
      <Input size="sm" label="您的暱稱" required placeholder="例如：小明" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      <Input size="sm" label="聯絡 Email" placeholder="例如：name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        size="sm"
        label="密碼（選填）"
        placeholder={needsPassword ? "此暱稱已有人使用，請輸入密碼" : "設定密碼可在其他裝置回來編輯"}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {isLocked && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: 10, borderRadius: "var(--radius-md)", background: "var(--color-hot-subtle)", border: "1px solid rgba(214,48,60,0.25)" }}>
          <AlertTriangle size={14} color="var(--color-hot)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: "var(--color-ink)", lineHeight: 1.5 }}>
            密碼不正確，暫時無法查看或編輯這個暱稱的既有回覆。
          </span>
        </div>
      )}
```

- [ ] **Step 4: 鎖定時停用勾選（兩處 `VoteRow` 呼叫）**

把（清單檢視內）：

```tsx
                  <VoteRow
                    key={s.id}
                    slot={s}
                    status={status}
                    onChange={handleChange}
                    primaryText={isDateOnly ? `${date} (${formatChineseWeekday(date)})` : undefined}
                    disabled={votingClosed}
                  />
```

改成：

```tsx
                  <VoteRow
                    key={s.id}
                    slot={s}
                    status={status}
                    onChange={handleChange}
                    primaryText={isDateOnly ? `${date} (${formatChineseWeekday(date)})` : undefined}
                    disabled={votingClosed || isLocked}
                  />
```

把（行事曆檢視內）：

```tsx
                  <VoteRow
                    key={s.id}
                    slot={s}
                    status={status}
                    onChange={handleChange}
                    primaryText={isDateOnly ? `${calActiveDate} (${formatChineseWeekday(calActiveDate)})` : undefined}
                    disabled={votingClosed}
                  />
```

改成：

```tsx
                  <VoteRow
                    key={s.id}
                    slot={s}
                    status={status}
                    onChange={handleChange}
                    primaryText={isDateOnly ? `${calActiveDate} (${formatChineseWeekday(calActiveDate)})` : undefined}
                    disabled={votingClosed || isLocked}
                  />
```

- [ ] **Step 5: 鎖定時停用送出按鈕**

把：

```tsx
      <Button variant="dark" fullWidth disabled={!nickname.trim() || isLoading || votingClosed} onClick={handleSubmit}>
```

改成：

```tsx
      <Button variant="dark" fullWidth disabled={!nickname.trim() || isLoading || votingClosed || isLocked} onClick={handleSubmit}>
```

- [ ] **Step 6: 型別檢查**

執行：`npm run lint`
預期：通過（`AlertTriangle` 已經在檔案原本的 import 裡，不需要新增 import）

- [ ] **Step 7: 手動驗證（dev server）**

啟動 `npm run dev`，開啟任一 demo 活動的勾選頁面：

1. 輸入一個全新暱稱（demo 資料裡沒有的），設定密碼「1234」，勾選任意時段後送出——應該成功，不出現鎖定提示
2. 重新整理頁面（或換一個瀏覽器分頁開同一個活動），再次輸入剛剛那個暱稱、密碼留空——應該出現「密碼不正確」提示，勾選格子跟送出按鈕都是鎖定/disabled 狀態
3. 輸入正確密碼「1234」——鎖定提示消失，剛剛的勾選內容正確帶入，可以編輯並送出
4. 輸入一個 demo 種子資料裡本來就存在、但沒設密碼的暱稱（例如「小明」）——應該維持現行行為：直接帶入既有作答內容，不需密碼即可編輯送出

- [ ] **Step 8: Commit**

```bash
git add src/mobile/VoteTab.tsx
git commit -m "feat(vote-tab): add optional password field with lock-until-match behavior"
```

---

### Task 5: `EditEventModal.tsx` — 主辦人編輯活動資訊 Modal

**Files:**
- Create: `src/mobile/EditEventModal.tsx`

**Interfaces:**
- Consumes: `EventData`、`EventLocation`、`UpdateEventInput`（Task 1）；`getNowLocalValue`/`isoToLocalValue`/`localValueToIso`（`src/lib/eventStatus.ts`，既有）；`parseLocationInput`/`extractPlaceNameFromFullUrl`/`mockResolveShortLink`（`src/lib/location.ts`，既有，子專案 D 已建立）
- Produces: `EditEventModal` 元件，props `{ event: EventData; isLoading?: boolean; onCancel: () => void; onConfirm: (input: Omit<UpdateEventInput, "hostToken">) => void }` — Task 6（`HeatmapTab.tsx`）會 import 並觸發它

此任務只新建檔案並型別檢查；因為還沒有任何地方觸發這個 Modal，功能性手動驗證留到 Task 6 接上 `HeatmapTab.tsx` 之後一併做。

- [ ] **Step 1: 建立 `src/mobile/EditEventModal.tsx`**

```tsx
import React, { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { EventData, EventLocation, UpdateEventInput } from "../types";
import { getNowLocalValue, isoToLocalValue, localValueToIso } from "../lib/eventStatus";
import { parseLocationInput, extractPlaceNameFromFullUrl, mockResolveShortLink } from "../lib/location";
import { Button, Input } from "../design-system/components";

interface EditEventModalProps {
  event: EventData;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: (input: Omit<UpdateEventInput, "hostToken">) => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({ event, isLoading, onCancel, onConfirm }) => {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || "");
  const [hostName, setHostName] = useState(event.hostName || "");
  const [hostEmail, setHostEmail] = useState(event.hostEmail || "");
  const [responseDeadline, setResponseDeadline] = useState(() => isoToLocalValue(event.responseDeadline));
  const [location, setLocation] = useState<EventLocation | undefined>(event.location);
  const [locationInput, setLocationInput] = useState(event.location?.text || "");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const locationRequestRef = useRef(0);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocationInput(raw);
    const requestId = ++locationRequestRef.current;
    const parsed = parseLocationInput(raw);

    if (!parsed) {
      setIsResolvingLocation(false);
      setLocation(raw.trim() ? { text: raw.trim() } : undefined);
      return;
    }

    if (!parsed.isShortLink) {
      setIsResolvingLocation(false);
      const name = extractPlaceNameFromFullUrl(parsed.url);
      setLocation({ text: name || raw.trim(), url: parsed.url });
      return;
    }

    setIsResolvingLocation(true);
    setLocation({ text: raw.trim(), url: parsed.url });
    mockResolveShortLink(parsed.url).then((name) => {
      if (locationRequestRef.current !== requestId) return;
      setIsResolvingLocation(false);
      setLocation({ text: name, url: parsed.url });
      setLocationInput(name);
    });
  };

  const handleConfirm = () => {
    if (!title.trim()) return;
    onConfirm({
      title: title.trim(),
      description: description.trim(),
      location,
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim(),
      responseDeadline: localValueToIso(responseDeadline),
    });
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200, overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 18, width: "100%", maxWidth: 380, maxHeight: "90%", overflowY: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Pencil size={15} />
          編輯活動資訊
        </div>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 14, lineHeight: 1.6 }}>
          候選時段無法在此修改；如需調整時段，請取消活動後重新建立。
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <Input label="活動名稱" required placeholder="例如：產品專案週對齊會議" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={30} />
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-ink)", display: "block", marginBottom: 6 }}>投票截止時間</label>
            <input
              type="datetime-local"
              value={responseDeadline}
              min={getNowLocalValue()}
              onChange={(e) => setResponseDeadline(e.target.value)}
              style={{ width: "100%", padding: "9px 10px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", fontSize: 13, fontWeight: 700 }}
            />
          </div>
          <Input label="主揪暱稱" placeholder="例如：阿傑、Wally" value={hostName} onChange={(e) => setHostName(e.target.value)} />
          <Input label="主揪 Email" placeholder="例如：host@example.com" type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
          <Input
            label="地點"
            placeholder="輸入地點，或貼上 Google Maps 連結"
            value={locationInput}
            onChange={handleLocationChange}
            hint={isResolvingLocation ? "解析地點中..." : location?.url ? "已附上 Google Maps 連結" : undefined}
          />
          <Input label="活動說明（選填）" placeholder="例如：想吃鍋物，歡迎推薦口袋名單" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="muted" fullWidth onClick={onCancel} disabled={isLoading}>取消</Button>
          <Button variant="dark" fullWidth disabled={!title.trim() || isLoading} onClick={handleConfirm}>儲存變更</Button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 3: Commit**

```bash
git add src/mobile/EditEventModal.tsx
git commit -m "feat(mobile): add EditEventModal for host to edit basic event info"
```

---

### Task 6: `HeatmapTab.tsx` — 吸收 `HostTab.tsx`、CTA 提示條降權

**Files:**
- Modify: `src/mobile/HeatmapTab.tsx`

**Interfaces:**
- Consumes: `UpdateEventInput`（Task 1）；`EditEventModal`（Task 5）；`ReopenModal`/`CancelEventModal`（既有，未變動）
- Produces: `HeatmapTabProps` 新增選填欄位 `isHost?`、`onFinalize?`、`onReopen?`、`onCancelEvent?`、`onUpdateEvent?`、`isLoading?` — Task 7／8（`EventScreen.tsx`／`EventView.tsx`）會傳入這些值

`HostTab.tsx` 在這個任務**先不刪除**（Task 7／8 把 `EventScreen.tsx`／`EventView.tsx` 的呼叫端都改完、確認沒有人再 import 它之後，才在 Task 8 一併刪除）——這樣任何一個中間步驟都不會有「檔案還在被 import 但邏輯已經搬走」的斷層。本任務只做型別檢查；因為 `EventScreen.tsx`／`EventView.tsx` 這時候都還沒有把 `isHost`/`onFinalize` 等新 props 傳進來（它們仍在呼叫舊的 `HostTab`），這個常駐主辦人區塊在真實畫面上還不會出現，功能性手動驗證留到 Task 7。

- [ ] **Step 1: import 新增圖示、元件、型別**

把：

```tsx
import React, { useState, useEffect } from "react";
import { Trophy, Medal, MessageCircle, BarChart3, CalendarDays, CalendarCheck, MapPin, User, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { EventData, SlotStats } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { computeSlotStats, formatSlotTime } from "../lib/slots";
import { getLifecycleStatus, formatDeadline, formatRemaining } from "../lib/eventStatus";
import { Avatar, Badge, Button } from "../design-system/components";
import { cardStyle, countInAdjacentMonth, MonthNavButton, SectionLabel, STATUS_META } from "./mobileStyles";
```

改成：

```tsx
import React, { useState, useEffect } from "react";
import { Trophy, Medal, MessageCircle, BarChart3, CalendarDays, CalendarCheck, MapPin, User, ChevronDown, ChevronUp, Clock, AlertTriangle, Ban } from "lucide-react";
import { EventData, SlotStats, UpdateEventInput } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { computeSlotStats, formatSlotTime } from "../lib/slots";
import { getLifecycleStatus, formatDeadline, formatRemaining } from "../lib/eventStatus";
import { Avatar, Badge, Button, Input } from "../design-system/components";
import { cardStyle, countInAdjacentMonth, MonthNavButton, SectionLabel, STATUS_META } from "./mobileStyles";
import { ReopenModal } from "./ReopenModal";
import { CancelEventModal } from "./CancelEventModal";
import { EditEventModal } from "./EditEventModal";
```

- [ ] **Step 2: `HeatmapTabProps` 新增主辦人相關選填 props**

把：

```tsx
interface HeatmapTabProps {
  event: EventData;
  userNickname: string;
  onGoToVote: () => void;
}
```

改成：

```tsx
interface HeatmapTabProps {
  event: EventData;
  userNickname: string;
  onGoToVote: () => void;
  isHost?: boolean;
  onFinalize?: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen?: (newDeadline?: string) => Promise<void>;
  onCancelEvent?: () => Promise<void>;
  onUpdateEvent?: (input: Omit<UpdateEventInput, "hostToken">) => Promise<void>;
  isLoading?: boolean;
}
```

- [ ] **Step 3: 元件簽章解構新 props、新增主辦人相關 state**

把：

```tsx
export const HeatmapTab: React.FC<HeatmapTabProps> = ({ event, userNickname, onGoToVote }) => {
  const [distMode, setDistMode] = useState<"bar" | "calendar">("bar");
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [calActiveDate, setCalActiveDate] = useState<string | null>(null);
  const [showAllTop, setShowAllTop] = useState(false);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const toggleExpand = (id: string) => setExpandedSlotId((cur) => (cur === id ? null : id));
  const stats = computeSlotStats(event.slots, event.responses);
```

改成：

```tsx
export const HeatmapTab: React.FC<HeatmapTabProps> = ({
  event,
  userNickname,
  onGoToVote,
  isHost,
  onFinalize,
  onReopen,
  onCancelEvent,
  onUpdateEvent,
  isLoading,
}) => {
  const [distMode, setDistMode] = useState<"bar" | "calendar">("bar");
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [calActiveDate, setCalActiveDate] = useState<string | null>(null);
  const [showAllTop, setShowAllTop] = useState(false);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const toggleExpand = (id: string) => setExpandedSlotId((cur) => (cur === id ? null : id));
  // 主辦人操作區塊的 state（原本是 HostTab.tsx 的內容，併入這個檔案）
  const [selectedFinalSlotId, setSelectedFinalSlotId] = useState<string | undefined>(event.slots[0]?.id);
  const noteDefaultLines = [
    event.location ? `地點：${event.location.text}` : null,
    event.description ? `備註：${event.description}` : null,
  ].filter((line): line is string => line !== null);
  const [finalNote, setFinalNote] = useState(noteDefaultLines.join("\n"));
  const [confirmingFinalize, setConfirmingFinalize] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editing, setEditing] = useState(false);
  const stats = computeSlotStats(event.slots, event.responses);
```

- [ ] **Step 4: CTA 提示條從大卡片降級成細長提示條**

把：

```tsx
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--color-primary-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <CalendarCheck size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)" }}>
              {hasResponded ? "已收到您的時間紀錄" : "還沒有勾選您的時間？"}
            </div>
            <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 1 }}>
              {hasResponded ? "隨時可以回來更新" : "花 30 秒勾選，讓大家更快敲定時間"}
            </div>
          </div>
        </div>
        <Button variant="hot" size="sm" onClick={onGoToVote}>{hasResponded ? "更新時間" : "我要勾選時間"}</Button>
      </div>
```

改成：

```tsx
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-cream)", border: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, fontSize: 11, fontWeight: 700, color: "var(--color-muted)" }}>
          <CalendarCheck size={13} color="var(--color-muted)" style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {hasResponded ? "已收到您的時間紀錄，隨時可以回來更新" : "還沒有勾選您的時間？花 30 秒讓大家更快敲定"}
          </span>
        </div>
        <button
          onClick={onGoToVote}
          style={{ flexShrink: 0, border: "none", background: "none", color: "var(--color-primary)", fontSize: 11, fontWeight: 800, cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}
        >
          {hasResponded ? "更新時間" : "我要勾選時間"}
        </button>
      </div>
```

- [ ] **Step 5: 「已填寫名冊」卡片之後、元件結尾的 `</div>` 之前，新增主辦人常駐區塊與相關 Modal**

把（檔案結尾部分）：

```tsx
      <div style={cardStyle}>
        <SectionLabel title={`已填寫名冊 (${event.responses.length} 人)`} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {event.responses.map((r) => {
            const availCount = Object.values(r.availability).filter((v) => v === "available").length;
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: "var(--radius-md)", background: "var(--color-cream)" }}>
                <Avatar name={r.nickname} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>
                    {r.nickname}
                    {r.nickname === userNickname && <span style={{ fontSize: 9, marginLeft: 6, color: "var(--color-primary)" }}>(您)</span>}
                  </div>
                  {r.comment && (
                    <div style={{ fontSize: 10, color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                      <MessageCircle size={10} />
                      {r.comment}
                    </div>
                  )}
                </div>
                <Badge variant="success" size="sm">{availCount}/{event.slots.length}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

改成：

```tsx
      <div style={cardStyle}>
        <SectionLabel title={`已填寫名冊 (${event.responses.length} 人)`} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {event.responses.map((r) => {
            const availCount = Object.values(r.availability).filter((v) => v === "available").length;
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: "var(--radius-md)", background: "var(--color-cream)" }}>
                <Avatar name={r.nickname} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>
                    {r.nickname}
                    {r.nickname === userNickname && <span style={{ fontSize: 9, marginLeft: 6, color: "var(--color-primary)" }}>(您)</span>}
                  </div>
                  {r.comment && (
                    <div style={{ fontSize: 10, color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                      <MessageCircle size={10} />
                      {r.comment}
                    </div>
                  )}
                </div>
                <Badge variant="success" size="sm">{availCount}/{event.slots.length}</Badge>
              </div>
            );
          })}
        </div>
      </div>

      {isHost && (
        <div style={cardStyle}>
          <SectionLabel title="主揪操作" hint="拍板定案、管理活動" />
          {lifecycle.key === "voting_closed" && onReopen && (
            <div style={{ marginBottom: 12, padding: 10, borderRadius: "var(--radius-md)", background: "var(--color-hot-subtle)", border: "1px solid rgba(214,48,60,0.25)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <AlertTriangle size={16} color="var(--color-hot)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)" }}>投票已於 {formatDeadline(event.responseDeadline)} 截止</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>參與者暫時無法再送出新的時間，可以重新開放投票或直接拍板定案。</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <Button variant="hot" size="sm" fullWidth onClick={() => setReopening(true)}>重新開放投票</Button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {event.slots.map((s) => {
              const st = stats.find((x) => x.slotId === s.id)!;
              const active = selectedFinalSlotId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedFinalSlotId(s.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 10px",
                    borderRadius: "var(--radius-md)",
                    border: active ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                    background: active ? "var(--color-primary)" : "#fff",
                    color: active ? "#fff" : "var(--color-ink)",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>
                      {s.date} ({formatChineseWeekday(s.date)}){!isDateOnly && ` · ${formatSlotTime(s.time)}`}
                    </div>
                    {s.label && <div style={{ fontSize: 10, opacity: 0.8 }}>{s.label}</div>}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: "var(--radius-pill)",
                      background: active ? "rgba(255,255,255,0.25)" : "rgba(90,158,90,0.15)",
                      color: active ? "#fff" : "var(--color-success)",
                    }}
                  >
                    {st.availableCount} 人出席
                  </span>
                </div>
              );
            })}
          </div>
          <Input label="定案備註" placeholder="例如：訂位阿傑，18:00 集合" value={finalNote} onChange={(e) => setFinalNote(e.target.value)} />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <Button variant="dark" fullWidth disabled={!selectedFinalSlotId || isLoading} onClick={() => setConfirmingFinalize(true)}>
              確認最終時間並定案
            </Button>
            <Button variant="muted" fullWidth disabled={isLoading} onClick={() => setEditing(true)}>
              編輯活動資訊
            </Button>
          </div>
          {onCancelEvent && (
            <div style={{ marginTop: 12, padding: 10, borderRadius: "var(--radius-md)", background: "var(--color-error-subtle)", border: "1px solid rgba(232,54,26,0.25)" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-ink)", marginBottom: 2 }}>危險操作</div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 10 }}>取消後活動將無法復原，所有人都會看到取消狀態。</div>
              <Button variant="hot" fullWidth disabled={isLoading} onClick={() => setCancelling(true)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Ban size={13} />
                  取消活動
                </span>
              </Button>
            </div>
          )}
        </div>
      )}

      {reopening && onReopen && (
        <ReopenModal
          currentDeadline={event.responseDeadline}
          onCancel={() => setReopening(false)}
          onConfirm={(newDeadline) => {
            setReopening(false);
            onReopen(newDeadline);
          }}
        />
      )}
      {cancelling && onCancelEvent && (
        <CancelEventModal
          eventTitle={event.title}
          isLoading={isLoading}
          onCancel={() => setCancelling(false)}
          onConfirm={() => {
            setCancelling(false);
            onCancelEvent();
          }}
        />
      )}
      {editing && onUpdateEvent && (
        <EditEventModal
          event={event}
          isLoading={isLoading}
          onCancel={() => setEditing(false)}
          onConfirm={(input) => {
            setEditing(false);
            onUpdateEvent(input);
          }}
        />
      )}
      {confirmingFinalize && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 18, width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>確認要拍板定案嗎？</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 14, lineHeight: 1.6 }}>
              定案後活動將轉為「已敲定通知模式」，暫停開放新投票。
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="muted" fullWidth onClick={() => setConfirmingFinalize(false)}>返回修改</Button>
              <Button
                variant="hot"
                fullWidth
                onClick={() => {
                  setConfirmingFinalize(false);
                  if (selectedFinalSlotId && onFinalize) onFinalize(selectedFinalSlotId, finalNote);
                }}
              >
                拍板確定
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

`position: absolute; inset: 0` 這幾個 Modal 能正確蓋滿整個活動頁面卡片，是因為 `EventScreen.tsx`／`EventView.tsx` 的外層容器本來就是 `position: relative`（`HostTab.tsx` 原本就是靠這個機制運作，搬過來後不用額外調整）。

- [ ] **Step 6: 型別檢查**

執行：`npm run lint`
預期：通過。`isDateOnly`／`lifecycle`／`stats` 這幾個變數本來就在檔案上半部定義過，這裡是重複使用，不用新增。

- [ ] **Step 7: Commit**

```bash
git add src/mobile/HeatmapTab.tsx
git commit -m "feat(heatmap-tab): absorb HostTab into a persistent host panel, de-emphasize vote CTA"
```

---

### Task 7: `EventScreen.tsx`（行動版）— 移除 Tab 列，改成推導式路由

**Files:**
- Modify: `src/mobile/EventScreen.tsx`

**Interfaces:**
- Consumes: `HeatmapTab` 新 props（Task 6）
- Produces: `EventScreenProps` 新增選填 `onUpdateEvent`；`initialTab` 型別收斂成 `"vote" | "heatmap"` — Task 9（`MobileApp.tsx`）需要對應調整

- [ ] **Step 1: import 拿掉 `HostTab`、新增 `UpdateEventInput`**

把：

```tsx
import React, { useState, useEffect } from "react";
import { Users, Share2, History, Plus, Clock, CalendarDays } from "lucide-react";
import { EventData, SubmitResponseInput, SubmitCommentInput } from "../types";
import { getUserNickname, getUserEmail } from "../lib/api";
import { getLifecycleStatus } from "../lib/eventStatus";
import { Badge, Tag } from "../design-system/components";
import { TopBar } from "./TopBar";
import { VoteTab } from "./VoteTab";
import { HeatmapTab } from "./HeatmapTab";
import { HostTab } from "./HostTab";
import { FinalizedView } from "./FinalizedView";
import { CancelledView } from "./CancelledView";
import { CommentBoard } from "./CommentBoard";
import { iconBtnStyle } from "./mobileStyles";
```

改成：

```tsx
import React, { useState, useEffect } from "react";
import { Users, Share2, History, Plus, Clock, CalendarDays } from "lucide-react";
import { EventData, SubmitResponseInput, SubmitCommentInput, UpdateEventInput } from "../types";
import { getUserNickname, getUserEmail } from "../lib/api";
import { getLifecycleStatus } from "../lib/eventStatus";
import { Badge } from "../design-system/components";
import { TopBar } from "./TopBar";
import { VoteTab } from "./VoteTab";
import { HeatmapTab } from "./HeatmapTab";
import { FinalizedView } from "./FinalizedView";
import { CancelledView } from "./CancelledView";
import { CommentBoard } from "./CommentBoard";
import { iconBtnStyle } from "./mobileStyles";
```

（`Tag` 拿掉是因為它只被 Step 4 移除的註解掉 Tag 區塊用到；`Clock`／`CalendarDays` 保留，因為 import 清單本身沒有壞處，且不是本次改動焦點——如果 Step 6 的型別檢查對這兩個顯示「已宣告但未使用」，再一併拿掉即可。）

- [ ] **Step 2: `EventScreenProps` 新增 `onUpdateEvent`、`initialTab` 型別收斂**

把：

```tsx
interface EventScreenProps {
  event: EventData;
  isHost: boolean;
  initialTab?: "vote" | "heatmap" | "host";
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: (newDeadline?: string) => Promise<void>;
  onCancelEvent: () => Promise<void>;
  onSubmitComment: (input: SubmitCommentInput) => Promise<void>;
  onNewEvent: () => void;
  onOpenShare: () => void;
  onOpenHistory: () => void;
  onCopySuccess: () => void;
  isLoading: boolean;
}

const TABS: { id: "vote" | "heatmap" | "host"; label: string }[] = [
  { id: "heatmap", label: "熱點圖" },
  { id: "vote", label: "勾選時間" },
  { id: "host", label: "主揪定案" },
];
```

改成：

```tsx
interface EventScreenProps {
  event: EventData;
  isHost: boolean;
  initialTab?: "vote" | "heatmap";
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: (newDeadline?: string) => Promise<void>;
  onCancelEvent: () => Promise<void>;
  onUpdateEvent?: (input: Omit<UpdateEventInput, "hostToken">) => Promise<void>;
  onSubmitComment: (input: SubmitCommentInput) => Promise<void>;
  onNewEvent: () => void;
  onOpenShare: () => void;
  onOpenHistory: () => void;
  onCopySuccess: () => void;
  isLoading: boolean;
}
```

- [ ] **Step 3: `tab` state 改成推導式 `view` state**

把：

```tsx
export const EventScreen: React.FC<EventScreenProps> = ({
  event,
  isHost,
  initialTab,
  onRespond,
  onFinalize,
  onReopen,
  onCancelEvent,
  onSubmitComment,
  onNewEvent,
  onOpenShare,
  onOpenHistory,
  onCopySuccess,
  isLoading,
}) => {
  const [tab, setTab] = useState<"vote" | "heatmap" | "host">(initialTab && (initialTab !== "host" || isHost) ? initialTab : "heatmap");
  const [nickname, setNickname] = useState(() => getUserNickname());
  const [email, setEmail] = useState(() => getUserEmail());

  // Re-apply the requested tab whenever the URL asks for one — covers not just the
  // first mount but also navigating here via a hash-only change (e.g. pasting the
  // participant link while the app is already open in the same tab).
  useEffect(() => {
    if (initialTab && (initialTab !== "host" || isHost)) {
      setTab(initialTab);
    }
  }, [event.id, initialTab, isHost]);

  const visibleTabs = isHost ? TABS : TABS.filter((t) => t.id !== "host");
  const lifecycle = getLifecycleStatus(event);
```

改成：

```tsx
export const EventScreen: React.FC<EventScreenProps> = ({
  event,
  isHost,
  initialTab,
  onRespond,
  onFinalize,
  onReopen,
  onCancelEvent,
  onUpdateEvent,
  onSubmitComment,
  onNewEvent,
  onOpenShare,
  onOpenHistory,
  onCopySuccess,
  isLoading,
}) => {
  const [nickname, setNickname] = useState(() => getUserNickname());
  const [email, setEmail] = useState(() => getUserEmail());

  // 主辦人一律優先看熱點圖（現在也是主辦人操作面板）；已識別的參與者（本機暱稱
  // 比對到既有回覆）也直接進熱點圖；全新訪客強制先進識別＋勾選畫面。
  const isIdentifiedParticipant =
    !isHost &&
    !!nickname.trim() &&
    event.responses.some((r) => r.nickname.toLowerCase() === nickname.trim().toLowerCase());
  const defaultView: "identify_vote" | "heatmap" = isHost || isIdentifiedParticipant ? "heatmap" : "identify_vote";
  const [view, setView] = useState<"identify_vote" | "heatmap">(
    initialTab === "vote" ? "identify_vote" : initialTab === "heatmap" ? "heatmap" : defaultView
  );

  // Re-apply the requested view whenever the URL asks for one — covers not just the
  // first mount but also navigating here via a hash-only change (e.g. pasting the
  // participant link while the app is already open in the same tab).
  useEffect(() => {
    if (initialTab === "vote") setView("identify_vote");
    else if (initialTab === "heatmap") setView("heatmap");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, initialTab]);

  const lifecycle = getLifecycleStatus(event);
```

- [ ] **Step 4: 移除 Tab 按鈕列，只保留狀態列**

把：

```tsx
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 16px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", flexShrink: 0, overflowX: "auto" }}>
        {event.status === "active" && (
          <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  position: "relative",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "9px 0",
                  fontSize: 12,
                  fontWeight: 800,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: tab === t.id ? "var(--color-primary)" : "var(--color-muted)",
                }}
              >
                {t.label}
                {tab === t.id && (
                  <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, background: "var(--color-primary)" }} />
                )}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 0", flexShrink: 0, marginLeft: "auto" }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: lifecycle.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: lifecycle.color, whiteSpace: "nowrap" }}>{lifecycle.label}</span>
          <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.sublabel}</Badge>
          {/* <Tag size="sm" emoji={event.mode === "date_only" ? <CalendarDays size={12} /> : <Clock size={12} />}>
            {event.mode === "date_only" ? "僅選日期" : "含時段"}
          </Tag> */}
          {isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
        </div>
      </div>
```

改成：

```tsx
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", flexShrink: 0, overflowX: "auto" }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: lifecycle.color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: lifecycle.color, whiteSpace: "nowrap" }}>{lifecycle.label}</span>
        <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.sublabel}</Badge>
        {isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
      </div>
```

- [ ] **Step 5: 內容區改用 `view` 判斷，`HeatmapTab` 傳入主辦人相關 props**

把：

```tsx
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Tab-switchable block: whichever tab is active renders here. Comment board
              below is a separate block, outside this switch, so it never changes with the tab. */}
          <div>
            {tab === "vote" && (
              <VoteTab event={event} nickname={nickname} setNickname={setNickname} email={email} setEmail={setEmail} onSubmit={onRespond} isLoading={isLoading} onSubmitted={() => setTab("heatmap")} />
            )}
            {tab === "heatmap" && <HeatmapTab event={event} userNickname={nickname} onGoToVote={() => setTab("vote")} />}
            {tab === "host" && isHost && <HostTab event={event} onFinalize={onFinalize} onReopen={onReopen} onCancelEvent={onCancelEvent} isLoading={isLoading} />}
          </div>
          <div style={{ marginTop: 10, borderTop: "8px solid var(--color-cream)", padding: "16px 14px 14px" }}>
            <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
          </div>
        </div>
```

改成：

```tsx
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* view-switchable block: whichever view is active renders here. Comment board
              below is a separate block, outside this switch, so it never changes with the view. */}
          <div>
            {view === "identify_vote" && (
              <VoteTab event={event} nickname={nickname} setNickname={setNickname} email={email} setEmail={setEmail} onSubmit={onRespond} isLoading={isLoading} onSubmitted={() => setView("heatmap")} />
            )}
            {view === "heatmap" && (
              <HeatmapTab
                event={event}
                userNickname={nickname}
                onGoToVote={() => setView("identify_vote")}
                isHost={isHost}
                onFinalize={onFinalize}
                onReopen={onReopen}
                onCancelEvent={onCancelEvent}
                onUpdateEvent={onUpdateEvent}
                isLoading={isLoading}
              />
            )}
          </div>
          <div style={{ marginTop: 10, borderTop: "8px solid var(--color-cream)", padding: "16px 14px 14px" }}>
            <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
          </div>
        </div>
```

- [ ] **Step 6: 型別檢查**

執行：`npm run lint`
預期：通過。如果 `Clock`／`CalendarDays` 被標示未使用，把它們從 import 清單移除。

- [ ] **Step 7: 手動驗證（dev server，行動版 viewport）**

啟動 `npm run dev`，縮到手機寬度：

1. 用一個全新瀏覽器 profile（或先清空該站 localStorage）開啟任一 demo 活動的參與者連結（不帶 `hostToken`）——應該直接落在識別＋勾選畫面，畫面上完全看不到任何 Tab 按鈕
2. 填暱稱、勾選時段送出——應該自動跳到熱點圖畫面
3. 熱點圖畫面點「更新時間」——跳回識別＋勾選畫面，資料正確帶入
4. 重新整理頁面——因為暱稱已經比對得到剛剛送出的回覆，應該直接落在熱點圖（不再回到識別畫面）
5. 開啟同一個活動的**主揪連結**（帶 `hostToken`）——應該直接落在熱點圖，往下捲動可以看到「主揪操作」區塊（拍板定案時段選擇、定案備註、確認定案按鈕、「編輯活動資訊」按鈕、危險操作取消活動）
6. 選一個時段點「確認最終時間並定案」→ 確認彈窗 → 「拍板確定」——活動應該成功轉為已定案狀態（跟改動前的 `HostTab` 行為一致）
7. 用一個投票已截止的 demo 活動（`#event=demo-voting-closed&hostToken=demo-host-token-closed`）確認主揪操作區塊最上方會出現「重新開放投票」提示，點擊後彈出 `ReopenModal`，確認可以正常操作
8. 主揪操作區塊點「取消活動」→ 彈出 `CancelEventModal`，確認可以正常操作
9. 點「編輯活動資訊」——這一步預期**還不會有反應**（`onUpdateEvent` 要到 Task 9 才會真的接上），先確認沒有 JS 錯誤即可，不用擔心

- [ ] **Step 8: Commit**

```bash
git add src/mobile/EventScreen.tsx
git commit -m "feat(mobile): replace tab bar with derived identify/vote/heatmap routing"
```

---

### Task 8: `EventView.tsx`（桌面版）— 同 Task 7，並刪除 `HostTab.tsx`

**Files:**
- Modify: `src/components/EventView.tsx`
- Delete: `src/mobile/HostTab.tsx`

**Interfaces:**
- Consumes: `HeatmapTab` 新 props（Task 6）
- Produces: `EventViewProps` 新增選填 `onUpdateEvent`；`initialTab` 型別收斂成 `"vote" | "heatmap"` — Task 10（`App.tsx`）需要對應調整

此任務跟 Task 7 是完全相同的路由改動，套用到桌面版獨立實作的檔案上（單頁版面、沒有 wizard 分步，跟 Task 4/5 的 `CreateEvent.tsx` vs `CreateWizard.tsx` 是同一種「桌面/行動各自獨立、邏輯相同」關係）。做完這個任務，`EventScreen.tsx`（Task 7 已改完）與 `EventView.tsx`（本任務）都不再 import `HostTab`，所以本任務最後一步順便刪除 `HostTab.tsx`。

- [ ] **Step 1: import 拿掉 `HostTab`、新增 `UpdateEventInput`**

把：

```tsx
import React, { useState, useEffect } from "react";
import { Users, Share2, History, Plus, Clock, CalendarDays } from "lucide-react";
import { EventData, SubmitResponseInput, SubmitCommentInput } from "../types";
import { getUserNickname, getUserEmail } from "../lib/api";
import { getLifecycleStatus } from "../lib/eventStatus";
import { Badge, Tag } from "../design-system/components";
import { TopBar } from "../mobile/TopBar";
import { VoteTab } from "../mobile/VoteTab";
import { HeatmapTab } from "../mobile/HeatmapTab";
import { HostTab } from "../mobile/HostTab";
import { FinalizedView } from "../mobile/FinalizedView";
import { CancelledView } from "../mobile/CancelledView";
import { CommentBoard } from "../mobile/CommentBoard";
import { iconBtnStyle } from "../mobile/mobileStyles";
```

改成：

```tsx
import React, { useState, useEffect } from "react";
import { Users, Share2, History, Plus, Clock, CalendarDays } from "lucide-react";
import { EventData, SubmitResponseInput, SubmitCommentInput, UpdateEventInput } from "../types";
import { getUserNickname, getUserEmail } from "../lib/api";
import { getLifecycleStatus } from "../lib/eventStatus";
import { Badge } from "../design-system/components";
import { TopBar } from "../mobile/TopBar";
import { VoteTab } from "../mobile/VoteTab";
import { HeatmapTab } from "../mobile/HeatmapTab";
import { FinalizedView } from "../mobile/FinalizedView";
import { CancelledView } from "../mobile/CancelledView";
import { CommentBoard } from "../mobile/CommentBoard";
import { iconBtnStyle } from "../mobile/mobileStyles";
```

- [ ] **Step 2: `EventViewProps` 新增 `onUpdateEvent`、`initialTab` 型別收斂**

把：

```tsx
interface EventViewProps {
  event: EventData;
  hostToken?: string;
  initialTab?: "vote" | "heatmap" | "host";
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: (newDeadline?: string) => Promise<void>;
  onCancelEvent: () => Promise<void>;
  onSubmitComment: (input: SubmitCommentInput) => Promise<void>;
  onNewEvent: () => void;
  onOpenShareModal: () => void;
  onOpenHistory: () => void;
  onCopySuccess: () => void;
  isLoading: boolean;
}

const TABS: { id: "vote" | "heatmap" | "host"; label: string }[] = [
  { id: "heatmap", label: "熱點圖" },
  { id: "vote", label: "勾選時間" },
  { id: "host", label: "主揪定案" },
];
```

改成：

```tsx
interface EventViewProps {
  event: EventData;
  hostToken?: string;
  initialTab?: "vote" | "heatmap";
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: (newDeadline?: string) => Promise<void>;
  onCancelEvent: () => Promise<void>;
  onUpdateEvent?: (input: Omit<UpdateEventInput, "hostToken">) => Promise<void>;
  onSubmitComment: (input: SubmitCommentInput) => Promise<void>;
  onNewEvent: () => void;
  onOpenShareModal: () => void;
  onOpenHistory: () => void;
  onCopySuccess: () => void;
  isLoading: boolean;
}
```

- [ ] **Step 3: `tab` state 改成推導式 `view` state**

把：

```tsx
export const EventView: React.FC<EventViewProps> = ({
  event,
  hostToken,
  initialTab,
  onRespond,
  onFinalize,
  onReopen,
  onCancelEvent,
  onSubmitComment,
  onNewEvent,
  onOpenShareModal,
  onOpenHistory,
  onCopySuccess,
  isLoading,
}) => {
  const isHost = Boolean(hostToken && hostToken === event.hostToken);
  const [tab, setTab] = useState<"vote" | "heatmap" | "host">(initialTab && (initialTab !== "host" || isHost) ? initialTab : "heatmap");
  const [nickname, setNickname] = useState(() => getUserNickname());
  const [email, setEmail] = useState(() => getUserEmail());

  // Re-apply the requested tab whenever the URL asks for one — covers not just the
  // first mount but also navigating here via a hash-only change (e.g. pasting the
  // participant link while the app is already open in the same tab).
  useEffect(() => {
    if (initialTab && (initialTab !== "host" || isHost)) {
      setTab(initialTab);
    }
  }, [event.id, initialTab, isHost]);

  const visibleTabs = isHost ? TABS : TABS.filter((t) => t.id !== "host");
  const lifecycle = getLifecycleStatus(event);
```

改成：

```tsx
export const EventView: React.FC<EventViewProps> = ({
  event,
  hostToken,
  initialTab,
  onRespond,
  onFinalize,
  onReopen,
  onCancelEvent,
  onUpdateEvent,
  onSubmitComment,
  onNewEvent,
  onOpenShareModal,
  onOpenHistory,
  onCopySuccess,
  isLoading,
}) => {
  const isHost = Boolean(hostToken && hostToken === event.hostToken);
  const [nickname, setNickname] = useState(() => getUserNickname());
  const [email, setEmail] = useState(() => getUserEmail());

  const isIdentifiedParticipant =
    !isHost &&
    !!nickname.trim() &&
    event.responses.some((r) => r.nickname.toLowerCase() === nickname.trim().toLowerCase());
  const defaultView: "identify_vote" | "heatmap" = isHost || isIdentifiedParticipant ? "heatmap" : "identify_vote";
  const [view, setView] = useState<"identify_vote" | "heatmap">(
    initialTab === "vote" ? "identify_vote" : initialTab === "heatmap" ? "heatmap" : defaultView
  );

  // Re-apply the requested view whenever the URL asks for one — covers not just the
  // first mount but also navigating here via a hash-only change (e.g. pasting the
  // participant link while the app is already open in the same tab).
  useEffect(() => {
    if (initialTab === "vote") setView("identify_vote");
    else if (initialTab === "heatmap") setView("heatmap");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, initialTab]);

  const lifecycle = getLifecycleStatus(event);
```

- [ ] **Step 4: 移除 Tab 按鈕列，只保留狀態列**

把：

```tsx
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 20px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", overflowX: "auto" }}>
          {event.status === "active" && (
            <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    position: "relative",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    padding: "11px 0",
                    fontSize: 13,
                    fontWeight: 800,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: tab === t.id ? "var(--color-primary)" : "var(--color-muted)",
                  }}
                >
                  {t.label}
                  {tab === t.id && (
                    <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, background: "var(--color-primary)" }} />
                  )}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 0", flexShrink: 0, marginLeft: "auto" }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: lifecycle.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: lifecycle.color, whiteSpace: "nowrap" }}>{lifecycle.label}</span>
            <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.sublabel}</Badge>
            {/* <Tag size="sm" emoji={event.mode === "date_only" ? <CalendarDays size={12} /> : <Clock size={12} />}>
              {event.mode === "date_only" ? "僅選日期" : "含時段"}
            </Tag> */}
            {isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
          </div>
        </div>
```

改成：

```tsx
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", overflowX: "auto" }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: lifecycle.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: lifecycle.color, whiteSpace: "nowrap" }}>{lifecycle.label}</span>
          <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.sublabel}</Badge>
          {isHost && <Badge variant="secondary" size="sm">主揪</Badge>}
        </div>
```

- [ ] **Step 5: 內容區改用 `view` 判斷，`HeatmapTab` 傳入主辦人相關 props**

把：

```tsx
          <>
            {/* Tab-switchable block: whichever tab is active renders here. Comment board
                below is a separate block, outside this switch, so it never changes with the tab. */}
            <div>
              {tab === "vote" && (
                <VoteTab event={event} nickname={nickname} setNickname={setNickname} email={email} setEmail={setEmail} onSubmit={onRespond} isLoading={isLoading} onSubmitted={() => setTab("heatmap")} />
              )}
              {tab === "heatmap" && <HeatmapTab event={event} userNickname={nickname} onGoToVote={() => setTab("vote")} />}
              {tab === "host" && isHost && <HostTab event={event} onFinalize={onFinalize} onReopen={onReopen} onCancelEvent={onCancelEvent} isLoading={isLoading} />}
            </div>
            <div style={{ marginTop: 12, borderTop: "8px solid var(--color-cream)", padding: "20px 20px 20px" }}>
              <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
            </div>
          </>
```

改成：

```tsx
          <>
            {/* view-switchable block: whichever view is active renders here. Comment board
                below is a separate block, outside this switch, so it never changes with the view. */}
            <div>
              {view === "identify_vote" && (
                <VoteTab event={event} nickname={nickname} setNickname={setNickname} email={email} setEmail={setEmail} onSubmit={onRespond} isLoading={isLoading} onSubmitted={() => setView("heatmap")} />
              )}
              {view === "heatmap" && (
                <HeatmapTab
                  event={event}
                  userNickname={nickname}
                  onGoToVote={() => setView("identify_vote")}
                  isHost={isHost}
                  onFinalize={onFinalize}
                  onReopen={onReopen}
                  onCancelEvent={onCancelEvent}
                  onUpdateEvent={onUpdateEvent}
                  isLoading={isLoading}
                />
              )}
            </div>
            <div style={{ marginTop: 12, borderTop: "8px solid var(--color-cream)", padding: "20px 20px 20px" }}>
              <CommentBoard event={event} nickname={nickname} setNickname={setNickname} onSubmit={onSubmitComment} isLoading={isLoading} />
            </div>
          </>
```

- [ ] **Step 6: 刪除 `HostTab.tsx`**

確認 `EventScreen.tsx`（Task 7）與本檔案都已經不再 import `HostTab` 後：

```bash
git rm src/mobile/HostTab.tsx
```

- [ ] **Step 7: 型別檢查**

執行：`npm run lint`
預期：通過（`HostTab.tsx` 已刪除且沒有任何檔案 import 它）

- [ ] **Step 8: 手動驗證（dev server，桌面寬度瀏覽器視窗）**

跟 Task 7 Step 7 相同的 9 個檢查項目，這次用桌面寬度的瀏覽器視窗（走 `EventView.tsx`）。

- [ ] **Step 9: Commit**

```bash
git add src/components/EventView.tsx
git commit -m "feat(desktop): replace tab bar with derived identify/vote/heatmap routing, remove HostTab"
```

---

### Task 9: `MobileApp.tsx` — 轉傳 `onUpdateEvent`

**Files:**
- Modify: `src/mobile/MobileApp.tsx`

**Interfaces:**
- Consumes: `EventScreen` 新 prop `onUpdateEvent`（Task 7）
- Produces: `MobileAppProps` 新增必填 `onUpdateEvent`（`App.tsx` 一定會傳）；`initialTab` 型別收斂成 `"vote" | "heatmap" | null` — Task 10（`App.tsx`）依賴這個簽章

- [ ] **Step 1: import 新增 `UpdateEventInput`，`MobileAppProps` 新增 `onUpdateEvent`、`initialTab` 型別收斂**

把：

```tsx
import React from "react";
import { EventData, CreateEventInput, SubmitResponseInput, SubmitCommentInput, ToastMessage } from "../types";
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
  initialTab: "vote" | "heatmap" | "host" | null;
  isLoading: boolean;
  pageError: string | null;
  onGoHome: () => void;
  onCreateEvent: (input: CreateEventInput) => Promise<void>;
  onRespond: (input: SubmitResponseInput) => Promise<void>;
  onFinalize: (finalSlotId: string, finalNote?: string) => Promise<void>;
  onReopen: (newDeadline?: string) => Promise<void>;
  onCancelEvent: () => Promise<void>;
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
```

改成：

```tsx
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
  onUpdateEvent: (input: Omit<UpdateEventInput, "hostToken">) => Promise<void>;
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
```

- [ ] **Step 2: 解構新 prop、轉傳給 `EventScreen`**

把：

```tsx
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
```

改成：

```tsx
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
```

把：

```tsx
          <EventScreen
            event={eventData}
            isHost={isHost}
            initialTab={initialTab || undefined}
            onRespond={onRespond}
            onFinalize={onFinalize}
            onReopen={onReopen}
            onCancelEvent={onCancelEvent}
            onSubmitComment={onSubmitComment}
            onNewEvent={onGoHome}
            onOpenShare={() => setIsShareModalOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onCopySuccess={onCopySuccess}
            isLoading={isLoading}
          />
```

改成：

```tsx
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
```

- [ ] **Step 3: 型別檢查**

執行：`npm run lint`
預期：目前應該會出現錯誤——`App.tsx` 呼叫 `<MobileApp>` 時還沒有傳 `onUpdateEvent`（`MobileAppProps.onUpdateEvent` 是必填）。這是預期中的過渡狀態，Task 10 會補上；先確認錯誤訊息就是「缺少 `onUpdateEvent` 這個 prop」，不是其他型別錯誤。

- [ ] **Step 4: Commit**

```bash
git add src/mobile/MobileApp.tsx
git commit -m "feat(mobile): forward onUpdateEvent prop from App to EventScreen"
```

---

### Task 10: `App.tsx` — `handleUpdateEvent`、拿掉 `"host"` tab 型別

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `api.updateEvent()`（Task 3）；`MobileAppProps.onUpdateEvent`（Task 9）；`EventViewProps.onUpdateEvent`（Task 8）
- Produces: 無其他任務依賴此檔案（這是整合鏈最上層）

- [ ] **Step 1: import 新增 `updateEvent`**

把：

```tsx
import {
  fetchEvent,
  createEvent,
  submitResponse,
  finalizeEvent,
  reopenEvent,
  cancelEvent,
  submitComment,
  getHostToken,
  getVisitedEvents,
  VisitedEventItem
} from "./lib/api";
```

改成：

```tsx
import {
  fetchEvent,
  createEvent,
  submitResponse,
  finalizeEvent,
  reopenEvent,
  cancelEvent,
  updateEvent,
  submitComment,
  getHostToken,
  getVisitedEvents,
  VisitedEventItem
} from "./lib/api";
```

同時把 `import { EventData, CreateEventInput, SubmitResponseInput, SubmitCommentInput, ToastMessage } from "./types";` 改成 `import { EventData, CreateEventInput, SubmitResponseInput, SubmitCommentInput, UpdateEventInput, ToastMessage } from "./types";`（新增 `UpdateEventInput`）。

- [ ] **Step 2: `initialTab` 型別拿掉 `"host"`**

把：

```tsx
  const [initialTab, setInitialTab] = useState<"vote" | "heatmap" | "host" | null>(null);
```

改成：

```tsx
  const [initialTab, setInitialTab] = useState<"vote" | "heatmap" | null>(null);
```

把：

```tsx
    const tabParam = params.get("tab");
    const tab: "vote" | "heatmap" | "host" | null =
      tabParam === "vote" || tabParam === "heatmap" || tabParam === "host" ? tabParam : null;
    return { eventId, token, tab };
```

改成：

```tsx
    const tabParam = params.get("tab");
    const tab: "vote" | "heatmap" | null =
      tabParam === "vote" || tabParam === "heatmap" ? tabParam : null;
    return { eventId, token, tab };
```

- [ ] **Step 3: 新增 `handleUpdateEvent`**

在 `handleCancelEvent` 函式之後（`handleSubmitComment` 之前）插入：

```tsx
  const handleUpdateEvent = async (input: Omit<UpdateEventInput, "hostToken">) => {
    if (!currentEventId || !currentHostToken) return;
    setIsLoading(true);
    try {
      const updated = await updateEvent(currentEventId, { hostToken: currentHostToken, ...input });
      setEventData(updated);
      addToast("success", "活動資訊已更新");
    } catch (err: any) {
      addToast("error", err.message || "更新活動資訊失敗");
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 4: 傳給 `MobileApp`**

把：

```tsx
      <MobileApp
        currentEventId={currentEventId}
        eventData={eventData}
        currentHostToken={currentHostToken}
        initialTab={initialTab}
        isLoading={isLoading}
        pageError={pageError}
        onGoHome={handleGoHome}
        onCreateEvent={handleCreateEvent}
        onRespond={handleRespond}
        onFinalize={handleFinalize}
        onReopen={handleReopen}
        onCancelEvent={handleCancelEvent}
        onSubmitComment={handleSubmitComment}
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
```

改成：

```tsx
      <MobileApp
        currentEventId={currentEventId}
        eventData={eventData}
        currentHostToken={currentHostToken}
        initialTab={initialTab}
        isLoading={isLoading}
        pageError={pageError}
        onGoHome={handleGoHome}
        onCreateEvent={handleCreateEvent}
        onRespond={handleRespond}
        onFinalize={handleFinalize}
        onReopen={handleReopen}
        onCancelEvent={handleCancelEvent}
        onUpdateEvent={handleUpdateEvent}
        onSubmitComment={handleSubmitComment}
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
```

- [ ] **Step 5: 傳給 `EventView`**

把：

```tsx
          <EventView
            event={eventData}
            hostToken={currentHostToken || undefined}
            initialTab={initialTab || undefined}
            onRespond={handleRespond}
            onFinalize={handleFinalize}
            onReopen={handleReopen}
            onCancelEvent={handleCancelEvent}
            onSubmitComment={handleSubmitComment}
            onNewEvent={handleGoHome}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onCopySuccess={() => addToast("success", "已成功複製到剪貼簿！")}
            isLoading={isLoading}
          />
```

改成：

```tsx
          <EventView
            event={eventData}
            hostToken={currentHostToken || undefined}
            initialTab={initialTab || undefined}
            onRespond={handleRespond}
            onFinalize={handleFinalize}
            onReopen={handleReopen}
            onCancelEvent={handleCancelEvent}
            onUpdateEvent={handleUpdateEvent}
            onSubmitComment={handleSubmitComment}
            onNewEvent={handleGoHome}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onCopySuccess={() => addToast("success", "已成功複製到剪貼簿！")}
            isLoading={isLoading}
          />
```

- [ ] **Step 6: 型別檢查**

執行：`npm run lint`
預期：通過（Task 9 遺留的「缺少 `onUpdateEvent`」錯誤這裡應該消失）

- [ ] **Step 7: 手動驗證（dev server，桌面 + 行動兩種 viewport 都要做）**

1. 主揪連結開熱點圖頁面，點「編輯活動資訊」→ 彈出 `EditEventModal`，修改標題／地點／截止時間／說明，點「儲存變更」——彈窗關閉、頁面上的活動資訊（標題、活動資訊卡片裡的地點/說明、投票截止時間）應該立即反映新內容，且出現「活動資訊已更新」的成功提示
2. 確認候選時段沒有跟著被清空或改變（`updateEvent` 不動 `slots`）；已投票者的 `availability` 資料不受影響
3. 開瀏覽器 console 執行 `JSON.parse(localStorage.getItem("gathertime_events_db"))`，確認剛剛編輯的活動物件裡新資料已正確寫入、`slots`/`responses` 陣列跟編輯前一樣
4. 把標題清空後點「儲存變更」——應該被 `localEventStore.updateEvent()` 擋下（Modal 裡儲存按鈕本來就因為 `!title.trim()` disabled，這步驟主要是確認前端擋得住，不會送出空標題）
5. 完整走一遍 Task 7 Step 7 跟 Task 8 Step 8 列的所有情境，確認整合後沒有任何一步壞掉（識別＋勾選 → 熱點圖、密碼保護暱稱鎖定/解鎖、主揪拍板定案/重新開放/取消活動/編輯活動資訊，桌面版跟行動版都要各走一遍）

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): wire handleUpdateEvent end-to-end, drop host tab param"
```

---

## Self-Review

**Spec coverage：**
- #6 無登入識別（暱稱＋選填密碼、勾選前強制識別、送出後直接進熱點圖、取消 vote/heatmap Tab）→ Task 1/2/4/7/8 ✅
- #7 主辦人定案按鈕整合進熱點圖，不用獨立 Tab → Task 6/7/8 ✅
- #10 主辦人編輯活動基本資訊（不含候選時段）→ Task 1/2/3/5/6/7/8/9/10 ✅
- #12 修正熱點圖視覺重心（CTA 提示條降權 + 未識別訪客不會先看到熱點圖）→ Task 6（降權）+ Task 7/8（路由，未識別訪客直接落在識別畫面）✅

**Placeholder scan：** 無 TBD／TODO；每個 Step 都是可直接套用的完整程式碼，沒有「similar to Task N」這種偷懶引用（Task 8 明確標註「跟 Task 7 是完全相同的路由改動」但仍然把桌面版對應的完整程式碼寫出來，不是只寫這句話帶過）。

**Type consistency：** `password?: string`（Task 1）在 Task 2（`localEventStore.ts`）、Task 4（`VoteTab.tsx`）都用同樣欄位名稱存取；`UpdateEventInput`（Task 1）在 Task 2/3/5/6/7/8/9/10 全部用同樣的欄位名稱（`title`/`description`/`location`/`hostName`/`hostEmail`/`responseDeadline`），`onUpdateEvent` 的簽章 `(input: Omit<UpdateEventInput, "hostToken">) => Promise<void>` 在 `HeatmapTabProps`（Task 6）、`EventScreenProps`（Task 7）、`EventViewProps`（Task 8）、`MobileAppProps`（Task 9）、`App.tsx` 的 `handleUpdateEvent`（Task 10）全部一致，沒有簽章不符的狀況。`EditEventModal` 的 `onConfirm` 簽章跟 `HeatmapTab` 呼叫它的地方（Task 6 Step 5）也一致。

---

## 執行方式

Plan complete and saved to `docs/ux-feedback-2026-08/subproject-B-plan.md`. 兩種執行方式：

**1. Subagent-Driven（推薦）** — 每個 Task 派一個全新 subagent 執行，任務間人工 review，速度快

**2. Inline Execution** — 在目前這個 session 裡照順序執行，批次執行＋checkpoint 讓你 review

要用哪一種？
