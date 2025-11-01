// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference to related resource'
    });
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum limit'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + err.message
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  notFound
};

