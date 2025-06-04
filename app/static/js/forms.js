// Form handling functionality
class FormHandler {
  constructor() {
    this.init()
  }

  init() {
    this.setupFormValidation()
    this.setupConditionalFields()
    this.setupAutoSave()
    this.setupFormSubmission()
  }

  setupFormValidation() {
    // Real-time validation
    document.addEventListener("input", (e) => {
      if (e.target.matches("input, select, textarea")) {
        this.validateField(e.target)
      }
    })

    // Validation on blur
    document.addEventListener(
      "blur",
      (e) => {
        if (e.target.matches("input, select, textarea")) {
          this.validateField(e.target)
        }
      },
      true,
    )
  }

  validateField(field) {
    const errors = []

    // Required field validation
    if (field.hasAttribute("required") && !field.value.trim()) {
      errors.push("This field is required")
    }

    // Type-specific validation
    if (field.value.trim()) {
      switch (field.type) {
        case "email":
          if (!this.isValidEmail(field.value)) {
            errors.push("Please enter a valid email address")
          }
          break
        case "tel":
          if (!this.isValidPhone(field.value)) {
            errors.push("Please enter a valid phone number")
          }
          break
        case "number":
          const min = field.getAttribute("min")
          const max = field.getAttribute("max")
          const value = Number.parseFloat(field.value)

          if (min && value < Number.parseFloat(min)) {
            errors.push(`Value must be at least ${min}`)
          }
          if (max && value > Number.parseFloat(max)) {
            errors.push(`Value must be at most ${max}`)
          }
          break
      }
    }

    // Custom validation
    if (field.hasAttribute("data-validate")) {
      const customValidation = field.getAttribute("data-validate")
      const customError = this.customValidate(field, customValidation)
      if (customError) {
        errors.push(customError)
      }
    }

    // Show/hide errors
    if (errors.length > 0) {
      this.showFieldError(field, errors[0])
    } else {
      this.hideFieldError(field)
    }

    return errors.length === 0
  }

