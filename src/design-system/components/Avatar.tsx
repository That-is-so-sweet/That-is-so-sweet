import React from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type AvatarBadgeVariant = "primary" | "hot" | "success" | "dark";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
  badge?: React.ReactNode;
  badgeVariant?: AvatarBadgeVariant;
}

const sizeMap: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };

const badgeVariants: Record<AvatarBadgeVariant, React.CSSProperties> = {
  primary: { background: "var(--color-primary)", color: "#fff" },
  hot: { background: "var(--color-hot)", color: "#fff" },
  success: { background: "var(--color-success)", color: "#fff" },
  dark: { background: "var(--color-ink)", color: "var(--color-cream)" },
};

const bgColors = ["var(--color-primary)", "var(--color-secondary)", "var(--color-hot)", "var(--color-success)"];

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = "md", badge, badgeVariant = "primary" }) => {
  const px = sizeMap[size] || sizeMap.md;
  const initials = name
    ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const hue = name ? (name.charCodeAt(0) * 17 + (name.charCodeAt(1) || 0) * 7) % 360 : 30;
  const bg = src ? "transparent" : bgColors[Math.floor(hue / 90) % 4];

  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <div
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          background: src ? "var(--color-border)" : bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
          border: "2px solid var(--color-surface)",
        }}
      >
        {src ? (
          <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: Math.round(px * 0.38),
              color: bg === "var(--color-secondary)" ? "var(--color-ink)" : "#fff",
              lineHeight: 1,
            }}
          >
            {initials}
          </span>
        )}
      </div>
      {badge !== undefined && (
        <span
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            minWidth: 16,
            height: 16,
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 900,
            fontFamily: "var(--font-display)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            border: "2px solid var(--color-surface)",
            ...badgeVariants[badgeVariant],
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
};
