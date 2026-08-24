# 子專案 B 設計文件 — 活動頁面互動重構

**對應項目**：#6、#7、#10、#12（見 [PLAN.md](./PLAN.md)）
**狀態**：設計已與使用者確認，待寫實作計畫

---

## 範圍確認

- **#6 無登入識別邏輯**：本文件涵蓋。設計採 When2meet 式「暱稱 + 選填密碼」識別，並延伸出識別完成後直接進熱點圖、取消 vote/heatmap Tab 切換。
- **#7 主辦人定案按鈕整合**：本文件涵蓋。`HostTab.tsx` 整個刪除，內容併入 `HeatmapTab.tsx`。
- **#10 主辦人編輯活動資訊**：本文件涵蓋，範圍**僅限活動基本資訊**（標題、說明、地點、主辦人姓名/Email、投票截止時間），**不含候選時段（日期/時間）編輯**——已投票者的 `availability` 綁在 `slotId` 上，開放編輯時段會有既有投票失效/對不起來的風險，故排除。
- **#12 熱點圖視覺重心**：本文件涵蓋，與 #6 的路由設計一併處理。

---

## #6：無登入識別（暱稱 + 選填密碼）

### 決策依據

討論後發現現有「同暱稱直接覆蓋」的比對邏輯（`event.responses.find(r => r.nickname.toLowerCase() === trimmed.toLowerCase())`）本身就有暱稱撞名時互相覆蓋的既有問題。比照 When2meet：暱稱必填、密碼選填（不像 Email 只是通知用途，密碼是「回來編輯自己那筆回覆」的識別機制）。**密碼是明文存在該筆活動資料中（純前端、無後端，資料就活在 localStorage 的 `gathertime_events_db`），是防呆用途、不是真正加密驗證** —— 已與使用者確認此限制可接受。

### 資料模型

`src/types.ts`：

```ts
export interface ParticipantResponse {
  // ...現有欄位不變
  password?: string; // 選填，明文，防呆用途
}

export interface SubmitResponseInput {
  // ...現有欄位不變
  password?: string;
}
```

### 表單行為（`src/mobile/VoteTab.tsx`）

暱稱欄位維持必填；Email 欄位維持選填、不變。新增「密碼（選填）」欄位，行為：

1. 使用者輸入暱稱時（沿用現有 `useEffect` 比對邏輯，不分大小寫），若找到 `event.responses` 中的既有回覆：
   - **該回覆沒有設密碼** → 維持現行行為不變：自動帶入既有 `availability`/`email`/`comment`，可直接編輯送出。
   - **該回覆有設密碼** → **不**自動帶入既有作答內容（避免未輸入密碼就能看到別人的勾選結果）；顯示「此暱稱已有人使用，請輸入密碼」提示 + 密碼輸入框；勾選區與送出按鈕維持 disabled，直到輸入的密碼與該回覆的 `password` 完全相符，相符後才載入既有作答內容供編輯。
2. 若暱稱是全新的（無比對到既有回覆），密碼欄位單純選填；使用者可以留白，或設一組密碼供之後回來編輯用。
3. 密碼**不**存進 `localStorage`（跟 `LOCAL_USER_NICKNAME_KEY`/`LOCAL_USER_EMAIL_KEY` 不同），每次造訪都要重新輸入——這跟 When2meet 的行為一致，也避免密碼比 nickname/email 更敏感卻被明文留在瀏覽器裡。

### 送出驗證（`src/lib/localEventStore.ts` `submitResponse()`）

比對邏輯不能只靠前端擋：`submitResponse(id, input)` 內，比對到既有同暱稱（不分大小寫）回覆時，若該既有回覆 `password` 有值，且 `input.password` 與其不相符 → 拋錯（例如「此暱稱已被使用，密碼不正確」），不寫入。密碼沒設的既有回覆維持現行「直接覆蓋」行為不變。

### 路由：識別完成後直接進熱點圖，取消 Tab 切換

見下方「共用路由設計」一節（#6/#7/#12 共用同一套路由改動）。

---

## #7 + #12：主辦人控制整合進熱點圖、修正視覺重心

### 共用路由設計（`src/mobile/EventScreen.tsx` / `src/components/EventView.tsx`）

現有 `tab` state（`"vote" | "heatmap" | "host"`）與可見的 Tab 按鈕列整個移除，改成不顯示按鈕的 `view` state（`"identify_vote" | "heatmap"`），由角色與識別狀態推導預設值：

```ts
const isIdentifiedParticipant =
  !isHost &&
  !!nickname.trim() &&
  event.responses.some((r) => r.nickname.toLowerCase() === nickname.trim().toLowerCase());

const defaultView: "identify_vote" | "heatmap" =
  isHost || isIdentifiedParticipant ? "heatmap" : "identify_vote";
```

