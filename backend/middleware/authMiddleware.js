const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'abhii_karke_deta_hu_super_secret_jwt_key_2026_modern_analytics';

/**
 * Authentication middleware that verifies the JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

/**
 * Optional authentication: attaches user if token is present, continues otherwise
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      // Ignore invalid optional token
    }
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET,
};
