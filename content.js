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
    // Generic
    'button[id*="accept-all"]',
    'button[class*="accept-all"]',
    'button[id*="allow-all"]',
    'button[class*="allow-all"]',
    'button[id*="accept-cookies"]',
    'button[class*="accept-cookies"]',
    'a[id*="accept-all"]',
    'a[class*="accept-all"]',
    '[aria-label*="accept all" i]',
    'button:contains("Accept All")',
    'button:contains("Accept all")',
    'button:contains("Allow All")'
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
    // Generic
    'button[id*="reject-all"]',
    'button[class*="reject-all"]',
    'button[id*="deny-all"]',
    'button[class*="deny-all"]',
    'button[id*="reject-cookies"]',
    'button[class*="reject-cookies"]',
    'a[id*="reject-all"]',
    'a[class*="reject-all"]',
    '[aria-label*="reject all" i]',
    'button:contains("Reject All")',
    'button:contains("Reject all")',
    'button:contains("Decline All")',
    'button:contains("Necessary Only")'
  ]
};

// Complex banners often hide "Reject All" or "Confirm Choices" behind a settings button
const settingsSelectors = [
  '#onetrust-pc-btn-handler', // OneTrust Manage Preferences
  '#didomi-notice-learn-more-button', // Didomi Learn More
  '.qc-cmp2-b-right[mode="secondary"]', // Quantcast More Options
  '#ccc-module-settings-button', // Civic UK Settings
  'button[class*="cookie-setting"]',
  'button[class*="manage-cookie"]',
  'button[id*="cookie-setting"]',
  'button[id*="manage-cookie"]',
  'a[class*="cookie-setting"]',
  'a[class*="manage-cookie"]',
  'button:contains("Manage Preferences")',
  'button:contains("Cookie Settings")',
  'button:contains("Customize")'
];

const confirmChoicesSelectors = [
  '.save-preference-btn-handler', // OneTrust Confirm Choices
  '.ot-pc-refuse-all-handler', // OneTrust Reject All inside modal
  '#didomi-consent-popup-save-button', // Didomi Save
  '.qc-cmp2-b-right[mode="primary"]', // Quantcast Save in modal
  '#ccc-dismiss-button', // Civic UK Save
  'button[id*="save-consent"]',
  'button[class*="save-consent"]',
  'button:contains("Confirm My Choices")',
  'button:contains("Save Preferences")',
  'button:contains("Save Settings")',
  'button:contains("Confirm Choices")'
];

// Simple contains polyfill since querySelector doesn't support :contains
function findElementByText(tag, textPatterns) {
  const elements = document.querySelectorAll(tag);
  for (const el of elements) {
    const text = el.textContent.trim().toLowerCase();
    for (const pattern of textPatterns) {
      if (text === pattern.toLowerCase() || text.includes(pattern.toLowerCase())) {
        return el;
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
      if (!selector.includes(':contains')) {
        const confirmBtn = document.querySelector(selector);
        if (confirmBtn && isElementVisible(confirmBtn)) {
          console.log(`[Cookie Consent] Clicking confirm/reject inside modal: ${selector}`);
          confirmBtn.click();
          return true;
        }
      }
    }

    // Also check text-based confirm buttons inside modal
    const confirmPatterns = ['confirm my choices', 'save preferences', 'save settings', 'confirm choices'];
    const el = findElementByText('button', confirmPatterns) || findElementByText('a', confirmPatterns);
    if (el && isElementVisible(el)) {
      console.log(`[Cookie Consent] Clicking text-based confirm inside modal: "${el.textContent.trim()}"`);
      el.click();
      return true;
    }

    // If confirm button is not visible, try to open the modal via "Manage Preferences"
    for (const selector of settingsSelectors) {
      if (!selector.includes(':contains')) {
        const settingsBtn = document.querySelector(selector);
        if (settingsBtn && isElementVisible(settingsBtn)) {
          console.log(`[Cookie Consent] Opening settings modal: ${selector}`);
          settingsBtn.click();
          // The mutation observer will catch the newly visible confirm button
          return false; 
        }
      }
    }
    
    const settingsPatterns = ['manage preferences', 'cookie settings', 'customize', 'show purposes', 'learn more'];
    const settingsEl = findElementByText('button', settingsPatterns) || findElementByText('a', settingsPatterns);
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
    if (!selector.includes(':contains')) {
      const el = document.querySelector(selector);
      if (el && isElementVisible(el)) {
        console.log(`[Cookie Consent] Clicking element matching selector: ${selector}`);
        el.click();
        return true;
      }
    }
  }

  // Try text-based matching if standard selectors failed
  const textPatterns = preference === 'acceptAll' ? 
    ['accept all', 'allow all', 'accept cookies', 'i accept'] : 
    ['reject all', 'decline all', 'necessary only', 'reject cookies', 'deny all', 'continue without accepting'];
  
  const tags = ['button', 'a', 'div', 'span'];
  for (const tag of tags) {
    const el = findElementByText(tag, textPatterns);
    if (el && isElementVisible(el)) {
      console.log(`[Cookie Consent] Clicking element matching text in tag <${tag}>: "${el.textContent.trim()}"`);
      el.click();
      return true;
    }
  }

  return false;
}

function isElementVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0 && el.offsetHeight > 0;
}

function handleCookieBanners() {
  chrome.storage.sync.get(['cookiePreference'], (result) => {
    const pref = result.cookiePreference || 'rejectAll';
    const clicked = findAndClickButton(pref);
    
    if (clicked) {
      console.log(`[Cookie Consent] Automatically handled banner with preference: ${pref}`);
    } else {
      // If not found immediately, observe DOM changes (SPAs, lazy-loaded banners)
      observeDOM(pref);
    }
  });
}

function observeDOM(pref) {
  let attempts = 0;
  const maxAttempts = 10;
  
  const observer = new MutationObserver((mutations, obs) => {
    const clicked = findAndClickButton(pref);
    if (clicked || attempts >= maxAttempts) {
      obs.disconnect(); // Stop observing once clicked or max attempts reached
    }
    attempts++;
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Fallback timeout to disconnect observer after 10 seconds just in case
  setTimeout(() => {
    observer.disconnect();
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
