import React from "react";

type BadgeVariant = "primary" | "secondary" | "hot" | "success" | "dark" | "muted";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children?: React.ReactNode;
  count?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variants: Record<BadgeVariant, React.CSSProperties> = {
  primary: { background: "var(--color-primary)", color: "#fff" },
  secondary: { background: "var(--color-secondary)", color: "var(--color-ink)" },
  hot: { background: "var(--color-hot)", color: "#fff" },
  success: { background: "var(--color-success)", color: "#fff" },
  dark: { background: "var(--color-ink)", color: "var(--color-cream)" },
  muted: { background: "var(--color-border)", color: "var(--color-muted)" },
};

const sizes: Record<BadgeSize, React.CSSProperties> = {
  sm: { fontSize: 10, minWidth: 18, height: 18, padding: "0 5px" },
  md: { fontSize: 12, minWidth: 22, height: 22, padding: "0 7px" },
  lg: { fontSize: 14, minWidth: 28, height: 28, padding: "0 10px" },
};

export const Badge: React.FC<BadgeProps> = ({ children, count, variant = "primary", size = "md" }) => {
  const display = count !== undefined ? (count > 99 ? "99+" : String(count)) : children;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        lineHeight: 1,
        ...sizes[size],
        ...variants[variant],
      }}
    >
      {display}
    </span>
  );
};
