// Service worker — message router for auth, scan, and unsubscribe operations.
// Phase 1: stub that opens the side panel on toolbar click.

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[SW] received message:', message.type);

  switch (message.type) {
    case 'PING':
      sendResponse({ ok: true });
      break;

    default:
      console.warn('[SW] unknown message type:', message.type);
      sendResponse({ error: 'unknown message type' });
  }

  // Return true to keep the message channel open for async responses (needed later).
  return true;
});

console.log('[SW] Gmail Newsletter Unsubscriber service worker started.');
