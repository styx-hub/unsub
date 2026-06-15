// Phase 1 stub — wires up basic UI state, no real API calls yet.

const $ = (id) => document.getElementById(id);

// UI element references
const btnLogin = $('btn-login');
const btnLogout = $('btn-logout');
const btnScan = $('btn-scan');
const btnAbort = $('btn-abort');
const btnUnsub = $('btn-unsub');
const btnBack = $('btn-back');
const authStatus = $('auth-status');
const accountBadge = $('account-badge');
const scanSection = $('scan-section');
const progressSection = $('progress-section');
const progressBar = $('progress-bar');
const progressLabel = $('progress-label');
const toolbar = $('toolbar');
const senderList = $('sender-list');
const emptyState = $('empty-state');
const unsubSection = $('unsub-section');
const resultsSection = $('results-section');
const resultsList = $('results-list');
const searchInput = $('search-input');
const selectAllCheckbox = $('select-all-checkbox');
const selectedCount = $('selected-count');
const modalOverlay = $('modal-overlay');
const modalSummary = $('modal-summary');
const modalList = $('modal-list');
const modalCancel = $('modal-cancel');
const modalConfirm = $('modal-confirm');

// App state
let state = {
  loggedIn: false,
  userEmail: null,
  scanning: false,
  senders: [],       // [{ email, displayName, count, unsubType, lastListUnsubscribe, lastListUnsubscribePost }]
  filtered: [],
  selected: new Set(),
  results: [],
};

// ── Rendering ──────────────────────────────────────────────────────────────

function renderAuth() {
  if (state.loggedIn) {
    authStatus.textContent = 'Prihlásený ako:';
    accountBadge.textContent = state.userEmail || '';
    accountBadge.classList.remove('hidden');
    btnLogin.classList.add('hidden');
    btnLogout.classList.remove('hidden');
    scanSection.classList.remove('hidden');
  } else {
    authStatus.textContent = 'Prihlás sa, aby si mohol skenovať svoju schránku.';
    accountBadge.classList.add('hidden');
    btnLogin.classList.remove('hidden');
    btnLogout.classList.add('hidden');
    scanSection.classList.add('hidden');
  }
}

