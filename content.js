// This script runs on all pages and tries to find common cookie banners
// and click the appropriate button based on user preferences.

const selectors = {
  acceptAll: [
    // OneTrust
    '#onetrust-accept-btn-handler',
    // Cookiebot
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    // Didomi
    '#didomi-notice-agree-button',
    // Quantcast
    '.qc-cmp2-b-right[mode="primary"]',
    // Civic UK
    '#ccc-notify-accept',
    // CookieYes
    '.cky-btn-accept',
    // Generic
    'button[id*="accept-all"]',
    'button[class*="accept-all"]',
    'button[id*="allow-all"]',
    'button[class*="allow-all"]',
    'button[id*="accept-cookies"]',
    'button[class*="accept-cookies"]',
    'a[id*="accept-all"]',
    'a[class*="accept-all"]',
    '[aria-label*="accept all" i]'
  ],
  rejectAll: [
    // Cookiebot
    '#CybotCookiebotDialogBodyButtonDecline',
    // Didomi
    '#didomi-notice-learn-more-button', // Usually opens modal or rejects
    // Quantcast
    '.qc-cmp2-b-right[mode="secondary"]',
    // Civic UK
    '#ccc-reject-settings',
    // CookieYes
    '.cky-btn-reject',
    // Generic
    'button[id*="reject-all"]',
    'button[class*="reject-all"]',
    'button[id*="deny-all"]',
    'button[class*="deny-all"]',
    'button[id*="reject-cookies"]',
    'button[class*="reject-cookies"]',
    'a[id*="reject-all"]',
    'a[class*="reject-all"]',
    '[aria-label*="reject all" i]'
  ]
};

// Complex banners often hide "Reject All" or "Confirm Choices" behind a settings button
const settingsSelectors = [
  '#onetrust-pc-btn-handler', // OneTrust Manage Preferences
  '#didomi-notice-learn-more-button', // Didomi Learn More
  '.qc-cmp2-b-right[mode="secondary"]', // Quantcast More Options
  '#ccc-module-settings-button', // Civic UK Settings
  '.cky-btn-customize', // CookieYes Customize
  'button[class*="cookie-setting"]',
  'button[class*="manage-cookie"]',
  'button[id*="cookie-setting"]',
  'button[id*="manage-cookie"]',
  'a[class*="cookie-setting"]',
  'a[class*="manage-cookie"]'
];

const confirmChoicesSelectors = [
  '.save-preference-btn-handler', // OneTrust Confirm Choices
  '.ot-pc-refuse-all-handler', // OneTrust Reject All inside modal
  '#didomi-consent-popup-save-button', // Didomi Save
  '.qc-cmp2-b-right[mode="primary"]', // Quantcast Save in modal
  '#ccc-dismiss-button', // Civic UK Save
  '.cky-btn-preferences', // CookieYes Save Preferences
  'button[id*="save-consent"]',
  'button[class*="save-consent"]'
];

const bannerContainers = [
  '#onetrust-banner-sdk',
  '#CybotCookiebotDialog',
  '#didomi-host',
  '.qc-cmp2-container',
  '#ccc-module',
  '.cky-consent-container', // CookieYes
  '.cookie-banner',
  '.cookie-notice',
  '#cookie-notice',
  '#cookie-banner',
  '[class*="cookie-banner"]',
  '[class*="cookie-popup"]',
  '[id*="cookie-banner"]'
];

// Multi-language text patterns
const textPatterns = {
  acceptAll: [
    'accept all', 'allow all', 'accept cookies', 'i accept', 'ok, proceed', // English
    'alles akzeptieren', 'alle akzeptieren', 'zustimmen', // German
    'tout accepter', 'accepter tout', 'accepter', // French
    'aceptar todo', 'aceptar todas', 'aceptar', // Spanish
    'accetta tutto', 'accetta', 'acconsento' // Italian
  ],
  rejectAll: [
    'reject all', 'decline all', 'necessary only', 'reject cookies', 'deny all', 'continue without accepting', // English
    'alle ablehnen', 'alles ablehnen', 'nur notwendige', 'ablehnen', // German
    'tout refuser', 'refuser tout', 'continuer sans accepter', 'refuser', // French
    'rechazar todo', 'rechazar todas', 'solo necesarias', 'rechazar', // Spanish
    'rifiuta tutto', 'rifiuta', 'solo necessari' // Italian
  ],
  settings: [
    'manage preferences', 'cookie settings', 'customize', 'show purposes', 'learn more', // English
    'einstellungen', 'präferenzen', 'mehr erfahren', // German
    'paramètres', 'personnaliser', 'en savoir plus', // French
    'configuración', 'preferencias', 'saber más', // Spanish
    'impostazioni', 'preferenze', 'scopri di più' // Italian
  ],
  confirm: [
    'confirm my choices', 'save preferences', 'save settings', 'confirm choices', // English
    'auswahl bestätigen', 'einstellungen speichern', // German
    'confirmer', 'enregistrer', // French
    'guardar preferencias', 'confirmar', // Spanish
    'conferma scelte', 'salva preferenze' // Italian
  ]
};

