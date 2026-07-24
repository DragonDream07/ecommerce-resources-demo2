const db = require('../../db');
const bcrypt = require('bcrypt');
const { NotFoundError, UnauthorizedError, ConflictError } = require('../../utils/errors');

const SALT_ROUNDS = 12;

/**
 * Retrieve a single user by ID.
 * Throws NotFoundError if the user does not exist.
 */
async function getUserById(userId) {
  const { rows } = await db.query(
    `SELECT id, email, first_name, last_name, role, phone, is_active, created_at, updated_at
     FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  if (!rows.length) {
    throw new NotFoundError('User not found.');
  }
  return rows[0];
}

/**
 * Retrieve a paginated list of all users.
 */
async function getAllUsers({ page = 1, limit = 20, search } = {}) {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE deleted_at IS NULL';

  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND (email ILIKE $${params.length} OR first_name ILIKE $${params.length} OR last_name ILIKE $${params.length})`;
  }

  params.push(limit, offset);

  const dataQuery = `
    SELECT id, email, first_name, last_name, role, phone, is_active, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const countParams = search ? [params[0]] : [];
  const countQuery = `SELECT COUNT(*) FROM users ${whereClause.replace(`$${params.length - 1}`, search ? '$1' : '')}`;

  const [dataResult, countResult] = await Promise.all([
    db.query(dataQuery, params),
    db.query(
      `SELECT COUNT(*) FROM users ${search ? `WHERE deleted_at IS NULL AND (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)` : 'WHERE deleted_at IS NULL'}`,
      search ? [`%${search}%`] : []
    ),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update a user's profile fields.
 * Supports role assignment for admin operations.
 */
async function updateUser(userId, payload) {
  const allowedFields = ['first_name', 'last_name', 'phone', 'role', 'is_active'];
  const setClauses = [];
  const values = [];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      values.push(payload[field]);
      setClauses.push(`${field} = $${values.length}`);
    }
  }

  if (!setClauses.length) {
    return getUserById(userId);
  }

  values.push(userId);
  const { rows } = await db.query(
    `UPDATE users
     SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length} AND deleted_at IS NULL
     RETURNING id, email, first_name, last_name, role, phone, is_active, created_at, updated_at`,
    values
  );

  if (!rows.length) {
    throw new NotFoundError('User not found.');
  }

  return rows[0];
}

/**
 * Change a user's password after verifying the current password.
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  const { rows } = await db.query(
    'SELECT id, password_hash FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );

  if (!rows.length) {
    throw new NotFoundError('User not found.');
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect.');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );
}

/**
 * Soft-delete a user by setting deleted_at.
 */
async function deleteUser(userId) {
  const { rows } = await db.query(
    `UPDATE users
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [userId]
  );

  if (!rows.length) {
    throw new NotFoundError('User not found.');
  }
}

module.exports = {
  getUserById,
  getAllUsers,
  updateUser,
  changePassword,
  deleteUser,
};
