import React from "react";
import { Tag, Button } from "../../design-system/components";
import { cardStyle, SectionLabel } from "../mobileStyles";
import {
  PreferenceFormState,
  RecommendTier,
  RELATIONSHIP_OPTIONS,
  CUISINE_OPTIONS,
  TONE_OPTIONS,
  DURATION_OPTIONS_LV2,
  DURATION_OPTIONS_LV3,
  TRANSPORT_OPTIONS,
} from "../../lib/aiRecommendDemo";

interface PreferenceFormStepProps {
  tier: RecommendTier;
  form: PreferenceFormState;
  onChange: (patch: Partial<PreferenceFormState>) => void;
  onSkip: () => void;
  onNext: () => void;
}

export const PreferenceFormStep: React.FC<PreferenceFormStepProps> = ({ tier, form, onChange, onSkip, onNext }) => {
  const durationOptions = tier === "itinerary" ? DURATION_OPTIONS_LV3 : DURATION_OPTIONS_LV2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.6 }}>
        這份表單全部選填。填了可以幫 AI 縮小推薦範圍；略過的話，會直接用「當地最適合」的預設邏輯推薦。
      </div>

      <div style={cardStyle}>
        <SectionLabel title="與會關係" hint="影響場地調性（例如家人聚會偏安靜、朋友聚會可以熱鬧）" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {RELATIONSHIP_OPTIONS.map((r) => (
            <Tag key={r} variant="orange" active={form.relationship === r} onClick={() => onChange({ relationship: form.relationship === r ? null : r })}>
              {r}
            </Tag>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <SectionLabel title="是否有攜帶孩童" hint="影響親子友善程度與活動安全性" />
        <div style={{ display: "flex", gap: 8 }}>
          <Tag variant="orange" active={form.hasChildren === true} onClick={() => onChange({ hasChildren: form.hasChildren === true ? null : true })}>
            是
          </Tag>
          <Tag variant="orange" active={form.hasChildren === false} onClick={() => onChange({ hasChildren: form.hasChildren === false ? null : false })}>
            否
          </Tag>
        </div>
      </div>

      {tier === "restaurant" && (
        <div style={cardStyle}>
          <SectionLabel title="料理大分類" hint="給 AI 一個起點方向，細節之後可再補充" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CUISINE_OPTIONS.map((c) => (
              <Tag key={c} variant="yellow" active={form.cuisine === c} onClick={() => onChange({ cuisine: form.cuisine === c ? null : c })}>
                {c}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {tier !== "restaurant" && (
        <div style={cardStyle}>
          <SectionLabel title="活動調性" hint="靜態放鬆或動態活力" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TONE_OPTIONS.map((t) => (
              <Tag key={t} variant="yellow" active={form.tone === t} onClick={() => onChange({ tone: form.tone === t ? null : t })}>
                {t}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {tier !== "restaurant" && (
        <div style={cardStyle}>
          <SectionLabel title={tier === "itinerary" ? "整體時長" : "時長偏好"} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {durationOptions.map((d) => (
              <Tag key={d} variant="default" active={form.duration === d} onClick={() => onChange({ duration: form.duration === d ? null : d })}>
                {d}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {tier === "itinerary" && (
        <>
          <div style={cardStyle}>
            <SectionLabel title="是否需要含餐飲" />
            <div style={{ display: "flex", gap: 8 }}>
              <Tag variant="orange" active={form.needsMeal === true} onClick={() => onChange({ needsMeal: form.needsMeal === true ? null : true })}>
                是
              </Tag>
              <Tag variant="orange" active={form.needsMeal === false} onClick={() => onChange({ needsMeal: form.needsMeal === false ? null : false })}>
                否
              </Tag>
            </div>
          </div>
          <div style={cardStyle}>
            <SectionLabel title="交通方式偏好" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TRANSPORT_OPTIONS.map((t) => (
                <Tag key={t} variant="default" active={form.transport === t} onClick={() => onChange({ transport: form.transport === t ? null : t })}>
                  {t}
                </Tag>
              ))}
            </div>
          </div>
        </>
      )}

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
