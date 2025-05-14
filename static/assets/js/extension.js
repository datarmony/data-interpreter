const REQUIRED_PAGE_PATH = '/extension-required';
const browser = detectBrowser();

// Unified extension check
function checkExtensionInstalled() {
  if (browser === "chrome") {
    chrome.runtime.sendMessage(
      { action: "ping" }, // Generic ping message
      (response) => {
        if (chrome.runtime.lastError || !response?.version) {
          log("Extension missing/invalid:", chrome.runtime.lastError?.message || "No version in response");
          redirectToExtensionRequired();
        } else {
          log("Extension detected. Version:", response.version);
          // Optional: Store version for later use
          localStorage.setItem('extensionVersion', response.version);
        }
      }
    );
  } else {
    redirectToExtensionRequired(); // Non-Chrome browsers
  }
}


function log(...args) { console.log('[WEBSITE]', ...args); }

function detectBrowser() {
    let userAgent = navigator.userAgent;
    let isChrome = userAgent.includes("Chrome") && !userAgent.includes("OPR") && !userAgent.includes("Edg");
    let isFirefox = userAgent.includes("Firefox");
    let isSafari = userAgent.includes("Safari") && !userAgent.includes("Chrome") && !userAgent.includes("Chromium");
    
    if (isChrome) return "chrome";
    if (isFirefox) return "firefox";
    if (isSafari) return "safari";
    return "unknown";
}

function redirectToExtensionRequired() {
    if (window.location.pathname !== REQUIRED_PAGE_PATH) {
        log("Redirecting to extension required page.");
        window.location.href = REQUIRED_PAGE_PATH;
    } else {
        log("Already on the extension required page, no redirect needed.");
    }
}

// Initial check on page load
document.addEventListener('DOMContentLoaded', checkExtensionInstalled);