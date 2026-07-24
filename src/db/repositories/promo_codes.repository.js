const db = require('../knex');

const TABLE = 'promo_codes';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findByCode(code) {
  return db(TABLE).where({ code }).first();
}

async function findAll({ limit = 50, offset = 0 } = {}) {
  return db(TABLE).limit(limit).offset(offset);
}

async function create(data) {
  const [id] = await db(TABLE).insert(data);
  return findById(id);
}

async function update(id, data) {
  await db(TABLE).where({ id }).update(data);
  return findById(id);
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

async function incrementUsageCount(id, trx) {
  return (trx || db)(TABLE).where({ id }).increment('usage_count', 1);
}

async function findActive() {
  const now = new Date();
  return db(TABLE)
    .where({ is_active: true })
    .where(function () {
      this.whereNull('expires_at').orWhere('expires_at', '>', now);
    })
    .select('*');
}

module.exports = {
  findById,
  findByCode,
  findAll,
  create,
  update,
  remove,
  incrementUsageCount,
  findActive,
};