// Simple contains polyfill since querySelector doesn't support :contains
function findElementByText(tag, patterns) {
  const elements = document.querySelectorAll(tag);
  for (const el of elements) {
    const text = el.textContent.trim().toLowerCase();
    // Ignore elements with too much text (likely not buttons)
    if (text.length > 50) continue; 
    
    for (const pattern of patterns) {
      if (text === pattern || text.includes(pattern)) {
        return el;
      }
    }
  }
  return null;
}

function showSuccessToast(action, settings) {
  if (settings.silentMode) return;

  const toast = document.createElement('div');
  const actionText = action === 'acceptAll' ? 'Accepted' : 'Rejected';
  toast.innerHTML = `🍪 <strong>Cookie Banner Handled</strong><br><span style="font-size: 11px;">Automatically ${actionText}</span>`;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #3567cc; /* Strong blue matching icon */
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(53, 103, 204, 0.3);
    z-index: 2147483647;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    pointer-events: none;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => { toast.style.opacity = '1'; }, 10);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.remove(); }, 300);
  }, 3000);
}

function updateStats() {
  chrome.storage.sync.get(['bannersClicked'], (result) => {
    const currentCount = result.bannersClicked || 0;
    chrome.storage.sync.set({ bannersClicked: currentCount + 1 });
  });
}

function notifyBackgroundOfForcedAccept() {
  chrome.runtime.sendMessage({ action: "recordForcedAccept", hostname: window.location.hostname });
}

function heuristicFindButton(preference) {
  // Find all visible buttons
  const buttons = Array.from(document.querySelectorAll('button, a[role="button"]')).filter(isElementVisible);
  if (buttons.length === 0) return null;

  // Group buttons by their container to find the main action bar
  // Often banners have a primary and secondary button grouped together
  for (const btn of buttons) {
    if (preference === 'rejectAll') {
      // Look for buttons that might be secondary (often reject or settings)
      const isSecondaryClass = /secondary|outline|muted|ghost|link|reject|decline/i.test(btn.className);
      if (isSecondaryClass) {
        return btn;
      }
    } else {
      // Look for primary buttons
      const isPrimaryClass = /primary|main|accept|allow|solid/i.test(btn.className);
      if (isPrimaryClass) {
        return btn;
      }
    }
  }
  return null;
}

function findAndClickButton(preference) {
  // 1. Check for complex banners if preference is rejectAll
  if (preference === 'rejectAll') {
    // First, check if we are already inside a modal with a confirm/save button
    for (const selector of confirmChoicesSelectors) {
      const confirmBtn = document.querySelector(selector);
      if (confirmBtn && isElementVisible(confirmBtn)) {
        console.log(`[Cookie Consent] Clicking confirm/reject inside modal: ${selector}`);
        confirmBtn.click();
        return true;
      }
    }

    // Text-based confirm buttons inside modal
    const el = findElementByText('button', textPatterns.confirm) || findElementByText('a', textPatterns.confirm);
    if (el && isElementVisible(el)) {
      console.log(`[Cookie Consent] Clicking text-based confirm inside modal: "${el.textContent.trim()}"`);
      el.click();
      return true;
    }

    // Try to open the modal via "Manage Preferences"
    for (const selector of settingsSelectors) {
      const settingsBtn = document.querySelector(selector);
      if (settingsBtn && isElementVisible(settingsBtn)) {
        console.log(`[Cookie Consent] Opening settings modal: ${selector}`);
        settingsBtn.click();
        return false; // Wait for mutation observer to catch the new modal
      }
    }
    
    const settingsEl = findElementByText('button', textPatterns.settings) || findElementByText('a', textPatterns.settings);
    if (settingsEl && isElementVisible(settingsEl)) {
       console.log(`[Cookie Consent] Opening text-based settings modal: "${settingsEl.textContent.trim()}"`);
       settingsEl.click();
       return false;
    }
  }

  // 2. Standard flow (Direct Accept All or Direct Reject All)
  const targetSelectors = preference === 'acceptAll' ? selectors.acceptAll : selectors.rejectAll;
  
  // Try standard selectors first
  for (const selector of targetSelectors) {
    const el = document.querySelector(selector);
    if (el && isElementVisible(el)) {
      console.log(`[Cookie Consent] Clicking element matching selector: ${selector}`);
      el.click();
      return true;
    }
  }

  // Try text-based matching if standard selectors failed
  const targetTextPatterns = preference === 'acceptAll' ? textPatterns.acceptAll : textPatterns.rejectAll;
  const tags = ['button', 'a', 'div', 'span'];
  for (const tag of tags) {
    const el = findElementByText(tag, targetTextPatterns);
    if (el && isElementVisible(el)) {
      console.log(`[Cookie Consent] Clicking element matching text in tag <${tag}>: "${el.textContent.trim()}"`);
      el.click();
      return true;
    }
  }

  // 3. Fallback Heuristics
  const heuristicBtn = heuristicFindButton(preference);
  if (heuristicBtn) {
    console.log(`[Cookie Consent] Clicking element via heuristics (Classes: ${heuristicBtn.className})`);
    heuristicBtn.click();
    return true;
  }

  return false;
}

