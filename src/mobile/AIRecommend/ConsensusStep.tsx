import React from "react";
import { Check, X } from "lucide-react";
import { Button, ProgressBar } from "../../design-system/components";
import { cardStyle } from "../mobileStyles";
import { mockConsensus } from "../../lib/aiRecommendDemo";

export interface ConsensusItem {
  id: string;
  emoji: string;
  name: string;
}

interface ConsensusStepProps {
  items: ConsensusItem[];
  nicknames: string[];
  myVotes: Record<string, "accept" | "reject" | undefined>;
  onToggleMyVote: (id: string, vote: "accept" | "reject") => void;
  onConfirm: (id: string) => void;
}

const pillStyle = (accepted: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 8px",
  borderRadius: "var(--radius-pill)",
  fontSize: 11,
  fontWeight: 800,
  background: accepted ? "rgba(90,158,90,0.12)" : "var(--color-border)",
  color: accepted ? "var(--color-success)" : "var(--color-muted)",
});

export const ConsensusStep: React.FC<ConsensusStepProps> = ({ items, nicknames, myVotes, onToggleMyVote, onConfirm }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.6 }}>
        比照時間投票的共識邏輯：其他參與者的意見以模擬資料呈現，你可以標記自己的選擇，主揪再從中挑一個拍板。
      </div>

      {items.map((item) => {
        const base = mockConsensus(item.id, nicknames);
        const myVote = myVotes[item.id];
        const accepted = myVote === "accept" ? [...base.accepted, "你"] : base.accepted;
        const rejected = myVote === "reject" ? [...base.rejected, "你"] : base.rejected;
        const total = accepted.length + rejected.length;
        const pct = total > 0 ? Math.round((accepted.length / total) * 100) : 0;

        return (
          <div key={item.id} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>{item.name}</span>
            </div>

            <ProgressBar value={pct} max={100} showCount={false} label={`${pct}% 可接受`} variant={pct >= 70 ? "success" : "primary"} size="sm" />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {accepted.map((n) => (
                <span key={`a-${n}`} style={pillStyle(true)}>
                  <Check size={10} />
                  {n}
                </span>
              ))}
              {rejected.map((n) => (
                <span key={`r-${n}`} style={pillStyle(false)}>
                  <X size={10} />
                  {n}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Button variant={myVote === "accept" ? "primary" : "muted"} size="sm" fullWidth onClick={() => onToggleMyVote(item.id, "accept")}>
                我可以
              </Button>
              <Button variant={myVote === "reject" ? "hot" : "muted"} size="sm" fullWidth onClick={() => onToggleMyVote(item.id, "reject")}>
                不行
              </Button>
            </div>

            <div style={{ marginTop: 8 }}>
              <Button variant="dark" size="sm" fullWidth onClick={() => onConfirm(item.id)}>
                主揪選這個，拍板定案
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
