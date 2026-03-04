document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');
  const radios = document.getElementsByName('preference');
  
  const bannersClickedEl = document.getElementById('bannersClicked');
  const timeSavedEl = document.getElementById('timeSaved');
  
  const currentHostnameEl = document.getElementById('currentHostname');
  const whitelistToggle = document.getElementById('whitelistToggle');

  const autoClearToggle = document.getElementById('autoClearToggle');
  const nukeModeToggle = document.getElementById('nukeModeToggle');
  const silentModeToggle = document.getElementById('silentModeToggle');
  
  const disableBtn = document.getElementById('disableBtn');
  const extensionStatus = document.getElementById('extensionStatus');
  const statusSection = document.getElementById('statusSection');

  let currentHostname = '';

  // Load saved data and update UI
  chrome.storage.sync.get(['cookiePreference', 'bannersClicked', 'whitelist', 'autoClear', 'nukeMode', 'silentMode', 'extensionDisabled'], (result) => {
    // Extension enabled/disabled state
    updateDisableButtonUI(result.extensionDisabled || false);
    // Preferences
    const pref = result.cookiePreference || 'rejectAll';
    for (const radio of radios) {
      if (radio.value === pref) {
        radio.checked = true;
        break;
      }
    }

    // Advanced Settings (default to true for Nuke Mode, false for others)
    autoClearToggle.checked = result.autoClear || false;
    nukeModeToggle.checked = result.nukeMode !== false; // defaults to true
    silentModeToggle.checked = result.silentMode || false;

    // Stats
    const clickedCount = result.bannersClicked || 0;
    bannersClickedEl.textContent = clickedCount;
    // Estimate 2.5 seconds saved per banner
    const timeSavedSeconds = clickedCount * 2.5; 
    const minutesSaved = Math.floor(timeSavedSeconds / 60);
    const remainingSeconds = Math.floor(timeSavedSeconds % 60);
    timeSavedEl.textContent = minutesSaved > 0 
      ? `${minutesSaved}m ${remainingSeconds}s` 
      : `${remainingSeconds}s`;

    // Whitelist for current site
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          currentHostname = url.hostname;
          currentHostnameEl.textContent = currentHostname;

          const whitelist = result.whitelist || [];
          if (whitelist.includes(currentHostname)) {
            whitelistToggle.checked = true;
          }
        } catch (e) {
          currentHostnameEl.textContent = 'Invalid URL';
          whitelistToggle.disabled = true;
        }
      }
    });
  });

  // Handle whitelist toggle change immediately
  // Handle disable button click
  disableBtn.addEventListener('click', () => {
    chrome.storage.sync.get(['extensionDisabled'], (result) => {
      const newState = !result.extensionDisabled;
      chrome.storage.sync.set({ extensionDisabled: newState }, () => {
        updateDisableButtonUI(newState);
      });
    });
  });

  function updateDisableButtonUI(isDisabled) {
    if (isDisabled) {
      extensionStatus.textContent = 'Extension Disabled';
      extensionStatus.style.color = '#dc3545';
      disableBtn.textContent = 'Enable';
      disableBtn.style.backgroundColor = '#28a745';
      statusSection.style.borderLeft = '3px solid #dc3545';
    } else {
      extensionStatus.textContent = 'Extension Enabled';
      extensionStatus.style.color = '#28a745';
      disableBtn.textContent = 'Disable';
      disableBtn.style.backgroundColor = '#dc3545';
      statusSection.style.borderLeft = '3px solid #28a745';
    }
  }

  whitelistToggle.addEventListener('change', () => {
    if (!currentHostname) return;

    chrome.storage.sync.get(['whitelist'], (result) => {
      let whitelist = result.whitelist || [];
      
      if (whitelistToggle.checked) {
        if (!whitelist.includes(currentHostname)) {
          whitelist.push(currentHostname);
        }
      } else {
        whitelist = whitelist.filter(host => host !== currentHostname);
      }

      chrome.storage.sync.set({ whitelist: whitelist });
    });
  });

  // Save preference on button click
  saveBtn.addEventListener('click', () => {
    let selectedPref = 'rejectAll';
    for (const radio of radios) {
      if (radio.checked) {
        selectedPref = radio.value;
        break;
      }
    }

    chrome.storage.sync.set({ 
      cookiePreference: selectedPref,
      autoClear: autoClearToggle.checked,
      nukeMode: nukeModeToggle.checked,
      silentMode: silentModeToggle.checked
    }, () => {
      statusEl.textContent = 'Preferences saved!';
      statusEl.style.color = '#3567cc'; // Strong blue matching icon theme
      setTimeout(() => {
        statusEl.textContent = '';
      }, 2000);
    });
  });
});
