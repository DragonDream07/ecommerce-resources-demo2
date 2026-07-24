const db = require('../knex');

const ROLES_TABLE = 'roles';
const USER_ROLES_TABLE = 'user_roles';

async function findRoleById(id) {
  return db(ROLES_TABLE).where({ id }).first();
}

async function findRoleByName(name) {
  return db(ROLES_TABLE).where({ name }).first();
}

async function getAllRoles() {
  return db(ROLES_TABLE).select('*');
}

async function createRole(data) {
  const [id] = await db(ROLES_TABLE).insert(data);
  return findRoleById(id);
}

async function updateRole(id, data) {
  await db(ROLES_TABLE).where({ id }).update(data);
  return findRoleById(id);
}

async function deleteRole(id) {
  return db(ROLES_TABLE).where({ id }).del();
}

async function assignRoleToUser(userId, roleId) {
  const exists = await db(USER_ROLES_TABLE).where({ user_id: userId, role_id: roleId }).first();
  if (exists) return exists;
  const [id] = await db(USER_ROLES_TABLE).insert({ user_id: userId, role_id: roleId });
  return db(USER_ROLES_TABLE).where({ id }).first();
}

async function removeRoleFromUser(userId, roleId) {
  return db(USER_ROLES_TABLE).where({ user_id: userId, role_id: roleId }).del();
}

async function getRolesForUser(userId) {
  return db(USER_ROLES_TABLE)
    .join(ROLES_TABLE, `${USER_ROLES_TABLE}.role_id`, `${ROLES_TABLE}.id`)
    .where(`${USER_ROLES_TABLE}.user_id`, userId)
    .select(`${ROLES_TABLE}.*`);
}

async function getUsersForRole(roleId) {
  return db(USER_ROLES_TABLE)
    .where({ role_id: roleId })
    .select('user_id');
}

async function removeAllRolesFromUser(userId) {
  return db(USER_ROLES_TABLE).where({ user_id: userId }).del();
}

module.exports = {
  findRoleById,
  findRoleByName,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUser,
  removeRoleFromUser,
  getRolesForUser,
  getUsersForRole,
  removeAllRolesFromUser,
};
