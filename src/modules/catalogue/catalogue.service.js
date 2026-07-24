const db = require('../../db');
const { NotFoundError, ConflictError } = require('../../utils/errors');

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPagination(page, limit) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  return { safeLimit, safePage, offset };
}

function formatPaginatedResult(rows, total, page, limit) {
  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Products ──────────────────────────────────────────────────────────────────

async function listProducts({ page, limit, sort, order, categoryId, brandId, minPrice, maxPrice, search }) {
  const { safeLimit, safePage, offset } = buildPagination(page, limit);

  const allowedSortColumns = ['name', 'created_at', 'base_price'];
  const sortColumn = allowedSortColumns.includes(sort) ? sort : 'created_at';
  const sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const conditions = ['p.deleted_at IS NULL'];
  const params = [];

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`p.category_id = $${params.length}`);
  }
  if (brandId) {
    params.push(brandId);
    conditions.push(`p.brand_id = $${params.length}`);
  }
  if (minPrice !== undefined) {
    params.push(minPrice);
    conditions.push(`p.base_price >= $${params.length}`);
  }
  if (maxPrice !== undefined) {
    params.push(maxPrice);
    conditions.push(`p.base_price <= $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM products p ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(safeLimit);
  params.push(offset);

  const result = await db.query(
    `SELECT p.*, b.name AS brand_name, c.name AS category_name
       FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id
       ${where}
       ORDER BY p.${sortColumn} ${sortOrder}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return formatPaginatedResult(result.rows, total, safePage, safeLimit);
}

async function getProductById(productId) {
  const result = await db.query(
    `SELECT p.*, b.name AS brand_name, c.name AS category_name
       FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [productId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Product not found.');
  }
  const product = result.rows[0];
  product.images = await listProductImages(productId);
  product.skus = await listSkus(productId);
  return product;
}

async function createProduct(data) {
  const { name, description, category_id, brand_id, base_price, status } = data;
  const result = await db.query(
    `INSERT INTO products (name, description, category_id, brand_id, base_price, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
    [name, description || null, category_id || null, brand_id || null, base_price, status || 'active']
  );
  return result.rows[0];
}

async function updateProduct(productId, data) {
  const existing = await db.query(
    'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
    [productId]
  );
  if (!existing.rows.length) {
    throw new NotFoundError('Product not found.');
  }

  const fields = [];
  const params = [];

  const allowed = ['name', 'description', 'category_id', 'brand_id', 'base_price', 'status'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  }

  if (!fields.length) {
    return getProductById(productId);
  }

  params.push(productId);
  const result = await db.query(
    `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteProduct(productId) {
  const existing = await db.query(
    'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
    [productId]
  );
  if (!existing.rows.length) {
    throw new NotFoundError('Product not found.');
  }
  await db.query(
    'UPDATE products SET deleted_at = NOW() WHERE id = $1',
    [productId]
  );
}

// ── SKUs ──────────────────────────────────────────────────────────────────────

async function listSkus(productId) {
  const result = await db.query(
    `SELECT * FROM skus WHERE product_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
    [productId]
  );
  return result.rows;
}

async function getSkuById(productId, skuId) {
  const result = await db.query(
    `SELECT * FROM skus WHERE id = $1 AND product_id = $2 AND deleted_at IS NULL`,
    [skuId, productId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('SKU not found.');
  }
  return result.rows[0];
}

async function createSku(productId, data) {
  const productCheck = await db.query(
    'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
    [productId]
  );
  if (!productCheck.rows.length) {
    throw new NotFoundError('Product not found.');
  }

  const { sku_code, attributes, price, stock_quantity } = data;

  const duplicate = await db.query(
    'SELECT id FROM skus WHERE sku_code = $1 AND deleted_at IS NULL',
    [sku_code]
  );
  if (duplicate.rows.length) {
    throw new ConflictError('SKU code already exists.');
  }

  const result = await db.query(
    `INSERT INTO skus (product_id, sku_code, attributes, price, stock_quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
    [productId, sku_code, attributes ? JSON.stringify(attributes) : null, price, stock_quantity || 0]
  );
  return result.rows[0];
}

async function updateSku(productId, skuId, data) {
  await getSkuById(productId, skuId);

  const fields = [];
  const params = [];

  const allowed = ['sku_code', 'attributes', 'price', 'stock_quantity'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      params.push(key === 'attributes' ? JSON.stringify(data[key]) : data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  }

  if (!fields.length) {
    return getSkuById(productId, skuId);
  }

  params.push(skuId);
  params.push(productId);
  const result = await db.query(
    `UPDATE skus SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length - 1} AND product_id = $${params.length} RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteSku(productId, skuId) {
  await getSkuById(productId, skuId);
  await db.query(
    'UPDATE skus SET deleted_at = NOW() WHERE id = $1 AND product_id = $2',
    [skuId, productId]
  );
}

// ── Product Images ────────────────────────────────────────────────────────────

async function listProductImages(productId) {
  const result = await db.query(
    `SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [productId]
  );
  return result.rows;
}

async function addProductImage(productId, data) {
  const productCheck = await db.query(
    'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
    [productId]
  );
  if (!productCheck.rows.length) {
    throw new NotFoundError('Product not found.');
  }

  const { url, alt_text, sort_order } = data;
  const result = await db.query(
    `INSERT INTO product_images (product_id, url, alt_text, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
    [productId, url, alt_text || null, sort_order || 0]
  );
  return result.rows[0];
}

async function deleteProductImage(productId, imageId) {
  const existing = await db.query(
    'SELECT id FROM product_images WHERE id = $1 AND product_id = $2',
    [imageId, productId]
  );
  if (!existing.rows.length) {
    throw new NotFoundError('Product image not found.');
  }
  await db.query(
    'DELETE FROM product_images WHERE id = $1 AND product_id = $2',
    [imageId, productId]
  );
}

// ── Categories ────────────────────────────────────────────────────────────────

async function listCategories() {
  const result = await db.query(
    `SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC`
  );
  return result.rows;
}

async function getCategoryById(categoryId) {
  const result = await db.query(
    `SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL`,
    [categoryId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Category not found.');
  }
  return result.rows[0];
}

async function listProductsByCategory(categoryId, { page, limit }) {
  await getCategoryById(categoryId);
  return listProducts({ page, limit, categoryId });
}

async function createCategory(data) {
  const { name, description, parent_id, slug } = data;

  const duplicate = await db.query(
    'SELECT id FROM categories WHERE slug = $1 AND deleted_at IS NULL',
    [slug]
  );
  if (duplicate.rows.length) {
    throw new ConflictError('Category slug already exists.');
  }

  const result = await db.query(
    `INSERT INTO categories (name, description, parent_id, slug)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
    [name, description || null, parent_id || null, slug]
  );
  return result.rows[0];
}

async function updateCategory(categoryId, data) {
  await getCategoryById(categoryId);

  const fields = [];
  const params = [];

  const allowed = ['name', 'description', 'parent_id', 'slug'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  }

  if (!fields.length) {
    return getCategoryById(categoryId);
  }

  params.push(categoryId);
  const result = await db.query(
    `UPDATE categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteCategory(categoryId) {
  await getCategoryById(categoryId);

  const productCount = await db.query(
    'SELECT COUNT(*) FROM products WHERE category_id = $1 AND deleted_at IS NULL',
    [categoryId]
  );
  if (parseInt(productCount.rows[0].count, 10) > 0) {
    throw new ConflictError('Cannot delete a category that has associated products.');
  }

  await db.query(
    'UPDATE categories SET deleted_at = NOW() WHERE id = $1',
    [categoryId]
  );
}

// ── Brands ────────────────────────────────────────────────────────────────────

async function listBrands() {
  const result = await db.query(
    `SELECT * FROM brands WHERE deleted_at IS NULL ORDER BY name ASC`
  );
  return result.rows;
}

async function getBrandById(brandId) {
  const result = await db.query(
    `SELECT * FROM brands WHERE id = $1 AND deleted_at IS NULL`,
    [brandId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Brand not found.');
  }
  return result.rows[0];
}

async function createBrand(data) {
  const { name, description, image_url, slug } = data;

  const duplicate = await db.query(
    'SELECT id FROM brands WHERE slug = $1 AND deleted_at IS NULL',
    [slug]
  );
  if (duplicate.rows.length) {
    throw new ConflictError('Brand slug already exists.');
  }

  const result = await db.query(
    `INSERT INTO brands (name, description, image_url, slug)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
    [name, description || null, image_url || null, slug]
  );
  return result.rows[0];
}

async function updateBrand(brandId, data) {
  await getBrandById(brandId);

  const fields = [];
  const params = [];

  const allowed = ['name', 'description', 'image_url', 'slug'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  }

  if (!fields.length) {
    return getBrandById(brandId);
  }

  params.push(brandId);
  const result = await db.query(
    `UPDATE brands SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteBrand(brandId) {
  await getBrandById(brandId);

  const productCount = await db.query(
    'SELECT COUNT(*) FROM products WHERE brand_id = $1 AND deleted_at IS NULL',
    [brandId]
  );
  if (parseInt(productCount.rows[0].count, 10) > 0) {
    throw new ConflictError('Cannot delete a brand that has associated products.');
  }

  await db.query(
    'UPDATE brands SET deleted_at = NOW() WHERE id = $1',
    [brandId]
  );
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listSkus,
  getSkuById,
  createSku,
  updateSku,
  deleteSku,
  listProductImages,
  addProductImage,
  deleteProductImage,
  listCategories,
  getCategoryById,
  listProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
