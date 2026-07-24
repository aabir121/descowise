# Background Web Push

DescoWise now uses Web Push for scheduled reminders. The React app only enrols a device and saves a final, non-sensitive reminder payload; Cloudflare D1 stores subscriptions and schedules, and the Cloudflare Worker cron sends due encrypted push payloads. The browser push service wakes `/sw.js`, which displays the OS notification even with no app tab open. Gemini keys never leave browser storage.

## What changed

The previous system registered the handwritten `public/sw.js` in `index.tsx`, but its daily `NotificationScheduler` used a one-minute `setInterval`, localStorage, live account data, and foreground `showNotification()` / `Notification`. It therefore could not run after the page closed. The worker already had basic `push` and `notificationclick` handlers; they have been hardened for malformed payloads and same-origin navigation.

This project does not use `vite-plugin-pwa` or Workbox. It uses one custom service worker with scope `/`. Its manifest is `public/manifest.json`. The old deployment guide targets Vercel; the new notification API requires a Cloudflare Worker and D1. HTTPS is required in production; verify the deployed frontend URL before enabling push.

## Configuration

1. Create a D1 database, update `workers/notifications/wrangler.toml` with its ID and your frontend `ALLOWED_ORIGIN`.
2. Generate VAPID keys with a trusted Web Push key generator. Put the public key in `VAPID_PUBLIC_KEY`; do not put the private key in a frontend env file.
3. Set the private key: `npx wrangler secret put VAPID_PRIVATE_KEY --config workers/notifications/wrangler.toml`.
4. Copy `.env.example` to `.env.local`, setting `VITE_PUSH_API_BASE_URL` to the deployed Worker (or proxy `/api` through the frontend origin). Set `VITE_VAPID_PUBLIC_KEY` only if you do not use `/api/push/config`.

## Local development

```bash
npm install
cp workers/notifications/.dev.vars.example workers/notifications/.dev.vars
npx wrangler d1 create descowise-notifications
# paste its database_id into workers/notifications/wrangler.toml
npm run worker:migrate:local
npm run worker:dev
npm run dev
```

`localhost` is treated as secure by some browsers, but real Push delivery and iOS behaviour differ. For final testing, deploy a Cloudflare development Worker over HTTPS, set the matching frontend origin, and use that URL.

## Deploy

```bash
npm run build
npm run worker:migrate
npx wrangler secret put VAPID_PRIVATE_KEY --config workers/notifications/wrangler.toml
npm run worker:deploy
```

Deploy the Vite build to Cloudflare Pages (or another HTTPS host) and set `VITE_PUSH_API_BASE_URL` at build time. Use a same-origin Worker route or set the Worker `ALLOWED_ORIGIN` exactly to the frontend origin.

## Manual verification

1. Open the HTTPS app; on iOS install it from Safari's Share → Add to Home Screen first.
2. Open Notifications, click **Enable notifications**, and allow permission.
3. Confirm `push_subscriptions` and the `daily-reminder` row in D1.
4. Click **Send test notification**, close the tab/PWA, and repeat the test from a permitted administrative workflow or curl with the device secret only for development.
5. Set a time a few minutes away, close the app, and wait for the 15-minute cron window.
6. Click the notification and confirm it opens `/` (or its configured same-origin target).
7. Click **Disable notifications**; the subscription and its cascading reminders are removed.

## Limits and risks

Operating systems, browser battery policies, and Focus/Do Not Disturb may delay or suppress delivery. iOS/iPadOS supports Web Push only for installed Home Screen web apps. Safari versions and browsers without Push API show an unsupported state. Cron precision is up to 15 minutes, and Cloudflare can invoke cron late; due records are atomically claimed to avoid duplicate sends. Provider 404/410 responses delete stale subscriptions; transient failures retry with bounded backoff.

The Worker logs IDs and statuses only, never keys, Gemini credentials, or notification body text. The `POST /api/push/test` endpoint requires the device secret plus a per-device rate limit; it cannot target an arbitrary existing subscription.
