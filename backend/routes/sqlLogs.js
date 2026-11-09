// routes/sqlLogs.js - Live Oracle 11g SQL Logs API
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/sql-logs - Fetch live Oracle 11g execution logs
router.get('/', (req, res) => {
  try {
    const logs = db.getSqlLogs();
    res.json(logs);
  } catch (err) {
    console.error('Error fetching SQL logs:', err);
    res.status(500).json({ error: 'Failed to retrieve SQL logs' });
  }
});

// DELETE /api/sql-logs - Clear log history
router.delete('/', (req, res) => {
  try {
    db.clearSqlLogs();
    res.json({ success: true, message: 'SQL log history cleared' });
  } catch (err) {
    console.error('Error clearing SQL logs:', err);
    res.status(500).json({ error: 'Failed to clear SQL logs' });
  }
});

module.exports = router;
