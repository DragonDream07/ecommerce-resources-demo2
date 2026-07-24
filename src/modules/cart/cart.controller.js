const cartService = require('./cart.service');
const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
};

const createCart = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError !== null) return;

  try {
    const userId = req.user ? req.user.id : null;
    const guestId = req.body.guestId || null;
    const cart = await cartService.createCart({ userId, guestId });
    return res.status(201).json({ success: true, data: cart });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.getCartById(cartId, userId);
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const addItem = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError !== null) return;

  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const { productId, variantId, quantity } = req.body;
    const cart = await cartService.addItem(cartId, { productId, variantId, quantity }, userId);
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const updateItem = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError !== null) return;

  try {
    const { cartId, itemId } = req.params;
    const userId = req.user ? req.user.id : null;
    const { quantity } = req.body;
    const cart = await cartService.updateItem(cartId, itemId, { quantity }, userId);
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const removeItem = async (req, res) => {
  try {
    const { cartId, itemId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.removeItem(cartId, itemId, userId);
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const applyPromo = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError !== null) return;

  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const { promoCode } = req.body;
    const cart = await cartService.applyPromo(cartId, promoCode, userId);
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const removePromo = async (req, res) => {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.removePromo(cartId, userId);
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
};
