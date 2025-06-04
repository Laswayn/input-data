document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("pekerjaanForm")
  const successAlert = document.getElementById("successAlert")
  const errorAlert = document.getElementById("errorAlert")
  const successMessage = document.getElementById("successMessage")
  const errorMessage = document.getElementById("errorMessage")
  const closeAlert = document.getElementById("closeAlert")
  const closeErrorAlert = document.getElementById("closeErrorAlert")

  // Form submission handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Validate required fields
    const bidangPekerjaan = document.getElementById("bidang_pekerjaan").value
    const statusPekerjaanUtama = document.getElementById("status_pekerjaan_0").value
    const lebihDariSatuPekerjaan = document.getElementById("lebih_dari_satu_pekerjaan").value

    if (!bidangPekerjaan) {
      showError("Bidang pekerjaan harus dipilih")
      return
    }

    if (!statusPekerjaanUtama) {
      showError("Status pekerjaan utama harus dipilih")
      return
    }

    if (!lebihDariSatuPekerjaan) {
      showError("Pertanyaan tentang memiliki lebih dari satu pekerjaan harus dijawab")
      return
    }

    try {
      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]')
      const originalText = submitBtn.innerHTML
      submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
            `
      submitBtn.disabled = true

      // Submit form data
      const formData = new FormData(form)
      const response = await fetch("/submit-pekerjaan", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        showSuccess(result.message)

        // Handle redirect
        if (result.redirect && result.redirect_url) {
          setTimeout(() => {
            window.location.href = result.redirect_url
          }, 1500)
        }
      } else {
        showError(result.message || "Terjadi kesalahan saat menyimpan data")
      }

      // Restore button state
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    } catch (error) {
      console.error("Error submitting form:", error)
      showError("Terjadi kesalahan koneksi. Silakan coba lagi.")

      // Restore button state
      const submitBtn = form.querySelector('button[type="submit"]')
      const originalText = submitBtn.innerHTML // Declare originalText here
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  })

  // Alert handlers
  closeAlert.addEventListener("click", () => {
    successAlert.classList.add("hidden")
  })

  closeErrorAlert.addEventListener("click", () => {
    errorAlert.classList.add("hidden")
  })

  function showSuccess(message) {
    successMessage.textContent = message
    successAlert.classList.remove("hidden")
    errorAlert.classList.add("hidden")
  }

  function showError(message) {
    errorMessage.textContent = message
    errorAlert.classList.remove("hidden")
    successAlert.classList.add("hidden")
  }
})

// Toggle additional fields based on job status
function toggleFields(jobIndex) {
  const statusSelect = document.getElementById(`status_pekerjaan_${jobIndex}`)
  const additionalFields = document.getElementById(`additionalFields_${jobIndex}`)

  if (statusSelect.value === "Berusaha Sendiri") {
    additionalFields.style.display = "block"
  } else {
    additionalFields.style.display = "none"
    // Clear the fields when hiding
    const pemasaranSelect = document.getElementById(`pemasaran_usaha_${jobIndex}`)
    const marketplaceSelect = document.getElementById(`penjualan_marketplace_${jobIndex}`)
    if (pemasaranSelect) pemasaranSelect.value = ""
    if (marketplaceSelect) marketplaceSelect.value = ""
  }
}

// Handle multiple jobs selection
function handleMultipleJobsChange() {
  const multipleJobsSelect = document.getElementById("lebih_dari_satu_pekerjaan")
  const sideJobContainer = document.getElementById("sideJobFieldsContainer")

  if (multipleJobsSelect.value === "Ya") {
    // Show side job fields
    sideJobContainer.innerHTML = ""

    // Add up to 2 side jobs
    for (let i = 1; i <= 2; i++) {
      const sideJobHtml = createSideJobFields(i)
      sideJobContainer.insertAdjacentHTML("beforeend", sideJobHtml)
    }
  } else {
    // Hide side job fields
    sideJobContainer.innerHTML = ""
  }
}

// Create side job fields HTML
function createSideJobFields(jobIndex) {
  return `
        <div class="job-fields p-4 border-2 border-orange-300 rounded-lg bg-orange-50">
            <h2 class="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Pekerjaan Sampingan ${jobIndex}
            </h2>
            <div class="space-y-4">
                <div>
                    <label for="bidang_pekerjaan_${jobIndex}" class="block text-sm font-medium text-gray-700">Bidang Pekerjaan</label>
                    <select id="bidang_pekerjaan_${jobIndex}" name="bidang_pekerjaan_${jobIndex}" class="form-input w-full px-4 py-2.5">
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
                    <select id="status_pekerjaan_${jobIndex}" name="status_pekerjaan_${jobIndex}" class="form-input w-full px-4 py-2.5" onchange="toggleFields(${jobIndex})">
                        <option value="" disabled selected>Pilih Status Pekerjaan</option>
                        <option value="Berusaha Sendiri">Berusaha Sendiri</option>
                        <option value="Buruh/Karyawan/Pegawai/Pekerja Bebas">Buruh/Karyawan/Pegawai/Pekerja Bebas</option>
                        <option value="Pekerja Keluarga">Pekerja Keluarga</option>
                    </select>
                </div>

                <div id="additionalFields_${jobIndex}" style="display: none;">
                    <div class="space-y-4 bg-white p-4 rounded border">
                        <div>
                            <label for="pemasaran_usaha_${jobIndex}" class="block text-sm font-medium text-gray-700">Pemasaran Usaha</label>
                            <select id="pemasaran_usaha_${jobIndex}" name="pemasaran_usaha_${jobIndex}" class="form-input w-full px-4 py-2.5">
                                <option value="" disabled selected>Pilih Pemasaran Usaha</option>
                                <option value="Online">Online</option>
                                <option value="Offline">Offline</option>
                            </select>
                        </div>

                        <div>
                            <label for="penjualan_marketplace_${jobIndex}" class="block text-sm font-medium text-gray-700">Penjualan Melalui Marketplace</label>
                            <select id="penjualan_marketplace_${jobIndex}" name="penjualan_marketplace_${jobIndex}" class="form-input w-full px-4 py-2.5">
                                <option value="" disabled selected>Pilih Jawaban</option>
                                <option value="Ya">Ya</option>
                                <option value="Tidak">Tidak</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}
