import React from "react";
import { X } from "lucide-react";
import { ToastMessage } from "../types";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        zIndex: 300,
        pointerEvents: "none",
        padding: "0 16px",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            borderRadius: "var(--radius-md)",
            background: t.type === "info" ? "var(--color-ink)" : t.type === "error" ? "var(--color-error)" : "var(--color-success)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--font-body)",
            boxShadow: "var(--shadow-lg)",
            maxWidth: 420,
          }}
        >
          <span style={{ flex: 1 }}>{t.text}</span>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="關閉提示"
            style={{ border: "none", background: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
