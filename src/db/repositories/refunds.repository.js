const db = require('../knex');

const TABLE = 'refunds';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findByOrderId(orderId) {
  return db(TABLE).where({ order_id: orderId }).select('*');
}

async function findByGatewayRefundId(gatewayRefundId) {
  return db(TABLE).where({ gateway_refund_id: gatewayRefundId }).first();
}

async function create(data, trx) {
  const [id] = await (trx || db)(TABLE).insert(data);
  return (trx || db)(TABLE).where({ id }).first();
}

async function update(id, data, trx) {
  await (trx || db)(TABLE).where({ id }).update(data);
  return (trx || db)(TABLE).where({ id }).first();
}

async function findAll({ limit = 20, offset = 0, status } = {}) {
  const query = db(TABLE).orderBy('created_at', 'desc');
  if (status) query.where({ status });
  return query.limit(limit).offset(offset);
}

module.exports = {
  findById,
  findByOrderId,
  findByGatewayRefundId,
  create,
  update,
  findAll,
};
