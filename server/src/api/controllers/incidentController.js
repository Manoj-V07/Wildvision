/**
 * INCIDENT CONTROLLER
 * 
 * HTTP request handlers for incident endpoints
 */

const { processIncident } = require('../../core/pipeline/ingestPipeline');
const Incident = require('../../domain/models/Incident');

/**
 * POST /api/incidents
 * Create a new incident
 */
async function createIncident(req, res) {
  try {
    const { rawText, state, district } = req.body;

    // Process through pipeline
    const result = await processIncident({ rawText, state, district });

    if (result.success) {
      return res.status(201).json(result.data);
    } else {
      // Determine appropriate status code based on error type
      const statusCode = result.error === 'Validation Error' ? 400 : 500;
      return res.status(statusCode).json({
        error: result.error,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Incident creation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * GET /api/incidents
 * Get all incidents with optional filters
 */
async function getIncidents(req, res) {
  try {
    const { state, district, riskLevel, status, limit = 50 } = req.query;

    // Build query
    const query = {};
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;
    if (riskLevel) query['risk.level'] = riskLevel;
    if (status) query.status = status;

    // Execute query
    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      count: incidents.length,
      incidents
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve incidents'
    });
  }
}

/**
 * GET /api/incidents/:id
 * Get a specific incident by ID
 */
async function getIncidentById(req, res) {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Incident not found'
      });
    }

    return res.status(200).json(incident);
  } catch (error) {
    console.error('Get incident by ID error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve incident'
    });
  }
}

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById
};