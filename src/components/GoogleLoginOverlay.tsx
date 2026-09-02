import React from "react";
import { Loader2 } from "lucide-react";

// Purely cosmetic — mimics the brief popup/redirect a real Google OAuth flow
// would show while useFakeAuth's login() timer runs. No network call, no
// real Google page; see README.md "專案定位（重要）".
export const GoogleLoginOverlay: React.FC = () => {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 360, maxWidth: "100%", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #e8eaed", background: "#f1f3f4" }}>
          <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }} />
          </span>
          <div style={{ flex: 1, background: "#fff", borderRadius: 999, padding: "3px 10px", fontSize: 11, color: "#5f6368", display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
            🔒 accounts.google.com
          </div>
        </div>
        <div style={{ padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
          <GoogleGIcon size={36} />
          <Loader2 size={22} className="animate-spin" style={{ color: "#4285F4" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3c4043" }}>正在完成 Google 登入…</div>
          <div style={{ fontSize: 11, color: "#80868b" }}>（Demo 模擬跳轉畫面，不會連線至 Google）</div>
        </div>
      </div>
    </div>
  );
};

const GoogleGIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.3-.1-2.7-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3c-7.4 0-13.8 4-17.7 9.9z" />
    <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.6 36 27 37 24 37c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.9 40.9 16.4 45 24 45z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.4-6.3 6.9l6.6 5.4C39.4 37.6 43 31.3 43 24c0-1.3-.1-2.7-.4-3.5z" />
  </svg>
);
