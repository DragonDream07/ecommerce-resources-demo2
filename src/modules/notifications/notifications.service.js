const db = require('../../db');

/**
 * Creates a new notification for a user.
 * Intended to be called by other services.
 *
 * @param {object} params
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.type - Notification type/category
 * @param {string} params.title - Short title
 * @param {string} params.message - Full notification message
 * @param {object} [params.metadata] - Optional extra payload
 * @returns {Promise<object>} Created notification record
 */
async function createNotification({ userId, type, title, message, metadata = null }) {
  const result = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
     RETURNING *`,
    [userId, type, title, message, metadata ? JSON.stringify(metadata) : null]
  );
  return result.rows[0];
}

/**
 * Retrieves paginated notifications for a given user.
 *
 * @param {string} userId
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {boolean|undefined} options.unread - If true, filter to unread only
 * @returns {Promise<{notifications: object[], total: number, unreadCount: number}>}
 */
async function getNotificationsForUser(userId, { page = 1, limit = 20, unread } = {}) {
  const offset = (page - 1) * limit;
  const params = [userId];
  let filterClause = '';

  if (unread === true) {
    filterClause = 'AND is_read = false';
  } else if (unread === false) {
    filterClause = 'AND is_read = true';
  }

  const dataQuery = `
    SELECT *
    FROM notifications
    WHERE user_id = $1
    ${filterClause}
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM notifications
    WHERE user_id = $1
    ${filterClause}
  `;
  const unreadCountQuery = `
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE user_id = $1 AND is_read = false
  `;

  const [dataResult, countResult, unreadResult] = await Promise.all([
    db.query(dataQuery, [userId, limit, offset]),
    db.query(countQuery, [userId]),
    db.query(unreadCountQuery, [userId]),
  ]);

  return {
    notifications: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
    unreadCount: parseInt(unreadResult.rows[0].unread_count, 10),
  };
}

/**
 * Retrieves a single notification by ID, scoped to the given user.
 *
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getNotificationById(notificationId, userId) {
  const result = await db.query(
    `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Returns the count of unread notifications for a user.
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getUnreadCount(userId) {
  const result = await db.query(
    `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return parseInt(result.rows[0].unread_count, 10);
}

/**
 * Marks all notifications for a user as read.
 *
 * @param {string} userId
 * @returns {Promise<number>} Number of records updated
 */
async function markAllRead(userId) {
  const result = await db.query(
    `UPDATE notifications
     SET is_read = true, updated_at = NOW()
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return result.rowCount;
}

/**
 * Marks a single notification as read, scoped to the given user.
 *
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<object|null>} Updated notification or null if not found
 */
async function markOneRead(notificationId, userId) {
  const result = await db.query(
    `UPDATE notifications
     SET is_read = true, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  getNotificationById,
  getUnreadCount,
  markAllRead,
  markOneRead,
};
