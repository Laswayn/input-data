// Edit Anggota JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Initialize form with existing data
  initializeForm()

  // Set up form submission
  setupFormSubmission()

  // Initialize conditional fields based on existing data
  initializeConditionalFields()
})

function initializeForm() {
  // Update name placeholders
  const namaAnggota = document.getElementById("nama_anggota").value
  updateNamePlaceholders(namaAnggota)

  // Listen for name changes
  document.getElementById("nama_anggota").addEventListener("input", function () {
    updateNamePlaceholders(this.value)
  })
}

function initializeConditionalFields() {
  // Initialize job sections based on existing data
  toggleJobSections()
  toggleBidangUsaha()

  // Initialize job fields if member has job
  const memilikiPekerjaan = document.getElementById("memiliki_pekerjaan").value
  if (memilikiPekerjaan === "Ya") {
    // Show job tab and fields
    document.getElementById("jobFields").classList.remove("hidden")

    // Initialize pemasaran fields for main job
    togglePemasaranFields("utama")

    // Initialize side jobs
    toggleSideJobs()

    // Initialize pemasaran fields for side jobs
    togglePemasaranFields("sampingan1")
    togglePemasaranFields("sampingan2")

    // Initialize marketplace fields
    toggleMarketplaceField("utama")
    toggleMarketplaceField("sampingan1")
    toggleMarketplaceField("sampingan2")
  }
}

function switchTab(tabName) {
  // Hide all sections
  document.querySelectorAll(".tab-section").forEach((section) => {
    section.classList.add("hidden")
  })

  // Remove active class from all tabs
  document.querySelectorAll(".tab-button").forEach((tab) => {
    tab.classList.remove("active", "border-primary-500", "text-primary-600")
    tab.classList.add("border-transparent", "text-gray-500")
  })

  // Show selected section
  document.getElementById(`section-${tabName}`).classList.remove("hidden")

  // Add active class to selected tab
  const activeTab = document.getElementById(`tab-${tabName}`)
  activeTab.classList.add("active", "border-primary-500", "text-primary-600")
  activeTab.classList.remove("border-transparent", "text-gray-500")
}

function toggleJobSections() {
  const memilikiPekerjaan = document.getElementById("memiliki_pekerjaan").value
  const noJobFields = document.getElementById("noJobFields")
  const jobFields = document.getElementById("jobFields")

  if (memilikiPekerjaan === "Ya") {
    noJobFields.classList.add("hidden")
    jobFields.classList.remove("hidden")

    // Clear no-job fields
    document.getElementById("status_pekerjaan_diinginkan").value = ""
    document.getElementById("bidang_usaha_diminati").value = ""

    // Hide bidang usaha container
    document.getElementById("bidang_usaha_container").classList.add("hidden")
  } else if (memilikiPekerjaan === "Tidak") {
    noJobFields.classList.remove("hidden")
    jobFields.classList.add("hidden")

    // Clear job fields
    clearJobFields()
  } else {
    noJobFields.classList.add("hidden")
    jobFields.classList.add("hidden")
  }
}

function toggleBidangUsaha() {
  const statusPekerjaan = document.getElementById("status_pekerjaan_diinginkan").value
  const bidangUsahaContainer = document.getElementById("bidang_usaha_container")

  if (statusPekerjaan === "Berusaha Sendiri") {
    bidangUsahaContainer.classList.remove("hidden")
  } else {
    bidangUsahaContainer.classList.add("hidden")
    document.getElementById("bidang_usaha_diminati").value = ""
  }
}

function togglePemasaranFields(jobType) {
  const statusSelect = document.getElementById(`status_pekerjaan_${jobType}`)
  const pemasaranContainer = document.getElementById(`pemasaran_${jobType}_container`)

  if (statusSelect && pemasaranContainer) {
    if (statusSelect.value === "Berusaha Sendiri") {
      pemasaranContainer.classList.remove("hidden")
    } else {
      pemasaranContainer.classList.add("hidden")
      // Clear pemasaran fields
      const pemasaranSelect = document.getElementById(`pemasaran_usaha_${jobType}`)
      const marketplaceSelect = document.getElementById(`penjualan_marketplace_${jobType}`)
      if (pemasaranSelect) pemasaranSelect.value = ""
      if (marketplaceSelect) marketplaceSelect.value = ""

      // Hide marketplace container
      const marketplaceContainer = document.getElementById(`marketplace_${jobType}_container`)
      if (marketplaceContainer) marketplaceContainer.classList.add("hidden")
    }
  }
}

function toggleMarketplaceField(jobType) {
  const pemasaranSelect = document.getElementById(`pemasaran_usaha_${jobType}`)
  const marketplaceContainer = document.getElementById(`marketplace_${jobType}_container`)

  if (pemasaranSelect && marketplaceContainer) {
    const pemasaranValue = pemasaranSelect.value
    if (pemasaranValue === "Online" || pemasaranValue === "Offline dan Online") {
      marketplaceContainer.classList.remove("hidden")
    } else {
      marketplaceContainer.classList.add("hidden")
      const marketplaceSelect = document.getElementById(`penjualan_marketplace_${jobType}`)
      if (marketplaceSelect) marketplaceSelect.value = ""
    }
  }
}

