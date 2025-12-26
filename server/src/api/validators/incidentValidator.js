/**
 * INCIDENT VALIDATORS
 * 
 * Input validation helpers for incident API
 */

/**
 * Validate incident creation request
 * @param {Object} body - Request body
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateIncidentInput(body) {
  const errors = [];

  if (!body.rawText || typeof body.rawText !== 'string' || body.rawText.trim() === '') {
    errors.push('rawText is required and must be a non-empty string');
  }

  if (!body.state || typeof body.state !== 'string' || body.state.trim() === '') {
    errors.push('state is required and must be a non-empty string');
  }

  if (!body.district || typeof body.district !== 'string' || body.district.trim() === '') {
    errors.push('district is required and must be a non-empty string');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateIncidentInput
};