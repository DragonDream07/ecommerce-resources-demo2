const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(422).json({ success: false, errors: messages });
    }
    req.body = value;
    return next();
  };
}

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters.',
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.',
  }),
  firstName: Joi.string().max(100).optional().allow(''),
  lastName: Joi.string().max(100).optional().allow(''),
  role: Joi.string().valid('user', 'admin').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required.',
    'any.required': 'Reset token is required.',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters.',
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match.',
    'string.empty': 'Password confirmation is required.',
    'any.required': 'Password confirmation is required.',
  }),
});

const guestRegisterSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
  }),
  firstName: Joi.string().max(100).optional().allow(''),
  lastName: Joi.string().max(100).optional().allow(''),
});

const validateRegister = validate(registerSchema);
const validateLogin = validate(loginSchema);
const validateForgotPassword = validate(forgotPasswordSchema);
const validateResetPassword = validate(resetPasswordSchema);
const validateGuestRegister = validate(guestRegisterSchema);

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateGuestRegister,
};
