// OAuth2 PKCE flow via chrome.identity.launchWebAuthFlow.
// Uses authorization code + PKCE (no implicit token flow — Google deprecated it for extensions).
// Tokens are stored in chrome.storage.local — never in localStorage or hardcoded.

import { CONFIG } from '../config.js';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'openid',
  'email',
].join(' ');

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const STORAGE_KEY = 'auth_data'; // stores { access_token, refresh_token, email }

// ── PKCE helpers ───────────────────────────────────────────────────────────

function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeVerifier() {
  const array = crypto.getRandomValues(new Uint8Array(64));
  return base64urlEncode(array);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(digest);
}

// ── Auth flow ──────────────────────────────────────────────────────────────

function getRedirectUri() {
  return `https://${chrome.runtime.id}.chromiumapp.org/`;
}

function buildAuthUrl(redirectUri, codeChallenge) {
  const params = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function exchangeCodeForTokens(code, redirectUri, codeVerifier) {
  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CONFIG.CLIENT_ID,
      client_secret: CONFIG.CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${err}`);
  }
  return resp.json(); // { access_token, refresh_token, expires_in, ... }
}

async function refreshAccessToken(refreshToken) {
  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CONFIG.CLIENT_ID,
      client_secret: CONFIG.CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token refresh failed (${resp.status}): ${err}`);
  }
  return resp.json(); // { access_token, expires_in, ... }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function login() {
  const redirectUri = getRedirectUri();
  const codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const authUrl = buildAuthUrl(redirectUri, codeChallenge);

  console.log('[Auth] launching PKCE auth flow, redirect URI:', redirectUri);

  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  if (!redirectUrl) throw new Error('Auth flow returned no redirect URL');

  const url = new URL(redirectUrl);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error) throw new Error(`OAuth error: ${error}`);
  if (!code) throw new Error('Authorization code missing in redirect URL');

  const tokens = await exchangeCodeForTokens(code, redirectUri, codeVerifier);
  const email = await getUserEmail(tokens.access_token);

  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      email,
    },
  });

  console.log('[Auth] PKCE flow complete, logged in as:', email);
  return tokens.access_token;
}

export async function logout() {
  const data = await getStoredData();
  if (data?.access_token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${data.access_token}`, { method: 'POST' });
    } catch (e) {
      console.warn('[Auth] revoke failed (non-critical):', e.message);
    }
  }
  await chrome.storage.local.remove(STORAGE_KEY);
  console.log('[Auth] logged out, tokens cleared');
}

export async function getToken() {
  const data = await getStoredData();
  return data?.access_token || null;
}

// Returns a valid access token, refreshing if possible.
export async function refreshToken() {
  const data = await getStoredData();
  if (data?.refresh_token) {
    try {
      console.log('[Auth] refreshing access token via refresh_token');
      const tokens = await refreshAccessToken(data.refresh_token);
      const updated = { ...data, access_token: tokens.access_token };
      await chrome.storage.local.set({ [STORAGE_KEY]: updated });
      return tokens.access_token;
    } catch (e) {
      console.warn('[Auth] refresh failed, re-authenticating:', e.message);
    }
  }
  // Fallback: full re-auth
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

export async function getStoredEmail() {
  const data = await getStoredData();
  return data?.email || null;
}

async function getStoredData() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || null;
}
