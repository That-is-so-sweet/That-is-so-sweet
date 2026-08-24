import React, { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { EventData, SubmitCommentInput } from "../types";
import { canComment, formatCommentDate } from "../lib/eventStatus";
import { Avatar, Button, Input } from "../design-system/components";
import { cardStyle, SectionLabel } from "./mobileStyles";

interface CommentBoardProps {
  event: EventData;
  nickname: string;
  setNickname: (v: string) => void;
  onSubmit: (input: SubmitCommentInput) => Promise<void>;
  isLoading: boolean;
}

export const CommentBoard: React.FC<CommentBoardProps> = ({ event, nickname, setNickname, onSubmit, isLoading }) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const comments = event.comments || [];
  const open = canComment(event);

  const handleSubmit = async () => {
    if (!nickname.trim() || !message.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ nickname: nickname.trim(), message: message.trim() });
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={cardStyle}>
      <SectionLabel title="留言板" hint={open ? "參與者與主揪都可以在這裡留言討論" : "此活動已無法再留言"} />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: open ? 14 : 0, maxHeight: 320, overflowY: "auto" }}>
        {comments.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--color-muted)", textAlign: "center", padding: "10px 0" }}>
            <MessageSquare size={16} style={{ display: "block", margin: "0 auto 6px", opacity: 0.5 }} />
            還沒有人留言，來說句話吧！
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Avatar name={c.nickname} size="sm" />
              <div style={{ flex: 1, minWidth: 0, background: "var(--color-cream)", borderRadius: "var(--radius-md)", padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{c.nickname}</span>
                  <span style={{ fontSize: 10, color: "var(--color-muted)" }}>{formatCommentDate(c.createdAt)}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-ink)", marginTop: 3, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {c.message}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: comments.length ? 12 : 0, borderTop: comments.length ? "1px solid var(--color-border)" : "none" }}>
          <Input size="sm" label="您的暱稱" required placeholder="例如：小明" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>
              留言內容<span style={{ color: "var(--color-primary)", marginLeft: 4 }}>*</span>
            </label>
            <div style={{ fontSize: 11, color: "var(--color-muted)" }}>在這邊留言會被寄信喔，請留下想讓大家看到的內容。</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="想跟大家說什麼？"
              maxLength={300}
              rows={2}
              style={{
                width: "100%",
                resize: "vertical",
                border: "2px solid var(--color-border)",
                borderRadius: "var(--radius-input)",
                padding: "9px 12px",
                fontSize: 13,
                fontFamily: "var(--font-body)",
                color: "var(--color-ink)",
                background: "var(--color-surface)",
                outline: "none",
              }}
            />
          </div>
          <Button
            variant="dark"
            fullWidth
            disabled={!nickname.trim() || !message.trim() || submitting || isLoading}
            onClick={handleSubmit}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              送出留言
              <Send size={13} />
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};
