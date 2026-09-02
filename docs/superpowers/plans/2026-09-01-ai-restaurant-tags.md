# AI Restaurant-Only Recommendation Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Narrow the existing mobile "AI 推薦" demo flow (`src/mobile/AIRecommend/*`) to **restaurants only** — dropping the "活動推薦"/"行程推薦" tiers — and replace its preference tags with the PRD's six categories (地理範圍、與會關係、預算區間、人數規格、硬體與情境、飲食偏好) plus a free-text prompt box and a new "重述需求" (restate) step.

**Architecture:** This is a self-contained rewrite of one mock-data module (`src/lib/aiRecommendDemo.ts`) and its five consuming components (`src/mobile/AIRecommend/*`). Everything stays 100% frontend mock data — no real Google Places/LLM call is introduced (see `[[project_static_demo_no_real_backend]]`). The feature currently only exists in the mobile tree (wired into `src/mobile/FinalizedView.tsx`); there is no desktop equivalent to update.

**Tech Stack:** React + TypeScript, inline `style={{ }}` with design tokens, `src/design-system/components` (`Tag`, `Input`, `Button`). No test runner is configured — verification is `npm run lint` (`tsc --noEmit`) plus manual dev-server checks.

**Spec:** `docs/modified-2026-0901/登入權限與路由控制 & AI 聚餐選餐廳 產品修改規格書 (PRD).md`, section 3 (標籤與需求參數表) and section 4 (推薦呈現規範).

## Global Constraints

- **Restaurant-only.** Remove `activity`/`itinerary` tiers, `RecommendTier`, `TIER_META`, and every "Lv.2"/"Lv.3" branch — do not leave dead tier-switching UI behind.
- **Max 5 recommendations, no suitability percentage** — per PRD 4: "輸出限制：最多顯示前 5 名推薦" and "現階段暫不做「適合度百分比」". The existing mock data already has exactly 5 restaurant candidates and never showed a percentage; keep both true explicitly (`getCandidates()` returns `.slice(0, 5)`, and no `%`/`percentage` field is added anywhere in this plan).
- **Keep "重述需求".** New required step per PRD 4: "「重述需求」功能（Restate Requirements）仍保留，用以驗證 AI 理解度；若 AI 理解有誤，使用者可調整標籤重新計算。"
- **Mock data only** — this repo has no backend; every "AI" output stays hand-authored template strings, per `[[project_static_demo_no_real_backend]]` and `README.md` → "專案定位（重要）".
- **Mobile-only scope.** There is no desktop `AIRecommend` implementation to update; do not add one as part of this plan.
- `npm run lint` must pass after every task.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/lib/aiRecommendDemo.ts` | Rewrite | Restaurant-only mock data, new PRD tag taxonomy, `buildRestateSummary()` |
| `src/mobile/AIRecommend/PreferenceFormStep.tsx` | Rewrite | Tag form for the 6 PRD categories + free-text prompt |
| `src/mobile/AIRecommend/RestateStep.tsx` | Create | Shows the AI's restated understanding; "調整需求" / "理解正確，看推薦" |
| `src/mobile/AIRecommend/RecommendResultsStep.tsx` | Rewrite | Drop itinerary rendering branch, drop `tier` prop |
| `src/mobile/AIRecommend/ConfirmedStep.tsx` | Rewrite | Drop `tier`/`TIER_META`, hardcode "推薦餐廳" copy |
| `src/mobile/AIRecommend/AIRecommendFlow.tsx` | Rewrite | Drop tier tab bar; step flow becomes preference → restate → results → consensus → confirmed |
| `src/mobile/FinalizedView.tsx` | Modify | Update the teaser copy that currently mentions 活動/行程 |
| `src/mobile/AIRecommend/ConsensusStep.tsx` | No change | Already tier-agnostic — confirmed during Task 6 |

---

### Task 1: Rewrite `aiRecommendDemo.ts` — restaurant-only mock data + new tag taxonomy

**Files:**
- Modify (full rewrite): `src/lib/aiRecommendDemo.ts`

**Interfaces:**
- Produces: `PreferenceFormState` (new shape), `emptyPreferenceForm`, `isFormFilled()`, `buildRestateSummary()`, `Candidate`, `CandidateMeta`, `candidateReason()`, `getCandidates()`, `mockConsensus()`, and the tag-option constants `RELATIONSHIP_OPTIONS`, `GEO_RANGE_OPTIONS`, `BUDGET_OPTIONS`, `PARTY_SIZE_OPTIONS`, `SITUATIONAL_OPTIONS`, `SPICE_OPTIONS`, `CUISINE_OPTIONS` — all consumed by Tasks 2–6.
- Removes: `RecommendTier`, `TIER_META`, `ItineraryStop`, `ItineraryCandidate`, `getItineraryCandidates()`, `itineraryReason()`, `TONE_OPTIONS`, `DURATION_OPTIONS_LV2`, `DURATION_OPTIONS_LV3`, `TRANSPORT_OPTIONS` — Tasks 2–6 must not reference any of these afterward.

- [ ] **Step 1: Replace the entire file**

```ts
// src/lib/aiRecommendDemo.ts
// Demo-only mock data & helpers for the "AI 推薦餐廳" (AI restaurant
// recommendation) prototype screens. Everything here is hand-authored fake
// content — there is no real API call (no Google Places, no LLM). Nothing in
// this file reads or writes gathertime_events_db; it only reads values
// already present on the event object passed in (attending count,
// participant nicknames) so the copy feels grounded in the demo event
// without touching the real data model.
//
// Scope: restaurant recommendations only (PRD update 2026-09-01) — the
// earlier "活動推薦"/"行程推薦" tiers have been removed.

