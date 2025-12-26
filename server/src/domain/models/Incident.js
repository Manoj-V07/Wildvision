/**
 * INCIDENT MODEL
 * 
 * MongoDB schema for storing wildlife incidents
 */

const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  // Original user input (never modified)
  rawText: {
    type: String,
    required: true
  },

  // Official user-provided location (always used)
  location: {
    state: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    }
  },

  // LLM extracted data (stored as-is)
  extracted: {
    category: {
      type: String,
      required: true,
      enum: ['fire', 'poaching', 'conflict', 'habitat_loss', 'illegal_logging', 'other']
    },
    location: {
      state: { type: String, default: null },
      district: { type: String, default: null }
    },
    indicators: {
      injury: { type: Boolean, default: false },
      weapon: { type: Boolean, default: false },
      fireSpread: { type: Boolean, default: false },
      repeatEvent: { type: Boolean, default: false }
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },

  // Rule-based risk assessment
  risk: {
    score: {
      type: Number,
      required: true
    },
    level: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical']
    }
  },

  // Processing status
  status: {
    type: String,
    required: true,
    enum: ['Processed', 'Needs Review'],
    default: 'Processed'
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
incidentSchema.index({ 'location.state': 1, 'location.district': 1 });
incidentSchema.index({ 'risk.level': 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);