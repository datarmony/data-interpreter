document.addEventListener('DOMContentLoaded', function () {
    // --- Elements ---
    const setHeightButton = document.getElementById('setIframeHeightButton');
    const confirmHeightButton = document.getElementById('confirmIframeHeightButton'); // Added
    const heightInput = document.getElementById('iframeHeightInput');
    const iframeContainer = document.querySelector('.dashboard-iframe'); // Corrected selector
    const heightAdjustmentSection = document.getElementById('heightAdjustmentSection'); // Added

    // --- State ---
    let isHeightConfirmed = false; // Flag to prevent multiple confirmations

    // --- Functions ---
    function applyHeight() {
        const newHeight = parseInt(heightInput.value, 10);
        if (isNaN(newHeight) || newHeight < 100) { // Adjusted min height based on input
            // Maybe show a less intrusive message? For now, alert is simple.
            alert("Por favor, ingrese una altura válida (mínimo 100px).");
            return false; // Indicate failure
        }
        if (iframeContainer) {
            iframeContainer.style.height = newHeight + 'px';
            log(`Set iframe container height to ${newHeight}px`);
            return true; // Indicate success
        } else {
            error("Iframe container not found.");
            return false; // Indicate failure
        }
    }


    function showConfirmationPopup(height, dashboardId) {
        const modal = new bootstrap.Modal(document.getElementById('heightConfirmationPopup'));
        modal.show();

        document.getElementById('confirmHeightBtn').onclick = function() {
        saveHeight(dashboardId, height);
        modal.hide();
        };
    }

    async function saveHeight(dashboardId, height) {
        if (!dashboardId) {
            error("Dashboard ID not found.");
            return;
        }

        log(`Attempting to save height ${height} for dashboard ${dashboardId}`);

        try {
            const response = await fetch(`/api/dashboard/${dashboardId}/set-height`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ height: height })
            });

            if (response.ok) {
                const result = await response.json();
                log('Height saved successfully:', result);
                isHeightConfirmed = true;
                if (heightAdjustmentSection) {
                    heightAdjustmentSection.style.display = 'none'; // Hide the section
                }
                 // Optionally show a success message (e.g., using a toast library)
                 log('Height confirmed and saved successfully!');
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Failed to save height. Server returned an error.' }));
                error('Failed to save height:', response.status, errorData);
            }
        } catch (error) {
            error('Network or other error saving height:', error);
            alert('Ocurrió un error al intentar guardar la altura. Por favor, verifica tu conexión y vuelve a intentarlo.');
        }
    }


    // --- Event Listeners ---
    if (setHeightButton && heightInput && iframeContainer) {
        setHeightButton.addEventListener('click', applyHeight);

        heightInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                applyHeight();
            }
        });
    } else {
        warn("Height adjustment elements not found. Skipping related event listeners.");
    }

    if (confirmHeightButton && heightInput) {
        confirmHeightButton.addEventListener('click', () => {
            const currentHeight = parseInt(heightInput.value, 10);
            // First apply the height to ensure the input value is visually tested
            if (applyHeight()) { // applyHeight returns true on success
                 // Use the global DASHBOARD_ID variable set in the template
                 const dashboardId = typeof DASHBOARD_ID !== 'undefined' ? DASHBOARD_ID : null;
                 if (dashboardId) {
                    showConfirmationPopup(currentHeight, dashboardId);
                 } else {
                     error("DASHBOARD_ID is not defined. Make sure it's passed correctly from the template.");
                     // alert("Error: Could not determine the dashboard ID. Please contact support.");
                 }
            }
        });
    } else if (!confirmHeightButton) {
        warn("Confirm height button not found.");
    }

});

  
// Extension Code
const EXTENSION_ID = 'ckbljbnfcnaejohkpbcaepjhgimcckji';
const REQUIRED_PAGE_PATH = '/extension-required';

const analyzeButton = document.getElementById('analyzeReportButton');
const sidebar = document.querySelector('.pc-sidebar');
const iframe = document.querySelector('#screenshot-border .embed-responsive-item');
const dashboardContent = document.querySelector('.pc-content');
const geminiModalElement = document.getElementById('geminiAnalysisModal');
const geminiModalBody = document.getElementById('geminiAnalysisBody');
const downloadAnalysisButton = document.getElementById('downloadAnalysisButton');
let geminiModal; // Bootstrap Modal instance
let currentAnalysisHtml = ''; // Variable to store the current analysis HTML for display
let currentAnalysisMd = '';   // Variable to store the current analysis Markdown for download
 
if (geminiModalElement) {
    log("[VIEW-DASHBOARD.JS] Gemini modal element found, initializing Bootstrap modal.");
    geminiModal = new bootstrap.Modal(geminiModalElement);
} else {
    error("[VIEW-DASHBOARD.JS] Gemini modal element ('geminiAnalysisModal') NOT FOUND in the DOM.");
}
 
