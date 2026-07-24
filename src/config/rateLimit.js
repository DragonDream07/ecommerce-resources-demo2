'use strict';

const config = require('./index');

/**
 * Rate-limit constants derived from the central config.
 *
 * RATE_LIMIT_WINDOW_MS  – sliding window duration in milliseconds.
 * RATE_LIMIT_MAX        – maximum number of requests allowed per window per IP.
 */
const RATE_LIMIT_WINDOW_MS = config.rateLimit.windowMs;
const RATE_LIMIT_MAX = config.rateLimit.max;

module.exports = {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
};
