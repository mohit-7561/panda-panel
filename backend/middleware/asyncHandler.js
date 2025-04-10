/**
 * Async handler middleware to avoid try-catch in controllers
 * @param {Function} fn - The controller function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;