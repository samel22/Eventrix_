function escapeCalendarText(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldCalendarLine(line) {
  const encoder = new TextEncoder();
  let folded = "";
  let current = "";
  let byteLength = 0;

  for (const character of line) {
    const characterLength = encoder.encode(character).length;
    if (byteLength + characterLength > 75) {
      folded += `${current}\r\n `;
      current = character;
      byteLength = 1 + characterLength;
    } else {
      current += character;
      byteLength += characterLength;
    }
  }

  return folded + current;
}

function toCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function downloadCalendar(event) {
  const start = new Date(event.date);
  if (Number.isNaN(start.getTime())) {
    throw new Error("This event has an invalid date and cannot be added to your calendar.");
  }

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Eventrix//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeCalendarText(event._id || `${start.getTime()}@eventrix`)}`,
    `DTSTAMP:${toCalendarDate(new Date())}`,
    `DTSTART:${toCalendarDate(start)}`,
    `DTEND:${toCalendarDate(end)}`,
    `SUMMARY:${escapeCalendarText(event.title)}`,
    `LOCATION:${escapeCalendarText(event.venue)}`,
    `DESCRIPTION:${escapeCalendarText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].map(foldCalendarLine).join("\r\n");
  const file = new Blob([`${content}\r\n`], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `eventrix-${event._id || "event"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadQrCode(svgId, filename) {
  const svg = document.getElementById(svgId);
  if (!(svg instanceof SVGSVGElement)) {
    throw new Error("The QR ticket is not ready to download yet.");
  }

  const file = new Blob(
    [new XMLSerializer().serializeToString(svg)],
    { type: "image/svg+xml;charset=utf-8" }
  );
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
