const checkoutService = require('./checkout.service');

/**
 * POST /checkout/start
 * Initiates a checkout session for authenticated or guest users.
 */
async function startCheckout(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const guestEmail = req.body.guestEmail || null;
    const { cartId } = req.body;

    const session = await checkoutService.initiateCheckout({ userId, guestEmail, cartId });

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /checkout/address
 * Submits and validates the shipping/billing address for the checkout session.
 */
async function submitAddress(req, res, next) {
  try {
    const { checkoutSessionId, shippingAddress, billingAddress, useShippingAsBilling } = req.body;

    const result = await checkoutService.submitAddress({
      checkoutSessionId,
      shippingAddress,
      billingAddress,
      useShippingAsBilling,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /checkout/review
 * Returns a summary of the checkout session for user review before placing the order.
 */
async function reviewOrder(req, res, next) {
  try {
    const checkoutSessionId = req.query.checkoutSessionId;

    if (!checkoutSessionId) {
      return res.status(400).json({
        success: false,
        message: 'checkoutSessionId query parameter is required.',
      });
    }

    const review = await checkoutService.getOrderReview({ checkoutSessionId });

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /checkout/place-order
 * Confirms stock, finalises promotions, creates the order, and delegates payment intent.
 */
async function placeOrder(req, res, next) {
  try {
    const { checkoutSessionId, paymentMethod, promoCode } = req.body;
    const userId = req.user ? req.user.id : null;

    const order = await checkoutService.placeOrder({
      checkoutSessionId,
      paymentMethod,
      promoCode,
      userId,
    });

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startCheckout,
  submitAddress,
  reviewOrder,
  placeOrder,
};
