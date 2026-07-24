const db = require('../../config/db');

async function listAddresses(userId) {
  const result = await db.query(
    `SELECT * FROM addresses WHERE user_id = $1 AND deleted_at IS NULL ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getAddress(userId, addressId) {
  const result = await db.query(
    `SELECT * FROM addresses WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [addressId, userId]
  );
  return result.rows[0] || null;
}

async function checkServiceability(pinCode) {
  const result = await db.query(
    `SELECT id FROM serviceable_pin_codes WHERE pin_code = $1 AND is_active = true`,
    [pinCode]
  );
  return result.rows.length > 0;
}

async function setAllNonDefault(userId, client) {
  await client.query(
    `UPDATE addresses SET is_default = false WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId]
  );
}

async function createAddress(userId, payload) {
  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pin_code,
    country,
    is_default,
  } = payload;

  const serviceable = await checkServiceability(pin_code);
  if (!serviceable) {
    const error = new Error('This pin code is not serviceable.');
    error.status = 422;
    throw error;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    if (is_default) {
      await setAllNonDefault(userId, client);
    } else {
      const existingResult = await client.query(
        `SELECT id FROM addresses WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      );
      if (existingResult.rows.length === 0) {
        payload.is_default = true;
      }
    }

    const result = await client.query(
      `INSERT INTO addresses
        (user_id, full_name, phone, address_line1, address_line2, city, state, pin_code, country, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [
        userId,
        full_name,
        phone,
        address_line1,
        address_line2 || null,
        city,
        state,
        pin_code,
        country || 'India',
        payload.is_default || false,
      ]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateAddress(userId, addressId, payload) {
  const existing = await getAddress(userId, addressId);
  if (!existing) return null;

  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pin_code,
    country,
    is_default,
  } = payload;

  if (pin_code && pin_code !== existing.pin_code) {
    const serviceable = await checkServiceability(pin_code);
    if (!serviceable) {
      const error = new Error('This pin code is not serviceable.');
      error.status = 422;
      throw error;
    }
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    if (is_default) {
      await setAllNonDefault(userId, client);
    }

    const result = await client.query(
      `UPDATE addresses SET
        full_name      = COALESCE($1, full_name),
        phone          = COALESCE($2, phone),
        address_line1  = COALESCE($3, address_line1),
        address_line2  = COALESCE($4, address_line2),
        city           = COALESCE($5, city),
        state          = COALESCE($6, state),
        pin_code       = COALESCE($7, pin_code),
        country        = COALESCE($8, country),
        is_default     = COALESCE($9, is_default),
        updated_at     = NOW()
       WHERE id = $10 AND user_id = $11 AND deleted_at IS NULL
       RETURNING *`,
      [
        full_name || null,
        phone || null,
        address_line1 || null,
        address_line2 !== undefined ? address_line2 : null,
        city || null,
        state || null,
        pin_code || null,
        country || null,
        is_default !== undefined ? is_default : null,
        addressId,
        userId,
      ]
    );

    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteAddress(userId, addressId) {
  const existing = await getAddress(userId, addressId);
  if (!existing) return null;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE addresses SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [addressId, userId]
    );

    if (existing.is_default) {
      const nextResult = await client.query(
        `SELECT id FROM addresses WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      if (nextResult.rows.length > 0) {
        await client.query(
          `UPDATE addresses SET is_default = true WHERE id = $1`,
          [nextResult.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  checkServiceability,
};
