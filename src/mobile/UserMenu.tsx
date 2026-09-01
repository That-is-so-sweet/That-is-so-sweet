import React, { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar } from "../design-system/components";
import { FakeUser } from "../lib/fakeAuth";

interface UserMenuProps {
  user: FakeUser;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 2 }}
      >
        <Avatar name={user.name} size="xs" />
        <ChevronDown size={12} color="#fff" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "#fff",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--color-border)",
              minWidth: 150,
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 1 }}>{user.email}</div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                padding: "10px 12px",
                border: "none",
                background: "none",
                color: "var(--color-hot)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <LogOut size={14} />
              登出
            </button>
          </div>
        </>
      )}
    </div>
  );
};
