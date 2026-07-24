const db = require('../knex');

const TABLE = 'skus';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findBySku(sku) {
  return db(TABLE).where({ sku }).first();
}

async function findByProductId(productId) {
  return db(TABLE).where({ product_id: productId }).select('*');
}

async function create(data) {
  const [id] = await db(TABLE).insert(data);
  return findById(id);
}

async function update(id, data) {
  await db(TABLE).where({ id }).update(data);
  return findById(id);
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

async function decrementStock(id, quantity, trx) {
  const query = (trx || db)(TABLE)
    .where({ id })
    .where('stock_quantity', '>=', quantity)
    .decrement('stock_quantity', quantity);
  const affected = await query;
  return affected > 0;
}

async function incrementStock(id, quantity, trx) {
  return (trx || db)(TABLE)
    .where({ id })
    .increment('stock_quantity', quantity);
}

async function atomicDecrementStock(id, quantity) {
  return db.transaction(async (trx) => {
    const success = await decrementStock(id, quantity, trx);
    if (!success) {
      throw new Error('Insufficient stock');
    }
    return findById(id);
  });
}

async function findLowStock(threshold = 5) {
  return db(TABLE).where('stock_quantity', '<=', threshold).select('*');
}

module.exports = {
  findById,
  findBySku,
  findByProductId,
  create,
  update,
  remove,
  decrementStock,
  incrementStock,
  atomicDecrementStock,
  findLowStock,
};