- **主辦人**：不論自己是否已投票，一律預設落在 `heatmap`（此頁現在也是主辦人操作面板，見下）。
- **已識別的參與者**（本機暱稱比對到既有回覆）：預設落在 `heatmap`。
- **全新訪客**：預設落在 `identify_vote`（強制先識別＋勾選，這是 #6 的核心，也順帶解決 #12——沒投過票的人根本不會先看到熱點圖，也就不會有「熱點圖頁面被催投票 CTA 蓋過」的狀況）。

URL hash 的 `tab` 參數保留，但只剩兩個值：`vote` | `heatmap`（原本的 `host` 值拿掉——主辦人現在造訪任何連結都是進整合後的熱點圖頁面）。若 URL 明確帶 `tab=vote` 或 `tab=heatmap`，覆蓋上面的預設推導（沿用現有「處理貼上連結時 hash-only 導航」的 `useEffect` 邏輯，型別窄化即可，邏輯不變）。

`src/App.tsx`：`initialTab` 型別從 `"vote" | "heatmap" | "host" | null` 改成 `"vote" | "heatmap" | null`，`tabParam` 比對拿掉 `"host"` 分支。確認過 `ShareModal.tsx`（桌面/行動兩份）只會產生 `tab=vote` 連結，從未產生 `tab=host`，不需要額外改動分享連結產生邏輯。

頁面內導航（原本「勾選完 → setTab('heatmap')」「熱點圖『更新時間』→ setTab('vote')」）維持一樣的使用者體驗，只是換成 `setView(...)`，不再有可點擊的 Tab 列。

### `HeatmapTab.tsx` 吸收 `HostTab.tsx`

`src/mobile/HostTab.tsx` **整個刪除**，其內容（拍板定案的時段選擇 + 備註 + 確認彈窗、投票已截止時的「重新開放投票」提示 + `ReopenModal`、危險操作「取消活動」+ `CancelEventModal`）搬進 `HeatmapTab.tsx`，在 `isHost` 為真時渲染成頁面最下方的常駐區塊（在「已填寫名冊」卡片之後、父層 `CommentBoard` 之前）。

`HeatmapTab` props 因此新增：`isHost: boolean`、`onFinalize`、`onReopen`、`onCancelEvent`、`onUpdateEvent`（新增，見 #10）、`isLoading: boolean`。`hostToken` 本身不需要傳進 `HeatmapTab`——沿用現有模式，`App.tsx` 的 `handleFinalize`/`handleReopen`/`handleCancelEvent` 已經在外層閉包住 `currentHostToken`，新的 `handleUpdateEvent` 用同一模式即可。

### 修正 #12：「還沒有勾選您的時間？」CTA 降權

現況：`HeatmapTab.tsx` 目前用一張 `--color-primary-subtle` 底色、雙行文字的大卡片呈現這個提示，視覺份量接近整頁最搶眼的區塊，跟頁面主題（熱點圖／主辦人操作）互相打架。

改動：把它從「大卡片」降級成「細長單行提示條」，視覺份量比照 `VoteTab.tsx` 裡 `votingClosed` 的提示條（小圖示 + 一行字 + 小按鈕，中性底色如 `--color-cream`，不用醒目的主色/警示色），維持在原本位置（活動資訊卡片之後、交集時段卡片之前），但不再是頁面裡最顯眼的區塊。

---

## #10：主辦人編輯活動資訊

### 範圍

可編輯：標題、活動說明、地點（沿用 `src/lib/location.ts` 的 `parseLocationInput`/`extractPlaceNameFromFullUrl`/`mockResolveShortLink`）、主辦人姓名、主辦人 Email、投票截止時間。
**不可編輯**：候選時段（日期/時間）、`mode`——理由見文件開頭「範圍確認」。

### 元件

新增 `src/mobile/EditEventModal.tsx`（桌面版透過 `EventView.tsx` 重用同一份，跟 `ReopenModal`/`CancelEventModal` 目前的重用模式一致）。

現有調查發現：專案裡沒有共用的 `Modal`/`Dialog` 元件，`ReopenModal.tsx`／`CancelEventModal.tsx` 都是各自手刻的 overlay（`position: absolute; inset: 0; background: rgba(26,18,8,0.55)`）+ 卡片（`background:#fff; borderRadius: var(--radius-modal)`）+ `Button variant="muted"`（取消）/`variant="hot"`（確認）的固定 footer，由呼叫端（原本是 `HostTab.tsx`，現在是併入 `HeatmapTab.tsx` 的主辦人區塊）用一個 boolean state 控制顯示。`EditEventModal` 比照這個既有慣例手刻，**不**額外抽出共用 `Modal` 元件（那是超出這次範圍的更大重構）。

