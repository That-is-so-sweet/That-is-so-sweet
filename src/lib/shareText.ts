import { EventData } from "../types";
import { formatChineseWeekday } from "./calendar";
import { formatSlotTime } from "./slots";
import { formatDeadline, isVotingOpen } from "./eventStatus";

// What ShareModal should show depends on where the event actually is in its
// lifecycle — inviting people to vote on an event that's already finalized
// (or cancelled) doesn't make sense, so the copy text and headline branch on it.
export type ShareKind = "collecting" | "voting_closed" | "finalized" | "cancelled";

export interface ShareContent {
  kind: ShareKind;
  headline: string;
  copyButtonLabel: string;
  copyText: string;
}

// Shared with FinalizedView's "一鍵複製聚會敲定通知" button so the two
// surfaces never drift into announcing the finalized time differently.
export function buildFinalizedBroadcast(event: Pick<EventData, "title" | "hostName" | "finalSlotId" | "slots" | "finalNote" | "mode" | "responses">): string {
  const slot = event.slots.find((s) => s.id === event.finalSlotId) || event.slots[0];
  const isDateOnly = event.mode === "date_only";
  const attending = slot ? event.responses.filter((r) => r.availability[slot.id] === "available").map((r) => r.nickname) : [];
  return `🎉【聚會時間正式敲定囉！】
活動名稱：${event.title}
主揪：${event.hostName || "熱心主揪"}
📅 日期：${slot.date} (${formatChineseWeekday(slot.date)})
${isDateOnly ? "" : `⏰ 時間：${formatSlotTime(slot.time)}\n`}${event.finalNote ? `💬 備註：${event.finalNote}\n` : ""}
👥 出席 (${attending.length}人)：${attending.join("、") || "歡迎大家參與！"}`;
}

// One link for the whole lifecycle — no "&tab=vote" — so it keeps working
// (and showing the right screen) whether voting is open, closed, or finalized.
// import.meta.env.BASE_URL mirrors vite.config.ts's `base` (e.g. "/That-is-so-sweet/"
// on GitHub Pages, "/" in dev) — without it the link 404s on Pages.
export function getEventShareUrl(event: Pick<EventData, "id">, appOrigin: string): string {
  return `${appOrigin}${import.meta.env.BASE_URL}#event=${event.id}`;
}

export function getShareContent(event: EventData, shareUrl: string): ShareContent {
  if (event.status === "cancelled") {
    return {
      kind: "cancelled",
      headline: "活動已取消",
      copyButtonLabel: "複製取消通知",
      copyText: `📢【${event.title}】活動已取消
主揪：${event.hostName || "熱心朋友"}
很抱歉，這個活動已經被主揪取消了，之後有新的時間會再另行通知！

活動連結：
${shareUrl}`,
    };
  }

  if (event.status === "finalized") {
    return {
      kind: "finalized",
      headline: "活動時間已敲定！",
      copyButtonLabel: "複製聚會敲定通知",
      copyText: `${buildFinalizedBroadcast(event)}

活動連結：
${shareUrl}`,
    };
  }

  if (!isVotingOpen(event)) {
    return {
      kind: "voting_closed",
      headline: "投票已截止，統整中",
      copyButtonLabel: "複製通知文字",
      copyText: `📊【${event.title}】投票時間已截止
主揪：${event.hostName || "熱心朋友"}
投票時間已經結束，主揪正在整理大家的回覆，最終聚會時間確定後會再另行通知！

想先看看大家目前回覆的狀況嗎：
${shareUrl}`,
    };
  }

  return {
    kind: "collecting",
    headline: "活動建立成功！",
    copyButtonLabel: "複製 LINE 分享文字",
    copyText: `📢【${event.title}】聚會時間調查邀請！
主揪：${event.hostName || "熱心朋友"}
${event.location ? `📍 地點：${event.location.text}${event.location.url ? ` ${event.location.url}` : ""}\n` : ""}${event.description ? `說明：${event.description}\n` : ""}${event.responseDeadline ? `⏰ 請於 ${formatDeadline(event.responseDeadline)} 前完成填寫\n` : ""}
不用註冊登入，點擊連結即可選擇你有空的時間：
${shareUrl}`,
  };
}
