import { it, expect } from 'vitest';
import { migrateLegacyAccounts } from './accountMigration';
it('keeps failed and ineligible legacy accounts available for retry', async () => {
 const legacy = [{accountNo:'1',meterNo:'2'},{accountNo:'3',meterNo:''},{accountNo:'4',meterNo:'5'}];
 const outcomes = await migrateLegacyAccounts(legacy, [], async (a) => { if(a.accountNo==='4') throw new Error('Try again'); });
 expect(outcomes.map(o=>o.status)).toEqual(['linked','missing-meter','failed']);
});