export const RELATIONSHIP_OPTIONS = ["同事", "朋友", "家人", "社團", "約會"] as const;
export type RelationshipOption = (typeof RELATIONSHIP_OPTIONS)[number];

export const GEO_RANGE_OPTIONS = ["步行 800m 內（約 15 分鐘）", "捷運沿線", "特定行政區"] as const;
export type GeoRangeOption = (typeof GEO_RANGE_OPTIONS)[number];

export const BUDGET_OPTIONS = ["200 以下", "200-400", "400-600", "600-800", "800-1000", "1000 以上"] as const;
export type BudgetOption = (typeof BUDGET_OPTIONS)[number];

export const PARTY_SIZE_OPTIONS = ["2 人", "3-4 人", "5-8 人", "9 人以上（多人）", "20 人以上（團體）"] as const;
export type PartySizeOption = (typeof PARTY_SIZE_OPTIONS)[number];

export const SITUATIONAL_OPTIONS = ["可久坐", "有插座", "停車位", "親子友善", "無障礙"] as const;
export type SituationalOption = (typeof SITUATIONAL_OPTIONS)[number];

export const SPICE_OPTIONS = ["不吃辣", "愛吃辣"] as const;
export type SpiceOption = (typeof SPICE_OPTIONS)[number];

export const CUISINE_OPTIONS = ["美式", "日式", "韓式"] as const;
export type CuisineOption = (typeof CUISINE_OPTIONS)[number];

export interface PreferenceFormState {
  relationship: RelationshipOption | null;
  geoRange: GeoRangeOption | null;
  geoRangeDetail: string; // free text for MRT line / district name
  budget: BudgetOption | null;
  partySize: PartySizeOption | null;
  situational: SituationalOption[]; // multi-select
  vegetarian: boolean;
  spice: SpiceOption | null;
  cuisine: CuisineOption | null;
  customPrompt: string; // free-text prompt box
}

export const emptyPreferenceForm: PreferenceFormState = {
  relationship: null,
  geoRange: null,
  geoRangeDetail: "",
  budget: null,
  partySize: null,
  situational: [],
  vegetarian: false,
  spice: null,
  cuisine: null,
  customPrompt: "",
};

export function isFormFilled(form: PreferenceFormState): boolean {
  return (
    form.relationship !== null ||
    form.geoRange !== null ||
    form.budget !== null ||
    form.partySize !== null ||
    form.situational.length > 0 ||
    form.vegetarian ||
    form.spice !== null ||
    form.cuisine !== null ||
    form.customPrompt.trim() !== ""
  );
}

// Mock "AI 重述需求" copy — stitches the selected tags + free text into a
// sentence so the user can sanity-check the AI understood them correctly
// before results are generated (PRD 4: 「重述需求」功能).
export function buildRestateSummary(form: PreferenceFormState): string {
  if (!isFormFilled(form)) {
    return "你目前沒有填寫任何偏好，AI 會直接依「當地評價最高」的預設邏輯推薦餐廳。";
  }
  const parts: string[] = [];
  if (form.relationship) parts.push(`這是一場「${form.relationship}」聚餐`);
  if (form.geoRange) {
    const detail = form.geoRangeDetail.trim();
    parts.push(`地點希望在「${form.geoRange}${detail ? `：${detail}` : ""}」範圍內`);
  }
  if (form.budget) parts.push(`預算落在「${form.budget}」`);
  if (form.partySize) parts.push(`用餐人數約「${form.partySize}」`);
  if (form.situational.length > 0) parts.push(`需要「${form.situational.join("、")}」`);
  if (form.vegetarian) parts.push("需要素食選項");
  if (form.spice) parts.push(`飲食偏好「${form.spice}」`);
  if (form.cuisine) parts.push(`偏好「${form.cuisine}」料理`);
  if (form.customPrompt.trim()) parts.push(`另外你補充：「${form.customPrompt.trim()}」`);
  return `我理解你的需求是：${parts.join("、")}。以此為條件，幫你篩選以下餐廳：`;
}

