/**
 * Security Event Logger
 * 
 * Logs security-related events such as password changes, login attempts, etc.
 * Events are logged to both the console and a file for later analysis.
 */

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''}`;
});

// Create the logger
const securityLogger = createLogger({
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: path.join(logsDir, 'security-events.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Log a password-related event
 * 
 * @param {string} eventType - Type of event (e.g., 'password_reset', 'login_attempt')
 * @param {string} username - Username of the affected user
 * @param {string} status - Status of the event (e.g., 'success', 'failure')
 * @param {Object} metadata - Additional metadata about the event
 */
function logPasswordEvent(eventType, username, status, metadata = {}) {
  securityLogger.info(`Password event: ${eventType}`, {
    eventType,
    username,
    status,
    timestamp: new Date().toISOString(),
    ...metadata
  });
}

/**
 * Log a login attempt
 * 
 * @param {string} username - Username that attempted to log in
 * @param {string} status - 'success' or 'failure'
 * @param {Object} metadata - Additional metadata
 */
function logLoginAttempt(username, status, metadata = {}) {
  logPasswordEvent('login_attempt', username, status, metadata);
}

/**
 * Log a password reset
 * 
 * @param {string} username - Username whose password was reset
 * @param {string} status - 'success' or 'failure'
 * @param {string} initiator - Who initiated the reset (e.g., 'user', 'admin', 'system')
 * @param {Object} metadata - Additional metadata
 */
function logPasswordReset(username, status, initiator = 'system', metadata = {}) {
  logPasswordEvent('password_reset', username, status, { initiator, ...metadata });
}

/**
 * Log a password change
 * 
 * @param {string} username - Username whose password was changed
 * @param {string} status - 'success' or 'failure'
 * @param {Object} metadata - Additional metadata
 */
function logPasswordChange(username, status, metadata = {}) {
  logPasswordEvent('password_change', username, status, metadata);
}

/**
 * Log an account creation
 * 
 * @param {string} username - Username of the created account
 * @param {string} status - 'success' or 'failure'
 * @param {string} creator - Who created the account (e.g., 'self', 'admin', 'system')
 * @param {Object} metadata - Additional metadata
 */
function logAccountCreation(username, status, creator = 'system', metadata = {}) {
  logPasswordEvent('account_creation', username, status, { creator, ...metadata });
}

module.exports = {
  logPasswordEvent,
  logLoginAttempt,
  logPasswordReset,
  logPasswordChange,
  logAccountCreation
};
