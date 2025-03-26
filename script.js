document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const getLocationBtn = document.getElementById('get-location-btn');
    const startTrackingBtn = document.getElementById('start-tracking-btn');
    const stopTrackingBtn = document.getElementById('stop-tracking-btn');
    const saveLocationBtn = document.getElementById('save-location-btn');
    const trackingStatus = document.getElementById('tracking-status');
    const locationDisplay = document.getElementById('location-display');
    const latitudeElement = document.getElementById('latitude');
    const longitudeElement = document.getElementById('longitude');
    const timestampElement = document.getElementById('timestamp');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const successContainer = document.getElementById('success-container');
    
    // Map variables
    let map = null;
    let marker = null;
    let watchId = null;
    let currentLocation = null;
    
    // Initialize map
    function initMap(lat, lng) {
        if (map === null) {
            map = L.map('map').setView([lat, lng], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            // Custom marker icon
            const parkingIcon = L.divIcon({
                className: 'parking-marker',
                html: `<div style="background-color: #f39c12; width: 30px; height: 30px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">P</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            marker = L.marker([lat, lng], {icon: parkingIcon}).addTo(map);
        } else {
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
        }
    }
    
    // Show error
    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
    
    // Show success
    function showSuccess() {
        successContainer.style.display = 'flex';
        setTimeout(() => {
            successContainer.style.display = 'none';
        }, 3000);
    }
    
    // Update location display
    function updateLocationDisplay(position) {
        const { latitude, longitude, timestamp } = position;
        
        currentLocation = {
            latitude,
            longitude,
            timestamp
        };
        
        latitudeElement.textContent = latitude.toFixed(6);
        longitudeElement.textContent = longitude.toFixed(6);
        timestampElement.textContent = new Date(timestamp).toLocaleTimeString();
        
        locationDisplay.style.display = 'block';
        saveLocationBtn.disabled = false;
        
        initMap(latitude, longitude);
    }
    
    // Get current position
    function getCurrentPosition() {
        if (!navigator.geolocation) {
            showError("Geolocation is not supported by your browser");
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                updateLocationDisplay({
                    latitude,
                    longitude,
                    timestamp: position.timestamp
                });
            },
            (err) => {
                showError(`Error getting location: ${err.message}`);
            },
            { enableHighAccuracy: true }
        );
    }
    
    // Start tracking location
    function startTracking() {
        if (!navigator.geolocation) {
            showError("Geolocation is not supported by your browser");
            return;
        }
        
        // Clear any existing watch
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
        
        trackingStatus.textContent = "Tracking your location in real-time";
        startTrackingBtn.style.display = 'none';
        stopTrackingBtn.style.display = 'inline-block';
        getLocationBtn.disabled = true;
        
        // Start watching position
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                updateLocationDisplay({
                    latitude,
                    longitude,
                    timestamp: position.timestamp
                });
            },
            (err) => {
                showError(`Error tracking location: ${err.message}`);
                stopTracking();
            },
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
    }
    
    // Stop tracking location
    function stopTracking() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        
        trackingStatus.textContent = "Get your current location or enable tracking";
        stopTrackingBtn.style.display = 'none';
        startTrackingBtn.style.display = 'inline-block';
        getLocationBtn.disabled = false;
    }
    
    // Save location to database
    function saveLocation() {
        if (!currentLocation) return;
        
        const { latitude, longitude } = currentLocation;
        
        // Create form data
        const formData = new FormData();
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);
        
        // Disable save button while saving
        saveLocationBtn.disabled = true;
        saveLocationBtn.textContent = 'Saving...';
        
        // Send to PHP script
        fetch('save-location.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess();
                loadLocationHistory(); // Refresh history
            } else {
                showError(data.message || 'Failed to save location');
            }
        })
        .catch(error => {
            showError('Error connecting to server');
            console.error('Error:', error);
        })
        .finally(() => {
            saveLocationBtn.disabled = false;
            saveLocationBtn.textContent = 'Save to Database';
        });
    }
    
    // Load location history
    function loadLocationHistory() {
        const historyLoading = document.getElementById('history-loading');
        const historyError = document.getElementById('history-error');
        const historyEmpty = document.getElementById('history-empty');
        const historyTableContainer = document.getElementById('history-table-container');
        const historyTableBody = document.getElementById('history-table-body');
        
        historyLoading.style.display = 'block';
        historyError.style.display = 'none';
        historyEmpty.style.display = 'none';
        historyTableContainer.style.display = 'none';
        
        fetch('get-locations.php')
            .then(response => response.json())
            .then(data => {
                historyLoading.style.display = 'none';
                
                if (data.error) {
                    historyError.textContent = data.error;
                    historyError.style.display = 'block';
                    return;
                }
                
                if (data.locations.length === 0) {
                    historyEmpty.style.display = 'block';
                    return;
                }
                
                // Populate table
                historyTableBody.innerHTML = '';
                data.locations.forEach(loc => {
                    const row = document.createElement('tr');
                    
                    const idCell = document.createElement('td');
                    idCell.textContent = loc.id;
                    
                    const latCell = document.createElement('td');
                    latCell.textContent = loc.latitude;
                    
                    const lngCell = document.createElement('td');
                    lngCell.textContent = loc.longitude;
                    
                    const timeCell = document.createElement('td');
                    const recordedDate = new Date(loc.created_at);
                    timeCell.textContent = recordedDate.toLocaleString();
                    
                    row.appendChild(idCell);
                    row.appendChild(latCell);
                    row.appendChild(lngCell);
                    row.appendChild(timeCell);
                    
                    historyTableBody.appendChild(row);
                });
                
                historyTableContainer.style.display = 'block';
            })
            .catch(error => {
                historyLoading.style.display = 'none';
                historyError.textContent = 'Error loading location history';
                historyError.style.display = 'block';
                console.error('Error:', error);
            });
    }
    
    // Event listeners
    getLocationBtn.addEventListener('click', getCurrentPosition);
    startTrackingBtn.addEventListener('click', startTracking);
    stopTrackingBtn.addEventListener('click', stopTracking);
    saveLocationBtn.addEventListener('click', saveLocation);
    
    // Load location history on page load
    loadLocationHistory();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
    });
});

// Declare L before using it. This assumes Leaflet is included via a <script> tag.
// If using a module bundler, you would import it instead (e.g., import L from 'leaflet';)
// For this exercise, we'll assume it's globally available.