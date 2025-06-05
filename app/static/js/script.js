document.addEventListener("DOMContentLoaded", () => {
  // Cascading dropdown data
  const dusunData = {
    Sidopurno: {
      rt: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 31, 32, 33, 34, 35, 36, 42, 43, 44, 45, 48,
      ],
      rw: [1, 2, 3, 4, 8],
    },
    Melaten: {
      rt: [22, 23, 24, 25, 26, 46, 47],
      rw: [6],
    },
    Ngepung: {
      rt: [27, 28, 29, 30, 37, 38, 39, 40, 41],
      rw: [7],
    },
    Duran: {
      rt: [20, 21],
      rw: [5],
    },
    "Maten Perum Grenhill": {
      rt: [49],
      rw: [6],
    },
  }

  // Function to update RT and RW options based on selected Dusun
  window.updateRTRWOptions = () => {
    const dusunSelect = document.getElementById("dusun")
    const rtSelect = document.getElementById("rt")
    const rwSelect = document.getElementById("rw")

    const selectedDusun = dusunSelect.value

    // Clear existing options
    rtSelect.innerHTML = '<option value="" disabled selected>Pilih RT</option>'
    rwSelect.innerHTML = '<option value="" disabled selected>Pilih RW</option>'

    if (selectedDusun && dusunData[selectedDusun]) {
      // Enable dropdowns
      rtSelect.disabled = false
      rwSelect.disabled = false

      // Populate RT options
      dusunData[selectedDusun].rt.forEach((rt) => {
        const option = document.createElement("option")
        option.value = rt.toString().padStart(2, "0") // Format as 01, 02, etc.
        option.textContent = rt.toString().padStart(2, "0")
        rtSelect.appendChild(option)
      })

      // Populate RW options
      dusunData[selectedDusun].rw.forEach((rw) => {
        const option = document.createElement("option")
        option.value = rw.toString().padStart(2, "0") // Format as 01, 02, etc.
        option.textContent = rw.toString().padStart(2, "0")
        rwSelect.appendChild(option)
      })
    } else {
      // Disable dropdowns if no dusun selected
      rtSelect.disabled = true
      rwSelect.disabled = true
      rtSelect.innerHTML = '<option value="" disabled selected>Pilih Dusun dulu</option>'
      rwSelect.innerHTML = '<option value="" disabled selected>Pilih Dusun dulu</option>'
    }
  }

  // Validasi jumlah anggota 15+ tidak lebih dari jumlah anggota total
  const jumlahAnggota15Plus = document.getElementById("jumlah_anggota_15plus")
  const jumlahAnggota = document.getElementById("jumlah_anggota")

  if (jumlahAnggota15Plus) {
    jumlahAnggota15Plus.addEventListener("input", function (e) {
      const totalAnggota = Number.parseInt(jumlahAnggota.value) || 0
      const anggota15Plus = Number.parseInt(this.value) || 0

      if (anggota15Plus > totalAnggota) {
        this.value = totalAnggota
      }
    })
  }

  if (jumlahAnggota) {
    jumlahAnggota.addEventListener("input", function (e) {
      const totalAnggota = Number.parseInt(this.value) || 0
      const anggota15Plus = Number.parseInt(jumlahAnggota15Plus.value) || 0

      if (anggota15Plus > totalAnggota) {
        jumlahAnggota15Plus.value = totalAnggota
      }
    })
  }

  // Check if we're coming from a redirect that should clear data
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get("clear") === "true") {
    // Clear any existing form data
    const form = document.getElementById("dataForm")
    if (form) {
      form.reset()
    }
    // Remove the parameter from URL
    window.history.replaceState({}, document.title, window.location.pathname)
    console.log("Form cleared due to clear parameter")
  }

  // Simple form validation before submission
  const dataForm = document.getElementById("dataForm")
  if (dataForm) {
    dataForm.addEventListener("submit", (e) => {
      // Reset error messages
      document.querySelectorAll(".text-red-500").forEach((el) => el.classList.add("hidden"))

      let isValid = true

      // Validate required fields
      const requiredFields = ["dusun", "rt", "rw", "nama_kepala", "alamat", "jumlah_anggota", "jumlah_anggota_15plus"]

      requiredFields.forEach((field) => {
        const input = document.getElementById(field)
        const error = document.getElementById(`${field}_error`)

        if (!input || !error) return

        // For select elements, check if value is empty or null
        const isEmpty = input.tagName === "SELECT" ? !input.value || input.value === "" : !input.value.trim()

        if (isEmpty) {
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

      // Additional validation for jumlah_anggota_15plus
      const totalMembers = Number.parseInt(document.getElementById("jumlah_anggota").value) || 0
      const adultMembers = Number.parseInt(document.getElementById("jumlah_anggota_15plus").value) || 0

      if (adultMembers > totalMembers) {
        const error = document.getElementById("jumlah_anggota_15plus_error")
        if (error) {
          error.textContent = "Tidak boleh lebih dari jumlah anggota keluarga"
          error.classList.remove("hidden")
        }
        isValid = false
      }

      if (!isValid) {
        e.preventDefault()

        // Scroll to first error
        const firstError = document.querySelector(".text-red-500:not(.hidden)")
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        return false
      }

      // Show loading state
      const submitButton = dataForm.querySelector('button[type="submit"]')
      if (submitButton) {
        const originalButtonText = submitButton.innerHTML
        submitButton.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Menyimpan...
        `
        submitButton.disabled = true
      }

      // Form will submit normally
      return true
    })
  }

  // Input event listeners to hide error messages when changing
  const allInputs = document.querySelectorAll("input, textarea, select")
  allInputs.forEach((input) => {
    const eventType = input.tagName === "SELECT" ? "change" : "input"
    input.addEventListener(eventType, function () {
      const errorId = `${this.id}_error`
      const errorElement = document.getElementById(errorId)
      if (errorElement) {
        errorElement.classList.add("hidden")
      }
    })
  })

  // Close alerts
  const closeAlert = document.getElementById("closeAlert")
  const closeErrorAlert = document.getElementById("closeErrorAlert")
  const successAlert = document.getElementById("successAlert")
  const errorAlert = document.getElementById("errorAlert")

  if (closeAlert && successAlert) {
    closeAlert.addEventListener("click", () => {
      successAlert.classList.add("hidden")
    })
  }

  if (closeErrorAlert && errorAlert) {
    closeErrorAlert.addEventListener("click", () => {
      errorAlert.classList.add("hidden")
    })
  }

  // Auto-hide flash messages after 10 seconds
  setTimeout(() => {
    if (successAlert) {
      successAlert.classList.add("hidden")
    }
    if (errorAlert) {
      errorAlert.classList.add("hidden")
    }
  }, 10000)

  // Function to clear saved data (keep for compatibility)
  function clearSavedData() {
    const form = document.getElementById("dataForm")
    if (form) {
      form.reset()
    }
    console.log("Form data cleared")
  }

  // Make clearSavedData available globally
  window.clearSavedData = clearSavedData
})
