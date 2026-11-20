import { describe, it, expect, vi, afterEach } from 'vitest';
import { portalRequest, accountResource, PortalRequestError } from './descoPortalService';
import { buildAccountLinkPayload } from '../hooks/useAccounts';
describe('authenticated DESCO transport', () => {
 afterEach(() => vi.unstubAllGlobals());
 it('uses same-origin credentials and JSON requests', async () => {
  let request: any;
  vi.stubGlobal('fetch', async (url: string, options: any) => { request = {url, ...options}; return {ok:true, status:200, json:async()=>({authenticated:true})}; });
  await portalRequest('/login', {method:'POST',body:JSON.stringify({username:'u',password:'p'})});
  expect(request.url).toBe('/api/desco/login'); expect(request.credentials).toBe('same-origin');
 });
 it('does not add an empty optional meter number to a new account link', () => {
  expect(buildAccountLinkPayload({accountNo:'41348746', meterNo:''})).toEqual({accountNo:'41348746'});
 });
 it('resolves account numbers only through server membership', async () => {
  vi.stubGlobal('fetch', async (url: string) => ({ok:true,status:200,json:async()=>url.endsWith('/accounts')?[{accountId:'abc',accountNo:'123',meterNo:'456'}]:{balance:20}}));
  expect(await accountResource('123','balance')).toEqual({balance:20});
  await expect(accountResource('999','balance')).rejects.toThrow('linked');
 });
 it('routes transactions through the authenticated DESCO proxy', async () => {
  const urls: string[] = [];
  vi.stubGlobal('fetch', async (url: string) => {
   urls.push(url);
   return Response.json(url.endsWith('/accounts') ? [{accountId:'38118',accountNo:'41348746',meterNo:'030619009024'}] : []);
  });
  await accountResource('41348746', 'transactions', '?dateFrom=2026-05-14&dateTo=2026-11-15');
  expect(urls[1]).toBe('/api/desco/accounts/38118/transactions?dateFrom=2026-05-14&dateTo=2026-11-15');
 });
 it('explains when a static frontend serves HTML instead of the API', async () => {
  vi.stubGlobal('fetch', async () => new Response('<!DOCTYPE html>', {status:200,headers:{'Content-Type':'text/html'}}));
  await expect(portalRequest('/session')).rejects.toThrow('DESCO backend is unavailable');
 });
 it('keeps the HTTP status so a temporary outage does not erase a remembered login', async () => {
  vi.stubGlobal('fetch', async () => Response.json({error:'UPSTREAM_UNAVAILABLE'},{status:503}));
  await expect(portalRequest('/login')).rejects.toMatchObject({status:503});
  await expect(portalRequest('/login')).rejects.toBeInstanceOf(PortalRequestError);
 });
});