function renderSenderList() {
  const query = searchInput.value.toLowerCase();
  state.filtered = state.senders.filter(s =>
    s.displayName.toLowerCase().includes(query) ||
    s.email.toLowerCase().includes(query)
  );

  if (state.senders.length === 0) {
    toolbar.style.display = 'none';
    senderList.innerHTML = '';
    emptyState.style.display = 'flex';
    unsubSection.classList.add('hidden');
    return;
  }

  emptyState.style.display = 'none';
  toolbar.style.display = 'flex';

  senderList.innerHTML = '';
  for (const sender of state.filtered) {
    const item = document.createElement('div');
    item.className = 'sender-item' + (state.selected.has(sender.email) ? ' selected' : '');
    item.dataset.email = sender.email;

    const badgeClass = {
      'one-click': 'badge-one-click',
      'mailto': 'badge-mailto',
      'manual': 'badge-manual',
    }[sender.unsubType] || 'badge-manual';

    const badgeLabel = {
      'one-click': '🟢 One-click',
      'mailto': '✉️ Email',
      'manual': '⚠️ Manuálne',
    }[sender.unsubType] || '⚠️ Manuálne';

    item.innerHTML = `
      <input type="checkbox" class="sender-checkbox" data-email="${sender.email}"
        ${state.selected.has(sender.email) ? 'checked' : ''}>
      <div class="sender-info">
        <div class="sender-name">${escapeHtml(sender.displayName)}</div>
        <div class="sender-email">${escapeHtml(sender.email)}</div>
        <div class="sender-meta">
          <span class="badge ${badgeClass}">${badgeLabel}</span>
          <span class="msg-count">${sender.count} správ</span>
        </div>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('sender-checkbox')) return;
      toggleSender(sender.email);
    });

    item.querySelector('.sender-checkbox').addEventListener('change', () => {
      toggleSender(sender.email);
    });

    senderList.appendChild(item);
  }

  updateSelectAllState();
  updateSelectedCount();
  unsubSection.classList.toggle('hidden', state.selected.size === 0);
}

function updateSelectAllState() {
  const visibleEmails = state.filtered.map(s => s.email);
  const allSelected = visibleEmails.length > 0 &&
    visibleEmails.every(e => state.selected.has(e));
  selectAllCheckbox.checked = allSelected;
  selectAllCheckbox.indeterminate = !allSelected &&
    visibleEmails.some(e => state.selected.has(e));
}

function updateSelectedCount() {
  const n = state.selected.size;
  selectedCount.textContent = n > 0 ? `${n} vybraných` : '';
}

function toggleSender(email) {
  if (state.selected.has(email)) {
    state.selected.delete(email);
  } else {
    state.selected.add(email);
  }
  renderSenderList();
}

function setProgress(pct, label) {
  progressBar.style.width = `${pct}%`;
  progressLabel.textContent = label;
}

function showProgress(visible) {
  progressSection.style.display = visible ? 'flex' : 'none';
}

function showResults(results) {
  state.results = results;
  senderList.innerHTML = '';
  toolbar.style.display = 'none';
  unsubSection.classList.add('hidden');
  progressSection.style.display = 'none';

  resultsList.innerHTML = '';
  for (const r of results) {
    const item = document.createElement('div');
    item.className = 'result-item';
    const icon = { success: '✅', email: '✉️', manual: '⚠️', error: '❌' }[r.status] || '❓';
    item.innerHTML = `
      <span class="result-status">${icon}</span>
      <span class="result-sender">${escapeHtml(r.displayName || r.email)}</span>
      <span class="result-detail">${escapeHtml(r.detail || '')}</span>
    `;
    resultsList.appendChild(item);
  }

  resultsSection.style.display = 'flex';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Event handlers ─────────────────────────────────────────────────────────

btnLogin.addEventListener('click', async () => {
  console.log('[Panel] Login clicked — sending LOGIN message to SW');
  btnLogin.disabled = true;
  authStatus.textContent = 'Prihlasujem…';

  try {
    const resp = await chrome.runtime.sendMessage({ type: 'LOGIN' });
    if (resp?.error) throw new Error(resp.error);
    state.loggedIn = true;
    state.userEmail = resp.email || null;
    renderAuth();
  } catch (err) {
    console.error('[Panel] Login error:', err);
    authStatus.textContent = `Chyba prihlásenia: ${err.message}`;
  } finally {
    btnLogin.disabled = false;
  }
});

btnLogout.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  state.loggedIn = false;
  state.userEmail = null;
  state.senders = [];
  state.filtered = [];
  state.selected.clear();
  senderList.innerHTML = '';
  toolbar.style.display = 'none';
  emptyState.style.display = 'none';
  unsubSection.classList.add('hidden');
  resultsSection.style.display = 'none';
  renderAuth();
});

btnScan.addEventListener('click', async () => {
  console.log('[Panel] Scan clicked');
  state.senders = [];
  state.filtered = [];
  state.selected.clear();
  senderList.innerHTML = '';
  emptyState.style.display = 'none';
  unsubSection.classList.add('hidden');
  resultsSection.style.display = 'none';
  toolbar.style.display = 'none';

  btnScan.disabled = true;
  btnAbort.classList.remove('hidden');
  showProgress(true);
  setProgress(0, 'Spúšťam skenovanie…');

  const resp = await chrome.runtime.sendMessage({ type: 'SCAN' });
  if (resp?.error) {
    console.error('[Panel] Scan error:', resp.error);
    setProgress(0, `Chyba: ${resp.error}`);
  }
  // Results arrive via SCAN_PROGRESS / SCAN_DONE messages
});

btnAbort.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'ABORT_SCAN' });
  btnAbort.classList.add('hidden');
});

btnUnsub.addEventListener('click', () => {
  const selectedSenders = state.senders.filter(s => state.selected.has(s.email));
  if (selectedSenders.length === 0) return;

  modalSummary.textContent =
    `Naozaj chceš odhlásiť ${selectedSenders.length} odosielateľ${selectedSenders.length === 1 ? 'a' : 'ov'}?`;

  modalList.innerHTML = '';
  for (const s of selectedSenders) {
    const li = document.createElement('div');
    li.className = 'modal-list-item';
    const methodLabel = { 'one-click': 'POST', 'mailto': 'Email', 'manual': 'Manuálne' }[s.unsubType] || '?';
    li.innerHTML = `
      <span>${escapeHtml(s.displayName || s.email)}</span>
      <span style="color:var(--color-text-secondary)">${methodLabel}</span>
    `;
    modalList.appendChild(li);
  }

  modalOverlay.classList.add('visible');
});

modalCancel.addEventListener('click', () => {
  modalOverlay.classList.remove('visible');
});

modalConfirm.addEventListener('click', async () => {
  modalOverlay.classList.remove('visible');
  const senders = state.senders.filter(s => state.selected.has(s.email));
  showProgress(true);
  setProgress(0, 'Odhlašujem…');
  btnUnsub.disabled = true;

  const resp = await chrome.runtime.sendMessage({ type: 'UNSUBSCRIBE', senders });
  if (resp?.error) {
    console.error('[Panel] Unsubscribe error:', resp.error);
    setProgress(0, `Chyba: ${resp.error}`);
    btnUnsub.disabled = false;
    return;
  }
  // Results arrive via UNSUBSCRIBE_DONE message
});

btnBack.addEventListener('click', () => {
  resultsSection.style.display = 'none';
  state.selected.clear();
  renderSenderList();
  btnUnsub.disabled = false;
});

searchInput.addEventListener('input', () => renderSenderList());

selectAllCheckbox.addEventListener('change', () => {
  if (selectAllCheckbox.checked) {
    state.filtered.forEach(s => state.selected.add(s.email));
  } else {
    state.filtered.forEach(s => state.selected.delete(s.email));
  }
  renderSenderList();
});

// ── Service worker push messages ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'SCAN_PROGRESS':
      setProgress(message.pct, message.label);
      break;

    case 'SCAN_DONE':
      state.senders = message.senders || [];
      state.filtered = [...state.senders];
      state.selected.clear();
      btnScan.disabled = false;
      btnAbort.classList.add('hidden');
      showProgress(false);
      if (state.senders.length === 0) {
        emptyState.style.display = 'flex';
      } else {
        renderSenderList();
      }
      break;

    case 'SCAN_ERROR':
      btnScan.disabled = false;
      btnAbort.classList.add('hidden');
      setProgress(0, `Chyba: ${message.error}`);
      console.error('[Panel] Scan error from SW:', message.error);
      break;

    case 'UNSUBSCRIBE_PROGRESS':
      setProgress(message.pct, message.label);
      break;

    case 'UNSUBSCRIBE_DONE':
      showProgress(false);
      showResults(message.results);
      break;
  }
});

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  // Check if already logged in (token in storage)
  const resp = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  if (resp?.loggedIn) {
    state.loggedIn = true;
    state.userEmail = resp.email || null;
  }
  renderAuth();
  console.log('[Panel] initialized, loggedIn:', state.loggedIn);
}

init();
