document.addEventListener("DOMContentLoaded", () => {
  const finalForm = document.getElementById("finalForm")
  const successAlert = document.getElementById("successAlert")
  const errorAlert = document.getElementById("errorAlert")
  const errorMessage = document.getElementById("errorMessage")
  const closeAlert = document.getElementById("closeAlert")
  const closeErrorAlert = document.getElementById("closeErrorAlert")
  const downloadLink = document.getElementById("downloadLink")

  // Set current date and time as default
  const now = new Date()
  const currentDateTime =
    now.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }) +
    " " +
    now.toLocaleTimeString("id-ID")

  document.getElementById("tanggal_pencacah").value = currentDateTime
  document.getElementById("tanggal_pemberi_jawaban").value = currentDateTime

  // Form validation and submission
  finalForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Reset error messages
    document.querySelectorAll(".text-red-500").forEach((el) => el.classList.add("hidden"))

    let isValid = true

    // Validate required fields
    const requiredFields = ["nama_pencacah", "hp_pencacah", "nama_pemberi_jawaban", "hp_pemberi_jawaban"]

    requiredFields.forEach((field) => {
      const input = document.getElementById(field)
      const error = document.getElementById(`${field}_error`)

      if (!input.value.trim()) {
        error.classList.remove("hidden")
        isValid = false

        // Add shake animation
        input.classList.add("border-red-500")
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
          },
        )

        // Remove red border after 2 seconds
        setTimeout(() => {
          input.classList.remove("border-red-500")
        }, 2000)
      }
    })

    if (isValid) {
      // Create form data
      const formData = new FormData(finalForm)

      // Show loading state
      const submitButton = finalForm.querySelector('button[type="submit"]')
      const originalButtonText = submitButton.innerHTML
      submitButton.innerHTML = `
                        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                    `
      submitButton.disabled = true

      // Send data to server
      fetch("/submit-final", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Reset button state
          submitButton.innerHTML = originalButtonText
          submitButton.disabled = false

          if (data.success) {
            // Clear all saved form data
            localStorage.removeItem("lanjutan_form_data")
            localStorage.removeItem("pekerjaan_form_data")

            // Show success message
            successAlert.classList.remove("hidden")
            errorAlert.classList.add("hidden")

            // Update download link
            if (data.download_url) {
              downloadLink.href = data.download_url
            }

            // Scroll to success message
            successAlert.scrollIntoView({ behavior: "smooth" })

            // Redirect after 3 seconds
            setTimeout(() => {
              if (data.redirect_url) {
                window.location.href = data.redirect_url
              }
            }, 3000)
          } else {
            // Show error message
            errorMessage.textContent = data.message || "Terjadi kesalahan."
            errorAlert.classList.remove("hidden")
            successAlert.classList.add("hidden")

            // Scroll to error message
            errorAlert.scrollIntoView({ behavior: "smooth" })
          }
        })
        .catch((error) => {
          // Reset button state
          submitButton.innerHTML = originalButtonText
          submitButton.disabled = false

          console.error("Error:", error)
          errorMessage.textContent = "Terjadi kesalahan pada server."
          errorAlert.classList.remove("hidden")
          successAlert.classList.add("hidden")

          // Scroll to error message
          errorAlert.scrollIntoView({ behavior: "smooth" })
        })
    } else {
      // Show error message
      errorAlert.classList.remove("hidden")
      errorMessage.textContent = "Mohon lengkapi semua field yang wajib diisi."

      // Scroll to first error
      const firstError = document.querySelector(".text-red-500:not(.hidden)")
      if (firstError) {
        firstError.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  })

  // Input event listeners to hide error messages when typing
  const allInputs = document.querySelectorAll("input, textarea")
  allInputs.forEach((input) => {
    input.addEventListener("input", function () {
      const errorId = `${this.id}_error`
      const errorElement = document.getElementById(errorId)
      if (errorElement) {
        errorElement.classList.add("hidden")
      }
    })
  })

  // Close alerts
  closeAlert.addEventListener("click", () => {
    successAlert.classList.add("hidden")
  })

  closeErrorAlert.addEventListener("click", () => {
    errorAlert.classList.add("hidden")
  })
})
