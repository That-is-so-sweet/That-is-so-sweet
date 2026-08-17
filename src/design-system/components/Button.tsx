import React, { useState } from "react";

type ButtonVariant = "primary" | "secondary" | "hot" | "ghost" | "dark" | "muted";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  icon?: React.ReactNode;
}

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "8px 16px", fontSize: 13, minHeight: 36 },
  md: { padding: "12px 24px", fontSize: 16, minHeight: 44 },
  lg: { padding: "16px 32px", fontSize: 18, minHeight: 52 },
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--color-primary)",
    color: "var(--text-on-primary)",
    boxShadow: "0 4px 16px rgba(224,75,40,0.35)",
  },
  secondary: {
    background: "var(--color-secondary)",
    color: "var(--text-on-secondary)",
    boxShadow: "0 4px 16px rgba(245,194,0,0.35)",
  },
  hot: {
    background: "var(--color-hot)",
    color: "var(--text-on-hot)",
    boxShadow: "0 4px 16px rgba(194,59,26,0.35)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-primary)",
    border: "2px solid var(--color-primary)",
    boxShadow: "none",
  },
  dark: {
    background: "var(--color-ink)",
    color: "var(--color-cream)",
    boxShadow: "0 4px 16px rgba(26,18,8,0.25)",
  },
  muted: {
    background: "var(--color-border)",
    color: "var(--color-muted)",
    boxShadow: "none",
  },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  onClick,
  type = "button",
  icon,
}) => {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: "var(--font-display)",
    fontWeight: 900,
    borderRadius: "var(--radius-pill)",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "transform 150ms var(--ease-spring), box-shadow 150ms ease, background 120ms ease, filter 150ms ease",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : "auto",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    transform: !disabled && pressed ? "scale(0.96)" : !disabled && hover ? "translateY(-1px)" : "none",
    filter: !disabled && hover ? "brightness(1.07)" : "none",
  };

  const style: React.CSSProperties = { ...base, ...sizes[size], ...variants[variant] };

  return (
    <button
      type={type}
      style={style}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}
      {children}
    </button>
  );
};
