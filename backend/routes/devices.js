// routes/devices.js - Digital Device Forensics Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// GET /api/devices - List all devices
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const sql = `SELECT * FROM DIGITAL_DEVICE ORDER BY DEVICE_ID`;
    logSql('SELECT', sql, [], db.isOracleConnected() ? 'oracle' : 'in-memory', 'DIGITAL_DEVICE');
    res.json(store.devices);
  } catch (err) {
    console.error('Get devices error:', err);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// GET /api/devices/case/:caseId - Devices by Case ID
router.get('/case/:caseId', async (req, res) => {
  try {
    const caseId = parseInt(req.params.caseId, 10);
    const store = db.getStore();
    const matching = store.devices.filter(d => d.case_id === caseId);

    const sql = `SELECT * FROM DIGITAL_DEVICE WHERE CASE_ID = :case_id ORDER BY DEVICE_ID`;
    logSql('SELECT', sql, { case_id: caseId }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'DIGITAL_DEVICE');

    res.json(matching);
  } catch (err) {
    console.error('Get case devices error:', err);
    res.status(500).json({ error: 'Failed to fetch devices for case' });
  }
});

// POST /api/devices - Register new device
router.post('/', async (req, res) => {
  try {
    const { case_id, device_type, brand, model, serial_no, mac_address, operating_system } = req.body;

    if (!case_id || !device_type) {
      return res.status(400).json({ error: 'case_id and device_type are required.' });
    }

    const deviceId = db.getNextId('device_id');
    const newDevice = {
      device_id: deviceId,
      case_id: parseInt(case_id, 10),
      device_type,
      brand: brand || 'Generic',
      model: model || 'Standard',
      serial_no: serial_no || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      mac_address: mac_address || '00:1A:2B:3C:4D:5E',
      operating_system: operating_system || 'Android / Windows'
    };

    const store = db.getStore();
    store.devices.push(newDevice);

    const sql = `INSERT INTO DIGITAL_DEVICE (
      DEVICE_ID, CASE_ID, DEVICE_TYPE, BRAND, MODEL, SERIAL_NO, MAC_ADDRESS, OPERATING_SYSTEM
    ) VALUES (
      :device_id, :case_id, :device_type, :brand, :model, :serial_no, :mac_address, :operating_system
    )`;

    logSql('INSERT', sql, {
      device_id: deviceId,
      case_id: newDevice.case_id,
      device_type,
      brand: newDevice.brand,
      model: newDevice.model,
      serial_no: newDevice.serial_no,
      mac_address: newDevice.mac_address,
      operating_system: newDevice.operating_system
    }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'DIGITAL_DEVICE');

    res.status(201).json({
      success: true,
      device_id: deviceId,
      id: deviceId,
      ...newDevice
    });
  } catch (err) {
    console.error('Create device error:', err);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

module.exports = router;
