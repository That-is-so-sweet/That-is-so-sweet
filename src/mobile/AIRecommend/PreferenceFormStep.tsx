import React from "react";
import { Tag, Button, Input } from "../../design-system/components";
import { cardStyle, SectionLabel } from "../mobileStyles";
import {
  PreferenceFormState,
  RELATIONSHIP_OPTIONS,
  BUDGET_OPTIONS,
  PARTY_SIZE_OPTIONS,
  SITUATIONAL_OPTIONS,
  SPICE_OPTIONS,
  CUISINE_OPTIONS,
} from "../../lib/aiRecommendDemo";

interface PreferenceFormStepProps {
  form: PreferenceFormState;
  onChange: (patch: Partial<PreferenceFormState>) => void;
  onSkip: () => void;
  onNext: () => void;
}

export const PreferenceFormStep: React.FC<PreferenceFormStepProps> = ({ form, onChange, onSkip, onNext }) => {
  const toggleSituational = (opt: (typeof SITUATIONAL_OPTIONS)[number]) => {
    const next = form.situational.includes(opt) ? form.situational.filter((s) => s !== opt) : [...form.situational, opt];
    onChange({ situational: next });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.6 }}>
        以下每個選項都是選填。填了可以幫 AI 縮小推薦範圍；略過的話，會直接用「當地最適合」的預設邏輯推薦。
      </div>

      <div style={cardStyle}>
        <SectionLabel title="地點（選填）" hint="輸入捷運站名稱（例如：中山站）或概略地區（例如：北車附近）" />
        <Input
          size="sm"
          placeholder="例如：中山站、北車附近"
          value={form.location}
          onChange={(e) => onChange({ location: e.target.value })}
        />
      </div>

      <div style={cardStyle}>
        <SectionLabel title="與會關係（選填）" hint="影響 AI 推薦的氛圍與桌型配置" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {RELATIONSHIP_OPTIONS.map((r) => (
            <Tag key={r} variant="orange" active={form.relationship === r} onClick={() => onChange({ relationship: form.relationship === r ? null : r })}>
              {r}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="預算區間（選填）" hint="每人平均消費" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {BUDGET_OPTIONS.map((b) => (
            <Tag key={b} variant="yellow" active={form.budget === b} onClick={() => onChange({ budget: form.budget === b ? null : b })}>
              {b}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="人數規格（選填）" hint="篩選具備對應容納量或包廂的餐廳" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PARTY_SIZE_OPTIONS.map((p) => (
            <Tag key={p} variant="default" active={form.partySize === p} onClick={() => onChange({ partySize: form.partySize === p ? null : p })}>
              {p}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="硬體與情境（選填）" hint="可複選" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SITUATIONAL_OPTIONS.map((s) => (
            <Tag key={s} variant="default" active={form.situational.includes(s)} onClick={() => toggleSituational(s)}>
              {s}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="飲食偏好（選填）" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <Tag variant="orange" active={form.vegetarian} onClick={() => onChange({ vegetarian: !form.vegetarian })}>
            素食
          </Tag>
          {SPICE_OPTIONS.map((s) => (
            <Tag key={s} variant="orange" active={form.spice === s} onClick={() => onChange({ spice: form.spice === s ? null : s })}>
              {s}
            </Tag>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CUISINE_OPTIONS.map((c) => (
            <Tag key={c} variant="yellow" active={form.cuisine === c} onClick={() => onChange({ cuisine: form.cuisine === c ? null : c })}>
              {c}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="其他需求（選填）" hint="自由輸入，補充標籤無法表達的細節" />
        <textarea
          value={form.customPrompt}
          onChange={(e) => onChange({ customPrompt: e.target.value })}
          placeholder="例如：想找有現場 live band 的餐廳"
          rows={3}
          style={{
            width: "100%",
            resize: "vertical",
            padding: 10,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-ink)",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <Button variant="muted" fullWidth onClick={onSkip}>
          略過，使用預設推薦
        </Button>
        <Button variant="primary" fullWidth onClick={onNext}>
          產生 AI 推薦
        </Button>
      </div>
    </div>
  );
};
