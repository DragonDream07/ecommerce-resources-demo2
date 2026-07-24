const ordersService = require('./orders.service');

/**
 * GET /orders
 * List orders for the authenticated user (or all orders for admin).
 */
async function listOrders(req, res, next) {
  try {
    const filters = {
      userId: req.user && !req.user.isAdmin ? req.user.id : undefined,
      status: req.query.status,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
    };
    const result = await ordersService.listOrders(filters);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /orders/:orderId
 * Retrieve a single order by ID.
 */
async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await ordersService.getOrderById(orderId, req.user);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.status(200).json(order);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /orders/:orderId/advance
 * Advance the order to the next status (admin).
 */
async function advanceOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const updated = await ordersService.advanceOrderStatus(orderId, status, note, req.user);
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /orders/:orderId/cancel
 * Cancel an order.
 */
async function cancelOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const updated = await ordersService.cancelOrder(orderId, reason, req.user);
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /orders/:orderId/return-requests
 * Submit a return request for an order.
 */
async function createReturnRequest(req, res, next) {
  try {
    const { orderId } = req.params;
    const payload = req.body;
    const result = await ordersService.createReturnRequest(orderId, payload, req.user);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /orders/:orderId/tracking
 * Retrieve tracking information for an order.
 */
async function getOrderTracking(req, res, next) {
  try {
    const { orderId } = req.params;
    const tracking = await ordersService.getOrderTracking(orderId, req.user);
    if (!tracking) {
      return res.status(404).json({ error: 'Tracking information not found.' });
    }
    return res.status(200).json(tracking);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /orders/:orderId/timeline
 * Retrieve the status timeline for an order.
 */
async function getOrderTimeline(req, res, next) {
  try {
    const { orderId } = req.params;
    const timeline = await ordersService.getOrderTimeline(orderId, req.user);
    return res.status(200).json(timeline);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /orders/:orderId/refunds
 * Retrieve refunds associated with an order.
 */
async function getOrderRefunds(req, res, next) {
  try {
    const { orderId } = req.params;
    const refunds = await ordersService.getOrderRefunds(orderId, req.user);
    return res.status(200).json(refunds);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOrders,
  getOrder,
  advanceOrder,
  cancelOrder,
  createReturnRequest,
  getOrderTracking,
  getOrderTimeline,
  getOrderRefunds,
};
