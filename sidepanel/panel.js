import { i18n, LANGS, LANG_STORAGE_KEY, LANG_DEFAULT } from './strings.js';

const $ = (id) => document.getElementById(id);

const btnLogin          = $('btn-login');
const btnLogout         = $('btn-logout');
const btnScan           = $('btn-scan');
const btnAbort          = $('btn-abort');
const btnUnsubLabel     = $('btn-unsub-label');
const btnUnsub          = $('btn-unsub');
const btnBack           = $('btn-back');
const authStatus        = $('auth-status');
const accountBadge      = $('account-badge');
const onboardingSection = $('onboarding-section');
const appSection        = $('app-section');
const scanDateLabel     = $('scan-date-label');
const progressSection   = $('progress-section');
const progressBar       = $('progress-bar');
const progressLabel     = $('progress-label');
const statsBar          = $('stats-bar');
const statFound         = $('stat-found');
const statUnsubbed      = $('stat-unsubbed');
const toolbar           = $('toolbar');
const senderList        = $('sender-list');
const welcomeState      = $('welcome-state');
const emptyState        = $('empty-state');
const unsubSection      = $('unsub-section');
const resultsSection    = $('results-section');
const resultsList       = $('results-list');
const searchInput       = $('search-input');
const selectAllCheckbox = $('select-all-checkbox');
const selectedCount     = $('selected-count');
const infoOverlay       = $('info-overlay');
const btnInfoClose      = $('btn-info-close');
const modalOverlay      = $('modal-overlay');
const modalSummary      = $('modal-summary');
const modalList         = $('modal-list');
const modalCancel       = $('modal-cancel');
const modalConfirm      = $('modal-confirm');
const optArchive        = $('opt-archive');
const optFilter         = $('opt-filter');

let state = {
  loggedIn:  false,
  userEmail: null,
  scanning:  false,
  senders:   [],
  filtered:  [],
  selected:  new Set(),
  results:   [],
  unsubLog:  {},
  scanDate:  null,
};

// ── i18n ────────────────────────────────────────────────────────────────────

function applyStrings() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = i18n.t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = i18n.t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = i18n.t(el.dataset.i18nPh);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = i18n.t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === i18n.lang);
  });
  // Re-render dynamic labels that are already visible
  updateScanDateLabel();
  updateSelectedCount();
  if (state.senders.length > 0) renderSenderList();
}

async function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  i18n.lang = lang;
  document.documentElement.lang = lang;
  await chrome.storage.local.set({ [LANG_STORAGE_KEY]: lang });
  applyStrings();
}

// ── Avatar helpers ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#00d4ff','#a78bfa','#4ade80','#f59e0b',
  '#f87171','#34d399','#60a5fa','#e879f9',
];

