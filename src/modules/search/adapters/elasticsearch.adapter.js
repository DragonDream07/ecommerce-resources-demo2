'use strict';

const { Client } = require('@elastic/elasticsearch');

/**
 * Elasticsearch adapter providing client wrapper, index mapping helpers,
 * and query builders.
 */

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _client = null;

/**
 * Returns (and lazily creates) the shared Elasticsearch client.
 *
 * Configuration is read from environment variables:
 *   ES_NODE        – comma-separated list of node URLs  (default: http://localhost:9200)
 *   ES_USERNAME    – HTTP basic-auth username            (optional)
 *   ES_PASSWORD    – HTTP basic-auth password            (optional)
 *   ES_TLS_REJECT  – set to "false" to skip TLS verify  (default: true)
 *
 * @returns {Client}
 */
function getClient() {
  if (_client) return _client;

  const nodes = (process.env.ES_NODE || 'http://localhost:9200')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);

  const clientOptions = { nodes };

  if (process.env.ES_USERNAME && process.env.ES_PASSWORD) {
    clientOptions.auth = {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD,
    };
  }

  if (process.env.ES_TLS_REJECT === 'false') {
    clientOptions.tls = { rejectUnauthorized: false };
  }

  _client = new Client(clientOptions);
  return _client;
}

/**
 * Replaces the internal client instance (useful for testing).
 *
 * @param {Client} client
 */
function setClient(client) {
  _client = client;
}

// ---------------------------------------------------------------------------
// Index mapping helpers
// ---------------------------------------------------------------------------

/**
 * Default dynamic-mapping settings applied to every index created through
 * this adapter unless the caller supplies their own settings.
 */
const DEFAULT_INDEX_SETTINGS = {
  number_of_shards: 1,
  number_of_replicas: 1,
  max_result_window: 10000,
};

/**
 * Checks whether an index exists.
 *
 * @param {string} index
 * @returns {Promise<boolean>}
 */
async function indexExists(index) {
  const client = getClient();
  const { body } = await client.indices.exists({ index });
  return Boolean(body);
}

/**
 * Creates an index with the supplied mapping and settings.
 * A no-op (returns false) when the index already exists.
 *
 * @param {string} index
 * @param {object} mappings  – Elasticsearch mappings object
 * @param {object} [settings] – Elasticsearch settings object (merged with defaults)
 * @returns {Promise<boolean>} true if the index was created, false if it already existed
 */
async function createIndex(index, mappings, settings = {}) {
  const exists = await indexExists(index);
  if (exists) return false;

  const client = getClient();
  await client.indices.create({
    index,
    body: {
      settings: { ...DEFAULT_INDEX_SETTINGS, ...settings },
      mappings,
    },
  });
  return true;
}

/**
 * Deletes an index.  Silently ignores "index not found" errors.
 *
 * @param {string} index
 * @returns {Promise<void>}
 */
async function deleteIndex(index) {
  const client = getClient();
  try {
    await client.indices.delete({ index });
  } catch (err) {
    if (err?.meta?.body?.error?.type !== 'index_not_found_exception') {
      throw err;
    }
  }
}

/**
 * Updates the mapping of an existing index.
 *
 * @param {string} index
 * @param {object} mappings
 * @returns {Promise<void>}
 */
async function putMapping(index, mappings) {
  const client = getClient();
  await client.indices.putMapping({ index, body: mappings });
}

/**
 * Returns the current mapping for the given index.
 *
 * @param {string} index
 * @returns {Promise<object>}
 */
async function getMapping(index) {
  const client = getClient();
  const { body } = await client.indices.getMapping({ index });
  return body;
}

/**
 * Refreshes an index so that recently indexed documents become searchable
 * immediately.  Useful in tests / batch jobs; avoid in hot paths.
 *
 * @param {string} index
 * @returns {Promise<void>}
 */
async function refreshIndex(index) {
  const client = getClient();
  await client.indices.refresh({ index });
}

// ---------------------------------------------------------------------------
// Document helpers
// ---------------------------------------------------------------------------

