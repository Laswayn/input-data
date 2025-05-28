let sideJobCount = 0

function toggleFields(index) {
  const statusPekerjaan = document.getElementById(`status_pekerjaan_${index}`).value
  const additionalFields = document.getElementById(`additionalFields_${index}`)

  if (statusPekerjaan === "Berusaha Sendiri") {
    additionalFields.style.display = "block"
  } else {
    additionalFields.style.display = "none"
    // Reset fields when hidden
    if (document.getElementById(`pemasaran_usaha_${index}`)) {
      document.getElementById(`pemasaran_usaha_${index}`).value = ""
    }
    if (document.getElementById(`penjualan_marketplace_${index}`)) {
      document.getElementById(`penjualan_marketplace_${index}`).value = ""
    }
    if (document.getElementById(`status_pekerjaan_diinginkan_${index}`)) {
      document.getElementById(`status_pekerjaan_diinginkan_${index}`).value = ""
    }
    if (document.getElementById(`bidang_usaha_${index}`)) {
      document.getElementById(`bidang_usaha_${index}`).value = ""
    }
  }
}

function toggleBidangUsaha(index) {
  const statusPekerjaanDiinginkan = document.getElementById(`status_pekerjaan_diinginkan_${index}`).value
  const bidangUsahaField = document.getElementById(`bidang_usaha_container_${index}`)

  if (statusPekerjaanDiinginkan === "Buruh/Karyawan/Pegawai") {
    bidangUsahaField.style.display = "none"
    if (document.getElementById(`bidang_usaha_${index}`)) {
      document.getElementById(`bidang_usaha_${index}`).value = ""
    }
  } else {
    bidangUsahaField.style.display = "block"
  }
}

function handleMultipleJobsChange() {
  const hasMultipleJobs = document.getElementById("lebih_dari_satu_pekerjaan").value
  const sideJobContainer = document.getElementById("sideJobFieldsContainer")

  if (hasMultipleJobs === "Ya") {
    addSideJobFields()
  } else {
    // Remove all side job fields
    sideJobContainer.innerHTML = ""
    sideJobCount = 0
  }
}

