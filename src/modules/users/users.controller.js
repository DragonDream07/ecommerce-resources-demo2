const usersService = require('./users.service');
const { created, ok, noContent } = require('../../utils/response');

/**
 * GET /users/me
 * Returns the profile of the currently authenticated user.
 */
async function getMe(req, res, next) {
  try {
    const user = await usersService.getUserById(req.user.id);
    return ok(res, user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/me
 * Updates the profile of the currently authenticated user.
 */
async function updateMe(req, res, next) {
  try {
    const user = await usersService.updateUser(req.user.id, req.body);
    return ok(res, user);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /users/me/change-password
 * Changes the password of the currently authenticated user.
 */
async function changePassword(req, res, next) {
  try {
    await usersService.changePassword(req.user.id, req.body);
    return ok(res, { message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users
 * Admin: returns a paginated list of all users.
 */
async function getAllUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await usersService.getAllUsers({ page: Number(page), limit: Number(limit), search });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/:userId
 * Admin: returns a single user by ID.
 */
async function getUserById(req, res, next) {
  try {
    const user = await usersService.getUserById(req.params.userId);
    return ok(res, user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/:userId
 * Admin: updates a user by ID (including role assignment).
 */
async function updateUser(req, res, next) {
  try {
    const user = await usersService.updateUser(req.params.userId, req.body);
    return ok(res, user);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /users/:userId
 * Admin: deletes (or deactivates) a user by ID.
 */
async function deleteUser(req, res, next) {
  try {
    await usersService.deleteUser(req.params.userId);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
