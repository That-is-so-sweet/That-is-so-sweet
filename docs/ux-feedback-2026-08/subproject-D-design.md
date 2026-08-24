# 子專案 D 設計文件 — 建立活動流程優化

**對應項目**：#1、#2、#8（見 [PLAN.md](./PLAN.md)）
**狀態**：設計已與使用者確認，待寫實作計畫

---

## 範圍確認

- **#1 模式 Tab → 新增時段按鈕**：本文件涵蓋，設計如下。
- **#2 合併已新增時段清單與新增操作**：現有程式碼（`CreateWizard.tsx` / `CreateEvent.tsx`）已經是「新增表單 + 已新增清單」同卡片合併呈現，新增動作也不會覆蓋既有時段，看起來已經解決原始回饋描述的問題（可能是先前 commit `83aaa4d` 已處理）。使用者會實際操作 dev server 驗證後回報是否還有微調需求；**本次實作計畫先不含 #2 的變動**，若使用者測試後認為仍有問題，另外追加。
- **#8 精確地點 + Google Maps 連結偵測**：本文件涵蓋，設計如下。

---

## #8：地點欄位與 Google Maps 連結偵測

### 資料模型

`src/types.ts` 新增型別：

```ts
export interface EventLocation {
  text: string;   // 顯示用地點名稱
  url?: string;   // Google Maps 連結（若使用者貼的是連結）
}
```

- `EventData.location?: EventLocation`
- `CreateEventInput.location?: EventLocation`

`src/lib/localEventStore.ts` 的 `createEvent()` 比照 `description` 的處理方式存入（trim 後存入；無則為 `undefined`）。

原有的 `description`（「地點或說明」欄位）**保留**，改標為「活動說明（選填）」的純自由文字欄位，跟 `location` 分開，語意上不再混用。

### 偵測與模擬解析邏輯

新增 `src/lib/location.ts`（比照 `slots.ts`／`calendar.ts`／`eventStatus.ts` 的共用邏輯模組慣例，桌面/行動兩個表單呼叫同一份函式）：

```ts
// 判斷輸入文字是否為 Google Maps 連結；分辨完整連結 vs 短連結
function parseLocationInput(raw: string): { url: string; isShortLink: boolean } | null

// 完整連結（如 google.com/maps/place/<name>/@lat,lng）：從 /place/ 片段解碼地點名稱
function extractPlaceNameFromFullUrl(url: string): string | null

// 短連結（如 maps.app.goo.gl/xxx、goo.gl/maps/xxx）：無法在純前端環境下解析，
// 目前回傳固定假地點名（模擬解析延遲 ~600ms）。
// 這是本專案唯一的 mock 資料點 —— 之後若要接上真的後端/API，只需改這個函式。
async function mockResolveShortLink(url: string): Promise<string>
```

表單「地點」欄位行為：
1. 使用者貼上/輸入文字時即時判斷
2. 完整連結 → 同步解出地點名稱，`location = { text: 解出的名稱, url: 原始連結 }`
3. 短連結 → 顯示「解析地點中...」過渡狀態 → 完成後 `location = { text: 固定假地點名, url: 原始連結 }`
4. 非連結純文字 → `location = { text: 輸入內容, url: undefined }`

### 顯示端改動

`location` 要出現在原本 `description` 顯示的位置，並與 `description` 分開呈現：

| 檔案 | 改動 |
|---|---|
| `src/mobile/HeatmapTab.tsx`（桌面/行動共用） | `MapPin` 圖示改配給地點行：`location.text`，若有 `location.url` 則整行是可點超連結（`<a href target="_blank" rel="noopener noreferrer">`）。原本 `description` 那一行拿掉 `MapPin` 圖示，改為純文字（呼應它現在是單純「說明」） |
| `src/mobile/HostTab.tsx` | 定案備註預設值從 `` `地點/備註：${description}` `` 拆開為 `` `地點：${location.text}\n備註：${description}` ``（缺的欄位跳過該行） |
| `src/mobile/FinalizedView.tsx` | 行事曆匯出（Google Calendar URL / ICS）fallback 從 `event.finalNote \|\| event.description` 改為 `event.finalNote \|\| [location.text, description].filter(Boolean).join('\n')` |
| `src/components/ShareModal.tsx` 與 `src/mobile/ShareModal.tsx`（兩份獨立檔案，各改一次） | LINE 分享文字新增一行 `📍 地點：${location.text}${location.url ? ' ' + location.url : ''}`，放在原本 `說明：` 那行之前 |

### 建立表單改動

