// Background script for One-Click Cookie Consent
// Currently empty, but can be used for more advanced features like:
// - Cross-origin requests
// - Managing tabs
// - Sending analytics (if user opts-in)

chrome.runtime.onInstalled.addListener(() => {
  console.log("One-Click Cookie Consent Extension installed.");
});
