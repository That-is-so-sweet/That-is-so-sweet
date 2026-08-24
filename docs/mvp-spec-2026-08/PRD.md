# 揪甘心 — Product Requirements Document (PRD)

> 依 `product-manager-skills` 外掛的 `prd-development` workflow skill（`skills/prd-development/SKILL.md` + `template.md`）產出，並用 `jobs-to-be-done`（第 3 節）、`product-strategy-session`（第 4 節 Positioning Statement）、`prioritization-advisor`（第 11 節）、`roadmap-planning`（第 12 節）四個技能補強對應段落。標記方式沿用這些 skill 共用的規範：🔶 **Assumption**（合理推論但尚未驗證）／🔵 **Open Question**（未知，需要進一步討論或研究才能回答）。
>
> **關於這幾個技能的產出方式的重要說明**：`product-strategy-session`／`roadmap-planning`／`prioritization-advisor` 原本的設計是跨 1-4 週、由 PM＋工程＋設計＋利害關係人共同參與的工作坊流程（訪談、共同評分、簡報對齊）。這裡沒有真實團隊可以協作，因此以下內容是**我（協助草擬者）依現有素材（產品規劃簡報、SPEC.md、prototype 程式碼）單獨完成的第一版產出**，對應到 `prioritization-advisor` 自己列出的「Pitfall 4: Solo PM Scoring」——所有評分與排序都需要之後找工程／設計一起重新過一次，不能直接當作定案依據。

## Document Information

**Authors**：merano（產品／專案負責人）
**Reviewers**：[待補 — 工程負責人]、[待補 — 設計負責人]
**Date**：2026-08-24

| Version | Date | Author | Change Description |
|---|---|---|---|
| 0.1 | 2026-08-24 | merano（協助草擬：Claude） | 初稿，依 prd-development skill 產出，範圍為 Phase 1（Must-have） |

