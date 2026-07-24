const { getClient } = require('../../config/elasticsearch');

const DEFAULT_INDEX = process.env.ES_INDEX || 'content';

/**
 * Execute a full-text search with optional faceted filters.
 *
 * @param {object} params
 * @param {string} params.q          - Search query string
 * @param {object} params.filters    - Key/value facet filters
 * @param {number} params.page       - 1-based page number
 * @param {number} params.size       - Results per page
 * @returns {Promise<object>} Elasticsearch-shaped response
 */
async function search({ q, filters, page, size }) {
  const client = getClient();
  const from = (page - 1) * size;

  const must = q
    ? [
        {
          multi_match: {
            query: q,
            fields: ['title^3', 'description^2', 'tags', 'body'],
            fuzziness: 'AUTO',
          },
        },
      ]
    : [{ match_all: {} }];

  const filterClauses = buildFilterClauses(filters);

  const body = {
    from,
    size,
    query: {
      bool: {
        must,
        filter: filterClauses,
      },
    },
    aggs: {
      categories: {
        terms: { field: 'category.keyword', size: 20 },
      },
      tags: {
        terms: { field: 'tags.keyword', size: 30 },
      },
      status: {
        terms: { field: 'status.keyword', size: 10 },
      },
    },
    highlight: {
      fields: {
        title: {},
        description: {},
        body: { fragment_size: 150, number_of_fragments: 3 },
      },
    },
  };

  const response = await client.search({
    index: DEFAULT_INDEX,
    body,
  });

  return formatSearchResponse(response, page, size);
}

/**
 * Provide autocomplete suggestions for the given prefix.
 *
 * @param {object} params
 * @param {string} params.q    - Prefix / partial query
 * @param {number} params.size - Maximum number of suggestions
 * @returns {Promise<object>} Suggestion list
 */
async function suggest({ q, size }) {
  const client = getClient();

  const body = {
    suggest: {
      text: q,
      title_suggest: {
        completion: {
          field: 'title_suggest',
          size,
          skip_duplicates: true,
          fuzzy: { fuzziness: 1 },
        },
      },
      phrase_suggest: {
        phrase: {
          field: 'body.shingle',
          size,
          gram_size: 3,
          direct_generator: [
            {
              field: 'body.shingle',
              suggest_mode: 'always',
            },
          ],
          highlight: {
            pre_tag: '<em>',
            post_tag: '</em>',
          },
        },
      },
    },
  };

  const response = await client.search({
    index: DEFAULT_INDEX,
    body,
  });

  return formatSuggestResponse(response);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildFilterClauses(filters) {
  if (!filters || typeof filters !== 'object') return [];

  return Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([field, value]) => {
      if (Array.isArray(value)) {
        return { terms: { [`${field}.keyword`]: value } };
      }
      return { term: { [`${field}.keyword`]: value } };
    });
}

function formatSearchResponse(response, page, size) {
  const hits = response.body ? response.body.hits : response.hits;
  const aggregations = response.body
    ? response.body.aggregations
    : response.aggregations;

  const total =
    typeof hits.total === 'object' ? hits.total.value : hits.total;

  return {
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
    results: hits.hits.map((hit) => ({
      id: hit._id,
      score: hit._score,
      source: hit._source,
      highlight: hit.highlight || {},
    })),
    facets: formatAggregations(aggregations),
  };
}

function formatAggregations(aggregations) {
  if (!aggregations) return {};

  const facets = {};
  for (const [key, agg] of Object.entries(aggregations)) {
    if (agg && Array.isArray(agg.buckets)) {
      facets[key] = agg.buckets.map((bucket) => ({
        value: bucket.key,
        count: bucket.doc_count,
      }));
    }
  }
  return facets;
}

function formatSuggestResponse(response) {
  const suggest = response.body ? response.body.suggest : response.suggest;

  const completions = (suggest?.title_suggest || []).flatMap(
    (s) => s.options || []
  );

  const phrases = (suggest?.phrase_suggest || []).flatMap(
    (s) => s.options || []
  );

  return {
    completions: completions.map((opt) => ({
      text: opt.text,
      score: opt._score,
    })),
    phrases: phrases.map((opt) => ({
      text: opt.text,
      highlighted: opt.highlighted,
      score: opt.score,
    })),
  };
}

module.exports = { search, suggest };
