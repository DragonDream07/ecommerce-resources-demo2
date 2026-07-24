const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const usersValidator = require('./users.validator');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

// Current user routes
router.get('/me', authenticate, usersController.getMe);
router.patch('/me', authenticate, validate(usersValidator.updateMe), usersController.updateMe);
router.post('/me/change-password', authenticate, validate(usersValidator.changePassword), usersController.changePassword);

// Admin user management routes
router.get('/', authenticate, authorize('admin'), usersController.getAllUsers);
router.get('/:userId', authenticate, authorize('admin'), usersController.getUserById);
router.patch('/:userId', authenticate, authorize('admin'), validate(usersValidator.adminUpdateUser), usersController.updateUser);
router.delete('/:userId', authenticate, authorize('admin'), usersController.deleteUser);

module.exports = router;