也調查過 `CreateWizard.tsx`/`CreateEvent.tsx`：兩者都是「建立專用」的表單（`CreateWizard` 甚至是三步驟精靈），沒有 `initialValues`/編輯模式的支援，且欄位涵蓋候選時段/模式（這次不編輯的範圍）。直接重用會需要先幫它們加上編輯模式、再想辦法把「時段編輯」局部隱藏，反而比重新做一個小表單複雜。**因此 `EditEventModal` 是新建的小表單**，只涵蓋上述可編輯欄位，不重用 `CreateWizard`/`CreateEvent`。截止時間欄位比照 `ReopenModal` 用 `isoToLocalValue`/`localValueToIso`（`src/lib/eventStatus.ts`）轉換。

### 資料層

`src/types.ts` 新增：

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

`src/lib/localEventStore.ts` 新增 `updateEvent(id, input: UpdateEventInput): EventData`：驗證 `hostToken` 比對（比照 `finalizeEvent`/`cancelEvent`/`reopenEvent` 的模式，錯誤訊息也比照「主揪驗證失敗」文案）；若有帶 `title` 沿用 `createEvent()` 同樣的驗證（不可空白、不可超過 30 字）；只 patch 有帶到的欄位，`updatedAt` 更新，`persist()`。**不接受**、也不處理 `slots`/`mode` 欄位（型別上就沒有這兩個欄位，杜絕誤用）。

`src/lib/api.ts` 新增對應的 `updateEvent()` 薄封裝（比照現有 `finalizeEvent`/`cancelEvent`/`reopenEvent`：呼叫 store、`saveVisitedEvent()`，回傳 `EventData`）。

`src/App.tsx` 新增 `handleUpdateEvent`，比照 `handleFinalize`/`handleReopen`/`handleCancelEvent` 的既有模式（閉包 `currentHostToken`，呼叫 `api.updateEvent`，錯誤走現有 toast 機制），往下傳給 `EventScreen`/`EventView` 再傳進 `HeatmapTab` 的主辦人區塊觸發 `EditEventModal`。

---

## 涉及檔案總覽

| 檔案 | 改動類型 |
|---|---|
| `src/types.ts` | `ParticipantResponse.password`、`SubmitResponseInput.password`、新增 `UpdateEventInput` |
| `src/lib/localEventStore.ts` | `submitResponse()` 加密碼比對驗證；新增 `updateEvent()` |
| `src/lib/api.ts` | 新增 `updateEvent()` 薄封裝 |
| `src/mobile/VoteTab.tsx` | 新增密碼欄位與鎖定/解鎖邏輯 |
| `src/mobile/HeatmapTab.tsx` | 吸收 `HostTab.tsx` 全部內容成主辦人常駐區塊；CTA 提示條降權；新增 `EditEventModal` 觸發入口 |
| `src/mobile/HostTab.tsx` | **刪除** |
| `src/mobile/EditEventModal.tsx` | **新增** |
| `src/mobile/EventScreen.tsx` | 移除 Tab 按鈕列，`tab` state 改為推導式 `view` state |
| `src/components/EventView.tsx` | 同上（桌面版，獨立實作，各改一次） |
| `src/App.tsx` | `initialTab` 型別拿掉 `"host"`；新增 `handleUpdateEvent` |

---

## 測試/驗證方式

- `npm run lint`（`tsc --noEmit`）確認型別正確
- 用 dev server 手動走一遍（桌面 + 行動兩種 viewport）：
  - 全新訪客開活動連結 → 直接落在識別＋勾選畫面（不是熱點圖）
  - 送出後自動跳到熱點圖，畫面上看不到任何 Tab 按鈕
  - 已投過票、本機暱稱比對得到既有回覆的訪客 → 直接落在熱點圖
  - 熱點圖點「更新時間」跳回勾選畫面，資料正確帶入
  - 用已有密碼保護的暱稱重新輸入 → 勾選區鎖定、需要密碼才能解鎖並看到/編輯既有作答
  - 用沒有密碼的既有暱稱重新輸入 → 維持現行「直接帶入可編輯」行為
  - 密碼錯誤時送出應該被 `localEventStore.submitResponse` 擋下（不只前端擋）
  - 主揪連結開啟 → 熱點圖頁面下方看到拍板定案／重新開放投票／取消活動／編輯活動資訊，且無需切換頁籤
  - 未投票時熱點圖頁面的提示條是細長不搶眼樣式，不是最顯眼區塊
  - 編輯活動資訊：改標題/地點/截止時間等，存檔後熱點圖頁面即時反映；候選時段不受影響，既有回覆的 `availability` 不變

## 暫不處理（Out of Scope）

- 候選時段（日期/時間）編輯——風險與理由見文件開頭
- 密碼修改/忘記密碼流程——超出 MVP 範圍，When2meet 本身也沒有這類機制
- 抽出共用 `Modal`/`Dialog` 元件——沿用現有手刻慣例即可，抽元件是更大範圍的技術債整理
