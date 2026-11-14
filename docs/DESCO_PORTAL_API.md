# DESCO portal API notes for DescoWise

This is a local, use-case-focused digest of the [unofficial DESCO prepaid API reference](https://github.com/bixbd/desco-prepaid-api) at `main` tree `a45d8482bd34d263a92706d6ba516baba8795a79`, plus our own portal checks on 2026-11-14. The reference is not DESCO documentation. Do not commit credentials, cookies, raw HARs, account identifiers, balances, or unredacted responses.

**Base URL:** `https://prepaid.desco.org.bd/api`

## Evidence levels

- **Live verified:** exercised with the owner's DESCO login from a local process; CSRF, login, accounts, and balance were also exercised from a temporary Cloudflare remote development Worker. Cookies and credentials remained in process memory.
- **HAR observed:** successful browser requests in the user's sanitized HAR; request cookies were omitted from that export.
- **Bundle inspected:** route and request shape found in the public portal JavaScript bundle `assets/index-niBlboOT.js`; no mutation test unless separately marked.
- **Reference only:** described by the unofficial repository; not independently tested here.

## Authentication and request rules

1. `GET /auth/csrf` returns `204` and sets `XSRF-TOKEN`.
2. URL-decode that cookie's value and send it as `X-XSRF-TOKEN` on non-GET requests. Send the cookie as well.
3. `POST /auth/login` with `Content-Type: application/json` and `{"username":"…","password":"…"}` returns `200` and sets `DESCO_SESSION` when credentials are valid.
4. Keep `XSRF-TOKEN` and `DESCO_SESSION` in the same cookie jar for account requests. Use `Accept: application/json`. The browser frontend uses `credentials: "include"`.
5. `GET /auth/session` reports `authenticated`, `userId`, and `mustChangePassword`. A protected `401` with `AUTHENTICATION_REQUIRED` means the session cannot be used; do one bounded re-login.

Authentication is cookie-based. The observed browser requests had no bearer `Authorization` header. A live login on 2026-11-14 set `DESCO_SESSION` with a 43,200-second (12-hour) lifetime; a subsequent `/auth/session` call did not renew that cookie. The public portal bundle exposes no refresh route. DescoWise restores the encrypted app session automatically while the DESCO session remains valid. With the user's explicit "Don't want to see this page again?" opt-in, the browser stores AES-GCM ciphertext of the login in localStorage and a non-extractable key in IndexedDB so it can sign in again after DESCO expires the session. This protects against casual localStorage inspection but does not protect against malicious code running on the same origin or someone using the unlocked browser profile. Plaintext passwords and DESCO session cookies must stay out of localStorage, D1, source, command arguments, logs, and notification payloads.

| Route | Purpose | Evidence |
| --- | --- | --- |
| `GET /auth/csrf` | Establish CSRF cookie | Live verified |
| `POST /auth/login` | Create DESCO session | Live verified |
| `GET /auth/session` | Check session | Live verified |
| `POST /auth/logout` | End session | Bundle inspected |

## Linked accounts and balances

`GET /accounts` returns an `accounts` array and link-limit metadata: `linkedAccountCount`, `linkedAccountLimit`, `remainingAccountSlots`, `canAddAccount`, `isAboveCurrentLimit`. Account items include `accountId`, `sourceSystem`, `accountNo`, `meterNo`, `status`, and `linkStatus`. The integer `accountId` is the path identifier for all account-specific routes; it is **not** the electricity account or meter number. Never guess IDs or use one user's ID under another session.

| Route | Input | Result / use | Evidence |
| --- | --- | --- | --- |
| `GET /accounts` | Session cookies | Linked account list | Live verified |
| `POST /accounts/link` | JSON `{"accountNo":"…","meterNo":"…"}` plus CSRF header | `201`, linked account object | Live verified |
| `DELETE /accounts/{accountId}/link` | CSRF header and cookies | `204`; account disappears from `/accounts` | Live verified |
| `GET /accounts/{accountId}/balance` | Linked ID | Direct JSON balance object | Live verified |
| `GET /accounts/{accountId}/summary` | Linked ID | Dashboard summary | HAR observed |
| `GET /accounts/realtime-balance` | Session cookies | Eligibility and last realtime results | HAR observed / reference only |

The live unlink/relink check operated on the single account already linked to the owner's login. After `DELETE`, `/accounts` contained zero accounts. `POST /accounts/link` with the same account and meter numbers restored one linked account, and the returned `accountId` matched the prior ID. This does not establish that any arbitrary subscriber's account can or should be linked.

The daily balance response directly contains `accountNo`, `meterNo`, numeric or nullable `balance`, `meterType`, `currency`, `balanceSnapshotAt`, `timestampSource`, `timestampAvailable`, `stale`, `consumerMessages`, `currentMonthConsumedTaka`, and `readingTime`. It does **not** use the legacy `{code,desc,data}` wrapper. Treat it as a daily snapshot; a recharge can precede its update. Never interpret missing, stale, or unavailable balance as zero. For push, require a finite numeric balance and review `stale`, `timestampAvailable`, and snapshot time.

## Other current account routes

The portal bundle identifies the following routes; the sanitized HAR observed successful GETs for most of them. Their full response schemas have not been independently validated for DescoWise adapters.

| Route | Query/body | Evidence |
| --- | --- | --- |
| `GET /accounts/{accountId}/usage/daily` | `dateFrom`, `dateTo` as `YYYY-MM-DD` | HAR observed |
| `GET /accounts/{accountId}/usage/monthly` | `monthFrom`, `monthTo` as `YYYY-MM` | HAR observed |
| `GET /accounts/{accountId}/transactions` | `dateFrom`, `dateTo` | HAR observed |
| `GET /accounts/{accountId}/tokens` | `dateFrom`, `dateTo` | HAR observed |
| `GET /accounts/{accountId}/consumption-comparison` | `year`, optional `endMonth` | HAR observed / bundle inspected |
| `GET /accounts/{accountId}/energy-vs-consumed-taka` | `monthFrom`, `monthTo` | HAR observed |
| `GET /accounts/{accountId}/contact-office` | None | HAR observed |
| `GET /accounts/{accountId}/token-resend/eligibility` | None | HAR observed |
| `POST /accounts/{accountId}/token-resend` | `meterNos`, `idempotencyKey` plus CSRF | Bundle inspected; do not use for balance checks |
| `GET /accounts/{accountId}/token-resend/{requestId}` | URL-encoded request ID | Bundle inspected |
| `GET /profile` | None | HAR observed |

### Realtime reading

The reference documents `GET /accounts/realtime-balance` as returning `enabled` and per-meter eligibility/status. `POST /accounts/{accountId}/realtime-balance` takes `{"idempotencyKey":"<UUID>"}` plus CSRF; `GET /accounts/{accountId}/realtime-balance/{requestId}` polls a pending request. The reference says the frontend polls every two seconds for up to 60 seconds. These mutation and polling routes were source-inspected, not live-tested. Respect `DAILY_LIMIT_REACHED`, `COOLDOWN_ACTIVE`, `OFFLINE`, `TIMEOUT`, `UPSTREAM_FAILURE`, and `UNAVAILABLE`. Scheduled notifications should use the daily balance GET, not request live readings.

## Legacy API, retained for migration context

The repository's [legacy API document](https://github.com/bixbd/desco-prepaid-api/blob/main/docs/legacy-api.md) describes older unauthenticated GET routes under both `/unified/customer` and `/tkdes/customer`. Anonymous access and continued availability are **unverified now**; DescoWise currently calls these and they should be replaced.

| Old route suffix | Inputs | Old response `data` |
| --- | --- | --- |
| `/getBalance` | `accountNo`, optional `meterNo` | Balance, meter, current-month consumption, reading time |
| `/getCustomerInfo` | `accountNo` | Customer and installation details, including private fields |
| `/getCustomerDailyConsumption` | `accountNo`, `dateFrom`, `dateTo` | Daily unit/cost records |
| `/getCustomerMonthlyConsumption` | `accountNo`, `monthFrom`, `monthTo` | Monthly unit/cost records |
| `/getRechargeHistory` | `accountNo`, `dateFrom`, `dateTo` | Recharge and charge records |

The old wrapper was `{ "code": 200, "desc": "OK", "data": ... }`, with `16001` documented for an account not found on a meter type. Old clients tried `unified` then `tkdes` when data was missing. The new linked-account API uses one route family and direct JSON objects. Date formats remain `YYYY-MM-DD` for daily/recharge ranges and `YYYY-MM` for monthly ranges.

## Implementation consequences

- For app membership, use only `GET /accounts`. Keep localStorage for display names, order, language, and AI preferences keyed by `accountNo`.
- One-time migration needs both `accountNo` and `meterNo` from legacy records to call `/accounts/link`; handle missing meter numbers and link-limit errors as retryable rows.
- Link and unlink are DESCO account mutations. Never unlink a preexisting link as part of a temporary check; only unlink links the Worker itself created, and restore them on failure.
- Current initial deployment is single-owner. Device registration alone does not prove ownership of an electricity account; validate watch rules against the owner's linked DESCO account list.
- Check HTTP status before parsing response shape. A `401` requires reauthentication; `400`, `409`, `422`, or link-limit errors should not trigger blind retries.

## Source references

- [Current unofficial reference](https://github.com/bixbd/desco-prepaid-api/blob/main/README.md)
- [Historical API reference](https://github.com/bixbd/desco-prepaid-api/blob/main/docs/legacy-api.md)
- [In-memory Python example](https://github.com/bixbd/desco-prepaid-api/blob/main/examples/balance.py)
- [Privacy guidance](https://github.com/bixbd/desco-prepaid-api/blob/main/PRIVACY.md)
