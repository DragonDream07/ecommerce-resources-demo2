const db = require('../knex');

const TABLE = 'payment_attempts';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findByOrderId(orderId) {
  return db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc').select('*');
}

async function findByGatewayPaymentId(gatewayPaymentId) {
  return db(TABLE).where({ gateway_payment_id: gatewayPaymentId }).first();
}

async function create(data, trx) {
  const [id] = await (trx || db)(TABLE).insert(data);
  return (trx || db)(TABLE).where({ id }).first();
}

async function update(id, data, trx) {
  await (trx || db)(TABLE).where({ id }).update(data);
  return (trx || db)(TABLE).where({ id }).first();
}

async function findLatestByOrderId(orderId) {
  return db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc').first();
}

module.exports = {
  findById,
  findByOrderId,
  findByGatewayPaymentId,
  create,
  update,
  findLatestByOrderId,
};
