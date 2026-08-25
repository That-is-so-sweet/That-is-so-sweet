import React from "react";
import { Clock, MapPin, StickyNote } from "lucide-react";
import { EventLocation } from "../types";
import { cardStyle } from "./mobileStyles";
import { formatDeadline, formatRemaining } from "../lib/eventStatus";

interface EventInfoCardProps {
  title: string;
  hostName?: string;
  location?: EventLocation;
  description?: string;
  responseDeadlineIso?: string;
}

export const EventInfoCard: React.FC<EventInfoCardProps> = ({ title, hostName, location, description, responseDeadlineIso }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title || "（尚未命名）"}
        </div>
        {hostName && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
            主揪：{hostName}
          </span>
        )}
      </div>

      {responseDeadlineIso && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "8px 10px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-primary-subtle)",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-primary-dark)", display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
            <Clock size={13} style={{ flexShrink: 0 }} />
            投票截止 {formatDeadline(responseDeadlineIso)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, color: "var(--color-hot)", flexShrink: 0, whiteSpace: "nowrap" }}>
            {formatRemaining(responseDeadlineIso)}
          </span>
        </div>
      )}

      {(location || description) && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 6 }}>
          {location && (
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)", display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={13} color="var(--color-muted)" style={{ flexShrink: 0 }} />
              {location.url ? (
                <a href={location.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", fontWeight: 800 }}>
                  {location.text}
                </a>
              ) : (
                location.text
              )}
            </div>
          )}
          {description && (
            <div style={{ fontSize: 11, color: "var(--color-muted)", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <StickyNote size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
