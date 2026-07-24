'use strict';

/**
 * Centralised Express error handler.
 * Must be registered as the last middleware in the application.
 *
 * Produces structured JSON error responses.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Determine HTTP status code
  const statusCode =
    typeof err.statusCode === 'number'
      ? err.statusCode
      : typeof err.status === 'number'
      ? err.status
      : 500;

  // Build response body
  const body = {
    status: statusCode,
    error: err.name || httpStatusText(statusCode),
    message: err.message || 'An unexpected error occurred.',
  };

  // Attach validation details when present
  if (err.details) {
    body.details = err.details;
  }

  // Expose stack trace only in development
  if (isDevelopment && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

/**
 * Maps a numeric HTTP status code to a human-readable text.
 *
 * @param {number} code
 * @returns {string}
 */
function httpStatusText(code) {
  const texts = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return texts[code] || 'Internal Server Error';
}

module.exports = errorHandler;
