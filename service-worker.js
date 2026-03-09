importScripts("service-worker-utils.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookieValues") {
    const cookieNames = request.cookieNames;
    const cookies = {};

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.cookies.getAll({ url: activeTab.url }, (allCookies) => {
        for (const cookie of allCookies) {
          if (cookieNames.includes(cookie.name)) {
            cookies[cookie.name] = cookie.value;
          }
        }
        sendResponse({ cookies, url: activeTab.url, platform: request.platform });
      });
    });

    return true;
  }

  if (request.action === "setCookies") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const promises = Object.entries(request.cookies).map(
        ([name, value]) =>
          new Promise((resolve) => {
            chrome.cookies.set({ url: activeTab.url, name, value }, resolve);
          })
      );
      Promise.all(promises).then(() => sendResponse({ success: true }));
    });

    return true;
  }
});
