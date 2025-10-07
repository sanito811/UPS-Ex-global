// Admin Dashboard JavaScript

// Sample packages data (in real app, this would come from a database)
let packages = [
  {
    id: 1,
    trackingNumber: "UPEX123456789",
    sender: "John Smith",
    receiver: "Jane Doe",
    origin: "Phoenix, AZ",
    destination: "New York, NY",
    status: "in-transit",
    currentLocation: "Dallas, TX",
    estimatedDelivery: "2025-01-15",
    latitude: 32.7767,
    longitude: -96.797,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 2,
    trackingNumber: "UPEX987654321",
    sender: "Alice Johnson",
    receiver: "Bob Williams",
    origin: "Los Angeles, CA",
    destination: "Miami, FL",
    status: "in-transit",
    currentLocation: "Houston, TX",
    estimatedDelivery: "2025-01-16",
    latitude: 29.7604,
    longitude: -95.3698,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 3,
    trackingNumber: "UPEX456789123",
    sender: "Mike Brown",
    receiver: "Sarah Davis",
    origin: "Seattle, WA",
    destination: "Boston, MA",
    status: "delivered",
    currentLocation: "Boston, MA",
    estimatedDelivery: "2025-01-10",
    latitude: 42.3601,
    longitude: -71.0589,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 4,
    trackingNumber: "UPEX789123456",
    sender: "Emily Wilson",
    receiver: "David Martinez",
    origin: "Chicago, IL",
    destination: "Denver, CO",
    status: "pending",
    currentLocation: "Chicago, IL",
    estimatedDelivery: "2025-01-18",
    latitude: 41.8781,
    longitude: -87.6298,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 5,
    trackingNumber: "UPEX321654987",
    sender: "Chris Anderson",
    receiver: "Lisa Taylor",
    origin: "Atlanta, GA",
    destination: "San Francisco, CA",
    status: "in-transit",
    currentLocation: "Phoenix, AZ",
    estimatedDelivery: "2025-01-17",
    latitude: 33.4484,
    longitude: -112.074,
    lastUpdated: new Date().toISOString(),
  },
]

let autoRefreshInterval = null

// Initialize Admin Dashboard
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("/public/admin/index.html")) {
    // Load packages from localStorage or use default
    const savedPackages = localStorage.getItem("packages")
    if (savedPackages) {
      packages = JSON.parse(savedPackages)
    } else {
      savePackagesToStorage()
    }

    loadPackages()
    updateStats()
    renderMap()

    startAutoRefresh()
  }
})

function savePackagesToStorage() {
  localStorage.setItem("packages", JSON.stringify(packages))
  console.log("[v0] Packages saved to localStorage")
}

