import React from "react";
import { MonthNavButton, countInAdjacentMonth } from "./mobileStyles";
import { TimeSlot } from "../types";

interface MiniMonthPickerProps {
  selectedDates: string[];
  slots: Omit<TimeSlot, "id">[];
  viewDate: Date;
  setViewDate: (d: Date) => void;
  activeDate: string | null;
  setActiveDate: (d: string) => void;
  isDateOnly?: boolean;
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export const MiniMonthPicker: React.FC<MiniMonthPickerProps> = ({
  selectedDates,
  slots,
  viewDate,
  setViewDate,
  activeDate,
  setActiveDate,
  isDateOnly,
}) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const selSet = new Set(selectedDates);
  const countFor = (ds: string) => slots.filter((s) => s.date === ds).length;
  const cells: (number | null)[] = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const selectedSlots = slots.filter((s) => selSet.has(s.date));
  const prevCount = countInAdjacentMonth(selectedSlots, year, month, -1);
  const nextCount = countInAdjacentMonth(selectedSlots, year, month, 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 6 }}>
        <MonthNavButton direction="prev" onClick={() => setViewDate(new Date(year, month - 1, 1))} badgeCount={prevCount} />
        <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-display)" }}>
          {year}年{month + 1}月
        </div>
        <MonthNavButton direction="next" onClick={() => setViewDate(new Date(year, month + 1, 1))} badgeCount={nextCount} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
        {WEEK.map((w, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: "var(--color-muted)" }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = dateStr(d);
          const selectable = selSet.has(ds);
          const active = ds === activeDate;
          const cnt = countFor(ds);
          return (
            <button
              key={i}
              disabled={!selectable}
              onClick={() => setActiveDate(ds)}
              style={{
                position: "relative",
                aspectRatio: "1",
                border: active ? "2px solid var(--color-primary)" : "1px solid transparent",
                borderRadius: "var(--radius-md)",
                background: active ? "var(--color-primary)" : selectable ? "var(--color-cream)" : "transparent",
                color: active ? "#fff" : selectable ? "var(--color-ink)" : "var(--color-border)",
                fontSize: 11,
                fontWeight: selectable ? 800 : 400,
                cursor: selectable ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {d}
              {selectable && !isDateOnly && cnt > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 1,
                    right: 1,
                    minWidth: 10,
                    height: 10,
                    fontSize: 7,
                    fontWeight: 900,
                    borderRadius: 999,
                    background: active ? "#fff" : "var(--color-hot)",
                    color: active ? "var(--color-primary)" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 2px",
                  }}
                >
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
