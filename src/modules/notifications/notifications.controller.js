const notificationsService = require('./notifications.service');

/**
 * GET /notifications
 * Returns paginated list of notifications for the authenticated user.
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unread: unread !== undefined ? unread === 'true' : undefined,
    };

    const result = await notificationsService.getNotificationsForUser(userId, options);

    return res.status(200).json({
      success: true,
      data: result.notifications,
      meta: {
        total: result.total,
        unreadCount: result.unreadCount,
        page: options.page,
        limit: options.limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /notifications/:id
 * Returns a single notification by ID.
 */
async function getNotificationById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationsService.getNotificationById(id, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /notifications/read-all
 * Marks all notifications for the authenticated user as read.
 */
async function markAllRead(req, res, next) {
  try {
    const userId = req.user.id;

    const updatedCount = await notificationsService.markAllRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      data: { updatedCount },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read.
 */
async function markOneRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationsService.markOneRead(id, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  getNotificationById,
  markAllRead,
  markOneRead,
};