// Load Packages into Table
function loadPackages() {
  const tbody = document.getElementById("packagesTableBody")
  if (!tbody) return

  tbody.innerHTML = packages
    .map(
      (pkg) => `
        <tr data-id="${pkg.id}" data-status="${pkg.status}">
            <td><strong>${pkg.trackingNumber}</strong></td>
            <td>${pkg.sender}</td>
            <td>${pkg.receiver}</td>
            <td>${pkg.origin}</td>
            <td>${pkg.destination}</td>
            <td><span class="status-badge status-${pkg.status}">${pkg.status.replace("-", " ")}</span></td>
            <td>${pkg.currentLocation}</td>
            <td>${new Date(pkg.lastUpdated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</td>
            <td class="action-buttons">
                <button class="btn-icon btn-edit" onclick="editPackage(${pkg.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-view" onclick="viewPackageOnMap(${pkg.id})" title="View on Map">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deletePackage(${pkg.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("")
}

// Update Statistics
function updateStats() {
  const total = packages.length
  const inTransit = packages.filter((p) => p.status === "in-transit").length
  const delivered = packages.filter((p) => p.status === "delivered").length
  const pending = packages.filter((p) => p.status === "pending").length

  document.getElementById("totalPackages").textContent = total
  document.getElementById("inTransit").textContent = inTransit
  document.getElementById("delivered").textContent = delivered
  document.getElementById("pending").textContent = pending
}

// Render Map with Package Markers
function renderMap() {
  const markersContainer = document.getElementById("packageMarkers")
  if (!markersContainer) return

  // Clear existing markers
  markersContainer.innerHTML = ""

  // Add markers for each package
  packages.forEach((pkg) => {
    // Convert lat/long to SVG coordinates (simplified)
    const x = ((pkg.longitude + 125) / 60) * 1000
    const y = ((50 - pkg.latitude) / 25) * 600

    const color = pkg.status === "delivered" ? "#4CAF50" : pkg.status === "in-transit" ? "#ff6b35" : "#FFC107"

    const marker = `
            <g class="package-marker" data-id="${pkg.id}">
                <circle cx="${x}" cy="${y}" r="8" fill="${color}" stroke="#fff" stroke-width="2" class="marker-pulse"/>
                <text x="${x}" y="${y - 15}" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">
                    ${pkg.trackingNumber.slice(-4)}
                </text>
            </g>
        `
    markersContainer.innerHTML += marker
  })
}

// Show Add Package Modal
function showAddPackageModal() {
  document.getElementById("modalTitle").textContent = "Add New Package"
  document.getElementById("packageForm").reset()
  document.getElementById("packageId").value = ""
  document.getElementById("packageModal").classList.add("active")
}

// Edit Package
function editPackage(id) {
  const pkg = packages.find((p) => p.id === id)
  if (!pkg) return

  document.getElementById("modalTitle").textContent = "Edit Package"
  document.getElementById("packageId").value = pkg.id
  document.getElementById("trackingNumber").value = pkg.trackingNumber
  document.getElementById("status").value = pkg.status
  document.getElementById("senderName").value = pkg.sender
  document.getElementById("receiverName").value = pkg.receiver
  document.getElementById("originCity").value = pkg.origin
  document.getElementById("destinationCity").value = pkg.destination
  document.getElementById("currentLocation").value = pkg.currentLocation
  document.getElementById("estimatedDelivery").value = pkg.estimatedDelivery
  document.getElementById("latitude").value = pkg.latitude
  document.getElementById("longitude").value = pkg.longitude

  document.getElementById("packageModal").classList.add("active")
}

// Save Package (Add or Update)
function savePackage(event) {
  event.preventDefault()

  const id = document.getElementById("packageId").value
  const packageData = {
    trackingNumber: document.getElementById("trackingNumber").value,
    status: document.getElementById("status").value,
    sender: document.getElementById("senderName").value,
    receiver: document.getElementById("receiverName").value,
    origin: document.getElementById("originCity").value,
    destination: document.getElementById("destinationCity").value,
    currentLocation: document.getElementById("currentLocation").value,
    estimatedDelivery: document.getElementById("estimatedDelivery").value,
    latitude: Number.parseFloat(document.getElementById("latitude").value),
    longitude: Number.parseFloat(document.getElementById("longitude").value),
    lastUpdated: new Date().toISOString(), // Add timestamp
  }

  if (id) {
    // Update existing package
    const index = packages.findIndex((p) => p.id === Number.parseInt(id))
    if (index !== -1) {
      packages[index] = { ...packages[index], ...packageData }
    }
  } else {
    // Add new package
    const newId = Math.max(...packages.map((p) => p.id), 0) + 1
    packages.push({ id: newId, ...packageData })
  }

  savePackagesToStorage()

  closePackageModal()
  loadPackages()
  updateStats()
  renderMap()
  updateMapLastUpdate()

  alert("Package saved successfully! Live tracking updated.")
}

// Delete Package
function deletePackage(id) {
  if (!confirm("Are you sure you want to delete this package?")) return

  packages = packages.filter((p) => p.id !== id)

  savePackagesToStorage()

  loadPackages()
  updateStats()
  renderMap()

  alert("Package deleted successfully!")
}

// Close Package Modal
function closePackageModal() {
  document.getElementById("packageModal").classList.remove("active")
}

// View Package on Map
function viewPackageOnMap(id) {
  const pkg = packages.find((p) => p.id === id)
  if (!pkg) return

  // Scroll to map
  document.getElementById("adminMap").scrollIntoView({ behavior: "smooth" })

  // Highlight marker (simplified)
  alert(`Package ${pkg.trackingNumber} is currently at ${pkg.currentLocation}`)
}

// Search Packages
function searchPackages() {
  const search = document.getElementById("searchPackages").value.toLowerCase()
  const rows = document.querySelectorAll("#packagesTableBody tr")

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase()
    row.style.display = text.includes(search) ? "" : "none"
  })
}

// Filter Packages by Status
function filterPackages() {
  const status = document.getElementById("statusFilter").value
  const rows = document.querySelectorAll("#packagesTableBody tr")

  rows.forEach((row) => {
    const rowStatus = row.getAttribute("data-status")
    row.style.display = status === "all" || rowStatus === status ? "" : "none"
  })
}

// Refresh Map
function refreshMap() {
  renderMap()
  alert("Map refreshed with latest package locations!")
}

// Toggle Map View
function toggleMapView() {
  const mapContainer = document.querySelector(".admin-map")
  mapContainer.classList.toggle("fullscreen")
}

function setLocation(location, lat, lng) {
  document.getElementById("currentLocation").value = location
  document.getElementById("latitude").value = lat
  document.getElementById("longitude").value = lng
}

function toggleAutoRefresh() {
  const isEnabled = document.getElementById("autoRefresh").checked
  if (isEnabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
  autoRefreshInterval = setInterval(() => {
    console.log("[v0] Auto-refreshing map...")
    renderMap()
    updateMapLastUpdate()
  }, 5000) // Refresh every 5 seconds
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
}

function updateMapLastUpdate() {
  const updateElement = document.getElementById("mapLastUpdate")
  if (updateElement) {
    updateElement.textContent = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }
}

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  stopAutoRefresh()
})
