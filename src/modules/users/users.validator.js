const Joi = require('joi');

const updateMe = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'First name must not be empty.',
    'string.max': 'First name must not exceed 100 characters.',
  }),
  last_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'Last name must not be empty.',
    'string.max': 'Last name must not exceed 100 characters.',
  }),
  phone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Phone number must be a valid E.164 format.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required.',
    'string.empty': 'Current password must not be empty.',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'any.required': 'New password is required.',
    'string.empty': 'New password must not be empty.',
    'string.min': 'New password must be at least 8 characters long.',
    'string.max': 'New password must not exceed 128 characters.',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.required': 'Password confirmation is required.',
    'any.only': 'Passwords do not match.',
  }),
});

const adminUpdateUser = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'First name must not be empty.',
    'string.max': 'First name must not exceed 100 characters.',
  }),
  last_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'Last name must not be empty.',
    'string.max': 'Last name must not exceed 100 characters.',
  }),
  phone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Phone number must be a valid E.164 format.',
  }),
  role: Joi.string().valid('admin', 'customer', 'staff').optional().messages({
    'any.only': 'Role must be one of admin, customer, or staff.',
  }),
  is_active: Joi.boolean().optional().messages({
    'boolean.base': 'is_active must be a boolean value.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

module.exports = {
  updateMe,
  changePassword,
  adminUpdateUser,
};
