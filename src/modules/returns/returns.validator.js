const Joi = require('joi');
const { validationMiddleware } = require('../../middleware/validation');

const returnRequestSchema = Joi.object({
  reason: Joi.string().trim().min(10).max(1000).required().messages({
    'string.base': 'Reason must be a string.',
    'string.empty': 'Reason is required.',
    'string.min': 'Reason must be at least 10 characters long.',
    'string.max': 'Reason must not exceed 1000 characters.',
    'any.required': 'Reason is required.',
  }),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.string().uuid().required().messages({
          'string.base': 'Product ID must be a string.',
          'string.guid': 'Product ID must be a valid UUID.',
          'any.required': 'Product ID is required.',
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          'number.base': 'Quantity must be a number.',
          'number.integer': 'Quantity must be an integer.',
          'number.min': 'Quantity must be at least 1.',
          'any.required': 'Quantity is required.',
        }),
      })
    )
    .min(1)
    .optional()
    .messages({
      'array.base': 'Items must be an array.',
      'array.min': 'At least one item must be specified.',
    }),
});

const reviewRequestSchema = Joi.object({
  action: Joi.string().valid('approved', 'rejected').required().messages({
    'string.base': 'Action must be a string.',
    'any.only': 'Action must be one of: approved, rejected.',
    'any.required': 'Action is required.',
  }),
  notes: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.base': 'Notes must be a string.',
    'string.max': 'Notes must not exceed 2000 characters.',
  }),
});

const validateReturnRequest = validationMiddleware(returnRequestSchema);
const validateReviewRequest = validationMiddleware(reviewRequestSchema);

module.exports = {
  validateReturnRequest,
  validateReviewRequest,
};
