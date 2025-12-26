/**
 * INCIDENT INGESTION PIPELINE (Feature #1)
 * 
 * Main pipeline orchestration for processing wildlife incidents.
 * Follows strict order: Validate → Extract → Score → Store → Respond
 */

const { extractIncident } = require('../llm/extractor');
const { calculateRisk } = require('../risk/riskEngine');
const Incident = require('../../domain/models/Incident');

/**
 * Process a new incident through the complete pipeline
 * @param {Object} input - User input data
 * @param {string} input.rawText - Unstructured incident text
 * @param {string} input.state - Official state name
 * @param {string} input.district - Official district name
 * @returns {Promise<Object>} Processing result
 */
async function processIncident(input) {
  try {
    // STEP 1 & 2: Validate request
    validateInput(input);

    const { rawText, state, district } = input;

    // STEP 3 & 4: Get LLM extraction (only send rawText, no location)
    const extractedData = await extractIncident(rawText);

    // STEP 5: Validate LLM output (already done in extractor.js)
    // Check if low confidence requires review
    const needsReview = extractedData.confidence < 40;

    // STEP 6: Apply rule-based risk scoring
    const risk = calculateRisk(extractedData);

    // STEP 7: Combine final incident object
    const status = needsReview ? 'Needs Review' : 'Processed';

    const incidentData = {
      rawText,
      location: {
        state,
        district
      },
      extracted: extractedData,
      risk,
      status
    };

    // STEP 8: Store in database
    const savedIncident = await Incident.create(incidentData);

    // STEP 9: Respond to user with JSON summary
    return {
      success: true,
      data: {
        incidentId: savedIncident._id,
        message: 'Incident recorded',
        riskLevel: risk.level,
        riskScore: risk.score,
        confidence: extractedData.confidence,
        status
      }
    };

  } catch (error) {
    // Handle different error types
    if (error.message.includes('validation')) {
      return {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
    }

    if (error.message.includes('LLM extraction') || error.message.includes('parse')) {
      return {
        success: false,
        error: 'AI Extraction Error',
        message: 'Failed to extract incident data from text'
      };
    }

    // Generic error
    return {
      success: false,
      error: 'Processing Error',
      message: error.message
    };
  }
}

/**
 * Validate user input before processing
 * @param {Object} input - User input
 * @throws {Error} If validation fails
 */
function validateInput(input) {
  if (!input) {
    throw new Error('Input validation failed: No data provided');
  }

  if (!input.rawText || typeof input.rawText !== 'string' || input.rawText.trim() === '') {
    throw new Error('Input validation failed: rawText is required and must be a non-empty string');
  }

  if (!input.state || typeof input.state !== 'string' || input.state.trim() === '') {
    throw new Error('Input validation failed: state is required and must be a non-empty string');
  }

  if (!input.district || typeof input.district !== 'string' || input.district.trim() === '') {
    throw new Error('Input validation failed: district is required and must be a non-empty string');
  }
}

module.exports = {
  processIncident
};