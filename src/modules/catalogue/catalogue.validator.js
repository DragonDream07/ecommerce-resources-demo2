const Joi = require('joi');

// ── Products ──────────────────────────────────────────────────────────────────

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Product name is required.',
    'any.required': 'Product name is required.',
    'string.max': 'Product name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(5000).optional().allow('', null).messages({
    'string.max': 'Product description must not exceed 5000 characters.',
  }),
  category_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'category_id must be a valid UUID.',
  }),
  brand_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'brand_id must be a valid UUID.',
  }),
  base_price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'base_price must be a number.',
    'number.positive': 'base_price must be a positive number.',
    'any.required': 'base_price is required.',
  }),
  status: Joi.string().valid('active', 'inactive', 'draft').default('active').messages({
    'any.only': 'status must be one of active, inactive, draft.',
  }),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Product name must not be empty.',
    'string.max': 'Product name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(5000).optional().allow('', null).messages({
    'string.max': 'Product description must not exceed 5000 characters.',
  }),
  category_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'category_id must be a valid UUID.',
  }),
  brand_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'brand_id must be a valid UUID.',
  }),
  base_price: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'base_price must be a number.',
    'number.positive': 'base_price must be a positive number.',
  }),
  status: Joi.string().valid('active', 'inactive', 'draft').optional().messages({
    'any.only': 'status must be one of active, inactive, draft.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

// ── SKUs ──────────────────────────────────────────────────────────────────────

const createSkuSchema = Joi.object({
  sku_code: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'sku_code is required.',
    'any.required': 'sku_code is required.',
    'string.max': 'sku_code must not exceed 100 characters.',
  }),
  attributes: Joi.object().optional().allow(null).messages({
    'object.base': 'attributes must be an object.',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'price must be a number.',
    'number.positive': 'price must be a positive number.',
    'any.required': 'price is required.',
  }),
  stock_quantity: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'stock_quantity must be a number.',
    'number.integer': 'stock_quantity must be an integer.',
    'number.min': 'stock_quantity must be zero or greater.',
  }),
});

const updateSkuSchema = Joi.object({
  sku_code: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'sku_code must not be empty.',
    'string.max': 'sku_code must not exceed 100 characters.',
  }),
  attributes: Joi.object().optional().allow(null).messages({
    'object.base': 'attributes must be an object.',
  }),
  price: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'price must be a number.',
    'number.positive': 'price must be a positive number.',
  }),
  stock_quantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'stock_quantity must be a number.',
    'number.integer': 'stock_quantity must be an integer.',
    'number.min': 'stock_quantity must be zero or greater.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

// ── Product Images ────────────────────────────────────────────────────────────

const addProductImageSchema = Joi.object({
  url: Joi.string().uri().max(2048).required().messages({
    'string.empty': 'Image URL is required.',
    'any.required': 'Image URL is required.',
    'string.uri': 'Image URL must be a valid URL.',
    'string.max': 'Image URL must not exceed 2048 characters.',
  }),
  alt_text: Joi.string().trim().max(255).optional().allow('', null).messages({
    'string.max': 'alt_text must not exceed 255 characters.',
  }),
  sort_order: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'sort_order must be a number.',
    'number.integer': 'sort_order must be an integer.',
    'number.min': 'sort_order must be zero or greater.',
  }),
});

// ── Categories ────────────────────────────────────────────────────────────────

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Category name is required.',
    'any.required': 'Category name is required.',
    'string.max': 'Category name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.max': 'Category description must not exceed 2000 characters.',
  }),
  parent_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'parent_id must be a valid UUID.',
  }),
  slug: Joi.string().trim().min(1).max(255).pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required().messages({
    'string.empty': 'Category slug is required.',
    'any.required': 'Category slug is required.',
    'string.pattern.base': 'Category slug must contain only lowercase letters, numbers, and hyphens.',
    'string.max': 'Category slug must not exceed 255 characters.',
  }),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Category name must not be empty.',
    'string.max': 'Category name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.max': 'Category description must not exceed 2000 characters.',
  }),
  parent_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'parent_id must be a valid UUID.',
  }),
  slug: Joi.string().trim().min(1).max(255).pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().messages({
    'string.empty': 'Category slug must not be empty.',
    'string.pattern.base': 'Category slug must contain only lowercase letters, numbers, and hyphens.',
    'string.max': 'Category slug must not exceed 255 characters.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

// ── Brands ────────────────────────────────────────────────────────────────────

const createBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Brand name is required.',
    'any.required': 'Brand name is required.',
    'string.max': 'Brand name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.max': 'Brand description must not exceed 2000 characters.',
  }),
  image_url: Joi.string().uri().max(2048).optional().allow('', null).messages({
    'string.uri': 'image_url must be a valid URL.',
    'string.max': 'image_url must not exceed 2048 characters.',
  }),
  slug: Joi.string().trim().min(1).max(255).pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required().messages({
    'string.empty': 'Brand slug is required.',
    'any.required': 'Brand slug is required.',
    'string.pattern.base': 'Brand slug must contain only lowercase letters, numbers, and hyphens.',
    'string.max': 'Brand slug must not exceed 255 characters.',
  }),
});

const updateBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Brand name must not be empty.',
    'string.max': 'Brand name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.max': 'Brand description must not exceed 2000 characters.',
  }),
  image_url: Joi.string().uri().max(2048).optional().allow('', null).messages({
    'string.uri': 'image_url must be a valid URL.',
    'string.max': 'image_url must not exceed 2048 characters.',
  }),
  slug: Joi.string().trim().min(1).max(255).pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().messages({
    'string.empty': 'Brand slug must not be empty.',
    'string.pattern.base': 'Brand slug must contain only lowercase letters, numbers, and hyphens.',
    'string.max': 'Brand slug must not exceed 255 characters.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  createSkuSchema,
  updateSkuSchema,
  addProductImageSchema,
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
};
