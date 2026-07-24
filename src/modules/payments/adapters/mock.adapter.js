'use strict';

const PaymentAdapterInterface = require('./payment.adapter.interface');

/**
 * MockAdapter
 *
 * A test-mode payment adapter that returns configurable success or failure
 * responses without making any real network calls.  Useful for unit tests,
 * integration tests and local development.
 *
 * @example
 * // Always succeed
 * const adapter = new MockAdapter();
 *
 * @example
 * // Force every operation to fail
 * const adapter = new MockAdapter({ shouldFail: true, errorMessage: 'Card declined' });
 *
 * @example
 * // Fail only the first call, then succeed
 * const adapter = new MockAdapter({ failCount: 1 });
 */
class MockAdapter extends PaymentAdapterInterface {
  /**
   * @param {object}  [options]
   * @param {boolean} [options.shouldFail=false]         - When true every call throws.
   * @param {string}  [options.errorMessage]             - Error message used when shouldFail is true.
   * @param {number}  [options.failCount=0]              - Fail exactly this many calls, then succeed.
   * @param {string}  [options.defaultStatus='succeeded']- Status string returned on success.
   * @param {number}  [options.latencyMs=0]              - Simulated async latency in milliseconds.
   */
  constructor(options = {}) {
    super();
    this._shouldFail = options.shouldFail === true;
    this._errorMessage = options.errorMessage || 'MockAdapter: simulated payment failure';
    this._failCount = typeof options.failCount === 'number' ? options.failCount : 0;
    this._defaultStatus = options.defaultStatus || 'succeeded';
    this._latencyMs = typeof options.latencyMs === 'number' ? options.latencyMs : 0;

    // Internal counters / state exposed for assertions in tests.
    this._callCount = 0;
    this._calls = [];
    this._payments = {};
    this._refunds = {};
    this._webhookEvents = [];
    this._paymentIdCounter = 1;
    this._refundIdCounter = 1;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  _shouldThisCallFail() {
    if (this._shouldFail) return true;
    if (this._failCount > 0) {
      this._failCount -= 1;
      return true;
    }
    return false;
  }

  async _simulateLatency() {
    if (this._latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this._latencyMs));
    }
  }

  _recordCall(method, args) {
    this._callCount += 1;
    this._calls.push({ method, args, calledAt: this._callCount });
  }

  _generatePaymentId() {
    return `mock_pay_${String(this._paymentIdCounter++).padStart(6, '0')}`;
  }

  _generateRefundId() {
    return `mock_ref_${String(this._refundIdCounter++).padStart(6, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // PaymentAdapterInterface implementation
  // ---------------------------------------------------------------------------

  /**
   * Simulate creating a payment.
   *
   * @param {object} params
   * @param {number}  params.amount
   * @param {string}  params.currency
   * @param {string}  params.description
   * @param {object}  [params.metadata]
   * @returns {Promise<{id: string, status: string, raw: object}>}
   */
  async createPayment(params = {}) {
    this._recordCall('createPayment', params);
    await this._simulateLatency();

    if (this._shouldThisCallFail()) {
      throw new Error(this._errorMessage);
    }

    const id = this._generatePaymentId();
    const payment = {
      id,
      status: this._defaultStatus,
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      metadata: params.metadata || {},
      createdAt: new Date(0).toISOString(), // deterministic
    };

    this._payments[id] = payment;

    return {
      id: payment.id,
      status: payment.status,
      raw: { ...payment },
    };
  }

  /**
   * Simulate retrieving a payment status.
   *
   * @param {string} paymentId
   * @returns {Promise<{id: string, status: string, raw: object}>}
   */
  async getPaymentStatus(paymentId) {
    this._recordCall('getPaymentStatus', { paymentId });
    await this._simulateLatency();

    if (this._shouldThisCallFail()) {
      throw new Error(this._errorMessage);
    }

    const payment = this._payments[paymentId];
    if (!payment) {
      throw new Error(`MockAdapter: payment not found: ${paymentId}`);
    }

    return {
      id: payment.id,
      status: payment.status,
      raw: { ...payment },
    };
  }

  /**
   * Simulate issuing a refund.
   *
   * @param {string} paymentId
   * @param {object} [params]
   * @param {number}  [params.amount]
   * @param {string}  [params.reason]
   * @returns {Promise<{id: string, status: string, raw: object}>}
   */
  async refundPayment(paymentId, params = {}) {
    this._recordCall('refundPayment', { paymentId, ...params });
    await this._simulateLatency();

    if (this._shouldThisCallFail()) {
      throw new Error(this._errorMessage);
    }

    const payment = this._payments[paymentId];
    if (!payment) {
      throw new Error(`MockAdapter: payment not found for refund: ${paymentId}`);
    }

    const refundId = this._generateRefundId();
    const refund = {
      id: refundId,
      paymentId,
      status: 'refunded',
      amount: params.amount !== undefined ? params.amount : payment.amount,
      reason: params.reason || null,
      createdAt: new Date(0).toISOString(), // deterministic
    };

    this._refunds[refundId] = refund;
    // Update the stored payment status so subsequent getPaymentStatus calls reflect the refund.
    payment.status = 'refunded';

    return {
      id: refund.id,
      status: refund.status,
      raw: { ...refund },
    };
  }

  /**
   * Simulate parsing a webhook event.
   *
   * @param {object} payload
   * @param {object} headers
   * @returns {Promise<{type: string, paymentId: string, status: string, raw: object}>}
   */
  async parseWebhookEvent(payload = {}, headers = {}) {
    this._recordCall('parseWebhookEvent', { payload, headers });
    await this._simulateLatency();

    if (this._shouldThisCallFail()) {
      throw new Error(this._errorMessage);
    }

    const event = {
      type: payload.type || 'payment.succeeded',
      paymentId: payload.paymentId || payload.id || null,
      status: payload.status || this._defaultStatus,
      raw: { ...payload },
    };

    this._webhookEvents.push(event);

    return event;
  }

  // ---------------------------------------------------------------------------
  // Test-utility methods (not part of the adapter interface)
  // ---------------------------------------------------------------------------

  /**
   * Reset all internal state so the same instance can be reused across tests.
   */
  reset() {
    this._callCount = 0;
    this._calls = [];
    this._payments = {};
    this._refunds = {};
    this._webhookEvents = [];
    this._paymentIdCounter = 1;
    this._refundIdCounter = 1;
    this._failCount = 0;
    this._shouldFail = false;
  }

  /**
   * Override the shouldFail flag at runtime (useful for mid-test configuration).
   *
   * @param {boolean} value
   */
  setShouldFail(value) {
    this._shouldFail = Boolean(value);
  }

  /**
   * Schedule the next N calls to fail.
   *
   * @param {number} count
   */
  setFailCount(count) {
    this._failCount = count;
  }

  /**
   * Directly inject a payment record, e.g. to test getPaymentStatus without
   * first calling createPayment.
   *
   * @param {object} payment - Must contain at least `id` and `status`.
   */
  seedPayment(payment) {
    if (!payment || !payment.id) {
      throw new Error('MockAdapter.seedPayment() requires an object with an `id` property');
    }
    this._payments[payment.id] = { ...payment };
  }

  /** Return a shallow copy of all recorded calls for assertion. */
  getCalls() {
    return [...this._calls];
  }

  /** Return a shallow copy of all stored payments. */
  getPayments() {
    return { ...this._payments };
  }

  /** Return a shallow copy of all stored refunds. */
  getRefunds() {
    return { ...this._refunds };
  }

  /** Return a copy of all parsed webhook events. */
  getWebhookEvents() {
    return [...this._webhookEvents];
  }
}

module.exports = MockAdapter;
