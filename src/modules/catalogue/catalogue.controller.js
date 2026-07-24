const service = require('./catalogue.service');
const { created, ok, noContent } = require('../../utils/response');

// ── Products ─────────────────────────────────────────────────────────────────

async function listProducts(req, res, next) {
  try {
    const { page, limit, sort, order, categoryId, brandId, minPrice, maxPrice, search } = req.query;
    const result = await service.listProducts({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sort,
      order,
      categoryId,
      brandId,
      minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
      search,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await service.getProductById(req.params.productId);
    return ok(res, product);
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await service.createProduct(req.body);
    return created(res, product);
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await service.updateProduct(req.params.productId, req.body);
    return ok(res, product);
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await service.deleteProduct(req.params.productId);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

// ── SKUs ──────────────────────────────────────────────────────────────────────

async function listSkus(req, res, next) {
  try {
    const skus = await service.listSkus(req.params.productId);
    return ok(res, skus);
  } catch (err) {
    next(err);
  }
}

async function getSku(req, res, next) {
  try {
    const sku = await service.getSkuById(req.params.productId, req.params.skuId);
    return ok(res, sku);
  } catch (err) {
    next(err);
  }
}

async function createSku(req, res, next) {
  try {
    const sku = await service.createSku(req.params.productId, req.body);
    return created(res, sku);
  } catch (err) {
    next(err);
  }
}

async function updateSku(req, res, next) {
  try {
    const sku = await service.updateSku(req.params.productId, req.params.skuId, req.body);
    return ok(res, sku);
  } catch (err) {
    next(err);
  }
}

async function deleteSku(req, res, next) {
  try {
    await service.deleteSku(req.params.productId, req.params.skuId);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

// ── Product Images ────────────────────────────────────────────────────────────

async function listProductImages(req, res, next) {
  try {
    const images = await service.listProductImages(req.params.productId);
    return ok(res, images);
  } catch (err) {
    next(err);
  }
}

async function addProductImage(req, res, next) {
  try {
    const image = await service.addProductImage(req.params.productId, req.body);
    return created(res, image);
  } catch (err) {
    next(err);
  }
}

async function deleteProductImage(req, res, next) {
  try {
    await service.deleteProductImage(req.params.productId, req.params.imageId);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

// ── Categories ────────────────────────────────────────────────────────────────

async function listCategories(req, res, next) {
  try {
    const categories = await service.listCategories();
    return ok(res, categories);
  } catch (err) {
    next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const category = await service.getCategoryById(req.params.categoryId);
    return ok(res, category);
  } catch (err) {
    next(err);
  }
}

async function listProductsByCategory(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await service.listProductsByCategory(req.params.categoryId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await service.createCategory(req.body);
    return created(res, category);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await service.updateCategory(req.params.categoryId, req.body);
    return ok(res, category);
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await service.deleteCategory(req.params.categoryId);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

// ── Brands ────────────────────────────────────────────────────────────────────

async function listBrands(req, res, next) {
  try {
    const brands = await service.listBrands();
    return ok(res, brands);
  } catch (err) {
    next(err);
  }
}

async function getBrand(req, res, next) {
  try {
    const brand = await service.getBrandById(req.params.brandId);
    return ok(res, brand);
  } catch (err) {
    next(err);
  }
}

async function createBrand(req, res, next) {
  try {
    const brand = await service.createBrand(req.body);
    return created(res, brand);
  } catch (err) {
    next(err);
  }
}

async function updateBrand(req, res, next) {
  try {
    const brand = await service.updateBrand(req.params.brandId, req.body);
    return ok(res, brand);
  } catch (err) {
    next(err);
  }
}

async function deleteBrand(req, res, next) {
  try {
    await service.deleteBrand(req.params.brandId);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listSkus,
  getSku,
  createSku,
  updateSku,
  deleteSku,
  listProductImages,
  addProductImage,
  deleteProductImage,
  listCategories,
  getCategory,
  listProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
