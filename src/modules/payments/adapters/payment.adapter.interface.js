/**
 * PaymentAdapterInterface
 *
 * Duck-type contract that every payment provider adapter must satisfy.
 * Concrete adapters should extend this class and implement all methods.
 * Calling any method on this base class directly will throw a descriptive error.
 */
class PaymentAdapterInterface {
  /**
   * Initialise a new payment / charge.
   *
   * @param {object} params
   * @param {number}  params.amount       - Amount in the smallest currency unit (e.g. cents).
   * @param {string}  params.currency     - ISO 4217 currency code (e.g. "USD").
   * @param {string}  params.description  - Human-readable description of the charge.
   * @param {object}  [params.metadata]   - Arbitrary key-value pairs forwarded to the provider.
   * @returns {Promise<{id: string, status: string, raw: object}>}
   */
  async createPayment(params) {
    throw new Error(
      `PaymentAdapterInterface.createPayment() must be implemented by the concrete adapter. Received params: ${JSON.stringify(params)}`
    );
  }

  /**
   * Retrieve the current status of a previously created payment.
   *
   * @param {string} paymentId - Provider-side payment / charge identifier.
   * @returns {Promise<{id: string, status: string, raw: object}>}
   */
  async getPaymentStatus(paymentId) {
    throw new Error(
      `PaymentAdapterInterface.getPaymentStatus() must be implemented by the concrete adapter. Received paymentId: ${paymentId}`
    );
  }

  /**
   * Issue a full or partial refund for a completed payment.
   *
   * @param {string} paymentId          - Provider-side payment identifier to refund.
   * @param {object} [params]
   * @param {number}  [params.amount]   - Amount to refund in smallest currency unit.
   *                                      Omit to refund the full amount.
   * @param {string}  [params.reason]   - Optional reason string forwarded to the provider.
   * @returns {Promise<{id: string, status: string, raw: object}>}
   */
  async refundPayment(paymentId, params = {}) {
    throw new Error(
      `PaymentAdapterInterface.refundPayment() must be implemented by the concrete adapter. Received paymentId: ${paymentId}, params: ${JSON.stringify(params)}`
    );
  }

  /**
   * Validate provider-specific webhook payloads and return a normalised event object.
   *
   * @param {object} payload   - Raw webhook body (already parsed from JSON/form-encoded).
   * @param {object} headers   - HTTP headers accompanying the webhook request.
   * @returns {Promise<{type: string, paymentId: string, status: string, raw: object}>}
   */
  async parseWebhookEvent(payload, headers) {
    throw new Error(
      `PaymentAdapterInterface.parseWebhookEvent() must be implemented by the concrete adapter. Received payload: ${JSON.stringify(payload)}`
    );
  }
}

module.exports = PaymentAdapterInterface;
