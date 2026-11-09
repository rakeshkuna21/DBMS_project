// routes/departments.js - Police Department Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// GET /api/departments - List all police departments
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const sql = `SELECT * FROM POLICE_DEPARTMENT ORDER BY DEPARTMENT_ID`;
    logSql('SELECT', sql, [], db.isOracleConnected() ? 'oracle' : 'in-memory', 'POLICE_DEPARTMENT');
    res.json(store.policeDepartments);
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
