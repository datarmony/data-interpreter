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
            alert("Please enter a valid height (minimum 100px).");
            return false; // Indicate failure
        }
        if (iframeContainer) {
            iframeContainer.style.height = newHeight + 'px';
            console.log(`Set iframe container height to ${newHeight}px`);
            return true; // Indicate success
        } else {
            console.error("Iframe container not found.");
            return false; // Indicate failure
        }
    }

    // Removed getDashboardIdFromUrl function - ID is now passed from template

    function showConfirmationPopup(height, dashboardId) {
        // Assuming you have Bootstrap 5 JS loaded
        const modal = new bootstrap.Modal(document.getElementById('heightConfirmationPopup'));
        modal.show();

        // Set up your confirm logic
        document.getElementById('confirmHeightBtn').onclick = function() {
        saveHeight(dashboardId, height); // You provide these variables
        modal.hide();
        };
    }

    async function saveHeight(dashboardId, height) {
        if (!dashboardId) {
            console.error("Dashboard ID not found.");
            alert("Error: Could not identify the dashboard.");
            return;
        }

        console.log(`Attempting to save height ${height} for dashboard ${dashboardId}`);

        try {
            const response = await fetch(`/api/dashboard/${dashboardId}/set-height`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add CSRF token header if needed by Flask-WTF or similar
                    // 'X-CSRFToken': getCsrfToken() // Example placeholder
                },
                body: JSON.stringify({ height: height })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Height saved successfully:', result);
                isHeightConfirmed = true;
                if (heightAdjustmentSection) {
                    heightAdjustmentSection.style.display = 'none'; // Hide the section
                }
                 // Optionally show a success message (e.g., using a toast library)
                 alert('Height confirmed and saved successfully!');
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Failed to save height. Server returned an error.' }));
                console.error('Failed to save height:', response.status, errorData);
                alert(`Error saving height: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Network or other error saving height:', error);
            alert('An error occurred while trying to save the height. Please check your connection and try again.');
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
         console.warn("Height adjustment elements not found. Skipping related event listeners.");
    }

    if (confirmHeightButton && heightInput) { // Removed !isHeightConfirmed check here, rely on section hiding
        confirmHeightButton.addEventListener('click', () => {
            const currentHeight = parseInt(heightInput.value, 10);
            // First apply the height to ensure the input value is visually tested
            if (applyHeight()) { // applyHeight returns true on success
                 // Use the global DASHBOARD_ID variable set in the template
                 const dashboardId = typeof DASHBOARD_ID !== 'undefined' ? DASHBOARD_ID : null;
                 if (dashboardId) {
                    showConfirmationPopup(currentHeight, dashboardId);
                 } else {
                     console.error("DASHBOARD_ID is not defined. Make sure it's passed correctly from the template.");
                     alert("Error: Could not determine the dashboard ID. Please contact support.");
                 }
            } else {
                 // applyHeight already showed an alert or logged error
            }
        });
    } else if (!confirmHeightButton) {
        console.warn("Confirm height button not found.");
    }

});