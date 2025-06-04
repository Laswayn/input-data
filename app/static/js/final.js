// Final page JavaScript
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded - initializing final page")

  // Set current date and time as default
  const now = new Date()
  const currentDateTime =
    now.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }) +
    " " +
    now.toLocaleTimeString("id-ID")

  const tanggalPencacah = document.getElementById("tanggal_pencacah")
  const tanggalPemberiJawaban = document.getElementById("tanggal_pemberi_jawaban")

  if (tanggalPencacah) tanggalPencacah.value = currentDateTime
  if (tanggalPemberiJawaban) tanggalPemberiJawaban.value = currentDateTime

  setupFinalForm()
  setupEditButtons()
  loadFamilyData()
})

function setupFinalForm() {
  console.log("Setting up final form")
  const form = document.getElementById("finalForm")
  if (!form) {
    console.error("Final form not found!")
    return
  }

  console.log("Adding submit event listener to form")
  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    console.log("Form submit triggered")

    if (!validateFinalForm()) {
      console.log("Form validation failed")
      return
    }

    const submitBtn = document.getElementById("submitBtn")
    if (!submitBtn) {
      console.error("Submit button not found!")
      return
    }

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
      const formData = new FormData(form)

      // Debug: Log form data
      console.log("Form data being submitted:")
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`)
      }

      console.log("Sending data to server...")
      const response = await fetch("/submit-final", {
        method: "POST",
        body: formData,
      })

      console.log("Response received:", response)
      const result = await response.json()
      console.log("Server response:", result)

      if (result.success) {
        console.log("Data saved successfully!")
        showMessage(result.message, "success")

        // Wait a bit before redirect
        setTimeout(() => {
          if (result.redirect_url) {
            console.log("Redirecting to:", result.redirect_url)
            window.location.href = result.redirect_url
          } else {
            console.log("Redirecting to index with clear=true")
            window.location.href = "/index?clear=true"
          }
        }, 2000)
      } else {
        console.error("Server returned error:", result.message)
        showMessage(result.message, "error")
      }
    } catch (error) {
      console.error("Error during form submission:", error)
      showMessage("Terjadi kesalahan saat menyimpan data: " + error.message, "error")
    } finally {
      // Restore button
      submitBtn.disabled = false
      submitBtn.innerHTML = originalText
    }
  })
}

function validateFinalForm() {
  console.log("Validating final form")
  let isValid = true

  // Clear previous errors
  document.querySelectorAll(".text-red-500").forEach((error) => {
    error.classList.add("hidden")
  })

  // Validate required fields
  const requiredFields = ["nama_pencacah", "hp_pencacah", "nama_pemberi_jawaban", "hp_pemberi_jawaban"]

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId)
    if (!field || !field.value.trim()) {
      showFieldError(fieldId, "Field ini wajib diisi")
      isValid = false
    }
  })

  console.log("Form validation result:", isValid)
  return isValid
}

function showFieldError(fieldId, message) {
  console.log(`Showing error for field ${fieldId}: ${message}`)
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

function loadFamilyData() {
  // This function can be used to load and display family data
  console.log("Loading family data...")

  // Check if we have data in window object
  if (window.keluargaData) {
    console.log("Family data available:", window.keluargaData)
  } else {
    console.warn("No family data available in window object")
  }
}

function setupEditButtons() {
  console.log("Setting up edit buttons")

  // Setup edit family button
  const editFamilyBtn = document.getElementById("editFamilyBtn")
  if (editFamilyBtn) {
    editFamilyBtn.addEventListener("click", editFamily)
  }

  // Setup edit member buttons
  const editButtons = document.querySelectorAll('[id^="editMember"]')
  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const memberIndex = this.getAttribute("data-member-index")
      editMember(Number.parseInt(memberIndex))
    })
  })
}

function editMember(index) {
  console.log("Editing member at index:", index)
  const memberData = (window.allMembersData || [])[index]
  const familyData = window.keluargaData || {}

  if (!memberData) {
    console.error("Member data not found for index:", index)
    return
  }

  const params = new URLSearchParams({
    memberIndex: index,
    memberData: encodeURIComponent(JSON.stringify(memberData)),
    familyData: encodeURIComponent(JSON.stringify(familyData)),
  })

  window.location.href = `/edit-anggota?${params.toString()}`
}

function editFamily() {
  console.log("Editing family data")
  const familyData = window.keluargaData || {}
  const params = new URLSearchParams({
    data: encodeURIComponent(JSON.stringify(familyData)),
  })
  window.location.href = `/edit-keluarga?${params.toString()}`
}

function showMessage(message, type) {
  console.log(`Showing ${type} message: ${message}`)
  const messageContainer = document.getElementById("messageContainer")
  if (!messageContainer) {
    console.error("Message container not found!")
    return
  }

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

// Add debugging function to check session data
function checkSessionData() {
  console.log("Checking session data...")
  fetch("/debug-session")
    .then((response) => response.json())
    .then((data) => {
      console.log("Session data:", data)
    })
    .catch((error) => {
      console.error("Error checking session data:", error)
    })
}

// Call this on page load to debug
checkSessionData()

// Setup alert close handlers
document.addEventListener("DOMContentLoaded", () => {
  console.log("Setting up alert close handlers")

  const closeAlertBtn = document.getElementById("closeAlert")
  if (closeAlertBtn) {
    closeAlertBtn.addEventListener("click", () => {
      document.getElementById("successAlert").classList.add("hidden")
    })
  }

  const closeErrorAlertBtn = document.getElementById("closeErrorAlert")
  if (closeErrorAlertBtn) {
    closeErrorAlertBtn.addEventListener("click", () => {
      document.getElementById("errorAlert").classList.add("hidden")
    })
  }
})
