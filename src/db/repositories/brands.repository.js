const db = require('../knex');

const TABLE = 'brands';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findBySlug(slug) {
  return db(TABLE).where({ slug }).first();
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

async function count() {
  const [{ total }] = await db(TABLE).count('id as total');
  return Number(total);
}

module.exports = {
  findById,
  findBySlug,
  findAll,
  create,
  update,
  remove,
  count,
};
