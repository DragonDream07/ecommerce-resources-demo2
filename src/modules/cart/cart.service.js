const db = require('../../config/database');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatCart = (cart, items) => ({
  id: cart.id,
  userId: cart.user_id,
  guestId: cart.guest_id,
  status: cart.status,
  promoCode: cart.promo_code,
  discountAmount: cart.discount_amount,
  discountType: cart.discount_type,
  subtotal: cart.subtotal,
  total: cart.total,
  createdAt: cart.created_at,
  updatedAt: cart.updated_at,
  items: items.map((item) => ({
    id: item.id,
    cartId: item.cart_id,
    productId: item.product_id,
    variantId: item.variant_id,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    lineTotal: item.line_total,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  })),
});

const recalculateCart = async (cartId, client) => {
  const itemsResult = await client.query(
    'SELECT * FROM cart_items WHERE cart_id = $1',
    [cartId]
  );
  const items = itemsResult.rows;

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.line_total), 0);

  const cartResult = await client.query(
    'SELECT * FROM carts WHERE id = $1',
    [cartId]
  );
  const cart = cartResult.rows[0];

  let discountAmount = parseFloat(cart.discount_amount) || 0;
  let total = subtotal - discountAmount;
  if (total < 0) total = 0;

  await client.query(
    'UPDATE carts SET subtotal = $1, total = $2, updated_at = NOW() WHERE id = $3',
    [subtotal.toFixed(2), total.toFixed(2), cartId]
  );

  return { cart: { ...cart, subtotal: subtotal.toFixed(2), total: total.toFixed(2) }, items };
};

const createCart = async ({ userId, guestId }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    if (userId && guestId) {
      const guestCartResult = await client.query(
        "SELECT * FROM carts WHERE guest_id = $1 AND status = 'active' LIMIT 1",
        [guestId]
      );
      if (guestCartResult.rows.length > 0) {
        const guestCart = guestCartResult.rows[0];
        const mergedCart = await mergeGuestCartIntoUserCart(guestCart, userId, client);
        await client.query('COMMIT');
        return mergedCart;
      }
    }

    if (userId) {
      const existingResult = await client.query(
        "SELECT * FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1",
        [userId]
      );
      if (existingResult.rows.length > 0) {
        const cart = existingResult.rows[0];
        const itemsResult = await client.query('SELECT * FROM cart_items WHERE cart_id = $1', [cart.id]);
        await client.query('COMMIT');
        return formatCart(cart, itemsResult.rows);
      }
    }

    const result = await client.query(
      `INSERT INTO carts (user_id, guest_id, status, subtotal, total, created_at, updated_at)
       VALUES ($1, $2, 'active', 0, 0, NOW(), NOW()) RETURNING *`,
      [userId, guestId]
    );
    const cart = result.rows[0];
    await client.query('COMMIT');
    return formatCart(cart, []);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const mergeGuestCartIntoUserCart = async (guestCart, userId, client) => {
  let userCartResult = await client.query(
    "SELECT * FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1",
    [userId]
  );

  let userCart;
  if (userCartResult.rows.length === 0) {
    const newCartResult = await client.query(
      `INSERT INTO carts (user_id, guest_id, status, subtotal, total, created_at, updated_at)
       VALUES ($1, NULL, 'active', 0, 0, NOW(), NOW()) RETURNING *`,
      [userId]
    );
    userCart = newCartResult.rows[0];
  } else {
    userCart = userCartResult.rows[0];
  }

  const guestItemsResult = await client.query(
    'SELECT * FROM cart_items WHERE cart_id = $1',
    [guestCart.id]
  );

  for (const guestItem of guestItemsResult.rows) {
    const existingItemResult = await client.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3',
      [userCart.id, guestItem.product_id, guestItem.variant_id]
    );

    if (existingItemResult.rows.length > 0) {
      const existingItem = existingItemResult.rows[0];
      const newQuantity = existingItem.quantity + guestItem.quantity;
      const lineTotal = (newQuantity * parseFloat(existingItem.unit_price)).toFixed(2);
      await client.query(
        'UPDATE cart_items SET quantity = $1, line_total = $2, updated_at = NOW() WHERE id = $3',
        [newQuantity, lineTotal, existingItem.id]
      );
    } else {
      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price, line_total, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [userCart.id, guestItem.product_id, guestItem.variant_id, guestItem.quantity, guestItem.unit_price, guestItem.line_total]
      );
    }
  }

  await client.query("UPDATE carts SET status = 'merged', updated_at = NOW() WHERE id = $1", [guestCart.id]);

  const { cart: updatedCart, items } = await recalculateCart(userCart.id, client);
  return formatCart(updatedCart, items);
};

