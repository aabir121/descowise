import { describe, expect, it } from 'vitest';
import { urlBase64ToUint8Array } from './pushNotificationService';

describe('VAPID key conversion', () => {
  it('converts a URL-safe base64 value without requiring padding', () => {
    expect([...urlBase64ToUint8Array('AQID-_8')]).toEqual([1, 2, 3, 251, 255]);
  });
});