function avatarColor(email) {
  let h = 0;
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function avatarLetter(displayName) {
  return (displayName || '?')[0].toUpperCase();
}

// ── Rendering ───────────────────────────────────────────────────────────────

function renderAuth() {
  if (state.loggedIn) {
    onboardingSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    accountBadge.textContent = state.userEmail || '';
    accountBadge.classList.remove('hidden');
    btnLogout.classList.remove('hidden');
  } else {
    onboardingSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    accountBadge.classList.add('hidden');
    btnLogout.classList.add('hidden');
  }
}

function renderStats() {
  const total    = state.senders.length;
  const unsubbed = Object.keys(state.unsubLog).length;
  statFound.textContent    = total;
  statUnsubbed.textContent = unsubbed;
  statsBar.classList.toggle('hidden', total === 0);
}

function renderSenderList() {
  const query = searchInput.value.toLowerCase();
  state.filtered = state.senders.filter(s =>
    s.displayName.toLowerCase().includes(query) ||
    s.email.toLowerCase().includes(query)
  );

  const hasAnySenders = state.senders.length > 0;

  welcomeState.style.display = 'none';
  emptyState.style.display   = 'none';
  toolbar.style.display      = hasAnySenders ? 'flex' : 'none';

  if (!hasAnySenders) {
    if (state.scanDate) emptyState.style.display = 'flex';
    else                welcomeState.style.display = 'flex';
    senderList.innerHTML = '';
    unsubSection.classList.add('hidden');
    return;
  }

  senderList.innerHTML = '';
  for (const sender of state.filtered) {
    const item = document.createElement('div');
    const unsubEntry  = state.unsubLog[sender.email];
    const wasUnsubbed = !!unsubEntry;
    const unsubDateStr = wasUnsubbed
      ? new Date(unsubEntry.date).toLocaleDateString(langLocale())
      : null;

    item.className = 'sender-item' +
      (state.selected.has(sender.email) ? ' selected' : '') +
      (wasUnsubbed ? ' unsubbed' : '');
    item.dataset.email = sender.email;

    const badgeClass = wasUnsubbed ? 'badge-unsubbed' : {
      'one-click': 'badge-one-click',
      'mailto':    'badge-mailto',
      'manual':    'badge-manual',
    }[sender.unsubType] || 'badge-manual';

    const badgeLabel = wasUnsubbed
      ? i18n.f('badgeUnsubbed', unsubDateStr)
      : {
          'one-click': i18n.t('badgeOneClick'),
          'mailto':    i18n.t('badgeEmail'),
          'manual':    i18n.t('badgeManual'),
        }[sender.unsubType] || i18n.t('badgeManual');

    item.innerHTML = `
      <div class="sender-avatar" style="background:${avatarColor(sender.email)}">${avatarLetter(sender.displayName)}</div>
      <div class="sender-info">
        <div class="sender-name">${escapeHtml(sender.displayName)}</div>
        <div class="sender-email">${escapeHtml(sender.email)}</div>
        <div class="sender-meta">
          <span class="badge ${badgeClass}">${badgeLabel}</span>
          <span class="msg-count">${i18n.f('msgCount', sender.count)}</span>
          ${sender.lastMessageDate ? `<span class="msg-date">${formatLastDate(sender.lastMessageDate)}</span>` : ''}
        </div>
      </div>
      <input type="checkbox" class="sender-checkbox" data-email="${sender.email}"
        ${state.selected.has(sender.email) ? 'checked' : ''}
        ${wasUnsubbed ? 'disabled' : ''}>
    `;

    if (wasUnsubbed) { senderList.appendChild(item); continue; }

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
  const selectable = state.filtered.filter(s => !state.unsubLog[s.email]).map(s => s.email);
  const allSelected = selectable.length > 0 && selectable.every(e => state.selected.has(e));
  selectAllCheckbox.checked       = allSelected;
  selectAllCheckbox.indeterminate = !allSelected && selectable.some(e => state.selected.has(e));
}

function updateSelectedCount() {
  const n = state.selected.size;
  selectedCount.textContent = n > 0 ? i18n.f('selectedCount', n) : '';
  btnUnsubLabel.textContent = n > 0 ? i18n.f('btnUnsubN', n) : i18n.t('btnUnsub');
}

function toggleSender(email) {
  if (state.selected.has(email)) state.selected.delete(email);
  else                           state.selected.add(email);
  renderSenderList();
}

function setProgress(pct, label) {
  progressBar.style.width   = `${pct}%`;
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
  statsBar.classList.add('hidden');

  resultsList.innerHTML = '';
  for (const r of results) {
    const item = document.createElement('div');
    item.className = 'result-item';
    const icon = { success: '✅', email: '✉️', manual: '⚠️', error: '❌' }[r.status] || '❓';
    const extras = [];
    if (r.archived != null) extras.push(i18n.f('resultArchived', r.archived));
    if (r.filterCreated)    extras.push(i18n.t('resultFilter'));
    if (r.archiveError)     extras.push(i18n.f('resultArchiveErr', r.archiveError));
    if (r.filterError)      extras.push(i18n.f('resultFilterErr', r.filterError));
    const detailText = [r.detail, ...extras].filter(Boolean).join(' · ');
    item.innerHTML = `
      <span class="result-status">${icon}</span>
      <div class="result-body">
        <span class="result-sender">${escapeHtml(r.displayName || r.email)}</span>
        ${detailText ? `<span class="result-detail">${escapeHtml(detailText)}</span>` : ''}
      </div>
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

function langLocale() {
  return { sk: 'sk-SK', cs: 'cs-CZ', en: 'en-US' }[i18n.lang] || 'sk-SK';
}

function formatLastDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return i18n.t('dateToday');
  if (diffDays === 1) return i18n.t('dateYesterday');
  if (diffDays < 7)  return i18n.f('dateDaysAgo', diffDays);
  return d.toLocaleDateString(langLocale(), { day: 'numeric', month: 'short' });
}

function updateScanDateLabel() {
  if (!state.scanDate) { scanDateLabel.textContent = ''; return; }
  const d = new Date(state.scanDate);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  scanDateLabel.textContent = i18n.t('scanDatePrefix') + (sameDay
    ? d.toLocaleTimeString(langLocale(), { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(langLocale(), { day: 'numeric', month: 'short' }));
}

// ── Event handlers ──────────────────────────────────────────────────────────

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

btnLogin.addEventListener('click', async () => {
  btnLogin.disabled    = true;
  btnLogin.textContent = i18n.t('btnLoginLoading');
  authStatus.classList.add('hidden');

  try {
    const resp = await chrome.runtime.sendMessage({ type: 'LOGIN' });
    if (resp?.error) throw new Error(resp.error);
    state.loggedIn  = true;
    state.userEmail = resp.email || null;
    renderAuth();
    welcomeState.style.display = 'flex';
  } catch (err) {
    console.error('[Panel] Login error:', err);
    authStatus.textContent = i18n.t('errorPrefix') + err.message;
    authStatus.classList.remove('hidden');
  } finally {
    btnLogin.disabled    = false;
    btnLogin.textContent = i18n.t('btnLoginLabel');
  }
});

btnLogout.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  state.loggedIn  = false;
  state.userEmail = null;
  state.senders   = [];
  state.filtered  = [];
  state.selected.clear();
  state.unsubLog  = {};
  state.scanDate  = null;
  senderList.innerHTML = '';
  toolbar.style.display = 'none';
  statsBar.classList.add('hidden');
  welcomeState.style.display = 'none';
  emptyState.style.display   = 'none';
  unsubSection.classList.add('hidden');
  resultsSection.style.display = 'none';
  renderAuth();
});

btnScan.addEventListener('click', async () => {
  console.log('[Panel] Scan clicked');
  state.senders  = [];
  state.filtered = [];
  state.selected.clear();
  senderList.innerHTML = '';
  welcomeState.style.display   = 'none';
  emptyState.style.display     = 'none';
  unsubSection.classList.add('hidden');
  resultsSection.style.display = 'none';
  toolbar.style.display        = 'none';
  statsBar.classList.add('hidden');

  btnScan.disabled = true;
  btnAbort.classList.remove('hidden');
  showProgress(true);
  setProgress(0, i18n.t('scanStarting'));

  const resp = await chrome.runtime.sendMessage({ type: 'SCAN', lang: i18n.lang });
  if (resp?.error) {
    setProgress(0, i18n.t('errorPrefix') + resp.error);
    btnScan.disabled = false;
    btnAbort.classList.add('hidden');
  }
});

btnAbort.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'ABORT_SCAN' });
  btnAbort.classList.add('hidden');
});

btnUnsub.addEventListener('click', () => {
  const selectedSenders = state.senders.filter(s => state.selected.has(s.email));
  if (selectedSenders.length === 0) return;

  modalSummary.textContent = i18n.f('modalSummary', selectedSenders.length);

  modalList.innerHTML = '';
  for (const s of selectedSenders) {
    const li = document.createElement('div');
    li.className = 'modal-list-item';
    const methodLabel = {
      'one-click': i18n.t('methodPost'),
      mailto:      i18n.t('methodEmail'),
      manual:      i18n.t('methodManual'),
    }[s.unsubType] || '?';
    li.innerHTML = `
      <span>${escapeHtml(s.displayName || s.email)}</span>
      <span style="color:var(--text-2);font-size:11px">${methodLabel}</span>
    `;
    modalList.appendChild(li);
  }

  modalOverlay.classList.add('visible');
});

$('btn-info').addEventListener('click', () => infoOverlay.classList.add('visible'));
btnInfoClose.addEventListener('click', () => infoOverlay.classList.remove('visible'));
infoOverlay.addEventListener('click', (e) => { if (e.target === infoOverlay) infoOverlay.classList.remove('visible'); });

modalCancel.addEventListener('click', () => modalOverlay.classList.remove('visible'));

modalConfirm.addEventListener('click', async () => {
  modalOverlay.classList.remove('visible');
  const senders   = state.senders.filter(s => state.selected.has(s.email));
  const doArchive = optArchive.checked;
  const doFilter  = optFilter.checked;
  showProgress(true);
  setProgress(0, i18n.t('unsubStarting'));
  btnUnsub.disabled = true;

  const resp = await chrome.runtime.sendMessage({
    type: 'UNSUBSCRIBE', senders, doArchive, doFilter, lang: i18n.lang,
  });
  if (resp?.error) {
    setProgress(0, i18n.t('errorPrefix') + resp.error);
    btnUnsub.disabled = false;
  }
});

btnBack.addEventListener('click', () => {
  resultsSection.style.display = 'none';
  state.selected.clear();
  renderStats();
  renderSenderList();
  btnUnsub.disabled = false;
});

searchInput.addEventListener('input', () => renderSenderList());

selectAllCheckbox.addEventListener('change', () => {
  const selectable = state.filtered.filter(s => !state.unsubLog[s.email]);
  if (selectAllCheckbox.checked) selectable.forEach(s => state.selected.add(s.email));
  else                           selectable.forEach(s => state.selected.delete(s.email));
  renderSenderList();
});

// ── Service worker push messages ────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'SCAN_PROGRESS':
      setProgress(message.pct, message.label);
      break;

    case 'SCAN_DONE':
      state.senders  = message.senders || [];
      state.unsubLog = message.unsubLog || state.unsubLog;
      state.scanDate = Date.now();
      state.filtered = [...state.senders];
      state.selected.clear();
      btnScan.disabled = false;
      btnAbort.classList.add('hidden');
      showProgress(false);
      updateScanDateLabel();
      renderStats();
      renderSenderList();
      break;

    case 'SCAN_ERROR':
      btnScan.disabled = false;
      btnAbort.classList.add('hidden');
      setProgress(0, i18n.t('errorPrefix') + message.error);
      console.error('[Panel] Scan error:', message.error);
      break;

    case 'UNSUBSCRIBE_PROGRESS':
      setProgress(message.pct, message.label);
      break;

    case 'UNSUBSCRIBE_DONE':
      state.unsubLog = message.unsubLog || state.unsubLog;
      showProgress(false);
      showResults(message.results);
      break;
  }
});

// ── Init ────────────────────────────────────────────────────────────────────

async function init() {
  const stored = await chrome.storage.local.get(LANG_STORAGE_KEY);
  const savedLang = stored[LANG_STORAGE_KEY];
  if (savedLang && LANGS.includes(savedLang)) {
    i18n.lang = savedLang;
    document.documentElement.lang = savedLang;
  }
  applyStrings();

  const resp = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });

  if (resp?.loggedIn) {
    state.loggedIn  = true;
    state.userEmail = resp.email || null;
    state.unsubLog  = resp.unsubLog || {};

    if (resp.scanCache?.senders?.length) {
      state.senders  = resp.scanCache.senders;
      state.scanDate = resp.scanCache.scannedAt;
      state.filtered = [...state.senders];
      updateScanDateLabel();
      renderStats();
      renderSenderList();
    } else {
      welcomeState.style.display = 'flex';
    }
  }

  renderAuth();
  console.log('[Panel] initialized, lang:', i18n.lang, 'loggedIn:', state.loggedIn);
}

init();
