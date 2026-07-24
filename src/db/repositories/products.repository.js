const db = require('../knex');

const PRODUCTS_TABLE = 'products';
const IMAGES_TABLE = 'product_images';

async function findById(id) {
  return db(PRODUCTS_TABLE).where({ id }).first();
}

async function findBySlug(slug) {
  return db(PRODUCTS_TABLE).where({ slug }).first();
}

async function findAll({ limit = 20, offset = 0, categoryId, brandId, isActive } = {}) {
  const query = db(PRODUCTS_TABLE);
  if (categoryId !== undefined) query.where({ category_id: categoryId });
  if (brandId !== undefined) query.where({ brand_id: brandId });
  if (isActive !== undefined) query.where({ is_active: isActive });
  return query.limit(limit).offset(offset);
}

async function count({ categoryId, brandId, isActive } = {}) {
  const query = db(PRODUCTS_TABLE);
  if (categoryId !== undefined) query.where({ category_id: categoryId });
  if (brandId !== undefined) query.where({ brand_id: brandId });
  if (isActive !== undefined) query.where({ is_active: isActive });
  const [{ total }] = await query.count('id as total');
  return Number(total);
}

async function create(data) {
  const [id] = await db(PRODUCTS_TABLE).insert(data);
  return findById(id);
}

async function update(id, data) {
  await db(PRODUCTS_TABLE).where({ id }).update(data);
  return findById(id);
}

async function remove(id) {
  return db(PRODUCTS_TABLE).where({ id }).del();
}

async function getImages(productId) {
  return db(IMAGES_TABLE).where({ product_id: productId }).orderBy('sort_order', 'asc');
}

async function addImage(data) {
  const [id] = await db(IMAGES_TABLE).insert(data);
  return db(IMAGES_TABLE).where({ id }).first();
}

async function removeImage(id) {
  return db(IMAGES_TABLE).where({ id }).del();
}

async function removeAllImages(productId) {
  return db(IMAGES_TABLE).where({ product_id: productId }).del();
}

async function findWithImages(id) {
  const product = await findById(id);
  if (!product) return null;
  const images = await getImages(id);
  return { ...product, images };
}

module.exports = {
  findById,
  findBySlug,
  findAll,
  count,
  create,
  update,
  remove,
  getImages,
  addImage,
  removeImage,
  removeAllImages,
  findWithImages,
};
