// Scans Gmail for messages with List-Unsubscribe header, groups by sender.

import { CONFIG } from '../config.js';
import { listMessageIds, getMessageMetadata } from './gmail-api.js';
import { parseFrom, parseListUnsubscribe, isOneClick, getUnsubType, pLimit } from './utils.js';

let abortFlag = false;

export function abortScan() {
  abortFlag = true;
}

export async function scan(onProgress) {
  abortFlag = false;

  const query = 'has:list-unsubscribe';
  const maxResults = CONFIG.SCAN_LIMIT || 1000;

  onProgress({ pct: 2, label: 'Načítavam zoznam správ…' });

  const ids = await listMessageIds(query, maxResults, (fetched, total) => {
    const pct = Math.round((fetched / total) * 20) + 2;
    onProgress({ pct, label: `Načítané ID: ${fetched} / ${Math.min(total, maxResults)}` });
  });

  if (abortFlag) return null;

  onProgress({ pct: 22, label: `Skenujem ${ids.length} správ…` });

  const senderMap = new Map(); // email → sender object
  let processed = 0;

  const tasks = ids.map(id => async () => {
    if (abortFlag) return;

    let msg;
    try {
      msg = await getMessageMetadata(id);
    } catch (e) {
      console.warn('[Scanner] failed to fetch message', id, e.message);
      return;
    }

    const headers = Object.fromEntries(
      (msg.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value])
    );

    const listUnsub = headers['list-unsubscribe'];
    if (!listUnsub) {
      processed++;
      return;
    }

    const { name, email } = parseFrom(headers['from'] || '');
    if (!email) {
      processed++;
      return;
    }

    const { https, mailto } = parseListUnsubscribe(listUnsub);
    const oneClick = isOneClick(headers['list-unsubscribe-post']);
    const unsubType = getUnsubType(https, mailto, oneClick);

    if (senderMap.has(email)) {
      const existing = senderMap.get(email);
      existing.count++;
      // Keep the most recent unsubscribe URLs (overwrite with later messages)
      if (https) existing.lastHttps = https;
      if (mailto) existing.lastMailto = mailto;
      if (oneClick) existing.oneClick = true;
      existing.unsubType = getUnsubType(existing.lastHttps, existing.lastMailto, existing.oneClick);
    } else {
      senderMap.set(email, {
        email,
        displayName: name || email,
        count: 1,
        unsubType,
        lastHttps: https,
        lastMailto: mailto,
        oneClick,
      });
    }

    processed++;
    const pct = 22 + Math.round((processed / ids.length) * 76);
    onProgress({ pct, label: `Spracovaných: ${processed} / ${ids.length}` });
  });

  await pLimit(tasks, CONFIG.CONCURRENCY_LIMIT || 10);

  if (abortFlag) return null;

  // Sort: one-click first, then mailto, then manual; within each group by count desc
  const order = { 'one-click': 0, mailto: 1, manual: 2 };
  const senders = [...senderMap.values()].sort((a, b) => {
    const typeDiff = order[a.unsubType] - order[b.unsubType];
    return typeDiff !== 0 ? typeDiff : b.count - a.count;
  });

  onProgress({ pct: 100, label: `Hotovo — nájdených ${senders.length} odosielateľov` });
  return senders;
}
