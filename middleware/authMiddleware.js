// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Split "Bearer <token_string>" to get just the token
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token using the secret key in your .env file
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user's information directly to the request object
      req.user = decoded;

      // Pass control over to the route handler
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token found.' });
  }
};

module.exports = protect;