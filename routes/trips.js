// routes/trips.js
const express = require('express');
const router = express.Router();
const Trip = require('../models/trip.js'); // Import the blueprint
const axios = require('axios'); // Import Axios to make external API calls
const protect = require('../middleware/authMiddleware'); // Import your token protector gate!

// 1. CREATE: Save a new trip FOR THE LOGGED-IN USER ONLY
router.post('/', protect, async (req, res) => {
  try {
    const newTrip = new Trip({
      user: req.user.id, // Attached automatically by our protect middleware gate!
      destination: req.body.destination,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      notes: req.body.notes
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 2. READ: Get all trips belonging EXCLUSIVELY to this user
router.get('/', protect, async (req, res) => {
  try {
    // Only query database documents matching this user ID
    const trips = await Trip.find({ user: req.user.id }).sort({ startDate: 1 });

    const tripsWithWeather = await Promise.all(trips.map(async (trip) => {
      let weatherData = null;

      try {
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(trip.destination)}&units=metric&appid=${process.env.WEATHER_API_KEY}`
        );

        weatherData = {
          temp: Math.round(weatherResponse.data.main.temp),
          condition: weatherResponse.data.weather[0].main,
          humidity: weatherResponse.data.main.humidity,
          wind: Math.round(weatherResponse.data.wind.speed * 3.6)
        };
      } catch (weatherError) {
        console.error(`Could not fetch weather for ${trip.destination}:`, weatherError.message);
        weatherData = { temp: 'N/A', condition: 'Unavailable', humidity: 'N/A', wind: 'N/A' };
      }

      return {
        ...trip.toObject(),
        weather: weatherData
      };
    }));

    res.json(tripsWithWeather);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 3. UPDATE: Modify an existing trip (With Ownership Check)
// ==========================================
router.put('/:id', protect, async (req, res) => {
  try {
    // Find the trip first to verify ownership
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Block the action if this trip doesn't belong to the logged-in user
    if (trip.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this record.' });
    }

    // Apply updates safely
    trip.destination = req.body.destination;
    trip.startDate = req.body.startDate;
    trip.endDate = req.body.endDate;
    trip.notes = req.body.notes;

    const updatedTrip = await trip.save();
    res.json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==========================================
// 4. DELETE: Remove a trip (With Ownership Check)
// ==========================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Block deletion if this trip doesn't belong to the logged-in user
    if (trip.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this record.' });
    }

    await trip.deleteOne();
    res.json({ message: 'Trip successfully deleted from database' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;