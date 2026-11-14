# Authenticated DESCO integration design

## Intent

Restore the current DescoWise app after DESCO retired the account-number APIs. Existing users should sign in to DESCO, import their locally saved accounts into their DESCO-linked account list once, and thereafter use only DESCO-linked accounts as the source of account membership. Keep display names and other presentation preferences on the device. Then restore server-side low-balance push checks.

## Verified API contract

A live, in-memory check on 2026-11-14 succeeded: `GET /api/auth/csrf` (204, `XSRF-TOKEN` cookie), `POST /api/auth/login` with JSON `{username,password}`, cookies and `X-XSRF-TOKEN` (200, `DESCO_SESSION` cookie), `GET /api/auth/session` (200), `GET /api/accounts` (200), and `GET /api/accounts/{accountId}/balance` (200). A temporary `wrangler dev --remote` Worker independently completed CSRF → login → accounts → balance with statuses 204/200/200/200, one linked account, and a numeric non-stale balance. The Worker and test source were stopped and removed; credentials and cookies were not persisted. The live account link/unlink test returned `DELETE /api/accounts/{accountId}/link` 204 and `POST /api/accounts/link` with `{accountNo,meterNo}` 201; the original account reappeared with the same ID. `accountId` is distinct from `accountNo`. Successful payloads have no old `code/data` wrapper. See `docs/DESCO_PORTAL_API.md` for the full local integration reference.

## Decisions and constraints

- The frontend must not store a plaintext DESCO password or session in localStorage. Phase 1 uses same-origin Cloudflare Pages Functions under `/api/desco`; an encrypted, HttpOnly browser cookie holds the DESCO session cookies. The Functions require a `DESCO_SESSION_KEY` secret binding. Users may explicitly opt in to encrypted local credential storage for automatic re-login after DESCO's 12-hour session expires; sign-out removes it. Direct cross-origin cookie requests are unreliable.
- The account list returned by DESCO owns membership. Local storage keeps only account-number keyed display name, sort order, AI and language preferences, and one-time migration state.
- On initial login, snapshot legacy local accounts and automatically link eligible, owned accounts through DESCO's supported flow. On the next app open, show a one-time sync-results dialog listing linked, already-linked, and failed accounts. Keep unresolved local records for retry; never silently discard them.
- Account deletion in the app needs explicit semantics: unlink from DESCO or only hide locally. Until decided, do not make a destructive unlink action implicit.
- For push, a watch rule must be bound to an authenticated DESCO identity and a linked `accountId`; a device secret alone does not prove ownership of an arbitrary account number.
- The supplied `DESCO_USER` and `DESCO_PASS` were used only for the live shell check. Do not copy them into source, plans, logs, D1, or frontend environment variables.
- Initial deployment scope is single-owner: only the owner of the supplied DESCO account may register watched electricity accounts. Reject other subscriber accounts until a per-user authentication design is built.

## Approaches

1. **Backend-mediated DESCO session (selected for phase 1):** Same-origin Pages Functions sign users in, seal DESCO session cookies into an HttpOnly browser cookie, and serve a narrow account API. The separate notification Worker will implement cron checks in phase 2.
2. **Frontend-only DESCO login:** smaller backend change, but DESCO's cookies and CORS are unlikely to work across origins, and closed-app push still needs server credentials. Reject for this goal.
3. **One shared DESCO login for all subscribers:** simple operationally, but linking another subscriber's account to the owner's DESCO login changes account access and the current device registration does not prove consent or ownership. Do not build without a defined, authorized single-owner scope.

## Open decisions before implementation

- What does DESCO require to link an account, and should a user confirm each link in the official portal? Verify with a disposable, owned account before implementing migration.
- Should removing an account from DescoWise unlink it at DESCO, or only stop displaying and monitoring it?
