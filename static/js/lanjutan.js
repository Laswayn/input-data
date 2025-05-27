document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("dataForm");
  const successAlert = document.getElementById("successAlert");
  const errorAlert = document.getElementById("errorAlert");
  const successMessage = document.getElementById("successMessage");
  const errorMessage = document.getElementById("errorMessage");
  const closeAlert = document.getElementById("closeAlert");
  const closeErrorAlert = document.getElementById("closeErrorAlert");
  const remainingElement = document.getElementById("remaining");
  const pertanyaan510 = document.getElementById("pertanyaan_5_10");
  const statusPekerjaanContainer = document.getElementById("status_pekerjaan_container");
  const bidangUsahaContainer = document.getElementById("bidang_usaha_container");
  const namaInput = document.getElementById("nama");
  const namaPlaceholders = document.querySelectorAll(".nama-placeholder");

  // Update nama placeholder saat nama diinput
  namaInput.addEventListener("input", function () {
    const nama = this.value.trim() || "NAMA";
    namaPlaceholders.forEach((placeholder) => {
      placeholder.textContent = nama;
    });
  });

  // Fungsi untuk mengecek jawaban pertanyaan 5.10
  window.checkMemilikiPekerjaan = () => {
    const memilikiPekerjaan = document.getElementById("memiliki_pekerjaan").value;

    console.log("Nilai memiliki_pekerjaan:", memilikiPekerjaan);

    if (memilikiPekerjaan === "Ya") {
      // Jika memiliki pekerjaan: sembunyikan status pekerjaan yang diinginkan dan bidang usaha
      statusPekerjaanContainer.classList.add("hidden");
      bidangUsahaContainer.classList.add("hidden");
      document.getElementById("status_pekerjaan_diinginkan").selectedIndex = 0;
      document.getElementById("bidang_usaha").value = "";
    } else if (memilikiPekerjaan === "Tidak") {
      // Jika tidak memiliki pekerjaan: tampilkan status pekerjaan yang diinginkan
      statusPekerjaanContainer.classList.remove("hidden");
      bidangUsahaContainer.classList.add("hidden"); // Sembunyikan bidang usaha
      document.getElementById("bidang_usaha").value = "";
    } else {
      // Jika belum memilih, sembunyikan keduanya
      statusPekerjaanContainer.classList.add("hidden");
      bidangUsahaContainer.classList.add("hidden");
      document.getElementById("status_pekerjaan_diinginkan").selectedIndex = 0;
      document.getElementById("bidang_usaha").value = "";
    }
  };

  // Fungsi untuk toggle bidang usaha berdasarkan status pekerjaan yang diinginkan
  window.toggleBidangUsaha = () => {
  const statusPekerjaanDiinginkan = document.getElementById("status_pekerjaan_diinginkan").value;


  if (statusPekerjaanDiinginkan === "Berusaha Sendiri") {
    // Jika status pekerjaan yang diinginkan adalah "Berusaha Sendiri", tampilkan bidang usaha
    bidangUsahaContainer.classList.remove("hidden");
  } else {
    // Jika tidak, sembunyikan bidang usaha dan reset nilai input
    bidangUsahaContainer.classList.add("hidden");
    document.getElementById("bidang_usaha").value = ""; // Reset input bidang usaha
  }
  };

  // Pastikan untuk menambahkan event listener pada dropdown status pekerjaan yang diinginkan
  document.getElementById("status_pekerjaan_diinginkan").addEventListener("change", toggleBidangUsaha);

  // Form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Reset error messages
    document.querySelectorAll(".text-red-500").forEach((el) => el.classList.add("hidden"));

    // Get form values
    const nama = document.getElementById("nama").value.trim();
    const umur = document.getElementById("umur").value.trim();
    const hubungan = document.getElementById("hubungan").value;
    const jenisKelamin = document.getElementById("jenis_kelamin").value;
    const statusPerkawinan = document.getElementById("status_perkawinan").value;
    const pendidikan = document.getElementById("pendidikan").value;
    const kegiatan = document.getElementById("kegiatan").value;
    const memilikiPekerjaan = document.getElementById("memiliki_pekerjaan").value;

    // Validate form
    let isValid = true;

    if (!nama) {
      document.getElementById("nama_error").classList.remove("hidden");
      isValid = false;
    }

    if (!umur) {
      document.getElementById("umur_error").classList.remove("hidden");
      isValid = false;
    } else if (Number.parseInt(umur) < 15) {
      document.getElementById("umur_error").classList.remove("hidden");
      document.getElementById("umur_error").textContent = "Umur minimal 15 tahun";
      isValid = false;
    }

    if (!hubungan) {
      document.getElementById("hubungan_error").classList.remove("hidden");
      isValid = false;
    }

    if (!jenisKelamin) {
      document.getElementById("jenis_kelamin_error").classList.remove("hidden");
      isValid = false;
    }

    if (!statusPerkawinan) {
      document.getElementById("status_perkawinan_error").classList.remove("hidden");
      isValid = false;
    }

    if (!pendidikan) {
      document.getElementById("pendidikan_error").classList.remove("hidden");
      isValid = false;
    }

    if (!kegiatan) {
      document.getElementById("kegiatan_error").classList.remove("hidden");
      isValid = false;
    }

    if (isValid) {
      // Show loading state
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Menyimpan...
      `;
      submitButton.disabled = true;

      // Create form data
      const formData = new FormData();
      formData.append("nama", nama);
      formData.append("umur", umur);
      formData.append("hubungan", hubungan);
      formData.append("jenis_kelamin", jenisKelamin);
      formData.append("status_perkawinan", statusPerkawinan);
      formData.append("pendidikan", pendidikan);
      formData.append("kegiatan", kegiatan);
      formData.append("memiliki_pekerjaan", memilikiPekerjaan);

      // Send data to server
      fetch("/submit-individu", {
        method: "POST",
        body: formData,
      })
      .then((response) => response.json())
      .then((data) => {
        // Reset button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;

        if (data.success) {
          // Check if redirect is needed
          if (data.redirect_to_pekerjaan) {
            window.location.href = data.redirect_url; // Redirect to pekerjaan page
            return;
          }

          // Show success message
          successMessage.textContent = data.message || "Data berhasil disimpan.";
          successAlert.classList.remove("hidden");
          errorAlert.classList.add("hidden");

          // Scroll to success message
          successAlert.scrollIntoView({ behavior: "smooth" });

          // Update remaining count if provided
          if (data.remaining !== undefined) {
            remainingElement.textContent = data.remaining;
          }

          // If continuing to next member, reset form after delay
          if (data.continue_next_member) {
            setTimeout(() => {
              // Reset form
              form.reset();
              statusPekerjaanContainer.classList.add("hidden");
              bidangUsahaContainer.classList.add("hidden");
              namaPlaceholders.forEach((placeholder) => {
                placeholder.textContent = "NAMA";
              });

              // Hide success message
              successAlert.classList.add("hidden");

              // Focus on nama input for next member
              document.getElementById("nama").focus();
            }, 2000);
          }

          // If all data has been submitted, redirect to home page
          if (data.complete) {
            setTimeout(() => {
              window.location.href = data.redirect_url;
            }, 2000);
          }
        } else {
          // Show error message
          errorMessage.textContent = data.message || "Terjadi kesalahan.";
          errorAlert.classList.remove("hidden");
          successAlert.classList.add("hidden");

          // Scroll to error message
          errorAlert.scrollIntoView({ behavior: "smooth" });
        }
      })
      .catch((error) => {
        // Reset button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;

        console.error("Error:", error);
        errorMessage.textContent = "Terjadi kesalahan pada server.";
        errorAlert.classList.remove("hidden");
        successAlert.classList.add("hidden");

        // Scroll to error message
        errorAlert.scrollIntoView({ behavior: "smooth" });
      });
    } else {
      // Show error message for validation errors
      errorMessage.textContent = "Mohon lengkapi semua field yang wajib diisi.";
      errorAlert.classList.remove("hidden");
      successAlert.classList.add("hidden");

      // Scroll to first error
      const firstError = document.querySelector(".text-red-500:not(.hidden)");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  });
});