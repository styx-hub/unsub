// All panel UI strings in SK / CS / EN.

const STRINGS = {
  sk: {
    btnInfoTitle:   'Pomocník',
    btnLogoutTitle: 'Odhlásiť sa',

    onboardingHeading:  'Uprac si schránku',
    onboardingSubtitle: 'Nájdeme všetky newslettre v tvojom Gmaili a odhlásime ťa jedným klikom.',
    step1Title: 'Prihlásiť sa',
    step1Sub:   'cez Google účet',
    step2Title: 'Skenovať',
    step2Sub:   'prehľadáme schránku',
    step3Title: 'Odhlásiť',
    step3Sub:   'jedným klikom',
    btnLoginLabel:   'Prihlásiť sa cez Google',
    btnLoginLoading: 'Prihlasujem…',

    btnScan:       'Skenovať',
    btnAbort:      'Zastaviť',
    scanStarting:  'Spúšťam skenovanie…',
    unsubStarting: 'Odhlašujem…',

    statFoundLabel:    'nájdených',
    statUnsubbedLabel: 'odhlásených',

    searchPlaceholder: 'Hľadať odosielateľa…',
    selectAll:         'Vybrať všetkých',
    selectedCount:     (n) => `${n} vybraných`,

    badgeOneClick: '🟢 One-click',
    badgeEmail:    '✉️ Email',
    badgeManual:   '⚠️ Manuálne',
    badgeUnsubbed: (date) => `✓ Odhlásené ${date}`,
    msgCount:      (n) => `${n} správ`,

    dateToday:     'dnes',
    dateYesterday: 'včera',
    dateDaysAgo:   (n) => `pred ${n} dňami`,
    scanDatePrefix:'Posledný sken: ',

    welcomeTitle: 'Pripravený na sken',
    welcomeText:  'Klikni na „Skenovať" a nájdeme všetky newslettre, z ktorých sa môžeš odhlásiť.',
    emptyTitle:   'Žiadne newslettre',
    emptyText:    'V schránke sme nenašli žiadne newslettre s možnosťou odhlásenia.',
    emptyHint:    'Skús spustiť skenovanie znova.',

    btnUnsub:  'Odhlásiť vybrané',
    btnUnsubN: (n) => `Odhlásiť vybrané (${n})`,

    resultsTitle: 'Výsledky odhlásenia',
    btnBack:      '← Späť na zoznam',

    resultArchived:   (n) => `${n} mailov archivovaných`,
    resultFilter:     'filter vytvorený',
    resultArchiveErr: (e) => `archivácia: ${e}`,
    resultFilterErr:  (e) => `filter: ${e}`,

    methodPost:   'POST',
    methodEmail:  'Email',
    methodManual: 'Manuálne',

    modalTitle:      'Potvrdiť odhlásenie',
    modalSummary:    (n) => `Naozaj chceš odhlásiť ${n} odosielateľ${n === 1 ? 'a' : 'ov'}?`,
    optArchiveLabel: 'Archivovať existujúce maily',
    optArchiveSub:   'Odstráni maily od týchto odosielateľov z doručenej pošty',
    optFilterLabel:  'Vytvoriť filter',
    optFilterSub:    'Budúce maily automaticky preskočia doručenú poštu',
    btnCancel:       'Zrušiť',
    btnConfirm:      'Potvrdiť odhlásenie',

    infoTitle:         'Ako to funguje',
    infoDemoLabel:     'Ukážkový záznam',
    infoDemoName:      'Názov odosielateľa',
    infoDemoEmail:     'newsletter@priklad.sk',
    annotAvatar:       'Farebný avatar — prvé písmeno mena',
    annotBadge:        'Badge — typ odhlásenia (viď nižšie)',
    annotCount:        'Počet správ od tohto odosielateľa',
    annotDate:         'Dátum posledného prijatého mailu',
    infoBadgesLabel:   'Typy odhlásenia',
    badgeOneClickDesc: 'Automatické — odošle sa POST požiadavka priamo z rozšírenia. Najrýchlejší spôsob.',
    badgeMailtoDesc:   'Odhlasovací email sa odošle cez tvoj Gmail. Môže trvať 1–10 dní kým odosielateľ spracuje.',
    badgeManualDesc:   'Otvorí sa stránka odosielateľa v novej karte — odhlásenie dokončíš ty ručne.',
    infoHowLabel:      'Ako sa odhlásiť',
    infoStep1:         'Zaškrtni newslettre, z ktorých sa chceš odhlásiť',
    infoStep2:         'Klikni na tlačidlo <strong>Odhlásiť vybrané</strong> v spodnej lište',
    infoStep3:         'V potvrdzovacom okne skontroluj zoznam a vyber doplnkové možnosti',
    infoStep4:         'Klikni <strong>Potvrdiť odhlásenie</strong>',
    infoOptionsLabel:  'Možnosti pri odhlásení',
    infoArchiveTitle:  '📦 Archivovať existujúce maily',
    infoArchiveText:   'Presunie všetky doterajšie maily od vybraných odosielateľov z doručenej pošty do archívu. V Gmaili ich stále nájdeš cez vyhľadávanie, ale nebudú ti „prekážať" v inboxe.',
    infoFilterTitle:   '🔕 Vytvoriť filter',
    infoFilterText:    'Vytvorí pravidlo v Gmaile: budúce maily od tohto odosielateľa automaticky preskočia doručenú poštu. Užitočné ak odosielateľ ignoruje odhlásenie.',
    infoExpectLabel:   'Čo očakávať',
    infoExpectText:    'Odhlásenie väčšinou trvá <strong>1–10 pracovných dní</strong>. Niektorí odosielatelia ho spracujú okamžite, iní môžu trvať dlhšie. Ak maily stále prichádzajú po týždni, použi možnosť <em>Vytvoriť filter</em>.',

    errorPrefix: 'Chyba: ',
  },

  cs: {
    btnInfoTitle:   'Nápověda',
    btnLogoutTitle: 'Odhlásit se',

    onboardingHeading:  'Ukliď si schránku',
    onboardingSubtitle: 'Najdeme všechny newslettery ve tvém Gmailu a odhlásíme tě jedním klikem.',
    step1Title: 'Přihlásit se',
    step1Sub:   'přes Google účet',
    step2Title: 'Skenovat',
    step2Sub:   'prohledáme schránku',
    step3Title: 'Odhlásit',
    step3Sub:   'jedním klikem',
    btnLoginLabel:   'Přihlásit se přes Google',
    btnLoginLoading: 'Přihlašuji…',

    btnScan:       'Skenovat',
    btnAbort:      'Zastavit',
    scanStarting:  'Spouštím skenování…',
    unsubStarting: 'Odhlašuji…',

    statFoundLabel:    'nalezeno',
    statUnsubbedLabel: 'odhlášeno',

    searchPlaceholder: 'Hledat odesílatele…',
    selectAll:         'Vybrat vše',
    selectedCount:     (n) => `${n} vybráno`,

    badgeOneClick: '🟢 One-click',
    badgeEmail:    '✉️ Email',
    badgeManual:   '⚠️ Ručně',
    badgeUnsubbed: (date) => `✓ Odhlášeno ${date}`,
    msgCount:      (n) => `${n} zpráv`,

    dateToday:     'dnes',
    dateYesterday: 'včera',
    dateDaysAgo:   (n) => `před ${n} dny`,
    scanDatePrefix:'Poslední sken: ',

    welcomeTitle: 'Připraveno ke skenování',
    welcomeText:  'Klikni na „Skenovat" a najdeme všechny newslettery, ze kterých se můžeš odhlásit.',
    emptyTitle:   'Žádné newslettery',
    emptyText:    'Ve schránce jsme nenašli žádné newslettery s možností odhlášení.',
    emptyHint:    'Zkus spustit skenování znovu.',

    btnUnsub:  'Odhlásit vybrané',
    btnUnsubN: (n) => `Odhlásit vybrané (${n})`,

    resultsTitle: 'Výsledky odhlášení',
    btnBack:      '← Zpět na seznam',

    resultArchived:   (n) => `${n} mailů archivováno`,
    resultFilter:     'filtr vytvořen',
    resultArchiveErr: (e) => `archivace: ${e}`,
    resultFilterErr:  (e) => `filtr: ${e}`,

    methodPost:   'POST',
    methodEmail:  'Email',
    methodManual: 'Ručně',

    modalTitle:      'Potvrdit odhlášení',
    modalSummary:    (n) => `Opravdu chceš odhlásit ${n} odesílatel${n === 1 ? 'e' : 'ů'}?`,
    optArchiveLabel: 'Archivovat existující maily',
    optArchiveSub:   'Odstraní maily od těchto odesílatelů z doručené pošty',
    optFilterLabel:  'Vytvořit filtr',
    optFilterSub:    'Budoucí maily automaticky přeskočí doručenou poštu',
    btnCancel:       'Zrušit',
    btnConfirm:      'Potvrdit odhlášení',

    infoTitle:         'Jak to funguje',
    infoDemoLabel:     'Ukázkový záznam',
    infoDemoName:      'Název odesílatele',
    infoDemoEmail:     'newsletter@priklad.cz',
    annotAvatar:       'Barevný avatar — první písmeno jména',
    annotBadge:        'Badge — typ odhlášení (viz níže)',
    annotCount:        'Počet zpráv od tohoto odesílatele',
    annotDate:         'Datum posledního přijatého mailu',
    infoBadgesLabel:   'Typy odhlášení',
    badgeOneClickDesc: 'Automatické — odešle se POST požadavek přímo z rozšíření. Nejrychlejší způsob.',
    badgeMailtoDesc:   'Odhlašovací email se odešle přes tvůj Gmail. Může trvat 1–10 dní, než odesílatel zpracuje.',
    badgeManualDesc:   'Otevře se stránka odesílatele v nové kartě — odhlášení dokončíš ručně.',
    infoHowLabel:      'Jak se odhlásit',
    infoStep1:         'Zaškrtni newslettery, ze kterých se chceš odhlásit',
    infoStep2:         'Klikni na tlačítko <strong>Odhlásit vybrané</strong> ve spodní liště',
    infoStep3:         'V potvrzovacím okně zkontroluj seznam a vyber doplňkové možnosti',
    infoStep4:         'Klikni <strong>Potvrdit odhlášení</strong>',
    infoOptionsLabel:  'Možnosti při odhlášení',
    infoArchiveTitle:  '📦 Archivovat existující maily',
    infoArchiveText:   'Přesune všechny dosavadní maily od vybraných odesílatelů z doručené pošty do archivu. V Gmailu je stále najdeš přes vyhledávání, ale nebudou ti „překážet" v doručené poště.',
    infoFilterTitle:   '🔕 Vytvořit filtr',
    infoFilterText:    'Vytvoří pravidlo v Gmailu: budoucí maily od tohoto odesílatele automaticky přeskočí doručenou poštu. Užitečné pokud odesílatel ignoruje odhlášení.',
    infoExpectLabel:   'Co očekávat',
    infoExpectText:    'Odhlášení většinou trvá <strong>1–10 pracovních dní</strong>. Někteří odesílatelé ho zpracují okamžitě, jiní mohou trvat déle. Pokud maily stále přicházejí po týdnu, použij možnost <em>Vytvořit filtr</em>.',

    errorPrefix: 'Chyba: ',
  },

  en: {
    btnInfoTitle:   'Help',
    btnLogoutTitle: 'Log out',

    onboardingHeading:  'Clean up your inbox',
    onboardingSubtitle: "We'll find all newsletters in your Gmail and unsubscribe you with one click.",
    step1Title: 'Sign in',
    step1Sub:   'with your Google account',
    step2Title: 'Scan',
    step2Sub:   "we'll scan your inbox",
    step3Title: 'Unsubscribe',
    step3Sub:   'with one click',
    btnLoginLabel:   'Sign in with Google',
    btnLoginLoading: 'Signing in…',

    btnScan:       'Scan',
    btnAbort:      'Stop',
    scanStarting:  'Starting scan…',
    unsubStarting: 'Unsubscribing…',

    statFoundLabel:    'found',
    statUnsubbedLabel: 'unsubscribed',

    searchPlaceholder: 'Search sender…',
    selectAll:         'Select all',
    selectedCount:     (n) => `${n} selected`,

    badgeOneClick: '🟢 One-click',
    badgeEmail:    '✉️ Email',
    badgeManual:   '⚠️ Manual',
    badgeUnsubbed: (date) => `✓ Unsubscribed ${date}`,
    msgCount:      (n) => `${n} messages`,

    dateToday:     'today',
    dateYesterday: 'yesterday',
    dateDaysAgo:   (n) => `${n} days ago`,
    scanDatePrefix:'Last scan: ',

    welcomeTitle: 'Ready to scan',
    welcomeText:  'Click "Scan" to find all newsletters you can unsubscribe from.',
    emptyTitle:   'No newsletters',
    emptyText:    "We didn't find any newsletters with an unsubscribe option in your inbox.",
    emptyHint:    'Try running a scan again.',

    btnUnsub:  'Unsubscribe selected',
    btnUnsubN: (n) => `Unsubscribe selected (${n})`,

    resultsTitle: 'Unsubscribe results',
    btnBack:      '← Back to list',

    resultArchived:   (n) => `${n} emails archived`,
    resultFilter:     'filter created',
    resultArchiveErr: (e) => `archive: ${e}`,
    resultFilterErr:  (e) => `filter: ${e}`,

    methodPost:   'POST',
    methodEmail:  'Email',
    methodManual: 'Manual',

    modalTitle:      'Confirm unsubscribe',
    modalSummary:    (n) => `Unsubscribe from ${n} sender${n === 1 ? '' : 's'}?`,
    optArchiveLabel: 'Archive existing emails',
    optArchiveSub:   'Removes emails from these senders from your inbox',
    optFilterLabel:  'Create a filter',
    optFilterSub:    'Future emails will automatically skip your inbox',
    btnCancel:       'Cancel',
    btnConfirm:      'Confirm unsubscribe',

    infoTitle:         'How it works',
    infoDemoLabel:     'Sample entry',
    infoDemoName:      'Sender name',
    infoDemoEmail:     'newsletter@example.com',
    annotAvatar:       'Colored avatar — first letter of name',
    annotBadge:        'Badge — unsubscribe type (see below)',
    annotCount:        'Number of messages from this sender',
    annotDate:         'Date of last received email',
    infoBadgesLabel:   'Unsubscribe types',
    badgeOneClickDesc: 'Automatic — sends a POST request directly from the extension. Fastest method.',
    badgeMailtoDesc:   'An unsubscribe email is sent via your Gmail. May take 1–10 days for the sender to process.',
    badgeManualDesc:   "Opens the sender's page in a new tab — you complete the unsubscription manually.",
    infoHowLabel:      'How to unsubscribe',
    infoStep1:         'Check the newsletters you want to unsubscribe from',
    infoStep2:         'Click <strong>Unsubscribe selected</strong> in the bottom bar',
    infoStep3:         'In the confirmation dialog, review the list and choose additional options',
    infoStep4:         'Click <strong>Confirm unsubscribe</strong>',
    infoOptionsLabel:  'Options during unsubscribe',
    infoArchiveTitle:  '📦 Archive existing emails',
    infoArchiveText:   "Moves all existing emails from selected senders out of your inbox into the archive. You can still find them in Gmail search, but they won't clutter your inbox.",
    infoFilterTitle:   '🔕 Create a filter',
    infoFilterText:    "Creates a Gmail filter: future emails from this sender will automatically skip your inbox. Useful if the sender ignores the unsubscribe request.",
    infoExpectLabel:   'What to expect',
    infoExpectText:    'Unsubscribing usually takes <strong>1–10 business days</strong>. Some senders process it immediately, others may take longer. If emails keep coming after a week, use the <em>Create a filter</em> option.',

    errorPrefix: 'Error: ',
  },
};

export const LANGS = ['sk', 'cs', 'en'];
export const LANG_DEFAULT = 'sk';
export const LANG_STORAGE_KEY = 'preferred_lang';

export const i18n = {
  lang: LANG_DEFAULT,
  _s() { return STRINGS[this.lang] || STRINGS[LANG_DEFAULT]; },
  t(key) {
    const v = this._s()[key];
    if (typeof v === 'string') return v;
    const fb = STRINGS[LANG_DEFAULT][key];
    return typeof fb === 'string' ? fb : key;
  },
  f(key, ...args) {
    const v = this._s()[key];
    if (typeof v === 'function') return v(...args);
    const fb = STRINGS[LANG_DEFAULT][key];
    return typeof fb === 'function' ? fb(...args) : key;
  },
};