function toggleSideJobs() {
  const memilikiLebihSatu = document.getElementById("memiliki_lebih_satu_pekerjaan").value
  const sideJobsContainer = document.getElementById("sideJobsContainer")

  if (memilikiLebihSatu === "Ya") {
    sideJobsContainer.classList.remove("hidden")
  } else {
    sideJobsContainer.classList.add("hidden")
    // Clear side job fields
    clearSideJobFields()
  }
}

function clearJobFields() {
  // Clear main job fields
  document.getElementById("bidang_pekerjaan").value = ""
  document.getElementById("status_pekerjaan_utama").value = ""
  document.getElementById("pemasaran_usaha_utama").value = ""
  document.getElementById("penjualan_marketplace_utama").value = ""
  document.getElementById("memiliki_lebih_satu_pekerjaan").value = ""

  // Clear side job fields
  clearSideJobFields()

  // Hide containers
  document.getElementById("pemasaran_utama_container").classList.add("hidden")
  document.getElementById("marketplace_utama_container").classList.add("hidden")
  document.getElementById("sideJobsContainer").classList.add("hidden")
}

function clearSideJobFields() {
  // Clear side job 1
  document.getElementById("bidang_pekerjaan_sampingan1").value = ""
  document.getElementById("status_pekerjaan_sampingan1").value = ""
  document.getElementById("pemasaran_usaha_sampingan1").value = ""
  document.getElementById("penjualan_marketplace_sampingan1").value = ""

  // Clear side job 2
  document.getElementById("bidang_pekerjaan_sampingan2").value = ""
  document.getElementById("status_pekerjaan_sampingan2").value = ""
  document.getElementById("pemasaran_usaha_sampingan2").value = ""
  document.getElementById("penjualan_marketplace_sampingan2").value = ""

  // Hide containers
  document.getElementById("pemasaran_sampingan1_container").classList.add("hidden")
  document.getElementById("marketplace_sampingan1_container").classList.add("hidden")
  document.getElementById("pemasaran_sampingan2_container").classList.add("hidden")
  document.getElementById("marketplace_sampingan2_container").classList.add("hidden")
}

function updateNamePlaceholders(name) {
  document.querySelectorAll(".nama-placeholder").forEach((placeholder) => {
    placeholder.textContent = name || "Anggota"
  })
}

