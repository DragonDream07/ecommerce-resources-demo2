const db = require('../knex');

const TABLE = 'addresses';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findByUserId(userId) {
  return db(TABLE).where({ user_id: userId }).select('*');
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

async function findDefaultForUser(userId) {
  return db(TABLE).where({ user_id: userId, is_default: true }).first();
}

async function setDefault(id, userId) {
  await db(TABLE).where({ user_id: userId }).update({ is_default: false });
  await db(TABLE).where({ id }).update({ is_default: true });
  return findById(id);
}

module.exports = {
  findById,
  findByUserId,
  create,
  update,
  remove,
  findDefaultForUser,
  setDefault,
};
