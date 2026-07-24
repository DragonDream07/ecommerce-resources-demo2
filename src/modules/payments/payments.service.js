const { v4: uuidv4 } = require('uuid');
const db = require('../../db');
const adapterRegistry = require('../../adapters/adapterRegistry');

/**
 * Retrieves the active payment adapter from the registry.
 * @returns {object} adapter instance
 */
function getActiveAdapter() {
  const adapter = adapterRegistry.getActiveAdapter();
  if (!adapter) {
    const err = new Error('No active payment adapter configured.');
    err.statusCode = 503;
    throw err;
  }
  return adapter;
}

/**
 * Persists a payment attempt record to the database.
 * @param {object} attemptData
 * @returns {Promise<object>} inserted record
 */
async function createPaymentAttempt(attemptData) {
  const record = {
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...attemptData,
  };
  await db('payment_attempts').insert(record);
  return record;
}

/**
 * Updates an existing payment attempt record.
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
async function updatePaymentAttempt(id, updates) {
  const updatedFields = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await db('payment_attempts').where({ id }).update(updatedFields);
  return { id, ...updatedFields };
}

/**
 * Initiates a new payment with the active provider adapter.
 * Persists a payment_attempt record before delegating to the adapter.
 * @param {object} payload - Validated initiation payload
 * @returns {Promise<object>} payment initiation result
 */
async function initiatePayment(payload) {
  const adapter = getActiveAdapter();

  const attempt = await createPaymentAttempt({
    status: 'pending',
    provider: adapter.providerName,
    amount: payload.amount,
    currency: payload.currency,
    reference: payload.reference || null,
    metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
  });

  let providerResponse;
  try {
    providerResponse = await adapter.initiatePayment({
      ...payload,
      internalPaymentId: attempt.id,
    });
  } catch (err) {
    await updatePaymentAttempt(attempt.id, {
      status: 'failed',
      failure_reason: err.message,
    });
    throw err;
  }

  await updatePaymentAttempt(attempt.id, {
    status: 'initiated',
    provider_reference: providerResponse.providerReference || null,
    provider_response: JSON.stringify(providerResponse),
  });

  return {
    paymentId: attempt.id,
    status: 'initiated',
    providerReference: providerResponse.providerReference,
    redirectUrl: providerResponse.redirectUrl || null,
    providerResponse,
  };
}

/**
 * Processes a payment provider callback (confirm flow).
 * @param {object} callbackPayload
 * @returns {Promise<object>}
 */
async function processCallback(callbackPayload) {
  const adapter = getActiveAdapter();

  const result = await adapter.processCallback(callbackPayload);

  const { internalPaymentId, status, providerReference } = result;

  if (internalPaymentId) {
    await updatePaymentAttempt(internalPaymentId, {
      status: status || 'completed',
      provider_reference: providerReference || null,
      provider_response: JSON.stringify(result),
    });
  }

  return result;
}

/**
 * Processes a raw webhook event from the payment provider.
 * @param {object} webhookBody
 * @param {object} headers - Request headers for signature verification
 * @returns {Promise<object>}
 */
async function processWebhook(webhookBody, headers) {
  const adapter = getActiveAdapter();

  const event = await adapter.processWebhook(webhookBody, headers);

  if (event && event.internalPaymentId) {
    await updatePaymentAttempt(event.internalPaymentId, {
      status: event.status || 'updated',
      provider_response: JSON.stringify(event),
    });
  }

  return { received: true, event };
}

/**
 * Retrieves a payment attempt by its internal ID.
 * @param {string} paymentId
 * @returns {Promise<object|null>}
 */
async function getPaymentById(paymentId) {
  const record = await db('payment_attempts').where({ id: paymentId }).first();
  if (!record) {
    return null;
  }
  return {
    paymentId: record.id,
    status: record.status,
    provider: record.provider,
    amount: record.amount,
    currency: record.currency,
    reference: record.reference,
    providerReference: record.provider_reference,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    metadata: record.metadata ? JSON.parse(record.metadata) : null,
  };
}

/**
 * Retries a failed payment attempt.
 * Creates a new payment_attempt linked to the original and delegates to the adapter.
 * @param {string} paymentId - Original payment ID to retry
 * @param {object} overridePayload - Optional overrides for the retry
 * @returns {Promise<object>}
 */
async function retryPayment(paymentId, overridePayload = {}) {
  const original = await db('payment_attempts').where({ id: paymentId }).first();

  if (!original) {
    const err = new Error('Payment not found.');
    err.statusCode = 404;
    throw err;
  }

  if (!['failed', 'cancelled'].includes(original.status)) {
    const err = new Error('Only failed or cancelled payments can be retried.');
    err.statusCode = 400;
    throw err;
  }

  const adapter = getActiveAdapter();

  const retryAttempt = await createPaymentAttempt({
    status: 'pending',
    provider: adapter.providerName,
    amount: overridePayload.amount || original.amount,
    currency: overridePayload.currency || original.currency,
    reference: original.reference,
    parent_attempt_id: original.id,
    metadata: original.metadata,
  });

  let providerResponse;
  try {
    providerResponse = await adapter.initiatePayment({
      amount: retryAttempt.amount,
      currency: retryAttempt.currency,
      reference: retryAttempt.reference,
      internalPaymentId: retryAttempt.id,
      ...overridePayload,
    });
  } catch (err) {
    await updatePaymentAttempt(retryAttempt.id, {
      status: 'failed',
      failure_reason: err.message,
    });
    throw err;
  }

  await updatePaymentAttempt(retryAttempt.id, {
    status: 'initiated',
    provider_reference: providerResponse.providerReference || null,
    provider_response: JSON.stringify(providerResponse),
  });

  return {
    paymentId: retryAttempt.id,
    originalPaymentId: paymentId,
    status: 'initiated',
    providerReference: providerResponse.providerReference,
    redirectUrl: providerResponse.redirectUrl || null,
    providerResponse,
  };
}

module.exports = {
  initiatePayment,
  processCallback,
  processWebhook,
  getPaymentById,
  retryPayment,
};
