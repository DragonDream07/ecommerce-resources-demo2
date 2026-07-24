const crypto = require('crypto');

const TOKEN_BYTE_LENGTH = 32;

/**
 * Generate a cryptographically secure random reset token.
 *
 * @returns {{ rawToken: string, hashedToken: string }}
 *   rawToken   - Hex string to send to the user (never stored)
 *   hashedToken - SHA-256 hash to persist in the database
 */
const generateResetToken = () => {
  const rawToken = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  return { rawToken, hashedToken };
};

/**
 * Hash an incoming raw token for safe comparison against the stored hash.
 *
 * @param {string} rawToken - The token received from the user
 * @returns {string} SHA-256 hex digest
 */
const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

/**
 * Verify a raw token against a stored hash using a timing-safe comparison.
 *
 * @param {string} rawToken    - Token supplied by the user
 * @param {string} storedHash  - Hash previously persisted in the database
 * @returns {boolean}
 */
const verifyResetToken = (rawToken, storedHash) => {
  const incomingHash = hashToken(rawToken);

  // Ensure both buffers are the same length before comparing
  if (incomingHash.length !== storedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(incomingHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
};

module.exports = { generateResetToken, hashToken, verifyResetToken };
