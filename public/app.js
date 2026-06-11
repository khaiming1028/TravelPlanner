
const API_URL = 'http://localhost:3000/api/trips';
const COUNTRIES_API_URL = 'https://countriesnow.space/api/v0.1/countries';

const fallbackCitiesByCountry = {
  'united-states': ['New York', 'Los Angeles', 'Chicago', 'San Francisco'],
  'canada': ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
  'united-kingdom': ['London', 'Manchester', 'Edinburgh', 'Liverpool'],
  'france': ['Paris', 'Nice', 'Lyon', 'Marseille'],
  'japan': ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima'],
};

let citiesByCountry = {};
let allCountries = [];
let countriesReady = false;

function updateCountryInputState(enabled, placeholder) {
  countryInput.disabled = !enabled;
  countryInput.placeholder = placeholder;
}

async function loadCountriesAndCities() {
  try {
    const response = await fetch(COUNTRIES_API_URL);
    const json = await response.json();

    if (!json?.data) {
      throw new Error('Countries API returned no data');
    }

    citiesByCountry = json.data.reduce((acc, item) => {
      const countryName = item.country.trim();
      const countryKey = countryName.toLowerCase().replace(/\s+/g, ' ').replace(/ /g, '-');
      acc[countryKey] = item.cities || [];
      return acc;
    }, {});
  } catch (error) {
    console.error('Error loading CountriesNow data:', error);
    citiesByCountry = fallbackCitiesByCountry;
  }

  allCountries = Object.keys(citiesByCountry)
    .map(key => ({
      key,
      name: key
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  countriesReady = true;
  updateCountryInputState(true, 'Country');
}

// Delay event wiring slightly until the DOM is available
window.addEventListener('DOMContentLoaded', () => {
  updateCountryInputState(false, 'Loading countries...');
  loadCountriesAndCities();
});

// DOM Element Selectors
const tripForm = document.getElementById('trip-form');
const destinationInput = document.getElementById('destination');
const countryInput = document.getElementById('countryInput');
const cityInput = document.getElementById('cityInput');
const countryDropdown = document.getElementById('countryDropdown');
const cityDropdown = document.getElementById('cityDropdown');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const notesInput = document.getElementById('notes');
const tripsContainer = document.getElementById('trips-container');
const emptyState = document.getElementById('empty-state');
const submitBtn = document.getElementById('submit-btn');
const formTitleLabel = document.getElementById('form-title-label');
const formMainTitle = document.getElementById('form-main-title');

function renderDropdown(dropdown, values) {
  dropdown.innerHTML = '';
  if (!values.length) {
    dropdown.classList.add('d-none');
    return;
  }
  values.forEach(value => {
    const item = document.createElement('div');
    item.className = 'search-option';
    item.textContent = value;
    dropdown.appendChild(item);
  });
  dropdown.classList.remove('d-none');
}

function filterCountries(query) {
  if (!countriesReady) return [];
  const normalized = query.trim().toLowerCase();
  return allCountries
    .filter(country => country.name.toLowerCase().includes(normalized))
    .map(country => country.name);
}

function getCountryKey(name) {
  if (!countriesReady) return null;
  const lower = name.trim().toLowerCase();
  return allCountries.find(country => country.name.toLowerCase() === lower)?.key || null;
}

function filterCities(countryKey, query) {
  if (!countriesReady) return [];
  const cities = citiesByCountry[countryKey] || [];
  const normalized = query.trim().toLowerCase();
  return cities.filter(city => city.toLowerCase().includes(normalized));
}

function updateHiddenDestination() {
  const countryKey = getCountryKey(countryInput.value);
  const countryName = allCountries.find(c => c.key === countryKey)?.name || countryInput.value.trim();
  const cityName = cityInput.value.trim();

  if (cityName && countryName) {
    destinationInput.value = `${cityName}, ${countryName}`;
  } else if (cityName) {
    destinationInput.value = cityName;
  } else if (countryName) {
    destinationInput.value = countryName;
  } else {
    destinationInput.value = '';
  }
}

countryInput.addEventListener('input', () => {
  const matches = filterCountries(countryInput.value);
  renderDropdown(countryDropdown, matches);
  const selectedCountryKey = getCountryKey(countryInput.value);

  if (selectedCountryKey) {
    cityInput.disabled = false;
  } else {
    cityInput.disabled = true;
    cityInput.value = '';
    cityDropdown.classList.add('d-none');
  }
  updateHiddenDestination();
});

countryInput.addEventListener('focus', () => {
  if (!countriesReady) {
    renderDropdown(countryDropdown, ['Loading countries...']);
    return;
  }
  const matches = filterCountries(countryInput.value);
  renderDropdown(countryDropdown, matches);
});

countryInput.addEventListener('focus', () => {
  const matches = filterCountries(countryInput.value);
  renderDropdown(countryDropdown, matches);
});

countryDropdown.addEventListener('click', event => {
  if (!event.target.classList.contains('search-option')) return;
  countryInput.value = event.target.textContent;
  countryDropdown.classList.add('d-none');
  cityInput.disabled = false;
  cityInput.value = '';
  cityInput.focus();
  updateHiddenDestination();
});

cityInput.addEventListener('input', () => {
  const countryKey = getCountryKey(countryInput.value);
  const matches = countryKey ? filterCities(countryKey, cityInput.value) : [];
  renderDropdown(cityDropdown, matches);
  updateHiddenDestination();
});

cityInput.addEventListener('focus', () => {
  const countryKey = getCountryKey(countryInput.value);
  const matches = countryKey ? filterCities(countryKey, cityInput.value) : [];
  renderDropdown(cityDropdown, matches);
});

cityDropdown.addEventListener('click', event => {
  if (!event.target.classList.contains('search-option')) return;
  cityInput.value = event.target.textContent;
  cityDropdown.classList.add('d-none');
  updateHiddenDestination();
});

document.addEventListener('click', event => {
  if (!event.target.closest('#countryInput') && !event.target.closest('#countryDropdown')) {
    countryDropdown.classList.add('d-none');
  }
  if (!event.target.closest('#cityInput') && !event.target.closest('#cityDropdown')) {
    cityDropdown.classList.add('d-none');
  }
});

const token = sessionStorage.getItem('token');
const userName = sessionStorage.getItem('userName');

if (!token) {
  window.location.href = 'login.html';  // redirect if not logged in
}

document.getElementById('welcome-msg').textContent = `Welcome, ${userName}!`;

// Application State Management variables
let allTrips = [];
let editingTripId = null;
// Map Management variables
let map;
let markers = [];
let geocoder;
// ==========================================
// 1. READ ACTION: Fetch and Display All Trips
// ==========================================
async function fetchTrips() {
  try {
    const response = await fetch(API_URL);
    allTrips = await response.json();
    renderTrips();
  } catch (error) {
    console.error('Error fetching trips:', error);
  }
}

function renderTrips() {
  tripsContainer.innerHTML = '';

  if (allTrips.length === 0) {
    emptyState.classList.remove('d-none');
    updateMapMarkers(); // Update map to show no pins
    return;
  }
  
  emptyState.classList.add('d-none');

  allTrips.forEach(trip => {
    // Format dates to look nice on screen
    const start = new Date(trip.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const end = new Date(trip.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const tripCard = document.createElement('div');
    tripCard.className = 'trip-card mb-3';
    tripCard.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="destination">${trip.destination}</div>
          <div class="dates mt-1">
            <i class="bi bi-calendar3 me-1"></i>${start} – ${end}
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-edit" onclick="prepareEdit('${trip._id}')">
            <i class="bi bi-pencil me-1"></i>Edit
          </button>
          <button class="btn btn-outline-danger btn-delete" onclick="deleteTrip('${trip._id}')">
            <i class="bi bi-trash me-1"></i>Delete
          </button>
        </div>
      </div>

      <div class="notes">
        "${trip.notes || 'No notes added for this journey.'}"
      </div>

      <div class="weather-badge mt-3 d-flex align-items-center gap-3">
  <div>
    <div class="section-label mb-0">Live Weather</div>
    <div class="temp">${trip.weather ? trip.weather.temp + '°C' : 'N/A'}</div>
  </div>
  <div class="vr"></div>
  <div class="small">
    <div><strong>Condition:</strong> ${trip.weather ? trip.weather.condition : 'Unknown'}</div>
    <div><strong>Humidity:</strong> ${trip.weather ? trip.weather.humidity + '%' : 'N/A'}</div>
    <div><strong>Wind:</strong> ${trip.weather ? trip.weather.wind + ' km/h' : 'N/A'}</div>
  </div>
</div>
    `;
    tripsContainer.appendChild(tripCard);
  });
  updateMapMarkers();
}

// ==========================================
// 2. CREATE & UPDATE ACTIONS: Form Submission Handler
// ==========================================
tripForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Stop page from refreshing!
  updateHiddenDestination();

  const tripData = {
    destination: destinationInput.value,
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    notes: notesInput.value
  };

  try {
    if (editingTripId) {
      // Execute UPDATE (PUT) operation
      const response = await fetch(`${API_URL}/${editingTripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      
      if (response.ok) resetForm();
    } else {
      // Execute CREATE (POST) operation
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
    }

    // Refresh display values
    fetchTrips();
    tripForm.reset();
  } catch (error) {
    console.error('Error saving trip:', error);
  }
});

// ==========================================
// 3. DELETE ACTION: Remove a Record
// ==========================================
async function deleteTrip(id) {
  if (confirm('Are you sure you want to delete this trip itinerary?')) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchTrips(); // Refresh UI feed lists
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  }
}

// ==========================================
// 4. PREPARE EDIT MODULE: Populate inputs back to form
// ==========================================
function prepareEdit(id) {
  const targetTrip = allTrips.find(t => t._id === id);
  if (!targetTrip) return;

  editingTripId = id;

  // Fill HTML input values with stored database records
  destinationInput.value = targetTrip.destination;
  if (targetTrip.destination.includes(',')) {
    const [city, country] = targetTrip.destination.split(',').map(part => part.trim());
    countryInput.value = country || '';
    cityInput.disabled = !country;
    cityInput.value = city || '';
    updateHiddenDestination();
  } else {
    countryInput.value = '';
    cityInput.disabled = true;
    cityInput.value = targetTrip.destination;
    updateHiddenDestination();
  }
  // Slice to YYYY-MM-DD so standard HTML calendar pickers can read it
  startDateInput.value = new Date(targetTrip.startDate).toISOString().split('T')[0];
  endDateInput.value = new Date(targetTrip.endDate).toISOString().split('T')[0];
  notesInput.value = targetTrip.notes || '';

  // Metamorphose form look over to Update Mode styling
  formTitleLabel.innerText = "Modify Current Itinerary";
  formMainTitle.innerText = "Edit Your Details";
  submitBtn.className = "btn w-100 fw-medium";
  submitBtn.style.backgroundColor = "#30404F";
  submitBtn.style.color = "#fff";
  submitBtn.style.borderRadius = "0.75rem";
  submitBtn.onmouseenter = () => submitBtn.style.backgroundColor = "#1A2B3C";
  submitBtn.onmouseleave = () => submitBtn.style.backgroundColor = "#30404F";
  submitBtn.innerHTML = `Save Changes`;

  // Wrap save + cancel in a flex row
  if (!document.getElementById('cancel-btn')) {
    // Wrap the submit button in a div
    const btnRow = document.createElement('div');
    btnRow.id = 'btn-row';
    btnRow.className = 'd-flex gap-2 mt-2';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'cancel-btn';
    cancelBtn.className = 'btn btn-outline-secondary w-100 fw-medium';
    cancelBtn.style.borderRadius = "0.75rem";
    cancelBtn.innerHTML = `Cancel`;
    cancelBtn.onclick = resetForm;

    submitBtn.classList.remove('mt-2');
    submitBtn.parentNode.insertBefore(btnRow, submitBtn);
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(submitBtn);

  }
}

function resetForm() {
  editingTripId = null;
  formTitleLabel.innerText = "Add a New Trip";
  formMainTitle.innerText = "Plan Your Journey";

  // Move submit button back out of the row
  const btnRow = document.getElementById('btn-row');
  if (btnRow) {
    btnRow.parentNode.insertBefore(submitBtn, btnRow);
    btnRow.remove();
  }

  submitBtn.className = "btn btn-add-trip fw-medium";
  submitBtn.style.backgroundColor = "";
  submitBtn.style.color = "";
  submitBtn.style.borderRadius = "";
  submitBtn.innerHTML = `Add Trip to Itinerary`;
  tripForm.reset();
  countryInput.value = '';
  cityInput.value = '';
  cityInput.disabled = true;
  destinationInput.value = '';
  countryDropdown.classList.add('d-none');
  cityDropdown.classList.add('d-none');
}

// ==========================================
// 5. GOOGLE MAPS INTEGRATION
// ==========================================
function initMap() {
  // Initialize the map centered on a global view
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20, lng: 0 },
    zoom: 2,
    mapTypeControl: false,
    streetViewControl: false
  });
  
  geocoder = new google.maps.Geocoder();
  document.getElementById("map").style.display = "block"; // Reveal map once loaded

  // If trips already loaded from the database, plot them immediately
  if (allTrips.length > 0) {
    updateMapMarkers();
  }
}

function updateMapMarkers() {
  // Safety check to ensure Google Maps has finished loading
  if (!map || !geocoder) return;

  // 1. Clear existing markers from the map before re-rendering
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  const bounds = new google.maps.LatLngBounds();
  let hasValidMarkers = false;

  // 2. Loop through your trips and Geocode the destination strings
  allTrips.forEach(trip => {
    geocoder.geocode({ address: trip.destination }, (results, status) => {
      if (status === "OK") {
        const location = results[0].geometry.location;
        
        // Create the pin
        const marker = new google.maps.Marker({
          map: map,
          position: location,
          title: trip.destination,
          animation: google.maps.Animation.DROP
        });
        
        markers.push(marker);
        bounds.extend(location);
        hasValidMarkers = true;

        // Auto-zoom and center the map to fit all trip locations perfectly
        if (hasValidMarkers) {
          map.fitBounds(bounds);
          // Prevent zooming in too aggressively if there is only one trip
          if (map.getZoom() > 10) {
            map.setZoom(10);
          }
        }
      } else {
        console.warn(`Geocode failed for ${trip.destination} - Status: ${status}`);
      }
    });
  });
}

// ==========================================
// 6. DYNAMIC SCRIPT INJECTION
// ==========================================
async function loadGoogleMapsScript() {
  try {
    // 1. Fetch the API key securely from your backend
    const response = await fetch('http://localhost:3000/api/config/maps');
    const data = await response.json();

    // 2. Create the HTML script tag dynamically
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;

    // 3. Inject it into the webpage
    document.body.appendChild(script);
  } catch (error) {
    console.error('Error loading Google Maps API key:', error);
  }
}

function logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userName');
  window.location.href = 'login.html';
}

// Automatically seed display metrics on initial webpage launch
document.addEventListener('DOMContentLoaded', () => {
  fetchTrips();
  loadGoogleMapsScript(); // Ask backend for the key and load the map!
});

