// Unsubscribe logic: one-click POST → mailto send → manual (open tab).

import { sendMessage } from './gmail-api.js';

// Build a base64url-encoded RFC 2822 unsubscribe email.
function buildMailtoRaw(to, subject) {
  const subj = subject || 'Unsubscribe';
  const msg = [
    `To: ${to}`,
    `Subject: ${subj}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    `Please unsubscribe me from this mailing list.`,
  ].join('\r\n');

  return btoa(unescape(encodeURIComponent(msg)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Parse mailto: URI → { to, subject }
function parseMailto(mailtoUrl) {
  const withoutScheme = mailtoUrl.replace(/^mailto:/i, '');
  const [toRaw, queryRaw] = withoutScheme.split('?');
  const to = decodeURIComponent(toRaw || '').trim();
  const params = new URLSearchParams(queryRaw || '');
  const subject = params.get('subject') || '';
  return { to, subject };
}

// Attempt one-click POST unsubscribe (RFC 8058).
async function oneClickPost(url) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'List-Unsubscribe=One-Click',
  });
  if (!resp.ok) throw new Error(`POST ${url} returned ${resp.status}`);
}

// Send unsubscribe email via Gmail API.
async function sendMailtoUnsub(mailtoUrl) {
  const { to, subject } = parseMailto(mailtoUrl);
  if (!to) throw new Error('Invalid mailto URL — no recipient');
  const raw = buildMailtoRaw(to, subject);
  await sendMessage(raw);
}

// Process a single sender — returns a result object.
export async function unsubscribeSender(sender) {
  const { email, displayName, unsubType, lastHttps, lastMailto, oneClick } = sender;
  const name = displayName || email;

  try {
    if (unsubType === 'one-click' && lastHttps) {
      await oneClickPost(lastHttps);
      console.log('[Unsub] one-click POST success:', email);
      return { email, displayName: name, status: 'success', detail: 'One-click POST' };
    }

    if (lastMailto) {
      await sendMailtoUnsub(lastMailto);
      console.log('[Unsub] mailto sent:', email);
      return { email, displayName: name, status: 'email', detail: 'Odhlasovací email odoslaný' };
    }

    if (lastHttps) {
      // Manual only — open in new tab
      await chrome.tabs.create({ url: lastHttps, active: false });
      console.log('[Unsub] manual tab opened:', email);
      return { email, displayName: name, status: 'manual', detail: 'Otvorené v novom tabe' };
    }

    return { email, displayName: name, status: 'error', detail: 'Žiadna unsub URL' };

  } catch (err) {
    console.error('[Unsub] error for', email, ':', err.message);
    return { email, displayName: name, status: 'error', detail: err.message };
  }
}
