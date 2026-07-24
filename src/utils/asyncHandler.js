/**
 * Wraps an async Express route handler and forwards any errors
 * to the next() error handler, preventing unhandled promise rejections.
 *
 * @param {Function} fn - Async route handler function (req, res, next)
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
