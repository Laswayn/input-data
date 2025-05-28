document.addEventListener("DOMContentLoaded", () => {
  const dataForm = document.getElementById("dataForm")
  const successAlert = document.getElementById("successAlert")
  const errorAlert = document.getElementById("errorAlert")
  const errorMessage = document.getElementById("errorMessage")
  const successMessage = document.getElementById("successMessage")
  const closeAlert = document.getElementById("closeAlert")
  const closeErrorAlert = document.getElementById("closeErrorAlert")
  const remainingSpan = document.getElementById("remaining")

  // Update nama placeholders when nama field changes
  function updateNamaPlaceholders(nama) {
    const placeholders = document.querySelectorAll(".nama-placeholder")
    placeholders.forEach((placeholder) => {
      placeholder.textContent = nama || "NAMA"
    })
  }

  // Listen for nama input changes
  document.getElementById("nama").addEventListener("input", function () {
    updateNamaPlaceholders(this.value)
  })

  // Form validation and submission
  dataForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Reset error messages
    document.querySelectorAll(".text-red-500").forEach((el) => el.classList.add("hidden"))

    let isValid = true

    // Validate required fields
    const requiredFields = [
      "nama",
      "umur",
      "hubungan",
      "jenis_kelamin",
      "status_perkawinan",
      "pendidikan",
      "kegiatan",
      "memiliki_pekerjaan",
    ]

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

    // Validate conditional fields
    const memilikiPekerjaan = document.getElementById("memiliki_pekerjaan").value
    const statusPekerjaanDiinginkan = document.getElementById("status_pekerjaan_diinginkan")
    const bidangUsaha = document.getElementById("bidang_usaha")

    // If memiliki_pekerjaan is "Tidak", status_pekerjaan_diinginkan is required
    if (memilikiPekerjaan === "Tidak" && !statusPekerjaanDiinginkan.value.trim()) {
      document.getElementById("status_pekerjaan_diinginkan_error").classList.remove("hidden")
      isValid = false
    }

    // If status_pekerjaan_diinginkan is "Berusaha Sendiri", bidang_usaha is required
    if (statusPekerjaanDiinginkan.value === "Berusaha Sendiri" && !bidangUsaha.value.trim()) {
      document.getElementById("bidang_usaha_error").classList.remove("hidden")
      isValid = false
    }

    // Validate age
    const umur = Number.parseInt(document.getElementById("umur").value)
    if (umur < 15) {
      document.getElementById("umur_error").classList.remove("hidden")
      isValid = false
    }

    if (isValid) {
      // Create form data
      const formData = new FormData(dataForm)

      // Show loading state
      const submitButton = dataForm.querySelector('button[type="submit"]')
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
      fetch("/submit-individu", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Reset button state
          submitButton.innerHTML = originalButtonText
          submitButton.disabled = false

          console.log("Server response:", data) // Debug log

          if (data.success) {
            // Show success message
            successAlert.classList.remove("hidden")
            errorAlert.classList.add("hidden")
            successMessage.textContent = data.message

            // Update remaining count if provided
            if (data.remaining !== undefined) {
              remainingSpan.textContent = data.remaining
            }

            if (data.continue_next_member) {
              // Clear saved data and reset form for next member
              clearSavedData()
              dataForm.reset()
              updateNamaPlaceholders("")

              // Hide conditional sections
              document.getElementById("status_pekerjaan_container").classList.add("hidden")
              document.getElementById("bidang_usaha_container").classList.add("hidden")

              // Scroll to top
              window.scrollTo({ top: 0, behavior: "smooth" })

              // Hide success message after 3 seconds
              setTimeout(() => {
                successAlert.classList.add("hidden")
              }, 3000)
            } else if (data.redirect) {
              // Redirect to final page or next step
              console.log("Redirecting to:", data.redirect_url) // Debug log
              setTimeout(() => {
                window.location.href = data.redirect_url
              }, 2000)
            }

            // Scroll to success message
            successAlert.scrollIntoView({ behavior: "smooth" })
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
        firstError.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  })

  // Input event listeners to hide error messages when typing
  const allInputs = document.querySelectorAll("input, select, textarea")
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

// Make functions global so they can be called from inline scripts
window.checkMemilikiPekerjaan = () => {
  const memilikiPekerjaan = document.getElementById("memiliki_pekerjaan").value
  const statusPekerjaanContainer = document.getElementById("status_pekerjaan_container")
  const bidangUsahaContainer = document.getElementById("bidang_usaha_container")

  console.log("checkMemilikiPekerjaan called with:", memilikiPekerjaan)

  if (memilikiPekerjaan === "Tidak") {
    statusPekerjaanContainer.classList.remove("hidden")
  } else {
    statusPekerjaanContainer.classList.add("hidden")
    bidangUsahaContainer.classList.add("hidden")
    // Reset values when hiding
    document.getElementById("status_pekerjaan_diinginkan").value = ""
    document.getElementById("bidang_usaha").value = ""
  }
}

// Function to toggle bidang usaha field
window.toggleBidangUsaha = () => {
  const statusPekerjaan = document.getElementById("status_pekerjaan_diinginkan").value
  const bidangUsahaContainer = document.getElementById("bidang_usaha_container")

  console.log("toggleBidangUsaha called with:", statusPekerjaan)

  if (statusPekerjaan === "Berusaha Sendiri") {
    bidangUsahaContainer.classList.remove("hidden")
  } else {
    bidangUsahaContainer.classList.add("hidden")
    document.getElementById("bidang_usaha").value = ""
  }
}

// Function to check memiliki pekerjaan and show/hide conditional fields
function checkMemilikiPekerjaan() {
  window.checkMemilikiPekerjaan()
}

// Function to toggle bidang usaha field
function toggleBidangUsaha() {
  window.toggleBidangUsaha()
}

// Declare clearSavedData function
function clearSavedData() {
  localStorage.removeItem("lanjutan_form_data")
  console.log("Saved data cleared")
}

function checkHubungan() {
  const hubungan = document.getElementById("hubungan").value
  const statusPerkawinan = document.getElementById("status_perkawinan")
  const optionBelumKawin = statusPerkawinan.querySelector('option[value="Belum Kawin"]')

  // Reset the status perkawinan dropdown
  if (hubungan === "Suami/Istri") {
    optionBelumKawin.disabled = true // Disable "Belum Kawin"
    if (statusPerkawinan.value === "Belum Kawin") {
      statusPerkawinan.value = "" // Reset if currently selected
    }
  } else {
    optionBelumKawin.disabled = false // Enable "Belum Kawin" for other relationships
  }
}

function toggleOtherInput() {
  const bidangUsahaSelect = document.getElementById("bidang_usaha")
  const otherBidangUsahaDiv = document.getElementById("other_bidang_usaha")
  const otherBidangUsahaInput = document.getElementById("other_bidang_usaha_input")

  if (bidangUsahaSelect.value === "Lainnya") {
    otherBidangUsahaDiv.classList.remove("hidden") // Show the input field
    otherBidangUsahaInput.value = "" // Clear the input field
  } else {
    otherBidangUsahaDiv.classList.add("hidden") // Hide the input field
  }
}

function checkKegiatan() {
  const kegiatan = document.getElementById("kegiatan").value
  const memilikiPekerjaanSelect = document.getElementById("memiliki_pekerjaan")
  const tidakOption = memilikiPekerjaanSelect.querySelector('option[value="Tidak"]')
  const statusPekerjaanContainer = document.getElementById("status_pekerjaan_container")
  const bidangUsahaContainer = document.getElementById("bidang_usaha_container")

  if (kegiatan === "Bekerja") {
    // Set the "memiliki_pekerjaan" dropdown to "Ya" and disable "Tidak"
    memilikiPekerjaanSelect.value = "Ya" // Automatically select "Ya"
    tidakOption.disabled = true // Disable "Tidak"

    // Hide status pekerjaan and bidang usaha containers
    statusPekerjaanContainer.classList.add("hidden")
    bidangUsahaContainer.classList.add("hidden")

    // Reset values when hiding
    document.getElementById("status_pekerjaan_diinginkan").value = ""
    document.getElementById("bidang_usaha").value = ""
  } else {
    // Enable the dropdown and reset the selection for other activities
    tidakOption.disabled = false // Enable "Tidak"
    memilikiPekerjaanSelect.value = "" // Reset the selection

    // Show status pekerjaan container if "Tidak" is selected
    if (memilikiPekerjaanSelect.value === "Tidak") {
      statusPekerjaanContainer.classList.remove("hidden")
    } else {
      statusPekerjaanContainer.classList.add("hidden")
      bidangUsahaContainer.classList.add("hidden")
    }
  }
}
