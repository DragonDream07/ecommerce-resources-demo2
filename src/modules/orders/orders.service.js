const db = require('../../db');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const CANCELLABLE_STATUSES = ['pending', 'confirmed'];
const RETURNABLE_STATUSES = ['delivered'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function assertOrderAccess(order, user) {
  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }
  if (user && !user.isAdmin && order.user_id !== user.id) {
    const err = new Error('Access denied.');
    err.status = 403;
    throw err;
  }
}

async function writeStatusHistory(orderId, status, note, actorId, trx) {
  const query = db('order_status_history').insert({
    order_id: orderId,
    status,
    note: note || null,
    created_by: actorId || null,
  });
  return trx ? query.transacting(trx) : query;
}

// ---------------------------------------------------------------------------
// List orders
// ---------------------------------------------------------------------------
async function listOrders({ userId, status, page, limit }) {
  const offset = (page - 1) * limit;
  let query = db('orders').select('*').orderBy('created_at', 'desc');

  if (userId) {
    query = query.where('user_id', userId);
  }
  if (status) {
    query = query.where('status', status);
  }

  const [{ count }] = await query.clone().count('id as count');
  const orders = await query.limit(limit).offset(offset);

  return {
    data: orders,
    pagination: {
      total: parseInt(count, 10),
      page,
      limit,
    },
  };
}

// ---------------------------------------------------------------------------
// Get order by ID
// ---------------------------------------------------------------------------
async function getOrderById(orderId, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderAccess(order, user);

  const items = await db('order_items').where('order_id', orderId).select('*');

  return { ...order, items };
}

// ---------------------------------------------------------------------------
// Advance order status
// ---------------------------------------------------------------------------
async function advanceOrderStatus(orderId, newStatus, note, user) {
  if (!user || !user.isAdmin) {
    const err = new Error('Access denied.');
    err.status = 403;
    throw err;
  }

  const order = await db('orders').where('id', orderId).first();
  assertOrderAccess(order, user);

  const currentIndex = ORDER_STATUSES.indexOf(order.status);
  const nextIndex = ORDER_STATUSES.indexOf(newStatus);

  if (nextIndex === -1) {
    const err = new Error('Invalid status value.');
    err.status = 400;
    throw err;
  }

  if (nextIndex <= currentIndex) {
    const err = new Error('Cannot transition to a previous or equal status.');
    err.status = 422;
    throw err;
  }

  return db.transaction(async (trx) => {
    const [updated] = await trx('orders')
      .where('id', orderId)
      .update({ status: newStatus, updated_at: db.fn.now() })
      .returning('*');

    await writeStatusHistory(orderId, newStatus, note, user.id, trx);

    // Update tracking record if shipped
    if (newStatus === 'shipped') {
      const existing = await trx('order_tracking').where('order_id', orderId).first();
      if (existing) {
        await trx('order_tracking')
          .where('order_id', orderId)
          .update({ status: 'shipped', updated_at: db.fn.now() });
      } else {
        await trx('order_tracking').insert({
          order_id: orderId,
          status: 'shipped',
        });
      }
    }

    if (newStatus === 'delivered') {
      await trx('order_tracking')
        .where('order_id', orderId)
        .update({ status: 'delivered', delivered_at: db.fn.now(), updated_at: db.fn.now() });
    }

    return updated;
  });
}

// ---------------------------------------------------------------------------
// Cancel order
// ---------------------------------------------------------------------------
async function cancelOrder(orderId, reason, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderAccess(order, user);

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    const err = new Error(
      `Order cannot be cancelled in its current status (${order.status}).`
    );
    err.status = 422;
    throw err;
  }

  return db.transaction(async (trx) => {
    const [updated] = await trx('orders')
      .where('id', orderId)
      .update({ status: 'cancelled', updated_at: db.fn.now() })
      .returning('*');

    await writeStatusHistory(orderId, 'cancelled', reason, user ? user.id : null, trx);

    return updated;
  });
}

// ---------------------------------------------------------------------------
// Create return request
// ---------------------------------------------------------------------------
async function createReturnRequest(orderId, payload, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderAccess(order, user);

  if (!RETURNABLE_STATUSES.includes(order.status)) {
    const err = new Error(
      `Return requests can only be submitted for delivered orders.`
    );
    err.status = 422;
    throw err;
  }

  const [returnRequest] = await db('return_requests')
    .insert({
      order_id: orderId,
      user_id: user ? user.id : null,
      reason: payload.reason,
      items: JSON.stringify(payload.items || []),
      status: 'pending',
    })
    .returning('*');

  return returnRequest;
}

// ---------------------------------------------------------------------------
// Get order tracking
// ---------------------------------------------------------------------------
async function getOrderTracking(orderId, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderAccess(order, user);

  const tracking = await db('order_tracking').where('order_id', orderId).first();
  return tracking || null;
}

// ---------------------------------------------------------------------------
// Get order timeline (status history)
// ---------------------------------------------------------------------------
async function getOrderTimeline(orderId, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderAccess(order, user);

  const timeline = await db('order_status_history')
    .where('order_id', orderId)
    .orderBy('created_at', 'asc')
    .select('*');

  return timeline;
}

// ---------------------------------------------------------------------------
// Get order refunds
// ---------------------------------------------------------------------------
async function getOrderRefunds(orderId, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderAccess(order, user);

  const refunds = await db('refunds')
    .where('order_id', orderId)
    .orderBy('created_at', 'desc')
    .select('*');

  return refunds;
}

// ---------------------------------------------------------------------------
// Create order (called by checkout)
// ---------------------------------------------------------------------------
async function createOrder({ userId, items, shippingAddress, paymentMethod, totalAmount }, trx) {
  const execute = async (t) => {
    const [order] = await t('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        shipping_address: JSON.stringify(shippingAddress),
        payment_method: paymentMethod,
        total_amount: totalAmount,
      })
      .returning('*');

    if (items && items.length > 0) {
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      }));
      await t('order_items').insert(orderItems);
    }

    await writeStatusHistory(order.id, 'pending', 'Order placed.', userId, t);

    return order;
  };

  return trx ? execute(trx) : db.transaction(execute);
}

module.exports = {
  listOrders,
  getOrderById,
  advanceOrderStatus,
  cancelOrder,
  createReturnRequest,
  getOrderTracking,
  getOrderTimeline,
  getOrderRefunds,
  createOrder,
};
