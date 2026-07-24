/**
 * Roles Service
 * Provides RBAC role CRUD operations and user-role association logic.
 *
 * NOTE: This implementation uses in-memory stores as a reference skeleton.
 * Replace the store operations with your actual database/repository calls.
 */

// In-memory stores (replace with DB repository calls)
let rolesStore = [];
let userRolesStore = []; // { userId, roleId }
let nextRoleId = 1;

/**
 * Retrieves all roles.
 * @returns {Promise<Array>}
 */
async function getAllRoles() {
  return rolesStore.slice();
}

/**
 * Retrieves a single role by ID.
 * @param {string|number} id
 * @returns {Promise<Object|null>}
 */
async function getRoleById(id) {
  const role = rolesStore.find((r) => String(r.id) === String(id));
  return role || null;
}

/**
 * Creates a new role.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} [params.description]
 * @returns {Promise<Object>}
 */
async function createRole({ name, description = '' }) {
  const existing = rolesStore.find(
    (r) => r.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    const error = new Error('A role with this name already exists.');
    error.statusCode = 409;
    throw error;
  }
  const role = {
    id: nextRoleId++,
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rolesStore.push(role);
  return role;
}

/**
 * Updates an existing role.
 * @param {string|number} id
 * @param {Object} params
 * @param {string} [params.name]
 * @param {string} [params.description]
 * @returns {Promise<Object|null>}
 */
async function updateRole(id, { name, description }) {
  const index = rolesStore.findIndex((r) => String(r.id) === String(id));
  if (index === -1) {
    return null;
  }
  if (name) {
    const duplicate = rolesStore.find(
      (r) => r.name.toLowerCase() === name.toLowerCase() && String(r.id) !== String(id)
    );
    if (duplicate) {
      const error = new Error('A role with this name already exists.');
      error.statusCode = 409;
      throw error;
    }
    rolesStore[index].name = name;
  }
  if (description !== undefined) {
    rolesStore[index].description = description;
  }
  rolesStore[index].updatedAt = new Date().toISOString();
  return rolesStore[index];
}

/**
 * Deletes a role and all associated user-role assignments.
 * @param {string|number} id
 * @returns {Promise<boolean>}
 */
async function deleteRole(id) {
  const index = rolesStore.findIndex((r) => String(r.id) === String(id));
  if (index === -1) {
    return false;
  }
  rolesStore.splice(index, 1);
  // Remove all user-role assignments for this role
  userRolesStore = userRolesStore.filter((ur) => String(ur.roleId) !== String(id));
  return true;
}

/**
 * Returns all users assigned to a given role.
 * @param {string|number} roleId
 * @returns {Promise<Array>}
 */
async function getUsersByRole(roleId) {
  const assignments = userRolesStore.filter(
    (ur) => String(ur.roleId) === String(roleId)
  );
  return assignments.map((ur) => ({ userId: ur.userId }));
}

/**
 * Returns all roles assigned to a given user.
 * @param {string|number} userId
 * @returns {Promise<Array>}
 */
async function getRolesByUser(userId) {
  const assignments = userRolesStore.filter(
    (ur) => String(ur.userId) === String(userId)
  );
  const roleIds = assignments.map((ur) => ur.roleId);
  return rolesStore.filter((r) => roleIds.includes(r.id));
}

/**
 * Assigns a role to a user.
 * @param {Object} params
 * @param {string|number} params.userId
 * @param {string|number} params.roleId
 * @returns {Promise<Object>}
 */
async function assignRoleToUser({ userId, roleId }) {
  const role = await getRoleById(roleId);
  if (!role) {
    const error = new Error('Role not found.');
    error.statusCode = 404;
    throw error;
  }
  const existing = userRolesStore.find(
    (ur) => String(ur.userId) === String(userId) && String(ur.roleId) === String(roleId)
  );
  if (existing) {
    return existing;
  }
  const assignment = {
    userId: String(userId),
    roleId: String(roleId),
    assignedAt: new Date().toISOString(),
  };
  userRolesStore.push(assignment);
  return assignment;
}

/**
 * Removes a role from a user.
 * @param {Object} params
 * @param {string|number} params.userId
 * @param {string|number} params.roleId
 * @returns {Promise<boolean>}
 */
async function unassignRoleFromUser({ userId, roleId }) {
  const index = userRolesStore.findIndex(
    (ur) => String(ur.userId) === String(userId) && String(ur.roleId) === String(roleId)
  );
  if (index === -1) {
    return false;
  }
  userRolesStore.splice(index, 1);
  return true;
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUsersByRole,
  getRolesByUser,
  assignRoleToUser,
  unassignRoleFromUser,
};
