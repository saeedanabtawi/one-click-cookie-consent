// Background script for One-Click Cookie Consent

const tabDomainsToClear = {};

chrome.runtime.onInstalled.addListener(() => {
  console.log("One-Click Cookie Consent Extension installed.");
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "recordForcedAccept" && sender.tab) {
    const tabId = sender.tab.id;
    const hostname = message.hostname;
    
    if (!tabDomainsToClear[tabId]) {
      tabDomainsToClear[tabId] = new Set();
    }
    tabDomainsToClear[tabId].add(hostname);
    console.log(`[Cookie Consent] Marked ${hostname} on tab ${tabId} for cookie clearing on close.`);
  }
});

// Listen for tab closures to clean up cookies if Auto-Clear is enabled
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabDomainsToClear[tabId]) {
    const domains = tabDomainsToClear[tabId];
    
    chrome.storage.sync.get(['autoClear'], (result) => {
      if (result.autoClear) {
        domains.forEach(domain => {
          clearCookiesForDomain(domain);
        });
      }
    });

    // Cleanup memory
    delete tabDomainsToClear[tabId];
  }
});

function clearCookiesForDomain(domain) {
  // Strip 'www.' if present for broader matching
  const baseDomain = domain.replace(/^www\./, '');
  
  // Find all cookies for this domain
  chrome.cookies.getAll({ domain: baseDomain }, (cookies) => {
    for (const cookie of cookies) {
      const protocol = cookie.secure ? "https:" : "http:";
      const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;
      
      chrome.cookies.remove({
        url: cookieUrl,
        name: cookie.name,
        storeId: cookie.storeId
      });
    }
    console.log(`[Cookie Consent] Cleared ${cookies.length} cookies for domain: ${baseDomain}`);
  });
}
