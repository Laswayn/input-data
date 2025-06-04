// Set current date for readonly date fields
document.addEventListener("DOMContentLoaded", function () {
  // Set current date for readonly fields
  const currentDate = new Date()
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/\./g, ":");

  document.getElementById("tanggal_pencacah").value = currentDate;
  document.getElementById("tanggal_pemberi_jawaban").value = currentDate;

  // Set up form submission
  const form = document.getElementById("finalForm");
  const successAlert = document.getElementById("successAlert");
  const errorAlert = document.getElementById("errorAlert");
  const errorMessage = document.getElementById("errorMessage");

  // Close success alert
  document.getElementById("closeAlert").addEventListener("click", function () {
    successAlert.classList.add("hidden");
  });

  // Close error alert
  document
    .getElementById("closeErrorAlert")
    .addEventListener("click", function () {
      errorAlert.classList.add("hidden");
    });

  // Form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Reset error states
    document
      .querySelectorAll(".text-red-500")
      .forEach((el) => el.classList.add("hidden"));
    errorAlert.classList.add("hidden");

    // Validate required fields
    let isValid = true;
    const requiredFields = [
      { id: "nama_pencacah", errorId: "nama_pencacah_error" },
      { id: "hp_pencacah", errorId: "hp_pencacah_error" },
      { id: "nama_pemberi_jawaban", errorId: "nama_pemberi_jawaban_error" },
      { id: "hp_pemberi_jawaban", errorId: "hp_pemberi_jawaban_error" },
    ];

    requiredFields.forEach((field) => {
      const input = document.getElementById(field.id);
      const errorElement = document.getElementById(field.errorId);

      if (!input.value.trim()) {
        errorElement.classList.remove("hidden");
        isValid = false;
        input.classList.add("border-red-500");
      } else {
        input.classList.remove("border-red-500");
      }
    });

    if (!isValid) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Menyimpan...
    `;

    try {
      // Create form data
      const formData = new FormData(form);

      // Submit the form
      const response = await fetch("/submit-final", {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const result = await response.json();

      // Reset button state
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;

      if (result.success) {
        // Show success message
        successAlert.classList.remove("hidden");
        form.reset();

        // Set up download link if admin
        const downloadLink = document.getElementById("downloadLink");
        if (downloadLink) {
          downloadLink.addEventListener("click", async function (e) {
            e.preventDefault();
            try {
              const response = await fetch("/download-excel", {
                headers: {
                  "X-Requested-With": "XMLHttpRequest",
                },
              });

              if (response.ok) {
                // Create a blob from the response
                const blob = await response.blob();
                // Create a temporary URL for the blob
                const url = window.URL.createObjectURL(blob);
                // Create a temporary link element
                const a = document.createElement("a");
                a.href = url;
                // Get the filename from the Content-Disposition header if available
                const contentDisposition = response.headers.get(
                  "Content-Disposition"
                );
                const filenameMatch =
                  contentDisposition &&
                  contentDisposition.match(/filename="(.+)"/);
                a.download = filenameMatch
                  ? filenameMatch[1]
                  : "data_sensus.xlsx";
                // Trigger the download
                document.body.appendChild(a);
                a.click();
                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Download failed");
              }
            } catch (error) {
              console.error("Download error:", error);
              errorMessage.textContent =
                "Gagal mengunduh file. Silakan coba lagi.";
              errorAlert.classList.remove("hidden");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          });
        }

        // Auto redirect after 3 seconds if redirect URL is provided
        if (result.redirect && result.redirect_url) {
          setTimeout(function () {
            window.location.href = result.redirect_url;
          }, 3000);
        }
      } else {
        // Show error message
        errorMessage.textContent =
          result.message || "Terjadi kesalahan. Silakan coba lagi.";
        errorAlert.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error:", error);

      // Reset button state
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;

      // Show error message
      errorMessage.textContent =
        "Terjadi kesalahan jaringan. Silakan coba lagi.";
      errorAlert.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});
