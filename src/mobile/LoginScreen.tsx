import React from "react";
import { LogIn, CalendarHeart } from "lucide-react";
import { Button } from "../design-system/components";

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", gap: 4 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-lg)",
          background: "var(--color-primary)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <CalendarHeart size={26} />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 17, color: "var(--color-ink)", margin: 0 }}>
        主揪請先登入
      </h2>
      <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 6, maxWidth: 280 }}>
        建立活動與管理「我揪的團」需要先登入。團員收到活動連結後不需要登入即可投票。
      </p>
      <p style={{ fontSize: 10, color: "var(--color-muted)", opacity: 0.75, marginBottom: 20 }}>
        （Demo 展示用，僅模擬登入畫面，不會真的呼叫 Google）
      </p>
      <Button variant="primary" size="md" fullWidth icon={<LogIn size={16} />} onClick={onLogin}>
        使用 Google 帳號登入
      </Button>
    </div>
  );
};
