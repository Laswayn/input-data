// Base JavaScript functionality
class App {
  constructor() {
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.checkSession()
    this.setupSessionTimeout()
  }

  setupEventListeners() {
    // Close alert buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches('[data-dismiss="alert"]')) {
        const alert = e.target.closest(".alert")
        if (alert) {
          this.hideAlert(alert)
        }
      }
    })

    // Form validation
    document.addEventListener("submit", (e) => {
      if (e.target.matches('form[data-validate="true"]')) {
        if (!this.validateForm(e.target)) {
          e.preventDefault()
        }
      }
    })

    // Auto-hide alerts after 5 seconds
    document.querySelectorAll('.alert[data-auto-hide="true"]').forEach((alert) => {
      setTimeout(() => this.hideAlert(alert), 5000)
    })
  }

  validateForm(form) {
    let isValid = true
    const requiredFields = form.querySelectorAll("[required]")

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        this.showFieldError(field, "This field is required")
        isValid = false
      } else {
        this.hideFieldError(field)
      }
    })

    return isValid
  }

  showFieldError(field, message) {
    this.hideFieldError(field)

    const errorElement = document.createElement("div")
    errorElement.className = "error-text"
    errorElement.textContent = message
    errorElement.setAttribute("data-field-error", field.name || field.id)

    field.parentNode.appendChild(errorElement)
    field.classList.add("border-red-500")

    // Add shake animation
    field.animate(
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
  }

  hideFieldError(field) {
    const errorElement = field.parentNode.querySelector(`[data-field-error="${field.name || field.id}"]`)
    if (errorElement) {
      errorElement.remove()
    }
    field.classList.remove("border-red-500")
  }

  showAlert(message, type = "info") {
    const alertContainer = document.getElementById("alert-container") || this.createAlertContainer()

    const alert = document.createElement("div")
    alert.className = `alert alert-${type}`
    alert.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${this.getAlertIcon(type)}
        </div>
        <div class="ml-3">
          <p class="text-sm">${message}</p>
        </div>
        <button data-dismiss="alert" class="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-gray-100 inline-flex h-8 w-8">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `

    alertContainer.appendChild(alert)

    // Auto-hide after 5 seconds
    setTimeout(() => this.hideAlert(alert), 5000)

    return alert
  }

  hideAlert(alert) {
    alert.style.opacity = "0"
    alert.style.transform = "translateY(-20px)"
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert)
      }
    }, 300)
  }

  createAlertContainer() {
    const container = document.createElement("div")
    container.id = "alert-container"
    container.className = "fixed top-4 right-4 z-50 space-y-2"
    document.body.appendChild(container)
    return container
  }

  getAlertIcon(type) {
    const icons = {
      success:
        '<svg class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      error:
        '<svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      warning:
        '<svg class="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>',
      info: '<svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    }
    return icons[type] || icons.info
  }

  checkSession() {
    // Check session status periodically
    setInterval(
      () => {
        fetch("/auth/check-session")
          .then((response) => response.json())
          .then((data) => {
            if (!data.logged_in) {
              if (data.expired) {
                this.showAlert("Session expired. Please login again.", "warning")
              }
              setTimeout(() => {
                window.location.href = "/auth/login"
              }, 2000)
            }
          })
          .catch((error) => {
            console.error("Error checking session:", error)
          })
      },
      5 * 60 * 1000,
    ) // Check every 5 minutes
  }

  setupSessionTimeout() {
    let sessionTimeout
    let warningTimeout
    let countdownInterval
    let warningShown = false

    const SESSION_DURATION = 3600 * 1000 // 1 hour
    const WARNING_TIME = 5 * 60 * 1000 // 5 minutes before timeout

    const resetSessionTimer = () => {
      clearTimeout(sessionTimeout)
      clearTimeout(warningTimeout)
      clearInterval(countdownInterval)
      this.hideTimeoutWarning()

      warningTimeout = setTimeout(this.showTimeoutWarning, SESSION_DURATION - WARNING_TIME)
      sessionTimeout = setTimeout(this.logout, SESSION_DURATION)
    }

    const showTimeoutWarning = () => {
      if (warningShown) return

      warningShown = true
      const modal = this.createTimeoutModal()
      document.body.appendChild(modal)

      let timeLeft = WARNING_TIME / 1000

      countdownInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60)
        const seconds = timeLeft % 60
        const countdown = modal.querySelector("#countdown")
        if (countdown) {
          countdown.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`
        }

        timeLeft--

        if (timeLeft < 0) {
          clearInterval(countdownInterval)
          this.logout()
        }
      }, 1000)
    }

    this.showTimeoutWarning = showTimeoutWarning
    this.hideTimeoutWarning = () => {
      warningShown = false
      const modal = document.getElementById("timeout-modal")
      if (modal) {
        modal.remove()
      }
      clearInterval(countdownInterval)
    }

    this.logout = () => {
      clearTimeout(sessionTimeout)
      clearTimeout(warningTimeout)
      clearInterval(countdownInterval)
      window.location.href = "/auth/logout"
    }

    // Track user activity
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    activityEvents.forEach((event) => {
      document.addEventListener(event, resetSessionTimer, true)
    })

    // Initialize session timer
    resetSessionTimer()
  }

  createTimeoutModal() {
    const modal = document.createElement("div")
    modal.id = "timeout-modal"
    modal.className = "timeout-modal hidden"
    modal.innerHTML = `
      <div class="timeout-modal-content">
        <div style="color: #f59e0b; font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h3 style="margin: 0 0 15px 0; color: #374151;">Session Will Expire</h3>
        <p style="margin: 0 0 25px 0; color: #6b7280;">
          Your session will expire in <span id="countdown">5:00</span> minutes due to inactivity.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button onclick="app.extendSession()" class="btn btn-success">
            Extend Session
          </button>
          <button onclick="app.logout()" class="btn btn-danger">
            Logout Now
          </button>
        </div>
      </div>
    `

    modal.style.display = "flex"
    return modal
  }

  extendSession() {
    fetch("/auth/check-session")
      .then((response) => response.json())
      .then((data) => {
        if (data.logged_in) {
          this.hideTimeoutWarning()
          this.showAlert("Session extended successfully", "success")
        } else {
          this.logout()
        }
      })
      .catch((error) => {
        console.error("Error extending session:", error)
        this.logout()
      })
  }

  // Utility methods
  formatDate(date) {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  throttle(func, limit) {
    let inThrottle
    return function () {
      const args = arguments
      
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App()
})
