const db = require('../../config/database');

/**
 * Retrieve all promo codes with optional pagination and status filter.
 */
async function getAllPromoCodes({ page = 1, limit = 20, status } = {}) {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM promo_codes';
  const params = [];

  if (status) {
    params.push(status);
    query += ` WHERE status = $${params.length}`;
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const countQuery = status
    ? 'SELECT COUNT(*) FROM promo_codes WHERE status = $1'
    : 'SELECT COUNT(*) FROM promo_codes';
  const countParams = status ? [status] : [];

  const [{ rows }, { rows: countRows }] = await Promise.all([
    db.query(query, params),
    db.query(countQuery, countParams),
  ]);

  return {
    items: rows,
    total: Number(countRows[0].count),
    page,
    limit,
  };
}

/**
 * Retrieve a single promo code by its ID.
 */
async function getPromoCodeById(id) {
  const { rows } = await db.query('SELECT * FROM promo_codes WHERE id = $1', [id]);
  return rows[0] || null;
}

/**
 * Retrieve a promo code record by its code string.
 */
async function getPromoCodeByCode(code) {
  const { rows } = await db.query(
    'SELECT * FROM promo_codes WHERE code = $1',
    [code.toUpperCase()]
  );
  return rows[0] || null;
}

/**
 * Create a new promo code.
 */
async function createPromoCode(payload) {
  const {
    code,
    discount_type,
    discount_value,
    min_order_total = null,
    max_uses = null,
    max_uses_per_user = null,
    valid_from = null,
    valid_until = null,
    status = 'active',
  } = payload;

  const { rows } = await db.query(
    `INSERT INTO promo_codes
       (code, discount_type, discount_value, min_order_total, max_uses, max_uses_per_user, valid_from, valid_until, status, usage_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
     RETURNING *`,
    [
      code.toUpperCase(),
      discount_type,
      discount_value,
      min_order_total,
      max_uses,
      max_uses_per_user,
      valid_from,
      valid_until,
      status,
    ]
  );
  return rows[0];
}

/**
 * Update an existing promo code by ID.
 */
async function updatePromoCode(id, payload) {
  const existing = await getPromoCodeById(id);
  if (!existing) return null;

  const {
    code = existing.code,
    discount_type = existing.discount_type,
    discount_value = existing.discount_value,
    min_order_total = existing.min_order_total,
    max_uses = existing.max_uses,
    max_uses_per_user = existing.max_uses_per_user,
    valid_from = existing.valid_from,
    valid_until = existing.valid_until,
    status = existing.status,
  } = payload;

  const { rows } = await db.query(
    `UPDATE promo_codes
     SET code = $1,
         discount_type = $2,
         discount_value = $3,
         min_order_total = $4,
         max_uses = $5,
         max_uses_per_user = $6,
         valid_from = $7,
         valid_until = $8,
         status = $9,
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [
      code.toUpperCase(),
      discount_type,
      discount_value,
      min_order_total,
      max_uses,
      max_uses_per_user,
      valid_from,
      valid_until,
      status,
      id,
    ]
  );
  return rows[0] || null;
}

/**
 * Delete a promo code by ID.
 */
async function deletePromoCode(id) {
  const { rows } = await db.query(
    'DELETE FROM promo_codes WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0] || null;
}

/**
 * Get the number of times a specific user has used a promo code.
 */
async function getUserUsageCount(promoCodeId, userId) {
  const { rows } = await db.query(
    'SELECT COUNT(*) FROM promo_code_usages WHERE promo_code_id = $1 AND user_id = $2',
    [promoCodeId, userId]
  );
  return Number(rows[0].count);
}

/**
 * Validate a promo code against eligibility rules and calculate the discount.
 */
async function validateAndCalculateDiscount(code, userId, orderTotal) {
  const promo = await getPromoCodeByCode(code);

  if (!promo) {
    const err = new Error('Promo code is invalid.');
    err.statusCode = 400;
    throw err;
  }

  if (promo.status !== 'active') {
    const err = new Error('Promo code is no longer active.');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();

  if (promo.valid_from && new Date(promo.valid_from) > now) {
    const err = new Error('Promo code is not yet valid.');
    err.statusCode = 400;
    throw err;
  }

  if (promo.valid_until && new Date(promo.valid_until) < now) {
    const err = new Error('Promo code has expired.');
    err.statusCode = 400;
    throw err;
  }

  if (promo.max_uses !== null && promo.usage_count >= promo.max_uses) {
    const err = new Error('Promo code has reached its maximum usage limit.');
    err.statusCode = 400;
    throw err;
  }

  if (promo.min_order_total !== null && orderTotal < Number(promo.min_order_total)) {
    const err = new Error(
      `Promo code requires a minimum order total of ${promo.min_order_total}.`
    );
    err.statusCode = 400;
    throw err;
  }

  if (userId && promo.max_uses_per_user !== null) {
    const userCount = await getUserUsageCount(promo.id, userId);
    if (userCount >= promo.max_uses_per_user) {
      const err = new Error('You have already used this promo code the maximum number of times.');
      err.statusCode = 400;
      throw err;
    }
  }

  const discountAmount = calculateDiscount(promo, orderTotal);
  const finalTotal = Math.max(0, orderTotal - discountAmount);

  return {
    promoCodeId: promo.id,
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: Number(promo.discount_value),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    originalTotal: orderTotal,
    finalTotal: parseFloat(finalTotal.toFixed(2)),
  };
}

/**
 * Calculate the discount amount based on the promo type.
 */
function calculateDiscount(promo, orderTotal) {
  if (promo.discount_type === 'percentage') {
    return (orderTotal * Number(promo.discount_value)) / 100;
  }
  if (promo.discount_type === 'fixed') {
    return Math.min(Number(promo.discount_value), orderTotal);
  }
  return 0;
}

/**
 * Record a promo code usage for a user and increment usage_count.
 */
async function recordUsage(promoCodeId, userId, orderId) {
  await db.query(
    `INSERT INTO promo_code_usages (promo_code_id, user_id, order_id, used_at)
     VALUES ($1, $2, $3, NOW())`,
    [promoCodeId, userId, orderId]
  );
  await db.query(
    'UPDATE promo_codes SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1',
    [promoCodeId]
  );
}

module.exports = {
  getAllPromoCodes,
  getPromoCodeById,
  getPromoCodeByCode,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  validateAndCalculateDiscount,
  recordUsage,
};
