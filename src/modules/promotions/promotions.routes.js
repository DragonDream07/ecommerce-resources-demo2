const express = require('express');
const router = express.Router();
const promotionsController = require('./promotions.controller');
const { validatePromoCode, validateAdminPromoCode } = require('./promotions.validator');
const { validate } = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');

// Public: validate a promo code
router.post(
  '/validate',
  validate(validatePromoCode),
  promotionsController.validatePromoCode
);

// Admin: CRUD for promo codes
router.get(
  '/admin/promo-codes',
  authenticate,
  authorize('admin'),
  promotionsController.getAllPromoCodes
);

router.post(
  '/admin/promo-codes',
  authenticate,
  authorize('admin'),
  validate(validateAdminPromoCode),
  promotionsController.createPromoCode
);

router.get(
  '/admin/promo-codes/:id',
  authenticate,
  authorize('admin'),
  promotionsController.getPromoCodeById
);

router.put(
  '/admin/promo-codes/:id',
  authenticate,
  authorize('admin'),
  validate(validateAdminPromoCode),
  promotionsController.updatePromoCode
);

router.delete(
  '/admin/promo-codes/:id',
  authenticate,
  authorize('admin'),
  promotionsController.deletePromoCode
);

module.exports = router;
