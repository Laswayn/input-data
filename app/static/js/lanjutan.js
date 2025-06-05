document.addEventListener("DOMContentLoaded", () => {
  const dataForm = document.getElementById("dataForm")
  const successAlert = document.getElementById("successAlert")
  const errorAlert = document.getElementById("errorAlert")
  const errorMessage = document.getElementById("errorMessage")
  const successMessage = document.getElementById("successMessage")
  const closeAlert = document.getElementById("closeAlert")
  const closeErrorAlert = document.getElementById("closeErrorAlert")

  // Update nama placeholders when nama field changes
  function updateNamaPlaceholders(nama) {
    const placeholders = document.querySelectorAll(".nama-placeholder")
    placeholders.forEach((placeholder) => {
      placeholder.textContent = nama || "NAMA"
    })
  }

  // Listen for nama input changes
  const namaInput = document.getElementById("nama")
  if (namaInput) {
    namaInput.addEventListener("input", function () {
      updateNamaPlaceholders(this.value)
    })
  }

  // Close alert handlers
  if (closeAlert) {
    closeAlert.addEventListener("click", () => {
      successAlert.classList.add("hidden")
    })
  }

  if (closeErrorAlert) {
    closeErrorAlert.addEventListener("click", () => {
      errorAlert.classList.add("hidden")
    })
  }

  // Form validation and submission
  if (dataForm) {
    dataForm.addEventListener("submit", (e) => {
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

        if (input && (!input.value || !input.value.trim())) {
          if (error) error.classList.remove("hidden")
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
        } else if (input) {
          input.classList.remove("border-red-500")
        }
      })

      // Additional validation for conditional fields
      const memilikiPekerjaanEl = document.getElementById("memiliki_pekerjaan")
      if (memilikiPekerjaanEl && memilikiPekerjaanEl.value === "Tidak") {
        const statusPekerjaanEl = document.getElementById("status_pekerjaan_diinginkan")
        const statusError = document.getElementById("status_pekerjaan_diinginkan_error")

        if (statusPekerjaanEl && !statusPekerjaanEl.value) {
          if (statusError) statusError.classList.remove("hidden")
          isValid = false
        }

        if (statusPekerjaanEl && statusPekerjaanEl.value === "Berusaha Sendiri") {
          const bidangUsahaEl = document.getElementById("bidang_usaha")
          const bidangError = document.getElementById("bidang_usaha_error")

          if (bidangUsahaEl && !bidangUsahaEl.value) {
            if (bidangError) bidangError.classList.remove("hidden")
            isValid = false
          }

          if (bidangUsahaEl && bidangUsahaEl.value === "Lainnya") {
            const otherInputEl = document.getElementById("other_bidang_usaha_input")
            const otherError = document.getElementById("other_bidang_usaha_error")

            if (otherInputEl && (!otherInputEl.value || !otherInputEl.value.trim())) {
              if (otherError) otherError.classList.remove("hidden")
              isValid = false
            }
          }
        }
      }

      // Age validation
      const umurEl = document.getElementById("umur")
      const umurError = document.getElementById("umur_error")
      if (umurEl) {
        const umur = Number.parseInt(umurEl.value)
        if (isNaN(umur) || umur < 15 || umur > 64) {
          if (umurError) umurError.classList.remove("hidden")
          isValid = false
        }
      }

      // If form is not valid, prevent submission
      if (!isValid) {
        e.preventDefault()
        return false
      }

      // Show loading state
      const submitBtn = dataForm.querySelector('button[type="submit"]')
      if (submitBtn) {
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Menyimpan...
        `
        submitBtn.disabled = true
      }

      // Handle "Lainnya" option for bidang usaha
      const bidangUsahaEl = document.getElementById("bidang_usaha")
      if (bidangUsahaEl && bidangUsahaEl.value === "Lainnya") {
        const otherInputEl = document.getElementById("other_bidang_usaha_input")
        if (otherInputEl && otherInputEl.value) {
          bidangUsahaEl.value = otherInputEl.value
        }
      }

      // Form will submit normally to the server
      return true
    })
  }

  // Check for URL parameters to show messages
  const urlParams = new URLSearchParams(window.location.search)
  const successParam = urlParams.get("success")
  const errorParam = urlParams.get("error")

  if (successParam && successMessage && successAlert) {
    successMessage.textContent = decodeURIComponent(successParam)
    successAlert.classList.remove("hidden")
  }

  if (errorParam && errorMessage && errorAlert) {
    errorMessage.textContent = decodeURIComponent(errorParam)
    errorAlert.classList.remove("hidden")
  }
})

// Global functions for inline event handlers
window.checkMemilikiPekerjaan = () => {
  const memilikiPekerjaanEl = document.getElementById("memiliki_pekerjaan")
  const statusContainer = document.getElementById("status_pekerjaan_container")
  const bidangContainer = document.getElementById("bidang_usaha_container")

  if (!memilikiPekerjaanEl || !statusContainer) return

  const memilikiPekerjaan = memilikiPekerjaanEl.value

  if (memilikiPekerjaan === "Tidak") {
    statusContainer.classList.remove("hidden")
  } else {
    statusContainer.classList.add("hidden")
    if (bidangContainer) bidangContainer.classList.add("hidden")

    // Reset values when hiding
    const statusEl = document.getElementById("status_pekerjaan_diinginkan")
    const bidangEl = document.getElementById("bidang_usaha")
    const otherContainer = document.getElementById("other_bidang_usaha")

    if (statusEl) statusEl.value = ""
    if (bidangEl) bidangEl.value = ""
    if (otherContainer) otherContainer.classList.add("hidden")
  }
}

window.toggleBidangUsaha = () => {
  const statusEl = document.getElementById("status_pekerjaan_diinginkan")
  const bidangContainer = document.getElementById("bidang_usaha_container")

  if (!statusEl || !bidangContainer) return

  const statusPekerjaan = statusEl.value

  if (statusPekerjaan === "Berusaha Sendiri") {
    bidangContainer.classList.remove("hidden")
  } else {
    bidangContainer.classList.add("hidden")

    const bidangEl = document.getElementById("bidang_usaha")
    const otherContainer = document.getElementById("other_bidang_usaha")

    if (bidangEl) bidangEl.value = ""
    if (otherContainer) otherContainer.classList.add("hidden")
  }
}

function checkHubungan() {
  const hubunganEl = document.getElementById("hubungan")
  const statusPerkawinanEl = document.getElementById("status_perkawinan")

  if (!hubunganEl || !statusPerkawinanEl) return

  const hubungan = hubunganEl.value
  const optionBelumKawin = statusPerkawinanEl.querySelector('option[value="Belum Kawin"]')

  if (!optionBelumKawin) return

  if (hubungan === "Suami/Istri") {
    optionBelumKawin.disabled = true
    if (statusPerkawinanEl.value === "Belum Kawin") {
      statusPerkawinanEl.value = ""
    }
  } else {
    optionBelumKawin.disabled = false
  }
}

function toggleOtherInput() {
  const bidangUsahaSelect = document.getElementById("bidang_usaha")
  const otherBidangUsahaDiv = document.getElementById("other_bidang_usaha")
  const otherBidangUsahaInput = document.getElementById("other_bidang_usaha_input")

  if (!bidangUsahaSelect || !otherBidangUsahaDiv) return

  if (bidangUsahaSelect.value === "Lainnya") {
    otherBidangUsahaDiv.classList.remove("hidden")
    if (otherBidangUsahaInput) otherBidangUsahaInput.value = ""
  } else {
    otherBidangUsahaDiv.classList.add("hidden")
  }
}

function checkKegiatan() {
  const kegiatanEl = document.getElementById("kegiatan")
  const memilikiPekerjaanSelect = document.getElementById("memiliki_pekerjaan")

  if (!kegiatanEl || !memilikiPekerjaanSelect) return

  const kegiatan = kegiatanEl.value
  const tidakOption = memilikiPekerjaanSelect.querySelector('option[value="Tidak"]')
  const statusContainer = document.getElementById("status_pekerjaan_container")
  const bidangContainer = document.getElementById("bidang_usaha_container")

  if (kegiatan === "Bekerja") {
    memilikiPekerjaanSelect.value = "Ya"
    if (tidakOption) tidakOption.disabled = true

    // Hide containers
    if (statusContainer) statusContainer.classList.add("hidden")
    if (bidangContainer) bidangContainer.classList.add("hidden")

    // Reset values
    const statusEl = document.getElementById("status_pekerjaan_diinginkan")
    const bidangEl = document.getElementById("bidang_usaha")

    if (statusEl) statusEl.value = ""
    if (bidangEl) bidangEl.value = ""
  } else {
    if (tidakOption) tidakOption.disabled = false
    memilikiPekerjaanSelect.value = ""

    if (memilikiPekerjaanSelect.value === "Tidak") {
      if (statusContainer) statusContainer.classList.remove("hidden")
    } else {
      if (statusContainer) statusContainer.classList.add("hidden")
      if (bidangContainer) bidangContainer.classList.add("hidden")
    }
  }
}