`src/mobile/CreateWizard.tsx` 與 `src/components/CreateEvent.tsx`（各自獨立實作，各改一次）：新增「地點」輸入欄位，型別對應 `EventLocation`，放在既有「地點或說明」欄位（改名為「活動說明」）之前或旁邊；輸入時觸發上述偵測邏輯。

---

## #1：模式 Tab → 新增時段按鈕

### 現況

`CreateWizard.tsx` / `CreateEvent.tsx` 目前用一個 Tab 元件（「只選日期」/「需要選時段」）切換 `EventMode`，使用者要在選日期**之前**就決定模式。

### 新設計

1. 移除模式 Tab 元件。表單一開始永遠是 `date_only` 模式，選日期＝直接建立候選（沿用現有 `MonthCalendar` 互動）。
2. 「候選日期與時段」卡片區塊：
   - `date_only` 模式：月曆下方新增一個「已選日期清單」區塊（目前完全不存在，是新增 UI）——每個已選日期一行，顯示日期文字＋一個「+ 新增時段」按鈕；風格比照現有 `time_slots` 模式下「已新增時段」清單的列狀呈現
   - 使用者點擊任一日期列的「+ 新增時段」按鈕 → `mode` 一次性升級為 `time_slots`（影響**全部**已選日期，不做逐日混合），已選日期清單被現有「新增候選時段」表單（UI 沿用現狀，只是觸發方式從 Tab 換成按鈕）取代，並把 `activeDate` 設為被點擊的日期
   - 升級後，其他尚未設定時段的日期沿用現有 `datesMissingSlots` 邏輯顯示「以下日期尚未選擇時段」警告（不變）
3. **降級機制**：`time_slots` 模式下，在「候選日期與時段」標題旁加一個小文字連結「◀ 改回只選日期」，點擊後把 `mode` 設回 `date_only`（無確認彈窗，比照現有 `removeSlot` 無確認的慣例）。
   - 現有兩個 `useEffect`（`CreateWizard.tsx:64-75` / `CreateEvent.tsx` 對應區塊）已經處理 `date_only` ↔ `time_slots` 切換時的資料轉換（切到 `date_only` 自動把每個日期轉成一個空時間 slot；切離 `date_only` 自動過濾掉空時間 slot），降級只需要把 `mode` 設回 `date_only`，資料轉換沿用既有邏輯，不需新增轉換程式碼。

### 影響範圍

`CreateWizard.tsx`（行動版）與 `CreateEvent.tsx`（桌面版）各自獨立實作，此項改動兩邊都要各做一次。

---

## 涉及檔案總覽

| 檔案 | 改動類型 |
|---|---|
| `src/types.ts` | 新增 `EventLocation`、`EventData.location`、`CreateEventInput.location` |
| `src/lib/location.ts`（新檔） | Maps 連結偵測/解析邏輯 |
| `src/lib/localEventStore.ts` | `createEvent()` 支援 `location` 欄位讀寫 |
| `src/mobile/CreateWizard.tsx` | 移除模式 Tab、新增「+ 新增時段」按鈕與降級連結、新增地點輸入欄位 |
| `src/components/CreateEvent.tsx` | 同上（桌面版，獨立實作） |
| `src/mobile/HeatmapTab.tsx` | 地點顯示行（含超連結）、說明行拿掉圖示 |
| `src/mobile/HostTab.tsx` | 定案備註預設值拆分地點/說明 |
| `src/mobile/FinalizedView.tsx` | 行事曆匯出 fallback 加入地點 |
| `src/components/ShareModal.tsx` | LINE 分享文字新增地點行 |
| `src/mobile/ShareModal.tsx` | 同上（獨立檔案） |

---

## 測試/驗證方式

- `npm run lint`（`tsc --noEmit`）確認型別正確
- 用 dev server 手動走一遍建立活動流程（桌面 + 行動兩種 viewport）：
  - date_only 模式下不點「新增時段」直接送出
  - 點「+ 新增時段」升級模式、確認其他日期出現警告
  - 用「◀ 改回只選日期」降級，確認資料正確轉換
  - 貼入完整 Google Maps 連結，確認同步解出地點名稱 + 超連結
  - 貼入短連結（如 `maps.app.goo.gl/xxx`），確認出現「解析地點中...」過渡態，之後帶入假地點名
  - 輸入純文字地點，確認不產生超連結
- 走一遍活動頁面顯示端（熱點圖、定案備註預設值、分享文字、行事曆匯出）確認地點正確出現

## 暫不處理（Out of Scope）

- 短連結的真實解析（需要後端/API，與本專案純 client-side 架構前提衝突）——目前用固定假資料模擬，架構上已預留單一函式（`mockResolveShortLink`）方便未來替換
- #2 的實際修正（待使用者測試回報後再評估是否需要）
