/**
 * INCIDENT ROUTES
 * 
 * API routes for incident management
 */

const express = require('express');
const router = express.Router();
const {
  createIncident,
  getIncidents,
  getIncidentById
} = require('../controllers/incidentController');

// POST /api/incidents - Create new incident
router.post('/', createIncident);

// GET /api/incidents - Get all incidents with filters
router.get('/', getIncidents);

// GET /api/incidents/:id - Get specific incident
router.get('/:id', getIncidentById);

module.exports = router;