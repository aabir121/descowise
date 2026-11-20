import { expect, it } from 'vitest';
import { mergeLinkedAccounts } from './linkedAccountView';
import type { Account } from '../types';

it('keeps a fetched card balance when the same linked accounts refresh', () => {
  const linked = [{ accountId: '7', accountNo: '12345', meterNo: '67890', customerName: 'Customer' }];
  const previous = [{ accountId: '7', accountNo: '12345', meterNo: '67890', balance: 450.25, readingTime: '2026-11-14T12:00:00Z' }] as Account[];
  const result = mergeLinkedAccounts(linked, {}, previous);
  expect(result[0].balance).toBe(450.25);
  expect(result[0].readingTime).toBe('2026-11-14T12:00:00Z');
  expect(result[0].customerName).toBe('Customer');
});

it('does not carry a balance to a different linked account', () => {
  const previous = [{ accountId: '7', accountNo: '12345', meterNo: '67890', balance: 450.25 }] as Account[];
  const result = mergeLinkedAccounts([{ accountId: '8', accountNo: '54321', meterNo: '09876' }], {}, previous);
  expect(result[0].balance).toBeUndefined();
});
