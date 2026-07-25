/** Today's date (YYYY-MM-DD) in a given IANA timezone — mirrors daily_plans.plan_date's computation. */
export function todayInTimezone(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // en-CA formats as YYYY-MM-DD directly.
    return formatter.format(new Date());
  } catch {
    // Invalid/unsupported timezone string — fall back to UTC rather than throw.
    return new Date().toISOString().slice(0, 10);
  }
}

/** Local hour (0-23) in a given IANA timezone, used for soft time-of-day nudges. */
export function currentHourInTimezone(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hourCycle: "h23",
    });
    return Number(formatter.format(new Date()));
  } catch {
    return new Date().getUTCHours();
  }
}
