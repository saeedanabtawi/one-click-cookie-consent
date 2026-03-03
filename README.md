# One-Click Cookie Consent

A Chrome extension that automatically handles cookie banners by selecting your preferred choice (Necessary Only / Reject All or Accept All) and clicking the button for you.

## Features
- **Auto-Click**: Automatically clicks cookie consent buttons based on your preferences.
- **Preferences**: Choose whether you want to "Reject All / Necessary Only" (default) or "Accept All".
- **Saves Time**: Say goodbye to annoying cookie banners on every site you visit.

## Installation (Developer Mode)
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click on **Load unpacked** in the top left corner.
5. Select the folder containing this extension's files (`one-click-cookie-consent`).

## How it works
The extension uses a `content.js` script injected into every webpage you visit (`<all_urls>`). It scans the DOM for common cookie banner elements (buttons, links) containing text like "Reject All", "Accept All", "Necessary Only", etc. It then automatically clicks the button that matches your saved preference.

## Next Steps / Monetization Ideas
- **Open Source (Donation)**: Add a "Buy me a coffee" link in the popup.
- **Aggregate Data Analytics**: You could potentially track which sites show cookie banners and whether they offer easy "Reject All" options to publish statistics on cookie policy compliance (ensure all data collection is anonymized and legal).
- **Expanded Selectors**: Cookie banners come in many forms (OneTrust, Cookiebot, custom). The selector list in `content.js` can be continually expanded to improve accuracy.
