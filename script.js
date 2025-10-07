// Mobile Menu Toggle
function toggleMobileMenu() {
  const navLinks = document.querySelector(".nav-links")
  navLinks.style.display = navLinks.style.display === "grid" ? "none" : "grid"
}

// Track Package from Homepage
function trackPackage(event) {
  event.preventDefault()
  const trackingNumber = document.getElementById("trackingInput").value
  window.location.href = `track.html?tracking=${trackingNumber}`
}

// Track Package Detail Page
let trackingInterval = null
let currentTrackingNumber = null

function trackPackageDetail(event) {
  event.preventDefault()
  const trackingNumber = document.getElementById("trackingNumberInput").value
  currentTrackingNumber = trackingNumber

  // Get package data from localStorage (simulating real-time database)
  const packages = JSON.parse(localStorage.getItem("packages") || "[]")
  const pkg = packages.find((p) => p.trackingNumber === trackingNumber)

  if (!pkg) {
    alert("Package not found! Please check your tracking number.")
    return
  }

  // Show results
  document.getElementById("trackingResults").style.display = "block"

  // Update package details
  updateTrackingDisplay(pkg)

  // Start real-time updates (check every 5 seconds)
  if (trackingInterval) {
    clearInterval(trackingInterval)
  }
  trackingInterval = setInterval(() => {
    refreshTracking()
  }, 5000)

  // Scroll to results
  document.getElementById("trackingResults").scrollIntoView({ behavior: "smooth" })
}

function updateTrackingDisplay(pkg) {
  document.getElementById("trackingNumber").textContent = pkg.trackingNumber
  document.getElementById("origin").textContent = pkg.origin
  document.getElementById("destination").textContent = pkg.destination
  document.getElementById("currentLocation").textContent = pkg.currentLocation
  document.getElementById("estimatedDelivery").textContent = new Date(pkg.estimatedDelivery).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  )

  // Update last updated time
  const lastUpdated = pkg.lastUpdated ? new Date(pkg.lastUpdated) : new Date()
  document.getElementById("lastUpdated").textContent = lastUpdated.toLocaleTimeString("en-US")

  // Update status badge
  const statusBadge = document.getElementById("statusBadge")
  statusBadge.textContent = pkg.status.replace("-", " ").toUpperCase()
  statusBadge.className = `status-badge status-${pkg.status}`

  // Update map
  updateTrackingMap(pkg)

  // Create timeline
  createTimeline(pkg)
}

function updateTrackingMap(pkg) {
  // City coordinates mapping
  const cityCoords = {
    "Phoenix, AZ": { x: 200, y: 350 },
    "Dallas, TX": { x: 450, y: 380 },
    "New York, NY": { x: 800, y: 250 },
    "Los Angeles, CA": { x: 150, y: 320 },
    "Chicago, IL": { x: 600, y: 280 },
    "Miami, FL": { x: 750, y: 450 },
    "Seattle, WA": { x: 120, y: 180 },
    "Boston, MA": { x: 850, y: 240 },
    "Houston, TX": { x: 420, y: 420 },
    "Denver, CO": { x: 350, y: 300 },
    "Atlanta, GA": { x: 680, y: 400 },
    "San Francisco, CA": { x: 100, y: 300 },
  }

  // Get coordinates or use lat/long
  const originCoords = cityCoords[pkg.origin] || {
    x: (((pkg.originLong || -112) + 125) / 60) * 1000,
    y: ((50 - (pkg.originLat || 33)) / 25) * 600,
  }
  const destCoords = cityCoords[pkg.destination] || {
    x: (((pkg.destLong || -74) + 125) / 60) * 1000,
    y: ((50 - (pkg.destLat || 40)) / 25) * 600,
  }
  const currentCoords = cityCoords[pkg.currentLocation] || {
    x: ((pkg.longitude + 125) / 60) * 1000,
    y: ((50 - pkg.latitude) / 25) * 600,
  }

  // Update route line
  const routeLine = document.getElementById("routeLine")
  routeLine.setAttribute("d", `M ${originCoords.x} ${originCoords.y} L ${destCoords.x} ${destCoords.y}`)

  // Update origin marker
  const originMarker = document.getElementById("originMarker")
  originMarker.setAttribute("transform", `translate(${originCoords.x}, ${originCoords.y})`)

  // Update destination marker
  const destMarker = document.getElementById("destinationMarker")
  destMarker.setAttribute("transform", `translate(${destCoords.x}, ${destCoords.y})`)

  // Update current location marker with animation
  const currentMarker = document.getElementById("currentMarker")
  currentMarker.setAttribute("transform", `translate(${currentCoords.x}, ${currentCoords.y})`)

  // Update marker label
  document.getElementById("markerLabel").textContent = pkg.currentLocation.split(",")[0]
}

