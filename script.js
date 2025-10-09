// Mobile Menu Toggle
function toggleMobileMenu() {
  const navLinks = document.querySelector(".nav-links")
  navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex"
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
let customerTrackingMap = null
let customerMarkers = {}

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

  const lastUpdated = pkg.lastUpdated ? new Date(pkg.lastUpdated) : new Date()
  document.getElementById("lastUpdated").textContent = lastUpdated.toLocaleTimeString("en-US")

  const statusBadge = document.getElementById("statusBadge")
  statusBadge.textContent = pkg.status.replace("-", " ").toUpperCase()
  statusBadge.className = `status-badge status-${pkg.status}`

  // Initialize or update Leaflet map
  initCustomerTrackingMap(pkg)

  createTimeline(pkg)
}

function initCustomerTrackingMap(pkg) {
  const mapContainer = document.getElementById("customerTrackingMap")
  if (!mapContainer) return

  // Initialize map if not already done
  if (!customerTrackingMap) {
    customerTrackingMap = window.L.map("customerTrackingMap").setView([pkg.latitude, pkg.longitude], 5)

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(customerTrackingMap)
  } else {
    // Clear existing markers
    Object.values(customerMarkers).forEach((marker) => marker.remove())
    customerMarkers = {}
  }

  // Add origin marker (green)
  const originMarker = window.L.marker([pkg.originLat || 33.4484, pkg.originLong || -112.074], {
    icon: window.L.divIcon({
      className: "custom-marker origin-marker",
      html: '<div class="marker-pin" style="background: #4CAF50;"></div><div class="marker-label">Origin</div>',
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    }),
  }).addTo(customerTrackingMap)
  customerMarkers.origin = originMarker

  // Add current location marker (orange, pulsing)
  const currentMarker = window.L.marker([pkg.latitude, pkg.longitude], {
    icon: window.L.divIcon({
      className: "custom-marker current-marker",
      html: '<div class="marker-pin pulse" style="background: #ff6b35;"></div><div class="marker-label">Current</div>',
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    }),
  }).addTo(customerTrackingMap)
  customerMarkers.current = currentMarker

  // Add destination marker (blue)
  const destMarker = window.L.marker([pkg.destLat || 40.7128, pkg.destLong || -74.006], {
    icon: window.L.divIcon({
      className: "custom-marker dest-marker",
      html: '<div class="marker-pin" style="background: #2196F3;"></div><div class="marker-label">Destination</div>',
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    }),
  }).addTo(customerTrackingMap)
  customerMarkers.dest = destMarker

  // Draw route line
  const routeLine = window.L.polyline(
    [
      [pkg.originLat || 33.4484, pkg.originLong || -112.074],
      [pkg.latitude, pkg.longitude],
      [pkg.destLat || 40.7128, pkg.destLong || -74.006],
    ],
    {
      color: "#ff6b35",
      weight: 3,
      opacity: 0.6,
      dashArray: "10, 10",
    },
  ).addTo(customerTrackingMap)
  customerMarkers.route = routeLine

  // Fit map to show all markers
  const bounds = window.L.latLngBounds([
    [pkg.originLat || 33.4484, pkg.originLong || -112.074],
    [pkg.latitude, pkg.longitude],
    [pkg.destLat || 40.7128, pkg.destLong || -74.006],
  ])
  customerTrackingMap.fitBounds(bounds, { padding: [50, 50] })
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
      const trackingNumber = "UEX" + Math.random().toString(36).substr(2, 9).toUpperCase()

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
    name: "iPhone 15 Pro Max",
    category: "phones",
    price: 1199.99,
    rating: 5,
    image: "image/iphone-15-pro-max-titanium.jpg",
    description: "256GB, Titanium Blue, A17 Pro chip, 48MP camera",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    category: "phones",
    price: 1299.99,
    rating: 5,
    image: "image/samsung-galaxy-s24-ultra.jpg",
    description: "512GB, Titanium Gray, S Pen included, 200MP camera",
  },
  {
    id: 3,
    name: "MacBook Pro 16-inch M3",
    category: "laptops",
    price: 2499.99,
    rating: 5,
    image: "image/macbook-pro-16-m3-space-black.jpg",
    description: "M3 Max chip, 36GB RAM, 1TB SSD, Space Black",
  },
  {
    id: 4,
    name: "Dell XPS 15",
    category: "laptops",
    price: 1899.99,
    rating: 5,
    image: "image/dell-xps-15-laptop.jpg",
    description: "Intel i9, 32GB RAM, 1TB SSD, 4K OLED display",
  },
  {
    id: 5,
    name: "iPad Pro 12.9-inch M2",
    category: "tablets",
    price: 1099.99,
    rating: 5,
    image: "image/ipad-pro-12-9-m2.jpg",
    description: "256GB, Space Gray, M2 chip, Liquid Retina XDR",
  },
  {
    id: 6,
    name: "Samsung Galaxy Tab S9 Ultra",
    category: "tablets",
    price: 1199.99,
    rating: 4,
    image: "image/samsung-galaxy-tab-s9-ultra.jpg",
    description: "512GB, Graphite, 14.6-inch AMOLED, S Pen included",
  },
  {
    id: 7,
    name: "Sony WH-1000XM5 Headphones",
    category: "audio",
    price: 399.99,
    rating: 5,
    image: "image/sony-wh-1000xm5-headphones.jpg",
    description: "Wireless, Noise Cancelling, 30hr battery, Black",
  },
  {
    id: 8,
    name: "AirPods Pro (2nd Gen)",
    category: "audio",
    price: 249.99,
    rating: 5,
    image: "image/airpods-pro-2nd-gen.jpg",
    description: "Active Noise Cancellation, USB-C, Spatial Audio",
  },
  {
    id: 9,
    name: "Canon EOS R5",
    category: "cameras",
    price: 3899.99,
    rating: 5,
    image: "image/canon-eos-r5-camera.jpg",
    description: "45MP Full-Frame, 8K video, IBIS, RF mount",
  },
  {
    id: 10,
    name: "Sony A7 IV",
    category: "cameras",
    price: 2498.99,
    rating: 5,
    image: "image/sony-a7-iv-camera.jpg",
    description: "33MP Full-Frame, 4K 60fps, 5-axis stabilization",
  },
  {
    id: 11,
    name: "Apple Watch Ultra 2",
    category: "accessories",
    price: 799.99,
    rating: 5,
    image: "image/apple-watch-ultra-2.jpg",
    description: "49mm Titanium, GPS + Cellular, Action Button",
  },
  {
    id: 12,
    name: "Logitech MX Master 3S",
    category: "accessories",
    price: 99.99,
    rating: 5,
    image: "image/logitech-mx-master-3s-mouse.jpg",
    description: "Wireless mouse, 8K DPI, Quiet clicks, USB-C",
  },
  {
    id: 13,
    name: "Google Pixel 8 Pro",
    category: "phones",
    price: 999.99,
    rating: 4,
    image: "image/google-pixel-8-pro.jpg",
    description: "256GB, Obsidian, Google Tensor G3, AI features",
  },
  {
    id: 14,
    name: "Microsoft Surface Laptop 5",
    category: "laptops",
    price: 1599.99,
    rating: 4,
    image: "image/microsoft-surface-laptop-5.jpg",
    description: "Intel i7, 16GB RAM, 512GB SSD, 13.5-inch touchscreen",
  },
  {
    id: 15,
    name: "Bose QuietComfort Ultra",
    category: "audio",
    price: 429.99,
    rating: 5,
    image: "image/bose-quietcomfort-ultra.jpg",
    description: "Wireless, Spatial Audio, 24hr battery, Premium comfort",
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

// Ship Cart Items - integrates shop with shipping
function shipCartItems() {
  if (cart.length === 0) {
    alert("Your cart is empty!")
    return
  }

  // Save cart items to localStorage for shipping form
  localStorage.setItem("itemsToShip", JSON.stringify(cart))

  // Redirect to shipping form
  window.location.href = "ship.html?from=shop"
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

// Admin Authentication Function
function handleAdminLogin(event) {
  event.preventDefault()

  const username = document.getElementById("adminUsername").value
  const password = document.getElementById("adminPassword").value

  // Simple authentication (in production, this would be server-side)
  if (username === "admin" && password === "admin123") {
    // Set admin session
    localStorage.setItem("adminLoggedIn", "true")
    localStorage.setItem("adminLoginTime", new Date().toISOString())

    // Redirect to admin dashboard
    window.location.href = "admin.html"
  } else {
    alert("Invalid username or password!")
  }
}

// Logout Function
function handleLogout() {
  localStorage.removeItem("adminLoggedIn")
  localStorage.removeItem("adminLoginTime")
}

// Password Visibility Toggle
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId)
  const button = input.nextElementSibling
  const icon = button.querySelector("i")

  if (input.type === "password") {
    input.type = "text"
    icon.classList.remove("fa-eye")
    icon.classList.add("fa-eye-slash")
  } else {
    input.type = "password"
    icon.classList.remove("fa-eye-slash")
    icon.classList.add("fa-eye")
  }
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

// Create Timeline
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
