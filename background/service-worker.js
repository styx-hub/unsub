// Service worker — message router for auth, scan, and unsubscribe operations.

import { login, logout, getToken, getUserEmail } from '../lib/auth.js';

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

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
      try {
        const email = await getUserEmail(token);
        return { loggedIn: true, email };
      } catch {
        // Token might be expired — treat as logged out
        return { loggedIn: false };
      }
    }

    case 'LOGIN': {
      const token = await login();
      const email = await getUserEmail(token);
      console.log('[SW] logged in as:', email);
      return { email };
    }

    case 'LOGOUT': {
      await logout();
      return { ok: true };
    }

    case 'PING':
      return { ok: true };

    case 'SCAN':
      // Phase 3 — stub
      return { error: 'Scan not yet implemented (Phase 3)' };

    case 'ABORT_SCAN':
      // Phase 3
      return { ok: true };

    case 'UNSUBSCRIBE':
      // Phase 5 — stub
      return { error: 'Unsubscribe not yet implemented (Phase 5)' };

    default:
      console.warn('[SW] unknown message type:', message.type);
      return { error: `unknown message type: ${message.type}` };
  }
}

console.log('[SW] Gmail Newsletter Unsubscriber service worker started (Phase 2).');
