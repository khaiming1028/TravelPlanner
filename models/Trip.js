// models/Trip.js
const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({

    user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Links directly back to your User collection model
  },
  
  destination: {
    type: String,
    required: true
    
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

// Mongoose turns the singular 'Trip' into a plural lowercase collection 'trips' automatically!
module.exports = mongoose.model('Trip', TripSchema);