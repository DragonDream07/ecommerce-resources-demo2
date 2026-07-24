const { body, param, validationResult } = require('express-validator');

// ---------------------------------------------------------------------------
// Helper: run validation and return 400 on failure
// ---------------------------------------------------------------------------
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// ---------------------------------------------------------------------------
// Validate advance-order payload
// POST /orders/:orderId/advance
// ---------------------------------------------------------------------------
const validateAdvanceOrder = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required.')
    .isString()
    .withMessage('Order ID must be a string.'),

  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isString()
    .withMessage('Status must be a string.')
    .isIn(['confirmed', 'processing', 'shipped', 'delivered', 'refunded'])
    .withMessage(
      'Status must be one of: confirmed, processing, shipped, delivered, refunded.'
    ),

  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string.')
    .isLength({ max: 1000 })
    .withMessage('Note must not exceed 1000 characters.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Validate cancel-order payload
// POST /orders/:orderId/cancel
// ---------------------------------------------------------------------------
const validateCancelOrder = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required.')
    .isString()
    .withMessage('Order ID must be a string.'),

  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string.')
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Validate return-request payload
// POST /orders/:orderId/return-requests
// ---------------------------------------------------------------------------
const validateReturnRequest = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required.')
    .isString()
    .withMessage('Order ID must be a string.'),

  body('reason')
    .notEmpty()
    .withMessage('Reason is required.')
    .isString()
    .withMessage('Reason must be a string.')
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters.'),

  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array.'),

  body('items.*.productId')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each return item must include a productId.')
    .isString()
    .withMessage('Product ID must be a string.'),

  body('items.*.quantity')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each return item must include a quantity.')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer.'),

  handleValidationErrors,
];

module.exports = {
  validateAdvanceOrder,
  validateCancelOrder,
  validateReturnRequest,
};
