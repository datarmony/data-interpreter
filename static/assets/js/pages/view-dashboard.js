document.addEventListener('DOMContentLoaded', function () {
    // --- Elements ---
    const setHeightButton = document.getElementById('setIframeHeightButton');
    const heightInput = document.getElementById('iframeHeightInput');
    const iframeContainer = document.querySelector('.card-body .embed-responsive div');
    
    function applyHeight() {
        const newHeight = parseInt(heightInput.value, 10);
        if (isNaN(newHeight) || newHeight < 1000) {
            alert("Please enter a valid height (minimum 1000px).");
            return;
        }
        iframeContainer.style.height = newHeight + 'px';
        console.log(`Set iframe container height to ${newHeight}px`);
    }

    setHeightButton.addEventListener('click', applyHeight);

    heightInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyHeight(); // Use the same function
        }
    });
});