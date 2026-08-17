import React from "react";
import { ToastMessage } from "../types";

interface ToastProps {
  items: ToastMessage[];
}

export const Toast: React.FC<ToastProps> = ({ items }) => {
  return (
    <div style={{ position: "absolute", bottom: 20, left: 16, right: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 300, pointerEvents: "none" }}>
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            padding: "10px 16px",
            borderRadius: "var(--radius-md)",
            background: t.type === "info" ? "var(--color-ink)" : t.type === "error" ? "var(--color-error)" : "var(--color-success)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
};
