// Service worker — message router for auth, scan, and unsubscribe operations.
// Auth helpers are loaded dynamically so a missing config.js doesn't prevent the side panel from opening.

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
  // Auth helpers loaded dynamically — safe even if config.js is missing during early phases.
  const auth = await import('../lib/auth.js');

  switch (message.type) {

    case 'GET_STATUS': {
      const token = await auth.getToken();
      if (!token) return { loggedIn: false };
      try {
        const email = await auth.getUserEmail(token);
        return { loggedIn: true, email };
      } catch {
        // Token might be expired — treat as logged out
        return { loggedIn: false };
      }
    }

    case 'LOGIN': {
      const token = await auth.login();
      const email = await auth.getUserEmail(token);
      console.log('[SW] logged in as:', email);
      return { email };
    }

    case 'LOGOUT': {
      await auth.logout();
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
