// Scan and concurrency settings.
// No secrets here — client_id lives in manifest.json under "oauth2".

export const CONFIG = {
  // Max messages to scan (Gmail API quota: ~250 units/s, messages.get = ~5 units)
  SCAN_LIMIT: 1000,

  // Concurrent API requests (keep low to avoid 429)
  CONCURRENCY_LIMIT: 10,
};
