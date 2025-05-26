const EXTENSION_ID = 'ckbljbnfcnaejohkpbcaepjhgimcckji';
const REQUIRED_PAGE_PATH = '/extension-required';
const INDEX_PATH = '/index';

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

function redirectToIndex() {
    if (window.location.pathname !== INDEX_PATH) {
        log("Extension detected, redirecting to index.");
        window.location.href = INDEX_PATH;
    } else {
        log("Already on the index page, no redirect needed.");
    }
}

function log(...args) {
    console.log("[Extension Check]", ...args);
}

function checkExtension() {
    const browser = detectBrowser();

    switch (browser) {
        case "chrome":
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage(EXTENSION_ID, 'version', (response) => {
                    if (chrome.runtime.lastError) {
                        log("Extension not installed or communication error:", chrome.runtime.lastError.message);
                        redirectToExtensionRequired();
                    } else if (response && response.version) {
                        log("Extension installed, version:", response.version);
                        // Si la extensión está instalada y estamos en la página de extensión requerida, redirigir al index
                        if (window.location.pathname === REQUIRED_PAGE_PATH) {
                            redirectToIndex();
                        }
                    } else {
                        log("Extension responded, but the response format was unexpected:", response);
                        redirectToExtensionRequired();
                    }
                });
            } else {
                log("Chrome runtime API not available");
                redirectToExtensionRequired();
            }
            break;
        case "firefox":
            redirectToExtensionRequired();
            break;
        case "safari":
            redirectToExtensionRequired();
            break;
        default:
            redirectToExtensionRequired();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkExtension();
});

// Exponer la función para que pueda ser llamada desde el botón
window.checkAndRedirect = function() {
    checkExtension();
};