import { TimeSlot, ParticipantResponse, SlotStats, AvailabilityStatus } from "../types";

// Shared helpers for working with TimeSlot.time strings like "18:00 - 21:00 (晚餐)"

export function calculateSlotDuration(timeStr: string): string | null {
  const match = timeStr.match(/(\d{1,2}:\d{2})\s*[-~～]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  const [, start, end] = match;
  const [h1, m1] = start.split(":").map(Number);
  const [h2, m2] = end.split(":").map(Number);
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff <= 0) diff += 1440;
  if (diff < 60) return `${diff} 分鐘`;
  if (diff % 60 === 0) return `${diff / 60} 小時`;
  return `${(diff / 60).toFixed(1)} 小時`;
}

export function to12Hour(time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  let h = parseInt(match[1], 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${match[2]} ${period}`;
}

// Formats every "HH:mm" occurrence in a slot time string (plain time or a
// "18:00 - 21:00 (晚餐)" range) as 12-hour with AM/PM, so slot times render
// consistently regardless of where they're displayed.
export function formatSlotTime(timeStr: string): string {
  return timeStr.replace(/\d{1,2}:\d{2}/g, (m) => to12Hour(m));
}

export function parseSlotTimes(timeStr: string): { start: string; end: string | null; periodLabel: string | null } {
  const match = timeStr.match(/(\d{1,2}:\d{2})\s*[-~～]\s*(\d{1,2}:\d{2})(?:\s*\((.*?)\))?/);
  if (match) {
    return { start: match[1], end: match[2], periodLabel: match[3] || null };
  }
  return { start: timeStr, end: null, periodLabel: null };
}

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  if (!timeStr || !timeStr.includes(":")) return timeStr;
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  let totalM = h * 60 + m + minutesToAdd;
  totalM = (totalM + 1440) % 1440;
  const newH = Math.floor(totalM / 60);
  const newM = totalM % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export function getNextWeekdayDate(targetDayNum: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + ((targetDayNum + 7 - day) % 7 || 7);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export function computeSlotStats(slots: TimeSlot[], responses: ParticipantResponse[]): SlotStats[] {
  const total = responses.length;
  return slots.map((slot) => {
    let availableCount = 0;
    let ifNeededCount = 0;
    let unavailableCount = 0;
    const availableNames: string[] = [];
    const ifNeededNames: string[] = [];
    const unavailableNames: string[] = [];

    responses.forEach((r) => {
      const status: AvailabilityStatus = r.availability[slot.id] || "unavailable";
      if (status === "available") {
        availableCount++;
        availableNames.push(r.nickname);
      } else if (status === "if_needed") {
        ifNeededCount++;
        ifNeededNames.push(r.nickname);
      } else {
        unavailableCount++;
        unavailableNames.push(r.nickname);
      }
    });

    return {
      slotId: slot.id,
      slot,
      availableCount,
      ifNeededCount,
      unavailableCount,
      availableNames,
      ifNeededNames,
      unavailableNames,
      score: availableCount * 2 + ifNeededCount,
      percentage: total ? Math.round((availableCount / total) * 100) : 0,
    };
  });
}
