// Auth via chrome.identity.getAuthToken — no client_secret needed.
// Chrome handles token storage, refresh, and the full OAuth consent flow.
// The OAuth2 client_id and scopes live in manifest.json under "oauth2".

const STORAGE_KEY = 'auth_data'; // stores { email } — token is managed by Chrome, not us

function chromeGetAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(token);
    });
  });
}

function chromeRemoveCachedToken(token) {
  return new Promise(resolve => chrome.identity.removeCachedAuthToken({ token }, resolve));
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function login() {
  const token = await chromeGetAuthToken(true);
  const email = await getUserEmail(token);
  await chrome.storage.local.set({ [STORAGE_KEY]: { email } });
  console.log('[Auth] logged in as:', email);
  return token;
}

export async function logout() {
  const token = await getToken();
  if (token) {
    await chromeRemoveCachedToken(token);
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' });
    } catch (e) {
      console.warn('[Auth] revoke failed (non-critical):', e.message);
    }
  }
  await chrome.storage.local.remove(STORAGE_KEY);
  console.log('[Auth] logged out, token invalidated');
}

// Returns a fresh access token (non-interactive — Chrome refreshes automatically).
export async function getToken() {
  try {
    return await chromeGetAuthToken(false);
  } catch (e) {
    console.warn('[Auth] getToken (non-interactive) failed:', e.message);
    return null;
  }
}

// Called by gmail-api on 401 — tells Chrome to drop the stale cached token.
export async function invalidateToken() {
  const token = await getToken();
  if (token) await chromeRemoveCachedToken(token);
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
  const { auth_data } = await chrome.storage.local.get(STORAGE_KEY);
  return auth_data?.email || null;
}
