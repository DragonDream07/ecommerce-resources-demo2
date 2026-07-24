const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to collect and return validation errors.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({
        field: e.param,
        message: e.msg,
      })),
    });
  }
  next();
}

/**
 * Validation rules for POST /payments/initiate
 */
const validateInitiatePayment = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required.')
    .isNumeric()
    .withMessage('Amount must be a numeric value.')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than zero.');
      }
      return true;
    }),

  body('currency')
    .notEmpty()
    .withMessage('Currency is required.')
    .isString()
    .withMessage('Currency must be a string.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a valid 3-letter ISO 4217 code.')
    .toUpperCase(),

  body('reference')
    .optional()
    .isString()
    .withMessage('Reference must be a string.')
    .isLength({ max: 255 })
    .withMessage('Reference must not exceed 255 characters.'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object.'),

  body('returnUrl')
    .optional()
    .isURL()
    .withMessage('Return URL must be a valid URL.'),

  handleValidationErrors,
];

/**
 * Validation rules for POST /payments/callback
 */
const validateCallback = [
  body('providerReference')
    .optional()
    .isString()
    .withMessage('Provider reference must be a string.'),

  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string.'),

  handleValidationErrors,
];

/**
 * Validation rules for POST /payments/:paymentId/retry
 */
const validateRetry = [
  param('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required.')
    .isUUID()
    .withMessage('Payment ID must be a valid UUID.'),

  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a numeric value.')
    .custom((value) => {
      if (value !== undefined && parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than zero.');
      }
      return true;
    }),

  body('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a valid 3-letter ISO 4217 code.')
    .toUpperCase(),

  handleValidationErrors,
];

module.exports = {
  validateInitiatePayment,
  validateCallback,
  validateRetry,
};