const getCartById = async (cartId, userId) => {
  const client = await db.getClient();
  try {
    const cartResult = await client.query('SELECT * FROM carts WHERE id = $1', [cartId]);
    if (cartResult.rows.length === 0) {
      throw createError('Cart not found', 404);
    }
    const cart = cartResult.rows[0];

    if (cart.status !== 'active') {
      throw createError('Cart is no longer active', 400);
    }

    if (userId && cart.user_id && cart.user_id !== userId) {
      throw createError('Access denied to this cart', 403);
    }

    const itemsResult = await client.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId]);
    return formatCart(cart, itemsResult.rows);
  } finally {
    client.release();
  }
};

const checkStockAvailability = async (productId, variantId, quantity, client) => {
  let stockResult;
  if (variantId) {
    stockResult = await client.query(
      'SELECT stock_quantity FROM product_variants WHERE id = $1 AND product_id = $2',
      [variantId, productId]
    );
  } else {
    stockResult = await client.query(
      'SELECT stock_quantity FROM products WHERE id = $1',
      [productId]
    );
  }

  if (stockResult.rows.length === 0) {
    throw createError('Product or variant not found', 404);
  }

  const available = stockResult.rows[0].stock_quantity;
  if (available < quantity) {
    throw createError(`Insufficient stock. Only ${available} unit(s) available`, 400);
  }
};

const getUnitPrice = async (productId, variantId, client) => {
  let priceResult;
  if (variantId) {
    priceResult = await client.query(
      'SELECT price FROM product_variants WHERE id = $1 AND product_id = $2',
      [variantId, productId]
    );
  } else {
    priceResult = await client.query(
      'SELECT price FROM products WHERE id = $1',
      [productId]
    );
  }

  if (priceResult.rows.length === 0) {
    throw createError('Product or variant not found', 404);
  }
  return parseFloat(priceResult.rows[0].price);
};

