import React from "react";

type TagVariant = "default" | "orange" | "yellow" | "hot";
type TagSize = "sm" | "md" | "lg";

interface TagProps {
  children?: React.ReactNode;
  emoji?: React.ReactNode;
  variant?: TagVariant;
  size?: TagSize;
  onClick?: () => void;
  active?: boolean;
}

const sizes: Record<TagSize, React.CSSProperties> = {
  sm: { padding: "4px 10px", fontSize: 12, gap: 3 },
  md: { padding: "6px 14px", fontSize: 13, gap: 4 },
  lg: { padding: "8px 18px", fontSize: 15, gap: 5 },
};

function variantStyle(variant: TagVariant, active: boolean): React.CSSProperties {
  switch (variant) {
    case "orange":
      return {
        background: active ? "var(--color-primary)" : "var(--color-primary-subtle)",
        color: active ? "#fff" : "var(--color-primary)",
        border: "1.5px solid transparent",
      };
    case "yellow":
      return {
        background: active ? "var(--color-secondary)" : "var(--color-secondary-subtle)",
        color: active ? "var(--color-ink)" : "var(--color-secondary-dark)",
        border: "1.5px solid transparent",
      };
    case "hot":
      return { background: "var(--color-hot-subtle)", color: "var(--color-hot)", border: "1.5px solid transparent" };
    default:
      return {
        background: active ? "var(--color-primary)" : "var(--color-surface)",
        color: active ? "#fff" : "var(--color-ink)",
        border: active ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
      };
  }
}

export const Tag: React.FC<TagProps> = (props) => {
  const { children, emoji, onClick } = props;
  const variant: TagVariant = props.variant ?? "default";
  const size: TagSize = props.size ?? "md";
  const active: boolean = props.active ?? false;
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "var(--radius-pill)",
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    cursor: onClick ? "pointer" : "default",
    transition: "all 150ms var(--ease-spring)",
    ...sizes[size],
    ...variantStyle(variant, active),
  };
  return (
    <span onClick={onClick} style={style}>
      {emoji && <span style={{ fontSize: 14 }}>{emoji}</span>}
      {children}
    </span>
  );
};
