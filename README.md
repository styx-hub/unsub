# Gmail Newsletter Unsubscriber

Chrome MV3 extension that scans your Gmail for newsletters and lets you bulk unsubscribe via RFC 8058 one-click POST or mailto fallback.

---

## Prerequisites — Google Cloud Console (do this first, manually)

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a new project.
2. **Enable APIs**: search for *Gmail API* and enable it.
3. **OAuth consent screen**:
   - User type: **External**
   - Publishing status: leave as **Testing**
   - Add your Gmail address as a **Test user**
4. **Credentials → Create OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: leave empty for now (you'll add it after loading the extension)
   - Click **Create** and copy the **Client ID**
5. Scopes needed (added via "Add or remove scopes"):
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`

---

## Installation

### 1. Set up config

```bash
cp config.example.js config.js
```

Edit `config.js` and replace `YOUR_CLIENT_ID` with your real Client ID from step 4 above.

### 2. Load the extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder (`unsub/`)
5. Note the **Extension ID** shown on the extension card (e.g. `abcdefghijklmnopqrstuvwxyz123456`)

### 3. Add redirect URI to Google Cloud

1. Go back to Google Cloud Console → Credentials → your OAuth client
2. Under **Authorized redirect URIs**, add:
   ```
   https://<YOUR_EXTENSION_ID>.chromiumapp.org/
   ```
   (replace `<YOUR_EXTENSION_ID>` with the ID from step 5)
3. Save

### 4. Use the extension

1. Click the extension icon in the Chrome toolbar
2. The side panel opens — click **Prihlásiť sa**
3. Complete the Google OAuth consent flow
4. Click **Skenovať schránku** to scan for newsletters
5. Select senders you want to unsubscribe from, then click **Odhlásiť vybrané**
6. Review the confirmation summary, then confirm

---

## How unsubscription works

| Method | When used |
|--------|-----------|
| 🟢 One-click POST | `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header + `https://` URL — silent, preferred (RFC 8058) |
| ✉️ Email | `mailto:` in `List-Unsubscribe` — sends an unsubscribe email via your Gmail |
| ⚠️ Manual | `https://` URL only, no one-click support — opens the URL in a new tab for you to complete manually |

---

## Development

No build step required. Edit files and reload the extension in `chrome://extensions`.

Check **Service Worker** logs: Extensions page → your extension → **Service Worker** → Inspect → Console.

Check panel logs: right-click the side panel → Inspect → Console.

---

## Gmail API Quota

- ~250 quota units/second per user
- `messages.get` = ~5 units → max ~50 requests/second
- The extension enforces a concurrency limit of 10 and backs off on 429 errors

---

## Optional: Archive + Filter (Phase 6)

After unsubscribing, you can optionally archive existing emails from a sender and/or create a Gmail filter to auto-archive future emails. This requires enabling additional scopes (`gmail.modify`, `gmail.settings.basic`) — see the toggle in the extension settings.
