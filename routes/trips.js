const express = require('express');
const router = express.Router();
const Trip = require('../models/trip.js'); // Import the blueprint

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
    const trips = await Trip.find().sort({ startDate: 1 }); // Sort by closest date first
    res.json(trips);
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