const rolesService = require('./roles.service');

/**
 * GET /roles
 * Returns all roles.
 */
async function getAllRoles(req, res, next) {
  try {
    const roles = await rolesService.getAllRoles();
    return res.status(200).json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /roles/:id
 * Returns a single role by ID.
 */
async function getRoleById(req, res, next) {
  try {
    const role = await rolesService.getRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }
    return res.status(200).json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /roles
 * Creates a new role.
 */
async function createRole(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required.' });
    }
    const role = await rolesService.createRole({ name, description });
    return res.status(201).json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /roles/:id
 * Updates an existing role.
 */
async function updateRole(req, res, next) {
  try {
    const { name, description } = req.body;
    const updated = await rolesService.updateRole(req.params.id, { name, description });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /roles/:id
 * Deletes a role.
 */
async function deleteRole(req, res, next) {
  try {
    const deleted = await rolesService.deleteRole(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }
    return res.status(200).json({ success: true, message: 'Role deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /roles/:id/users
 * Returns all users assigned to a role.
 */
async function getUsersByRole(req, res, next) {
  try {
    const users = await rolesService.getUsersByRole(req.params.id);
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /roles/assign
 * Assigns a role to a user.
 * Body: { userId, roleId }
 */
async function assignRoleToUser(req, res, next) {
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json({ success: false, message: 'userId and roleId are required.' });
    }
    const result = await rolesService.assignRoleToUser({ userId, roleId });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /roles/unassign
 * Removes a role from a user.
 * Body: { userId, roleId }
 */
async function unassignRoleFromUser(req, res, next) {
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json({ success: false, message: 'userId and roleId are required.' });
    }
    const result = await rolesService.unassignRoleFromUser({ userId, roleId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'User-role assignment not found.' });
    }
    return res.status(200).json({ success: true, message: 'Role unassigned successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /roles/user/:userId
 * Returns all roles assigned to a specific user.
 */
async function getRolesByUser(req, res, next) {
  try {
    const roles = await rolesService.getRolesByUser(req.params.userId);
    return res.status(200).json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUsersByRole,
  assignRoleToUser,
  unassignRoleFromUser,
  getRolesByUser,
};
