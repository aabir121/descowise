export interface MigrationOutcome { accountNo: string; meterNo: string; status: 'linked' | 'already-linked' | 'missing-meter' | 'failed'; message?: string }
export async function migrateLegacyAccounts(legacy: Array<{accountNo:string;meterNo:string}>, server: Array<{accountNo:string}>, link: (account: {accountNo:string;meterNo:string}) => Promise<unknown>): Promise<MigrationOutcome[]> {
 const outcomes: MigrationOutcome[] = [];
 for (const account of legacy) {
  if (server.some(a => a.accountNo === account.accountNo)) outcomes.push({...account,status:'already-linked'});
  else if (!account.meterNo) outcomes.push({...account,status:'missing-meter',message:'Add this account with its meter number to finish syncing.'});
  else { try { await link(account); outcomes.push({...account,status:'linked'}); } catch(error) { outcomes.push({...account,status:'failed',message:error instanceof Error ? error.message : 'Please retry.'}); } }
 }
 return outcomes;
}
