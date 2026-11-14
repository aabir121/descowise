import { expect, it } from 'vitest';
import { decryptRememberedLogin, encryptRememberedLogin } from './descoRememberedLogin';

it('encrypts a DESCO login without putting credentials in the stored payload', async () => {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const credentials = { username: 'test-user', password: 'test-password' };
  const payload = await encryptRememberedLogin(key, credentials);

  expect(key.extractable).toBe(false);
  expect(payload).not.toContain(credentials.username);
  expect(payload).not.toContain(credentials.password);
  expect(await decryptRememberedLogin(key, payload)).toEqual(credentials);
});

it('rejects a modified encrypted login', async () => {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const payload = JSON.parse(await encryptRememberedLogin(key, { username: 'u', password: 'p' }));
  payload.data = `${payload.data.slice(0, -2)}AA`;
  await expect(decryptRememberedLogin(key, JSON.stringify(payload))).rejects.toThrow();
});
