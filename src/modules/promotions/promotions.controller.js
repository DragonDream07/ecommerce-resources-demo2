const promotionsService = require('./promotions.service');

/**
 * POST /validate
 * Validate a promo code and return discount info
 */
async function validatePromoCode(req, res, next) {
  try {
    const { code, userId, orderTotal } = req.body;
    const result = await promotionsService.validateAndCalculateDiscount(code, userId, orderTotal);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/promo-codes
 * Retrieve all promo codes
 */
async function getAllPromoCodes(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await promotionsService.getAllPromoCodes({ page: Number(page), limit: Number(limit), status });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/promo-codes/:id
 * Retrieve a single promo code by id
 */
async function getPromoCodeById(req, res, next) {
  try {
    const { id } = req.params;
    const promoCode = await promotionsService.getPromoCodeById(id);
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, data: promoCode });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/promo-codes
 * Create a new promo code
 */
async function createPromoCode(req, res, next) {
  try {
    const payload = req.body;
    const promoCode = await promotionsService.createPromoCode(payload);
    return res.status(201).json({ success: true, data: promoCode });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /admin/promo-codes/:id
 * Update an existing promo code
 */
async function updatePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const payload = req.body;
    const promoCode = await promotionsService.updatePromoCode(id, payload);
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, data: promoCode });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /admin/promo-codes/:id
 * Delete a promo code
 */
async function deletePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await promotionsService.deletePromoCode(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, message: 'Promo code deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validatePromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
