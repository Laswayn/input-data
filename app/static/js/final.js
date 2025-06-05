document.addEventListener("DOMContentLoaded", () => {
  // Check for URL parameters to show messages
  const urlParams = new URLSearchParams(window.location.search)
  const successParam = urlParams.get("success")
  const errorParam = urlParams.get("error")

  const successAlert = document.getElementById("successAlert")
  const errorAlert = document.getElementById("errorAlert")
  const successMessage = document.getElementById("successMessage")
  const errorMessage = document.getElementById("errorMessage")

  // Show success message if present
  if (successParam && successAlert && successMessage) {
    successMessage.textContent = decodeURIComponent(successParam)
    successAlert.classList.remove("hidden")
  }

  // Show error message if present
  if (errorParam && errorAlert && errorMessage) {
    errorMessage.textContent = decodeURIComponent(errorParam)
    errorAlert.classList.remove("hidden")
  }

  // Set current date for readonly date fields
  const currentDate = new Date()
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/\./g, ":")

  const tanggalPencacahEl = document.getElementById("tanggal_pencacah")
  const tanggalPemberiJawabanEl = document.getElementById("tanggal_pemberi_jawaban")

  if (tanggalPencacahEl) tanggalPencacahEl.value = currentDate
  if (tanggalPemberiJawabanEl) tanggalPemberiJawabanEl.value = currentDate

  // Set up form submission
  const form = document.getElementById("finalForm")
  const closeAlert = document.getElementById("closeAlert")
  const closeErrorAlert = document.getElementById("closeErrorAlert")

  // Close success alert
  if (closeAlert) {
    closeAlert.addEventListener("click", () => {
      if (successAlert) successAlert.classList.add("hidden")
    })
  }

  // Close error alert
  if (closeErrorAlert) {
    closeErrorAlert.addEventListener("click", () => {
      if (errorAlert) errorAlert.classList.add("hidden")
    })
  }

  // Form submission
  if (form) {
    form.addEventListener("submit", (e) => {
      // Reset error states
      document.querySelectorAll(".text-red-500").forEach((el) => el.classList.add("hidden"))
      if (errorAlert) errorAlert.classList.add("hidden")

      // Validate required fields
      let isValid = true
      const requiredFields = [
        { id: "nama_pencacah", errorId: "nama_pencacah_error" },
        { id: "hp_pencacah", errorId: "hp_pencacah_error" },
        { id: "nama_pemberi_jawaban", errorId: "nama_pemberi_jawaban_error" },
        { id: "hp_pemberi_jawaban", errorId: "hp_pemberi_jawaban_error" },
      ]

      requiredFields.forEach((field) => {
        const input = document.getElementById(field.id)
        const errorElement = document.getElementById(field.errorId)

        if (input && !input.value.trim()) {
          if (errorElement) errorElement.classList.remove("hidden")
          isValid = false
          input.classList.add("border-red-500")
        } else if (input) {
          input.classList.remove("border-red-500")
        }
      })

      if (!isValid) {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: "smooth" })
        return false
      }

      // Show loading state
      const submitButton = form.querySelector('button[type="submit"]')
      if (submitButton) {
        const originalButtonText = submitButton.innerHTML
        submitButton.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Menyimpan...
        `
        submitButton.disabled = true
      }

      // Form will submit normally to the server
      return true
    })
  }

  // Set up download link if it exists
  const downloadLink = document.getElementById("downloadLink")
  if (downloadLink) {
    downloadLink.addEventListener("click", (e) => {
      e.preventDefault()
      // Simple redirect to download route
      window.location.href = "/download-excel"
    })
  }
})
