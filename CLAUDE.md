# Unsub for Gmail — Project Conventions

## Stack
- **Manifest V3** Chrome extension, no build step
- **Vanilla JS (ES modules)** + HTML + CSS
- **Gmail REST API only** — never scrape Gmail DOM
- Auth via `chrome.identity.launchWebAuthFlow` (Web OAuth client)

## File layout
```
background/service-worker.js   — message router, API calls, auth
sidepanel/panel.{html,js,css}  — all UI
lib/auth.js                    — OAuth flow + token storage
lib/gmail-api.js               — Gmail REST wrappers (list, get, send)
lib/scanner.js                 — scan + group senders
lib/unsubscriber.js            — one-click POST / mailto / manual logic
lib/utils.js                   — header parsing, backoff helpers
config.js                      — CLIENT_ID (gitignored)
config.example.js              — placeholder (committed)
```

## Secrets
- `config.js` is in `.gitignore` — never commit it
- Tokens live in `chrome.storage.local` only, never `localStorage`

## Communication
- Panel → Service Worker: `chrome.runtime.sendMessage({ type: '...' })`
- Service Worker → Panel: `chrome.runtime.sendMessage({ type: '...' })` (push)
- Message types: `LOGIN`, `LOGOUT`, `GET_STATUS`, `SCAN`, `ABORT_SCAN`,
  `UNSUBSCRIBE`, `SCAN_PROGRESS`, `SCAN_DONE`, `SCAN_ERROR`,
  `UNSUBSCRIBE_PROGRESS`, `UNSUBSCRIBE_DONE`

## Gmail API
- Scopes: `gmail.readonly`, `gmail.send` (+ `gmail.modify` for optional archive phase)
- Concurrency limit: 10 parallel `messages.get` requests
- Backoff on 429: 1s → 2s → 4s → … max 30s
- On 401: clear token, re-authenticate, retry once
- On 403: surface "insufficient permissions" to user

## Guardrails
- Never execute bulk action without explicit confirmation modal
- Log all significant steps with `[SW]` or `[Panel]` prefix for easy DevTools filtering
- Surface all API errors with readable Slovak messages in the UI
- `host_permissions: ["<all_urls>"]` is intentional — needed for POST to arbitrary unsub endpoints
