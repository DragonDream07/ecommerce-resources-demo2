const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

// GET /notifications - get all notifications for current user
router.get('/', notificationsController.getNotifications);

// GET /notifications/:id - get single notification
router.get('/:id', notificationsController.getNotificationById);

// PATCH /notifications/read-all - mark all notifications as read
router.patch('/read-all', notificationsController.markAllRead);

// PATCH /notifications/:id/read - mark single notification as read
router.patch('/:id/read', notificationsController.markOneRead);

module.exports = router;