function createTimeline(pkg) {
  const timeline = document.getElementById("timeline")

  // Generate timeline events based on package status
  const events = [
    {
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: "Package Picked Up",
      location: pkg.origin,
    },
    {
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "In Transit",
      location: "Sorting Facility",
    },
    {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "In Transit",
      location: pkg.currentLocation,
    },
  ]

  if (pkg.status === "delivered") {
    events.push({
      date: new Date(),
      status: "Delivered",
      location: pkg.destination,
    })
  }

  timeline.innerHTML = events
    .map(
      (event) => `
    <div class="timeline-item">
      <div class="timeline-date">${event.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })} - ${event.date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}</div>
      <div class="timeline-status">${event.status}</div>
      <div class="timeline-location">${event.location}</div>
    </div>
  `,
    )
    .join("")
}

function refreshTracking() {
  if (!currentTrackingNumber) return

  const packages = JSON.parse(localStorage.getItem("packages") || "[]")
  const pkg = packages.find((p) => p.trackingNumber === currentTrackingNumber)

  if (pkg) {
    console.log("[v0] Refreshing tracking data for:", currentTrackingNumber)
    updateTrackingDisplay(pkg)
  }
}

// Shipment Form Steps
let currentStep = 1

function nextStep(step) {
  // Hide current step
  document.getElementById(`step${currentStep}`).classList.remove("active")
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove("active")

  // Show next step
  currentStep = step
  document.getElementById(`step${currentStep}`).classList.add("active")
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.add("active")
}

function prevStep(step) {
  nextStep(step)
}

// Handle Shipment Form Submission
document.addEventListener("DOMContentLoaded", () => {
  const shipmentForm = document.getElementById("shipmentForm")
  if (shipmentForm) {
    shipmentForm.addEventListener("submit", (event) => {
      event.preventDefault()

      // Generate tracking number
      const trackingNumber = "UPEX" + Math.random().toString(36).substr(2, 9).toUpperCase()

      // Get form data
      const formData = new FormData(shipmentForm)

      // Add current date
      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      document.getElementById("receiptDate").textContent = currentDate

      // Populate receipt
      document.getElementById("receiptTrackingNumber").textContent = trackingNumber
      document.getElementById("receiptSender").innerHTML = `
                <strong>${formData.get("senderName")}</strong><br>
                ${formData.get("senderCompany") ? formData.get("senderCompany") + "<br>" : ""}
                ${formData.get("senderAddress")}<br>
                ${formData.get("senderCity")}, ${formData.get("senderState")} ${formData.get("senderZip")}<br>
                ${formData.get("senderCountry")}<br>
                <i class="fas fa-envelope"></i> ${formData.get("senderEmail")}<br>
                <i class="fas fa-phone"></i> ${formData.get("senderPhone")}
            `
      document.getElementById("receiptReceiver").innerHTML = `
                <strong>${formData.get("receiverName")}</strong><br>
                ${formData.get("receiverCompany") ? formData.get("receiverCompany") + "<br>" : ""}
                ${formData.get("receiverAddress")}<br>
                ${formData.get("receiverCity")}, ${formData.get("receiverState")} ${formData.get("receiverZip")}<br>
                ${formData.get("receiverCountry")}<br>
                <i class="fas fa-envelope"></i> ${formData.get("receiverEmail")}<br>
                <i class="fas fa-phone"></i> ${formData.get("receiverPhone")}
            `
      document.getElementById("receiptPackage").innerHTML = `
                <strong>Type:</strong> ${formData.get("packageType")}<br>
                <strong>Weight:</strong> ${formData.get("weight")} kg<br>
                <strong>Dimensions:</strong> ${formData.get("length")} × ${formData.get("width")} × ${formData.get("height")} cm<br>
                <strong>Service:</strong> ${formData.get("service")}<br>
                <strong>Contents:</strong> ${formData.get("contents")}<br>
                <strong>Declared Value:</strong> $${formData.get("value")}
            `

      // Calculate total (simplified)
      const servicePrice = formData.get("service") === "express" ? 50 : formData.get("service") === "standard" ? 25 : 15
      document.getElementById("receiptTotal").textContent = `$${servicePrice.toFixed(2)}`

      // Show receipt modal
      document.getElementById("receiptModal").classList.add("active")
    })
  }
})

