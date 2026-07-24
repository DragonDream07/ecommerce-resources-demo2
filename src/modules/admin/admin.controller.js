const adminService = require('./admin.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

/**
 * GET /admin/reports
 * Returns aggregated cross-domain reports for admin dashboard.
 */
async function getReports(req, res) {
  try {
    const reports = await adminService.getReports(req.query);
    return res.status(200).json(successResponse('Reports retrieved successfully', reports));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/permissions
 * Returns all permissions available in the system.
 */
async function getPermissions(req, res) {
  try {
    const permissions = await adminService.getAllPermissions();
    return res.status(200).json(successResponse('Permissions retrieved successfully', permissions));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/roles
 * Returns all roles.
 */
async function getRoles(req, res) {
  try {
    const roles = await adminService.getAllRoles();
    return res.status(200).json(successResponse('Roles retrieved successfully', roles));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * POST /admin/roles
 * Creates a new role.
 */
async function createRole(req, res) {
  try {
    const role = await adminService.createRole(req.body);
    return res.status(201).json(successResponse('Role created successfully', role));
  } catch (err) {
    return res.status(400).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/roles/:roleId
 * Returns a single role by ID.
 */
async function getRoleById(req, res) {
  try {
    const role = await adminService.getRoleById(req.params.roleId);
    if (!role) {
      return res.status(404).json(errorResponse('Role not found'));
    }
    return res.status(200).json(successResponse('Role retrieved successfully', role));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * PUT /admin/roles/:roleId
 * Updates an existing role.
 */
async function updateRole(req, res) {
  try {
    const role = await adminService.updateRole(req.params.roleId, req.body);
    if (!role) {
      return res.status(404).json(errorResponse('Role not found'));
    }
    return res.status(200).json(successResponse('Role updated successfully', role));
  } catch (err) {
    return res.status(400).json(errorResponse(err.message));
  }
}

/**
 * DELETE /admin/roles/:roleId
 * Deletes a role by ID.
 */
async function deleteRole(req, res) {
  try {
    await adminService.deleteRole(req.params.roleId);
    return res.status(200).json(successResponse('Role deleted successfully', null));
  } catch (err) {
    if (err.message === 'Role not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/roles/:roleId/permissions
 * Returns permissions assigned to a role.
 */
async function getRolePermissions(req, res) {
  try {
    const permissions = await adminService.getRolePermissions(req.params.roleId);
    return res.status(200).json(successResponse('Role permissions retrieved successfully', permissions));
  } catch (err) {
    if (err.message === 'Role not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * POST /admin/roles/:roleId/permissions
 * Assigns a permission to a role.
 */
async function addPermissionToRole(req, res) {
  try {
    const result = await adminService.addPermissionToRole(req.params.roleId, req.body);
    return res.status(201).json(successResponse('Permission assigned to role successfully', result));
  } catch (err) {
    if (err.message === 'Role not found' || err.message === 'Permission not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    return res.status(400).json(errorResponse(err.message));
  }
}

/**
 * DELETE /admin/roles/:roleId/permissions/:permissionId
 * Removes a permission from a role.
 */
async function removePermissionFromRole(req, res) {
  try {
    await adminService.removePermissionFromRole(req.params.roleId, req.params.permissionId);
    return res.status(200).json(successResponse('Permission removed from role successfully', null));
  } catch (err) {
    if (err.message === 'Role not found' || err.message === 'Permission not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/serviceable-pin-codes
 * Returns all serviceable pin codes.
 */
async function getServiceablePinCodes(req, res) {
  try {
    const pinCodes = await adminService.getAllServiceablePinCodes();
    return res.status(200).json(successResponse('Serviceable pin codes retrieved successfully', pinCodes));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * POST /admin/serviceable-pin-codes
 * Creates a new serviceable pin code.
 */
async function createServiceablePinCode(req, res) {
  try {
    const pinCode = await adminService.createServiceablePinCode(req.body);
    return res.status(201).json(successResponse('Serviceable pin code created successfully', pinCode));
  } catch (err) {
    return res.status(400).json(errorResponse(err.message));
  }
}

/**
 * PUT /admin/serviceable-pin-codes/:pinCodeId
 * Updates an existing serviceable pin code.
 */
async function updateServiceablePinCode(req, res) {
  try {
    const pinCode = await adminService.updateServiceablePinCode(req.params.pinCodeId, req.body);
    if (!pinCode) {
      return res.status(404).json(errorResponse('Serviceable pin code not found'));
    }
    return res.status(200).json(successResponse('Serviceable pin code updated successfully', pinCode));
  } catch (err) {
    return res.status(400).json(errorResponse(err.message));
  }
}

/**
 * DELETE /admin/serviceable-pin-codes/:pinCodeId
 * Deletes a serviceable pin code.
 */
async function deleteServiceablePinCode(req, res) {
  try {
    await adminService.deleteServiceablePinCode(req.params.pinCodeId);
    return res.status(200).json(successResponse('Serviceable pin code deleted successfully', null));
  } catch (err) {
    if (err.message === 'Serviceable pin code not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

module.exports = {
  getReports,
  getPermissions,
  getRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getServiceablePinCodes,
  createServiceablePinCode,
  updateServiceablePinCode,
  deleteServiceablePinCode,
};
