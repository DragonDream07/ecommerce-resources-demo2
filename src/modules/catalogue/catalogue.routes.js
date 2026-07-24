const express = require('express');
const router = express.Router();
const controller = require('./catalogue.controller');
const validator = require('./catalogue.validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

// ── Public: Products ────────────────────────────────────────────────────────
router.get('/products', controller.listProducts);
router.get('/products/:productId', controller.getProduct);
router.get('/products/:productId/skus', controller.listSkus);
router.get('/products/:productId/skus/:skuId', controller.getSku);
router.get('/products/:productId/images', controller.listProductImages);

// ── Public: Categories ───────────────────────────────────────────────────────
router.get('/categories', controller.listCategories);
router.get('/categories/:categoryId', controller.getCategory);
router.get('/categories/:categoryId/products', controller.listProductsByCategory);

// ── Public: Brands ───────────────────────────────────────────────────────────
router.get('/brands', controller.listBrands);
router.get('/brands/:brandId', controller.getBrand);

// ── Admin: Products ──────────────────────────────────────────────────────────
router.post(
  '/products',
  authenticate,
  authorize('admin'),
  validate(validator.createProductSchema),
  controller.createProduct
);
router.put(
  '/products/:productId',
  authenticate,
  authorize('admin'),
  validate(validator.updateProductSchema),
  controller.updateProduct
);
router.delete(
  '/products/:productId',
  authenticate,
  authorize('admin'),
  controller.deleteProduct
);

// ── Admin: SKUs ───────────────────────────────────────────────────────────────
router.post(
  '/products/:productId/skus',
  authenticate,
  authorize('admin'),
  validate(validator.createSkuSchema),
  controller.createSku
);
router.put(
  '/products/:productId/skus/:skuId',
  authenticate,
  authorize('admin'),
  validate(validator.updateSkuSchema),
  controller.updateSku
);
router.delete(
  '/products/:productId/skus/:skuId',
  authenticate,
  authorize('admin'),
  controller.deleteSku
);

// ── Admin: Product Images ────────────────────────────────────────────────────
router.post(
  '/products/:productId/images',
  authenticate,
  authorize('admin'),
  validate(validator.addProductImageSchema),
  controller.addProductImage
);
router.delete(
  '/products/:productId/images/:imageId',
  authenticate,
  authorize('admin'),
  controller.deleteProductImage
);

// ── Admin: Categories ────────────────────────────────────────────────────────
router.post(
  '/categories',
  authenticate,
  authorize('admin'),
  validate(validator.createCategorySchema),
  controller.createCategory
);
router.put(
  '/categories/:categoryId',
  authenticate,
  authorize('admin'),
  validate(validator.updateCategorySchema),
  controller.updateCategory
);
router.delete(
  '/categories/:categoryId',
  authenticate,
  authorize('admin'),
  controller.deleteCategory
);

// ── Admin: Brands ─────────────────────────────────────────────────────────────
router.post(
  '/brands',
  authenticate,
  authorize('admin'),
  validate(validator.createBrandSchema),
  controller.createBrand
);
router.put(
  '/brands/:brandId',
  authenticate,
  authorize('admin'),
  validate(validator.updateBrandSchema),
  controller.updateBrand
);
router.delete(
  '/brands/:brandId',
  authenticate,
  authorize('admin'),
  controller.deleteBrand
);

module.exports = router;
