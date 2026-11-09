// routes/investigators.js - Investigator Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// GET /api/investigators - List all investigators
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const sql = `SELECT i.*, d.DEPARTMENT_NAME, d.CITY 
                 FROM INVESTIGATOR i 
                 LEFT JOIN POLICE_DEPARTMENT d ON i.DEPARTMENT_ID = d.DEPARTMENT_ID 
                 ORDER BY i.INVESTIGATOR_ID`;

    logSql('SELECT', sql, [], db.isOracleConnected() ? 'oracle' : 'in-memory', 'INVESTIGATOR');

    const enriched = store.investigators.map(inv => {
      const dept = store.policeDepartments.find(d => d.department_id === inv.department_id);
      return {
        ...inv,
        department_name: dept ? dept.department_name : 'Cyber Crime Unit',
        department_city: dept ? dept.city : 'General'
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Get investigators error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
