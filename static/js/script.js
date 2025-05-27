document.addEventListener("DOMContentLoaded", () => {
  const dataForm = document.getElementById("dataForm");
  const successAlert = document.getElementById("successAlert");
  const errorAlert = document.getElementById("errorAlert");
  const errorMessage = document.getElementById("errorMessage");
  const closeAlert = document.getElementById("closeAlert");
  const closeErrorAlert = document.getElementById("closeErrorAlert");
  const downloadExcel = document.getElementById("downloadExcel");
  const downloadLink = document.getElementById("downloadLink");

  // Preview image for each file input
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
      input.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file) {
              const reader = new FileReader();
              const previewDiv = document.getElementById(`preview_${input.name}`);
              const previewImg = previewDiv.querySelector('img');
              
              reader.onload = function(e) {
                  previewImg.src = e.target.result;
                  previewDiv.classList.remove('hidden');
              }
              
              reader.readAsDataURL(file);
          }
      });
  });

  // Check if Excel file exists and update download button
  fetch("/check-file")
    .then((response) => response.json())
    .then((data) => {
      if (data.exists) {
        downloadExcel.href = "/download/data_sensus.xlsx";
        downloadExcel.classList.remove("hidden");
      }
    })
    .catch((error) => console.error("Error checking file:", error));

  // Validasi input RT dan RW hanya angka
  document.getElementById("rt").addEventListener("input", function (e) {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  document.getElementById("rw").addEventListener("input", function (e) {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  // Validasi jumlah anggota 15+ tidak lebih dari jumlah anggota total
  document
    .getElementById("jumlah_anggota_15plus")
    .addEventListener("input", function (e) {
      const totalAnggota =
        Number.parseInt(document.getElementById("jumlah_anggota").value) || 0;
      const anggota15Plus = Number.parseInt(this.value) || 0;

      if (anggota15Plus > totalAnggota) {
        this.value = totalAnggota;
      }
    });

  document
    .getElementById("jumlah_anggota")
    .addEventListener("input", function (e) {
      const totalAnggota = Number.parseInt(this.value) || 0;
      const anggota15Plus =
        Number.parseInt(
          document.getElementById("jumlah_anggota_15plus").value
        ) || 0;

      if (anggota15Plus > totalAnggota) {
        document.getElementById("jumlah_anggota_15plus").value = totalAnggota;
      }
    });

  // Form validation
  dataForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Reset error messages
    document
      .querySelectorAll(".text-red-500")
      .forEach((el) => el.classList.add("hidden"));

    let isValid = true;

    // Validate required fields
    const requiredFields = [
      "rt",
      "rw",
      "dusun",
      "nama_kepala",
      "alamat",
      "jumlah_anggota",
      "jumlah_anggota_15plus",
    ];

    requiredFields.forEach((field) => {
      const input = document.getElementById(field);
      const error = document.getElementById(`${field}_error`);

      if (!input.value.trim()) {
        error.classList.remove("hidden");
        isValid = false;

        // Add shake animation
        input.classList.add("border-red-500");
        input.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-5px)" },
            { transform: "translateX(5px)" },
            { transform: "translateX(-5px)" },
            { transform: "translateX(5px)" },
            { transform: "translateX(0)" },
          ],
          {
            duration: 500,
            easing: "ease-in-out",
          }
        );

        // Remove red border after 2 seconds
        setTimeout(() => {
          input.classList.remove("border-red-500");
        }, 2000);
      }
    });

    // Additional validation for jumlah_anggota_15plus
    const totalMembers =
      Number.parseInt(document.getElementById("jumlah_anggota").value) || 0;
    const adultMembers =
      Number.parseInt(document.getElementById("jumlah_anggota_15plus").value) ||
      0;

    if (adultMembers > totalMembers) {
      document.getElementById("jumlah_anggota_15plus_error").textContent =
        "Tidak boleh lebih dari jumlah anggota keluarga";
      document
        .getElementById("jumlah_anggota_15plus_error")
        .classList.remove("hidden");
      isValid = false;
    }

    if (isValid) {
      // Create form data
      const formData = new FormData(dataForm);

      // Show loading state
      const submitButton = dataForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
            `;
      submitButton.disabled = true;

      // Send data to server
      fetch("/submit", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Reset button state
          submitButton.innerHTML = originalButtonText;
          submitButton.disabled = false;

          if (data.success) {
            // Jika perlu redirect ke halaman lanjutan
            if (data.redirect) {
              window.location.href = data.redirect_url;
              return;
            }

            // Show success message
            successAlert.classList.remove("hidden");
            errorAlert.classList.add("hidden");

            // Update download link
            if (data.download_url) {
              downloadLink.href = data.download_url;
              downloadExcel.href = data.download_url;
              downloadExcel.classList.remove("hidden");
            }

            // Reset form
            dataForm.reset();

            // Reset image previews
            document.querySelectorAll('[id^="preview_ttd_"]').forEach(preview => {
              preview.classList.add('hidden');
            });

            // Scroll to success message
            successAlert.scrollIntoView({ behavior: "smooth" });

            // Hide success message after 10 seconds
            setTimeout(() => {
              successAlert.classList.add("hidden");
            }, 10000);
          } else {
            // Show error message
            errorMessage.textContent = data.message || "Terjadi kesalahan.";
            errorAlert.classList.remove("hidden");
            successAlert.classList.add("hidden");

            // Scroll to error message
            errorAlert.scrollIntoView({ behavior: "smooth" });
          }
        })
        .catch((error) => {
          // Reset button state
          submitButton.innerHTML = originalButtonText;
          submitButton.disabled = false;

          console.error("Error:", error);
          errorMessage.textContent = "Terjadi kesalahan pada server.";
          errorAlert.classList.remove("hidden");
          successAlert.classList.add("hidden");

          // Scroll to error message
          errorAlert.scrollIntoView({ behavior: "smooth" });
        });
    } else {
      // Show error message
      errorAlert.classList.remove("hidden");
      errorMessage.textContent = "Mohon lengkapi semua field yang wajib diisi.";

      // Scroll to first error
      const firstError = document.querySelector(".text-red-500:not(.hidden)");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  });

  // Input event listeners to hide error messages when typing
  const allInputs = document.querySelectorAll("input, textarea");
  allInputs.forEach((input) => {
    input.addEventListener("input", function () {
      const errorId = `${this.id}_error`;
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.classList.add("hidden");
      }
    });
  });

  // Close alerts
  closeAlert.addEventListener("click", () => {
    successAlert.classList.add("hidden");
  });

  closeErrorAlert.addEventListener("click", () => {
    errorAlert.classList.add("hidden");
  });
});