// server.js - Main Express Server
// National Cyber Crime Management System (MHA | Government of India)

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check & Root Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'National Cyber Crime Management Portal',
    oracleConnected: db.isOracleConnected(),
    databaseMode: db.isOracleConnected() ? 'Oracle Express 11g (XE)' : 'Smart In-Memory Store (Active)',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes for All 11 ER Diagram Entities
app.use('/api/auth', require('./routes/auth'));
app.use('/api/victims', require('./routes/victims'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/investigators', require('./routes/investigators'));
app.use('/api/crime-types', require('./routes/crimeTypes'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/suspects', require('./routes/suspects'));
app.use('/api/courts', require('./routes/courts'));
app.use('/api/hearings', require('./routes/hearings'));
app.use('/api/sql-logs', require('./routes/sqlLogs'));

const path = require('path');

// Serve static frontend build
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error occurred.', details: err.message });
});

// Boot Server
async function startServer() {
  console.log('====================================================================');
  console.log('  🏛️  NATIONAL CYBER CRIME MANAGEMENT SYSTEM - BACKEND API');
  console.log('  Ministry of Home Affairs | Government of India');
  console.log('====================================================================');

  // Attempt Oracle 11g connection
  const connected = await db.initOracle();
  if (connected) {
    console.log('📦 Database Mode: Oracle 11g XE [ONLINE]');
  } else {
    console.log('📦 Database Mode: In-Memory (Oracle Offline - Seamless Fallback)');
    console.log('⚡ All 11 ER Entities loaded with Indian-context realistic mock data.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Unified Full-Stack Portal running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log('====================================================================\n');
  });
}

startServer();
