'use strict';

/**
 * Generic validation middleware factory for Joi schemas.
 *
 * @param {import('@hapi/joi').Schema} schema - A Joi schema to validate against.
 * @param {'body'|'query'|'params'} [source='body'] - Which part of the request to validate.
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));

      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed.',
        details,
      });
    }

    // Replace the request data with the sanitised/coerced value
    req[source] = value;
    return next();
  };
}

module.exports = validate;
