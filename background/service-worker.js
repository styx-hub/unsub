// Service worker — message router for auth, scan, and unsubscribe operations.

import { login, logout, getToken, getUserEmail, getStoredEmail, refreshToken } from '../lib/auth.js';

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
