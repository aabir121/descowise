# DESCO App Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore authenticated account viewing and migrate existing local accounts into DESCO-linked accounts once.

**Architecture:** Same-origin Cloudflare Pages Functions own DESCO cookie handling and expose a narrow authenticated API to the React app. DESCO provides account membership; localStorage provides device-specific labels, preferences, and unfinished migration state. The notification Worker is phase 2.

**Tech Stack:** React, TypeScript, Cloudflare Pages Functions, Vitest.

**Phase 1 implementation note (2026-11-14):** `/api/desco` Pages Functions, browser sign-in, linked-account membership, account data adapters, and one-time migration are implemented on `feat/desco-authenticated-notifications`. The Pages project needs a `DESCO_SESSION_KEY` secret before deployment. Use an interactive `npx wrangler pages secret put DESCO_SESSION_KEY --project-name descowise` command with a random 32-byte key; never place its value in shell arguments, source, or localStorage. The local Vite server alone does not serve Pages Functions. Phase 2 notifications remain separate.

**Spec:** `docs/superpowers/specs/2026-11-14-desco-auth-design.md`

## Global Constraints

- Do not store plaintext DESCO credentials or session cookies in browser localStorage, source, logs, or plaintext D1. Encrypted local credential storage requires the user's explicit opt-in and must be removed on sign-out.
- Resolve `accountNo` to `accountId` only from the signed-in user's `/api/accounts` response.
- Do not erase legacy local accounts until migration is confirmed or explicitly dismissed.

## Review Focus

- Expired session during account refresh: show sign-in and preserve local migration data.
- Duplicate local and linked account: display once and retain its local label.
- Failed account link: keep a retryable migration row and do not mark migration complete.
- Changed DESCO account membership: remove it from active app views without deleting local display preferences.
- Account number belonging to another user: never expose it through a shared Worker session.

---

### Task 1: Confirm account-link contract and Worker login

**Files:** Create `workers/notifications/src/descoClient.ts`; test `workers/notifications/src/descoClient.test.ts`.

- [x] Verify link and unlink with the owner's already-linked account: `DELETE /accounts/{accountId}/link` returned 204, then `POST /accounts/link` with `{accountNo,meterNo}` returned 201 and restored the same account ID. The API contract is in `docs/DESCO_PORTAL_API.md`.
- [x] Exercise CSRF → login → accounts → balance from a temporary Cloudflare remote development Worker using credentials in a one-time request; all steps returned success without persisting secrets. A production Worker still needs its credential and session lifecycle implemented.
- [ ] Implement a DESCO client with an in-memory cookie jar, URL-decoded CSRF header, explicit 401 handling, and account lookup scoped to the returned account list; test cookie and error behavior with mocked fetch.
- [ ] Commit the verified client and contract notes.

### Task 2: User authentication boundary

**Files:** Modify `workers/notifications/src/index.ts`; add a D1 migration for app identities and encrypted DESCO session material; create `services/descoPortalService.ts`.

- [ ] Implement the single-owner identity model for the initial deployment; reject watches and app sessions that cannot be tied to that owner.
- [ ] Add login, session-check and logout API routes with origin checks, rate limits, no-store responses, and encrypted server-side session handling; test cross-user isolation and failed login.
- [ ] Add frontend sign-in state and API client; test login, expired session, and logout without persisting passwords.
- [ ] Commit.

### Task 3: DESCO-linked accounts as the source of truth

**Files:** Modify `hooks/useAccounts.ts`, `types.ts`, `services/descoService.ts`, `components/AddAccountModal.tsx`, `App.tsx`; create `utils/accountPreferences.ts`.

- [ ] Replace the local account membership list with `/api/accounts`, keyed by DESCO `accountId` and `accountNo`; merge local labels, order and preferences by `accountNo`.
- [ ] Adapt balance, usage, recharge and summary calls to the new endpoint paths and response shapes; retain the old UI's expected view models in one adapter.
- [ ] Update add-account flow to use the verified DESCO link contract; decide delete semantics before changing delete behavior.
- [ ] Test one linked account, multiple accounts, missing data, stale balance, and 401; run `npm test` and `npm run build`.
- [ ] Commit.

### Task 4: One-time local account sync

**Files:** Create `components/AccountSyncDialog.tsx`, `services/accountMigration.ts`; modify `App.tsx` and `hooks/useAccounts.ts`.

- [ ] On initial login, snapshot legacy `desco_accounts` before any new hook can overwrite it; compare its account numbers with DESCO-linked accounts and automatically attempt eligible links through the signed-in account's supported link flow.
- [ ] Persist per-row outcomes; on the next app open, show a one-time sync-results dialog with linked, already-linked, and failed rows.
- [ ] Retain failed rows for retry and display them again until resolved or explicitly dismissed; keep name mapping locally.
- [ ] Test interrupted sync, duplicate accounts, partial failure, and relaunch; run `npm test` and `npm run build`.
- [ ] Commit.