/**
 * Indexes (upserts) a single document.
 *
 * @param {string} index
 * @param {string|number} id
 * @param {object} document
 * @returns {Promise<object>} Elasticsearch response body
 */
async function indexDocument(index, id, document) {
  const client = getClient();
  const { body } = await client.index({
    index,
    id: String(id),
    body: document,
    refresh: false,
  });
  return body;
}

/**
 * Retrieves a document by id.
 *
 * @param {string} index
 * @param {string|number} id
 * @returns {Promise<object|null>} The document source or null when not found
 */
async function getDocument(index, id) {
  const client = getClient();
  try {
    const { body } = await client.get({ index, id: String(id) });
    return body._source ?? null;
  } catch (err) {
    if (err?.meta?.statusCode === 404) return null;
    throw err;
  }
}

/**
 * Deletes a document by id.
 *
 * @param {string} index
 * @param {string|number} id
 * @returns {Promise<boolean>} true if deleted, false if not found
 */
async function deleteDocument(index, id) {
  const client = getClient();
  try {
    await client.delete({ index, id: String(id) });
    return true;
  } catch (err) {
    if (err?.meta?.statusCode === 404) return false;
    throw err;
  }
}

/**
 * Performs a bulk operation.
 *
 * @param {Array<object>} operations – flat array of action/source pairs
 * @returns {Promise<object>} Elasticsearch bulk response body
 */
async function bulk(operations) {
  const client = getClient();
  const { body } = await client.bulk({ body: operations, refresh: false });
  return body;
}

// ---------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------

/**
 * Builds a simple multi-match query body.
 *
 * @param {object} params
 * @param {string}   params.query          – full-text search string
 * @param {string[]} params.fields         – fields to search across
 * @param {string}  [params.type]          – multi_match type (default: "best_fields")
 * @param {string}  [params.operator]      – "and" | "or"  (default: "or")
 * @param {number}  [params.fuzziness]     – fuzziness setting (default: "AUTO")
 * @param {number}  [params.from]          – pagination offset (default: 0)
 * @param {number}  [params.size]          – page size         (default: 10)
 * @param {object}  [params.extraFilters]  – additional must-clause filters
 * @returns {object} Elasticsearch request body
 */
function buildMultiMatchQuery({
  query,
  fields,
  type = 'best_fields',
  operator = 'or',
  fuzziness = 'AUTO',
  from = 0,
  size = 10,
  extraFilters = [],
}) {
  const mustClauses = [
    {
      multi_match: {
        query,
        fields,
        type,
        operator,
        fuzziness,
      },
    },
    ...extraFilters,
  ];

  return {
    from,
    size,
    query: {
      bool: {
        must: mustClauses,
      },
    },
  };
}

/**
 * Builds a term-level (exact) filter query body.
 *
 * @param {object} params
 * @param {object}   params.terms  – key/value pairs of field → exact value
 * @param {number}  [params.from]  – pagination offset (default: 0)
 * @param {number}  [params.size]  – page size         (default: 10)
 * @returns {object} Elasticsearch request body
 */
function buildTermQuery({ terms, from = 0, size = 10 }) {
  const termClauses = Object.entries(terms).map(([field, value]) => ({
    term: { [field]: value },
  }));

  return {
    from,
    size,
    query: {
      bool: {
        filter: termClauses,
      },
    },
  };
}

/**
 * Builds a range query body.
 *
 * @param {object} params
 * @param {string}   params.field  – field to apply the range on
 * @param {*}       [params.gte]   – greater-than-or-equal value
 * @param {*}       [params.lte]   – less-than-or-equal value
 * @param {*}       [params.gt]    – greater-than value
 * @param {*}       [params.lt]    – less-than value
 * @param {number}  [params.from]  – pagination offset (default: 0)
 * @param {number}  [params.size]  – page size         (default: 10)
 * @returns {object} Elasticsearch request body
 */
function buildRangeQuery({ field, gte, lte, gt, lt, from = 0, size = 10 }) {
  const rangeParams = {};
  if (gte !== undefined) rangeParams.gte = gte;
  if (lte !== undefined) rangeParams.lte = lte;
  if (gt !== undefined) rangeParams.gt = gt;
  if (lt !== undefined) rangeParams.lt = lt;

  return {
    from,
    size,
    query: {
      range: {
        [field]: rangeParams,
      },
    },
  };
}

