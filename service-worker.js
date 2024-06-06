importScripts("service-worker-utils.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookieValues") {
    const cookieNames = request.cookieNames;
    const cookieValues = {};

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.cookies.getAll({ url: activeTab.url }, (cookies) => {
        for (const cookie of cookies) {
          if (cookieNames.includes(cookie.name)) {
            cookieValues[cookie.name] = cookie.value;
          }
        }
        cookieValues.platform = request.platform;
        sendResponse(cookieValues);
      });
    });

    return true;
  }
});
