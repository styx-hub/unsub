// Gmail REST API wrappers with rate-limiting and 401/429 handling.

import { getToken, refreshToken } from './auth.js';
import { sleep, backoffDelay } from './utils.js';

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function authHeaders() {
  const token = await getToken();
  return { Authorization: `Bearer ${token}` };
}

// Generic fetch with 401 refresh + 429 backoff.
async function apiFetch(url, options = {}, attempt = 0) {
  const headers = { ...await authHeaders(), ...(options.headers || {}) };
  const resp = await fetch(url, { ...options, headers });

  if (resp.status === 401) {
    if (attempt > 0) throw new Error('Auth failed after token refresh');
    console.warn('[API] 401 — refreshing token and retrying');
    await refreshToken();
    return apiFetch(url, options, attempt + 1);
  }

  if (resp.status === 429) {
    const delay = backoffDelay(attempt);
    console.warn(`[API] 429 rate limit — backing off ${delay}ms (attempt ${attempt + 1})`);
    await sleep(delay);
    return apiFetch(url, options, Math.min(attempt + 1, 5));
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Gmail API ${resp.status}: ${body}`);
  }

  // 204 No Content (e.g. batchModify) — no body to parse
  if (resp.status === 204) return null;

  return resp.json();
}

// List message IDs matching a query, up to maxResults (handles pagination).
export async function listMessageIds(query, maxResults, onProgress) {
  const ids = [];
  let pageToken = null;
  const pageSize = Math.min(500, maxResults);

  while (ids.length < maxResults) {
    const params = new URLSearchParams({ q: query, maxResults: pageSize });
    if (pageToken) params.set('pageToken', pageToken);

    const data = await apiFetch(`${BASE}/messages?${params}`);
    const messages = data.messages || [];
    ids.push(...messages.map(m => m.id));

    if (onProgress) onProgress(ids.length, maxResults);

    pageToken = data.nextPageToken;
    if (!pageToken || ids.length >= maxResults) break;
  }

  return ids.slice(0, maxResults);
}

// Fetch metadata headers for a single message.
export async function getMessageMetadata(messageId) {
  const params = new URLSearchParams({ format: 'metadata' });
  // Gmail API requires repeated params, not comma-joined
  params.append('metadataHeaders', 'From');
  params.append('metadataHeaders', 'List-Unsubscribe');
  params.append('metadataHeaders', 'List-Unsubscribe-Post');
  return apiFetch(`${BASE}/messages/${messageId}?${params}`);
}

// Send a raw RFC 2822 message (base64url encoded).
export async function sendMessage(rawBase64url) {
  return apiFetch(`${BASE}/messages/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: rawBase64url }),
  });
}

// Archive messages by removing INBOX label.
export async function archiveMessages(messageIds) {
  if (!messageIds.length) return;
  // batchModify accepts max 1000 IDs at a time
  const chunks = [];
  for (let i = 0; i < messageIds.length; i += 1000) chunks.push(messageIds.slice(i, i + 1000));
  for (const chunk of chunks) {
    await apiFetch(`${BASE}/messages/batchModify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: chunk, removeLabelIds: ['INBOX'] }),
    });
  }
}

// Get all message IDs from a specific sender (for archiving).
export async function listMessageIdsBySender(senderEmail) {
  return listMessageIds(`from:${senderEmail}`, 500, null);
}

// Create a Gmail filter to skip inbox for a sender.
export async function createSkipInboxFilter(senderEmail) {
  return apiFetch(`${BASE}/settings/filters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      criteria: { from: senderEmail },
      action: { removeLabelIds: ['INBOX'], addLabelIds: [] },
    }),
  });
}
