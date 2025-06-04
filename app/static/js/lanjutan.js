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
  dataForm.addEventListener("submit", async (e) => {
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
            { transform: "translateX(0)" },
          ],
          { duration: 100, iterations: 3 },
        )
      } else {
        input.classList.remove("border-red-500")
      }
    })

    // Additional validation for conditional fields
    const memilikiPekerjaan = document.getElementById("memiliki_pekerjaan").value
    if (memilikiPekerjaan === "Tidak") {
      const statusPekerjaan = document.getElementById("status_pekerjaan_diinginkan").value
      const statusError = document.getElementById("status_pekerjaan_diinginkan_error")

      if (!statusPekerjaan) {
        statusError.classList.remove("hidden")
        isValid = false
      }

      if (statusPekerjaan === "Berusaha Sendiri") {
        const bidangUsaha = document.getElementById("bidang_usaha").value
        const bidangError = document.getElementById("bidang_usaha_error")

        if (!bidangUsaha) {
          bidangError.classList.remove("hidden")
          isValid = false
        }

        if (bidangUsaha === "Lainnya") {
          const otherInput = document.getElementById("other_bidang_usaha_input").value
          const otherError = document.getElementById("other_bidang_usaha_error")

          if (!otherInput.trim()) {
            otherError.classList.remove("hidden")
            isValid = false
          }
        }
      }
    }

    // Age validation
    const umur = Number.parseInt(document.getElementById("umur").value)
    if (umur < 15 || umur > 64) {
      document.getElementById("umur_error").classList.remove("hidden")
      isValid = false
    }

    // If form is valid, submit it
    if (isValid) {
      try {
        // Show loading state
        const submitBtn = dataForm.querySelector('button[type="submit"]')
        const originalText = submitBtn.innerHTML
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Menyimpan...
        `
        submitBtn.disabled = true

        // Prepare form data
        const formData = new FormData(dataForm)

        // Handle "Lainnya" option for bidang usaha
        const bidangUsaha = document.getElementById("bidang_usaha").value
        if (bidangUsaha === "Lainnya") {
          const otherValue = document.getElementById("other_bidang_usaha_input").value
          formData.set("bidang_usaha", otherValue)
        }

        // Submit form
        const response = await fetch("/submit-individu", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (result.success) {
          successMessage.textContent = result.message
          successAlert.classList.remove("hidden")

          // Update remaining count if provided
          if (result.remaining !== undefined) {
            remainingSpan.textContent = result.remaining
          }

          // Handle different response types
          if (result.redirect && result.redirect_url) {
            // Redirect to specified URL (job input or final page)
            setTimeout(() => {
              window.location.href = result.redirect_url
            }, 1500)
          } else if (result.continue_next_member) {
            // Continue to next member - reset form
            setTimeout(() => {
              resetFormCompletely()
              successAlert.classList.add("hidden")

              // Update remaining count
              if (result.remaining !== undefined) {
                remainingSpan.textContent = result.remaining
              }

              // Scroll to top
              window.scrollTo({ top: 0, behavior: "smooth" })
            }, 1500)
          }
        } else {
          errorMessage.textContent = result.message || "Terjadi kesalahan saat menyimpan data"
          errorAlert.classList.remove("hidden")
        }

        // Restore button state
        submitBtn.innerHTML = originalText
        submitBtn.disabled = false
      } catch (error) {
        console.error("Error submitting form:", error)
        errorMessage.textContent = "Terjadi kesalahan koneksi. Silakan coba lagi."
        errorAlert.classList.remove("hidden")

        // Restore button state
        const submitBtn = dataForm.querySelector('button[type="submit"]')
        const originalText = submitBtn.innerHTML // Declare originalText variable
        submitBtn.innerHTML = originalText
        submitBtn.disabled = false
      }
    }
  })

  // Close success alert
  closeAlert.addEventListener("click", () => {
    successAlert.classList.add("hidden")
  })

  // Close error alert
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
    document.getElementById("other_bidang_usaha").classList.add("hidden")
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
    document.getElementById("other_bidang_usaha").classList.add("hidden")
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

function resetFormCompletely() {
  // Reset form
  const dataForm = document.getElementById("dataForm")
  dataForm.reset()

  // Reset nama placeholders
  const updateNamaPlaceholders = (nama) => {
    const placeholders = document.querySelectorAll(".nama-placeholder")
    placeholders.forEach((placeholder) => {
      placeholder.textContent = nama || "NAMA"
    })
  }
  updateNamaPlaceholders("")

  // Hide all conditional sections
  document.getElementById("status_pekerjaan_container").classList.add("hidden")
  document.getElementById("bidang_usaha_container").classList.add("hidden")
  document.getElementById("other_bidang_usaha").classList.add("hidden")

  // Reset all select values to default
  const selects = dataForm.querySelectorAll("select")
  selects.forEach((select) => {
    select.selectedIndex = 0
  })

  // Reset all error messages
  document.querySelectorAll(".text-red-500").forEach((el) => el.classList.add("hidden"))

  // Reset any disabled options
  const statusPerkawinanSelect = document.getElementById("status_perkawinan")
  const belumKawinOption = statusPerkawinanSelect.querySelector('option[value="Belum Kawin"]')
  if (belumKawinOption) {
    belumKawinOption.disabled = false
  }

  const memilikiPekerjaanSelect = document.getElementById("memiliki_pekerjaan")
  const tidakOption = memilikiPekerjaanSelect.querySelector('option[value="Tidak"]')
  if (tidakOption) {
    tidakOption.disabled = false
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" })

  console.log("Form completely reset for next member")
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
