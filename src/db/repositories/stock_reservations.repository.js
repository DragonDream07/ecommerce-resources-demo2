const db = require('../knex');

const TABLE = 'stock_reservations';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findByOrderId(orderId) {
  return db(TABLE).where({ order_id: orderId }).select('*');
}

async function findBySkuId(skuId) {
  return db(TABLE).where({ sku_id: skuId }).select('*');
}

async function create(data, trx) {
  const [id] = await (trx || db)(TABLE).insert(data);
  return (trx || db)(TABLE).where({ id }).first();
}

async function update(id, data, trx) {
  await (trx || db)(TABLE).where({ id }).update(data);
  return (trx || db)(TABLE).where({ id }).first();
}

async function remove(id, trx) {
  return (trx || db)(TABLE).where({ id }).del();
}

async function releaseByOrderId(orderId, trx) {
  return (trx || db)(TABLE).where({ order_id: orderId }).del();
}

async function findExpired(before) {
  return db(TABLE).where('expires_at', '<', before).select('*');
}

module.exports = {
  findById,
  findByOrderId,
  findBySkuId,
  create,
  update,
  remove,
  releaseByOrderId,
  findExpired,
};