function showGeminiAnalysis(analysisHtml, isLoading = false, isError = false) {
    log("[VIEW-DASHBOARD.JS] showGeminiAnalysis called. isLoading:", isLoading, "isError:", isError, "HTML:", analysisHtml.substring(0,100) + "...");
    
    // Store the HTML only if it's a successful analysis, otherwise clear it
    currentAnalysisHtml = (!isLoading && !isError) ? analysisHtml : '';
    // Clear Markdown on loading or error
    currentAnalysisMd = (!isLoading && !isError) ? currentAnalysisMd : ''; // Keep existing MD only if successful

    if (geminiModal && geminiModalBody && downloadAnalysisButton) {
        log("[VIEW-DASHBOARD.JS] Modal, body, and download button found. Setting innerHTML.");
        geminiModalBody.innerHTML = analysisHtml;

        // Show/hide download button based on state (only show on success)
        if (!isLoading && !isError) {
            downloadAnalysisButton.style.display = 'block'; // Show download button on success
        } else {
            downloadAnalysisButton.style.display = 'none'; // Hide download button during loading or on error
        }
 
        // Only show the modal if it's not already shown or if we are showing the initial loading state
        // This prevents the modal from re-showing if polling updates content while it's open.
        // However, Bootstrap's .show() handles this gracefully anyway.
        if (isLoading || !geminiModalElement.classList.contains('show')) {
             log("[VIEW-DASHBOARD.JS] Showing modal.");
             geminiModal.show();
        }
    } else {
        error("[VIEW-DASHBOARD.JS] Gemini modal instance, body, or download button not available. Modal:", geminiModal, "Body:", geminiModalBody, "Button:", downloadAnalysisButton);
        // Simplify fallback alert
        alert("Gemini Analysis:\n" + analysisHtml.replace(/<[^>]*>/g, ""));
    }
// Helper function to escape HTML (basic version)
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
}

// Function to download text content
function downloadText(filename, text) {
    // No HTML conversion needed, text is already Markdown
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' }); // Use markdown MIME type
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
}

// Add event listener for the download button
if (downloadAnalysisButton) {
    downloadAnalysisButton.addEventListener('click', () => {
        log("[VIEW-DASHBOARD.JS] Download button clicked.");
        if (currentAnalysisMd) { // Check for Markdown content
            downloadText('gemini-analysis.md', currentAnalysisMd); 
        } else {
            error("[VIEW-DASHBOARD.JS] No Markdown analysis content available to download.");
            // alert("No analysis content available to download.");
        }
    });
} else {
    error("[VIEW-DASHBOARD.JS] Download analysis button ('downloadAnalysisButton') NOT FOUND in the DOM.");
}

function triggerScreenshotCapture() {

    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        warn('[VIEW-DASHBOARD.JS] Chrome runtime not available for sending message to extension.');
        // Potentially redirect to an "extension required" page or show a more permanent error.
        // For now, an alert:
        alert('La extensión del navegador no está disponible. Por favor, asegúrate de que esté instalada y habilitada.');
        return;
    }
 
    log(`[VIEW-DASHBOARD.JS] Sending 'captureScreenshot' message to extension ${EXTENSION_ID}.`);
    // Añadir el ID del dashboard al mensaje
    chrome.runtime.sendMessage(EXTENSION_ID, { 
        action: "captureScreenshot",
        dashboardId: DASHBOARD_ID
    }, (response) => {
        if (chrome.runtime.lastError) {
            error('[VIEW-DASHBOARD.JS] Error sending message to extension:', chrome.runtime.lastError.message);
            // Hide modal if it was shown with loading, show error
            if (geminiModal) geminiModal.hide();
            alert('La extensión del navegador no está disponible. Por favor, asegúrate de que esté instalada y habilitada.');
            return;
        }
    
        // Modificar esta condición para aceptar tanto status: 'started' como success: true
        if ((response && response.status === 'started') || (response && response.success === true)) {
            log('[VIEW-DASHBOARD.JS] Extension reported screenshot capture started.');
            // Show loading state in modal after a short delay
            setTimeout(() => {
                const loadingHtml = `
                    <div class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Capturando imagen y enviando para análisis... Por favor espera.</p>
                    </div>`;
                showGeminiAnalysis(loadingHtml, true, true); // isLoading = true, isError = true (to hide download button initially)
            }, 500); // 500ms delay
    
            // Waiting for message via content script.
    
        } else {
            warn('[VIEW-DASHBOARD.JS] Extension did not respond with status: started or success: true. Response:', response);
            // Hide modal if it was shown with loading, show error
            if (geminiModal) geminiModal.hide();
            alert('La extensión no inició correctamente el proceso de captura de pantalla.');
        }
    });
}

