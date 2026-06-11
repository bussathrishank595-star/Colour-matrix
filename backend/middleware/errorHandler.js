// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = `Resource not found with id: ${err.value}`;
    statusCode = 404;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 400;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token, please login again';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired, please login again';
    statusCode = 401;
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack,
      error: err,
    });
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
