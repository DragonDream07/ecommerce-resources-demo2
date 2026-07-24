const { body, validationResult } = require('express-validator');

/**
 * Returns a middleware that collects validation errors and short-circuits
 * with a 422 response if any are present.
 */
function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          success: false,
          errors: errors.array().map((e) => ({ field: e.param, message: e.msg })),
        });
      }
      next();
    },
  ];
}

// ---------------------------------------------------------------------------
// POST /checkout/start
// ---------------------------------------------------------------------------
const validateStartCheckout = validate([
  body('cartId')
    .notEmpty()
    .withMessage('Cart ID is required.'),

  body('guestEmail')
    .optional()
    .isEmail()
    .withMessage('Guest email must be a valid email address.'),
]);

// ---------------------------------------------------------------------------
// POST /checkout/address
// ---------------------------------------------------------------------------
const addressFields = (prefix) => [
  body(`${prefix}.fullName`)
    .notEmpty()
    .withMessage(`${prefix}.fullName is required.`),

  body(`${prefix}.addressLine1`)
    .notEmpty()
    .withMessage(`${prefix}.addressLine1 is required.`),

  body(`${prefix}.addressLine2`)
    .optional(),

  body(`${prefix}.city`)
    .notEmpty()
    .withMessage(`${prefix}.city is required.`),

  body(`${prefix}.state`)
    .notEmpty()
    .withMessage(`${prefix}.state is required.`),

  body(`${prefix}.postalCode`)
    .notEmpty()
    .withMessage(`${prefix}.postalCode is required.`)
    .isPostalCode('any')
    .withMessage(`${prefix}.postalCode must be a valid postal code.`),

  body(`${prefix}.country`)
    .notEmpty()
    .withMessage(`${prefix}.country is required.`)
    .isISO31661Alpha2()
    .withMessage(`${prefix}.country must be a valid ISO 3166-1 alpha-2 country code.`),

  body(`${prefix}.phone`)
    .optional()
    .isMobilePhone('any')
    .withMessage(`${prefix}.phone must be a valid phone number.`),
];

const validateAddress = validate([
  body('checkoutSessionId')
    .notEmpty()
    .withMessage('Checkout session ID is required.'),

  body('useShippingAsBilling')
    .optional()
    .isBoolean()
    .withMessage('useShippingAsBilling must be a boolean.'),

  ...addressFields('shippingAddress'),

  body('billingAddress')
    .if(body('useShippingAsBilling').not().equals('true'))
    .if(body('useShippingAsBilling').not().equals(true))
    .custom((value, { req }) => {
      if (!req.body.useShippingAsBilling && !value) {
        throw new Error('Billing address is required when useShippingAsBilling is false.');
      }
      return true;
    }),
]);

// ---------------------------------------------------------------------------
// POST /checkout/place-order
// ---------------------------------------------------------------------------
const validatePlaceOrder = validate([
  body('checkoutSessionId')
    .notEmpty()
    .withMessage('Checkout session ID is required.'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required.')
    .isIn(['card', 'paypal', 'bank_transfer', 'wallet'])
    .withMessage('Payment method must be one of: card, paypal, bank_transfer, wallet.'),

  body('promoCode')
    .optional()
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Promo code must be between 1 and 50 characters.'),
]);

module.exports = {
  validateStartCheckout,
  validateAddress,
  validatePlaceOrder,
};
