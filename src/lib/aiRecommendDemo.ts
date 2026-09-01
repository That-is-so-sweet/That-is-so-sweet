// Demo-only mock data & helpers for the "AI 推薦餐廳" (AI restaurant
// recommendation) prototype screens. Everything here is hand-authored fake
// content — there is no real API call (no Google Places, no LLM). Nothing in
// this file reads or writes gathertime_events_db; it only reads values
// already present on the event object passed in (attending count,
// participant nicknames) so the copy feels grounded in the demo event
// without touching the real data model.
//
// Scope: restaurant recommendations only (PRD update 2026-09-01) — the
// earlier "活動推薦"/"行程推薦" tiers have been removed. The flow is also
// intentionally short: preference form -> results -> host picks one
// directly. There is no "重述需求" confirmation screen and no participant
// "共識確認" voting step — the host just picks straight from the results.

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

// Mock "AI 已根據以下需求推薦" copy — stitches the selected tags + free text
// into a sentence shown as context directly on the results screen (this is
// the "prompt" the tags/text get turned into; there is no separate
// confirmation step for it anymore).
export function buildRestateSummary(form: PreferenceFormState): string {
  if (!isFormFilled(form)) {
    return "你目前沒有填寫任何偏好，AI 直接依「當地評價最高」的預設邏輯推薦餐廳。";
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
  return `AI 已根據以下需求推薦：${parts.join("、")}。`;
}

interface ReasonCtx {
  count: number;
}

// A Google Maps "single place" search link — clicking it opens Maps and
// searches for this name+address. Works even for fictional demo entries
// since it's just a search query, not a claim that a specific listing
// exists.
function mapsSearchUrl(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
}

export interface Candidate {
  id: string;
  emoji: string;
  name: string; // 店名
  tagline: string;
  tags: string[];
  rating: number; // 評分
  priceLevel: string; // 價格，如 $ / $$ / $$$
  area: string; // 地點（行政區／商圈）
  address: string; // 地址
  mapsUrl: string; // Google Maps 網址
  capacityLabel: string; // 可容納人數
  distanceLabel: string; // 距離
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
    rating: 4.6,
    priceLevel: "$$",
    area: "大安區",
    address: "台北市大安區忠孝東路四段 181 巷 40 弄 5 號",
    mapsUrl: mapsSearchUrl("職人炭火燒肉", "台北市大安區忠孝東路四段 181 巷 40 弄 5 號"),
    capacityLabel: "2-10 人",
    distanceLabel: "1.2 km",
    reasonPersonalized: (ctx) => `適合 ${ctx.count} 人同事聚餐、有獨立包廂，符合亞洲料理偏好`,
    reasonDefault: (ctx) => `這附近評價最高、可容納 ${ctx.count} 人的餐廳`,
  },
  {
    id: "r2",
    emoji: "🍝",
    name: "好時光義式餐酒館",
    tagline: "西式料理．氣氛輕鬆",
    tags: ["西式料理", "適合朋友聚會"],
    rating: 4.5,
    priceLevel: "$$$",
    area: "中山區",
    address: "台北市中山區林森北路 107 巷 10 號",
    mapsUrl: mapsSearchUrl("好時光義式餐酒館", "台北市中山區林森北路 107 巷 10 號"),
    capacityLabel: "2-8 人",
    distanceLabel: "800 m",
    reasonPersonalized: (ctx) => `朋友聚會氣氛佳，${ctx.count} 人剛好坐得下`,
    reasonDefault: (ctx) => `評價 4.5 顆星、適合 ${ctx.count} 人的義式餐廳`,
  },
  {
    id: "r3",
    emoji: "🍱",
    name: "山葵日式割烹",
    tagline: "日式料理．安靜舒適",
    tags: ["日式料理", "適合家人聚餐"],
    rating: 4.7,
    priceLevel: "$$$",
    area: "信義區",
    address: "台北市信義區松仁路 58 號 2 樓",
    mapsUrl: mapsSearchUrl("山葵日式割烹", "台北市信義區松仁路 58 號 2 樓"),
    capacityLabel: "2-12 人",
    distanceLabel: "2.0 km",
    reasonPersonalized: (ctx) => `環境安靜，適合家人聚餐，可容納 ${ctx.count} 人`,
    reasonDefault: (ctx) => `當地高評價日式料理，可容納 ${ctx.count} 人`,
  },
  {
    id: "r4",
    emoji: "🥗",
    name: "花園野餐咖啡",
    tagline: "複合式料理．親子友善",
    tags: ["親子友善", "戶外座位"],
    rating: 4.4,
    priceLevel: "$$",
    area: "內湖區",
    address: "台北市內湖區成功路四段 168 號",
    mapsUrl: mapsSearchUrl("花園野餐咖啡", "台北市內湖區成功路四段 168 號"),
    capacityLabel: "2-15 人",
    distanceLabel: "1.5 km",
    reasonPersonalized: (ctx) => `有兒童椅與戶外空間，適合攜帶孩童的 ${ctx.count} 人聚會`,
    reasonDefault: (ctx) => `空間寬敞、適合 ${ctx.count} 人的複合式餐廳`,
  },
  {
    id: "r5",
    emoji: "🍢",
    name: "深夜熱炒 48 號",
    tagline: "亞洲料理．熱鬧下酒",
    tags: ["亞洲料理", "適合朋友聚會", "價格實惠"],
    rating: 4.3,
    priceLevel: "$",
    area: "萬華區",
    address: "台北市萬華區西寧南路 48 號",
    mapsUrl: mapsSearchUrl("深夜熱炒 48 號", "台北市萬華區西寧南路 48 號"),
    capacityLabel: "4-20 人",
    distanceLabel: "600 m",
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
