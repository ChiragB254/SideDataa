/** "2 November 2026" from an ISO date or date-time. Uses the calendar date as written (Toronto). */
export function formatDate(iso: string): string {
  const [y = 1970, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** RFC 822 date for RSS, e.g. "Mon, 02 Nov 2026 00:00:00 -0500". Uses the same Toronto-midnight rule as JSON-LD. */
export function rfc822(isoWithOffset: string): string {
  const d = new Date(isoWithOffset);
  const m = /([+-])(\d{2}):(\d{2})$/.exec(isoWithOffset);
  const offsetMin = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  const local = new Date(d.getTime() + offsetMin * 60000);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const p = (n: number) => String(n).padStart(2, "0");
  const sign = offsetMin < 0 ? "-" : "+";
  const abs = Math.abs(offsetMin);
  return `${days[local.getUTCDay()] ?? ""}, ${p(local.getUTCDate())} ${months[local.getUTCMonth()] ?? ""} ${local.getUTCFullYear()} ${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())} ${sign}${p(Math.floor(abs / 60))}${p(abs % 60)}`;
}
