const { v4: uuidv4 } = require('uuid');
const db = require('../../db');
const { AppError } = require('../../utils/AppError');

// In-memory session store — replace with Redis or DB-backed sessions in production
const checkoutSessions = new Map();

/**
 * Initiates a checkout session.
 * Validates that the cart exists and belongs to the user (or guest).
 */
async function initiateCheckout({ userId, guestEmail, cartId }) {
  if (!cartId) {
    throw new AppError('Cart ID is required to initiate checkout.', 400);
  }

  // Fetch cart items
  const cartItems = await db('cart_items')
    .where({ cart_id: cartId })
    .select('*');

  if (!cartItems || cartItems.length === 0) {
    throw new AppError('Cart is empty. Add items before proceeding to checkout.', 400);
  }

  // Confirm stock availability for each cart item
  for (const item of cartItems) {
    const product = await db('products')
      .where({ id: item.product_id })
      .first();

    if (!product) {
      throw new AppError(`Product with ID ${item.product_id} not found.`, 404);
    }

    if (product.stock_quantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}.`,
        409
      );
    }
  }

  const sessionId = uuidv4();
  const session = {
    checkoutSessionId: sessionId,
    cartId,
    userId: userId || null,
    guestEmail: guestEmail || null,
    cartItems,
    shippingAddress: null,
    billingAddress: null,
    promoCode: null,
    discount: 0,
    status: 'initiated',
    createdAt: Date.now(),
  };

  checkoutSessions.set(sessionId, session);

  return {
    checkoutSessionId: sessionId,
    itemCount: cartItems.length,
    status: session.status,
  };
}

/**
 * Validates and stores the shipping and billing addresses for a checkout session.
 */
async function submitAddress({ checkoutSessionId, shippingAddress, billingAddress, useShippingAsBilling }) {
  const session = _getSession(checkoutSessionId);

  _validateAddressFields(shippingAddress, 'shipping');

  const resolvedBilling = useShippingAsBilling ? shippingAddress : billingAddress;

  if (!useShippingAsBilling) {
    _validateAddressFields(resolvedBilling, 'billing');
  }

  session.shippingAddress = shippingAddress;
  session.billingAddress = resolvedBilling;
  session.status = 'address_submitted';

  checkoutSessions.set(checkoutSessionId, session);

  return {
    checkoutSessionId,
    shippingAddress: session.shippingAddress,
    billingAddress: session.billingAddress,
    status: session.status,
  };
}

/**
 * Returns an order review summary: items, addresses, totals, and promo information.
 */
async function getOrderReview({ checkoutSessionId }) {
  const session = _getSession(checkoutSessionId);

  const itemsWithDetails = await Promise.all(
    session.cartItems.map(async (item) => {
      const product = await db('products').where({ id: item.product_id }).first();
      return {
        productId: item.product_id,
        name: product ? product.name : 'Unknown',
        quantity: item.quantity,
        unitPrice: product ? product.price : 0,
        lineTotal: (product ? product.price : 0) * item.quantity,
      };
    })
  );

  const subtotal = itemsWithDetails.reduce((sum, i) => sum + i.lineTotal, 0);
  const discount = session.discount || 0;
  const tax = parseFloat(((subtotal - discount) * 0.1).toFixed(2));
  const total = parseFloat((subtotal - discount + tax).toFixed(2));

  return {
    checkoutSessionId,
    items: itemsWithDetails,
    shippingAddress: session.shippingAddress,
    billingAddress: session.billingAddress,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    tax,
    total,
    promoCode: session.promoCode || null,
    status: session.status,
  };
}

/**
 * Places the order:
 * 1. Confirms stock reservation
 * 2. Finalises promo/discount
 * 3. Creates the order record
 * 4. Delegates payment intent creation
 */
async function placeOrder({ checkoutSessionId, paymentMethod, promoCode, userId }) {
  const session = _getSession(checkoutSessionId);

  if (!session.shippingAddress || !session.billingAddress) {
    throw new AppError('Shipping and billing addresses must be submitted before placing an order.', 400);
  }

  // Confirm stock reservation
  for (const item of session.cartItems) {
    const product = await db('products').where({ id: item.product_id }).first();

    if (!product) {
      throw new AppError(`Product with ID ${item.product_id} no longer exists.`, 404);
    }

    if (product.stock_quantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}.`,
        409
      );
    }
  }

  // Finalise promo code
  let discount = 0;
  let resolvedPromoCode = session.promoCode || promoCode || null;

  if (resolvedPromoCode) {
    const promo = await db('promo_codes')
      .where({ code: resolvedPromoCode, is_active: true })
      .first();

    if (!promo) {
      throw new AppError('Promo code is invalid or has expired.', 400);
    }

    const subtotal = session.cartItems.reduce((sum, item) => {
      return sum + item.unit_price * item.quantity;
    }, 0);

    discount = promo.discount_type === 'percentage'
      ? parseFloat(((promo.discount_value / 100) * subtotal).toFixed(2))
      : parseFloat(promo.discount_value.toFixed(2));

    session.discount = discount;
    session.promoCode = resolvedPromoCode;
  }

  // Compute totals
  const subtotal = session.cartItems.reduce((sum, item) => {
    return sum + (item.unit_price || 0) * item.quantity;
  }, 0);

  const tax = parseFloat(((subtotal - discount) * 0.1).toFixed(2));
  const total = parseFloat((subtotal - discount + tax).toFixed(2));

  // Deduct stock
  for (const item of session.cartItems) {
    await db('products')
      .where({ id: item.product_id })
      .decrement('stock_quantity', item.quantity);
  }

  // Create order record
  const orderId = uuidv4();
  const now = new Date().toISOString();

  await db('orders').insert({
    id: orderId,
    user_id: userId || session.userId || null,
    guest_email: session.guestEmail || null,
    cart_id: session.cartId,
    shipping_address: JSON.stringify(session.shippingAddress),
    billing_address: JSON.stringify(session.billingAddress),
    promo_code: resolvedPromoCode || null,
    discount,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax,
    total,
    payment_method: paymentMethod || null,
    payment_status: 'pending',
    order_status: 'pending',
    created_at: now,
    updated_at: now,
  });

  // Delegate payment intent creation
  const paymentIntent = await _createPaymentIntent({ orderId, total, paymentMethod });

  // Invalidate session
  session.status = 'completed';
  checkoutSessions.delete(checkoutSessionId);

  return {
    orderId,
    total,
    discount,
    tax,
    subtotal: parseFloat(subtotal.toFixed(2)),
    paymentIntent,
    status: 'pending',
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _getSession(checkoutSessionId) {
  if (!checkoutSessionId) {
    throw new AppError('Checkout session ID is required.', 400);
  }

  const session = checkoutSessions.get(checkoutSessionId);

  if (!session) {
    throw new AppError('Checkout session not found or has expired.', 404);
  }

  return session;
}

function _validateAddressFields(address, type) {
  const required = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];

  if (!address || typeof address !== 'object') {
    throw new AppError(`${type} address is required.`, 400);
  }

  for (const field of required) {
    if (!address[field] || String(address[field]).trim() === '') {
      throw new AppError(`${type} address is missing required field: ${field}.`, 400);
    }
  }
}

async function _createPaymentIntent({ orderId, total, paymentMethod }) {
  // Placeholder — integrate with payment provider (e.g. Stripe) here.
  return {
    paymentIntentId: `pi_${orderId.replace(/-/g, '')}`,
    amount: total,
    currency: 'usd',
    status: 'requires_payment_method',
    paymentMethod: paymentMethod || null,
  };
}

module.exports = {
  initiateCheckout,
  submitAddress,
  getOrderReview,
  placeOrder,
};