  customValidate(field, validation) {
    switch (validation) {
      case "age-15-plus":
        const age = Number.parseInt(field.value)
        if (age < 15) {
          return "Age must be at least 15 years"
        }
        break
      case "member-count":
        const totalMembers = Number.parseInt(document.getElementById("jumlah_anggota")?.value || 0)
        const adultMembers = Number.parseInt(field.value || 0)
        if (adultMembers > totalMembers) {
          return "Cannot exceed total family members"
        }
        break
    }
    return null
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  isValidPhone(phone) {
    const phoneRegex = /^[+]?[0-9\s\-$$$$]{10,}$/
    return phoneRegex.test(phone)
  }

  showFieldError(field, message) {
    this.hideFieldError(field)

    const errorElement = document.createElement("div")
    errorElement.className = "error-text"
    errorElement.textContent = message
    errorElement.setAttribute("data-field-error", field.name || field.id)

    field.parentNode.appendChild(errorElement)
    field.classList.add("border-red-500")
  }

  hideFieldError(field) {
    const errorElement = field.parentNode.querySelector(`[data-field-error="${field.name || field.id}"]`)
    if (errorElement) {
      errorElement.remove()
    }
    field.classList.remove("border-red-500")
  }

  setupConditionalFields() {
    // Handle conditional field display
    document.addEventListener("change", (e) => {
      if (e.target.hasAttribute("data-conditional")) {
        this.handleConditionalField(e.target)
      }
    })
  }

  handleConditionalField(field) {
    const conditions = JSON.parse(field.getAttribute("data-conditional"))

    conditions.forEach((condition) => {
      const targetField = document.getElementById(condition.target)
      const targetContainer = document.getElementById(condition.container)

      if (targetField || targetContainer) {
        const element = targetContainer || targetField.parentNode

        if (condition.values.includes(field.value)) {
          element.classList.remove("hidden")
          if (condition.required) {
            targetField?.setAttribute("required", "")
          }
        } else {
          element.classList.add("hidden")
          if (targetField) {
            targetField.value = ""
            targetField.removeAttribute("required")
            this.hideFieldError(targetField)
          }
        }
      }
    })
  }

  setupAutoSave() {
    const autoSaveForms = document.querySelectorAll('[data-auto-save="true"]')

    autoSaveForms.forEach((form) => {
      const saveKey = form.getAttribute("data-save-key") || "form_data"

      // Load saved data
      this.loadFormData(form, saveKey)

      // Save on input
      const debouncedSave = this.debounce(() => {
        this.saveFormData(form, saveKey)
      }, 1000)

      form.addEventListener("input", debouncedSave)
      form.addEventListener("change", debouncedSave)
    })
  }

  saveFormData(form, key) {
    const formData = new FormData(form)
    const data = {}

    for (const [name, value] of formData.entries()) {
      data[name] = value
    }

    localStorage.setItem(key, JSON.stringify(data))
    console.log(`Form data saved to localStorage with key: ${key}`)
  }

  loadFormData(form, key) {
    const savedData = localStorage.getItem(key)
    if (savedData) {
      try {
        const data = JSON.parse(savedData)

        Object.keys(data).forEach((name) => {
          const field = form.querySelector(`[name="${name}"]`)
          if (field && data[name]) {
            field.value = data[name]

            // Trigger change event for conditional fields
            if (field.hasAttribute("data-conditional")) {
              field.dispatchEvent(new Event("change"))
            }
          }
        })

        console.log(`Form data loaded from localStorage with key: ${key}`)
      } catch (error) {
        console.error("Error loading saved form data:", error)
      }
    }
  }

  clearFormData(key) {
    localStorage.removeItem(key)
    console.log(`Form data cleared for key: ${key}`)
  }

  setupFormSubmission() {
    document.addEventListener("submit", (e) => {
      if (e.target.matches('form[data-ajax="true"]')) {
        e.preventDefault()
        this.handleAjaxSubmission(e.target)
      }
    })
  }

  async handleAjaxSubmission(form) {
    const submitButton = form.querySelector('button[type="submit"]')
    const originalText = submitButton.innerHTML

    // Show loading state
    this.setButtonLoading(submitButton, true)

    try {
      const formData = new FormData(form)
      const response = await fetch(form.action, {
        method: form.method || "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        this.showAlert(result.message, "success")

        // Clear auto-save data if successful
        const saveKey = form.getAttribute("data-save-key")
        if (saveKey) {
          this.clearFormData(saveKey)
        }

        // Handle redirect
        if (result.redirect && result.redirect_url) {
          setTimeout(() => {
            window.location.href = result.redirect_url
          }, 2000)
        }

        // Handle continue next member
        if (result.continue_next_member) {
          this.resetFormForNextMember(form)
        }
      } else {
        this.showAlert(result.message, "error")
      }
    } catch (error) {
      console.error("Form submission error:", error)
      this.showAlert("An error occurred while submitting the form", "error")
    } finally {
      this.setButtonLoading(submitButton, false, originalText)
    }
  }

  setButtonLoading(button, loading, originalText = "") {
    if (loading) {
      button.disabled = true
      button.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
      `
    } else {
      button.disabled = false
      button.innerHTML = originalText
    }
  }

  resetFormForNextMember(form) {
    // Reset form but keep some fields
    const fieldsToKeep = ["keluarga_id"]
    const savedValues = {}

    fieldsToKeep.forEach((fieldName) => {
      const field = form.querySelector(`[name="${fieldName}"]`)
      if (field) {
        savedValues[fieldName] = field.value
      }
    })

    form.reset()

    // Restore saved values
    Object.keys(savedValues).forEach((fieldName) => {
      const field = form.querySelector(`[name="${fieldName}"]`)
      if (field) {
        field.value = savedValues[fieldName]
      }
    })

    // Hide all conditional fields
    form.querySelectorAll(".conditional-field").forEach((field) => {
      field.classList.add("hidden")
    })

    // Clear all error messages
    form.querySelectorAll(".error-text").forEach((error) => {
      error.remove()
    })

    // Focus on first input
    const firstInput = form.querySelector("input, select, textarea")
    if (firstInput) {
      firstInput.focus()
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Utility methods for specific form behaviors
  updateNamePlaceholders(name) {
    document.querySelectorAll(".nama-placeholder").forEach((placeholder) => {
      placeholder.textContent = name || "NAMA"
    })
  }

  updateRemainingCount(count) {
    const remainingElement = document.getElementById("remaining")
    if (remainingElement) {
      remainingElement.textContent = count
    }
  }

  setCurrentDateTime(fieldId) {
    const field = document.getElementById(fieldId)
    if (field) {
      const now = new Date()
      field.value = this.formatDate(now)
    }
  }

  debounce(func, wait) {
    let timeout
    return function (...args) {
      
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  showAlert(message, type) {
    const alertElement = document.createElement("div")
    alertElement.className = `alert alert-${type}`
    alertElement.textContent = message
    document.body.appendChild(alertElement)

    setTimeout(() => {
      alertElement.remove()
    }, 3000)
  }

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
}

// Initialize form handler when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.formHandler = new FormHandler()
})
