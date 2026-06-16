# Unsub for Gmail

Chrome MV3 side-panel extension. Scans Gmail for newsletters and lets you bulk unsubscribe via RFC 8058 one-click POST, mailto, or manual link — with optional archive + filter.

---

## Current state (June 2026)

### What works
- **Two-pass scan**: Pass 1 fetches `List-Unsubscribe` header via metadata. Pass 2 scans HTML body of newsletter-like senders (heuristic regex) that have no header.
- **Unsubscribe chain**: one-click POST → mailto via Gmail API → opens URL in new tab
- **Archive**: after unsubscribing, batch-removes sender's emails from inbox (`batchModify`)
- **Filter**: creates a Gmail filter to skip inbox for future emails from sender
- **Persistent scan cache**: survives side panel close/reopen
- **Unsubscribe log**: per-account, persists across logout/login — shows "✓ Odhlásené [date]" badge
- **Scan merge**: rescanning keeps previously unsubscribed senders in list (even if emails were archived)
- **OAuth**: `chrome.identity.getAuthToken()` — no `client_secret`, Chrome manages tokens

### What's NOT done yet (before public release)
- [ ] **Chrome Web Store submission** — $5 one-time fee, 1–7 day review
- [ ] **Extension icons** — `manifest.json` needs `"icons"` (16, 48, 128px PNGs)
- [ ] **Privacy Policy** — required by Google for Gmail-scoped extensions; host on GitHub Pages or similar
- [ ] **OAuth consent screen** → publish (remove "Testing" status) — currently only Test Users can log in
- [ ] **Store listing assets** — screenshots (1280×800), short description, category

---

## Setup (new developer)

### 1. Google Cloud Console

1. Create project → enable **Gmail API**
2. **OAuth consent screen**: External, add required scopes (see list below), add test Gmail as Test user
3. **Credentials → Create OAuth client ID**:
   - Type: **Chrome App** (or "Chrome Extension")
   - Application ID: your Extension ID from `chrome://extensions` (load unpacked first to get it)
4. Copy the **Client ID** — no client secret for this type

### 2. Configure manifest

Open `manifest.json` and replace the `client_id`:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.settings.basic",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid"
  ]
}
```

### 3. Load extension

1. `chrome://extensions` → Developer mode ON → **Load unpacked** → select this folder
2. Click the extension icon → side panel opens → **Prihlásiť sa cez Google**

### 4. No config.js setup needed

`config.js` only contains `SCAN_LIMIT` and `CONCURRENCY_LIMIT` — no secrets, safe to commit.

---

## File structure

```
manifest.json               MV3 manifest — oauth2 scopes, permissions, side_panel
config.js                   SCAN_LIMIT, CONCURRENCY_LIMIT (no secrets)
config.example.js           Same as config.js (both safe to commit)

background/
  service-worker.js         Message router — LOGIN, LOGOUT, SCAN, UNSUBSCRIBE, GET_STATUS

lib/
  auth.js                   chrome.identity.getAuthToken() wrapper — login, logout, getToken
  gmail-api.js              Gmail REST wrappers — listMessageIds, getMessageMetadata,
                            getMessageFull, sendMessage, archiveMessages, createSkipInboxFilter
  scanner.js                Two-pass scan + sender grouping + @google.com filter
  unsubscriber.js           Unsubscribe chain: POST → mailto → manual tab
  utils.js                  parseListUnsubscribe, findBodyUnsubscribeUrl, pLimit, backoffDelay

sidepanel/
  panel.html                Side panel markup — onboarding, app, results, modals
  panel.js                  All UI state, rendering, event wiring
  panel.css                 Styles
```

---

## Architecture notes

### Auth flow
Uses `chrome.identity.getAuthToken({ interactive: true/false })`. Chrome handles token storage and refresh — we only store the user's email in `chrome.storage.local` under `auth_data`. On 401 from Gmail API, `invalidateToken()` calls `chrome.identity.removeCachedAuthToken()` and retries once.

### Storage keys
| Key | Contents |
|-----|----------|
| `auth_data` | `{ email }` |
| `scan_cache` | `{ senders: [...], scannedAt: timestamp }` — cleared on logout |
| `unsubscribed_log` | `{ "user@gmail.com": { "sender@x.com": { date, status, displayName } } }` — **persists across logout** |

### Scanner — two passes
1. **Pass 1 (metadata)**: fetches `From`, `List-Unsubscribe`, `List-Unsubscribe-Post`, `internalDate` for up to 1000 messages. Groups by sender. Senders with `@google.com` / `@googlemail.com` are skipped.
2. **Pass 2 (body)**: for senders that match the newsletter heuristic regex but have no `List-Unsubscribe` header, fetches full HTML body and uses regex to find unsubscribe link.

Newsletter heuristic regex (FROM address):
```
/newsletter|noreply|no-reply|promo|marketing|news@|updates@|deals@|offers@|
info@|notifications@|campaign|bulk|mailer|mailchimp|sendgrid|klaviyo|mailgun/i
```

### Scan merge
After each scan, new results are merged with the existing `scan_cache`. Previously unsubscribed senders not found in the new scan (e.g. because emails were archived) are kept from cache so the list never shrinks.

### Unsubscribe result statuses
| Status | Meaning |
|--------|---------|
| `success` | One-click POST returned 2xx |
| `email` | Unsubscribe mailto sent via Gmail |
| `manual` | Opened URL in new tab |
| `error` | All methods failed |

---

## Gmail API quota

- ~250 quota units/second per user
- `messages.get` = ~5 units → max ~50 requests/second
- Concurrency limit: 10 (configurable via `CONCURRENCY_LIMIT`)
- Backoff on 429: 1s → 2s → 4s → … max 30s

---

## Development tips

- **Service Worker logs**: `chrome://extensions` → extension card → **Service Worker** → Inspect → Console. Filter by `[SW]`.
- **Panel logs**: right-click side panel → Inspect → Console. Filter by `[Panel]`.
- No build step — edit files and click **Reload** on the extension card.
- After changing `manifest.json` (e.g. new permissions) you must reload the extension.
- After changing `manifest.json` OAuth scopes, existing cached tokens may need to be cleared: logout and log back in, or clear extension storage via DevTools → Application → Storage.

---

## Localization

UI is in Slovak. All user-facing strings are inline in `panel.html` and `panel.js`. Error messages from Gmail API are mapped to Slovak in `service-worker.js → friendlyError()`.
