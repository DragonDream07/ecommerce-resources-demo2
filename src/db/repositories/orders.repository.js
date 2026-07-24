const db = require('../knex');

const ORDERS_TABLE = 'orders';
const ITEMS_TABLE = 'order_items';
const STATUS_HISTORY_TABLE = 'order_status_history';
const TRACKING_TABLE = 'order_tracking';

async function findById(id) {
  return db(ORDERS_TABLE).where({ id }).first();
}

async function findByOrderNumber(orderNumber) {
  return db(ORDERS_TABLE).where({ order_number: orderNumber }).first();
}

async function findByUserId(userId, { limit = 20, offset = 0 } = {}) {
  return db(ORDERS_TABLE).where({ user_id: userId }).orderBy('created_at', 'desc').limit(limit).offset(offset);
}

async function findAll({ limit = 20, offset = 0, status } = {}) {
  const query = db(ORDERS_TABLE).orderBy('created_at', 'desc');
  if (status) query.where({ status });
  return query.limit(limit).offset(offset);
}

async function count({ userId, status } = {}) {
  const query = db(ORDERS_TABLE);
  if (userId) query.where({ user_id: userId });
  if (status) query.where({ status });
  const [{ total }] = await query.count('id as total');
  return Number(total);
}

async function create(data, trx) {
  const [id] = await (trx || db)(ORDERS_TABLE).insert(data);
  return (trx || db)(ORDERS_TABLE).where({ id }).first();
}

async function update(id, data, trx) {
  await (trx || db)(ORDERS_TABLE).where({ id }).update(data);
  return (trx || db)(ORDERS_TABLE).where({ id }).first();
}

async function getOrderItems(orderId) {
  return db(ITEMS_TABLE).where({ order_id: orderId }).select('*');
}

async function addOrderItem(data, trx) {
  const [id] = await (trx || db)(ITEMS_TABLE).insert(data);
  return (trx || db)(ITEMS_TABLE).where({ id }).first();
}

async function addStatusHistory(data, trx) {
  const [id] = await (trx || db)(STATUS_HISTORY_TABLE).insert(data);
  return (trx || db)(STATUS_HISTORY_TABLE).where({ id }).first();
}

async function getStatusHistory(orderId) {
  return db(STATUS_HISTORY_TABLE).where({ order_id: orderId }).orderBy('created_at', 'asc');
}

async function upsertTracking(data, trx) {
  const existing = await (trx || db)(TRACKING_TABLE).where({ order_id: data.order_id }).first();
  if (existing) {
    await (trx || db)(TRACKING_TABLE).where({ id: existing.id }).update(data);
    return (trx || db)(TRACKING_TABLE).where({ id: existing.id }).first();
  }
  const [id] = await (trx || db)(TRACKING_TABLE).insert(data);
  return (trx || db)(TRACKING_TABLE).where({ id }).first();
}

async function getTracking(orderId) {
  return db(TRACKING_TABLE).where({ order_id: orderId }).first();
}

async function getOrderWithDetails(orderId) {
  const order = await findById(orderId);
  if (!order) return null;
  const [items, statusHistory, tracking] = await Promise.all([
    getOrderItems(orderId),
    getStatusHistory(orderId),
    getTracking(orderId),
  ]);
  return { ...order, items, statusHistory, tracking };
}

module.exports = {
  findById,
  findByOrderNumber,
  findByUserId,
  findAll,
  count,
  create,
  update,
  getOrderItems,
  addOrderItem,
  addStatusHistory,
  getStatusHistory,
  upsertTracking,
  getTracking,
  getOrderWithDetails,
};
