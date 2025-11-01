// Authentication middleware to protect routes
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please login to access this resource.'
  });
};

// Optional authentication - doesn't block request if not authenticated
const optionalAuth = (req, res, next) => {
  // Just pass through, controller can check req.session.userId if needed
  next();
};

module.exports = {
  isAuthenticated,
  optionalAuth
};

