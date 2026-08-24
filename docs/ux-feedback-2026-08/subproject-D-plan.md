# 子專案 D 實作計畫 — 建立活動流程優化

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除建立活動流程中的模式 Tab（改成「+ 新增時段」按鈕升級模式），並新增支援 Google Maps 連結偵測的「地點」欄位，兩者都要在桌面版與行動版建立活動表單中實作，並讓地點資訊正確出現在活動頁面的各個顯示端。

**Architecture:** 新增 `EventLocation` 型別與一個共用的 `src/lib/location.ts` 偵測/模擬解析模組（比照 `slots.ts`／`calendar.ts` 的共用邏輯慣例）。桌面版 `CreateEvent.tsx` 與行動版 `CreateWizard.tsx` 是兩個獨立實作，UI 改動各做一次；`HeatmapTab.tsx`／`HostTab.tsx`／`FinalizedView.tsx` 是桌面/行動共用元件，改一次雙邊套用；`ShareModal.tsx` 桌面/行動各一份，各做一次。

**Tech Stack:** React 19 + TypeScript，Vite build，無測試框架（純 `tsc --noEmit` 型別檢查 + 手動 dev server 驗證）。

**Spec:** [docs/ux-feedback-2026-08/subproject-D-design.md](./subproject-D-design.md)

## Global Constraints

- 本專案沒有測試框架（無 test script／無 test 檔案，見 CLAUDE.md）：每個任務的驗證方式是 `npm run lint`（`tsc --noEmit`）做型別檢查，加上啟動 `npm run dev` 手動走一遍互動流程；不要新增測試框架
- 桌面版（`src/components/`）與行動版（`src/mobile/`）的建立活動表單（`CreateEvent.tsx` / `CreateWizard.tsx`）是兩個完全獨立的實作，UI 改動必須兩邊都做
- `ShareModal.tsx` 也是桌面/行動各一份獨立檔案（`src/components/ShareModal.tsx` / `src/mobile/ShareModal.tsx`），改動必須兩邊都做
- `HeatmapTab.tsx`／`HostTab.tsx`／`FinalizedView.tsx` 是桌面/行動共用元件（`EventView.tsx` 與 `EventScreen.tsx` 都直接 import 這幾個 mobile 元件），只需要改一次
- Google Maps 短連結解析是刻意做成固定假資料模擬（見 spec「暫不處理」章節）——這是設計決定，不是要修的 bug，不要嘗試接真的 API 或後端
- `location` 在 `EventData` / `CreateEventInput` 上是選填欄位，既有 demo/seed 資料與舊活動（沒有 `location`）必須維持正常運作
- 本次計畫**不包含** PLAN.md #2 項目（合併已新增時段清單與新增操作），該項目待使用者實測回報後另外評估

---

## File Structure

| 檔案 | 動作 | 責任 |
|---|---|---|
| `src/types.ts` | 修改 | 新增 `EventLocation` 型別、`EventData.location`、`CreateEventInput.location` |
| `src/lib/location.ts` | 新建 | Google Maps 連結偵測與（模擬）解析的純函式 |
| `src/lib/localEventStore.ts` | 修改 | `createEvent()` 讀寫 `location` 欄位 |
| `src/mobile/CreateWizard.tsx` | 修改 | 移除模式 Tab、新增「已選日期清單」+ 新增時段按鈕 + 降級連結、新增地點輸入欄位 |
| `src/components/CreateEvent.tsx` | 修改 | 同上（桌面版，獨立實作） |
| `src/mobile/HeatmapTab.tsx` | 修改 | 地點顯示行（含超連結）、說明行拿掉圖示 |
| `src/mobile/HostTab.tsx` | 修改 | 定案備註預設值拆分地點/說明 |
| `src/mobile/FinalizedView.tsx` | 修改 | 行事曆匯出 fallback 加入地點 |
| `src/components/ShareModal.tsx` | 修改 | LINE 分享文字新增地點行 |
| `src/mobile/ShareModal.tsx` | 修改 | 同上（獨立檔案） |

---

### Task 1: 資料模型 — `EventLocation` 型別

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `EventLocation { text: string; url?: string }`；`EventData.location?: EventLocation`；`CreateEventInput.location?: EventLocation` — 後續所有任務都依賴這個型別

- [ ] **Step 1: 新增 `EventLocation` 型別，並掛到 `EventData` / `CreateEventInput`**

在 `src/types.ts` 的 `EventComment` interface 之後（`EventData` interface 之前）插入：

```ts
export interface EventLocation {
  text: string;   // 顯示用地點名稱
  url?: string;   // Google Maps 連結（若使用者貼的是連結）
}
```

`EventData` interface 裡，在 `description?: string;` 那行之後新增一行：

```ts
  location?: EventLocation;
```

`CreateEventInput` interface 裡，在 `description?: string;` 那行之後新增一行：

```ts
  location?: EventLocation;
```

- [ ] **Step 2: 型別檢查**

執行：`npm run lint`
預期：目前應該仍然通過（新增的都是選填欄位，不會破壞現有程式碼）

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): add EventLocation type for Google Maps location field"
```

---

### Task 2: `src/lib/location.ts` — Google Maps 連結偵測與模擬解析

**Files:**
- Create: `src/lib/location.ts`

**Interfaces:**
- Consumes: 無（純函式模組，不依賴其他任務的程式碼）
- Produces:
  - `parseLocationInput(raw: string): { url: string; isShortLink: boolean } | null`
  - `extractPlaceNameFromFullUrl(url: string): string | null`
  - `mockResolveShortLink(url: string): Promise<string>`
  - 這三個函式會在 Task 4／5 被 `CreateWizard.tsx` / `CreateEvent.tsx` import 使用

- [ ] **Step 1: 建立 `src/lib/location.ts`**

```ts
export interface ParsedLocationLink {
  url: string;
  isShortLink: boolean;
}

