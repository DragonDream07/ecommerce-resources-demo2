const searchService = require('./search.service');

/**
 * Handle GET /search
 */
async function search(req, res, next) {
  try {
    const { q = '', filters = '{}', page = 1, size = 10 } = req.query;

    let parsedFilters;
    try {
      parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
    } catch {
      parsedFilters = {};
    }

    const results = await searchService.search({
      q,
      filters: parsedFilters,
      page: parseInt(page, 10),
      size: parseInt(size, 10),
    });

    return res.status(200).json(results);
  } catch (err) {
    return next(err);
  }
}

/**
 * Handle GET /search/autocomplete  (maps to /search/suggest in OpenAPI)
 */
async function suggest(req, res, next) {
  try {
    const { q = '', size = 5 } = req.query;

    const suggestions = await searchService.suggest({
      q,
      size: parseInt(size, 10),
    });

    return res.status(200).json(suggestions);
  } catch (err) {
    return next(err);
  }
}

module.exports = { search, suggest };
