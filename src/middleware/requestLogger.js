'use strict';

const morgan = require('morgan');
const winston = require('winston');

/**
 * Winston logger instance used as the Morgan write stream.
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          ({ timestamp, level, message }) =>
            `${timestamp} [${level}]: ${message}`
        )
      ),
    }),
  ],
});

// In production, also write HTTP logs to a file.
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/http.log',
      level: 'info',
    })
  );
}

/**
 * Stream adapter so Morgan can write through Winston.
 */
const winstonStream = {
  write(message) {
    logger.info(message.trim());
  },
};

/**
 * Morgan HTTP request logger middleware.
 * Uses the 'combined' format in production and 'dev' format otherwise.
 */
const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream: winstonStream }
);

module.exports = requestLogger;
module.exports.logger = logger;
