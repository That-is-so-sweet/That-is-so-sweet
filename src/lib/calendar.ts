// Helper functions to generate calendar links and .ics files

function addOneDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export function generateGoogleCalendarUrl(
  title: string,
  dateStr: string, // "2026-08-15"
  timeStr: string, // "18:00 - 21:00"
  locationStr: string = "",
  descriptionStr: string = "",
  allDay: boolean = false
): string {
  try {
    let dates: string;
    if (allDay) {
      const startYmd = dateStr.replace(/-/g, "");
      dates = `${startYmd}/${addOneDay(dateStr)}`;
    } else {
      const [startHourMin, endHourMin] = parseTimes(timeStr);
      const startIso = formatDateForGCal(dateStr, startHourMin);
      const endIso = formatDateForGCal(dateStr, endHourMin);
      dates = `${startIso}/${endIso}`;
    }

    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const params = new URLSearchParams({
      text: title,
      dates,
      details: descriptionStr,
      location: locationStr,
    });

    return `${baseUrl}&${params.toString()}`;
  } catch (err) {
    console.error("Failed to generate Google Calendar link:", err);
    return "https://calendar.google.com";
  }
}

export function downloadIcsFile(
  title: string,
  dateStr: string,
  timeStr: string,
  locationStr: string = "",
  descriptionStr: string = "",
  allDay: boolean = false
) {
  try {
    const dateLines = allDay
      ? [`DTSTART;VALUE=DATE:${dateStr.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addOneDay(dateStr)}`]
      : (() => {
          const [startHourMin, endHourMin] = parseTimes(timeStr);
          return [`DTSTART:${formatDateForGCal(dateStr, startHourMin)}`, `DTEND:${formatDateForGCal(dateStr, endHourMin)}`];
        })();

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GatherTime//Gathering Coordinator//ZH",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${descriptionStr.replace(/\n/g, "\\n")}`,
      `LOCATION:${locationStr}`,
      ...dateLines,
      `STATUS:CONFIRMED`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}_event.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to download ICS file:", err);
  }
}

function parseTimes(timeStr: string): [string, string] {
  // Try to match "18:00 - 21:00" or "18:00-21:00"
  const match = timeStr.match(/(\d{1,2}:\d{2})\s*[-~～至]\s*(\d{1,2}:\d{2})/);
  if (match) {
    return [match[1], match[2]];
  }
  // Fallback defaults
  return ["12:00", "14:00"];
}

function formatDateForGCal(dateStr: string, timeStr: string): string {
  // dateStr: "2026-08-15"
  // timeStr: "18:00"
  const dateParts = dateStr.split("-");
  const timeParts = timeStr.split(":");

  const year = dateParts[0].padStart(4, "0");
  const month = dateParts[1].padStart(2, "0");
  const day = dateParts[2].padStart(2, "0");

  const hour = timeParts[0].padStart(2, "0");
  const minute = (timeParts[1] || "00").padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}00`;
}

export function formatChineseWeekday(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `週${weekdays[date.getDay()]}`;
}
