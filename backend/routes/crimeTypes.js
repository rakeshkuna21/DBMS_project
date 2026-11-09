// routes/crimeTypes.js - Crime Type Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// GET /api/crime-types - List all crime types
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const sql = `SELECT * FROM CYBER_CRIME_TYPE ORDER BY CRIME_TYPE_ID`;
    logSql('SELECT', sql, [], db.isOracleConnected() ? 'oracle' : 'in-memory', 'CYBER_CRIME_TYPE');
    res.json(store.crimeTypes);
  } catch (err) {
    console.error('Get crime types error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
