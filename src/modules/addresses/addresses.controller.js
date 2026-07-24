const addressesService = require('./addresses.service');

async function listAddresses(req, res, next) {
  try {
    const userId = req.user.id;
    const addresses = await addressesService.listAddresses(userId);
    return res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
}

async function getAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const address = await addressesService.getAddress(userId, addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function createAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const payload = req.body;
    const address = await addressesService.createAddress(userId, payload);
    return res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function updateAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const payload = req.body;
    const address = await addressesService.updateAddress(userId, addressId, payload);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const deleted = await addressesService.deleteAddress(userId, addressId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
};
