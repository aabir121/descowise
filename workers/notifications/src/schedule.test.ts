import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { nextSendAt, validLocalTime, validTimezone } from './schedule';

describe('notification scheduling', () => {
  it('validates IANA zones and daily local time', () => {
    expect(validTimezone('Asia/Dhaka')).toBe(true);
    expect(validTimezone('UTC+6')).toBe(false);
    expect(validLocalTime('09:30')).toBe(true);
    expect(validLocalTime('24:00')).toBe(false);
  });

  it('calculates the next occurrence in UTC', () => {
    expect(nextSendAt('09:00', 'Asia/Dhaka', DateTime.fromISO('2026-07-25T02:00:00Z'))).toBe('2026-07-25T03:00:00Z');
    expect(nextSendAt('09:00', 'Asia/Dhaka', DateTime.fromISO('2026-07-25T04:01:00Z'))).toBe('2026-07-26T03:00:00Z');
  });
});
