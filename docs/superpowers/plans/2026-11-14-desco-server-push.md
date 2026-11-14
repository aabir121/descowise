# DESCO Server Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Cloudflare Worker's scheduled low-balance push checks using authenticated DESCO account data.

**Architecture:** The existing 06:00 Asia/Dhaka cron and queue remain. Queue messages identify an authorized DESCO identity and linked account; the Worker authenticates or reuses a session, reads the balance, and delivers pushes to matching devices.

**Tech Stack:** Cloudflare Workers, Queues, D1, Web Push, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-desco-auth-design.md`

## Global Constraints

- Never use one user's DESCO credentials to link or read another user's account without a proven, authorized single-owner scope.
- Never write credentials, cookies, or raw DESCO responses to logs, push payloads, or plaintext D1.
- Preserve current threshold, daily deduplication, retry, and failed-attempt behavior.

## Review Focus

- 401 or expired cookie: one bounded re-login and retry, then a clear failure outcome.
- Account no longer linked: skip balance read and notify the subscriber to reconnect.
- Stale or unavailable balance: do not coerce it to zero or send a low-balance alert.
- Queue retry: do not duplicate a push already marked sent for that date.
- Multiple devices/users watching one account number: enforce identity isolation.

---

### Task 1: Bind watches to an authorized account

**Files:** Add D1 migration; modify `workers/notifications/src/index.ts`, `services/pushNotificationService.ts`.

- [ ] Add an owner identity and DESCO `accountId` to each watch rule; reject watch creation unless `/api/accounts` for that owner contains the account number and ID.
- [ ] Change queue messages from account number alone to owner plus account ID, and group fetches by that tuple.
- [ ] Test unauthorized watch, account reassignment, and distinct owners with the same account number.
- [ ] Commit.

### Task 2: Authenticated balance fetch and push

**Files:** Modify `workers/notifications/src/index.ts`; use `workers/notifications/src/descoClient.ts`; modify `workers/notifications/src/schedule.test.ts` or add a focused worker test.

- [ ] Replace the retired `/api/unified/customer/getBalance` call with `/api/accounts/{accountId}/balance` under the correct session.
- [ ] Reuse a valid session; on 401, perform one CSRF/login cycle and retry once. Validate balance, `stale`, `timestampAvailable`, and snapshot timestamp before threshold evaluation.
- [ ] Keep push delivery, attempt recording, and date deduplication; test success, session expiry, stale data, and retry.
- [ ] Run `npm test`, `npm run build`, and a development Worker check with an owned account.
- [ ] Commit.

### Task 3: Optional temporary link/unlink for an explicitly owned account

**Files:** Add a separate Worker module and focused tests only if the identity decision and DESCO link contract permit it.

- [ ] Restrict this path to account numbers the credential owner has explicitly authorized; reject all other subscriber accounts.
- [ ] Check whether already linked; if not, link through the verified DESCO flow, read balance, and unlink in `finally`, with an idempotent cleanup record for process interruption.
- [ ] Test pre-linked account (never unlink), link failure, balance failure, unlink failure, and queue retry.
- [ ] Prefer persistent linking when DESCO account limits and policy allow; use temporary linking only when its operational need is proven.
- [ ] Commit.
