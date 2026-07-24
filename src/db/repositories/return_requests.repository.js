const db = require('../knex');

const TABLE = 'return_requests';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findByOrderId(orderId) {
  return db(TABLE).where({ order_id: orderId }).select('*');
}

async function findByUserId(userId, { limit = 20, offset = 0 } = {}) {
  return db(TABLE).where({ user_id: userId }).orderBy('created_at', 'desc').limit(limit).offset(offset);
}

async function findAll({ limit = 20, offset = 0, status } = {}) {
  const query = db(TABLE).orderBy('created_at', 'desc');
  if (status) query.where({ status });
  return query.limit(limit).offset(offset);
}

async function create(data) {
  const [id] = await db(TABLE).insert(data);
  return findById(id);
}

async function update(id, data) {
  await db(TABLE).where({ id }).update(data);
  return findById(id);
}

async function count({ status } = {}) {
  const query = db(TABLE);
  if (status) query.where({ status });
  const [{ total }] = await query.count('id as total');
  return Number(total);
}

module.exports = {
  findById,
  findByOrderId,
  findByUserId,
  findAll,
  create,
  update,
  count,
};
