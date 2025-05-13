const lookerStudioRegex = /^https:\/\/lookerstudio\.google\.com\//;

// check if it has class invalid if it has remove it
document.getElementById("shareLink").addEventListener("input", function () {
    if (this.classList.contains("is-invalid")) {
      this.classList.remove("is-invalid");
    }
});

// Add the modal functionality to create a dashboard and makes sure the link is correct
document.getElementById("saveDashboardBtn").addEventListener("click", function () {
    const form = document.getElementById("createDashboardForm");
    const linkInput = document.getElementById("shareLink");
    const linkValue = linkInput.value.trim();
    
    if (!lookerStudioRegex.test(linkValue)) {
        linkInput.classList.add("is-invalid");
        return;
    } else {
        linkInput.classList.remove("is-invalid");
    }

    const formData = new FormData(form);

    fetch("/create-dashboard", {
      method: "POST",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        log("Response:", data);
        if (data.success) {
          // Show the toast
          const toastElement = document.getElementById("dashboardToast");
          const toast = new bootstrap.Toast(toastElement);
          toast.show();

          // Clear form inputs
          form.reset();

          // Close the modal after a brief delay
          setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById("createDashboardModal"));
            modal.hide();
            // Optional: refresh if you want dashboard list to update
            location.reload();
          }, 1500);
        } else {
          alert(data.message);
        }
      })
      .catch(err => {
        error(err);
        alert("Something went wrong!");
      });
  });