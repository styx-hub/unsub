// Two-pass scanner:
// 1. Fast metadata scan — finds List-Unsubscribe header OR newsletter-like FROM address
// 2. Body scan — fetches HTML for newsletter-like senders without header, finds unsub link

import { CONFIG } from '../config.js';
import { listMessageIds, getMessageMetadata, getMessageFull } from './gmail-api.js';
import {
  parseFrom, parseListUnsubscribe, isOneClick, getUnsubType, pLimit,
  extractHtmlBody, findBodyUnsubscribeUrl,
} from './utils.js';

// Heuristic: does this FROM email look like a newsletter/marketing sender?
const NEWSLETTER_EMAIL_RE = /newsletter|noreply|no-reply|promo|marketing|news@|updates@|deals@|offers@|info@|notifications@|campaign|bulk|mailer|mailchimp|sendgrid|klaviyo|mailgun/i;

function looksLikeNewsletter(email) {
  return NEWSLETTER_EMAIL_RE.test(email);
}

let abortFlag = false;

export function abortScan() {
  abortFlag = true;
}

export async function scan(onProgress) {
  abortFlag = false;

  // Broad query: all non-spam mail (promotions + inbox + updates etc.)
  const query = '-in:chats -in:sent -in:drafts -in:spam -in:trash';
  const maxResults = CONFIG.SCAN_LIMIT || 1000;

  onProgress({ pct: 2, label: 'Načítavam zoznam správ…' });

  const ids = await listMessageIds(query, maxResults, (fetched, total) => {
    const pct = Math.round((fetched / total) * 15) + 2;
    onProgress({ pct, label: `Načítané ID: ${fetched} / ${Math.min(total, maxResults)}` });
  });

  if (abortFlag) return null;

  onProgress({ pct: 18, label: `Skenujem ${ids.length} správ…` });

  const senderMap = new Map();
  const candidatesForBodyScan = new Map(); // email → { id, name }
  let processed = 0;

  // ── Pass 1: metadata ──────────────────────────────────────────────────────

  const metaTasks = ids.map(id => async () => {
    if (abortFlag) return;

    let msg;
    try {
      msg = await getMessageMetadata(id);
    } catch (e) {
      console.warn('[Scanner] metadata fetch failed', id, e.message);
      processed++;
      return;
    }

    const headers = Object.fromEntries(
      (msg.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value])
    );

    const { name, email } = parseFrom(headers['from'] || '');
    if (!email) { processed++; return; }

    const listUnsub = headers['list-unsubscribe'];

    if (listUnsub) {
      // Has proper header — process directly
      const { https, mailto } = parseListUnsubscribe(listUnsub);
      const oneClick = isOneClick(headers['list-unsubscribe-post']);
      const unsubType = getUnsubType(https, mailto, oneClick);

      if (senderMap.has(email)) {
        const ex = senderMap.get(email);
        ex.count++;
        if (https) ex.lastHttps = https;
        if (mailto) ex.lastMailto = mailto;
        if (oneClick) ex.oneClick = true;
        ex.unsubType = getUnsubType(ex.lastHttps, ex.lastMailto, ex.oneClick);
      } else {
        senderMap.set(email, {
          email, displayName: name || email, count: 1,
          unsubType, lastHttps: https, lastMailto: mailto, oneClick,
        });
        candidatesForBodyScan.delete(email);
      }
    } else if (looksLikeNewsletter(email)) {
      // No header but FROM looks like a newsletter — track count + queue one msg for body scan
      if (candidatesForBodyScan.has(email)) {
        candidatesForBodyScan.get(email).count++;
      } else {
        candidatesForBodyScan.set(email, { id, name: name || email, count: 1 });
        console.log('[Scanner] body candidate:', email);
      }
    }

    processed++;
    const pct = 18 + Math.round((processed / ids.length) * 55);
    onProgress({ pct, label: `Skenujem: ${processed} / ${ids.length}` });
  });

  await pLimit(metaTasks, CONFIG.CONCURRENCY_LIMIT || 10);
  if (abortFlag) return null;

  // ── Pass 2: body scan for newsletter-like senders without header ──────────

  const bodyEntries = [...candidatesForBodyScan.entries()];
  if (bodyEntries.length > 0) {
    onProgress({ pct: 74, label: `Hľadám unsub link v tele ${bodyEntries.length} správ…` });

    let bodyDone = 0;
    const bodyTasks = bodyEntries.map(([email, { id, name }]) => async () => {
      if (abortFlag) return;

      try {
        const msg = await getMessageFull(id);
        const html = extractHtmlBody(msg.payload);
        const url = findBodyUnsubscribeUrl(html);

        if (url) {
          senderMap.set(email, {
            email, displayName: name, count: candidatesForBodyScan.get(email)?.count || 1,
            unsubType: 'manual', lastHttps: url, lastMailto: null, oneClick: false,
          });
          console.log('[Scanner] body unsub link found:', email, url);
        }
      } catch (e) {
        console.warn('[Scanner] body scan failed', email, e.message);
      }

      bodyDone++;
      const pct = 74 + Math.round((bodyDone / bodyEntries.length) * 24);
      onProgress({ pct, label: `Telo správ: ${bodyDone} / ${bodyEntries.length}` });
    });

    await pLimit(bodyTasks, CONFIG.CONCURRENCY_LIMIT || 10);
  }

  if (abortFlag) return null;

  const order = { 'one-click': 0, mailto: 1, manual: 2 };
  const senders = [...senderMap.values()].sort((a, b) => {
    const d = order[a.unsubType] - order[b.unsubType];
    return d !== 0 ? d : b.count - a.count;
  });

  onProgress({ pct: 100, label: `Hotovo — nájdených ${senders.length} odosielateľov` });
  return senders;
}
