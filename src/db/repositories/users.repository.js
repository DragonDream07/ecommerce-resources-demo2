const db = require('../knex');

const TABLE = 'users';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findByEmail(email) {
  return db(TABLE).where({ email }).first();
}

async function findByPhone(phone) {
  return db(TABLE).where({ phone }).first();
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

async function findAll({ limit = 20, offset = 0 } = {}) {
  return db(TABLE).limit(limit).offset(offset);
}

async function count() {
  const [{ total }] = await db(TABLE).count('id as total');
  return Number(total);
}

async function findByRefreshToken(refreshToken) {
  return db(TABLE).where({ refresh_token: refreshToken }).first();
}

async function updateRefreshToken(id, refreshToken) {
  return db(TABLE).where({ id }).update({ refresh_token: refreshToken });
}

module.exports = {
  findById,
  findByEmail,
  findByPhone,
  create,
  update,
  remove,
  findAll,
  count,
  findByRefreshToken,
  updateRefreshToken,
};
