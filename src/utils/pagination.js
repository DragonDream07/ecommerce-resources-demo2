/**
 * Parse and validate page and limit query parameters.
 *
 * @param {object} query - Express req.query object
 * @param {number} [defaultLimit=10] - Default number of items per page
 * @param {number} [maxLimit=100] - Maximum allowed limit
 * @returns {{ page: number, limit: number, offset: number }}
 */
const parsePagination = (query, defaultLimit = 10, maxLimit = 100) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (Number.isNaN(page) || page < 1) {
    page = 1;
  }

  if (Number.isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  }

  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Build a standardised paginated response envelope.
 *
 * @param {Array}  data        - The records for the current page
 * @param {number} total       - Total number of matching records
 * @param {number} page        - Current page number
 * @param {number} limit       - Items per page
 * @returns {object}
 */
const buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      perPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = { parsePagination, buildPaginatedResponse };
