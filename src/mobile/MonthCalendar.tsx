import React, { useState } from "react";
import { navBtnStyle, quickBtnStyle } from "./mobileStyles";
import { HOLIDAYS_2026 } from "./holidays";

interface MonthCalendarProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  viewDate: Date;
  setViewDate: (d: Date) => void;
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const RANGE_OPTS: { k: "month" | "2weeks" | "3months"; label: string }[] = [
  { k: "month", label: "本月" },
  { k: "2weeks", label: "近兩週" },
  { k: "3months", label: "近三個月" },
];

export const MonthCalendar: React.FC<MonthCalendarProps> = ({ selectedDates, onChange, viewDate, setViewDate }) => {
  const [bulkRange, setBulkRange] = useState<"month" | "2weeks" | "3months">("month");
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const todayStr = new Date().toISOString().slice(0, 10);
  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthHolidays = Object.entries(HOLIDAYS_2026).filter(([k]) => k.startsWith(monthPrefix));
  const set = new Set(selectedDates);
  const toggleOne = (ds: string) => onChange(set.has(ds) ? selectedDates.filter((x) => x !== ds) : [...selectedDates, ds].sort());

  const rangeDates = (): Date[] => {
    if (bulkRange === "month") return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    const days = bulkRange === "2weeks" ? 14 : 90;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const bulk = (pred: (dow: number) => boolean) => {
    const next = new Set(selectedDates);
    rangeDates().forEach((d) => {
      const ds = fmtDate(d);
      if (ds < todayStr) return;
      if (pred(d.getDay())) next.add(ds);
    });
    onChange(Array.from(next).sort());
  };

  const clearRange = () => {
    const rset = new Set(rangeDates().map(fmtDate));
    onChange(selectedDates.filter((x) => !rset.has(x)));
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = dateStr(d);
          const dow = new Date(year, month, d).getDay();
          const isWeekend = dow === 0 || dow === 6;
          const holiday = HOLIDAYS_2026[ds];
          const active = set.has(ds);
          const isPast = ds < todayStr;
          const isToday = ds === todayStr;
          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => toggleOne(ds)}
              style={{
                position: "relative",
                aspectRatio: "1",
                border: isToday && !active ? "1.5px solid var(--color-primary)" : "1px solid transparent",
                borderRadius: "var(--radius-md)",
                background: active ? "var(--color-primary)" : holiday ? "rgba(194,67,26,0.08)" : "transparent",
                color: isPast ? "var(--color-border)" : active ? "#fff" : isWeekend || holiday ? "var(--color-hot)" : "var(--color-ink)",
                fontSize: 12,
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
                    bottom: 2,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: active ? "#fff" : "var(--color-hot)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {monthHolidays.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
          {monthHolidays.map(([k, v]) => (
            <div key={k} style={{ fontSize: 10, color: "var(--color-hot)", display: "flex", gap: 4, alignItems: "center" }}>
              <span>🎌</span>
              <span style={{ fontWeight: 800 }}>{k.slice(5).replace("-", "/")}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", marginBottom: 6 }}>批次選取範圍</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {RANGE_OPTS.map((r) => (
            <button
              key={r.k}
              onClick={() => setBulkRange(r.k)}
              style={{
                ...quickBtnStyle,
                flex: 1,
                background: bulkRange === r.k ? "var(--color-primary)" : "#fff",
                color: bulkRange === r.k ? "#fff" : "var(--color-ink)",
                borderColor: bulkRange === r.k ? "var(--color-primary)" : "var(--color-border)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <button onClick={() => bulk((dow) => dow >= 1 && dow <= 5)} style={{ ...quickBtnStyle, flex: 1 }}>
            全選平日
          </button>
          <button onClick={() => bulk((dow) => dow === 0 || dow === 6)} style={{ ...quickBtnStyle, flex: 1 }}>
            全選週末
          </button>
          <button onClick={clearRange} style={{ ...quickBtnStyle, flex: 1, color: "var(--color-muted)" }}>
            清空範圍
          </button>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {WEEK.map((w, dow) => (
            <button key={dow} onClick={() => bulk((x) => x === dow)} style={{ ...quickBtnStyle, flex: 1, padding: "6px 0" }}>
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
