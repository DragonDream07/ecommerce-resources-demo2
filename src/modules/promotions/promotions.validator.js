const Joi = require('joi');

/**
 * Schema for validating a promo code (public endpoint).
 */
const validatePromoCode = Joi.object({
  code: Joi.string().trim().uppercase().min(1).max(50).required().messages({
    'string.base': 'Promo code must be a string.',
    'string.empty': 'Promo code is required.',
    'string.min': 'Promo code must be at least 1 character.',
    'string.max': 'Promo code must not exceed 50 characters.',
    'any.required': 'Promo code is required.',
  }),
  userId: Joi.string().uuid().optional().messages({
    'string.base': 'User ID must be a string.',
    'string.guid': 'User ID must be a valid UUID.',
  }),
  orderTotal: Joi.number().positive().required().messages({
    'number.base': 'Order total must be a number.',
    'number.positive': 'Order total must be a positive number.',
    'any.required': 'Order total is required.',
  }),
});

/**
 * Schema for admin promo code create/update.
 */
const validateAdminPromoCode = Joi.object({
  code: Joi.string().trim().uppercase().min(1).max(50).required().messages({
    'string.base': 'Promo code must be a string.',
    'string.empty': 'Promo code is required.',
    'string.min': 'Promo code must be at least 1 character.',
    'string.max': 'Promo code must not exceed 50 characters.',
    'any.required': 'Promo code is required.',
  }),
  discount_type: Joi.string().valid('percentage', 'fixed').required().messages({
    'string.base': 'Discount type must be a string.',
    'any.only': 'Discount type must be either percentage or fixed.',
    'any.required': 'Discount type is required.',
  }),
  discount_value: Joi.number().positive().required().messages({
    'number.base': 'Discount value must be a number.',
    'number.positive': 'Discount value must be a positive number.',
    'any.required': 'Discount value is required.',
  }),
  min_order_total: Joi.number().min(0).optional().allow(null).messages({
    'number.base': 'Minimum order total must be a number.',
    'number.min': 'Minimum order total must be at least 0.',
  }),
  max_uses: Joi.number().integer().min(1).optional().allow(null).messages({
    'number.base': 'Max uses must be a number.',
    'number.integer': 'Max uses must be an integer.',
    'number.min': 'Max uses must be at least 1.',
  }),
  max_uses_per_user: Joi.number().integer().min(1).optional().allow(null).messages({
    'number.base': 'Max uses per user must be a number.',
    'number.integer': 'Max uses per user must be an integer.',
    'number.min': 'Max uses per user must be at least 1.',
  }),
  valid_from: Joi.date().iso().optional().allow(null).messages({
    'date.base': 'Valid from must be a valid date.',
    'date.format': 'Valid from must be an ISO 8601 date.',
  }),
  valid_until: Joi.date().iso().greater(Joi.ref('valid_from')).optional().allow(null).messages({
    'date.base': 'Valid until must be a valid date.',
    'date.format': 'Valid until must be an ISO 8601 date.',
    'date.greater': 'Valid until must be after valid from.',
  }),
  status: Joi.string().valid('active', 'inactive', 'expired').optional().messages({
    'string.base': 'Status must be a string.',
    'any.only': 'Status must be one of active, inactive, or expired.',
  }),
});

module.exports = {
  validatePromoCode,
  validateAdminPromoCode,
};