function addSideJobFields() {
  const sideJobFieldsContainer = document.getElementById("sideJobFieldsContainer")

  // Clear existing side jobs first
  sideJobFieldsContainer.innerHTML = ""
  sideJobCount = 0

  // Add two side job fields (max 2 side jobs)
  for (let i = 1; i <= 2; i++) {
    sideJobCount++
    const jobIndex = i

    const newSideJobFields = document.createElement("div")
    newSideJobFields.className = "side-job-fields p-4 border-2 border-green-300 rounded-lg bg-green-50"
    newSideJobFields.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold text-green-800 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                    Pekerjaan Sampingan ${i}
                </h2>
                <button type="button" onclick="removeSideJob(this)" class="text-red-600 hover:text-red-800 font-medium p-1 rounded hover:bg-red-100">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label for="status_pekerjaan_${jobIndex}" class="block text-sm font-medium text-gray-700">Status Pekerjaan</label>
                    <select id="status_pekerjaan_${jobIndex}" name="status_pekerjaan_${jobIndex}" class="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300" onchange="toggleFields(${jobIndex})">
                        <option value="">Pilih Status Pekerjaan</option>
                        <option value="Berusaha Sendiri">Berusaha Sendiri</option>
                        <option value="Buruh/Karyawan/Pegawai/Pekerja Bebas">Buruh/Karyawan/Pegawai/Pekerja Bebas</option>
                        <option value="Pekerja Keluarga">Pekerja Keluarga</option>
                    </select>
                </div>

                <div id="additionalFields_${jobIndex}" style="display: none;">
                    <div class="space-y-4 bg-white p-4 rounded border">
                        <div>
                            <label for="pemasaran_usaha_${jobIndex}" class="block text-sm font-medium text-gray-700">Pemasaran Usaha</label>
                            <select id="pemasaran_usaha_${jobIndex}" name="pemasaran_usaha_${jobIndex}" class="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300">
                                <option value="">Pilih Pemasaran Usaha</option>
                                <option value="Online">Online</option>
                                <option value="Offline">Offline</option>
                            </select>
                        </div>

                        <div>
                            <label for="penjualan_marketplace_${jobIndex}" class="block text-sm font-medium text-gray-700">Penjualan Melalui Marketplace</label>
                            <select id="penjualan_marketplace_${jobIndex}" name="penjualan_marketplace_${jobIndex}" class="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300">
                                <option value="">Pilih Jawaban</option>
                                <option value="Ya">Ya</option>
                                <option value="Tidak">Tidak</option>
                            </select>
                        </div>

                        <div>
                            <label for="status_pekerjaan_diinginkan_${jobIndex}" class="block text-sm font-medium text-gray-700">Status Pekerjaan yang Diinginkan</label>
                            <select id="status_pekerjaan_diinginkan_${jobIndex}" name="status_pekerjaan_diinginkan_${jobIndex}" class="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300" onchange="toggleBidangUsaha(${jobIndex})">
                                <option value="">Pilih Status Pekerjaan yang Diinginkan</option>
                                <option value="Berusaha Sendiri">Berusaha Sendiri</option>
                                <option value="Buruh/Karyawan/Pegawai">Buruh/Karyawan/Pegawai</option>
                            </select>
                        </div>

                        <div id="bidang_usaha_container_${jobIndex}">
                            <label for="bidang_usaha_${jobIndex}" class="block text-sm font-medium text-gray-700">Usaha di Bidang Apa yang Anda Minati</label>
                            <input type="text" id="bidang_usaha_${jobIndex}" name="bidang_usaha_${jobIndex}" placeholder="Masukkan bidang usaha" class="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300" />
                        </div>
                    </div>
                </div>
            </div>
        `

    sideJobFieldsContainer.appendChild(newSideJobFields)
  }
}

function removeSideJob(button) {
  const sideJobDiv = button.closest(".side-job-fields")
  const jobNumber = sideJobDiv.querySelector("h2").textContent.match(/\d+/)[0]

  sideJobDiv.remove()

  // Update numbering of remaining side jobs
  const remainingSideJobs = document.querySelectorAll(".side-job-fields")
  remainingSideJobs.forEach((jobDiv, index) => {
    const header = jobDiv.querySelector("h2")
    const newNumber = index + 1
    header.innerHTML = header.innerHTML.replace(/Pekerjaan Sampingan \d+/, `Pekerjaan Sampingan ${newNumber}`)

    // Update all input IDs and names in this job div
    const inputs = jobDiv.querySelectorAll("input, select")
    inputs.forEach((input) => {
      const oldId = input.id
      const oldName = input.name
      if (oldId) {
        const newId = oldId.replace(/_\d+$/, `_${newNumber}`)
        input.id = newId
      }
      if (oldName) {
        const newName = oldName.replace(/_\d+$/, `_${newNumber}`)
        input.name = newName
      }
    })

    // Update labels
    const labels = jobDiv.querySelectorAll("label")
    labels.forEach((label) => {
      const forAttr = label.getAttribute("for")
      if (forAttr) {
        const newFor = forAttr.replace(/_\d+$/, `_${newNumber}`)
        label.setAttribute("for", newFor)
      }
    })

    // Update onchange attributes
    const selectsWithOnchange = jobDiv.querySelectorAll("select[onchange]")
    selectsWithOnchange.forEach((select) => {
      const onchange = select.getAttribute("onchange")
      const newOnchange = onchange.replace(/$$\d+$$/, `(${newNumber})`)
      select.setAttribute("onchange", newOnchange)
    })
  })
}

// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("pekerjaanForm")
  const successAlert = document.getElementById("successAlert")
  const errorAlert = document.getElementById("errorAlert")
  const successMessage = document.getElementById("successMessage")
  const errorMessage = document.getElementById("errorMessage")

  form.addEventListener("submit", (e) => {
    e.preventDefault()

    // Validate main job
    const mainJobStatus = document.getElementById("status_pekerjaan_0").value
    if (!mainJobStatus) {
      showError("Status pekerjaan utama harus diisi")
      return
    }

    // Validate main job additional fields if "Berusaha Sendiri"
    if (mainJobStatus === "Berusaha Sendiri") {
      const statusDiinginkan = document.getElementById("status_pekerjaan_diinginkan_0").value
      if (!statusDiinginkan) {
        showError("Status pekerjaan yang diinginkan harus diisi untuk pekerjaan utama")
        return
      }
    }

    // Validate side jobs if they exist
    const sideJobs = document.querySelectorAll(".side-job-fields")
    for (let i = 0; i < sideJobs.length; i++) {
      const sideJobIndex = i + 1
      const sideJobStatus = document.getElementById(`status_pekerjaan_${sideJobIndex}`)

      if (sideJobStatus && sideJobStatus.value) {
        if (sideJobStatus.value === "Berusaha Sendiri") {
          const statusDiinginkan = document.getElementById(`status_pekerjaan_diinginkan_${sideJobIndex}`)
          if (!statusDiinginkan || !statusDiinginkan.value) {
            showError(`Status pekerjaan yang diinginkan harus diisi untuk pekerjaan sampingan ${i + 1}`)
            return
          }
        }
      }
    }

    const formData = new FormData(form)
    const submitButton = form.querySelector('button[type="submit"]')
    const originalButtonText = submitButton.innerHTML

    // Show loading state
    submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Menyimpan...
        `
    submitButton.disabled = true

    fetch("/submit-pekerjaan", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Reset button state
        submitButton.innerHTML = originalButtonText
        submitButton.disabled = false

        if (data.success) {
          showSuccess(data.message)

          if (data.redirect) {
            setTimeout(() => {
              window.location.href = data.redirect_url
            }, 2000)
          }
        } else {
          showError(data.message)
        }
      })
      .catch((error) => {
        // Reset button state
        submitButton.innerHTML = originalButtonText
        submitButton.disabled = false

        console.error("Error:", error)
        showError("Terjadi kesalahan pada server.")
      })
  })

  function showSuccess(message) {
    if (successMessage && successAlert) {
      successMessage.textContent = message
      successAlert.classList.remove("hidden")
      errorAlert?.classList.add("hidden")

      // Scroll to alert
      successAlert.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  function showError(message) {
    if (errorMessage && errorAlert) {
      errorMessage.textContent = message
      errorAlert.classList.remove("hidden")
      successAlert?.classList.add("hidden")

      // Scroll to alert
      errorAlert.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  // Close alert handlers
  document.getElementById("closeAlert")?.addEventListener("click", () => {
    successAlert?.classList.add("hidden")
  })

  document.getElementById("closeErrorAlert")?.addEventListener("click", () => {
    errorAlert?.classList.add("hidden")
  })
})

function toggleOtherInput() {
    const bidangUsahaSelect = document.getElementById('bidang_usaha_0');
    const otherBidangUsahaDiv = document.getElementById('other_bidang_usaha');

    if (bidangUsahaSelect.value === "Lainnya") {
        otherBidangUsahaDiv.classList.remove('hidden'); // Show the input field
    } else {
        otherBidangUsahaDiv.classList.add('hidden'); // Hide the input field
        document.getElementById('other_bidang_usaha_input').value = ''; // Clear the input field
    }
}