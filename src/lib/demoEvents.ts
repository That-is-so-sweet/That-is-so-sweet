export interface DemoEventInfo {
  id: string;
  label: string;
  desc: string;
}

// Fixed set of seeded scenarios (see localEventStore.ts's seedDemoEvents) so
// people can jump straight into any lifecycle state without creating it first.
export const DEMO_EVENTS: DemoEventInfo[] = [
  { id: "demo-gathering", label: "進行中・含時段", desc: "多個候選時段，正在收集投票" },
  { id: "demo-date-only", label: "進行中・僅選日期", desc: "簡化模式：參與者只需勾選日期" },
  { id: "demo-voting-closed", label: "投票已截止・尚未定案", desc: "截止時間已過，主揪尚未拍板" },
  { id: "demo-finalized-upcoming", label: "已敲定・尚未舉辦", desc: "時間已定案，活動尚未開始" },
  { id: "demo-finalized-ended", label: "活動已結束（3 天前）", desc: "活動已結束，連結 4 天後將失效" },
  { id: "demo-expired-link", label: "連結已失效範例", desc: "活動結束超過 7 天，示範失效畫面" },
  { id: "demo-cancelled", label: "主揪已取消範例", desc: "主揪臨時取消活動，示範取消畫面" },
];
