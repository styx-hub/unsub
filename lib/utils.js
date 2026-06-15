// Header parsing and misc helpers.

// Parse List-Unsubscribe header value into { https, mailto } URLs.
// Header can contain multiple values: "<https://...>, <mailto:...>"
export function parseListUnsubscribe(headerValue) {
  if (!headerValue) return { https: null, mailto: null };

  const decoded = decodeHtmlEntities(headerValue);
  const parts = decoded.match(/<([^>]+)>/g) || [];

  let https = null;
  let mailto = null;

  for (const part of parts) {
    const url = part.slice(1, -1).trim();
    if (url.startsWith('https://') && !https) https = url;
    if (url.startsWith('mailto:') && !mailto) mailto = url;
  }

  // Fallback: bare URL without angle brackets
  if (!https && !mailto) {
    const trimmed = decoded.trim();
    if (trimmed.startsWith('https://')) https = trimmed;
    else if (trimmed.startsWith('mailto:')) mailto = trimmed;
  }

  return { https, mailto };
}

// Returns true if List-Unsubscribe-Post indicates RFC 8058 one-click support.
export function isOneClick(listUnsubscribePost) {
  if (!listUnsubscribePost) return false;
  return listUnsubscribePost.trim().toLowerCase() === 'list-unsubscribe=one-click';
}

// Determine unsubscribe type for a sender.
export function getUnsubType(https, mailto, oneClick) {
  if (oneClick && https) return 'one-click';
  if (mailto) return 'mailto';
  if (https) return 'manual';
  return 'manual';
}

// Parse "Display Name <email@domain.com>" or bare "email@domain.com".
export function parseFrom(fromHeader) {
  if (!fromHeader) return { name: '', email: '' };
  const decoded = decodeHtmlEntities(fromHeader);
  const match = decoded.match(/^(.*?)<([^>]+)>\s*$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, ''),
      email: match[2].trim().toLowerCase(),
    };
  }
  const bare = decoded.trim().toLowerCase();
  return { name: bare, email: bare };
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Run async tasks with a concurrency limit.
export async function pLimit(tasks, limit) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// Exponential backoff: wait 2^attempt * base ms, max cap.
export function backoffDelay(attempt, baseMs = 1000, capMs = 30000) {
  return Math.min(baseMs * Math.pow(2, attempt), capMs);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

