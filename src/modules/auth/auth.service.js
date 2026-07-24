const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const RESET_TOKEN_EXPIRES_MINUTES = 60;

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function findUserByEmail(email) {
  const result = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return result.rows[0] || null;
}

async function register({ email, password, firstName, lastName, role }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error('A user with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = uuidv4();
  const userRole = role || 'user';

  const result = await db.query(
    'INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_guest, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW()) RETURNING id, email, first_name, last_name, role, created_at',
    [id, email, passwordHash, firstName || null, lastName || null, userRole]
  );

  const user = result.rows[0];
  const token = generateToken({ sub: user.id, email: user.email, role: user.role });

  return { user, token };
}

async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({ sub: user.id, email: user.email, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
  };
}

async function logout(token) {
  // Token invalidation via blocklist if available; otherwise stateless logout is handled client-side.
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const expiresAt = new Date(decoded.exp * 1000);
      await db.query(
        'INSERT INTO token_blocklist (token, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [token, expiresAt]
      );
    } catch (_) {
      // If token is invalid or table does not exist, silently continue.
    }
  }
}

async function forgotPassword({ email }) {
  const user = await findUserByEmail(email);
  if (!user) {
    // Return silently to avoid user enumeration.
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

  await db.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used, created_at) VALUES ($1, $2, $3, false, NOW()) ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at, used = false, created_at = NOW()',
    [user.id, resetTokenHash, expiresAt]
  );

  // Email dispatch is handled by the notification service.
  // The plain resetToken would be sent via email; here we expose it only for internal use.
  return { resetToken };
}

async function resetPassword({ token, password }) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const result = await db.query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used = false AND expires_at > NOW() LIMIT 1',
    [tokenHash]
  );

  const resetRecord = result.rows[0];
  if (!resetRecord) {
    const error = new Error('Reset token is invalid or has expired.');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
    passwordHash,
    resetRecord.user_id,
  ]);

  await db.query('UPDATE password_reset_tokens SET used = true WHERE token_hash = $1', [tokenHash]);
}

async function guestRegister({ email, firstName, lastName }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error('A user with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const id = uuidv4();
  const guestPasswordHash = await bcrypt.hash(uuidv4(), SALT_ROUNDS);

  const result = await db.query(
    'INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_guest, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW()) RETURNING id, email, first_name, last_name, role, is_guest, created_at',
    [id, email, guestPasswordHash, firstName || null, lastName || null, 'guest']
  );

  const user = result.rows[0];
  const token = generateToken({ sub: user.id, email: user.email, role: user.role, isGuest: true });

  return { user, token };
}

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  guestRegister,
};
