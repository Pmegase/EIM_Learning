import type { Event } from "@/types/events";

function formatICSDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeICS(str: string): string {
  return str.replace(/[\\;,\n]/g, (match) => {
    if (match === "\n") return "\\n";
    return `\\${match}`;
  });
}

export function generateICSFile(event: Event): string {
  const start = formatICSDate(event.start_date);
  const end = formatICSDate(event.end_date);
  const now = formatICSDate(new Date().toISOString());

  let location = "";
  if (event.event_type === "online" || event.event_type === "hybrid") {
    location = event.meeting_url || "Online";
  }
  if (event.event_type === "in-person" || event.event_type === "hybrid") {
    const parts = [event.venue_name, event.address, event.city, event.country].filter(Boolean);
    location = parts.join(", ");
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EIM Consult//Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `DTSTAMP:${now}`,
    `UID:${event.id}@eimconsult.com`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.short_description || event.description.replace(/<[^>]*>/g, "").slice(0, 200))}`,
    `LOCATION:${escapeICS(location)}`,
    event.meeting_url ? `URL:${event.meeting_url}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function downloadICS(event: Event) {
  const content = generateICSFile(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.slug}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(event: Event): string {
  const start = formatICSDate(event.start_date);
  const end = formatICSDate(event.end_date);
  const details = event.short_description || event.description.replace(/<[^>]*>/g, "").slice(0, 200);

  let location = "";
  if (event.venue_name) location += event.venue_name;
  if (event.address) location += (location ? ", " : "") + event.address;
  if (event.meeting_url) location += (location ? " / " : "") + event.meeting_url;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(event: Event): string {
  const start = new Date(event.start_date).toISOString();
  const end = new Date(event.end_date).toISOString();
  const body = event.short_description || event.description.replace(/<[^>]*>/g, "").slice(0, 200);

  let location = "";
  if (event.venue_name) location += event.venue_name;
  if (event.address) location += (location ? ", " : "") + event.address;

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: start,
    enddt: end,
    body,
    location,
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}
