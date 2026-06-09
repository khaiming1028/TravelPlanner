const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use.' });

    // Hash password before saving
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ message: 'Account created successfully.' });

  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    // Compare entered password with hashed password in DB
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, name: user.name });

  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};