const addItem = async (cartId, { productId, variantId, quantity }, userId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const cartResult = await client.query('SELECT * FROM carts WHERE id = $1', [cartId]);
    if (cartResult.rows.length === 0) {
      throw createError('Cart not found', 404);
    }
    const cart = cartResult.rows[0];

    if (cart.status !== 'active') {
      throw createError('Cart is no longer active', 400);
    }

    if (userId && cart.user_id && cart.user_id !== userId) {
      throw createError('Access denied to this cart', 403);
    }

    await checkStockAvailability(productId, variantId, quantity, client);
    const unitPrice = await getUnitPrice(productId, variantId, client);

    const existingItemResult = await client.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3',
      [cartId, productId, variantId]
    );

    if (existingItemResult.rows.length > 0) {
      const existingItem = existingItemResult.rows[0];
      const newQuantity = existingItem.quantity + quantity;
      await checkStockAvailability(productId, variantId, newQuantity, client);
      const lineTotal = (newQuantity * unitPrice).toFixed(2);
      await client.query(
        'UPDATE cart_items SET quantity = $1, line_total = $2, updated_at = NOW() WHERE id = $3',
        [newQuantity, lineTotal, existingItem.id]
      );
    } else {
      const lineTotal = (quantity * unitPrice).toFixed(2);
      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price, line_total, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [cartId, productId, variantId, quantity, unitPrice.toFixed(2), lineTotal]
      );
    }

    const { cart: updatedCart, items } = await recalculateCart(cartId, client);
    await client.query('COMMIT');
    return formatCart(updatedCart, items);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateItem = async (cartId, itemId, { quantity }, userId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const cartResult = await client.query('SELECT * FROM carts WHERE id = $1', [cartId]);
    if (cartResult.rows.length === 0) {
      throw createError('Cart not found', 404);
    }
    const cart = cartResult.rows[0];

    if (cart.status !== 'active') {
      throw createError('Cart is no longer active', 400);
    }

    if (userId && cart.user_id && cart.user_id !== userId) {
      throw createError('Access denied to this cart', 403);
    }

    const itemResult = await client.query(
      'SELECT * FROM cart_items WHERE id = $1 AND cart_id = $2',
      [itemId, cartId]
    );
    if (itemResult.rows.length === 0) {
      throw createError('Cart item not found', 404);
    }
    const item = itemResult.rows[0];

    if (quantity === 0) {
      await client.query('DELETE FROM cart_items WHERE id = $1', [itemId]);
    } else {
      await checkStockAvailability(item.product_id, item.variant_id, quantity, client);
      const lineTotal = (quantity * parseFloat(item.unit_price)).toFixed(2);
      await client.query(
        'UPDATE cart_items SET quantity = $1, line_total = $2, updated_at = NOW() WHERE id = $3',
        [quantity, lineTotal, itemId]
      );
    }

    const { cart: updatedCart, items } = await recalculateCart(cartId, client);
    await client.query('COMMIT');
    return formatCart(updatedCart, items);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const removeItem = async (cartId, itemId, userId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const cartResult = await client.query('SELECT * FROM carts WHERE id = $1', [cartId]);
    if (cartResult.rows.length === 0) {
      throw createError('Cart not found', 404);
    }
    const cart = cartResult.rows[0];

    if (cart.status !== 'active') {
      throw createError('Cart is no longer active', 400);
    }

    if (userId && cart.user_id && cart.user_id !== userId) {
      throw createError('Access denied to this cart', 403);
    }

    const itemResult = await client.query(
      'SELECT * FROM cart_items WHERE id = $1 AND cart_id = $2',
      [itemId, cartId]
    );
    if (itemResult.rows.length === 0) {
      throw createError('Cart item not found', 404);
    }

    await client.query('DELETE FROM cart_items WHERE id = $1', [itemId]);

    const { cart: updatedCart, items } = await recalculateCart(cartId, client);
    await client.query('COMMIT');
    return formatCart(updatedCart, items);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const applyPromo = async (cartId, promoCode, userId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const cartResult = await client.query('SELECT * FROM carts WHERE id = $1', [cartId]);
    if (cartResult.rows.length === 0) {
      throw createError('Cart not found', 404);
    }
    const cart = cartResult.rows[0];

    if (cart.status !== 'active') {
      throw createError('Cart is no longer active', 400);
    }

    if (userId && cart.user_id && cart.user_id !== userId) {
      throw createError('Access denied to this cart', 403);
    }

    const promoResult = await client.query(
      `SELECT * FROM promo_codes
       WHERE code = $1
         AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (usage_limit IS NULL OR usage_count < usage_limit)`,
      [promoCode]
    );

    if (promoResult.rows.length === 0) {
      throw createError('Invalid or expired promo code', 400);
    }
    const promo = promoResult.rows[0];

    const subtotal = parseFloat(cart.subtotal) || 0;
    let discountAmount = 0;

    if (promo.discount_type === 'percentage') {
      discountAmount = (subtotal * parseFloat(promo.discount_value)) / 100;
    } else if (promo.discount_type === 'fixed') {
      discountAmount = parseFloat(promo.discount_value);
    }

    if (discountAmount > subtotal) discountAmount = subtotal;

    const total = (subtotal - discountAmount).toFixed(2);

    await client.query(
      `UPDATE carts
       SET promo_code = $1, discount_amount = $2, discount_type = $3, total = $4, updated_at = NOW()
       WHERE id = $5`,
      [promoCode, discountAmount.toFixed(2), promo.discount_type, total, cartId]
    );

    const updatedCartResult = await client.query('SELECT * FROM carts WHERE id = $1', [cartId]);
    const itemsResult = await client.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId]);
    await client.query('COMMIT');
    return formatCart(updatedCartResult.rows[0], itemsResult.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const removePromo = async (cartId, userId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const cartResult = await client.query('SELECT * FROM carts WHERE id = $1', [cartId]);
    if (cartResult.rows.length === 0) {
      throw createError('Cart not found', 404);
    }
    const cart = cartResult.rows[0];

    if (cart.status !== 'active') {
      throw createError('Cart is no longer active', 400);
    }

    if (userId && cart.user_id && cart.user_id !== userId) {
      throw createError('Access denied to this cart', 403);
    }

    const subtotal = parseFloat(cart.subtotal) || 0;

    await client.query(
      `UPDATE carts
       SET promo_code = NULL, discount_amount = 0, discount_type = NULL, total = $1, updated_at = NOW()
       WHERE id = $2`,
      [subtotal.toFixed(2), cartId]
    );

    const updatedCartResult = await client.query('SELECT * FROM carts WHERE id = $1', [cartId]);
    const itemsResult = await client.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId]);
    await client.query('COMMIT');
    return formatCart(updatedCartResult.rows[0], itemsResult.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createCart,
  getCartById,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
};