function closeReceipt() {
  document.getElementById("receiptModal").classList.remove("active")
  window.location.href = "index.html"
}

function printReceipt() {
  window.print()
}

// Download Receipt Functionality
function downloadReceipt() {
  alert("Receipt download functionality would generate a PDF here!")
  // In a real application, this would use a library like jsPDF to generate a PDF
}

// Shop Products Data
const products = [
  {
    id: 1,
    name: "Premium Cardboard Box - Large",
    category: "boxes",
    price: 12.99,
    rating: 5,
    image: "/public/large-brown-cardboard-shipping-box.jpg",
    description: "Heavy-duty corrugated cardboard, 24x18x12 inches",
  },
  {
    id: 2,
    name: "Medium Box Pack (10 Pack)",
    category: "boxes",
    price: 24.99,
    rating: 5,
    image: "/public/stack-of-medium-cardboard-boxes.jpg",
    description: "Perfect for standard shipments, 16x12x10 inches",
  },
  {
    id: 3,
    name: "Bubble Wrap Roll - 50ft",
    category: "packaging",
    price: 15.99,
    rating: 4,
    image: "/public/bubble-wrap-roll-packaging-material.jpg",
    description: "Premium air bubble cushioning, 12 inch width",
  },
  {
    id: 4,
    name: "Heavy Duty Packing Tape (6 Pack)",
    category: "labels",
    price: 18.99,
    rating: 5,
    image: "/public/brown-packing-tape-rolls.jpg",
    description: "2 inch width, strong adhesive, 110 yards per roll",
  },
  {
    id: 5,
    name: "Fragile Warning Labels (100 Pack)",
    category: "labels",
    price: 8.99,
    rating: 4,
    image: "public/red-fragile-warning-sticker-labels.jpg",
    description: "Bright red warning stickers, 4x6 inches",
  },
  {
    id: 6,
    name: "Biodegradable Packing Peanuts",
    category: "packaging",
    price: 14.99,
    rating: 4,
    image: "/public/white-biodegradable-packing-peanuts.jpg",
    description: "Eco-friendly void fill, 7 cubic feet",
  },
  {
    id: 7,
    name: "Digital Shipping Scale - 110lb",
    category: "equipment",
    price: 45.99,
    rating: 5,
    image: "/public/digital-shipping-scale-with-lcd-display.jpg",
    description: "LCD display, accurate to 0.1oz, battery powered",
  },
  {
    id: 8,
    name: "Shipping Address Labels (500 Pack)",
    category: "labels",
    price: 12.99,
    rating: 5,
    image: "/public/white-shipping-address-label-roll.jpg",
    description: "Self-adhesive, 4x6 inches, compatible with all printers",
  },
  {
    id: 9,
    name: "Foam Wrap Sheets (50 Pack)",
    category: "packaging",
    price: 19.99,
    rating: 5,
    image: "public/white-foam-wrap-protective-sheets.jpg",
    description: "Protective foam padding, 12x12 inches",
  },
  {
    id: 10,
    name: "Box Cutter Safety Knife",
    category: "equipment",
    price: 9.99,
    rating: 4,
    image: "/public/yellow-safety-box-cutter-knife.jpg",
    description: "Retractable blade, ergonomic grip, includes 5 blades",
  },
  {
    id: 11,
    name: "Stretch Wrap Film Roll",
    category: "packaging",
    price: 22.99,
    rating: 5,
    image: "/public/clear-stretch-wrap-film-roll.jpg",
    description: "18 inch width, 1500ft length, clear plastic",
  },
  {
    id: 12,
    name: "Thermal Label Printer",
    category: "equipment",
    price: 129.99,
    rating: 5,
    image: "/public/thermal-label-printer-machine.jpg",
    description: "4x6 labels, USB connection, high-speed printing",
  },
]

