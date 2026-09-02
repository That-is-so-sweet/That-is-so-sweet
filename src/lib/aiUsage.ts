// Demo-only mock for "AI 選餐廳每月使用次數上限，與主揪帳號綁定" (PRD
// 2026-09-02). There is no real backend or account system in this
// prototype (see README.md "專案定位（重要）"), so this just counts calls
// per browser in localStorage, reset whenever the calendar month changes —
// standing in for what a real per-account monthly counter would do.
const USAGE_KEY = "gathertime_ai_usage";
const MONTHLY_LIMIT = 20;

interface UsageRecord {
  yearMonth: string; // "2026-09"
  count: number;
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function readUsage(): UsageRecord {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    const parsed: UsageRecord | null = raw ? JSON.parse(raw) : null;
    if (!parsed || parsed.yearMonth !== currentYearMonth()) {
      return { yearMonth: currentYearMonth(), count: 0 };
    }
    return parsed;
  } catch {
    return { yearMonth: currentYearMonth(), count: 0 };
  }
}

export function getMonthlyAiUsage(): { count: number; limit: number } {
  return { count: readUsage().count, limit: MONTHLY_LIMIT };
}

export function hasReachedMonthlyAiLimit(): boolean {
  return readUsage().count >= MONTHLY_LIMIT;
}

// Call once per "產生推薦"/"重新整理" — both count toward the monthly cap.
export function recordAiUsage(): void {
  try {
    const usage = readUsage();
    usage.count += 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch {}
}