const SHORT_LINK_HOSTS = ["maps.app.goo.gl", "goo.gl"];
const FULL_LINK_HOSTS = ["google.com", "www.google.com", "maps.google.com"];

// 判斷輸入文字是否為 Google Maps 連結；非連結（純文字地點）回傳 null。
export function parseLocationInput(raw: string): ParsedLocationLink | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (SHORT_LINK_HOSTS.includes(host)) {
    return { url: trimmed, isShortLink: true };
  }
  if (FULL_LINK_HOSTS.includes(host) && url.pathname.includes("/maps/")) {
    return { url: trimmed, isShortLink: false };
  }
  return null;
}

// 完整連結（如 .../maps/place/<name>/@lat,lng,17z）可以直接從路徑解碼出地點名稱，
// 不需要發送任何網路請求。解析不出來就回傳 null，呼叫端會 fallback 用原始輸入文字。
export function extractPlaceNameFromFullUrl(url: string): string | null {
  const match = url.match(/\/maps\/place\/([^/]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].replace(/\+/g, " "));
  } catch {
    return null;
  }
}

const MOCK_RESOLVED_PLACE_NAME = "台北市信義區";
const MOCK_RESOLVE_DELAY_MS = 600;

// Google Maps 短連結（maps.app.goo.gl / goo.gl/maps）只有在伺服器端發送請求才能
// 解析出真實地點名稱，瀏覽器端直接 fetch 別人網站會遇到 CORS 封鎖、無法保證成功。
// 這個專案是純 client-side、無後端架構（見 CLAUDE.md），所以短連結解析目前用固定
// 假地點名稱模擬（加一個小延遲讓 UI 呈現「解析中」的過渡狀態）。
// 之後如果要接上真的後端/API，只需要換掉這個函式的實作，呼叫端不用改。
export function mockResolveShortLink(_url: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_RESOLVED_PLACE_NAME), MOCK_RESOLVE_DELAY_MS);
  });
}
```

- [ ] **Step 2: 型別檢查**

執行：`npm run lint`
預期：通過。這個模組目前還沒有任何呼叫端，功能性驗證會在 Task 4（接上 UI）時一併手動測試——這裡先只確認型別正確。

- [ ] **Step 3: Commit**

```bash
git add src/lib/location.ts
git commit -m "feat(lib): add Google Maps link detection and mocked short-link resolution"
```

---

### Task 3: `localEventStore.ts` — `createEvent()` 支援 `location`

**Files:**
- Modify: `src/lib/localEventStore.ts:259-298`

**Interfaces:**
- Consumes: `EventLocation`（Task 1）
- Produces: `createEvent()` 現在會把 `input.location` 存進 `EventData.location`

- [ ] **Step 1: 修改 `createEvent()` 讀寫 `location`**

把：

```ts
export function createEvent(input: CreateEventInput): { event: EventData; hostToken: string } {
  const { title, description, hostName, hostEmail, mode, responseDeadline, slots } = input;
```

改成：

```ts
export function createEvent(input: CreateEventInput): { event: EventData; hostToken: string } {
  const { title, description, location, hostName, hostEmail, mode, responseDeadline, slots } = input;
```

把：

```ts
  const newEvent: EventData = {
    id,
    hostToken,
    title: title.trim(),
    description: description ? description.trim() : "",
    hostName: hostName ? hostName.trim() : "",
```

改成：

```ts
  const newEvent: EventData = {
    id,
    hostToken,
    title: title.trim(),
    description: description ? description.trim() : "",
    location: location && location.text.trim() ? { text: location.text.trim(), url: location.url } : undefined,
    hostName: hostName ? hostName.trim() : "",
```

- [ ] **Step 2: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 3: 手動驗證資料寫入**

啟動 `npm run dev`，開瀏覽器 devtools console，建立任一活動（此時建立表單還沒有地點欄位 UI，`location` 會是 `undefined`，這步只是確認舊流程沒被打壞）後執行：

```js
JSON.parse(localStorage.getItem("gathertime_events_db"))
```

確認新建立的活動物件裡沒有因為這次改動而缺少 `title`/`slots` 等既有欄位（`location` 欄位不存在或是 `undefined` 都正常，因為 UI 還沒接上）。

- [ ] **Step 4: Commit**

```bash
git add src/lib/localEventStore.ts
git commit -m "feat(store): persist location field on event creation"
```

---

### Task 4: `CreateWizard.tsx`（行動版）— 移除模式 Tab、新增時段按鈕、地點欄位

**Files:**
- Modify: `src/mobile/CreateWizard.tsx`

**Interfaces:**
- Consumes: `EventLocation`（Task 1），`parseLocationInput` / `extractPlaceNameFromFullUrl` / `mockResolveShortLink`（Task 2）
- Produces: 無其他任務依賴此檔案的內部實作

- [ ] **Step 1: 更新 imports**

把：

```tsx
import React, { useState, useEffect } from "react";
import { History, X, AlertTriangle, MapPin, Rocket, Clock, CalendarDays, Plus } from "lucide-react";
import { CreateEventInput, EventMode, TimeSlot } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, formatSlotTime, getNextWeekdayDate } from "../lib/slots";
import { getDefaultDeadlineLocalValue, getNowLocalValue, localValueToIso } from "../lib/eventStatus";
import { Button, Input } from "../design-system/components";
import { TopBar } from "./TopBar";
import { MonthCalendar } from "./MonthCalendar";
import { MiniMonthPicker } from "./MiniMonthPicker";
import { cardStyle, iconBtnStyle, SectionLabel } from "./mobileStyles";
import { getRecentSlotPresets, saveRecentSlotPresets } from "../lib/api";
```

改成：

```tsx
import React, { useState, useEffect, useRef } from "react";
import { History, X, AlertTriangle, MapPin, Rocket, Clock, Plus } from "lucide-react";
import { CreateEventInput, EventLocation, EventMode, TimeSlot } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, formatSlotTime, getNextWeekdayDate } from "../lib/slots";
import { getDefaultDeadlineLocalValue, getNowLocalValue, localValueToIso } from "../lib/eventStatus";
import { parseLocationInput, extractPlaceNameFromFullUrl, mockResolveShortLink } from "../lib/location";
import { Button, Input } from "../design-system/components";
import { TopBar } from "./TopBar";
import { MonthCalendar } from "./MonthCalendar";
import { MiniMonthPicker } from "./MiniMonthPicker";
import { cardStyle, iconBtnStyle, SectionLabel } from "./mobileStyles";
import { getRecentSlotPresets, saveRecentSlotPresets } from "../lib/api";
```

（`CalendarDays` 移除是因為它只被模式 Tab 用到，這次會把 Tab 整個刪掉。）

- [ ] **Step 2: 新增地點相關 state 與偵測 handler**

把：

```tsx
  const [activeDate, setActiveDate] = useState<string | null>(selectedDates[0] || null);
  const [quickPresets] = useState(() => getRecentSlotPresets());

  const isDateOnly = mode === "date_only";
```

改成：

```tsx
  const [activeDate, setActiveDate] = useState<string | null>(selectedDates[0] || null);
  const [quickPresets] = useState(() => getRecentSlotPresets());
  const [location, setLocation] = useState<EventLocation | undefined>(undefined);
  const [locationInput, setLocationInput] = useState("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const locationRequestRef = useRef(0);

  const isDateOnly = mode === "date_only";

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
    mockResolveShortLink(parsed.url).then((name) => {
      if (locationRequestRef.current !== requestId) return;
      setIsResolvingLocation(false);
      setLocation({ text: name, url: parsed.url });
      setLocationInput(name);
    });
  };
```

`locationRequestRef` 是為了避免使用者在短連結還在「解析中」的時候又改了輸入框內容，導致舊的解析結果晚到覆蓋掉新的輸入——每次輸入變化都遞增一個 request id，非同步解析回來時比對 id 是否還是最新的。

- [ ] **Step 3: `handleSubmit` 帶入 `location`**

把：

```tsx
  const handleSubmit = () => {
    if (!isDateOnly) saveRecentSlotPresets(slots);
    onSubmit({
      title: title.trim(),
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim(),
      description: description.trim(),
      mode,
      responseDeadline: localValueToIso(responseDeadline),
      slots,
    });
  };
```

改成：

```tsx
  const handleSubmit = () => {
    if (!isDateOnly) saveRecentSlotPresets(slots);
    onSubmit({
      title: title.trim(),
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim(),
      description: description.trim(),
      location,
      mode,
      responseDeadline: localValueToIso(responseDeadline),
      slots,
    });
  };
```

- [ ] **Step 4: Step 0（基本資訊）新增地點欄位、說明欄位改名**

把：

```tsx
              <Input label="主揪暱稱" placeholder="例如：阿傑、Wally" value={hostName} onChange={(e) => setHostName(e.target.value)} />
              <Input label="主揪 Email" placeholder="例如：host@example.com" type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
              <Input label="地點或說明" placeholder="例如：捷運中山站火鍋" value={description} onChange={(e) => setDescription(e.target.value)} />
```

改成：

```tsx
              <Input label="主揪暱稱" placeholder="例如：阿傑、Wally" value={hostName} onChange={(e) => setHostName(e.target.value)} />
              <Input label="主揪 Email" placeholder="例如：host@example.com" type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
              <Input
                label="地點"
                placeholder="輸入地點，或貼上 Google Maps 連結"
                value={locationInput}
                onChange={handleLocationChange}
                hint={isResolvingLocation ? "解析地點中..." : location?.url ? "已從 Google Maps 連結解析出地點名稱" : undefined}
              />
              <Input label="活動說明（選填）" placeholder="例如：想吃鍋物，歡迎推薦口袋名單" value={description} onChange={(e) => setDescription(e.target.value)} />
```

- [ ] **Step 5: Step 1（候選日期與時段）移除模式 Tab，改成標題旁的降級連結**

把：

```tsx
        {step === 1 && (
          <div style={cardStyle}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)", display: "block", marginBottom: 6 }}>投票模式</label>
              <div style={{ display: "flex", gap: 2, background: "var(--color-cream)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 3 }}>
                {([
                  { k: "date_only" as EventMode, label: "只選日期", Icon: CalendarDays },
                  { k: "time_slots" as EventMode, label: "需要選時段", Icon: Clock },
                ]).map((m) => (
                  <button
                    key={m.k}
                    onClick={() => setMode(m.k)}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      padding: "8px 4px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 12,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      background: mode === m.k ? "var(--color-primary)" : "transparent",
                      color: mode === m.k ? "#fff" : "var(--color-ink)",
                      transition: "background 150ms ease, color 150ms ease",
                    }}
                  >
                    <m.Icon size={13} />
                    {m.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
                {isDateOnly ? "參與者只需勾選日期，不用細分時段" : "參與者可針對每個候選日期勾選細部時段"}
              </div>
            </div>

            <SectionLabel
              title={isDateOnly ? "候選日期" : "候選日期與時段"}
              hint={isDateOnly ? `點選日期新增候選，再點一次可取消；已選 ${selectedDates.length} 天` : `點選日期新增候選，再點一次可切換／取消；已建立 ${slots.length} 個時段`}
            />
```

改成：

```tsx
        {step === 1 && (
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <SectionLabel
                title={isDateOnly ? "候選日期" : "候選日期與時段"}
                hint={isDateOnly ? `點選日期新增候選，再點一次可取消；已選 ${selectedDates.length} 天` : `點選日期新增候選，再點一次可切換／取消；已建立 ${slots.length} 個時段`}
              />
              {!isDateOnly && (
                <button
                  onClick={() => setMode("date_only")}
                  style={{ border: "none", background: "none", color: "var(--color-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, padding: 0, whiteSpace: "nowrap" }}
                >
                  ◀ 改回只選日期
                </button>
              )}
            </div>
```

- [ ] **Step 6: 新增「已選日期清單」（date_only 模式下的新增時段入口）**

把：

```tsx
            <MonthCalendar
              selectedDates={selectedDates}
              onChange={handleDatesChange}
              viewDate={viewDate}
              setViewDate={setViewDate}
              slots={slots}
              activeDate={activeDate}
              onActiveDateChange={setActiveDate}
              isDateOnly={isDateOnly}
            />
            {selectedDates.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--color-hot)", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} />
                請至少選擇一個日期
              </div>
            )}

            {!isDateOnly && activeDate && selectedDates.length > 0 && (
```

改成：

```tsx
            <MonthCalendar
              selectedDates={selectedDates}
              onChange={handleDatesChange}
              viewDate={viewDate}
              setViewDate={setViewDate}
              slots={slots}
              activeDate={activeDate}
              onActiveDateChange={setActiveDate}
              isDateOnly={isDateOnly}
            />
            {selectedDates.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--color-hot)", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} />
                請至少選擇一個日期
              </div>
            )}

            {isDateOnly && selectedDates.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-muted)", marginBottom: 6 }}>
                  已選日期（{selectedDates.length}）
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[...selectedDates].sort().map((date) => (
                    <div
                      key={date}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700 }}>
                        {date} ({formatChineseWeekday(date)})
                      </span>
                      <button
                        onClick={() => {
                          setMode("time_slots");
                          setActiveDate(date);
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "none", color: "var(--color-primary)", fontSize: 11, fontWeight: 800, cursor: "pointer", padding: 0 }}
                      >
                        <Plus size={12} />
                        新增時段
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isDateOnly && activeDate && selectedDates.length > 0 && (
```

（後面「新增候選時段」表單＋「已新增時段」清單那一整塊維持不變，不用動。）

- [ ] **Step 7: Step 2（確認送出）預覽區塊新增地點行**

把：

```tsx
        {step === 2 && (
          <div style={cardStyle}>
            <SectionLabel title="確認活動內容" />
            <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", marginBottom: 4 }}>{title || "（尚未命名）"}</div>
            {hostName && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>主揪：{hostName}</div>}
            {description && (
              <div style={{ fontSize: 11, color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} />
                {description}
              </div>
            )}
```

改成：

```tsx
        {step === 2 && (
          <div style={cardStyle}>
            <SectionLabel title="確認活動內容" />
            <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", marginBottom: 4 }}>{title || "（尚未命名）"}</div>
            {hostName && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>主揪：{hostName}</div>}
            {location && (
              <div style={{ fontSize: 11, color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} />
                {location.url ? (
                  <a href={location.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                    {location.text}
                  </a>
                ) : (
                  location.text
                )}
              </div>
            )}
            {description && (
              <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{description}</div>
            )}
```

- [ ] **Step 8: 型別檢查**

執行：`npm run lint`
預期：通過，沒有未使用的 import（`CalendarDays` 已移除）或型別錯誤

- [ ] **Step 9: 手動驗證（dev server，行動版 viewport）**

執行 `npm run dev`，用瀏覽器縮到手機寬度（或 devtools 手機模擬），走一遍建立活動流程：

1. Step 0：在「地點」欄位輸入 `捷運中山站` → 不應出現「解析中」提示，直接視為純文字地點
2. 換掉輸入為 `https://www.google.com/maps/place/台北101/@25.033976,121.564472,17z` → 應該立刻解析出「台北101」並在 hint 顯示「已從 Google Maps 連結解析出地點名稱」
3. 換掉輸入為 `https://maps.app.goo.gl/AbCdEf1234` → 應該先顯示「解析地點中...」，約 0.6 秒後自動帶入「台北市信義區」
4. Step 1：預設是「候選日期」（沒有模式 Tab 了），月曆下方應該出現「已選日期」清單，每個日期旁邊有「+ 新增時段」按鈕
5. 點其中一個日期的「+ 新增時段」→ 整個表單切到「候選日期與時段」，展開新增時段表單，標題旁出現「◀ 改回只選日期」連結，其他還沒設定時段的日期應該顯示警告
6. 點「◀ 改回只選日期」→ 應該乾淨地切回只選日期模式，已選日期清單重新出現
7. Step 2：確認畫面應該同時看到地點（若有連結則是可點的超連結）跟活動說明分開顯示
8. 送出後開瀏覽器 console 執行 `JSON.parse(localStorage.getItem("gathertime_events_db"))`，確認新活動物件裡有正確的 `location: { text: ..., url: ... }`

- [ ] **Step 10: Commit**

```bash
git add src/mobile/CreateWizard.tsx
git commit -m "feat(mobile): replace mode tab with add-slot button and add location field"
```

---

### Task 5: `CreateEvent.tsx`（桌面版）— 移除模式 Tab、新增時段按鈕、地點欄位

**Files:**
- Modify: `src/components/CreateEvent.tsx`

**Interfaces:**
- Consumes: `EventLocation`（Task 1），`parseLocationInput` / `extractPlaceNameFromFullUrl` / `mockResolveShortLink`（Task 2）
- Produces: 無其他任務依賴此檔案的內部實作

此任務跟 Task 4 是完全相同的功能，套用到桌面版獨立實作的檔案上（單頁版面、沒有 wizard 分步，欄位配置略有不同）。

- [ ] **Step 1: 更新 imports**

把：

```tsx
import React, { useEffect, useState } from "react";
import { X, AlertTriangle, MapPin, Rocket, Clock, CalendarDays, Plus } from "lucide-react";
import { CreateEventInput, EventMode, TimeSlot } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, formatSlotTime, getNextWeekdayDate } from "../lib/slots";
import { getDefaultDeadlineLocalValue, getNowLocalValue, localValueToIso } from "../lib/eventStatus";
import { Button, Input } from "../design-system/components";
import { MonthCalendar } from "../mobile/MonthCalendar";
import { MiniMonthPicker } from "../mobile/MiniMonthPicker";
import { cardStyle, SectionLabel } from "../mobile/mobileStyles";
import { getRecentSlotPresets, saveRecentSlotPresets } from "../lib/api";
```

改成：

```tsx
import React, { useEffect, useRef, useState } from "react";
import { X, AlertTriangle, MapPin, Rocket, Clock, Plus } from "lucide-react";
import { CreateEventInput, EventLocation, EventMode, TimeSlot } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { calculateSlotDuration, formatSlotTime, getNextWeekdayDate } from "../lib/slots";
import { getDefaultDeadlineLocalValue, getNowLocalValue, localValueToIso } from "../lib/eventStatus";
import { parseLocationInput, extractPlaceNameFromFullUrl, mockResolveShortLink } from "../lib/location";
import { Button, Input } from "../design-system/components";
import { MonthCalendar } from "../mobile/MonthCalendar";
import { MiniMonthPicker } from "../mobile/MiniMonthPicker";
import { cardStyle, SectionLabel } from "../mobile/mobileStyles";
import { getRecentSlotPresets, saveRecentSlotPresets } from "../lib/api";
```

- [ ] **Step 2: 新增地點相關 state 與偵測 handler**

把：

```tsx
  const [activeDate, setActiveDate] = useState<string | null>(selectedDates[0] || null);
  const [quickPresets] = useState(() => getRecentSlotPresets());

  const isDateOnly = mode === "date_only";
```

改成：

```tsx
  const [activeDate, setActiveDate] = useState<string | null>(selectedDates[0] || null);
  const [quickPresets] = useState(() => getRecentSlotPresets());
  const [location, setLocation] = useState<EventLocation | undefined>(undefined);
  const [locationInput, setLocationInput] = useState("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const locationRequestRef = useRef(0);

  const isDateOnly = mode === "date_only";

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
    mockResolveShortLink(parsed.url).then((name) => {
      if (locationRequestRef.current !== requestId) return;
      setIsResolvingLocation(false);
      setLocation({ text: name, url: parsed.url });
      setLocationInput(name);
    });
  };
```

- [ ] **Step 3: `handleSubmit` 帶入 `location`**

把：

```tsx
  const handleSubmit = () => {
    if (!canSubmit) return;
    if (!isDateOnly) saveRecentSlotPresets(slots);
    onSubmit({
      title: title.trim(),
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim(),
      description: description.trim(),
      mode,
      responseDeadline: localValueToIso(responseDeadline),
      slots,
    });
  };
```

改成：

```tsx
  const handleSubmit = () => {
    if (!canSubmit) return;
    if (!isDateOnly) saveRecentSlotPresets(slots);
    onSubmit({
      title: title.trim(),
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim(),
      description: description.trim(),
      location,
      mode,
      responseDeadline: localValueToIso(responseDeadline),
      slots,
    });
  };
```

- [ ] **Step 4: 基本資訊卡片新增地點欄位、說明欄位改名**

把：

```tsx
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="主揪暱稱" placeholder="例如：阿傑、Wally" value={hostName} onChange={(e) => setHostName(e.target.value)} />
                <Input label="主揪 Email" placeholder="例如：host@example.com" type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
              </div>
              <Input label="地點或說明" placeholder="例如：捷運中山站火鍋" value={description} onChange={(e) => setDescription(e.target.value)} />
```

改成：

```tsx
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="主揪暱稱" placeholder="例如：阿傑、Wally" value={hostName} onChange={(e) => setHostName(e.target.value)} />
                <Input label="主揪 Email" placeholder="例如：host@example.com" type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
              </div>
              <Input
                label="地點"
                placeholder="輸入地點，或貼上 Google Maps 連結"
                value={locationInput}
                onChange={handleLocationChange}
                hint={isResolvingLocation ? "解析地點中..." : location?.url ? "已從 Google Maps 連結解析出地點名稱" : undefined}
              />
              <Input label="活動說明（選填）" placeholder="例如：想吃鍋物，歡迎推薦口袋名單" value={description} onChange={(e) => setDescription(e.target.value)} />
```

- [ ] **Step 5: 移除模式 Tab，改成標題旁的降級連結**

把：

```tsx
          <div style={cardStyle}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)", display: "block", marginBottom: 6 }}>投票模式</label>
              <div style={{ display: "flex", gap: 2, background: "var(--color-cream)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 3 }}>
                {([
                  { k: "date_only" as EventMode, label: "只選日期", Icon: CalendarDays },
                  { k: "time_slots" as EventMode, label: "需要選時段", Icon: Clock },
                ]).map((m) => (
                  <button
                    key={m.k}
                    onClick={() => setMode(m.k)}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      padding: "8px 4px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 12,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      background: mode === m.k ? "var(--color-primary)" : "transparent",
                      color: mode === m.k ? "#fff" : "var(--color-ink)",
                      transition: "background 150ms ease, color 150ms ease",
                    }}
                  >
                    <m.Icon size={13} />
                    {m.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
                {isDateOnly ? "參與者只需勾選日期，不用細分時段" : "參與者可針對每個候選日期勾選細部時段"}
              </div>
            </div>

            <SectionLabel
              title={isDateOnly ? "候選日期" : "候選日期與時段"}
              hint={isDateOnly ? `點選日期新增候選，再點一次可取消；已選 ${selectedDates.length} 天` : `點選日期新增候選，再點一次可切換／取消；已建立 ${slots.length} 個時段`}
            />
```

改成：

```tsx
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <SectionLabel
                title={isDateOnly ? "候選日期" : "候選日期與時段"}
                hint={isDateOnly ? `點選日期新增候選，再點一次可取消；已選 ${selectedDates.length} 天` : `點選日期新增候選，再點一次可切換／取消；已建立 ${slots.length} 個時段`}
              />
              {!isDateOnly && (
                <button
                  onClick={() => setMode("date_only")}
                  style={{ border: "none", background: "none", color: "var(--color-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, padding: 0, whiteSpace: "nowrap" }}
                >
                  ◀ 改回只選日期
                </button>
              )}
            </div>
```

- [ ] **Step 6: 新增「已選日期清單」**

把：

```tsx
            <MonthCalendar
              selectedDates={selectedDates}
              onChange={handleDatesChange}
              viewDate={viewDate}
              setViewDate={setViewDate}
              slots={slots}
              activeDate={activeDate}
              onActiveDateChange={setActiveDate}
              isDateOnly={isDateOnly}
            />
            {selectedDates.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--color-hot)", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} />
                請至少選擇一個日期
              </div>
            )}

            {!isDateOnly && activeDate && selectedDates.length > 0 && (
```

改成：

```tsx
            <MonthCalendar
              selectedDates={selectedDates}
              onChange={handleDatesChange}
              viewDate={viewDate}
              setViewDate={setViewDate}
              slots={slots}
              activeDate={activeDate}
              onActiveDateChange={setActiveDate}
              isDateOnly={isDateOnly}
            />
            {selectedDates.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--color-hot)", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} />
                請至少選擇一個日期
              </div>
            )}

            {isDateOnly && selectedDates.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-muted)", marginBottom: 6 }}>
                  已選日期（{selectedDates.length}）
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[...selectedDates].sort().map((date) => (
                    <div
                      key={date}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700 }}>
                        {date} ({formatChineseWeekday(date)})
                      </span>
                      <button
                        onClick={() => {
                          setMode("time_slots");
                          setActiveDate(date);
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "none", color: "var(--color-primary)", fontSize: 11, fontWeight: 800, cursor: "pointer", padding: 0 }}
                      >
                        <Plus size={12} />
                        新增時段
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isDateOnly && activeDate && selectedDates.length > 0 && (
```

- [ ] **Step 7: 右側即時預覽卡片新增地點行**

把：

```tsx
            <div style={{ fontSize: 15, fontWeight: 900, fontFamily: "var(--font-display)", marginBottom: 4, color: "var(--color-ink)" }}>{title || "（尚未命名）"}</div>
            {hostName && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>主揪：{hostName}</div>}
            {description && (
              <div style={{ fontSize: 11, color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} />
                {description}
              </div>
            )}
```

改成：

```tsx
            <div style={{ fontSize: 15, fontWeight: 900, fontFamily: "var(--font-display)", marginBottom: 4, color: "var(--color-ink)" }}>{title || "（尚未命名）"}</div>
            {hostName && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>主揪：{hostName}</div>}
            {location && (
              <div style={{ fontSize: 11, color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} />
                {location.url ? (
                  <a href={location.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                    {location.text}
                  </a>
                ) : (
                  location.text
                )}
              </div>
            )}
            {description && (
              <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{description}</div>
            )}
```

- [ ] **Step 8: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 9: 手動驗證（dev server，桌面版 viewport）**

跟 Task 4 Step 9 相同的 8 個檢查項目，這次用桌面寬度的瀏覽器視窗（單頁版面，右側是即時預覽卡片，不是分步 wizard）。

- [ ] **Step 10: Commit**

```bash
git add src/components/CreateEvent.tsx
git commit -m "feat(desktop): replace mode tab with add-slot button and add location field"
```

---

### Task 6: `HeatmapTab.tsx` — 地點顯示行

**Files:**
- Modify: `src/mobile/HeatmapTab.tsx:132-137`

**Interfaces:**
- Consumes: `EventData.location`（Task 1／3）

- [ ] **Step 1: 拆分地點與說明顯示**

把：

```tsx
          {event.description && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--color-ink)", lineHeight: 1.5 }}>
              <MapPin size={12} color="var(--color-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{event.description}</span>
            </div>
          )}
```

改成：

```tsx
          {event.location && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--color-ink)", lineHeight: 1.5 }}>
              <MapPin size={12} color="var(--color-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
              {event.location.url ? (
                <a href={event.location.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                  {event.location.text}
                </a>
              ) : (
                <span>{event.location.text}</span>
              )}
            </div>
          )}
          {event.description && (
            <div style={{ fontSize: 12, color: "var(--color-ink)", lineHeight: 1.5 }}>{event.description}</div>
          )}
```

- [ ] **Step 2: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 3: 手動驗證**

啟動 `npm run dev`，開啟一個透過 Task 4/5 建立、有帶 Google Maps 連結地點的活動的熱點圖頁面（桌面版走 `EventView.tsx`、行動版走 `EventScreen.tsx`，因為這個元件雙邊共用，只需要挑一邊確認即可，但建議兩個 viewport 都點開看一下排版）：
1. 地點應顯示為可點的超連結（新分頁開啟 Google Maps 連結）
2. 活動說明（如果有填）顯示在地點下方，純文字、沒有圖示
3. 沒有填地點但有填說明的舊活動（例如 demo 種子資料）應該只顯示說明那一行，不出現空的地點行或壞掉的版面

- [ ] **Step 4: Commit**

```bash
git add src/mobile/HeatmapTab.tsx
git commit -m "feat(event-view): show location as a linked row separate from description"
```

---

### Task 7: `HostTab.tsx` — 定案備註預設值拆分

**Files:**
- Modify: `src/mobile/HostTab.tsx:22`

**Interfaces:**
- Consumes: `EventData.location`（Task 1／3）

- [ ] **Step 1: 拆分備註預設值**

把：

```tsx
  const [note, setNote] = useState(event.description ? `地點/備註：${event.description}` : "");
```

改成：

```tsx
  const noteDefaultLines = [
    event.location ? `地點：${event.location.text}` : null,
    event.description ? `備註：${event.description}` : null,
  ].filter((line): line is string => line !== null);
  const [note, setNote] = useState(noteDefaultLines.join("\n"));
```

- [ ] **Step 2: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 3: 手動驗證**

開一個有地點也有說明的活動的「主揪拍板定案」頁面（`HostTab`），確認「定案備註」欄位預設值是兩行：`地點：xxx` 換行 `備註：xxx`；只有地點沒有說明（或反過來）的活動應該只出現那一行，不會有多餘的空行。

- [ ] **Step 4: Commit**

```bash
git add src/mobile/HostTab.tsx
git commit -m "feat(host-tab): split finalize note default into location and description lines"
```

---

### Task 8: `FinalizedView.tsx` — 行事曆匯出加入地點

**Files:**
- Modify: `src/mobile/FinalizedView.tsx:24-27,90,101`

**Interfaces:**
- Consumes: `EventData.location`（Task 1／3）

- [ ] **Step 1: 新增 fallback 變數**

把：

```tsx
  const isDateOnly = event.mode === "date_only";
  const hasEnded = !!getMeetupEndInfo(event)?.hasEnded;
```

改成：

```tsx
  const isDateOnly = event.mode === "date_only";
  const hasEnded = !!getMeetupEndInfo(event)?.hasEnded;
  const locationDescriptionFallback = [event.location?.text, event.description].filter(Boolean).join("\n");
```

- [ ] **Step 2: 套用到 Google Calendar 連結**

把：

```tsx
            onClick={() =>
              window.open(
                generateGoogleCalendarUrl(event.title, slot.date, slot.time, event.finalNote || event.description || "", `主揪：${event.hostName || ""}`, isDateOnly),
                "_blank"
              )
            }
```

改成：

```tsx
            onClick={() =>
              window.open(
                generateGoogleCalendarUrl(event.title, slot.date, slot.time, event.finalNote || locationDescriptionFallback, `主揪：${event.hostName || ""}`, isDateOnly),
                "_blank"
              )
            }
```

- [ ] **Step 3: 套用到 ICS 下載**

把：

```tsx
            onClick={() => downloadIcsFile(event.title, slot.date, slot.time, event.finalNote || event.description || "", `主揪：${event.hostName || ""}`, isDateOnly)}
```

改成：

```tsx
            onClick={() => downloadIcsFile(event.title, slot.date, slot.time, event.finalNote || locationDescriptionFallback, `主揪：${event.hostName || ""}`, isDateOnly)}
```

- [ ] **Step 4: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 5: 手動驗證**

開一個已定案、有地點的活動的「已敲定」頁面，點「加到日曆」跟「下載 .ics」，確認產生的行事曆說明欄位包含地點文字（若同時有 `finalNote`，`finalNote` 優先蓋過地點/說明，行為不變）。

- [ ] **Step 6: Commit**

```bash
git add src/mobile/FinalizedView.tsx
git commit -m "feat(finalized-view): include location in calendar export fallback"
```

---

### Task 9: `src/components/ShareModal.tsx`（桌面版）— LINE 分享文字加入地點

**Files:**
- Modify: `src/components/ShareModal.tsx:20-22`

**Interfaces:**
- Consumes: `EventData.location`（Task 1／3）

- [ ] **Step 1: 新增地點行**

把：

```tsx
  const lineText = `📢【${event.title}】聚會時間調查邀請！
主揪：${event.hostName || "熱心朋友"}
${event.description ? `說明：${event.description}\n` : ""}${event.responseDeadline ? `⏰ 請於 ${formatDeadline(event.responseDeadline)} 前完成填寫\n` : ""}
不用註冊登入，點擊連結即可選擇你有空的時間：
${shareUrl}`;
```

改成：

```tsx
  const lineText = `📢【${event.title}】聚會時間調查邀請！
主揪：${event.hostName || "熱心朋友"}
${event.location ? `📍 地點：${event.location.text}${event.location.url ? ` ${event.location.url}` : ""}\n` : ""}${event.description ? `說明：${event.description}\n` : ""}${event.responseDeadline ? `⏰ 請於 ${formatDeadline(event.responseDeadline)} 前完成填寫\n` : ""}
不用註冊登入，點擊連結即可選擇你有空的時間：
${shareUrl}`;
```

- [ ] **Step 2: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 3: 手動驗證**

桌面版建立一個有地點（含 Google Maps 連結）的活動，成功後跳出的分享 modal 點「複製 LINE 分享文字」，貼到文字編輯器確認內容包含 `📍 地點：` 那一行、且原始連結有帶上。

- [ ] **Step 4: Commit**

```bash
git add src/components/ShareModal.tsx
git commit -m "feat(share-modal): include location in LINE share text"
```

---

### Task 10: `src/mobile/ShareModal.tsx`（行動版）— LINE 分享文字加入地點

**Files:**
- Modify: `src/mobile/ShareModal.tsx:17-21`

**Interfaces:**
- Consumes: `EventData.location`（Task 1／3）

- [ ] **Step 1: 新增地點行**

把：

```tsx
  const lineText = `📢【${event.title}】聚會時間調查邀請！
主揪：${event.hostName || "熱心朋友"}
${event.description ? `說明：${event.description}\n` : ""}${event.responseDeadline ? `⏰ 請於 ${formatDeadline(event.responseDeadline)} 前完成填寫\n` : ""}
不用註冊登入，點擊連結即可選擇你有空的時間：
${shareUrl}`;
```

改成：

```tsx
  const lineText = `📢【${event.title}】聚會時間調查邀請！
主揪：${event.hostName || "熱心朋友"}
${event.location ? `📍 地點：${event.location.text}${event.location.url ? ` ${event.location.url}` : ""}\n` : ""}${event.description ? `說明：${event.description}\n` : ""}${event.responseDeadline ? `⏰ 請於 ${formatDeadline(event.responseDeadline)} 前完成填寫\n` : ""}
不用註冊登入，點擊連結即可選擇你有空的時間：
${shareUrl}`;
```

- [ ] **Step 2: 型別檢查**

執行：`npm run lint`
預期：通過

- [ ] **Step 3: 手動驗證**

行動版 viewport 重複 Task 9 Step 3 的驗證。

- [ ] **Step 4: Commit**

```bash
git add src/mobile/ShareModal.tsx
git commit -m "feat(share-modal): include location in LINE share text"
```

---

## Self-Review

**Spec coverage：**
- #1（Tab → 新增時段按鈕，含新增「已選日期清單」UI、升級全部日期、降級連結）→ Task 4／5 ✅
- #8 資料模型（`EventLocation`）→ Task 1 ✅
- #8 偵測/模擬解析邏輯 → Task 2 ✅
- #8 儲存層 → Task 3 ✅
- #8 建立表單地點輸入 → Task 4／5 ✅
- #8 顯示端（HeatmapTab／HostTab／FinalizedView／兩份 ShareModal）→ Task 6-10 ✅
- #2 → 明確排除在本計畫外（Global Constraints 已註明），非遺漏

**Placeholder scan：** 無 TBD／TODO；每個 Step 都是可直接套用的完整程式碼，沒有「similar to Task N」這種偷懶引用。

**Type consistency：** `EventLocation { text, url? }`（Task 1）在 Task 3／4／5／6／7／8／9／10 都用同樣的欄位名稱（`.text` / `.url`）存取，沒有不一致。`parseLocationInput` / `extractPlaceNameFromFullUrl` / `mockResolveShortLink` 的函式簽章在 Task 2 定義、Task 4／5 使用，名稱與參數一致。

---

## 執行方式

Plan complete and saved to `docs/ux-feedback-2026-08/subproject-D-plan.md`. 兩種執行方式：

**1. Subagent-Driven（推薦）** — 每個 Task 派一個全新 subagent 執行，任務間人工 review，速度快

**2. Inline Execution** — 在目前這個 session 裡照順序執行，批次執行＋checkpoint 讓你 review

要用哪一種？
