import { describe, expect, it } from 'vitest';
import { getAccountListState } from './accountLoading';

describe('account list loading state', () => {
 it('does not show the empty state while accounts are loading', () => {
  expect(getAccountListState(true, [])).toBe('loading');
 });

 it('shows empty only after loading completes with no accounts', () => {
  expect(getAccountListState(false, [])).toBe('empty');
 });

 it('shows ready when loading completes with accounts', () => {
  expect(getAccountListState(false, [{accountNo:'123'}])).toBe('ready');
 });
});
