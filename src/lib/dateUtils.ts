/**
 * Timezone utilities configured for Islamabad / Karachi (Asia/Karachi, UTC+5)
 */
export const APP_TIMEZONE = "Asia/Karachi";
export const TIMEZONE_LABEL = "PKT (Islamabad/Karachi, UTC+5)";
export const TIMEZONE_SHORT = "PKT";

/**
 * Get ISO datetime string converted to a Karachi/Islamabad YYYY-MM-DDTHH:mm string for datetime-local inputs
 */
export function getKarachiDateTimeLocal(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  let hour = getPart("hour");
  if (hour === "24") hour = "00";
  const minute = getPart("minute");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Get default schedule time (current Karachi time + minutesAhead) in YYYY-MM-DDTHH:mm format
 */
export function getDefaultScheduleTimeKarachi(minutesAhead: number = 5): string {
  const future = new Date(Date.now() + minutesAhead * 60 * 1000);
  return getKarachiDateTimeLocal(future);
}

/**
 * Convert a datetime-local value (which represents Karachi/Islamabad time) into a standard ISO UTC string
 */
export function parseKarachiInputToIso(datetimeLocalStr: string): string {
  if (!datetimeLocalStr) return new Date().toISOString();
  // If it doesn't contain timezone info, append +05:00 for Karachi/Islamabad
  if (
    !datetimeLocalStr.includes("Z") &&
    !datetimeLocalStr.includes("+") &&
    !datetimeLocalStr.slice(10).includes("-")
  ) {
    return new Date(`${datetimeLocalStr}:00+05:00`).toISOString();
  }
  return new Date(datetimeLocalStr).toISOString();
}

/**
 * Format an ISO date string in Karachi/Islamabad timezone (PKT)
 */
export function formatInKarachi(isoString: string): string {
  try {
    const date = new Date(isoString);
    const formatted = date.toLocaleString("en-US", {
      timeZone: APP_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${formatted} (${TIMEZONE_SHORT})`;
  } catch {
    return isoString;
  }
}

// Backward-compatible aliases
export const getUtc5DateTimeLocal = getKarachiDateTimeLocal;
export const getDefaultScheduleTimeUtc5 = getDefaultScheduleTimeKarachi;
export const parseUtc5InputToIso = parseKarachiInputToIso;
export const formatInUtc5 = formatInKarachi;
