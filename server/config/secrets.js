const fs = require('fs');
const path = require('path');

/**
 * Read Docker secrets from the /run/secrets directory
 * @param {string} secretName - Name of the secret to read
 * @param {string} defaultValue - Default value if secret is not found
 * @returns {string} - The secret value or default value
 */
function readDockerSecret(secretName, defaultValue = '') {
  const secretPath = path.join('/run/secrets', secretName);
  
  try {
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, 'utf8').trim();
    }
    return process.env[secretName.toUpperCase()] || defaultValue;
  } catch (error) {
    console.warn(`Could not read secret ${secretName}: ${error.message}`);
    return process.env[secretName.toUpperCase()] || defaultValue;
  }
}

module.exports = {
  readDockerSecret
};
