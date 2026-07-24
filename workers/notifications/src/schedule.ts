import { DateTime, IANAZone } from 'luxon';

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validTimezone(timezone: string): boolean {
  return typeof timezone === 'string' && timezone.length <= 100 && IANAZone.isValidZone(timezone);
}

export function validLocalTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** Returns the next daily wall-clock occurrence as UTC, retaining IANA DST rules. */
export function nextSendAt(localTime: string, timezone: string, from: DateTime = DateTime.utc()): string {
  if (!validLocalTime(localTime) || !validTimezone(timezone)) throw new Error('Invalid schedule');
  const [hour, minute] = localTime.split(':').map(Number);
  const localNow = from.setZone(timezone);
  let candidate = DateTime.fromObject(
    { year: localNow.year, month: localNow.month, day: localNow.day, hour, minute, second: 0, millisecond: 0 },
    { zone: timezone },
  );
  // Luxon marks nonexistent local times invalid; avoid silently scheduling a wrong instant.
  if (!candidate.isValid) throw new Error('This local time does not exist on the selected date');
  if (candidate <= localNow) candidate = candidate.plus({ days: 1 });
  return candidate.toUTC().toISO({ suppressMilliseconds: true })!;
}

export function retryAt(attemptCount: number, now = DateTime.utc()): string {
  const minutes = Math.min(60, 5 * 2 ** Math.min(attemptCount, 3));
  return now.plus({ minutes }).toISO({ suppressMilliseconds: true })!;
}
