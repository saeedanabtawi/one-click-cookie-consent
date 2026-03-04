# One-Click Cookie Consent

A Chrome extension that automatically handles cookie banners by selecting your preferred choice (Necessary Only / Reject All or Accept All) and clicking the button for you.

## Features

- **Auto-Click**: Automatically clicks cookie consent buttons based on your preferences
- **Preferences**: Choose "Reject All / Necessary Only" (default) or "Accept All"
- **Disable Button**: Quickly enable/disable the extension globally
- **Site Whitelist**: Disable auto-clicking on specific sites
- **Stats Tracking**: View banners clicked and estimated time saved
- **Nuke Mode**: Forcibly hides stubborn banners that can't be clicked
- **Multi-Language Support**: Works with English, German, French, Spanish, and Italian banners
- **Auto-Clear Cookies**: Deletes cookies when tab closes if forced to accept
- **Silent Mode**: Hide toast notifications

## Supported Cookie Providers

- OneTrust
- Cookiebot
- Didomi
- Quantcast
- Civic UK
- CookieYes
- Generic banners with standard naming conventions

## Installation (Developer Mode)

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** in the top right corner
4. Click **Load unpacked** in the top left corner
5. Select the folder containing this extension's files

## How It Works

### Architecture

The extension consists of four main components:

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration and permissions |
| `content.js` | Runs on every webpage to detect and handle banners |
| `popup.html/js` | User interface for settings and stats |
| `background.js` | Handles cookie clearing on tab close |

### Detection Process

1. **Page Load**: When you visit any webpage, `content.js` is injected automatically

2. **Settings Check**: The script first checks:
   - Is the extension globally disabled?
   - Is this site whitelisted?
   - If either is true, the script exits

3. **Banner Detection** (in order of priority):
   - **CSS Selectors**: Checks for known banner provider elements (OneTrust, Cookiebot, etc.)
   - **Text Matching**: Scans buttons/links for text like "Reject All", "Accept All" in 5 languages

4. **Complex Banner Handling**: For banners hiding "Reject All" behind settings:
   - Clicks "Manage Preferences" or "Settings" button
   - Waits for modal to appear using MutationObserver
   - Clicks "Confirm Choices" or "Save Preferences"

5. **Nuke Mode**: If no clickable button is found after 15 attempts:
   - Hides the banner container via CSS (`display: none`)
   - Restores page scrolling if it was blocked

6. **Feedback**: Shows a toast notification (unless Silent Mode is on) and updates stats

### Data Flow

```
User visits page
       ↓
content.js loads → Checks settings from chrome.storage.sync
       ↓
Scans DOM for cookie banners
       ↓
Found? → Click appropriate button → Update stats → Show toast
       ↓
Not found? → Start MutationObserver (watches for lazy-loaded banners)
       ↓
Still not found after timeout? → Nuke Mode (hide banner)
```

### Auto-Clear Cookies Feature

When enabled and user preference is "Accept All":
1. `content.js` notifies `background.js` when forced to accept cookies
2. `background.js` tracks the domain for that tab
3. When the tab closes, all cookies for that domain are deleted

## Privacy

- **No data collection**: All settings stored locally via `chrome.storage.sync`
- **No external requests**: The extension works entirely offline
- **Minimal permissions**: Only requests permissions necessary for functionality

## Future Ideas

- Keyboard shortcut to toggle extension
- Per-site preference (reject on some sites, accept on others)
- Custom CSS selectors for advanced users
- Badge counter showing banners handled today
- Import/Export settings
- Report unhandled banner feature
