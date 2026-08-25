# 揪甘心 — Product Requirements Document (PRD)

> 依 `product-manager-skills` 外掛的 `prd-development` workflow skill（`skills/prd-development/SKILL.md` + `template.md`）產出，並用 `jobs-to-be-done`、`product-strategy-session`、`prioritization-advisor`、`roadmap-planning`、`user-story`（BDD／Gherkin 格式）五個技能補強對應段落。文件正文以確定要執行的規格為主，不在段落中穿插標記；還沒驗證的假設、還沒拍板的問題統一收在[第三部分](./03-planning.md)的「還沒決定的事」與「這份文件哪裡強哪裡弱」兩個表格，方便一次看完，不干擾正文的閱讀動線。
>
> **關於 `product-strategy-session`／`roadmap-planning`／`prioritization-advisor` 的重要說明**：這三個技能原本的設計是跨 1-4 週、由 PM＋工程＋設計＋利害關係人共同參與的工作坊流程（訪談、共同評分、簡報對齊）。這裡沒有真實團隊可以協作，因此對應內容是**我（協助草擬者）依現有素材（產品規劃簡報、SPEC.md、prototype 程式碼）單獨完成的第一版產出**，對應到 `prioritization-advisor` 自己列出的「Pitfall 4: Solo PM Scoring」——所有評分與排序都需要之後找工程／設計一起重新過一次，不能直接當作定案依據。

## 文件結構說明

這份 PRD 整理成 3 個檔案，依內容性質分組：

- **第一部分、第三部分**（產品概觀、開放問題與規劃）用比較口語、淺顯的方式寫，方便不同背景的人（不只是工程或產品背景）都能看懂
- **第二部分**（User Stories、不做的事、依賴與風險）保留完整的技術細節跟 BDD 格式，沒有做語言簡化，是給工程團隊直接對照開發與測試用的內容

## Document Information

**Authors**：merano（產品／專案負責人）
**Reviewers**：[待補 — 工程負責人]、[待補 — 設計負責人]
**Date**：2026-08-24

| Version | Date | Author | Change Description |
|---|---|---|---|
| 0.1 | 2026-08-24 | merano（協助草擬：Claude） | 初稿，依 prd-development skill 產出，範圍為 Phase 1（Must-have） |
| 0.2 | 2026-08-24 | merano（協助草擬：Claude） | 用 jobs-to-be-done／product-strategy-session／prioritization-advisor／roadmap-planning 補強對應段落 |
| 0.3 | 2026-08-24 | merano（協助草擬：Claude） | User Stories 改寫為完整 BDD（Gherkin）格式；拆分為多檔案（13 節） |
| 0.4 | 2026-08-24 | merano（協助草擬：Claude） | 整併為 3 個檔案（概觀／需求／規劃）；概觀與規劃改用淺顯口語重寫，需求部分維持技術細節不簡化 |

**與其他文件的關係**：本文件是產品層的 PRD（問題、使用者、成功指標、故事）；[../SPEC.md](../SPEC.md) 是對應的工程規格草案（技術架構、資料庫 schema、API 設計）；[../FLOW.md](../FLOW.md) 用 Mermaid 圖呈現本文件 User Stories 對應的完整系統流程與活動狀態轉換。三份文件的 Phase 1 範圍應保持一致，SPEC.md 第 5 節的技術架構建議可視為本文件依賴段落的延伸。

---

## 目錄

1. **[產品概觀](./01-overview.md)** — 一句話說清楚、我們要解決的問題、我們在為誰做、為什麼是現在、我們打算怎麼做、怎麼知道有沒有成功
   （對應原本第 1–6 節，口語化重寫）
2. **[功能需求](./02-requirements.md)** — 完整 BDD 格式的 User Stories、我們不做的事、依賴與風險
   （對應原本第 7–9 節，保留技術細節，給工程團隊用）
3. **[開放問題與後續規劃](./03-planning.md)** — 還沒決定的事、怎麼排優先順序、之後打算怎麼做、這份文件哪裡強哪裡弱
   （對應原本第 10–13 節，口語化重寫）

---

*每份文件的開頭與結尾都有導覽連結，可以回到這裡或跳到上一／下一部分。*
