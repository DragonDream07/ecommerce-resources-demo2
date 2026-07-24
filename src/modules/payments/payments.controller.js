const paymentsService = require('./payments.service');

/**
 * POST /payments/initiate
 * Initiates a new payment attempt.
 */
async function initiatePayment(req, res, next) {
  try {
    const result = await paymentsService.initiatePayment(req.body);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/callback
 * Handles payment provider callback (confirm flow).
 */
async function handleCallback(req, res, next) {
  try {
    const result = await paymentsService.processCallback(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/webhook
 * Handles raw webhook events from payment provider.
 */
async function handleWebhook(req, res, next) {
  try {
    const result = await paymentsService.processWebhook(req.body, req.headers);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/:paymentId
 * Retrieves a payment by its ID.
 */
async function getPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const result = await paymentsService.getPaymentById(paymentId);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/:paymentId/retry
 * Retries a failed payment attempt.
 */
async function retryPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const result = await paymentsService.retryPayment(paymentId, req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initiatePayment,
  handleCallback,
  handleWebhook,
  getPayment,
  retryPayment,
};
