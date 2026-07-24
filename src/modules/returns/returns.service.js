const db = require('../../db');
const { NotFoundError, ConflictError, ForbiddenError } = require('../../utils/errors');

const RETURNABLE_ORDER_STATUSES = ['delivered'];
const RETURN_WINDOW_DAYS = 30;
const ALLOWED_REVIEW_ACTIONS = ['approved', 'rejected'];

/**
 * Check whether an order is eligible for a return.
 * @param {object} order
 */
function assertReturnEligible(order, userId) {
  if (order.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to request a return for this order.');
  }
  if (!RETURNABLE_ORDER_STATUSES.includes(order.status)) {
    throw new ConflictError('Order is not eligible for a return in its current status.');
  }
  const deliveredAt = new Date(order.delivered_at);
  const windowEnd = new Date(deliveredAt);
  windowEnd.setDate(windowEnd.getDate() + RETURN_WINDOW_DAYS);
  if (new Date() > windowEnd) {
    throw new ConflictError('Return window has expired for this order.');
  }
}

/**
 * Create a return request for an order.
 */
async function createReturnRequest(orderId, userId, payload) {
  const order = await db('orders').where({ id: orderId }).first();
  if (!order) {
    throw new NotFoundError('Order not found.');
  }

  assertReturnEligible(order, userId);

  const existing = await db('return_requests')
    .where({ order_id: orderId, status: ['pending', 'approved'] })
    .whereIn('status', ['pending', 'approved'])
    .first();
  if (existing) {
    throw new ConflictError('A return request for this order already exists.');
  }

  const [returnRequest] = await db('return_requests')
    .insert({
      order_id: orderId,
      user_id: userId,
      reason: payload.reason,
      items: payload.items ? JSON.stringify(payload.items) : null,
      status: 'pending',
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  return returnRequest;
}

/**
 * Get a return request scoped to a specific order and user.
 */
async function getReturnRequestByOrder(orderId, returnRequestId, userId) {
  const order = await db('orders').where({ id: orderId }).first();
  if (!order) {
    throw new NotFoundError('Order not found.');
  }
  if (order.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this return request.');
  }

  const returnRequest = await db('return_requests')
    .where({ id: returnRequestId, order_id: orderId })
    .first();
  if (!returnRequest) {
    throw new NotFoundError('Return request not found.');
  }

  return returnRequest;
}

/**
 * List all return requests (admin).
 */
async function listReturnRequests(filters = {}) {
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const offset = (page - 1) * limit;

  let query = db('return_requests').orderBy('created_at', 'desc');

  if (filters.status) {
    query = query.where('status', filters.status);
  }
  if (filters.orderId) {
    query = query.where('order_id', filters.orderId);
  }
  if (filters.userId) {
    query = query.where('user_id', filters.userId);
  }

  const [{ count }] = await query.clone().count('id as count');
  const items = await query.limit(limit).offset(offset);

  return {
    items,
    meta: {
      total: parseInt(count, 10),
      page,
      limit,
    },
  };
}

/**
 * Get a single return request by ID (admin).
 */
async function getReturnRequestById(returnRequestId) {
  const returnRequest = await db('return_requests').where({ id: returnRequestId }).first();
  if (!returnRequest) {
    throw new NotFoundError('Return request not found.');
  }
  return returnRequest;
}

/**
 * Review a return request: approve or reject.
 * On approval: trigger refund and restore stock.
 */
async function reviewReturnRequest(returnRequestId, adminId, payload) {
  const returnRequest = await db('return_requests').where({ id: returnRequestId }).first();
  if (!returnRequest) {
    throw new NotFoundError('Return request not found.');
  }
  if (returnRequest.status !== 'pending') {
    throw new ConflictError('Only pending return requests can be reviewed.');
  }
  if (!ALLOWED_REVIEW_ACTIONS.includes(payload.action)) {
    throw new ConflictError('Invalid review action. Must be approved or rejected.');
  }

  const trx = await db.transaction();
  try {
    const [updated] = await trx('return_requests')
      .where({ id: returnRequestId })
      .update({
        status: payload.action,
        admin_id: adminId,
        admin_notes: payload.notes || null,
        reviewed_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning('*');

    if (payload.action === 'approved') {
      await triggerRefund(trx, updated);
      await restoreStock(trx, updated);
    }

    await trx.commit();
    return updated;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

/**
 * Trigger a refund for an approved return request.
 */
async function triggerRefund(trx, returnRequest) {
  const order = await trx('orders').where({ id: returnRequest.order_id }).first();
  if (!order) {
    throw new NotFoundError('Order not found for refund processing.');
  }

  await trx('refunds').insert({
    order_id: returnRequest.order_id,
    return_request_id: returnRequest.id,
    user_id: returnRequest.user_id,
    amount: order.total_amount,
    status: 'pending',
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });
}

/**
 * Restore stock for items in an approved return request.
 */
async function restoreStock(trx, returnRequest) {
  let items = returnRequest.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = null;
    }
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    const orderItems = await trx('order_items').where({ order_id: returnRequest.order_id });
    items = orderItems.map((oi) => ({ product_id: oi.product_id, quantity: oi.quantity }));
  }

  for (const item of items) {
    await trx('products')
      .where({ id: item.product_id })
      .increment('stock_quantity', item.quantity);
  }
}

module.exports = {
  createReturnRequest,
  getReturnRequestByOrder,
  listReturnRequests,
  getReturnRequestById,
  reviewReturnRequest,
};
