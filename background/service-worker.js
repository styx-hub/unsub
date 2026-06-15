// Service worker — message router for auth, scan, and unsubscribe operations.

import { login, logout, getToken, getStoredEmail, refreshToken } from '../lib/auth.js';
import { scan, abortScan } from '../lib/scanner.js';
import { unsubscribeSender } from '../lib/unsubscriber.js';
import { listMessageIdsBySender, archiveMessages, createSkipInboxFilter } from '../lib/gmail-api.js';
import { sleep } from '../lib/utils.js';

// Open the side panel automatically when the toolbar icon is clicked (MV3 recommended approach).
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[SW] received message:', message.type);
  handleMessage(message).then(sendResponse).catch((err) => {
    console.error(`[SW] error handling ${message.type}:`, err);
    sendResponse({ error: err.message });
  });
  return true; // keep channel open for async response
});

async function handleMessage(message) {
  switch (message.type) {

    case 'GET_STATUS': {
      const token = await getToken();
      if (!token) return { loggedIn: false };
      const email = await getStoredEmail();
      return { loggedIn: true, email };
    }

    case 'LOGIN': {
      await login();
      const email = await getStoredEmail();
      console.log('[SW] logged in as:', email);
      return { email };
    }

    case 'LOGOUT': {
      await logout();
      return { ok: true };
    }

    case 'SCAN': {
      scan((progress) => {
        chrome.runtime.sendMessage({ type: 'SCAN_PROGRESS', ...progress }).catch(() => {});
      }).then((senders) => {
        if (senders === null) {
          chrome.runtime.sendMessage({ type: 'SCAN_ERROR', error: 'Skenovanie zrušené' }).catch(() => {});
        } else {
          chrome.runtime.sendMessage({ type: 'SCAN_DONE', senders }).catch(() => {});
        }
      }).catch((err) => {
        console.error('[SW] scan error:', err);
        const msg = friendlyError(err);
        chrome.runtime.sendMessage({ type: 'SCAN_ERROR', error: msg }).catch(() => {});
      });
      return { ok: true };
    }

    case 'ABORT_SCAN':
      abortScan();
      return { ok: true };

    case 'UNSUBSCRIBE': {
      const { senders, doArchive, doFilter } = message;
      const total = senders.length;

      (async () => {
        const results = [];

        for (let i = 0; i < senders.length; i++) {
          const sender = senders[i];
          const step = i + 1;

          pushProgress(Math.round((step / total) * 70),
            `Odhlasovanie ${step} / ${total}: ${sender.displayName || sender.email}`);

          const result = await unsubscribeSender(sender);
          results.push(result);

          // Small delay to avoid hammering servers
          if (i < senders.length - 1) await sleep(300);
        }

        // Phase 6: archive + filter for successfully unsubscribed senders
        if (doArchive || doFilter) {
          const succeeded = senders.filter((s, i) =>
            results[i]?.status === 'success' || results[i]?.status === 'email'
          );

          for (let i = 0; i < succeeded.length; i++) {
            const sender = succeeded[i];
            const resultIdx = results.findIndex(r => r.email === sender.email);

            if (doArchive) {
              pushProgress(70 + Math.round(((i + 1) / succeeded.length) * 20),
                `Archivujem maily od: ${sender.displayName || sender.email}`);
              try {
                const ids = await listMessageIdsBySender(sender.email);
                if (ids.length > 0) await archiveMessages(ids);
                if (resultIdx !== -1) results[resultIdx].archived = ids.length;
                console.log(`[SW] archived ${ids.length} messages from`, sender.email);
              } catch (err) {
                console.error('[SW] archive failed for', sender.email, err.message);
                if (resultIdx !== -1) results[resultIdx].archiveError = err.message;
              }
            }

            if (doFilter) {
              pushProgress(90 + Math.round(((i + 1) / succeeded.length) * 10),
                `Vytváram filter pre: ${sender.displayName || sender.email}`);
              try {
                await createSkipInboxFilter(sender.email);
                if (resultIdx !== -1) results[resultIdx].filterCreated = true;
                console.log('[SW] filter created for', sender.email);
              } catch (err) {
                console.error('[SW] filter failed for', sender.email, err.message);
                if (resultIdx !== -1) results[resultIdx].filterError = err.message;
              }
            }
          }
        }

        pushProgress(100, 'Hotovo');
        chrome.runtime.sendMessage({ type: 'UNSUBSCRIBE_DONE', results }).catch(() => {});
      })();

      return { ok: true };
    }

    case 'PING':
      return { ok: true };

    default:
      console.warn('[SW] unknown message type:', message.type);
      return { error: `unknown message type: ${message.type}` };
  }
}

function pushProgress(pct, label) {
  chrome.runtime.sendMessage({ type: 'UNSUBSCRIBE_PROGRESS', pct, label }).catch(() => {});
}

function friendlyError(err) {
  const msg = err.message || '';
  if (msg.includes('401')) return 'Platnosť prihlásenia vypršala — prihláste sa znova';
  if (msg.includes('403')) return 'Nedostatočné oprávnenia — prihláste sa znova';
  if (msg.includes('429')) return 'Gmail API limit — skúste znova o chvíľu';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Chyba siete — skontrolujte pripojenie';
  return msg;
}

console.log('[SW] Gmail Newsletter Unsubscriber service worker started.');