function executeNukeMode() {
  let nuked = false;
  for (const selector of bannerContainers) {
    const el = document.querySelector(selector);
    if (el && isElementVisible(el)) {
      el.style.setProperty('display', 'none', 'important');
      nuked = true;
      console.log(`[Cookie Consent] Nuked banner container: ${selector}`);
    }
  }
  
  // Clean up overflow on body if we nuked something
  if (nuked || document.body.style.overflow === 'hidden') {
    document.body.style.setProperty('overflow', 'auto', 'important');
  }
  return nuked;
}

function isElementVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0 && el.offsetHeight > 0;
}

function handleCookieBanners() {
  chrome.storage.sync.get(['cookiePreference', 'whitelist', 'silentMode', 'nukeMode', 'autoClear', 'extensionDisabled'], (settings) => {
    // Check if extension is globally disabled
    if (settings.extensionDisabled) {
      console.log(`[Cookie Consent] Extension is globally disabled.`);
      return;
    }

    const whitelist = settings.whitelist || [];
    if (whitelist.includes(window.location.hostname)) {
      console.log(`[Cookie Consent] Extension disabled on this site via whitelist.`);
      return;
    }

    const pref = settings.cookiePreference || 'rejectAll';
    const clicked = findAndClickButton(pref);
    
    if (clicked) {
      console.log(`[Cookie Consent] Automatically handled banner with preference: ${pref}`);
      updateStats();
      showSuccessToast(pref, settings);
      
      if (pref === 'acceptAll' && settings.autoClear) {
        notifyBackgroundOfForcedAccept();
      }
    } else {
      // If not found immediately, observe DOM changes (SPAs, lazy-loaded banners)
      observeDOM(pref, settings);
    }
  });
}

function observeDOM(pref, settings) {
  let attempts = 0;
  const maxAttempts = 15; // Increased to give modals more time
  let hasSucceeded = false;
  
  const observer = new MutationObserver((mutations, obs) => {
    if (hasSucceeded) return;
    
    const clicked = findAndClickButton(pref);
    if (clicked) {
      hasSucceeded = true;
      console.log(`[Cookie Consent] Automatically handled banner with preference: ${pref} (via observer)`);
      updateStats();
      showSuccessToast(pref, settings);
      
      if (pref === 'acceptAll' && settings.autoClear) {
        notifyBackgroundOfForcedAccept();
      }
      obs.disconnect();
    } else if (attempts >= maxAttempts) {
      obs.disconnect();
      if (settings.nukeMode !== false) { // Defaults to true
        const nuked = executeNukeMode();
        if (nuked && !settings.silentMode) {
           // Provide feedback that nuke mode worked
           showSuccessToast('nuked (Visual Hide)', settings);
        }
      }
    }
    attempts++;
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Fallback timeout
  setTimeout(() => {
    observer.disconnect();
    if (!hasSucceeded && settings.nukeMode !== false) {
      executeNukeMode();
    }
  }, 10000);
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleCookieBanners);
} else {
  handleCookieBanners();
}
// Also run after a short delay for heavily dynamic sites
setTimeout(handleCookieBanners, 2000);
