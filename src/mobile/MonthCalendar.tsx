import React, { useEffect, useRef, useState } from "react";
import { Lightbulb, Flag, Zap, ChevronUp, ChevronDown } from "lucide-react";
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
  const [toolsOpen, setToolsOpen] = useState(false);
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

  const rangeDates = (): Date[] => {
    if (bulkRange === "month") return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    const days = bulkRange === "2weeks" ? 14 : 90;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const bulkAdd = (pred: (dow: number) => boolean) => {
    const next = new Set(selectedDates);
    rangeDates().forEach((d) => {
      const ds = fmtDate(d);
      if (ds < todayStr) return;
      if (pred(d.getDay())) next.add(ds);
    });
    onChange(Array.from(next).sort());
  };

  // Click-and-drag multi-select: the first cell touched decides add/remove for the whole gesture,
  // works the same for mouse drag and touch swipe.
  const dragModeRef = useRef<"add" | "remove" | null>(null);
  const lastCellRef = useRef<string | null>(null);

  const paintCell = (ds: string) => {
    if (ds < todayStr || !dragModeRef.current) return;
    if (lastCellRef.current === ds) return;
    lastCellRef.current = ds;
    const isSelected = selectedDates.includes(ds);
    if (dragModeRef.current === "add" && !isSelected) onChange([...selectedDates, ds].sort());
    if (dragModeRef.current === "remove" && isSelected) onChange(selectedDates.filter((x) => x !== ds));
  };

  const startDrag = (ds: string) => {
    if (ds < todayStr) return;
    dragModeRef.current = selectedDates.includes(ds) ? "remove" : "add";
    lastCellRef.current = null;
    paintCell(ds);
  };

  useEffect(() => {
    const end = () => {
      dragModeRef.current = null;
      lastCellRef.current = null;
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const handleGridPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragModeRef.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const ds = el?.closest<HTMLElement>("[data-date]")?.dataset.date;
    if (ds) paintCell(ds);
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
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: "var(--color-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
        <Lightbulb size={10} />
        可直接按住拖曳，一次選取或取消多天
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

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
        <button
          onClick={() => setToolsOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            padding: "7px 0",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--color-border-strong)",
            background: toolsOpen ? "var(--color-cream)" : "#fff",
            color: "var(--color-muted)",
            cursor: "pointer",
          }}
        >
          <Zap size={12} />
          批次快速勾選
          {toolsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {toolsOpen && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", marginBottom: 6 }}>套用範圍</div>
            <div
              style={{
                display: "flex",
                gap: 2,
                marginBottom: 10,
                background: "var(--color-cream)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: 3,
              }}
            >
              {RANGE_OPTS.map((r) => (
                <button
                  key={r.k}
                  onClick={() => setBulkRange(r.k)}
                  style={{
                    flex: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "7px 4px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: bulkRange === r.k ? "var(--color-primary)" : "transparent",
                    color: bulkRange === r.k ? "#fff" : "var(--color-ink)",
                    cursor: "pointer",
                    transition: "background 150ms ease, color 150ms ease",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", marginBottom: 6 }}>勾選目標</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              <button onClick={() => bulkAdd(() => true)} style={{ ...quickBtnStyle, flex: 1 }}>
                全部
              </button>
              <button onClick={() => bulkAdd((dow) => dow >= 1 && dow <= 5)} style={{ ...quickBtnStyle, flex: 1 }}>
                平日
              </button>
              <button onClick={() => bulkAdd((dow) => dow === 0 || dow === 6)} style={{ ...quickBtnStyle, flex: 1 }}>
                週末
              </button>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {WEEK.map((w, dow) => (
                <button
                  key={dow}
                  onClick={() => bulkAdd((x) => x === dow)}
                  style={{
                    ...quickBtnStyle,
                    flex: 1,
                    color: dow === 0 || dow === 6 ? "var(--color-hot)" : "var(--color-ink)",
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