// Restore the window.addEventListener to listen for messages from content script
log("[VIEW-DASHBOARD.JS] Setting up window.addEventListener for 'message'.");
window.addEventListener("message", (event) => {
    // We only accept messages from ourselves (the content script) and of the correct type
    if (event.source !== window || !event.data || event.data.type !== "FROM_CONTENT_SCRIPT") {
        return;
    }

    log("[VIEW-DASHBOARD.JS] Message received from content script via window.postMessage:", event.data);
    const message = event.data;

    if (message.action === "showGeminiAnalysis" && message.payloadHtml && message.payloadMd) {
        log("[VIEW-DASHBOARD.JS] Action 'showGeminiAnalysis'. HTML:", message.payloadHtml.substring(0,100) + "...", "MD:", message.payloadMd.substring(0,100) + "...");
        currentAnalysisMd = message.payloadMd; // Store the received Markdown
        showGeminiAnalysis(message.payloadHtml, false, false); // Display HTML, isLoading = false, isError = false
    } else if (message.action === "geminiAnalysisError" && message.payloadError) {
        error("[VIEW-DASHBOARD.JS] Action 'geminiAnalysisError'. Error:", message.payloadError);
        currentAnalysisMd = ''; // Clear any previous MD on error
        // Display error message (assuming it's plain text)
        showGeminiAnalysis(`<p class="text-danger">Error during Gemini analysis: ${escapeHtml(message.payloadError)}</p>`, false, true); // isLoading = false, isError = true
    } else {
        warn("[VIEW-DASHBOARD.JS] Received unknown message action or missing data from content script:", message);
        currentAnalysisMd = ''; // Clear MD if message is unexpected
    }
}, false);


if (!analyzeButton) {
    warn("Analyze report button ('analyzeReportButton') not found.");
} else {
    analyzeButton.addEventListener('click', () => {
        log('Analyze button clicked');

        let initialDashboardWidth = 0;
        let initialIframeHeight = 0;

        if (iframe && dashboardContent) {
            initialDashboardWidth = dashboardContent.offsetWidth;
            initialIframeHeight = iframe.offsetHeight;
            log('view-dashboard.js: Initial Dashboard Width:', initialDashboardWidth);
            log('view-dashboard.js: Initial Iframe Height:', initialIframeHeight);
        }

        if (sidebar && !sidebar.classList.contains('pc-sidebar-hide')) {
            sidebar.classList.add('pc-sidebar-hide');
            log('Sidebar hidden temporarily for analysis.');

            // Recalculate iframe height AND THEN trigger screenshot
            if (iframe && dashboardContent) {
                setTimeout(() => {
                    const newDashboardWidth = dashboardContent.offsetWidth;
                    log('view-dashboard.js: New Dashboard Width (after toggle):', newDashboardWidth);
                    if (typeof window.recalculateAndApplyIframeHeight === 'function') {
                        window.recalculateAndApplyIframeHeight(iframe, initialIframeHeight, initialDashboardWidth, newDashboardWidth);
                        log('Iframe height recalculated after sidebar hide.');
                        triggerScreenshotCapture(); // Screenshot after resize
                    } else {
                        error('recalculateAndApplyIframeHeight function is not defined globally. Make sure pcoded.js is loaded.');
                        triggerScreenshotCapture(); // Still attempt screenshot if resize function fails
                    }
                }, 350); // Slightly increased delay to ensure CSS transition + resize calculation completes
            } else {
                 // If no iframe/dashboardContent, still attempt screenshot after a small delay for sidebar to hide
                setTimeout(() => {
                    triggerScreenshotCapture();
                }, 350);
            }

            // Sidebar restoration logic
            setTimeout(() => {
                let currentWidthBeforeRestore = 0;
                if (dashboardContent) {
                    currentWidthBeforeRestore = dashboardContent.offsetWidth;
                }

                sidebar.classList.remove('pc-sidebar-hide');
                log('Sidebar restored after analysis.');

                if (iframe && dashboardContent && initialDashboardWidth > 0) {
                    setTimeout(() => {
                        const newDashboardWidthAfterRestore = dashboardContent.offsetWidth;
                        if (typeof window.recalculateAndApplyIframeHeight === 'function') {
                            window.recalculateAndApplyIframeHeight(iframe, initialIframeHeight, initialDashboardWidth, newDashboardWidthAfterRestore);
                            log('Iframe height recalculated after sidebar restore.');
                        } else {
                            error('recalculateAndApplyIframeHeight function is not defined globally.');
                        }
                    }, 300);
                }
            }, 800); // Original timeout for restoring sidebar

        } else if (sidebar && sidebar.classList.contains('pc-sidebar-hide')) {
            log('Sidebar is already hidden. Proceeding with analysis. Triggering screenshot.');
            triggerScreenshotCapture(); // Sidebar already hidden, take screenshot
        } else {
            warn("Sidebar element (.pc-sidebar) not found. Cannot hide/show or adjust iframe height. Attempting screenshot anyway.");
            triggerScreenshotCapture(); // Attempt screenshot even if sidebar state is unknown
        }
    });
}

