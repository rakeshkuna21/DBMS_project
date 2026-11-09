// routes/courts.js - Judicial Court Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// GET /api/courts - List all courts
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const sql = `SELECT * FROM COURT ORDER BY COURT_ID`;
    logSql('SELECT', sql, [], db.isOracleConnected() ? 'oracle' : 'in-memory', 'COURT');
    res.json(store.courts);
  } catch (err) {
    console.error('Get courts error:', err);
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
});

module.exports = router;