let cart = []

// Load Products
function loadProducts() {
  const productsGrid = document.getElementById("productsGrid")
  if (!productsGrid) return

  productsGrid.innerHTML = products
    .map(
      (product) => `
        <div class="product-card" data-category="${product.category}">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-rating">
                    ${'<i class="fas fa-star"></i>'.repeat(product.rating)}
                </div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="btn btn-primary add-to-cart" onclick="addToCart(${product.id})">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Filter Products
function filterProducts() {
  const category = document.getElementById("categoryFilter").value
  const search = document.getElementById("searchInput").value.toLowerCase()
  const productCards = document.querySelectorAll(".product-card")

  productCards.forEach((card) => {
    const cardCategory = card.getAttribute("data-category")
    const cardName = card.querySelector(".product-name").textContent.toLowerCase()

    const categoryMatch = category === "all" || cardCategory === category
    const searchMatch = cardName.includes(search)

    card.style.display = categoryMatch && searchMatch ? "block" : "none"
  })
}

// Add to Cart
function addToCart(productId) {
  const product = products.find((p) => p.id === productId)
  const existingItem = cart.find((item) => item.id === productId)

  if (existingItem) {
    existingItem.quantity++
  } else {
    cart.push({ ...product, quantity: 1 })
  }

  updateCart()
}

// Update Cart
function updateCart() {
  const cartCount = document.getElementById("cartCount")
  const cartItems = document.getElementById("cartItems")
  const cartTotal = document.getElementById("cartTotal")

  if (!cartCount) return

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  cartCount.textContent = totalItems

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>'
    cartTotal.textContent = "$0.00"
    return
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `,
    )
    .join("")

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  cartTotal.textContent = `$${total.toFixed(2)}`
}

// Update Quantity
function updateQuantity(productId, change) {
  const item = cart.find((item) => item.id === productId)
  if (item) {
    item.quantity += change
    if (item.quantity <= 0) {
      removeFromCart(productId)
    } else {
      updateCart()
    }
  }
}

// Remove from Cart
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  updateCart()
}

// Toggle Cart Modal
function toggleCart() {
  const cartModal = document.getElementById("cartModal")
  cartModal.classList.toggle("active")
}

// Checkout
function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty!")
    return
  }
  alert("Checkout functionality would be implemented here!")
}

// Contact Form
function submitContactForm(event) {
  event.preventDefault()
  alert("Thank you for your message! We will get back to you soon.")
  event.target.reset()
}

// Auth Forms
function handleLogin(event) {
  event.preventDefault()
  alert("Login functionality would be implemented here!")
}

function handleRegister(event) {
  event.preventDefault()
  const password = event.target.password.value
  const confirmPassword = event.target.confirmPassword.value

  if (password !== confirmPassword) {
    alert("Passwords do not match!")
    return
  }

  alert("Registration functionality would be implemented here!")
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadProducts()
})

// Clean up interval when leaving page
window.addEventListener("beforeunload", () => {
  if (trackingInterval) {
    clearInterval(trackingInterval)
  }
})
