// Job management functionality for pekerjaan forms
class JobManager {
  constructor() {
    this.sideJobCount = 0
    this.init()
  }

  init() {
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Handle status pekerjaan changes
    document.addEventListener("change", (e) => {
      if (e.target.matches('[id^="status_pekerjaan_"]')) {
        const index = e.target.id.split("_").pop()
        this.toggleAdditionalFields(index)
      }
    })

    // Handle multiple jobs question
    document.addEventListener("change", (e) => {
      if (e.target.id === "lebih_dari_satu_pekerjaan") {
        this.handleMultipleJobsChange()
      }
    })

    // Handle bidang usaha changes
    document.addEventListener("change", (e) => {
      if (e.target.id === "bidang_usaha") {
        this.toggleOtherInput()
      }
    })
  }

  toggleAdditionalFields(index) {
    const statusPekerjaan = document.getElementById(`status_pekerjaan_${index}`)
    const additionalFields = document.getElementById(`additionalFields_${index}`)

    if (!statusPekerjaan || !additionalFields) return

    if (statusPekerjaan.value === "Berusaha Sendiri") {
      additionalFields.classList.remove("hidden")
      additionalFields.style.display = "block"
    } else {
      additionalFields.classList.add("hidden")
      additionalFields.style.display = "none"

      // Reset fields when hidden
      const pemasaranField = document.getElementById(`pemasaran_usaha_${index}`)
      const marketplaceField = document.getElementById(`penjualan_marketplace_${index}`)

      if (pemasaranField) pemasaranField.value = ""
      if (marketplaceField) marketplaceField.value = ""
    }
  }

  handleMultipleJobsChange() {
    const hasMultipleJobs = document.getElementById("lebih_dari_satu_pekerjaan")
    const sideJobContainer = document.getElementById("sideJobFieldsContainer")

    if (!hasMultipleJobs || !sideJobContainer) return

    if (hasMultipleJobs.value === "Ya") {
      this.addSideJobFields()
    } else {
      sideJobContainer.innerHTML = ""
      this.sideJobCount = 0
    }
  }

  addSideJobFields() {
    const sideJobFieldsContainer = document.getElementById("sideJobFieldsContainer")
    if (!sideJobFieldsContainer) return

    // Clear existing side jobs first
    sideJobFieldsContainer.innerHTML = ""
    this.sideJobCount = 0

    // Add two side job fields (max 2 side jobs)
    for (let i = 1; i <= 2; i++) {
      this.sideJobCount++
      const jobIndex = i

      const newSideJobFields = document.createElement("div")
      newSideJobFields.className = "side-job-fields p-4 border-2 border-green-300 rounded-lg bg-green-50"
      newSideJobFields.innerHTML = this.getSideJobHTML(jobIndex)

      sideJobFieldsContainer.appendChild(newSideJobFields)
    }
  }

  getSideJobHTML(jobIndex) {
    return `
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-green-800 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
          </svg>
          Pekerjaan Sampingan ${jobIndex}
        </h2>
        <button type="button" onclick="jobManager.removeSideJob(this)" class="text-red-600 hover:text-red-800 font-medium p-1 rounded hover:bg-red-100">
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
            ${this.getBidangPekerjaanOptions()}
          </select>
        </div>
        
        <div>
          <label for="status_pekerjaan_${jobIndex}" class="block text-sm font-medium text-gray-700">Status Pekerjaan</label>
          <select id="status_pekerjaan_${jobIndex}" name="status_pekerjaan_${jobIndex}" class="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300" onchange="jobManager.toggleAdditionalFields(${jobIndex})">
            <option value="">Pilih Status Pekerjaan</option>
            <option value="Berusaha Sendiri">Berusaha Sendiri</option>
            <option value="Buruh/Karyawan/Pegawai/Pekerja Bebas">Buruh/Karyawan/Pegawai/Pekerja Bebas</option>
            <option value="Pekerja Keluarga">Pekerja Keluarga</option>
          </select>
        </div>

        <div id="additionalFields_${jobIndex}" class="hidden">
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
  }

  getBidangPekerjaanOptions() {
    const options = [
      "Pertanian, Kehutanan dan Perikanan",
      "Pertambangan dan Penggalian",
      "Industri Pengolahan",
      "Pengadaan Listrik, Gas, Uap dan AC",
      "Pengadaan Air, Pengelolaan Sampah dan Daur Ulang",
      "Konstruksi",
      "Perdagangan Besar dan Eceran, Reparasi dan Perawatan Mobil dan Motor",
      "Transportasi dan Pergudangan",
      "Penyediaan Akomodasi dan Penyediaan Makan Minum",
      "Informasi dan Komunikasi",
      "Jasa Keuangan dan Asuransi",
      "Real Estat",
      "Jasa Profesional, Ilmiah dan Teknis",
      "Jasa Persewaan Dan Sewa Guna Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya",
      "Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial",
      "Jasa Pendidikan",
      "Jasa Kesehatan dan Kegiatan Sosial",
      "Kesenian, Hiburan dan Rekreasi",
      "Jasa lainnya",
      "Jasa Perorangan yang Melayani Rumah Tangga",
      "Kegiatan Badan Internasional dan Badan Ekstra Internasional",
    ]

    const letters = "ABCDEFGHIJKLMNOPQRSTU"
    return options.map((option, index) => `<option value="${option}">${letters[index]} - ${option}</option>`).join("")
  }

  removeSideJob(button) {
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
        if (onchange && onchange.includes("toggleAdditionalFields")) {
          select.setAttribute("onchange", `jobManager.toggleAdditionalFields(${newNumber})`)
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

  toggleOtherInput() {
    const bidangUsahaSelect = document.getElementById("bidang_usaha")
    const otherBidangUsahaDiv = document.getElementById("other_bidang_usaha")
    const otherBidangUsahaInput = document.getElementById("other_bidang_usaha_input")

    if (!bidangUsahaSelect || !otherBidangUsahaDiv) return

    if (bidangUsahaSelect.value === "Lainnya") {
      otherBidangUsahaDiv.classList.remove("hidden")
      if (otherBidangUsahaInput) {
        otherBidangUsahaInput.value = ""
      }
    } else {
      otherBidangUsahaDiv.classList.add("hidden")
      if (otherBidangUsahaInput) {
        otherBidangUsahaInput.value = ""
      }
    }
  }
}

// Initialize job manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.jobManager = new JobManager()
})
