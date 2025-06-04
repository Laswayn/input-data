document.addEventListener("DOMContentLoaded", () => {
  const editKeluargaForm = document.getElementById("editKeluargaForm")
  const successAlert = document.getElementById("successAlert")
  const errorAlert = document.getElementById("errorAlert")
  const errorMessage = document.getElementById("errorMessage")
  const closeAlert = document.getElementById("closeAlert")
  const closeErrorAlert = document.getElementById("closeErrorAlert")

  // Cascading dropdown data - same as in script.js
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

  // Function to check member count changes
  window.checkMemberCountChange = () => {
    const currentCount = Number.parseInt(document.getElementById("current_members_count").value) || 0
    const newCount = Number.parseInt(document.getElementById("jumlah_anggota_15plus").value) || 0
    const memberCountNotice = document.getElementById("memberCountNotice")
    const memberCountMessage = document.getElementById("memberCountMessage")

    if (newCount > currentCount) {
      const difference = newCount - currentCount
      memberCountMessage.textContent = `Anda akan menambah ${difference} anggota keluarga baru. Setelah menyimpan, Anda akan diarahkan untuk mengisi data anggota baru.`
      memberCountNotice.classList.remove("hidden")
      memberCountNotice.className = "bg-blue-50 border-l-4 border-blue-400 p-4 rounded"
    } else if (newCount < currentCount) {
      const difference = currentCount - newCount
      memberCountMessage.textContent = `Anda akan menghapus ${difference} anggota keluarga. Data anggota yang dihapus tidak dapat dikembalikan.`
      memberCountNotice.classList.remove("hidden")
      memberCountNotice.className = "bg-red-50 border-l-4 border-red-400 p-4 rounded"
    } else {
      memberCountNotice.classList.add("hidden")
    }
  }

  // Load existing data into form
  function loadExistingData() {
    // Get existing values from hidden inputs or data attributes
    const dusunValue = document.getElementById("dusun_value").value
    const rtValue = document.getElementById("rt_value").value
    const rwValue = document.getElementById("rw_value").value
    const namaKepala = document.getElementById("nama_kepala_value").value
    const alamat = document.getElementById("alamat_value").value
    const jumlahAnggota = document.getElementById("jumlah_anggota_value").value
    const jumlahAnggota15plus = document.getElementById("jumlah_anggota_15plus_value").value

    // Set form values
    document.getElementById("nama_kepala").value = namaKepala
    document.getElementById("alamat").value = alamat
    document.getElementById("jumlah_anggota").value = jumlahAnggota
    document.getElementById("jumlah_anggota_15plus").value = jumlahAnggota15plus

    // Set dusun and trigger cascade for RT/RW
    const dusunSelect = document.getElementById("dusun")
    if (dusunValue) {
      dusunSelect.value = dusunValue
      window.updateRTRWOptions() // Populate RT/RW dropdowns

      // Set RT and RW after options are populated
      setTimeout(() => {
        const rtSelect = document.getElementById("rt")
        const rwSelect = document.getElementById("rw")

        if (rtValue) rtSelect.value = rtValue
        if (rwValue) rwSelect.value = rwValue
      }, 100)
    }
  }

  // Form validation and submission
  editKeluargaForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Reset error messages
    document.querySelectorAll(".text-red-500").forEach((el) => el.classList.add("hidden"))

    let isValid = true

    // Validate required fields
    const requiredFields = ["dusun", "rt", "rw", "nama_kepala", "alamat", "jumlah_anggota", "jumlah_anggota_15plus"]

    requiredFields.forEach((field) => {
      const input = document.getElementById(field)
      const error = document.getElementById(`${field}_error`)

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
      document.getElementById("jumlah_anggota_15plus_error").textContent =
        "Tidak boleh lebih dari jumlah anggota keluarga"
      document.getElementById("jumlah_anggota_15plus_error").classList.remove("hidden")
      isValid = false
    }

    if (totalMembers < 1) {
      document.getElementById("jumlah_anggota_error").textContent = "Jumlah anggota minimal 1"
      document.getElementById("jumlah_anggota_error").classList.remove("hidden")
      isValid = false
    }

    if (adultMembers < 0) {
      document.getElementById("jumlah_anggota_15plus_error").textContent = "Tidak boleh negatif"
      document.getElementById("jumlah_anggota_15plus_error").classList.remove("hidden")
      isValid = false
    }

    if (isValid) {
      // Create form data
      const formData = new FormData(editKeluargaForm)

      // Show loading state
      const submitButton = editKeluargaForm.querySelector('button[type="submit"]')
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
      fetch("/edit-family", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Reset button state
          submitButton.innerHTML = originalButtonText
          submitButton.disabled = false

          if (data.success) {
            // Show success message
            successAlert.classList.remove("hidden")
            errorAlert.classList.add("hidden")

            // Scroll to success message
            successAlert.scrollIntoView({ behavior: "smooth" })

            // Check if we need to add new members
            const currentCount = Number.parseInt(document.getElementById("current_members_count").value) || 0
            const newCount = Number.parseInt(document.getElementById("jumlah_anggota_15plus").value) || 0

            if (newCount > currentCount) {
              // Redirect to add new members
              setTimeout(() => {
                window.location.href = "/lanjutan"
              }, 2000)
            } else {
              // Redirect back to final page
              setTimeout(() => {
                window.location.href = "/final"
              }, 2000)
            }
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

  // Validasi jumlah anggota 15+ tidak lebih dari jumlah anggota total
  document.getElementById("jumlah_anggota_15plus").addEventListener("input", function (e) {
    const totalAnggota = Number.parseInt(document.getElementById("jumlah_anggota").value) || 0
    const anggota15Plus = Number.parseInt(this.value) || 0

    if (anggota15Plus > totalAnggota) {
      this.value = totalAnggota
    }

    // Check for member count changes
    checkMemberCountChange()
  })

  document.getElementById("jumlah_anggota").addEventListener("input", function (e) {
    const totalAnggota = Number.parseInt(this.value) || 0
    const anggota15Plus = Number.parseInt(document.getElementById("jumlah_anggota_15plus").value) || 0

    if (anggota15Plus > totalAnggota) {
      document.getElementById("jumlah_anggota_15plus").value = totalAnggota
    }

    // Check for member count changes
    checkMemberCountChange()
  })

  // Load existing data when page loads
  loadExistingData()
})