function setupFormSubmission() {
  const form = document.getElementById("editAnggotaForm")

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const submitBtn = document.getElementById("submitBtn")
    const originalText = submitBtn.innerHTML

    // Show loading state
    submitBtn.disabled = true
    submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Menyimpan...
        `

    try {
      // Collect form data
      const formData = collectFormData()

      const response = await fetch("/edit-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        showMessage(result.message, "success")
        setTimeout(() => {
          window.location.href = "/final"
        }, 2000)
      } else {
        showMessage(result.message, "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showMessage("Terjadi kesalahan saat menyimpan data", "error")
    } finally {
      // Restore button
      submitBtn.disabled = false
      submitBtn.innerHTML = originalText
    }
  })
}

function collectFormData() {
  const memberIndex = document.getElementById("memberIndex").value

  const formData = {
    memberIndex: Number.parseInt(memberIndex),
    nama_anggota: document.getElementById("nama_anggota").value,
    umur: Number.parseInt(document.getElementById("umur").value),
    hubungan_kepala: document.getElementById("hubungan_kepala").value,
    jenis_kelamin: document.getElementById("jenis_kelamin").value,
    status_perkawinan: document.getElementById("status_perkawinan").value,
    pendidikan_terakhir: document.getElementById("pendidikan_terakhir").value,
    kegiatan_sehari: document.getElementById("kegiatan_sehari").value,
    memiliki_pekerjaan: document.getElementById("memiliki_pekerjaan").value,
  }

  // Add job-related fields based on memiliki_pekerjaan
  if (formData.memiliki_pekerjaan === "Tidak") {
    formData.status_pekerjaan_diinginkan = document.getElementById("status_pekerjaan_diinginkan").value
    formData.bidang_usaha_diminati = document.getElementById("bidang_usaha_diminati").value
  } else if (formData.memiliki_pekerjaan === "Ya") {
    // Main job fields
    formData.bidang_pekerjaan = document.getElementById("bidang_pekerjaan").value
    formData.status_pekerjaan_utama = document.getElementById("status_pekerjaan_utama").value
    formData.pemasaran_usaha_utama = document.getElementById("pemasaran_usaha_utama").value
    formData.penjualan_marketplace_utama = document.getElementById("penjualan_marketplace_utama").value
    formData.memiliki_lebih_satu_pekerjaan = document.getElementById("memiliki_lebih_satu_pekerjaan").value

    // Side job fields
    formData.bidang_pekerjaan_sampingan1 = document.getElementById("bidang_pekerjaan_sampingan1").value
    formData.status_pekerjaan_sampingan1 = document.getElementById("status_pekerjaan_sampingan1").value
    formData.pemasaran_usaha_sampingan1 = document.getElementById("pemasaran_usaha_sampingan1").value
    formData.penjualan_marketplace_sampingan1 = document.getElementById("penjualan_marketplace_sampingan1").value

    formData.bidang_pekerjaan_sampingan2 = document.getElementById("bidang_pekerjaan_sampingan2").value
    formData.status_pekerjaan_sampingan2 = document.getElementById("status_pekerjaan_sampingan2").value
    formData.pemasaran_usaha_sampingan2 = document.getElementById("pemasaran_usaha_sampingan2").value
    formData.penjualan_marketplace_sampingan2 = document.getElementById("penjualan_marketplace_sampingan2").value
  }

  return formData
}

function validateForm() {
  let isValid = true

  // Clear previous errors
  document.querySelectorAll(".text-red-500").forEach((error) => {
    error.classList.add("hidden")
  })

  // Validate basic fields
  const requiredFields = [
    "nama_anggota",
    "umur",
    "hubungan_kepala",
    "jenis_kelamin",
    "status_perkawinan",
    "pendidikan_terakhir",
    "kegiatan_sehari",
    "memiliki_pekerjaan",
  ]

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId)
    if (!field.value.trim()) {
      showFieldError(fieldId, "Field ini wajib diisi")
      isValid = false
    }
  })

  // Validate age
  const umur = Number.parseInt(document.getElementById("umur").value)
  if (umur < 15) {
    showFieldError("umur", "Umur minimal 15 tahun")
    isValid = false
  }

  // Validate job-related fields
  const memilikiPekerjaan = document.getElementById("memiliki_pekerjaan").value

  if (memilikiPekerjaan === "Tidak") {
    const statusPekerjaanDiinginkan = document.getElementById("status_pekerjaan_diinginkan").value
    if (!statusPekerjaanDiinginkan) {
      showFieldError("status_pekerjaan_diinginkan", "Field ini wajib diisi")
      isValid = false
    }

    if (statusPekerjaanDiinginkan === "Berusaha Sendiri") {
      const bidangUsaha = document.getElementById("bidang_usaha_diminati").value
      if (!bidangUsaha) {
        showFieldError("bidang_usaha_diminati", "Field ini wajib diisi")
        isValid = false
      }
    }
  } else if (memilikiPekerjaan === "Ya") {
    // Validate main job
    const bidangPekerjaan = document.getElementById("bidang_pekerjaan").value
    const statusPekerjaanUtama = document.getElementById("status_pekerjaan_utama").value

    if (!bidangPekerjaan) {
      showFieldError("bidang_pekerjaan", "Field ini wajib diisi")
      isValid = false
    }

    if (!statusPekerjaanUtama) {
      showFieldError("status_pekerjaan_utama", "Field ini wajib diisi")
      isValid = false
    }

    // Validate pemasaran fields if "Berusaha Sendiri"
    if (statusPekerjaanUtama === "Berusaha Sendiri") {
      const pemasaranUtama = document.getElementById("pemasaran_usaha_utama").value
      if (!pemasaranUtama) {
        showFieldError("pemasaran_usaha_utama", "Field ini wajib diisi")
        isValid = false
      }

      if (pemasaranUtama === "Online" || pemasaranUtama === "Offline dan Online") {
        const marketplaceUtama = document.getElementById("penjualan_marketplace_utama").value
        if (!marketplaceUtama) {
          showFieldError("penjualan_marketplace_utama", "Field ini wajib diisi")
          isValid = false
        }
      }
    }

    // Validate multiple jobs question
    const memilikiLebihSatu = document.getElementById("memiliki_lebih_satu_pekerjaan").value
    if (!memilikiLebihSatu) {
      showFieldError("memiliki_lebih_satu_pekerjaan", "Field ini wajib diisi")
      isValid = false
    }
  }

  return isValid
}

function showFieldError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}_error`)
  if (errorElement) {
    errorElement.textContent = message
    errorElement.classList.remove("hidden")
  }

  const field = document.getElementById(fieldId)
  if (field) {
    field.classList.add("border-red-500")
    field.focus()
  }
}

function showMessage(message, type) {
  const messageContainer = document.getElementById("messageContainer")

  const messageDiv = document.createElement("div")
  messageDiv.className = `p-4 rounded-lg shadow-lg mb-4 ${
    type === "success"
      ? "bg-green-100 border border-green-400 text-green-700"
      : "bg-red-100 border border-red-400 text-red-700"
  }`

  messageDiv.innerHTML = `
        <div class="flex items-center">
            <div class="flex-shrink-0">
                ${
                  type === "success"
                    ? '<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
                    : '<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>'
                }
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium">${message}</p>
            </div>
        </div>
    `

  messageContainer.appendChild(messageDiv)

  // Auto remove after 5 seconds
  setTimeout(() => {
    messageDiv.remove()
  }, 5000)
}
