// Demo-only mock data & helpers for the "AI推薦" (AI recommendation) prototype
// screens. Everything here is hand-authored fake content — there is no real
// API call (no Google Places, no LLM). Nothing in this file reads or writes
// gathertime_events_db; it only reads values already present on the event
// object passed in (attending count, participant nicknames) so the copy
// feels grounded in the demo event without touching the real data model.

export type RecommendTier = "restaurant" | "activity" | "itinerary";

export interface PreferenceFormState {
  relationship: "同事" | "朋友" | "家人" | "其他" | null;
  hasChildren: boolean | null;
  cuisine: string | null; // Lv.1 only
  tone: string | null; // Lv.2 / Lv.3
  duration: string | null; // Lv.2 / Lv.3
  needsMeal: boolean | null; // Lv.3 only
  transport: string | null; // Lv.3 only
}

export const emptyPreferenceForm: PreferenceFormState = {
  relationship: null,
  hasChildren: null,
  cuisine: null,
  tone: null,
  duration: null,
  needsMeal: null,
  transport: null,
};

export function isFormFilled(form: PreferenceFormState): boolean {
  return Object.values(form).some((v) => v !== null);
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

export interface ItineraryStop {
  time: string;
  emoji: string;
  title: string;
  note: string;
  transit?: string;
}

export interface ItineraryCandidate {
  id: string;
  name: string;
  totalDuration: string;
  summary: string;
  stops: ItineraryStop[];
  reasonPersonalized: (ctx: ReasonCtx) => string;
  reasonDefault: (ctx: ReasonCtx) => string;
}

export function candidateReason(c: Candidate, form: PreferenceFormState, ctx: ReasonCtx): string {
  return isFormFilled(form) ? c.reasonPersonalized(ctx) : c.reasonDefault(ctx);
}

export function itineraryReason(c: ItineraryCandidate, form: PreferenceFormState, ctx: ReasonCtx): string {
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

const activityCandidates: Candidate[] = [
  {
    id: "a1",
    emoji: "🧭",
    name: "城市探索定向遊戲",
    tagline: "動態．戶外．約 2 小時",
    tags: ["動態", "戶外", "團隊互動"],
    meta: [
      { label: "時長", value: "約 2 小時" },
      { label: "類型", value: "動態／戶外" },
      { label: "適合人數", value: "4-20 人" },
    ],
    reasonPersonalized: (ctx) => `動態戶外活動，適合 ${ctx.count} 人一起邊走邊玩`,
    reasonDefault: (ctx) => `近期熱門的戶外團體活動，適合 ${ctx.count} 人`,
  },
  {
    id: "a2",
    emoji: "🏺",
    name: "手作陶藝體驗",
    tagline: "靜態．室內．約 1.5 小時",
    tags: ["靜態", "室內", "適合放鬆"],
    meta: [
      { label: "時長", value: "約 1.5 小時" },
      { label: "類型", value: "靜態／室內" },
      { label: "適合人數", value: "2-12 人" },
    ],
    reasonPersonalized: (ctx) => `靜態放鬆的室內體驗，不擅長運動的朋友也能參加，適合 ${ctx.count} 人`,
    reasonDefault: (ctx) => `評價很好的室內手作體驗，適合 ${ctx.count} 人`,
  },
  {
    id: "a3",
    emoji: "🎨",
    name: "沉浸式展覽：光影詩",
    tagline: "靜態．室內．約 1 小時",
    tags: ["靜態", "室內", "展覽"],
    meta: [
      { label: "時長", value: "約 1 小時" },
      { label: "類型", value: "靜態／室內" },
      { label: "適合人數", value: "不限" },
    ],
    reasonPersonalized: (ctx) => `輕鬆的室內展覽，適合帶小孩或想安靜聊天的 ${ctx.count} 人`,
    reasonDefault: (ctx) => `近期評價很高的展覽，適合 ${ctx.count} 人一起參觀`,
  },
  {
    id: "a4",
    emoji: "🚴",
    name: "河濱單車輕旅行",
    tagline: "動態．戶外．約 2.5 小時",
    tags: ["動態", "戶外", "運動"],
    meta: [
      { label: "時長", value: "約 2.5 小時" },
      { label: "類型", value: "動態／戶外" },
      { label: "適合人數", value: "2-15 人" },
    ],
    reasonPersonalized: (ctx) => `適合喜歡動態活動的 ${ctx.count} 人，河濱車道平緩好騎`,
    reasonDefault: (ctx) => `天氣好時很受歡迎的戶外活動，適合 ${ctx.count} 人`,
  },
  {
    id: "a5",
    emoji: "🎲",
    name: "桌遊放鬆吧",
    tagline: "靜態．室內．約 2 小時",
    tags: ["靜態", "室內", "親子友善"],
    meta: [
      { label: "時長", value: "約 2 小時" },
      { label: "類型", value: "靜態／室內" },
      { label: "適合人數", value: "4-16 人" },
    ],
    reasonPersonalized: (ctx) => `室內空間安全，適合攜帶孩童的 ${ctx.count} 人一起玩桌遊`,
    reasonDefault: (ctx) => `適合多人同樂的室內場地，可容納 ${ctx.count} 人`,
  },
];

const itineraryCandidates: ItineraryCandidate[] = [
  {
    id: "i1",
    name: "文青半日輕旅行",
    totalDuration: "半天（約 5 小時）",
    summary: "早午餐 → 藝文展覽 → 河濱散步收尾，步調輕鬆不趕路",
    stops: [
      { time: "10:00", emoji: "☕", title: "咖啡廳早午餐", note: "悠閒吃早午餐，順便集合" },
      { time: "12:30", emoji: "🎨", title: "藝文展覽", note: "步行 8 分鐘可達", transit: "步行 8 分鐘" },
      { time: "15:00", emoji: "🌳", title: "河濱散步收尾", note: "拍照聊天，行程結束" },
    ],
    reasonPersonalized: (ctx) => `步調輕鬆，適合帶小孩或不擅運動的 ${ctx.count} 人`,
    reasonDefault: (ctx) => `評價很好的半日輕旅行路線，適合 ${ctx.count} 人`,
  },
  {
    id: "i2",
    name: "熱血一日小旅行",
    totalDuration: "全天（約 9 小時）",
    summary: "登山健行 → 在地小吃 → 手作體驗 → 晚餐收尾",
    stops: [
      { time: "09:00", emoji: "🥾", title: "登山健行", note: "輕量步道，約 2 小時" },
      { time: "12:30", emoji: "🍜", title: "在地小吃", note: "開車 10 分鐘可達", transit: "開車 10 分鐘" },
      { time: "14:30", emoji: "🏺", title: "手作體驗", note: "步行 5 分鐘可達", transit: "步行 5 分鐘" },
      { time: "18:00", emoji: "🍲", title: "晚餐收尾", note: "圓滿結束一整天行程" },
    ],
    reasonPersonalized: (ctx) => `動態行程豐富，適合喜歡戶外活動的 ${ctx.count} 人玩一整天`,
    reasonDefault: (ctx) => `近期熱門的一日遊路線，適合 ${ctx.count} 人`,
  },
];

export function getCandidates(tier: "restaurant" | "activity"): Candidate[] {
  return tier === "restaurant" ? restaurantCandidates : activityCandidates;
}

export function getItineraryCandidates(): ItineraryCandidate[] {
  return itineraryCandidates;
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

export const RELATIONSHIP_OPTIONS = ["同事", "朋友", "家人", "其他"] as const;
export const CUISINE_OPTIONS = ["亞洲料理", "西式料理", "日式料理", "其他特色料理"] as const;
export const TONE_OPTIONS = ["靜態放鬆", "動態活力"] as const;
export const DURATION_OPTIONS_LV2 = ["1 小時內", "半天內"] as const;
export const DURATION_OPTIONS_LV3 = ["半天", "全天"] as const;
export const TRANSPORT_OPTIONS = ["步行", "大眾運輸", "開車"] as const;

export const TIER_META: Record<RecommendTier, { label: string; icon: string; outputLabel: string }> = {
  restaurant: { label: "Lv.1 選餐廳", icon: "🍽️", outputLabel: "候選餐廳" },
  activity: { label: "Lv.2 活動推薦", icon: "🎯", outputLabel: "候選活動" },
  itinerary: { label: "Lv.3 行程推薦", icon: "🗺️", outputLabel: "候選行程" },
};
