const db = require('../knex');

const TABLE = 'notifications';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findByUserId(userId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
  const query = db(TABLE).where({ user_id: userId }).orderBy('created_at', 'desc');
  if (unreadOnly) query.where({ is_read: false });
  return query.limit(limit).offset(offset);
}

async function create(data) {
  const [id] = await db(TABLE).insert(data);
  return findById(id);
}

async function markAsRead(id) {
  await db(TABLE).where({ id }).update({ is_read: true });
  return findById(id);
}

async function markAllAsRead(userId) {
  return db(TABLE).where({ user_id: userId, is_read: false }).update({ is_read: true });
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

async function countUnread(userId) {
  const [{ total }] = await db(TABLE).where({ user_id: userId, is_read: false }).count('id as total');
  return Number(total);
}

async function deleteOlderThan(date) {
  return db(TABLE).where('created_at', '<', date).del();
}

module.exports = {
  findById,
  findByUserId,
  create,
  markAsRead,
  markAllAsRead,
  remove,
  countUnread,
  deleteOlderThan,
};