/**
 * Builds a compound bool query combining full-text search and term filters.
 *
 * @param {object} params
 * @param {string}   [params.query]        – full-text search string (omit to skip must clause)
 * @param {string[]} [params.fields]       – fields for multi_match (required when query is set)
 * @param {object[]} [params.filters]      – term/range filter clauses added to "filter"
 * @param {object[]} [params.mustNot]      – clauses for the "must_not" section
 * @param {object[]} [params.should]       – clauses for the "should" section
 * @param {number}   [params.minShouldMatch] – minimum_should_match value
 * @param {object[]} [params.sort]         – sort descriptors
 * @param {number}   [params.from]         – pagination offset (default: 0)
 * @param {number}   [params.size]         – page size         (default: 10)
 * @returns {object} Elasticsearch request body
 */
function buildBoolQuery({
  query,
  fields = [],
  filters = [],
  mustNot = [],
  should = [],
  minShouldMatch,
  sort = [],
  from = 0,
  size = 10,
}) {
  const boolClause = {};

  if (query && fields.length) {
    boolClause.must = [
      {
        multi_match: {
          query,
          fields,
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      },
    ];
  }

  if (filters.length) boolClause.filter = filters;
  if (mustNot.length) boolClause.must_not = mustNot;
  if (should.length) {
    boolClause.should = should;
    if (minShouldMatch !== undefined) {
      boolClause.minimum_should_match = minShouldMatch;
    }
  }

  const body = {
    from,
    size,
    query: { bool: boolClause },
  };

  if (sort.length) body.sort = sort;

  return body;
}

/**
 * Adds a simple terms-aggregation to an existing query body.
 *
 * @param {object} queryBody      – existing query body (mutated in place)
 * @param {string} aggName        – aggregation label
 * @param {string} field          – field to aggregate on
 * @param {number} [maxBuckets]   – maximum number of buckets (default: 10)
 * @returns {object} the mutated queryBody
 */
function addTermsAggregation(queryBody, aggName, field, maxBuckets = 10) {
  if (!queryBody.aggs) queryBody.aggs = {};
  queryBody.aggs[aggName] = {
    terms: { field, size: maxBuckets },
  };
  return queryBody;
}

// ---------------------------------------------------------------------------
// Search execution helpers
// ---------------------------------------------------------------------------

/**
 * Executes a search against the given index and returns a normalised result.
 *
 * @param {string} index
 * @param {object} queryBody  – Elasticsearch request body
 * @returns {Promise<{ total: number, hits: object[], aggregations: object|null }>}
 */
async function search(index, queryBody) {
  const client = getClient();
  const { body } = await client.search({ index, body: queryBody });

  const total =
    typeof body.hits.total === 'object'
      ? body.hits.total.value
      : body.hits.total;

  const hits = body.hits.hits.map((hit) => ({
    _id: hit._id,
    _score: hit._score,
    ...hit._source,
  }));

  return {
    total,
    hits,
    aggregations: body.aggregations ?? null,
  };
}

/**
 * Convenience wrapper: builds a multi-match query and executes it.
 *
 * @param {string} index
 * @param {object} params – same params accepted by buildMultiMatchQuery
 * @returns {Promise<{ total: number, hits: object[], aggregations: object|null }>}
 */
async function searchMultiMatch(index, params) {
  const queryBody = buildMultiMatchQuery(params);
  return search(index, queryBody);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Client
  getClient,
  setClient,

  // Index mapping helpers
  indexExists,
  createIndex,
  deleteIndex,
  putMapping,
  getMapping,
  refreshIndex,

  // Document helpers
  indexDocument,
  getDocument,
  deleteDocument,
  bulk,

  // Query builders
  buildMultiMatchQuery,
  buildTermQuery,
  buildRangeQuery,
  buildBoolQuery,
  addTermsAggregation,

  // Search execution
  search,
  searchMultiMatch,

  // Exposed constants
  DEFAULT_INDEX_SETTINGS,
};
