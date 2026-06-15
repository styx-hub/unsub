// Copy this file to config.js and fill in your real Client ID.
// config.js is gitignored — never commit your real Client ID.
//
// How to get a Client ID:
// 1. Go to https://console.cloud.google.com
// 2. Create a project, enable Gmail API
// 3. OAuth consent screen: External, Testing mode, add your Gmail as Test user
// 4. Credentials → Create OAuth client ID → Web application
// 5. Paste the Client ID below

const CONFIG = {
  CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',

  // Max messages to scan (Gmail API quota: ~250 units/s, messages.get = ~5 units)
  SCAN_LIMIT: 1000,

  // Concurrent API requests (keep low to avoid 429)
  CONCURRENCY_LIMIT: 10,
};
