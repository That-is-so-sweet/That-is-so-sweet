import React from "react";
import { LogIn, CalendarHeart } from "lucide-react";
import { Button } from "../design-system/components";

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 24, textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-lg)",
          background: "var(--color-primary)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <CalendarHeart size={30} />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, color: "var(--color-ink)", margin: 0 }}>
        主揪請先登入
      </h2>
      <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 8, marginBottom: 4, maxWidth: 320 }}>
        建立活動與管理「我揪的團」需要先登入。團員收到活動連結後不需要登入即可投票。
      </p>
      <p style={{ fontSize: 11, color: "var(--color-muted)", opacity: 0.75, marginBottom: 24 }}>
        （Demo 展示用，僅模擬登入畫面，不會真的呼叫 Google）
      </p>
      <Button variant="primary" size="lg" icon={<LogIn size={18} />} onClick={onLogin}>
        使用 Google 帳號登入
      </Button>
    </div>
  );
};
