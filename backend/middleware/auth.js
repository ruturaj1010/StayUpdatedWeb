require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    console.log('Auth middleware - token present:', !!token);
    console.log('Auth middleware - request path:', req.path);

    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware - token decoded:', { userId: decoded.userId, role: decoded.role });

    // Get user info from database to ensure user still exists
    const [users] = await db.execute(
      'SELECT id, email, name, address, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Add user info to request object
    req.user = users[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Middleware to check if user has specific role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('Role authorization - user:', req.user?.id, 'role:', req.user?.role, 'required roles:', roles);
    
    if (!req.user) {
      console.log('Role authorization - No user found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      console.log('Role authorization - Insufficient permissions:', { userRole, required: roles });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    console.log('Role authorization - Access granted');
    next();
  };
};

// Alternative function name for backward compatibility
const requireRole = authorizeRoles;

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireRole
};
