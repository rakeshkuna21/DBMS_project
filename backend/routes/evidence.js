// routes/evidence.js - Forensic Evidence Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// GET /api/evidence - List all evidence
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const sql = `SELECT * FROM EVIDENCE ORDER BY EVIDENCE_ID`;
    logSql('SELECT', sql, [], db.isOracleConnected() ? 'oracle' : 'in-memory', 'EVIDENCE');
    res.json(store.evidence);
  } catch (err) {
    console.error('Get evidence error:', err);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

// GET /api/evidence/case/:caseId - Evidence by Case ID
router.get('/case/:caseId', async (req, res) => {
  try {
    const caseId = parseInt(req.params.caseId, 10);
    const store = db.getStore();
    const matching = store.evidence.filter(e => e.case_id === caseId);

    const sql = `SELECT e.*, d.DEVICE_TYPE, d.BRAND, d.MODEL 
                 FROM EVIDENCE e 
                 LEFT JOIN DIGITAL_DEVICE d ON e.DEVICE_ID = d.DEVICE_ID 
                 WHERE e.CASE_ID = :case_id 
                 ORDER BY e.EVIDENCE_ID`;

    logSql('SELECT', sql, { case_id: caseId }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'EVIDENCE');

    const enriched = matching.map(e => {
      const device = store.devices.find(d => d.device_id === e.device_id);
      return {
        ...e,
        device_details: device ? `${device.device_type} - ${device.brand} ${device.model}` : 'Unlinked Device'
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Get case evidence error:', err);
    res.status(500).json({ error: 'Failed to fetch evidence for case' });
  }
});

// POST /api/evidence - Add new forensic evidence
router.post('/', async (req, res) => {
  try {
    const { case_id, device_id, evidence_type, file_hash, file_size, ip_address, storage_location } = req.body;

    if (!case_id || !evidence_type) {
      return res.status(400).json({ error: 'case_id and evidence_type are mandatory.' });
    }

    const evidenceId = db.getNextId('evidence_id');
    const today = new Date().toISOString().split('T')[0];

    const newEvidence = {
      evidence_id: evidenceId,
      case_id: parseInt(case_id, 10),
      device_id: device_id ? parseInt(device_id, 10) : null,
      evidence_type,
      file_hash: file_hash || 'e3b0c44298fc1c149afbf4c8996fb924',
      file_size: file_size || '1.0 MB',
      collection_date: today,
      ip_address: ip_address || '127.0.0.1',
      storage_location: storage_location || `/evidence_vault/${case_id}/evidence_${evidenceId}.bin`
    };

    const store = db.getStore();
    store.evidence.push(newEvidence);

    const sql = `INSERT INTO EVIDENCE (
      EVIDENCE_ID, CASE_ID, DEVICE_ID, EVIDENCE_TYPE, FILE_HASH, FILE_SIZE, COLLECTION_DATE, IP_ADDRESS, STORAGE_LOCATION
    ) VALUES (
      :evidence_id, :case_id, :device_id, :evidence_type, :file_hash, :file_size, SYSDATE, :ip_address, :storage_location
    )`;

    logSql('INSERT', sql, {
      evidence_id: evidenceId,
      case_id: newEvidence.case_id,
      device_id: newEvidence.device_id,
      evidence_type,
      file_hash: newEvidence.file_hash,
      file_size: newEvidence.file_size,
      ip_address: newEvidence.ip_address,
      storage_location: newEvidence.storage_location
    }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'EVIDENCE');

    res.status(201).json({
      success: true,
      evidence_id: evidenceId,
      id: evidenceId,
      ...newEvidence
    });
  } catch (err) {
    console.error('Create evidence error:', err);
    res.status(500).json({ error: 'Failed to record evidence' });
  }
});

module.exports = router;
