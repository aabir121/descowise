import { useState, useEffect, useCallback, useRef } from 'react';
import { Account } from '../types';
import { listLinkedAccounts, portalRequest } from '../services/descoPortalService';
import { migrateLegacyAccounts, MigrationOutcome } from '../utils/accountMigration';
import { mergeLinkedAccounts } from '../utils/linkedAccountView';
const PREFS = 'desco_account_preferences';
const MIGRATION = 'desco_account_migration_v1';
const read = (key: string, fallback: any) => { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; } };
export const buildAccountLinkPayload = (account: Pick<Account, 'accountNo' | 'meterNo'>) => ({ accountNo: account.accountNo });
export const useAccounts = () => {
 const [accounts, setAccounts] = useState<Account[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState('');
 const [syncResults, setSyncResults] = useState<MigrationOutcome[] | null>(() => read(MIGRATION, {}).pendingReport || null);
 const initialized = useRef(false);
 const refresh = useCallback(async () => {
  const linked = await listLinkedAccounts();
  const server = await Promise.all(linked.map(async a => { try { const summary = await portalRequest(`/accounts/${encodeURIComponent(a.accountId)}/summary`); return {...summary,...a}; } catch { return a; } }));
  const prefs = read(PREFS, {});
  setAccounts(previous => mergeLinkedAccounts(server, prefs, previous));
  return server;
 }, []);
 const migrate = useCallback(async () => {
  setIsLoading(true);
  try {
   const server = await refresh();
   let state = read(MIGRATION, null);
   if (!state) {
    const legacy: Account[] = read('desco_accounts', []);
    state = {snapshot:legacy,outcomes:[]};
    const prefs = read(PREFS, {});
    legacy.forEach((a,i) => { prefs[a.accountNo] = {...prefs[a.accountNo],displayName:a.displayName,aiInsightsEnabled:a.aiInsightsEnabled,banglaEnabled:a.banglaEnabled,dateAdded:a.dateAdded,order:i}; });
    localStorage.setItem(PREFS, JSON.stringify(prefs));
    localStorage.setItem(MIGRATION, JSON.stringify(state));
   }
   const retry = state.snapshot.filter((a: Account) => !state.outcomes.some((o: MigrationOutcome) => o.accountNo===a.accountNo && ['linked','already-linked'].includes(o.status)));
   if (retry.length) {
    const results = await migrateLegacyAccounts(retry, server, a => portalRequest('/accounts/link',{method:'POST',body:JSON.stringify({accountNo:a.accountNo,meterNo:a.meterNo})}));
    state.outcomes = [...state.outcomes.filter((o: MigrationOutcome)=>!results.some(r=>r.accountNo===o.accountNo)),...results];
    state.pendingReport = state.outcomes;
    localStorage.setItem(MIGRATION, JSON.stringify(state));
    await refresh();
   }
  } finally {
   setIsLoading(false);
  }
 }, [refresh]);
 useEffect(() => { if(initialized.current) return; initialized.current=true; migrate().catch(e=>setError(e.message)); }, [migrate]);
 const savePreferences = useCallback((next: Account[]) => {
  const prefs = read(PREFS, {});
  next.forEach((a, order) => { prefs[a.accountNo] = {displayName:a.displayName,dateAdded:a.dateAdded,aiInsightsEnabled:a.aiInsightsEnabled,banglaEnabled:a.banglaEnabled,order}; });
  localStorage.setItem(PREFS, JSON.stringify(prefs));
 }, []);
 const addAccount = useCallback(async (a: Account) => {
  if (!a.accountId) await portalRequest('/accounts/link',{method:'POST',body:JSON.stringify(buildAccountLinkPayload(a))});
  savePreferences([...accounts,a]); await refresh();
 }, [accounts,refresh,savePreferences]);
 const deleteAccount = useCallback(async (accountNo: string) => {
  const account = accounts.find(a=>a.accountNo===accountNo);
  if (!account?.accountId) throw new Error('Account is not linked.');
  await portalRequest(`/accounts/${encodeURIComponent(account.accountId)}/link`,{method:'DELETE'}); await refresh();
 }, [accounts,refresh]);
 const updateAccount = useCallback((accountNo: string, data: Partial<Account>) => { setAccounts(prev=>{ const next=prev.map(a=>a.accountNo===accountNo?{...a,...data}:a); savePreferences(next); return next; }); }, [savePreferences]);
 const moveAccount = useCallback((from: number,to: number)=>{setAccounts(prev=>{if(from<0||to<0||from>=prev.length||to>=prev.length)return prev;const next=[...prev];next.splice(to,0,next.splice(from,1)[0]);savePreferences(next);return next;});},[savePreferences]);
 const dismissSyncResults = () => { const state=read(MIGRATION,{}); delete state.pendingReport; state.snapshot=(state.snapshot || []).filter((a:Account)=>!state.outcomes?.some((o:MigrationOutcome)=>o.accountNo===a.accountNo && ['linked','already-linked'].includes(o.status))); localStorage.removeItem('desco_accounts');localStorage.setItem(MIGRATION,JSON.stringify(state));setSyncResults(null); };
 const retryMigration = async () => { try { await migrate(); setSyncResults(read(MIGRATION,{}).pendingReport || null);setError(''); } catch(e) {setError((e as Error).message);} };
 return {accounts,addAccount,deleteAccount,updateAccount,moveAccount,error,isLoading,syncResults,dismissSyncResults,retryMigration};
};
