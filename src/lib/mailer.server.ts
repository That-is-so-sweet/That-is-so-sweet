// Minimal email sender for host-triggered notifications (e.g. event cancellation).
// Uses Resend's plain HTTP API when RESEND_API_KEY is configured, so no extra
// SMTP client dependency is needed. Without a key, it just logs what would be
// sent — keeps the feature usable in this prototype without real mail infra.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || "揪團通知 <onboarding@resend.dev>";

interface CancellationEmailParams {
  to: string;
  nickname: string;
  eventTitle: string;
  hostName?: string;
}

export async function sendCancellationEmail({ to, nickname, eventTitle, hostName }: CancellationEmailParams): Promise<boolean> {
  const subject = `活動已取消：${eventTitle}`;
  const text = `${nickname} 您好，

很抱歉通知您，您參與的活動「${eventTitle}」已由主揪${hostName ? `（${hostName}）` : ""}取消。

若有任何問題，請直接聯繫主揪。`;

  if (!RESEND_API_KEY) {
    console.log(`[Mail] (未設定 RESEND_API_KEY，僅模擬寄送) 取消通知 -> ${to}: ${subject}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: MAIL_FROM, to, subject, text }),
    });
    if (!res.ok) {
      console.error(`[Mail] Cancellation email to ${to} failed with status ${res.status}`);
    }
    return res.ok;
  } catch (err) {
    console.error("[Mail] Failed to send cancellation email:", err);
    return false;
  }
}
