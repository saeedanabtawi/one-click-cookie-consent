document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');
  const radios = document.getElementsByName('preference');

  // Load saved preference
  chrome.storage.sync.get(['cookiePreference'], (result) => {
    const pref = result.cookiePreference || 'rejectAll';
    for (const radio of radios) {
      if (radio.value === pref) {
        radio.checked = true;
        break;
      }
    }
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

    chrome.storage.sync.set({ cookiePreference: selectedPref }, () => {
      statusEl.textContent = 'Preferences saved!';
      statusEl.style.color = '#4CAF50';
      setTimeout(() => {
        statusEl.textContent = '';
      }, 2000);
    });
  });
});
