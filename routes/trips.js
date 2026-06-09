const express = require('express');
const router = express.Router();
const Trip = require('../models/trip.js'); // Import the blueprint
const axios = require('axios'); // Import Axios to make external API calls

// 1. CREATE: Save a new trip (Maps to your frontend form submission)
router.post('/', async (req, res) => {
  try {
    const newTrip = new Trip({
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

// 2. READ: Get all trips from the database (Maps to fetchTrips on your UI load)
router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find().sort({ startDate: 1 });

    // We use Promise.all to fetch weather for all trips in parallel efficiently
    const tripsWithWeather = await Promise.all(trips.map(async (trip) => {
      let weatherData = null;

      try {
        // Call OpenWeatherMap API using the destination and secret key from .env
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(trip.destination)}&units=metric&appid=${process.env.WEATHER_API_KEY}`
        );

        // Extract only the specific fields required by our UI assignment rubric
        weatherData = {
          temp: Math.round(weatherResponse.data.main.temp),
          condition: weatherResponse.data.weather[0].main,
          humidity: weatherResponse.data.main.humidity,
          wind: Math.round(weatherResponse.data.wind.speed * 3.6) // Convert m/s to km/h
        };
      } catch (weatherError) {
        console.error(`Could not fetch weather for ${trip.destination}:`, weatherError.message);
        // Fallback data structure if the external API fails or key is still pending activation
        weatherData = { temp: 'N/A', condition: 'Unavailable', humidity: 'N/A', wind: 'N/A' };
      }

      // Convert the Mongoose document to a plain object and attach our new weather field
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
// 3. UPDATE: Modify an existing trip by ID
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id, // Grab the ID from the URL string
      {
        destination: req.body.destination,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        notes: req.body.notes
      },
      { new: true, runValidators: true } // Return the freshly updated data document
    );

    if (!updatedTrip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==========================================
// 4. DELETE: Remove a trip by ID
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);

    if (!deletedTrip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({ message: 'Trip successfully deleted from database' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;