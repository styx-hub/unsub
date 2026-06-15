// Scans Gmail for newsletters — two passes:
// 1. Fast: metadata scan for List-Unsubscribe header (all time)
// 2. Body: for Promotions messages without header, parse HTML for unsub links (one msg/sender)

import { CONFIG } from '../config.js';
import { listMessageIds, getMessageMetadata, getMessageFull } from './gmail-api.js';
import {
  parseFrom, parseListUnsubscribe, isOneClick, getUnsubType, pLimit,
  extractHtmlBody, findBodyUnsubscribeUrl,
} from './utils.js';

let abortFlag = false;

export function abortScan() {
  abortFlag = true;
}

export async function scan(onProgress) {
  abortFlag = false;

  const query = 'category:promotions OR category:updates OR category:newsletters';
  const maxResults = CONFIG.SCAN_LIMIT || 1000;

  onProgress({ pct: 2, label: 'Načítavam zoznam správ…' });

  const ids = await listMessageIds(query, maxResults, (fetched, total) => {
    const pct = Math.round((fetched / total) * 15) + 2;
    onProgress({ pct, label: `Načítané ID: ${fetched} / ${Math.min(total, maxResults)}` });
  });

  if (abortFlag) return null;

  onProgress({ pct: 18, label: `Skenujem ${ids.length} správ (rýchly prechod)…` });

  const senderMap = new Map();
  // Track one message ID per unknown sender for the body scan pass
  const candidatesForBodyScan = new Map(); // sender email → messageId

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
        // Remove from body scan candidates — header found
        candidatesForBodyScan.delete(email);
      }
    } else {
      // No header — queue one message per sender for body scan
      if (!senderMap.has(email) && !candidatesForBodyScan.has(email)) {
        candidatesForBodyScan.set(email, { id, name: name || email });
      }
    }

    processed++;
    const pct = 18 + Math.round((processed / ids.length) * 55);
    onProgress({ pct, label: `Rýchly prechod: ${processed} / ${ids.length}` });
  });

  await pLimit(metaTasks, CONFIG.CONCURRENCY_LIMIT || 10);
  if (abortFlag) return null;

  // ── Pass 2: body scan ─────────────────────────────────────────────────────

  const bodyEntries = [...candidatesForBodyScan.entries()];
  if (bodyEntries.length > 0) {
    onProgress({ pct: 74, label: `Prehľadávam telo ${bodyEntries.length} správ bez hlavičky…` });

    let bodyDone = 0;
    const bodyTasks = bodyEntries.map(([email, { id, name }]) => async () => {
      if (abortFlag) return;

      try {
        const msg = await getMessageFull(id);
        const html = extractHtmlBody(msg.payload);
        const url = findBodyUnsubscribeUrl(html);

        if (url) {
          senderMap.set(email, {
            email, displayName: name, count: 1,
            unsubType: 'manual', lastHttps: url, lastMailto: null, oneClick: false,
          });
          console.log('[Scanner] body unsub found:', email, url);
        }
      } catch (e) {
        console.warn('[Scanner] body scan failed', email, e.message);
      }

      bodyDone++;
      const pct = 74 + Math.round((bodyDone / bodyEntries.length) * 24);
      onProgress({ pct, label: `Prehľadávam telo: ${bodyDone} / ${bodyEntries.length}` });
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