interface ReasonCtx {
  count: number;
}

export interface CandidateMeta {
  label: string;
  value: string;
}

export interface Candidate {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  tags: string[];
  meta: CandidateMeta[];
  reasonPersonalized: (ctx: ReasonCtx) => string;
  reasonDefault: (ctx: ReasonCtx) => string;
}

export function candidateReason(c: Candidate, form: PreferenceFormState, ctx: ReasonCtx): string {
  return isFormFilled(form) ? c.reasonPersonalized(ctx) : c.reasonDefault(ctx);
}

const restaurantCandidates: Candidate[] = [
  {
    id: "r1",
    emoji: "🥩",
    name: "職人炭火燒肉",
    tagline: "亞洲料理．獨立包廂",
    tags: ["亞洲料理", "有包廂", "適合聚餐"],
    meta: [
      { label: "距離", value: "1.2 km" },
      { label: "可容納", value: "2-10 人" },
      { label: "價位", value: "$$" },
    ],
    reasonPersonalized: (ctx) => `適合 ${ctx.count} 人同事聚餐、有獨立包廂，符合亞洲料理偏好`,
    reasonDefault: (ctx) => `這附近評價最高、可容納 ${ctx.count} 人的餐廳`,
  },
  {
    id: "r2",
    emoji: "🍝",
    name: "好時光義式餐酒館",
    tagline: "西式料理．氣氛輕鬆",
    tags: ["西式料理", "適合朋友聚會"],
    meta: [
      { label: "距離", value: "800 m" },
      { label: "可容納", value: "2-8 人" },
      { label: "價位", value: "$$$" },
    ],
    reasonPersonalized: (ctx) => `朋友聚會氣氛佳，${ctx.count} 人剛好坐得下`,
    reasonDefault: (ctx) => `評價 4.6 顆星、適合 ${ctx.count} 人的義式餐廳`,
  },
  {
    id: "r3",
    emoji: "🍱",
    name: "山葵日式割烹",
    tagline: "日式料理．安靜舒適",
    tags: ["日式料理", "適合家人聚餐"],
    meta: [
      { label: "距離", value: "2.0 km" },
      { label: "可容納", value: "2-12 人" },
      { label: "價位", value: "$$$" },
    ],
    reasonPersonalized: (ctx) => `環境安靜，適合家人聚餐，可容納 ${ctx.count} 人`,
    reasonDefault: (ctx) => `當地高評價日式料理，可容納 ${ctx.count} 人`,
  },
  {
    id: "r4",
    emoji: "🥗",
    name: "花園野餐咖啡",
    tagline: "複合式料理．親子友善",
    tags: ["親子友善", "戶外座位"],
    meta: [
      { label: "距離", value: "1.5 km" },
      { label: "可容納", value: "2-15 人" },
      { label: "價位", value: "$$" },
    ],
    reasonPersonalized: (ctx) => `有兒童椅與戶外空間，適合攜帶孩童的 ${ctx.count} 人聚會`,
    reasonDefault: (ctx) => `空間寬敞、適合 ${ctx.count} 人的複合式餐廳`,
  },
  {
    id: "r5",
    emoji: "🍢",
    name: "深夜熱炒 48 號",
    tagline: "亞洲料理．熱鬧下酒",
    tags: ["亞洲料理", "適合朋友聚會", "價格實惠"],
    meta: [
      { label: "距離", value: "600 m" },
      { label: "可容納", value: "4-20 人" },
      { label: "價位", value: "$" },
    ],
    reasonPersonalized: (ctx) => `熱鬧下酒菜色多，適合 ${ctx.count} 人朋友聚會`,
    reasonDefault: (ctx) => `CP 值高、可容納 ${ctx.count} 人的熱炒店`,
  },
];

