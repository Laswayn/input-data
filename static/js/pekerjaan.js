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
                <label for="bidang_pekerjaan_${jobIndex}" class="block text-sm font-medium text-gray-700">Bidang Pekerjaan</label>
                <select id="bidang_pekerjaan_${jobIndex}" name="bidang_pekerjaan_${jobIndex}" class="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300">
                    <option value="" disabled selected>Pilih Bidang Pekerjaan</option>
                    <option value="Pertanian, Kehutanan dan Perikanan">A - Pertanian, Kehutanan dan Perikanan</option>
                    <option value="Pertambangan dan Penggalian">B - Pertambangan dan Penggalian</option>
                    <option value="Industri Pengolahan">C - Industri Pengolahan</option>
                    <option value="Pengadaan Listrik, Gas, Uap dan AC">D - Pengadaan Listrik, Gas, Uap dan AC</option>
                    <option value="Pengadaan Air, Pengelolaan Sampah dan Daur Ulang">E - Pengadaan Air, Pengelolaan Sampah dan Daur Ulang</option>
                    <option value="Konstruksi">F - Konstruksi</option>
                    <option value="Perdagangan Besar dan Eceran, Reparasi dan Perawatan Mobil dan Motor">G - Perdagangan Besar dan Eceran, Reparasi dan Perawatan Mobil dan Motor</option>
                    <option value="Transportasi dan Pergudangan">H - Transportasi dan Pergudangan</option>
                    <option value="Penyediaan Akomodasi dan Penyediaan Makan Minum">I - Penyediaan Akomodasi dan Penyediaan Makan Minum</option>
                    <option value="Informasi dan Komunikasi">J - Informasi dan Komunikasi</option>
                    <option value="Jasa Keuangan dan Asuransi">K - Jasa Keuangan dan Asuransi</option>
                    <option value="Real Estat">L - Real Estat</option>
                    <option value="Jasa Profesional, Ilmiah dan Teknis">M - Jasa Profesional, Ilmiah dan Teknis</option>
                    <option value="Jasa Persewaan Dan Sewa Guna Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya">N - Jasa Persewaan Dan Sewa Guna Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya</option>
                    <option value="Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial">O - Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial</option>
                    <option value="Jasa Pendidikan">P - Jasa Pendidikan</option>
                    <option value="Jasa Kesehatan dan Kegiatan Sosial">Q - Jasa Kesehatan dan Kegiatan Sosial</option>
                    <option value="Kesenian, Hiburan dan Rekreasi">R - Kesenian, Hiburan dan Rekreasi</option>
                    <option value="Jasa lainnya">S - Jasa lainnya</option>
                    <option value="Jasa Perorangan yang Melayani Rumah Tangga">T - Jasa Perorangan yang Melayani Rumah Tangga</option>
                    <option value="Kegiatan Badan Internasional dan Badan Ekstra Internasional">U - Kegiatan Badan Internasional dan Badan Ekstra Internasional</option>
                </select>
            </div>
            
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
                </div>
            </div>
        </div>
    `

    sideJobFieldsContainer.appendChild(newSideJobFields)
  }
}

function removeSideJob(button) {
  const sideJobDiv = button.closest(".side-job-fields")
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

    // Update onchange attributes for all selects
    const selectsWithOnchange = jobDiv.querySelectorAll("select[onchange]")
    selectsWithOnchange.forEach((select) => {
      const onchange = select.getAttribute("onchange")
      if (onchange && onchange.includes("toggleFields")) {
        select.setAttribute("onchange", `toggleFields(${newNumber})`)
      }
    })

    // Update div IDs
    const divsWithIds = jobDiv.querySelectorAll("div[id]")
    divsWithIds.forEach((div) => {
      const oldId = div.id
      if (oldId) {
        const newId = oldId.replace(/_\d+$/, `_${newNumber}`)
        div.id = newId
      }
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
