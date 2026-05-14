const express = require('express');
const Farmer = require('../models/Farmer');
const logger = require('../utils/logger');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// POST /api/search/farmers
router.post('/farmers', isAuthenticated, async (req, res) => {
  try {
    const { query, filters = {} } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, message: 'Search query string is required' });
    }

    const searchQuery = { 
      $text: { $search: query },
      isDeleted: false
    };

    // Apply any additional filters provided in body
    if (filters.village) searchQuery.village = filters.village;
    if (filters.soilType) searchQuery.soilType = filters.soilType;

    const results = await Farmer.find(
      searchQuery,
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    res.json({
      success: true,
      data: {
        results,
        count: results.length
      }
    });
  } catch (error) {
    logger.error(`Search error: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to execute search' } });
  }
});

module.exports = router;
