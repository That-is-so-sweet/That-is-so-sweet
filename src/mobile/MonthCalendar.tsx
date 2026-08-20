import React, { useEffect, useRef, useState } from "react";
import { Lightbulb, Flag } from "lucide-react";
import { navBtnStyle } from "./mobileStyles";
import { HOLIDAYS_2026 } from "./holidays";
import { TimeSlot } from "../types";

interface MonthCalendarProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  viewDate: Date;
  setViewDate: (d: Date) => void;
  slots?: Omit<TimeSlot, "id">[];
  activeDate?: string | null;
  onActiveDateChange?: (d: string) => void;
  isDateOnly?: boolean;
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  selectedDates,
  onChange,
  viewDate,
  setViewDate,
  slots,
  activeDate,
  onActiveDateChange,
  isDateOnly,
}) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const todayStr = new Date().toISOString().slice(0, 10);
  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthHolidays = Object.entries(HOLIDAYS_2026).filter(([k]) => k.startsWith(monthPrefix));
  const set = new Set(selectedDates);
  const countFor = (ds: string) => (slots ? slots.filter((s) => s.date === ds).length : 0);

  // Click-and-drag multi-select: dragging across cells adds/removes them in bulk (decided by the
  // first cell's state), same for mouse drag and touch swipe. A plain tap (no drag movement)
  // instead runs handleCellTap, which also drives which date is "active" for time editing.
  const dragModeRef = useRef<"add" | "remove" | null>(null);
  const dragStartRef = useRef<string | null>(null);
  const dragMovedRef = useRef(false);
  const lastCellRef = useRef<string | null>(null);
  // Tracks the selection as it's being built up during one gesture. A drag can paint the start
  // cell and the newly-entered cell within the same event (same tick), before React has re-rendered
  // with the previous onChange's result — reading the `selectedDates` prop for the second paint
  // would still see the pre-update value and clobber the first. This ref carries the running result
  // across paints within a single gesture instead.
  const pendingDatesRef = useRef<string[]>(selectedDates);

  const paintCell = (ds: string) => {
    if (ds < todayStr || !dragModeRef.current) return;
    if (lastCellRef.current === ds) return;
    lastCellRef.current = ds;
    const isSelected = pendingDatesRef.current.includes(ds);
    if (dragModeRef.current === "add" && !isSelected) {
      pendingDatesRef.current = [...pendingDatesRef.current, ds].sort();
      onChange(pendingDatesRef.current);
    }
    if (dragModeRef.current === "remove" && isSelected) {
      pendingDatesRef.current = pendingDatesRef.current.filter((x) => x !== ds);
      onChange(pendingDatesRef.current);
    }
  };

  const startDrag = (ds: string) => {
    if (ds < todayStr) return;
    dragModeRef.current = selectedDates.includes(ds) ? "remove" : "add";
    dragStartRef.current = ds;
    dragMovedRef.current = false;
    lastCellRef.current = null;
    pendingDatesRef.current = selectedDates;
  };

  const handleCellTap = (ds: string) => {
    if (ds < todayStr) return;
    if (!selectedDates.includes(ds)) {
      onChange([...selectedDates, ds].sort());
      onActiveDateChange?.(ds);
    } else if (onActiveDateChange && activeDate !== ds) {
      onActiveDateChange(ds);
    } else {
      onChange(selectedDates.filter((x) => x !== ds));
    }
  };

  useEffect(() => {
    const end = () => {
      if (dragModeRef.current && !dragMovedRef.current && dragStartRef.current) {
        handleCellTap(dragStartRef.current);
      }
      dragModeRef.current = null;
      dragStartRef.current = null;
      dragMovedRef.current = false;
      lastCellRef.current = null;
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  });

  const handleGridPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragModeRef.current || !dragStartRef.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const ds = el?.closest<HTMLElement>("[data-date]")?.dataset.date;
    if (!ds) return;
    if (ds !== dragStartRef.current && !dragMovedRef.current) {
      dragMovedRef.current = true;
      paintCell(dragStartRef.current);
    }
    if (dragMovedRef.current) paintCell(ds);
  };

  const cells: (number | null)[] = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 6 }}>
        <button style={navBtnStyle} onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
        <select
          value={`${year}-${month}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-").map(Number);
            setViewDate(new Date(y, m, 1));
          }}
          style={{
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            border: "none",
            background: "transparent",
            color: "var(--color-ink)",
            textAlign: "center",
          }}
        >
          {Array.from({ length: 14 }).map((_, i) => {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - 1 + i);
            return (
              <option key={i} value={`${d.getFullYear()}-${d.getMonth()}`}>
                {d.getFullYear()}年{d.getMonth() + 1}月
              </option>
            );
          })}
        </select>
        <button style={navBtnStyle} onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
        {WEEK.map((w, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 800,
              color: i === 0 || i === 6 ? "var(--color-hot)" : "var(--color-muted)",
              padding: "2px 0",
            }}
          >
            {w}
          </div>
        ))}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, touchAction: "none", userSelect: "none" }}
        onPointerMove={handleGridPointerMove}
      >
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = dateStr(d);
          const dow = new Date(year, month, d).getDay();
          const isWeekend = dow === 0 || dow === 6;
          const holiday = HOLIDAYS_2026[ds];
          const active = set.has(ds);
          const isActiveDate = !!onActiveDateChange && ds === activeDate;
          const cnt = countFor(ds);
          const isPast = ds < todayStr;
          const isToday = ds === todayStr;
          return (
            <button
              key={i}
              data-date={ds}
              disabled={isPast}
              onPointerDown={(e) => {
                e.preventDefault();
                startDrag(ds);
              }}
              style={{
                position: "relative",
                aspectRatio: "1.8",
                border: isToday && !active ? "1.5px solid var(--color-primary)" : "1px solid transparent",
                boxShadow: isActiveDate ? "0 0 0 2px var(--color-secondary-dark)" : "none",
                borderRadius: "var(--radius-sm)",
                background: active ? "var(--color-primary)" : holiday ? "rgba(194,67,26,0.08)" : "transparent",
                color: isPast ? "var(--color-border)" : active ? "#fff" : isWeekend || holiday ? "var(--color-hot)" : "var(--color-ink)",
                fontSize: 10,
                fontWeight: isToday ? 900 : 700,
                cursor: isPast ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isPast ? 0.4 : 1,
              }}
            >
              {d}
              {holiday && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 1,
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: active ? "#fff" : "var(--color-hot)",
                  }}
                />
              )}
              {active && !isDateOnly && cnt > 0 && (
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
                    background: "var(--color-secondary)",
                    color: "var(--color-ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 2px",
                  }}
                >
                  {cnt}
                </span>
              )}
              {active && !isDateOnly && cnt === 0 && (
                <span
                  title="尚未選擇時段"
                  style={{
                    position: "absolute",
                    top: 1,
                    right: 1,
                    width: 10,
                    height: 10,
                    fontSize: 8,
                    fontWeight: 900,
                    lineHeight: "10px",
                    borderRadius: 999,
                    background: "var(--color-hot)",
                    color: "#fff",
                    textAlign: "center",
                  }}
                >
                  !
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: "var(--color-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
        <Lightbulb size={10} />
        {onActiveDateChange
          ? "拖曳可一次選取/取消多天；點日期切換編輯時段，再點一次作用中日期可取消"
          : "可直接按住拖曳，一次選取或取消多天"}
      </div>

      {monthHolidays.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
          {monthHolidays.map(([k, v]) => (
            <div key={k} style={{ fontSize: 10, color: "var(--color-hot)", display: "flex", gap: 4, alignItems: "center" }}>
              <Flag size={10} />
              <span style={{ fontWeight: 800 }}>{k.slice(5).replace("-", "/")}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
