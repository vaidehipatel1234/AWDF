const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware (Practical 7)
 * Verifies JWT token supplied in Authorization header (Bearer <token>)
 * Attaches decoded payload (user id, etc.) to req.user
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header is missing. Access denied.'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format. Expected: Bearer <token>'
      });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token is missing. Access denied.'
      });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_for_tests';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token. Verification failed.'
    });
  }
};

module.exports = authMiddleware;
