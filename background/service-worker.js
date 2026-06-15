// Service worker — message router for auth, scan, and unsubscribe operations.

import { login, logout, getToken, getUserEmail, getStoredEmail, refreshToken } from '../lib/auth.js';
import { scan, abortScan } from '../lib/scanner.js';
import { unsubscribeSender } from '../lib/unsubscriber.js';

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

    case 'PING':
      return { ok: true };

    case 'SCAN': {
      // Run scan in background — progress is pushed to panel via sendMessage.
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
        chrome.runtime.sendMessage({ type: 'SCAN_ERROR', error: err.message }).catch(() => {});
      });
      return { ok: true }; // immediate ack — results arrive via push messages
    }

    case 'ABORT_SCAN':
      abortScan();
      return { ok: true };

    case 'UNSUBSCRIBE': {
      const { emails, senders } = message;
      // Run in background — progress pushed to panel
      (async () => {
        const results = [];
        for (let i = 0; i < senders.length; i++) {
          const sender = senders[i];
          const pct = Math.round(((i + 1) / senders.length) * 100);
          chrome.runtime.sendMessage({
            type: 'UNSUBSCRIBE_PROGRESS',
            pct,
            label: `Odhlasovanie ${i + 1} / ${senders.length}: ${sender.displayName || sender.email}`,
          }).catch(() => {});
          const result = await unsubscribeSender(sender);
          results.push(result);
        }
        chrome.runtime.sendMessage({ type: 'UNSUBSCRIBE_DONE', results }).catch(() => {});
      })();
      return { ok: true };
    }

    default:
      console.warn('[SW] unknown message type:', message.type);
      return { error: `unknown message type: ${message.type}` };
  }
}

console.log('[SW] Gmail Newsletter Unsubscriber service worker started (Phase 2).');
