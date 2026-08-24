import React, { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { EventData, EventLocation, UpdateEventInput } from "../types";
import { getNowLocalValue, isoToLocalValue, localValueToIso } from "../lib/eventStatus";
import { parseLocationInput, extractPlaceNameFromFullUrl, mockResolveShortLink } from "../lib/location";
import { Button, Input } from "../design-system/components";

interface EditEventModalProps {
  event: EventData;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: (input: Omit<UpdateEventInput, "hostToken">) => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({ event, isLoading, onCancel, onConfirm }) => {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || "");
  const [hostName, setHostName] = useState(event.hostName || "");
  const [hostEmail, setHostEmail] = useState(event.hostEmail || "");
  const [responseDeadline, setResponseDeadline] = useState(() => isoToLocalValue(event.responseDeadline));
  const [location, setLocation] = useState<EventLocation | undefined>(event.location);
  const [locationInput, setLocationInput] = useState(event.location?.text || "");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const locationRequestRef = useRef(0);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocationInput(raw);
    const requestId = ++locationRequestRef.current;
    const parsed = parseLocationInput(raw);

    if (!parsed) {
      setIsResolvingLocation(false);
      setLocation(raw.trim() ? { text: raw.trim() } : undefined);
      return;
    }

    if (!parsed.isShortLink) {
      setIsResolvingLocation(false);
      const name = extractPlaceNameFromFullUrl(parsed.url);
      setLocation({ text: name || raw.trim(), url: parsed.url });
      return;
    }

    setIsResolvingLocation(true);
    setLocation({ text: raw.trim(), url: parsed.url });
    mockResolveShortLink(parsed.url).then((name) => {
      if (locationRequestRef.current !== requestId) return;
      setIsResolvingLocation(false);
      setLocation({ text: name, url: parsed.url });
      setLocationInput(name);
    });
  };

  const handleConfirm = () => {
    if (!title.trim()) return;
    onConfirm({
      title: title.trim(),
      description: description.trim(),
      location,
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim(),
      responseDeadline: localValueToIso(responseDeadline),
    });
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200, overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: "var(--radius-modal)", padding: 18, width: "100%", maxWidth: 380, maxHeight: "90%", overflowY: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Pencil size={15} />
          編輯活動資訊
        </div>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 14, lineHeight: 1.6 }}>
          候選時段無法在此修改；如需調整時段，請取消活動後重新建立。
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <Input label="活動名稱" required placeholder="例如：產品專案週對齊會議" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={30} />
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-ink)", display: "block", marginBottom: 6 }}>投票截止時間</label>
            <input
              type="datetime-local"
              value={responseDeadline}
              min={getNowLocalValue()}
              onChange={(e) => setResponseDeadline(e.target.value)}
              style={{ width: "100%", padding: "9px 10px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--color-border)", fontSize: 13, fontWeight: 700 }}
            />
          </div>
          <Input label="主揪暱稱" placeholder="例如：阿傑、Wally" value={hostName} onChange={(e) => setHostName(e.target.value)} />
          <Input label="主揪 Email" placeholder="例如：host@example.com" type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
          <Input
            label="地點"
            placeholder="輸入地點，或貼上 Google Maps 連結"
            value={locationInput}
            onChange={handleLocationChange}
            hint={isResolvingLocation ? "解析地點中..." : location?.url ? "已附上 Google Maps 連結" : undefined}
          />
          <Input label="活動說明（選填）" placeholder="例如：想吃鍋物，歡迎推薦口袋名單" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="muted" fullWidth onClick={onCancel} disabled={isLoading}>取消</Button>
          <Button variant="dark" fullWidth disabled={!title.trim() || isLoading} onClick={handleConfirm}>儲存變更</Button>
        </div>
      </div>
    </div>
  );
};
