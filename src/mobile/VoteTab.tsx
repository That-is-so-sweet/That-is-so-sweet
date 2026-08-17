import React, { useState, useEffect } from "react";
import { EventData, AvailabilityStatus, SubmitResponseInput } from "../types";
import { formatChineseWeekday } from "../lib/calendar";
import { Button, Input } from "../design-system/components";
import { cardStyle, STATUS_META } from "./mobileStyles";

interface VoteTabProps {
  event: EventData;
  nickname: string;
  setNickname: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  onSubmit: (input: SubmitResponseInput) => Promise<void>;
  isLoading: boolean;
}

interface VoteRowProps {
  slot: EventData["slots"][number];
  status: AvailabilityStatus;
  onChange: (id: string, status: AvailabilityStatus) => void;
}

const VoteRow: React.FC<VoteRowProps> = (props) => {
  const { slot, status, onChange } = props;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{slot.time}</div>
        {slot.label && <div style={{ fontSize: 10, color: "var(--color-muted)" }}>{slot.label}</div>}
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {(["available", "if_needed", "unavailable"] as AvailabilityStatus[]).map((k) => {
          const active = status === k;
          const meta = STATUS_META[k];
          return (
            <button
              key={k}
              onClick={() => onChange(slot.id, k)}
              style={{
                width: 30,
                height: 30,
                borderRadius: "var(--radius-md)",
                border: active ? `2px solid ${meta.color}` : "1.5px solid var(--color-border)",
                background: active ? meta.color : "#fff",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {meta.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const VoteTab: React.FC<VoteTabProps> = ({ event, nickname, setNickname, email, setEmail, onSubmit, isLoading }) => {
  const [comment, setComment] = useState("");
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = nickname.trim();
    const existing = trimmed
      ? event.responses.find((r) => r.nickname.toLowerCase() === trimmed.toLowerCase())
      : undefined;
    if (existing) {
      setEditingParticipantId(existing.id);
      setAvailability(existing.availability || {});
      if (existing.email) setEmail(existing.email);
      if (existing.comment) setComment(existing.comment);
    } else {
      setEditingParticipantId(null);
      const initial: Record<string, AvailabilityStatus> = {};
      event.slots.forEach((s) => (initial[s.id] = "available"));
      setAvailability(initial);
    }
  }, [event.id, nickname]);

  const setAll = (status: AvailabilityStatus) => {
    const m: Record<string, AvailabilityStatus> = {};
    event.slots.forEach((s) => (m[s.id] = status));
    setAvailability(m);
  };

  const grouped = event.slots.reduce((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {} as Record<string, EventData["slots"]>);

  const handleSubmit = () => {
    if (!nickname.trim()) return;
    onSubmit({
      participantId: editingParticipantId || undefined,
      nickname: nickname.trim(),
      email: email.trim(),
      availability,
      comment: comment.trim(),
    });
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <Input size="sm" label="您的暱稱 *" placeholder="例如：小明" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      <Input size="sm" label="聯絡 Email（選填）" placeholder="例如：name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="ghost" size="sm" onClick={() => setAll("available")}>⚡ 全部有空</Button>
        <Button variant="muted" size="sm" onClick={() => setAll("unavailable")}>全選不行</Button>
      </div>
      <div style={cardStyle}>
        {(Object.entries(grouped) as [string, EventData["slots"]][]).map(([date, list]) => (
          <div key={date} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--color-muted)", padding: "4px 0" }}>
              {date} ({formatChineseWeekday(date)})
            </div>
            {list.map((s) => {
              const status: AvailabilityStatus = availability[s.id] || "available";
              const handleChange = (id: string, st: AvailabilityStatus): void => setAvailability((p) => ({ ...p, [id]: st }));
              return <VoteRow key={s.id} slot={s} status={status} onChange={handleChange} />;
            })}
          </div>
        ))}
      </div>
      <Input size="sm" label="給主揪的話（選填）" placeholder="例如：19:00 才能到" value={comment} onChange={(e) => setComment(e.target.value)} />
      <Button variant="dark" fullWidth disabled={!nickname.trim() || isLoading} onClick={handleSubmit}>
        {editingParticipantId ? "更新我的回覆 🔄" : "送出我的時間"}
      </Button>
    </div>
  );
};
