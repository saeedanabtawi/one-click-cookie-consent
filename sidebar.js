// Sidebar UI injection for One-Click Cookie Consent

(function() {
  let sidebarInjected = false;
  let sidebarOpen = false;

  function createSidebar() {
    if (sidebarInjected) return;
    sidebarInjected = true;

    const sidebar = document.createElement('div');
    sidebar.id = 'cookie-consent-sidebar';
    
    const iconUrl = chrome.runtime.getURL('icons/icon48.png');
    
    sidebar.innerHTML = `
      <div class="ccs-header">
        <div class="ccs-header-title">
          <img src="${iconUrl}" alt="Cookie Consent">
          <span>Cookie Consent</span>
        </div>
        <button class="ccs-close-btn" id="ccs-close">×</button>
      </div>
      
      <div class="ccs-body">
        <div class="ccs-section">
          <div class="ccs-status-row">
            <span class="ccs-status-text enabled" id="ccs-status-text">Enabled</span>
            <button class="ccs-toggle-btn disable" id="ccs-toggle-btn">Disable</button>
          </div>
        </div>
        
        <div class="ccs-section">
          <div class="ccs-section-title">Your Impact</div>
          <div class="ccs-stats-grid">
            <div class="ccs-stat-box">
              <div class="ccs-stat-value" id="ccs-banners">0</div>
              <div class="ccs-stat-label">Banners Clicked</div>
            </div>
            <div class="ccs-stat-box">
              <div class="ccs-stat-value" id="ccs-time">0s</div>
              <div class="ccs-stat-label">Time Saved</div>
            </div>
          </div>
        </div>
        
        <div class="ccs-section">
          <div class="ccs-section-title">Preference</div>
          <div class="ccs-option">
            <input type="radio" name="ccs-pref" id="ccs-reject" value="rejectAll" checked>
            <label for="ccs-reject">Reject All / Necessary Only</label>
          </div>
          <div class="ccs-option">
            <input type="radio" name="ccs-pref" id="ccs-accept" value="acceptAll">
            <label for="ccs-accept">Accept All</label>
          </div>
        </div>
        
        <div class="ccs-section">
          <div class="ccs-section-title">Current Site</div>
          <div class="ccs-current-site" id="ccs-hostname">${window.location.hostname}</div>
          <div class="ccs-option">
            <input type="checkbox" id="ccs-whitelist">
            <label for="ccs-whitelist">Disable on this site</label>
          </div>
        </div>
        
        <div class="ccs-section">
          <div class="ccs-section-title">Advanced</div>
          <div class="ccs-option">
            <input type="checkbox" id="ccs-autoclear">
            <label for="ccs-autoclear">Auto-Clear Cookies</label>
          </div>
          <div class="ccs-sub-label">Delete cookies when tab closes</div>
          <div class="ccs-option">
            <input type="checkbox" id="ccs-nuke" checked>
            <label for="ccs-nuke">Nuke Mode</label>
          </div>
          <div class="ccs-sub-label">Hide stubborn banners</div>
          <div class="ccs-option">
            <input type="checkbox" id="ccs-silent">
            <label for="ccs-silent">Silent Mode</label>
          </div>
          <div class="ccs-sub-label">Hide toast notifications</div>
        </div>
        
        <button class="ccs-save-btn" id="ccs-save">Save Preferences</button>
        <div class="ccs-status-msg" id="ccs-save-status"></div>
      </div>
      
      <div class="ccs-footer">
        One-Click Cookie Consent v2.0
      </div>
    `;
    
    document.body.appendChild(sidebar);
    
    // Event listeners
    document.getElementById('ccs-close').addEventListener('click', toggleSidebar);
    document.getElementById('ccs-toggle-btn').addEventListener('click', toggleExtension);
    document.getElementById('ccs-whitelist').addEventListener('change', handleWhitelist);
    document.getElementById('ccs-save').addEventListener('click', savePreferences);
    
    // Load current settings
    loadSettings();
  }

  function loadSettings() {
    chrome.storage.sync.get([
      'cookiePreference', 'bannersClicked', 'whitelist', 
      'autoClear', 'nukeMode', 'silentMode', 'extensionDisabled'
    ], (result) => {
      // Status
      updateStatusUI(result.extensionDisabled || false);
      
      // Preference
      const pref = result.cookiePreference || 'rejectAll';
      if (pref === 'acceptAll') {
        document.getElementById('ccs-accept').checked = true;
      } else {
        document.getElementById('ccs-reject').checked = true;
      }
      
      // Stats
      const clicks = result.bannersClicked || 0;
      document.getElementById('ccs-banners').textContent = clicks;
      const seconds = Math.floor(clicks * 2.5);
      const mins = Math.floor(seconds / 60);
      document.getElementById('ccs-time').textContent = mins > 0 
        ? `${mins}m ${seconds % 60}s` 
        : `${seconds}s`;
      
      // Whitelist
      const whitelist = result.whitelist || [];
      document.getElementById('ccs-whitelist').checked = whitelist.includes(window.location.hostname);
      
      // Advanced
      document.getElementById('ccs-autoclear').checked = result.autoClear || false;
      document.getElementById('ccs-nuke').checked = result.nukeMode !== false;
      document.getElementById('ccs-silent').checked = result.silentMode || false;
    });
  }

  function updateStatusUI(isDisabled) {
    const statusText = document.getElementById('ccs-status-text');
    const toggleBtn = document.getElementById('ccs-toggle-btn');
    
    if (isDisabled) {
      statusText.textContent = 'Disabled';
      statusText.className = 'ccs-status-text disabled';
      toggleBtn.textContent = 'Enable';
      toggleBtn.className = 'ccs-toggle-btn enable';
    } else {
      statusText.textContent = 'Enabled';
      statusText.className = 'ccs-status-text enabled';
      toggleBtn.textContent = 'Disable';
      toggleBtn.className = 'ccs-toggle-btn disable';
    }
  }

  function toggleExtension() {
    chrome.storage.sync.get(['extensionDisabled'], (result) => {
      const newState = !result.extensionDisabled;
      chrome.storage.sync.set({ extensionDisabled: newState }, () => {
        updateStatusUI(newState);
      });
    });
  }

  function handleWhitelist() {
    const checkbox = document.getElementById('ccs-whitelist');
    const hostname = window.location.hostname;
    
    chrome.storage.sync.get(['whitelist'], (result) => {
      let whitelist = result.whitelist || [];
      
      if (checkbox.checked) {
        if (!whitelist.includes(hostname)) {
          whitelist.push(hostname);
        }
      } else {
        whitelist = whitelist.filter(h => h !== hostname);
      }
      
      chrome.storage.sync.set({ whitelist });
    });
  }

  function savePreferences() {
    const pref = document.querySelector('input[name="ccs-pref"]:checked').value;
    
    chrome.storage.sync.set({
      cookiePreference: pref,
      autoClear: document.getElementById('ccs-autoclear').checked,
      nukeMode: document.getElementById('ccs-nuke').checked,
      silentMode: document.getElementById('ccs-silent').checked
    }, () => {
      const status = document.getElementById('ccs-save-status');
      status.textContent = 'Preferences saved!';
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('cookie-consent-sidebar');
    if (!sidebar) {
      createSidebar();
      setTimeout(() => {
        document.getElementById('cookie-consent-sidebar').classList.add('open');
        sidebarOpen = true;
      }, 10);
    } else {
      sidebarOpen = !sidebarOpen;
      sidebar.classList.toggle('open', sidebarOpen);
      if (sidebarOpen) {
        loadSettings();
      }
    }
  }

  // Listen for toggle message from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleSidebar') {
      createSidebar();
      toggleSidebar();
      sendResponse({ success: true });
    }
  });
})();