**與其他文件的關係**：本文件是產品層的 PRD（問題、使用者、成功指標、故事）；[SPEC.md](./SPEC.md) 是對應的工程規格草案（技術架構、資料庫 schema、API 設計）。兩份文件的 Phase 1 範圍應保持一致，SPEC.md 第 5 節的技術架構建議可視為本文件第 9 節「依賴」的延伸。

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users & Personas](#3-target-users--personas)
4. [Strategic Context](#4-strategic-context)
5. [Solution Overview](#5-solution-overview)
6. [Success Metrics](#6-success-metrics)
7. [User Stories & Requirements](#7-user-stories--requirements)
8. [Out of Scope](#8-out-of-scope)
9. [Dependencies & Risks](#9-dependencies--risks)
10. [Open Questions](#10-open-questions)
11. [Prioritization Framework & Rationale](#11-prioritization-framework--rationale)
12. [Roadmap & Sequencing](#12-roadmap--sequencing)

---

## 1. Executive Summary

我們正在打造**揪甘心**——一個免登入、免加好友的聚會時間協調工具，讓**主揪（活動發起人）**用一個可分享的連結取代「在 LINE 群組裡反覆詢問時間」的溝通方式，解決主揪平均要花 5 天、來回問好幾輪才能定案的問題（🔶 Assumption：此基準值來自團隊內部產品規劃時的質化觀察，尚未經過正式量化研究，見第 2 節）。**參與者**則能用勾選取代開行事曆手動比對、打字回覆，降低參與門檻。

Phase 1 的目標不是把所有聚會相關功能一次做完，而是先驗證一個核心假設：**用「時間投票連結」取代「LINE 群組人工喬時間」，能不能讓喬時間這件事真正變快、變輕鬆**。驗證成立後，才進入 Phase 2（減輕主揪的活動當天/收尾行政負擔）與 Phase 3（提升聚會體驗）。

---

## 2. Problem Statement

### Who Has This Problem?

- **主揪**：發起聚會邀約的人，通常在 LINE 群組裡負責統整大家的時間
- **參與者**：收到揪團邀約、需要回覆自己是否有空的人

### What Is the Problem?

主揪在揪團前期需要反覆詢問、手動整理每個人的可行時間，平均花 5 天、來回問好幾輪才能定案；參與者則因為要開行事曆確認、打字回覆而拖延，甚至因行程未定而錯失參與機會。整個過程感覺「像在開會」，而不是單純約一個聚會。

### Why Is It Painful?

- **主揪端影響**：溝通成本高（反覆催促、整理回覆）、成員回覆率低導致活動停滯（「到底誰什麼時間可以？」），活動結束後還要承擔所有行政收尾工作，容易產生「下次不要我揪好了」的倦怠感
- **參與者端影響**：不知道怎麼回覆時間、不確定其他人的選擇狀況、投票後不知道時間是否已經確定，體驗旅程中反覆出現「不知道」「不確定」的焦慮感
- **對產品目標的影響**：如果喬時間這一步本身就讓人卻步，活動可能根本「成不了團」——這是比「聚會體驗好不好」更上游、更根本的問題，也是 Phase 1 唯一要解決的事

### Evidence

- **產品規劃簡報**（假設驗證：找痛點／User Journey）：整理出主揪與參與者兩條旅程的具體痛點與情緒台詞（例如「只是約一個活動，為什麼像在開會？」「所以哪一天時間會確定下來？」）
- 🔶 **Assumption**：上述痛點描述目前源自團隊內部觀察與產品規劃討論，尚未附上逐字訪談記錄或量化樣本數
- 🔵 **Open Question**：目前沒有正式的使用者訪談樣本數、分析數據或支援單量佐證「平均 5 天」「60% 情境下活動停滯」這類具體數字的真實比例——需要透過 discovery interview 或既有 LINE 群組使用行為觀察補齊量化證據
- **Interviews / Customer quote**：🔵 Open Question（尚未有正式逐字訪談記錄可引用）

---

## 3. Target Users & Personas

### Primary Persona：主揪

- **角色**：朋友圈／同事圈裡習慣發起聚會的人，通常對社群互動積極、但不一定是技術背景使用者
- **情境**：習慣用 LINE 群組揪團，沒有專門的協調工具，全靠手動整理回覆
- **目標**：快速找出大家都有空的時間，不想花太多時間催促或整理
- **痛點**：反覆詢問耗時、無法一眼看出所有人狀態、活動因回覆率低而失去動能、活動收尾的行政工作全落在自己身上
- **現有行為**：開 LINE 群組直接問「大家這週六有空嗎」，手動記錄、比對每個人的回覆

### Secondary Persona：參與者

- **角色**：收到揪團邀約的朋友／同事，被動角色
- **與主揪的差異**：參與門檻的容忍度低——只要多一個步驟（開行事曆、加好友、註冊帳號）就可能拖延或乾脆不回；不需要看到彙整全貌，只需要快速確認並回覆自己的狀態

### Jobs-to-Be-Done

> 依 `jobs-to-be-done` skill 的結構（Functional／Social／Emotional Jobs、Pains、Gains）分別針對兩個 persona 展開。🔶 Assumption：以下內容整理自產品規劃簡報（User Journey／假設驗證）與團隊觀察，尚未經過正式的顧客訪談或「switch interview」驗證，屬於待驗證的假設而非已確認的研究結論。

#### 主揪（Host）

**Functional Jobs**
- 快速找出所有受邀者都有空的時間
- 把最終確定的時間、地點清楚傳達給所有人
- 活動有變動（取消／改期）時，快速通知所有人

**Social Jobs**
- 在朋友圈裡被認為是「好約、揪團很順」的人，而不是「一直來煩人」的人
- 讓被邀約的人覺得自己的時間有被尊重、不是被單方面通知的對象

**Emotional Jobs**
- 不想因為活動一直卡在喬時間階段而感到疲乏、甚至想放棄揪團（見第 2 節「下次不要我揪好了」）
- 想要有安全感：知道彙整結果大家都看得到，不用自己再手動確認一次

**Pains**
- *Challenges*：反覆在群組裡問、等回覆、再問一次；不同人用不同方式回覆（貼圖、文字、已讀不回），難以彙整
- *Costliness*：平均花 5 天以上、多輪來回才能定案（🔶 Assumption，見第 2 節）
- *Common mistakes*：忘記追問還沒回覆的人；誤把「已讀」當成「有空」
- *Unresolved problems*：LINE 群組沒有結構化的方式呈現「誰在什麼時候有空」，只能靠人工在腦中或紙上比對

**Gains**
- *Expectations*：打開連結就能一眼看到彙整結果，不用自己動手整理
- *Savings*：把決策天數從平均 5 天明顯縮短（具體目標值待定，見第 10 節開放問題）
- *Adoption factors*：參與者不需要額外安裝 App 或註冊帳號，主揪才會願意在下次揪團時繼續使用
- *Life improvement*：揪團變成一件輕鬆的事，而不是「像在開會」，主揪才會願意繼續當主揪、不會揪團倦怠

#### 參與者（Participant）

**Functional Jobs**
- 用最少的操作步驟確認並回覆自己是否有空
- 知道最終確定的時間與地點，不會漏掉活動

**Social Jobs**
- 在朋友圈裡被認為是「秒回、好約」的人
- 不想成為「一直沒回覆、拖累大家」的人

**Emotional Jobs**
- 不想因為行程還沒確定而被迫太早做承諾、之後又要反悔
- 想要有安心感：知道自己的回覆有被看到、不用擔心被忽略

**Pains**
- *Challenges*：要開行事曆確認才敢回覆；不確定其他人是不是真的都有空
- *Costliness*：每次揪團都要花時間手動比對自己的行程跟大家提議的時間
- *Common mistakes*：忘記回覆，或看錯時段而答應了其實沒空的時間
- *Unresolved problems*：LINE 群組留言串一多，容易錯過關鍵訊息（例如「所以最後是哪一天？」找不到答案）

**Gains**
- *Expectations*：點開連結不用加好友、不用登入，就能直接勾選
- *Savings*：不用再打字說明自己的時間，勾選就好
- *Adoption factors*：介面簡單、不會被要求填一堆額外資料
- *Life improvement*：收到揪團邀約時不再感到壓力，能輕鬆決定要不要參加

**Pains 優先順序**（依 skill 建議的「先排序再動手」原則，🔶 Assumption）：主揪端的 *Costliness*（喬時間天數）與參與者端的 *Challenges*（不確定其他人是否真的有空）是目前判斷強度最高的兩個痛點，也正是 Phase 1 Must-have（第 5、7 節）直接對應要解決的——其餘痛點多半是伴隨這兩者被連帶改善，而非 Phase 1 獨立要解的問題。

---

## 4. Strategic Context

### Business Goals

- 🔵 **Open Question**：本專案目前尚未對應到明確的公司 OKR 或商業指標——需要與利害關係人確認 Phase 1 對應的業務目標是什麼（例如：驗證核心假設本身是否就是這個階段的「目標」，而非營收/成長指標）

### Market Opportunity（TAM / SAM / SOM）

- 🔵 **Open Question**：尚未進行市場規模估算。Phase 1 屬於驗證核心假設的 concierge MVP 階段，暫不需要市場規模數字；待假設驗證成立、要決定是否擴大投入時再評估

### Competitive Landscape

- 🔶 **Assumption**：目前使用者的主要「替代方案」是 LINE 群組人工喬時間，以及市面上既有的時間協調工具（如 When2meet、Doodle 等）——這是團隊的合理推測，尚未做正式的競品比較分析
- 🔵 **Open Question**：需要正式盤點 When2meet／Doodle／抓時間等既有工具的功能與體驗，釐清揪甘心「免登入、免加好友、LINE 分享優先」的差異化是否站得住腳

### Positioning Statement

> 依 `product-strategy-session` skill 第一階段（Positioning & Market Context）的 Geoffrey Moore 定位聲明格式產出。

> **For** 需要揪團、但受不了在 LINE 群組裡反覆喬時間的主揪與參與者，
> **who** 想要用更輕鬆、免登入的方式找出大家都有空的時間，
> **揪甘心 is a** 免登入聚會時間協調工具，
> **that** 用一個分享連結取代群組人工喬時間，讓彙整、定案、通知一次到位。
> **Unlike** 在 LINE 群組裡手動詢問、或需要額外註冊帳號才能使用的協調工具，
> **our product** 不需要參與者加好友或註冊帳號就能直接勾選時段，且原生對應 LINE 群組分享的使用情境。

🔵 **Open Question**：「Unlike」段落點名的差異化目前只對比了「LINE 群組手動詢問」這個最主要的替代方案；對 When2meet、Doodle 等既有時間協調工具的具體功能與體驗差異，尚未做正式比較（對應第 4 節「Competitive Landscape」的開放問題）。

### Why Now?

先讓活動能成團，再優化活動體驗——這是團隊在產品規劃階段定下的核心原則，Phase 1 聚焦驗證「喬時間」這個核心假設。目前已經有一版可互動的 prototype（本 repo 目前的靜態前端展示），驗證過核心互動流程並收集了初步 UX 回饋（見 [docs/ux-feedback-2026-08/PLAN.md](../ux-feedback-2026-08/PLAN.md)），具備進入正式（含後端）開發的時機。

---

## 5. Solution Overview

### Solution Description

主揪建立活動並列出候選時段（可只選日期，也可以進一步指定時段），系統產生一個免登入即可開啟的分享連結。參與者點開連結後填寫暱稱（＋Email，用於後續通知），針對每個候選時段勾選可行／可能可以／不可行；系統即時彙整所有回覆成熱點圖，主揪從彙整結果中選定最終時段並一鍵定案，定案後系統自動通知所有已回覆的參與者最終時間與地點。

### Key Features（Phase 1 / Must-have）

1. 主揪發起活動，系統自動產生可分享連結
2. 參與者透過連結免加好友、免登入即可勾選可行時段
3. 系統自動彙整所有人勾選結果，篩出共同可行時段（熱點圖）
4. 主揪可查看彙整結果並一鍵確認最終時間
5. 確認後系統自動通知所有參與者

### 互動流程參考

現有 prototype 已經驗證過上述互動流程的 UI/UX（見 [SPEC.md 附錄](./SPEC.md#附錄與現有-prototype-程式碼對照)），Phase 1 開發可以沿用其互動設計，但整個資料存取層需要改成串接真正的後端（現有 prototype 是純前端存 localStorage，沒有後端，細節見 SPEC.md 第 2 節）。

### User Flows / Story Map

- 未另外產出視覺化 user flow／story map；上述「互動流程參考」與 SPEC.md 第 3 節的 Use Case 可作為替代參考

---

## 6. Success Metrics

### Primary Metric

- **指標**：主揪從發起活動到完成定案的決策時間（天數）
- **現況基準**：🔶 Assumption：平均 5 天（來自產品規劃階段的質化觀察，非嚴謹統計）
- **目標**：🔵 Open Question：具體要縮短到幾天，需要與利害關係人一起訂
- **測量時機**：Phase 1 上線後持續追蹤

### Secondary Metrics

- **參與者投票完成率**：收到連結後，實際完成勾選的比例。🔵 Open Question：目前無基準值
- **定案後到場率／滿意度**：間接反映流程是否真的降低了溝通摩擦與不確定感。🔵 Open Question：目前無基準值與測量方式

### Guardrail Metrics

- **連結開啟到成功送出投票的轉換率**：新增「暱稱＋Email」識別欄位（免登入機制）不應該讓這個轉換率明顯下降。這對應 [docs/ux-feedback-2026-08/PLAN.md](../ux-feedback-2026-08/PLAN.md) 子專案 B 正在處理的識別流程改動，Phase 1 開發時需要一併關注

---

## 7. User Stories & Requirements

### Epic Hypothesis

我們相信，如果用一個免登入、免加好友的時間投票連結取代 LINE 群組裡人工喬時間，主揪的決策時間可以從平均 5 天大幅縮短，參與者的回覆意願與速度也會提升，因為參與門檻降低了。我們會透過 Phase 1 上線後的實際使用數據（定案天數、投票完成率、連結轉換率）驗證這個假設是否成立。

### User Stories

**Story 1：建立活動並取得分享連結**

As a 主揪, I want 填寫活動名稱與候選時段後立即拿到一個可分享的連結, so that 我不用手動整理時間表傳給每個朋友。

**Acceptance Criteria:**
- [ ] 活動名稱為必填，且不可超過長度上限
- [ ] 至少需要 1 個候選時段才能送出
- [ ] 送出後立即產生活動連結與（僅主揪可見的）管理權限，不需額外註冊或登入

**Story 2：免登入投票**

As a 參與者, I want 點開連結後直接輸入暱稱就能勾選可行時段, so that 我不用加好友、不用註冊帳號也能快速回覆。

**Acceptance Criteria:**
- [ ] 開啟連結不需要登入或加好友
- [ ] 針對每個候選時段可選擇「可行／可能可以／不可行」
- [ ] 用同一個暱稱（或未來的識別機制，見第 10 節開放問題）再次開啟連結時，可以修改先前送出的回覆，而不是產生一筆新紀錄
- [ ] 若活動已取消或已定案，不接受新的投票，並清楚告知原因

**Story 3：查看彙整結果**

As a 主揪, I want 一個畫面看到所有人彙整後的可行時段熱度, so that 我不用自己一筆筆對照每個人的回覆。

**Acceptance Criteria:**
- [ ] 每個候選時段顯示可行／可能可以／不可行的人數與名單
- [ ] 有新回覆時，彙整結果需要更新（可接受頁面重新整理後更新，不強制即時推播）

**Story 4：一鍵定案**

As a 主揪, I want 從彙整結果中選定最終時段並一鍵確認, so that 我不用再回群組另外宣布一次。

**Acceptance Criteria:**
- [ ] 只有通過主揪身分驗證的人可以執行定案
- [ ] 定案時可附加備註（例如集合地點細節）
- [ ] 定案後活動狀態變更為「已定案」，且不再接受新投票（除非主揪重新開放）

**Story 5：定案通知**

As a 參與者, I want 主揪定案後自動收到通知, so that 我不會錯過已經確定的時間而漏掉活動。

**Acceptance Criteria:**
- [ ] 定案後，系統對所有留下聯絡方式的參與者發送通知，內容包含最終時間、地點、備註
- [ ] 通知發送失敗需要被記錄，不可靜默遺失（不保證即時重試，但至少要能被排查）

**Story 6：活動狀態管理（取消／重新開放）**

As a 主揪, I want 可以取消活動或重新開放投票, so that 計畫有變時我不用整個活動重來一次。

**Acceptance Criteria:**
- [ ] 主揪可將已定案活動改回進行中、重新收集回覆
- [ ] 主揪可直接取消整個活動，並通知已回覆的參與者
- [ ] 連結有效期：活動結束（最終時段日期）超過 7 天後，連結顯示明確的「已失效」畫面，而非一般錯誤

**Story 7：留言互動（含提示）**

As a 參與者, I want 在活動頁面留言, so that 我可以跟主揪或其他人溝通細節，不用另外開群組。

**Acceptance Criteria:**
- [ ] 留言前明確提示「留言會觸發通知信」，避免亂打造成無意義通知（對應 UX 回饋 PLAN.md 第 4 項）
- [ ] 留言內容有長度限制

### Constraints & Edge Cases

- **技術限制**：目前完全沒有後端／資料庫／通知機制，Phase 1 等於要從零建置整套後端（見 SPEC.md 第 5 節建議架構）
- **邊界情況**：投票截止後、活動已取消／已定案時的各種操作阻擋；同一暱稱在不同裝置上的識別衝突（見第 10 節開放問題）；連結過期後的畫面呈現

---

## 8. Out of Scope

### Not Included in This Release（Phase 1）

- **快閃聊天室、AI 選餐廳、分帳功能** — 屬於 Phase 2「減輕主揪壓力」，Phase 1 只驗證核心喬時間假設，避免資源分散
- **飲食護照、菜單翻譯、邀請函等進階功能** — 屬於 Phase 3「提升聚會體驗」，需等核心成團問題解決、假設驗證成立後再評估
- **跨平台行事曆自動同步** — 明確排除；單向「加入行事曆」匯出連結不在排除範圍內（prototype 已有的小功能，可視資源併入 Phase 1）

### Future Considerations（Should-have，視 Phase 1 資源決定是否納入，非必要不做）

- 未回覆者的提醒通知
- 「可能可以／暫定」的彈性回覆選項（降低承諾壓力）
- 時段衝突時的次佳選項建議

---

## 9. Dependencies & Risks

### Dependencies

- **Technical**：需要新建後端 API 服務與關聯式資料庫（現有 prototype 完全沒有，見 [SPEC.md 第 5 節](./SPEC.md#5-建議技術架構草案待工程團隊定案)的建議架構草案）
- **External**：通知寄送服務尚未選定（Email provider，或是否也要支援 LINE Notify）——見第 10 節開放問題
- **Team**：工程團隊 kickoff 需要對齊 SPEC.md 的技術架構建議；設計端需確認是否要在現有 prototype UI 基礎上重新出正式視覺稿

### Risks & Mitigations

- **Value risk**：核心假設本身可能不成立——如果使用者普遍覺得「在 LINE 群組裡問一下」比「打開新連結」更省事，或多數參與者仍傾向直接留言回覆而非使用勾選介面，遷移成本會蓋過新體驗價值（見第 2 節「推翻條件」）
  - **Mitigation**：Phase 1 上線後緊盯「定案天數」與「投票完成率」兩個核心指標；如果不如預期，優先重新檢視核心互動設計，而不是急著加新功能
- **Usability risk**：新增的免登入識別機制（暱稱＋Email）可能造成新的摩擦點，或讓參與者搞混自己先前的回覆
  - **Mitigation**：對應 [docs/ux-feedback-2026-08/PLAN.md](../ux-feedback-2026-08/PLAN.md) 子專案 B 正在處理的項目，Phase 1 開發時需要一併納入設計
- **Feasibility risk**：目前沒有任何後端／資料庫／通知機制，屬於從零建置
  - **Mitigation**：依 SPEC.md 建議架構分階段實作，優先做出最小可行後端，不追求一次到位
- **Viability risk**：商業模式與資源投入尚未定案（見第 4、10 節開放問題）
  - **Mitigation**：與利害關係人確認 Phase 1 的資源與時程承諾後，再正式排入工程排程

---

## 10. Open Questions

| Question | Owner | Deadline | Status |
|---|---|---|---|
| 後端技術棧、資料庫、託管方式的最終選型（SPEC.md 已提出建議方案） | 待指派 | 待定 | Open |
| 通知管道：Email、LINE Notify，還是兩者都要 | 待指派 | 待定 | Open |
| Phase 1 對應的正式業務目標／OKR | 待指派 | 待定 | Open |
| 「決策天數」「投票完成率」等核心指標的精確基準值與目標 | 待指派 | 待定 | Open |
| 是否需要正式的競品分析（When2meet／Doodle 等）與市場規模估算 | 待指派 | 待定 | Open |
| Should-have 三項（提醒通知／彈性回覆／次佳選項建議）是否納入 Phase 1 | 待指派 | 待定 | Open |
| 商業模式：是否收費、未來是否有付費層 | 待指派 | 待定 | Open |
| 參與者識別機制：暱稱比對是否足夠，或需要更嚴謹的重複回覆識別方式 | 待指派 | 待定 | Open |
| 資料保存政策：連結失效後資料要保留多久、是否提供匯出／刪除機制 | 待指派 | 待定 | Open |
| 「免登入」核心定位 vs. 飲食護照（Epic D，第 12 節）需要的跨活動身份識別，兩者是否有根本衝突；是否要引入一個不強制、可選的輕量識別機制 | 待指派 | 待定（建議在 Phase 3 排入開發前解開） | Open |

---

## 11. Prioritization Framework & Rationale

> 依 `prioritization-advisor` skill 的 4 個情境問題自我作答後推薦框架，再套用到第 8 節的 Should-have 候選項排序。🔶 Assumption：以下 4 題答案是我依現有專案脈絡推斷，不是團隊實際訪談的結果，見下方說明。

### 情境判斷

| 問題 | 判斷 | 依據 |
|---|---|---|
| 產品階段 | Pre-product/market fit | 目前正在驗證「用時間投票連結取代人工喬時間」這個核心假設本身，尚未有正式使用者與數據（見第 2、6 節） |
| 團隊情境 | Small team, limited resources | 🔶 Assumption：目前僅由 PM 一人整理規格，工程／設計團隊尚未組成或投入，見第 9 節 Dependencies |
| 決策需求 | Too many ideas, unclear which to pursue | 第 8 節已有 Should-have 三項候選，但彼此之間、以及跟 Phase 2/3 候選項之間都還沒有明確排序 |
| 資料可得性 | Minimal data | 沒有使用數據、沒有嚴謹量化訪談（見第 2 節 Evidence 的 Open Question） |

### 推薦框架：ICE（Impact, Confidence, Ease）

**為什麼適合**：Pre-PMF＋資料極少的組合，正好對應 `prioritization-advisor` skill 自己舉的「Bad Framework Match」範例——RICE 需要 Reach（使用量數據）才能算，但我們現在完全沒有；小團隊、資源有限也負擔不起 RICE 的評分開銷。ICE 是輕量、快速的 gut-check 框架，適合現在這種「還在驗證核心假設」的階段。

**不適合的框架**：RICE（缺乷 Reach 所需的使用數據）、Weighted Scoring（需要多方利害關係人共同定義權重，但目前團隊還沒成形）。

**⚠️ 重要限制**：以下評分是我單獨完成的（對應 skill 自身警告的「Pitfall 4: Solo PM Scoring」），並非 PM＋工程＋設計共同評分的結果。**這組分數只能當作草稿參考，工程團隊 kickoff 後應該重新一起評一次。**

### Should-have 三項的 ICE 評分（Impact／Confidence／Ease，各項 1–5 分，總分 = 三項相加，滿分 15）

| 候選項 | Impact | Confidence | Ease | 總分 | 排序理由（🔶 Assumption） |
|---|---|---|---|---|---|
| 「可能可以／暫定」彈性回覆選項 | 4 | 3 | 4 | **11** | 直接對應第 3 節參與者 Emotional Job「不想被迫太早承諾」，資料模型已有 `if_needed` 狀態可延伸，實作成本相對低 |
| 未回覆者的提醒通知 | 3 | 3 | 4 | **10** | 對「投票完成率」次要指標有直接幫助，但需要額外的排程與通知邏輯 |
| 時段衝突的次佳選項建議 | 2 | 2 | 2 | **6** | 情境較邊緣、演算法邏輯較複雜，且尚不確定實際發生頻率有多高 |

**排序建議**：如果 Phase 1 資源允許加入 Should-have，優先順序是「彈性回覆選項」>「未回覆者提醒」>「次佳選項建議」——但仍以第 8 節的預設立場（Should-have 三項全部先不做、Phase 1 只做 Must-have）為準，除非工程資源評估後有餘裕。

### 延伸評分：Phase 2／Phase 3 候選 Epic 的初步 ICE 評分（方向性參考）

第 12 節把 Phase 2／Phase 3 的候選項目展開成獨立 Epic 後，這裡先做一輪最粗淺的 ICE 評分，作為「等 Phase 1 驗證成立、真的要排 Phase 2 時」的起點，而不是現在就要排入開發。🔶 Assumption 標記程度比上面 Should-have 評分更高——這 6 個 Epic 連 Epic Hypothesis 都還沒被使用者驗證過，Confidence 分數普遍偏低是合理的。

| Epic（對應第 12 節） | Impact | Confidence | Ease | 總分 | 備註 |
|---|---|---|---|---|---|
| C. 分帳功能 | 3 | 3 | 3 | **9** | 功能性需求明確、不確定性相對低，是 Phase 2 裡評分最穩的一項 |
| A. 快閃聊天室 | 4 | 2 | 3 | **9** | 對應 User Journey 裡「收尾行政負擔」的明確痛點，但「使用者是否真的想要另一個聊天室，而不是繼續用 LINE」尚未驗證 |
| F. 邀請函 | 2 | 3 | 4 | **9** | 影響力有限（錦上添花），但實作把握度高、成本低 |
| B. AI 選餐廳 | 3 | 2 | 2 | **7** | 依賴第三方地圖／餐廳資料與 AI 推薦可靠性，不確定性與實作成本都偏高 |
| E. 菜單翻譯 | 2 | 2 | 3 | **7** | 服務的是特定情境（跨語言聚會），目前不知道這個情境佔多少比例的實際使用 |
| D. 飲食護照 | 2 | 1 | 1 | **4** | 見第 12 節：這個 Epic 在架構上可能跟「免登入」的產品定位衝突，Confidence／Ease 都是目前最低 |

**初步排序（僅供 Phase 2 啟動時參考）**：分帳功能、快閃聊天室、邀請函三者同分並列最高；AI 選餐廳與菜單翻譯次之；飲食護照分數最低，且附帶一個需要先解開的架構開放問題（見第 12 節）。

### 備選框架（Second Choice）

如果團隊組成後發現 ICE 太主觀、利害關係人對評分結果有異議，可以改用 **Value/Effort 2x2 矩陣**：把 Impact 與 Confidence 合併成一個「Value」軸（用相對排序取代 1–5 打分，減少「這題到底該打 3 分還是 4 分」的爭論），Ease 維持成「Effort」軸。矩陣式的視覺呈現對跨職能利害關係人溝通更直覺，缺點是失去了 ICE 的量化排序精細度，適合用在「跟非產品背景的利害關係人一起對齊優先序」的場合。

### 這個框架容易踩的坑（對應 skill 的 Common Pitfalls）

1. **把分數當成絕對真理**：11 分不代表「這個功能一定比 10 分的更該做」——目前的分差都在 1–2 分之間，屬於同一個信心區間，不該拿來做非黑即白的取捨
2. **Confidence 灌水**：上面所有 Phase 2/3 的 Confidence 都刻意壓低（1–3 分），因為這些 Epic 連基本的使用者驗證都還沒做，如果之後重新評分時 Confidence 突然變高，要先問「是因為真的有新證據，還是只是想讓喜歡的功能排名往前」
3. **忽略策略考量**：ICE 分數沒有把「產品定位」這種策略因素算進去——例如飲食護照雖然分數最低，但它跟免登入定位的衝突是一個策略層級的問題，不是單純加把勁提高 Confidence 就能解決的，需要先在第 4 節的定位討論裡拍板

### 什麼時候要重新評估

- Phase 1 上線、拿到第一批真實決策天數／投票完成率數據之後（產品階段從 Pre-PMF 往前推進，可能改用更數據導向的框架如 RICE）
- 工程／設計團隊正式組成之後（從「小團隊資源有限」變成有能力做更完整的協作評分）
- 第 4 節「商業模式」開放問題被回答之後（如果決定要做付費層，Impact 的定義可能需要納入營收考量，不能只看使用者體驗）

---

## 12. Roadmap & Sequencing

> 依 `roadmap-planning` skill 的 Now/Next/Later 格式，把已知的 Phase 1/2/3 規劃（來自產品規劃簡報的 Roadmap 頁）展開成帶 Epic Hypothesis 的排程。因為目前只有 Phase 1 有明確範圍（見第 8 節），Next／Later 只列方向，不展開詳細 hypothesis 與 t-shirt sizing。

### NOW（Phase 1 — 降低成團阻力）

**Epic：免登入時間投票核心流程**（涵蓋第 7 節 Story 1–7）

- **Hypothesis**：見第 7 節 Epic Hypothesis
- **Success metric**：主揪決策天數、參與者投票完成率（見第 6 節）
- **Effort（T-shirt size）**：🔶 Assumption：**L**（2–3 個月，3–5 人）——因為要從零建置後端 API、資料庫、通知服務（見 SPEC.md 第 5 節），不是單純的前端功能開發；🔵 Open Question：正式估點需要工程團隊實際評估，這裡只是 PM 的粗估
- **依賴**：無前置依賴，可立即排入

#### NOW 內部的釋出切分（Release Slices）

「L」是一個籠統的估點，7 個 User Story（第 7 節）不需要也不應該一次全部做完才上線。依「哪些是驗證核心假設的最小必要路徑」拆成 4 個內部釋出切片，v0 完成就能開始測量第 6 節的核心指標：

| 切片 | 涵蓋 Story | 為什麼放這裡 | Effort |
|---|---|---|---|
| **v0（核心迴圈，阻塞項）** | Story 1 建立活動、Story 2 免登入投票、Story 3 查看彙整結果、Story 4 一鍵定案 | 這 4 個 Story 是「發起 → 投票 → 彙整 → 定案」的最小完整迴圈——少了任何一個，連「決策天數」這個核心指標都量不出來，是唯一真正阻塞驗證的部分 | 🔶 M–L |
| **v0.1（通知迴圈）** | Story 5 定案通知 | Must-have 明確要求「確認後系統自動通知所有參與者」，不可省略；但技術上可以在 v0 的 API 都打通、資料模型穩定後才接通知服務（見第 9 節依賴：通知管道尚未選定） | 🔶 S–M |
| **v0.2（例外流程）** | Story 6 活動狀態管理（取消／重新開放） | 對「驗證核心假設」不是阻塞項，但活動一旦對真實使用者開放，「計畫有變」是必然會發生的情境，建議在正式對外開放前補齊，不建議跳過直接上線 | 🔶 S |
| **v0.3（互動輔助）** | Story 7 留言互動（含提示） | prototype 已有可參考的實作，體驗上是加分但非核心必要；如果時程吃緊，🔶 Assumption：短期內甚至可以先不做，讓使用者退回原本的 LINE 群組討論細節，不影響核心假設的驗證 | 🔶 S |

**排序邏輯**：v0 → v0.1 → v0.2，這三個建議依序完成、缺一不可才能算「正式對外開放」；v0.3 是唯一可以視資源狀況延後、甚至暫時不做的切片。

### NEXT（Phase 2 — 減輕主揪壓力，🔵 待 Phase 1 假設驗證成立後才展開細節）

**Epic A：快閃聊天室**
- **Hypothesis**：我們相信，如果幫每個活動自動配一個有效期限的聊天室（活動結束或一段時間後自動失效），可以取代主揪手動開 LINE 群組、事後還要記得解散或維持安靜的收尾負擔，因為社交協調需求集中在活動前後的特定時間窗口，不需要一個永久群組
- **Success metric（候選）**：🔵 Open Question：目前沒有收集「活動收尾行政負擔」的機制，需要先定義量測方式（例如活動結束後的主揪滿意度調查）
- **Effort**：🔶 M（3–4 週）——聊天室的資料模型、訊息儲存、自動失效排程，複雜度中等
- **依賴**：無直接依賴，但邏輯上需要在 Phase 1 的活動生命週期狀態機（`active`/`finalized`/`cancelled`）之上擴充

**Epic B：AI 選餐廳**
- **Hypothesis**：我們相信，如果定案後根據地點與人數主動推薦附近餐廳選項，可以減少主揪額外花時間找餐廳、發起第二輪討論的負擔
- **Success metric（候選）**：使用推薦功能的活動比例；推薦結果被實際採用（最終地點＝AI 建議）的比例
- **Effort**：🔶 L——需要串接第三方地圖／餐廳資料 API，且要處理 AI 生成內容可靠性的問題（例如推薦到已歇業店家）
- **依賴**：可以直接建立在 Phase 1 已有的 `EventLocation` 資料模型上（見 SPEC.md），不需要等其他 Phase 2 Epic

**Epic C：分帳功能**
- **Hypothesis**：我們相信，如果活動結束後可以直接在同一個連結裡記錄花費並自動算出每人該付多少，可以減少主揪收尾時額外開群組、用計算機分帳的負擔
- **Success metric（候選）**：分帳功能的活動使用率
- **Effort**：🔶 M——需要新增花費紀錄的資料模型與計算邏輯，相對是「加一個獨立功能模組」而非改動核心互動流程
- **依賴**：邏輯上發生在活動「已定案／已結束」狀態之後，可以獨立於 Epic A、B 開發

**Phase 2 內部初步排序**（見第 11 節延伸 ICE 評分）：分帳功能與快閃聊天室評分並列最高，AI 選餐廳因技術不確定性較高、排在其後——但這只是方向性參考，正式排序需要等 Phase 1 驗證成立、團隊重新評分。

**對 NOW 的依賴**：明確依賴 NOW 的核心假設驗證成立——如果 Phase 1 上線後「決策天數」沒有顯著縮短，代表核心互動機制本身可能需要調整，此時不應該急著往 Phase 2 堆功能（呼應第 9 節 Value risk 的 mitigation）。

### LATER（Phase 3 — 提升聚會體驗）

**Epic D：飲食護照**
- **Hypothesis**：我們相信，如果能記錄使用者參加過的聚會與品嚐過的餐廳／料理類型並以「護照」形式呈現，可以提升重複使用揪甘心的動機（社交展示／紀念價值）
- **Effort**：🔶 XL——需要「跨活動識別同一個人」的持久身份機制，這是目前完全沒有的架構能力
- 🔵 **Open Question（架構層級，建議優先解開）**：飲食護照的價值前提是「系統認得出你參加過哪些活動」，這跟第 1、5 節反覆強調的「免登入」核心定位可能存在根本衝突——沒有某種輕量身份識別，這個 Epic 在技術上無法成立。建議在真正排入 Phase 3 開發前，先確認產品要不要引入一個「不強制、但可選」的輕量識別機制（例如選填的個人連結/裝置綁定），否則這個 Epic 應該先移出 LATER，改標成「需要先解決架構前提」的待研究項目

**Epic E：菜單翻譯**
- **Hypothesis**：我們相信，如果能對定案地點的菜單提供翻譯功能，可以服務跨語言的聚會情境（例如國際交換生、多語言朋友圈），提升特定情境下的體驗
- **Effort**：🔶 M——需要 OCR 或菜單資料來源，加上翻譯 API 串接
- 🔵 **Open Question**：跨語言聚會情境目前完全沒有使用數據佐證佔比，建議放進之後的 discovery 先驗證需求強度，而不是直接排入開發排程

**Epic F：邀請函**
- **Hypothesis**：我們相信，如果提供更精美／可客製化的邀請函格式（取代目前陽春的分享文字），可以提升活動的儀式感與主揪分享時的社交展示欲，間接提高連結開啟率
- **Success metric（候選）**：連結開啟率（分享後被點擊的比例）
- **Effort**：🔶 S–M——相對單純的視覺／模板功能，不涉及核心資料模型改動

**Phase 3 內部初步排序**（見第 11 節延伸 ICE 評分）：邀請函評分最高、實作把握度也最高，適合作為 Phase 3 若啟動時的第一個切入點；飲食護照評分最低且附帶架構前提問題，建議排在最後，甚至先移出正式 roadmap、轉為獨立的架構研究項目。

**對 Phase 2 的依賴**：依賴 Phase 2 上線後的使用回饋，目前僅為方向性規劃，不影響 Phase 1 的開發排程。

### 排序摘要

```
NOW   （立即開發，內部再切 4 個釋出切片）
  v0   → 核心迴圈：建立活動／投票／彙整／定案（阻塞項，Must-have）
  v0.1 → 定案通知（Must-have，需先選定通知管道，見第 9 節）
  v0.2 → 取消／重新開放（上線前應補齊）
  v0.3 → 留言互動（可延後）

NEXT  （待 Phase 1 驗證成立後展開，初步排序見第 11 節）
  分帳功能 ≈ 快閃聊天室  >  AI 選餐廳

LATER （方向性規劃，初步排序見第 11 節）
  邀請函  >  菜單翻譯  >  飲食護照（⚠️ 需先解開身份識別的架構開放問題）
```

此排序與第 11 節的 ICE 評分結論一致：目前唯一該投入資源的是 NOW 的 v0 核心迴圈；Should-have 三項是否插入 NOW 需視資源另外評估，不影響 NOW／NEXT／LATER 之間的整體順序。

---

## PRD Self-Assessment

### Strongest Section

第 2 節（Problem Statement）、第 3 節（Target Users & Personas／JTBD）與第 7 節（User Stories & Requirements）——因為有 prototype 實際驗證過的互動流程、既有的資料模型（`src/types.ts`）、[SPEC.md](./SPEC.md) 的詳細功能需求，以及完整的 JTBD 拆解作為基礎，內容具體、可直接對應到工程要做的事。

### Weakest Section

第 4 節（Strategic Context）與第 6 節（Success Metrics）——目前沒有正式 OKR、市場規模數據、精確的指標基準值，多數依賴質化描述與 🔶 Assumption，尚未經過量化驗證。第 11 節（Prioritization）與第 12 節（Roadmap）雖然補上了結構化的框架，但底層評分／估點仍是 PM 單獨完成，尚未經過工程與設計的共同校準。

### Top Assumptions to Validate

| # | Assumption | Section | Risk if Wrong | Proposed Validation |
|---|---|---|---|---|
| 1 | 主揪平均花 5 天喬時間才能定案 | 2、6 | 如果實際基準值差很多，Phase 1 上線後設定的目標與成效判斷會失真 | 對現有 LINE 群組使用者做簡短調查，或分析 prototype 使用者測試紀錄的實際天數 |
| 2 | 使用者會願意用勾選介面取代群組留言回覆 | 2 | 如果假設不成立，整個核心互動機制（時間投票連結）可能都要重新設計 | Phase 1 上線後追蹤「投票完成率」與「留言板留言量」的相對比例 |
| 3 | 免登入（暱稱＋Email）識別不會造成新的流失 | 6、9 | 如果連結開啟到送出投票的轉換率下降，反而會拉長而非縮短整體決策天數 | Phase 1 上線時做漏斗分析，追蹤連結開啟 → 填寫識別資訊 → 送出投票 的每一步轉換率 |
| 4 | 第 11 節的 ICE 評分與第 12 節的 T-shirt sizing（PM 單獨評分） | 11、12 | 如果實際優先序或工程估點差很多，Should-have 排序與 Phase 1 時程規劃都需要重新調整 | 工程團隊 kickoff 後，安排一次 PM＋工程＋設計共同重新評分的會議（呼應 `prioritization-advisor` skill 的「Pitfall 4」） |

### Recommended Next Step

在正式啟動 Phase 1 後端開發前，先辦一場 stakeholder review，把 [SPEC.md](./SPEC.md) 的建議技術架構與本文件第 10 節的開放問題（尤其是技術棧、通知管道、指標基準值與目標）拍板，避免工程團隊在沒有明確依據的情況下自行假設。

---

*End of PRD*
