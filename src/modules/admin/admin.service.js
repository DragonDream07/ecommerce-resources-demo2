const db = require('../../config/db');

/**
 * Aggregates cross-domain reports for the admin dashboard.
 * Delegates to domain-level DB queries.
 */
async function getReports(filters = {}) {
  const [userStats] = await db.query(
    `SELECT COUNT(*) AS total_users FROM users`
  );
  const [orderStats] = await db.query(
    `SELECT COUNT(*) AS total_orders, SUM(total_amount) AS total_revenue FROM orders`
  );
  const [productStats] = await db.query(
    `SELECT COUNT(*) AS total_products FROM products`
  );
  const [roleStats] = await db.query(
    `SELECT COUNT(*) AS total_roles FROM roles`
  );
  const [pinCodeStats] = await db.query(
    `SELECT COUNT(*) AS total_serviceable_pin_codes FROM serviceable_pin_codes`
  );

  return {
    users: userStats[0],
    orders: orderStats[0],
    products: productStats[0],
    roles: roleStats[0],
    serviceablePinCodes: pinCodeStats[0],
  };
}

/**
 * Returns all permissions from the permissions table.
 */
async function getAllPermissions() {
  const [rows] = await db.query(
    `SELECT id, name, description, created_at, updated_at FROM permissions ORDER BY name ASC`
  );
  return rows;
}

/**
 * Returns all roles.
 */
async function getAllRoles() {
  const [rows] = await db.query(
    `SELECT id, name, description, created_at, updated_at FROM roles ORDER BY name ASC`
  );
  return rows;
}

/**
 * Creates a new role.
 */
async function createRole(data) {
  const { name, description } = data;
  if (!name) {
    throw new Error('Role name is required');
  }
  const [result] = await db.query(
    `INSERT INTO roles (name, description) VALUES (?, ?)`,
    [name, description || null]
  );
  const [rows] = await db.query(
    `SELECT id, name, description, created_at, updated_at FROM roles WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
}

/**
 * Returns a single role by ID.
 */
async function getRoleById(roleId) {
  const [rows] = await db.query(
    `SELECT id, name, description, created_at, updated_at FROM roles WHERE id = ?`,
    [roleId]
  );
  return rows[0] || null;
}

/**
 * Updates an existing role.
 */
async function updateRole(roleId, data) {
  const existing = await getRoleById(roleId);
  if (!existing) {
    return null;
  }
  const name = data.name !== undefined ? data.name : existing.name;
  const description = data.description !== undefined ? data.description : existing.description;
  await db.query(
    `UPDATE roles SET name = ?, description = ? WHERE id = ?`,
    [name, description, roleId]
  );
  return getRoleById(roleId);
}

/**
 * Deletes a role by ID.
 */
async function deleteRole(roleId) {
  const existing = await getRoleById(roleId);
  if (!existing) {
    throw new Error('Role not found');
  }
  await db.query(`DELETE FROM roles WHERE id = ?`, [roleId]);
}

/**
 * Returns permissions assigned to a specific role.
 */
async function getRolePermissions(roleId) {
  const existing = await getRoleById(roleId);
  if (!existing) {
    throw new Error('Role not found');
  }
  const [rows] = await db.query(
    `SELECT p.id, p.name, p.description, p.created_at, p.updated_at
     FROM permissions p
     INNER JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = ?
     ORDER BY p.name ASC`,
    [roleId]
  );
  return rows;
}

/**
 * Assigns a permission to a role.
 */
async function addPermissionToRole(roleId, data) {
  const { permissionId } = data;
  const role = await getRoleById(roleId);
  if (!role) {
    throw new Error('Role not found');
  }
  const [permRows] = await db.query(
    `SELECT id FROM permissions WHERE id = ?`,
    [permissionId]
  );
  if (!permRows[0]) {
    throw new Error('Permission not found');
  }
  const [existing] = await db.query(
    `SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?`,
    [roleId, permissionId]
  );
  if (existing[0]) {
    throw new Error('Permission already assigned to role');
  }
  await db.query(
    `INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
    [roleId, permissionId]
  );
  return { roleId: Number(roleId), permissionId: Number(permissionId) };
}

/**
 * Removes a permission from a role.
 */
async function removePermissionFromRole(roleId, permissionId) {
  const role = await getRoleById(roleId);
  if (!role) {
    throw new Error('Role not found');
  }
  const [permRows] = await db.query(
    `SELECT id FROM permissions WHERE id = ?`,
    [permissionId]
  );
  if (!permRows[0]) {
    throw new Error('Permission not found');
  }
  await db.query(
    `DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?`,
    [roleId, permissionId]
  );
}

/**
 * Returns all serviceable pin codes.
 */
async function getAllServiceablePinCodes() {
  const [rows] = await db.query(
    `SELECT id, pin_code, city, state, is_active, created_at, updated_at
     FROM serviceable_pin_codes
     ORDER BY pin_code ASC`
  );
  return rows;
}

/**
 * Creates a new serviceable pin code.
 */
async function createServiceablePinCode(data) {
  const { pin_code, city, state, is_active } = data;
  if (!pin_code) {
    throw new Error('Pin code is required');
  }
  const [result] = await db.query(
    `INSERT INTO serviceable_pin_codes (pin_code, city, state, is_active) VALUES (?, ?, ?, ?)`,
    [pin_code, city || null, state || null, is_active !== undefined ? is_active : true]
  );
  const [rows] = await db.query(
    `SELECT id, pin_code, city, state, is_active, created_at, updated_at
     FROM serviceable_pin_codes WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
}

/**
 * Returns a single serviceable pin code by ID.
 */
async function getServiceablePinCodeById(pinCodeId) {
  const [rows] = await db.query(
    `SELECT id, pin_code, city, state, is_active, created_at, updated_at
     FROM serviceable_pin_codes WHERE id = ?`,
    [pinCodeId]
  );
  return rows[0] || null;
}

/**
 * Updates an existing serviceable pin code.
 */
async function updateServiceablePinCode(pinCodeId, data) {
  const existing = await getServiceablePinCodeById(pinCodeId);
  if (!existing) {
    return null;
  }
  const pin_code = data.pin_code !== undefined ? data.pin_code : existing.pin_code;
  const city = data.city !== undefined ? data.city : existing.city;
  const state = data.state !== undefined ? data.state : existing.state;
  const is_active = data.is_active !== undefined ? data.is_active : existing.is_active;
  await db.query(
    `UPDATE serviceable_pin_codes SET pin_code = ?, city = ?, state = ?, is_active = ? WHERE id = ?`,
    [pin_code, city, state, is_active, pinCodeId]
  );
  return getServiceablePinCodeById(pinCodeId);
}

/**
 * Deletes a serviceable pin code by ID.
 */
async function deleteServiceablePinCode(pinCodeId) {
  const existing = await getServiceablePinCodeById(pinCodeId);
  if (!existing) {
    throw new Error('Serviceable pin code not found');
  }
  await db.query(`DELETE FROM serviceable_pin_codes WHERE id = ?`, [pinCodeId]);
}

module.exports = {
  getReports,
  getAllPermissions,
  getAllRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getAllServiceablePinCodes,
  createServiceablePinCode,
  getServiceablePinCodeById,
  updateServiceablePinCode,
  deleteServiceablePinCode,
};
