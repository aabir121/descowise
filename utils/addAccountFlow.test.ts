import { describe, expect, it } from 'vitest';
import { createAccountToSave } from './addAccountFlow';

describe('add account form flow', () => {
 it('creates an account with an optional trimmed display name', () => {
  const account = createAccountToSave({
   accountNo: '41348746',
   customerName: 'Customer',
   contactNo: '',
   feederName: '',
   installationAddress: '',
   meterNo: '',
   tariffSolution: '',
   sanctionLoad: '',
  }, '  Home  ', false, true);

  expect(account).toMatchObject({accountNo:'41348746', displayName:'Home', aiInsightsEnabled:false, banglaEnabled:true});
  expect(account.dateAdded).toEqual(expect.any(String));
 });

 it('stores no display name when the optional field is blank', () => {
  expect(createAccountToSave({accountNo:'41348746'} as any, '   ', true, false).displayName).toBeNull();
 });
});