// PRD 4: 輸出限制 — 最多顯示前 5 名推薦（核心推薦為 3-5 名）。The mock list is
// already exactly 5 items; .slice(0, 5) keeps that rule true even if the
// list grows later.
export function getCandidates(): Candidate[] {
  return restaurantCandidates.slice(0, 5);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic (not truly random) split of participant nicknames into
// "accepted" / "rejected" per candidate, so re-rendering doesn't shuffle the
// numbers under the demo presenter. Biased ~70% toward acceptance.
export function mockConsensus(candidateId: string, nicknames: string[]): { accepted: string[]; rejected: string[] } {
  const accepted: string[] = [];
  const rejected: string[] = [];
  nicknames.forEach((name) => {
    const bucket = hashStr(`${candidateId}::${name}`) % 10;
    if (bucket < 7) accepted.push(name);
    else rejected.push(name);
  });
  return { accepted, rejected };
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run lint`
Expected: FAILS — every file in `src/mobile/AIRecommend/*` and `src/mobile/FinalizedView.tsx` still imports the now-removed `RecommendTier`/`TIER_META`/etc. This is expected; Tasks 2–6 fix each consumer.

- [ ] **Step 3: Commit**

```bash
git add src/lib/aiRecommendDemo.ts
git commit -m "refactor: rewrite AI recommend mock data to restaurant-only PRD tag taxonomy"
```

---

### Task 2: Rewrite `PreferenceFormStep.tsx` for the 6 PRD tag categories + free-text prompt

**Files:**
- Modify (full rewrite): `src/mobile/AIRecommend/PreferenceFormStep.tsx`

**Interfaces:**
- Consumes: `PreferenceFormState`, `RELATIONSHIP_OPTIONS`, `GEO_RANGE_OPTIONS`, `BUDGET_OPTIONS`, `PARTY_SIZE_OPTIONS`, `SITUATIONAL_OPTIONS`, `SPICE_OPTIONS`, `CUISINE_OPTIONS` from `../../lib/aiRecommendDemo` (Task 1).
- Produces: `<PreferenceFormStep form={PreferenceFormState} onChange={(patch: Partial<PreferenceFormState>) => void} onSkip={() => void} onNext={() => void} />` (drops the old `tier` prop) — consumed by Task 6's `AIRecommendFlow.tsx`.

- [ ] **Step 1: Replace the entire file**

```tsx
// src/mobile/AIRecommend/PreferenceFormStep.tsx
import React from "react";
import { Tag, Button, Input } from "../../design-system/components";
import { cardStyle, SectionLabel } from "../mobileStyles";
import {
  PreferenceFormState,
  RELATIONSHIP_OPTIONS,
  GEO_RANGE_OPTIONS,
  BUDGET_OPTIONS,
  PARTY_SIZE_OPTIONS,
  SITUATIONAL_OPTIONS,
  SPICE_OPTIONS,
  CUISINE_OPTIONS,
} from "../../lib/aiRecommendDemo";

interface PreferenceFormStepProps {
  form: PreferenceFormState;
  onChange: (patch: Partial<PreferenceFormState>) => void;
  onSkip: () => void;
  onNext: () => void;
}

export const PreferenceFormStep: React.FC<PreferenceFormStepProps> = ({ form, onChange, onSkip, onNext }) => {
  const toggleSituational = (opt: (typeof SITUATIONAL_OPTIONS)[number]) => {
    const next = form.situational.includes(opt) ? form.situational.filter((s) => s !== opt) : [...form.situational, opt];
    onChange({ situational: next });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.6 }}>
        這份表單全部選填。填了可以幫 AI 縮小推薦範圍；略過的話，會直接用「當地最適合」的預設邏輯推薦。
      </div>

      <div style={cardStyle}>
        <SectionLabel title="地理範圍" hint="解決「不要離車站太遠」的痛點" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {GEO_RANGE_OPTIONS.map((g) => (
            <Tag key={g} variant="orange" active={form.geoRange === g} onClick={() => onChange({ geoRange: form.geoRange === g ? null : g })}>
              {g}
            </Tag>
          ))}
        </div>
        {(form.geoRange === "捷運沿線" || form.geoRange === "特定行政區") && (
          <div style={{ marginTop: 8 }}>
            <Input
              size="sm"
              placeholder={form.geoRange === "捷運沿線" ? "例如：板南線" : "例如：大安區"}
              value={form.geoRangeDetail}
              onChange={(e) => onChange({ geoRangeDetail: e.target.value })}
            />
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <SectionLabel title="與會關係" hint="影響 AI 推薦的氛圍與桌型配置" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {RELATIONSHIP_OPTIONS.map((r) => (
            <Tag key={r} variant="orange" active={form.relationship === r} onClick={() => onChange({ relationship: form.relationship === r ? null : r })}>
              {r}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="預算區間" hint="每人平均消費" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {BUDGET_OPTIONS.map((b) => (
            <Tag key={b} variant="yellow" active={form.budget === b} onClick={() => onChange({ budget: form.budget === b ? null : b })}>
              {b}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="人數規格" hint="篩選具備對應容納量或包廂的餐廳" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PARTY_SIZE_OPTIONS.map((p) => (
            <Tag key={p} variant="default" active={form.partySize === p} onClick={() => onChange({ partySize: form.partySize === p ? null : p })}>
              {p}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="硬體與情境" hint="可複選" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SITUATIONAL_OPTIONS.map((s) => (
            <Tag key={s} variant="default" active={form.situational.includes(s)} onClick={() => toggleSituational(s)}>
              {s}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="飲食偏好" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <Tag variant="orange" active={form.vegetarian} onClick={() => onChange({ vegetarian: !form.vegetarian })}>
            素食
          </Tag>
          {SPICE_OPTIONS.map((s) => (
            <Tag key={s} variant="orange" active={form.spice === s} onClick={() => onChange({ spice: form.spice === s ? null : s })}>
              {s}
            </Tag>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CUISINE_OPTIONS.map((c) => (
            <Tag key={c} variant="yellow" active={form.cuisine === c} onClick={() => onChange({ cuisine: form.cuisine === c ? null : c })}>
              {c}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="其他需求" hint="自由輸入，補充標籤無法表達的細節" />
        <textarea
          value={form.customPrompt}
          onChange={(e) => onChange({ customPrompt: e.target.value })}
          placeholder="例如：想找有現場 live band 的餐廳"
          rows={3}
          style={{
            width: "100%",
            resize: "vertical",
            padding: 10,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-ink)",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <Button variant="muted" fullWidth onClick={onSkip}>
          略過，使用預設推薦
        </Button>
        <Button variant="primary" fullWidth onClick={onNext}>
          產生 AI 推薦
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run lint`
Expected: Still fails elsewhere (Tasks 3–6 not done yet), but no new errors should originate from this file. Read the error list and confirm every remaining error is in `AIRecommendFlow.tsx`, `RecommendResultsStep.tsx`, `ConfirmedStep.tsx`, or `FinalizedView.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/mobile/AIRecommend/PreferenceFormStep.tsx
git commit -m "refactor: rebuild preference form with PRD's 6 restaurant tag categories"
```

---

### Task 3: Create `RestateStep.tsx`

**Files:**
- Create: `src/mobile/AIRecommend/RestateStep.tsx`

**Interfaces:**
- Consumes: `Button` from `../../design-system/components`, `cardStyle` from `../mobileStyles`.
- Produces: `<RestateStep summary={string} onEdit={() => void} onConfirm={() => void} />` — consumed by Task 6's `AIRecommendFlow.tsx`.

- [ ] **Step 1: Write the component**

```tsx
// src/mobile/AIRecommend/RestateStep.tsx
import React from "react";
import { Sparkles, Pencil } from "lucide-react";
import { Button } from "../../design-system/components";
import { cardStyle } from "../mobileStyles";

interface RestateStepProps {
  summary: string;
  onEdit: () => void;
  onConfirm: () => void;
}

export const RestateStep: React.FC<RestateStepProps> = ({ summary, onEdit, onConfirm }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.6 }}>
        AI 已重述你的需求，確認理解正確再繼續；如果哪裡理解錯了，可以回去調整標籤重新計算。
      </div>
      <div style={{ ...cardStyle, background: "var(--color-primary-subtle)", borderColor: "transparent", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Sparkles size={16} style={{ flexShrink: 0, marginTop: 2, color: "var(--color-primary)" }} />
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-ink)" }}>{summary}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="muted" fullWidth icon={<Pencil size={14} />} onClick={onEdit}>
          調整需求
        </Button>
        <Button variant="primary" fullWidth onClick={onConfirm}>
          理解正確，看推薦
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run lint`
Expected: No new errors from this file (it isn't imported anywhere yet).

- [ ] **Step 3: Commit**

```bash
git add src/mobile/AIRecommend/RestateStep.tsx
git commit -m "feat: add AI-restate-requirements confirmation step"
```

---

### Task 4: Simplify `RecommendResultsStep.tsx` — drop itinerary branch and `tier` prop

**Files:**
- Modify (full rewrite): `src/mobile/AIRecommend/RecommendResultsStep.tsx`

**Interfaces:**
- Consumes: `Candidate`, `PreferenceFormState`, `candidateReason`, `isFormFilled` from `../../lib/aiRecommendDemo` (Task 1).
- Produces: `<RecommendResultsStep candidates={Candidate[]} form={PreferenceFormState} participantCount={number} onNext={() => void} />` (drops `tier`/`itineraries` props) — consumed by Task 6.

- [ ] **Step 1: Replace the entire file**

```tsx
// src/mobile/AIRecommend/RecommendResultsStep.tsx
import React from "react";
import { Sparkles } from "lucide-react";
import { Button, Tag } from "../../design-system/components";
import { cardStyle } from "../mobileStyles";
import { Candidate, PreferenceFormState, candidateReason, isFormFilled } from "../../lib/aiRecommendDemo";

interface RecommendResultsStepProps {
  candidates: Candidate[];
  form: PreferenceFormState;
  participantCount: number;
  onNext: () => void;
}

const reasonBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  marginTop: 10,
  padding: "8px 10px",
  borderRadius: "var(--radius-md)",
  background: "var(--color-primary-subtle)",
  color: "var(--color-primary)",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.5,
};

export const RecommendResultsStep: React.FC<RecommendResultsStepProps> = ({ candidates, form, participantCount, onNext }) => {
  const ctx = { count: Math.max(participantCount, 1) };
  const personalized = isFormFilled(form);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
        {personalized
          ? `已依你填寫的偏好產生以下 ${candidates.length} 間推薦餐廳：`
          : `尚未填寫偏好，以下為「當地最適合」的 ${candidates.length} 間預設推薦：`}
      </div>

      {candidates.map((c) => (
        <div key={c.id} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--radius-lg)",
                background: "var(--color-secondary-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {c.emoji}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 1 }}>{c.tagline}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {c.tags.map((t) => (
              <Tag key={t} size="sm">
                {t}
              </Tag>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            {c.meta.map((m) => (
              <div key={m.label} style={{ fontSize: 11 }}>
                <span style={{ color: "var(--color-muted)" }}>{m.label}：</span>
                <span style={{ fontWeight: 800, color: "var(--color-ink)" }}>{m.value}</span>
              </div>
            ))}
          </div>

          <div style={reasonBoxStyle}>
            <Sparkles size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{candidateReason(c, form, ctx)}</span>
          </div>
        </div>
      ))}

      <Button variant="primary" fullWidth onClick={onNext}>
        開始共識確認
      </Button>
    </div>
  );
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run lint`
Expected: Errors remain only in `AIRecommendFlow.tsx`, `ConfirmedStep.tsx`, `FinalizedView.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/mobile/AIRecommend/RecommendResultsStep.tsx
git commit -m "refactor: drop itinerary rendering branch from recommend results step"
```

---

### Task 5: Simplify `ConfirmedStep.tsx` — drop `tier`/`TIER_META`

**Files:**
- Modify (full rewrite): `src/mobile/AIRecommend/ConfirmedStep.tsx`

**Interfaces:**
- Produces: `<ConfirmedStep eventTitle={string} hostName={string|undefined} chosenEmoji={string} chosenName={string} reasonText={string} onCopySuccess={() => void} onRestart={() => void} onClose={() => void} />` (drops `tier` prop) — consumed by Task 6.

- [ ] **Step 1: Replace the entire file**

```tsx
// src/mobile/AIRecommend/ConfirmedStep.tsx
import React from "react";
import { PartyPopper } from "lucide-react";
import { Button } from "../../design-system/components";
import { cardStyle } from "../mobileStyles";

interface ConfirmedStepProps {
  eventTitle: string;
  hostName?: string;
  chosenEmoji: string;
  chosenName: string;
  reasonText: string;
  onCopySuccess: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export const ConfirmedStep: React.FC<ConfirmedStepProps> = ({
  eventTitle,
  hostName,
  chosenEmoji,
  chosenName,
  reasonText,
  onCopySuccess,
  onRestart,
  onClose,
}) => {
  const broadcast = `🎉 ${eventTitle}｜推薦餐廳結果已確認！\n${chosenEmoji} ${chosenName}\n${reasonText}\n— 由主揪${hostName ? ` ${hostName}` : ""}拍板`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(broadcast);
      onCopySuccess();
    } catch {
      window.prompt("複製確認通知：", broadcast);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "var(--color-ink)", color: "#fff", borderRadius: "var(--radius-card)", padding: 16, textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: "var(--radius-pill)",
            background: "rgba(90,158,90,0.25)",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          <PartyPopper size={12} />
          餐廳已確認
        </span>
        <div style={{ fontSize: 32, marginTop: 12 }}>{chosenEmoji}</div>
        <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "var(--font-display)", marginTop: 4 }}>{chosenName}</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>{reasonText}</div>
      </div>

      <div style={{ ...cardStyle, background: "rgba(90,158,90,0.06)", borderColor: "rgba(90,158,90,0.3)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>一鍵複製確認通知</div>
        <div style={{ background: "#fff", borderRadius: "var(--radius-md)", padding: 10, fontSize: 11, whiteSpace: "pre-line", lineHeight: 1.6, color: "var(--color-ink)", marginBottom: 8 }}>
          {broadcast}
        </div>
        <Button variant="dark" fullWidth onClick={handleCopy}>
          一鍵複製通知
        </Button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="muted" fullWidth onClick={onRestart}>
          重新選一次
        </Button>
        <Button variant="primary" fullWidth onClick={onClose}>
          完成，關閉
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run lint`
Expected: Errors remain only in `AIRecommendFlow.tsx` and `FinalizedView.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/mobile/AIRecommend/ConfirmedStep.tsx
git commit -m "refactor: drop tier concept from AI-confirmed step"
```

---

### Task 6: Rewrite `AIRecommendFlow.tsx` and update `FinalizedView.tsx` copy

**Files:**
- Modify (full rewrite): `src/mobile/AIRecommend/AIRecommendFlow.tsx`
- Modify: `src/mobile/FinalizedView.tsx:134`

**Interfaces:**
- Consumes everything produced by Tasks 1–5.
- Produces: `<AIRecommendFlow event={EventData} onClose={() => void} onCopySuccess={() => void} />` — same public interface as before, so `FinalizedView.tsx`'s existing call site (`src/mobile/FinalizedView.tsx:220`) needs no prop changes.

- [ ] **Step 1: Replace `AIRecommendFlow.tsx` entirely**

```tsx
// src/mobile/AIRecommend/AIRecommendFlow.tsx
import React, { useMemo, useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import { EventData } from "../../types";
import { useViewport } from "../../lib/useViewport";
import { PreferenceFormState, emptyPreferenceForm, getCandidates, candidateReason, buildRestateSummary } from "../../lib/aiRecommendDemo";
import { PreferenceFormStep } from "./PreferenceFormStep";
import { RestateStep } from "./RestateStep";
import { RecommendResultsStep } from "./RecommendResultsStep";
import { ConsensusStep, ConsensusItem } from "./ConsensusStep";
import { ConfirmedStep } from "./ConfirmedStep";

type Step = "preference" | "restate" | "results" | "consensus" | "confirmed";

interface AIRecommendFlowProps {
  event: EventData;
  onClose: () => void;
  onCopySuccess: () => void;
}

export const AIRecommendFlow: React.FC<AIRecommendFlowProps> = ({ event, onClose, onCopySuccess }) => {
  const { isMobile } = useViewport();
  const [step, setStep] = useState<Step>("preference");
  const [form, setForm] = useState<PreferenceFormState>(emptyPreferenceForm);
  const [myVotes, setMyVotes] = useState<Record<string, "accept" | "reject" | undefined>>({});
  const [finalChoiceId, setFinalChoiceId] = useState<string | null>(null);

  const finalSlot = event.slots.find((s) => s.id === event.finalSlotId);
  const attendingNicknames = useMemo(() => {
    const names = finalSlot
      ? event.responses.filter((r) => r.availability[finalSlot.id] === "available").map((r) => r.nickname)
      : event.responses.map((r) => r.nickname);
    return names.length > 0 ? names : ["小明", "Lily", "陳大華"];
  }, [event, finalSlot]);

  const candidates = useMemo(() => getCandidates(), []);

  const consensusItems: ConsensusItem[] = useMemo(
    () => candidates.map((c) => ({ id: c.id, emoji: c.emoji, name: c.name })),
    [candidates]
  );

  const goRestart = () => {
    setStep("preference");
    setForm(emptyPreferenceForm);
    setMyVotes({});
    setFinalChoiceId(null);
  };

  const ctx = { count: Math.max(attendingNicknames.length, 1) };

  const chosen = useMemo(() => {
    if (!finalChoiceId) return null;
    const c = candidates.find((cc) => cc.id === finalChoiceId);
    if (!c) return null;
    return { emoji: c.emoji, name: c.name, reason: candidateReason(c, form, ctx) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalChoiceId, candidates, form]);

  const stepTitles: Record<Step, string> = {
    preference: "基本偏好（選填）",
    restate: "AI 重述需求",
    results: "AI 候選餐廳",
    consensus: "共識確認",
    confirmed: "確認結果",
  };

  const canGoBack = step === "restate" || step === "results" || step === "consensus";
  const handleBack = () => {
    if (step === "restate") setStep("preference");
    else if (step === "results") setStep("restate");
    else if (step === "consensus") setStep("results");
  };

  const overlayStyle: React.CSSProperties = isMobile
    ? { position: "fixed", inset: 0, background: "var(--color-cream)", zIndex: 300, display: "flex", flexDirection: "column" }
    : { position: "fixed", inset: 0, background: "rgba(26,18,8,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };

  const cardOuterStyle: React.CSSProperties = isMobile
    ? { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }
    : { background: "var(--color-cream)", borderRadius: "var(--radius-modal)", width: "100%", maxWidth: 640, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" };

  return (
    <div style={overlayStyle}>
      <div style={cardOuterStyle}>
        {/* Header */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", flexShrink: 0, borderRadius: isMobile ? 0 : "var(--radius-modal) var(--radius-modal) 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {canGoBack && (
                <button onClick={handleBack} style={{ border: "none", background: "none", color: "var(--color-primary)", cursor: "pointer", display: "flex", flexShrink: 0 }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)" }}>🍽️ AI 推薦餐廳（示範功能）</div>
                <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {stepTitles[step]}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "none", color: "var(--color-muted)", cursor: "pointer", display: "flex", flexShrink: 0 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {step === "preference" && (
            <PreferenceFormStep
              form={form}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              onSkip={() => setStep("restate")}
              onNext={() => setStep("restate")}
            />
          )}
          {step === "restate" && (
            <RestateStep summary={buildRestateSummary(form)} onEdit={() => setStep("preference")} onConfirm={() => setStep("results")} />
          )}
          {step === "results" && (
            <RecommendResultsStep candidates={candidates} form={form} participantCount={attendingNicknames.length} onNext={() => setStep("consensus")} />
          )}
          {step === "consensus" && (
            <ConsensusStep
              items={consensusItems}
              nicknames={attendingNicknames}
              myVotes={myVotes}
              onToggleMyVote={(id, vote) => setMyVotes((v) => ({ ...v, [id]: v[id] === vote ? undefined : vote }))}
              onConfirm={(id) => {
                setFinalChoiceId(id);
                setStep("confirmed");
              }}
            />
          )}
          {step === "confirmed" && chosen && (
            <ConfirmedStep
              eventTitle={event.title}
              hostName={event.hostName}
              chosenEmoji={chosen.emoji}
              chosenName={chosen.name}
              reasonText={chosen.reason}
              onCopySuccess={onCopySuccess}
              onRestart={goRestart}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Update the teaser copy in `FinalizedView.tsx`**

In `src/mobile/FinalizedView.tsx`, line 134 currently reads:

```tsx
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 1 }}>試試 AI 推薦餐廳、活動或行程（示範功能）</div>
```

Change it to:

```tsx
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 1 }}>試試 AI 推薦餐廳（示範功能）</div>
```

- [ ] **Step 3: Confirm `ConsensusStep.tsx` needs no change**

Open `src/mobile/AIRecommend/ConsensusStep.tsx` and confirm it imports only `mockConsensus` from `../../lib/aiRecommendDemo` and never references `RecommendTier`/`TIER_META`/tier-specific props (it doesn't, per the file read during planning) — no edit needed.

- [ ] **Step 4: Verify types compile**

Run: `npm run lint`
Expected: PASS — no remaining references to `RecommendTier`, `TIER_META`, `ItineraryCandidate`, `getItineraryCandidates`, `itineraryReason`, `TONE_OPTIONS`, `DURATION_OPTIONS_LV2`, `DURATION_OPTIONS_LV3`, or `TRANSPORT_OPTIONS` anywhere in `src/`. If `tsc` still reports one, grep for the symbol name and remove the last reference.

- [ ] **Step 5: Manual check**

Run: `npm run dev`, resize to mobile width, open a **finalized** demo event (from "我的聚會" → 示範活動 → 生日慶生趴, which is already `status: "finalized"`, see `src/lib/localEventStore.ts:164-184`). Click "試試看" next to "試試 AI 推薦餐廳（示範功能）":
1. Confirm there is **no tab bar** for Lv.1/Lv.2/Lv.3 anymore — the flow starts directly on the preference form.
2. Fill in a few tags across all 6 categories (地理範圍/與會關係/預算區間/人數規格/硬體與情境/飲食偏好) plus something in the free-text box, then tap "產生 AI 推薦".
3. Confirm a "AI 重述需求" screen appears next, showing a sentence that mentions the tags you picked. Tap "調整需求" → confirm it goes back to the form with your selections intact. Tap "產生 AI 推薦" again → "理解正確，看推薦".
4. Confirm the results screen shows **at most 5** restaurant cards, none showing a percentage.
5. Proceed through 共識確認 → 拍板定案 → confirm the final screen says "餐廳已確認" (not "行程已確認" or similar) and the copy-to-clipboard text reads "推薦餐廳結果已確認".

- [ ] **Step 6: Commit**

```bash
git add src/mobile/AIRecommend/AIRecommendFlow.tsx src/mobile/FinalizedView.tsx
git commit -m "refactor: restaurant-only AI recommend flow with restate-requirements step"
```

---

## Self-Review Notes

- **Spec coverage:** PRD 3's tag table (地理範圍/與會關係/預算區間/人數規格/硬體與情境/飲食偏好) — Task 1/2. Free-text prompt box — Task 2 (`customPrompt`). "重述需求" retained — Task 3/6. Max 5 recommendations, no suitability % — Task 1 (`getCandidates().slice(0,5)`), verified nowhere adds a percentage field. User's explicit ask to drop 活動/行程 tiers — Tasks 1, 4, 5, 6 all remove every tier branch. PRD's "捷運沿線" geo-search feasibility is explicitly flagged as unresolved in the PRD itself (待釐清) — this plan only adds it as a **selectable tag with a free-text detail field**, with no real geo-filtering logic behind it (consistent with the whole feature being mock data); no further action needed until the PRD's backend question is resolved.
- **Type consistency:** `PreferenceFormState` is defined once in Task 1 and every consumer (`PreferenceFormStep`, `RecommendResultsStep`, `AIRecommendFlow`) imports that exact type rather than redeclaring fields. `Candidate`/`CandidateMeta`/`candidateReason`/`getCandidates` signatures match between Task 1's definition and every call site in Tasks 4 and 6.
- **No placeholders:** every step above has complete, copy-pasteable code; `restaurantCandidates` content is carried over verbatim from the current file (confirmed against the file read during planning) so no candidate copy is lost.
