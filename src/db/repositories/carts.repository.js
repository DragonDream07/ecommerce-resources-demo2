const db = require('../knex');

const CARTS_TABLE = 'carts';
const ITEMS_TABLE = 'cart_items';

async function findCartById(id) {
  return db(CARTS_TABLE).where({ id }).first();
}

async function findCartByUserId(userId) {
  return db(CARTS_TABLE).where({ user_id: userId }).first();
}

async function findCartBySessionId(sessionId) {
  return db(CARTS_TABLE).where({ session_id: sessionId }).first();
}

async function createCart(data) {
  const [id] = await db(CARTS_TABLE).insert(data);
  return findCartById(id);
}

async function updateCart(id, data) {
  await db(CARTS_TABLE).where({ id }).update(data);
  return findCartById(id);
}

async function deleteCart(id) {
  return db(CARTS_TABLE).where({ id }).del();
}

async function getCartItems(cartId) {
  return db(ITEMS_TABLE).where({ cart_id: cartId }).select('*');
}

async function findCartItemById(id) {
  return db(ITEMS_TABLE).where({ id }).first();
}

async function findCartItemBySkuId(cartId, skuId) {
  return db(ITEMS_TABLE).where({ cart_id: cartId, sku_id: skuId }).first();
}

async function addCartItem(data) {
  const [id] = await db(ITEMS_TABLE).insert(data);
  return findCartItemById(id);
}

async function updateCartItem(id, data) {
  await db(ITEMS_TABLE).where({ id }).update(data);
  return findCartItemById(id);
}

async function removeCartItem(id) {
  return db(ITEMS_TABLE).where({ id }).del();
}

async function clearCart(cartId) {
  return db(ITEMS_TABLE).where({ cart_id: cartId }).del();
}

async function getCartWithItems(cartId) {
  const cart = await findCartById(cartId);
  if (!cart) return null;
  const items = await getCartItems(cartId);
  return { ...cart, items };
}

module.exports = {
  findCartById,
  findCartByUserId,
  findCartBySessionId,
  createCart,
  updateCart,
  deleteCart,
  getCartItems,
  findCartItemById,
  findCartItemBySkuId,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartWithItems,
};
