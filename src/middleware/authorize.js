'use strict';

/**
 * RBAC middleware factory.
 * Returns a middleware that checks whether req.user possesses the required role.
 *
 * @param {string|string[]} role - A single role or an array of accepted roles.
 * @returns {Function} Express middleware
 */
function authorize(role) {
  const acceptedRoles = Array.isArray(role) ? role : [role];

  return function rbacMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.role].filter(Boolean);

    const hasRole = acceptedRoles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        status: 403,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.',
      });
    }

    return next();
  };
}

module.exports = authorize;
