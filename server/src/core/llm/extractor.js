/**
 * LLM EXTRACTOR
 * 
 * Handles communication with LLM for incident extraction.
 * Currently uses a mock implementation - replace with actual LLM API call.
 */

const { buildExtractionPrompt } = require('./prompt');

/**
 * Extract structured data from incident text using LLM
 * @param {string} rawText - Unstructured incident report
 * @returns {Promise<Object>} Extracted incident data
 */
async function extractIncident(rawText) {
  try {
    // Build the prompt (without user location to avoid bias)
    const prompt = buildExtractionPrompt(rawText);

    // TODO: Replace with actual LLM API call
    // For now, using a mock implementation
    const llmResponse = await mockLLMCall(prompt, rawText);

    // Parse and validate LLM response
    const extractedData = parseLLMResponse(llmResponse);
    
    return extractedData;
  } catch (error) {
    throw new Error(`LLM extraction failed: ${error.message}`);
  }
}

/**
 * Mock LLM call - Replace with actual OpenAI/Anthropic/etc API
 * @param {string} prompt - Full prompt
 * @param {string} rawText - Raw incident text
 * @returns {Promise<string>} Mock LLM response
 */
async function mockLLMCall(prompt, rawText) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock logic for demonstration
  const lowerText = rawText.toLowerCase();
  
  let category = 'other';
  let confidence = 75;
  const indicators = {
    injury: false,
    weapon: false,
    fireSpread: false,
    repeatEvent: false
  };

  // Simple keyword matching for demo
  if (lowerText.includes('fire') || lowerText.includes('burn') || lowerText.includes('flame')) {
    category = 'fire';
    confidence = 80;
    if (lowerText.includes('spread') || lowerText.includes('wildfire')) {
      indicators.fireSpread = true;
      confidence = 85;
    }
  } else if (lowerText.includes('poach') || lowerText.includes('hunt') || lowerText.includes('trap')) {
    category = 'poaching';
    confidence = 85;
  } else if (lowerText.includes('elephant') || lowerText.includes('tiger') || lowerText.includes('conflict') || lowerText.includes('crop')) {
    category = 'conflict';
    confidence = 80;
  } else if (lowerText.includes('log') || lowerText.includes('timber') || lowerText.includes('cutting trees')) {
    category = 'illegal_logging';
    confidence = 78;
  } else if (lowerText.includes('habitat') || lowerText.includes('deforest') || lowerText.includes('land clear')) {
    category = 'habitat_loss';
    confidence = 75;
  }

  if (lowerText.includes('injur') || lowerText.includes('hurt') || lowerText.includes('attack') || lowerText.includes('wound')) {
    indicators.injury = true;
  }
  if (lowerText.includes('gun') || lowerText.includes('weapon') || lowerText.includes('rifle') || lowerText.includes('trap')) {
    indicators.weapon = true;
  }
  if (lowerText.includes('again') || lowerText.includes('repeat') || lowerText.includes('previous') || lowerText.includes('recurring')) {
    indicators.repeatEvent = true;
  }

  return JSON.stringify({
    category,
    location: {
      state: null,
      district: null
    },
    indicators,
    confidence
  });
}

/**
 * Parse and validate LLM JSON response
 * @param {string} llmResponse - Raw LLM response
 * @returns {Object} Validated extracted data
 */
function parseLLMResponse(llmResponse) {
  try {
    const data = JSON.parse(llmResponse);

    // Validate required fields
    if (!data.category) {
      throw new Error('Missing category in LLM response');
    }

    // Validate category is from allowed list
    const validCategories = ['fire', 'poaching', 'conflict', 'habitat_loss', 'illegal_logging', 'other'];
    if (!validCategories.includes(data.category)) {
      throw new Error(`Invalid category: ${data.category}`);
    }

    // Validate confidence is a number between 0-100
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
      throw new Error('Invalid confidence value');
    }

    // Ensure structure matches expected format
    return {
      category: data.category,
      location: {
        state: data.location?.state || null,
        district: data.location?.district || null
      },
      indicators: {
        injury: data.indicators?.injury || false,
        weapon: data.indicators?.weapon || false,
        fireSpread: data.indicators?.fireSpread || false,
        repeatEvent: data.indicators?.repeatEvent || false
      },
      confidence: data.confidence
    };
  } catch (error) {
    throw new Error(`Failed to parse LLM response: ${error.message}`);
  }
}

module.exports = {
  extractIncident
};