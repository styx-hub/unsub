// OAuth2 flow via chrome.identity.launchWebAuthFlow.
// Tokens are stored in chrome.storage.local — never in localStorage or hardcoded.

import { CONFIG } from '../config.js';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const STORAGE_KEY = 'auth_token';

function buildAuthUrl(redirectUri) {
  const params = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    response_type: 'token',
    redirect_uri: redirectUri,
    scope: SCOPES,
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/auth?${params}`;
}

function getRedirectUri() {
  return `https://${chrome.runtime.id}.chromiumapp.org/`;
}

function extractToken(redirectUrl) {
  const hash = new URL(redirectUrl).hash.slice(1);
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');
  if (!token) throw new Error('access_token missing in redirect URL');
  return token;
}

export async function login() {
  const redirectUri = getRedirectUri();
  const authUrl = buildAuthUrl(redirectUri);

  console.log('[Auth] launching web auth flow, redirect URI:', redirectUri);

  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  if (!redirectUrl) throw new Error('Auth flow returned no redirect URL');

  const token = extractToken(redirectUrl);
  await chrome.storage.local.set({ [STORAGE_KEY]: token });
  console.log('[Auth] token obtained and stored');
  return token;
}

export async function logout() {
  const { [STORAGE_KEY]: token } = await chrome.storage.local.get(STORAGE_KEY);
  if (token) {
    // Best-effort revoke
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' });
    } catch (e) {
      console.warn('[Auth] revoke failed (non-critical):', e.message);
    }
  }
  await chrome.storage.local.remove(STORAGE_KEY);
  console.log('[Auth] logged out, token cleared');
}

export async function getToken() {
  const { [STORAGE_KEY]: token } = await chrome.storage.local.get(STORAGE_KEY);
  return token || null;
}

// Call this when a request returns 401. Clears token and re-authenticates.
export async function refreshToken() {
  console.log('[Auth] refreshing token (clearing old, re-authenticating)');
  await chrome.storage.local.remove(STORAGE_KEY);
  return login();
}

export async function getUserEmail(token) {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`userinfo failed: ${resp.status}`);
  const data = await resp.json();
  return data.email || null;
}
