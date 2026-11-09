// routes/suspects.js - Suspect & Accused Tracking Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// GET /api/suspects - List all suspects with optional search filter
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const query = req.query.q ? String(req.query.q).toLowerCase().trim() : '';

    let suspectsList = [...store.suspects];

    if (db.isOracleConnected()) {
      try {
        const oraRes = await db.query(`SELECT * FROM SUSPECT ORDER BY SUSPECT_ID`);
        if (oraRes.rows && oraRes.rows.length > 0) {
          suspectsList = oraRes.rows.map(r => ({
            suspect_id: r.suspect_id ?? r.SUSPECT_ID,
            case_id: r.case_id ?? r.CASE_ID,
            name: r.name ?? r.NAME,
            gender: r.gender ?? r.GENDER,
            criminal_history: r.criminal_history ?? r.CRIMINAL_HISTORY ?? r.NOTES,
            street: r.street ?? r.STREET,
            city: r.city ?? r.CITY,
            state: r.state ?? r.STATE,
            pincode: r.pincode ?? r.PINCODE,
            phone: r.phone ?? r.PHONE,
            email: r.email ?? r.EMAIL,
            involvement_type: r.involvement_type ?? r.INVOLVEMENT_TYPE ?? r.ROLE,
            arrest_status: r.arrest_status ?? r.ARREST_STATUS ?? r.STATUS,
            charges: r.charges ?? r.CHARGES ?? r.LEGAL_SECTION
          }));
        }
      } catch (oraErr) {
        // Fall back gracefully to populated store
      }
    }

    if (query) {
      suspectsList = suspectsList.filter(s =>
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.phone && s.phone.includes(query)) ||
        (s.city && s.city.toLowerCase().includes(query)) ||
        (s.account_no && s.account_no.toLowerCase().includes(query)) ||
        (s.upi_id && s.upi_id.toLowerCase().includes(query)) ||
        (s.arrest_status && s.arrest_status.toLowerCase().includes(query))
      );
    }

    const sql = query ? `SELECT * FROM SUSPECT WHERE LOWER(NAME) LIKE '%${query}%'` : `SELECT * FROM SUSPECT ORDER BY SUSPECT_ID`;
    logSql('SELECT', sql, [], db.isOracleConnected() ? 'oracle' : 'in-memory', 'SUSPECT');

    res.json(suspectsList);
  } catch (err) {
    console.error('Get suspects error:', err);
    res.status(500).json({ error: 'Failed to fetch suspects' });
  }
});

// GET /api/suspects/case/:caseId - Suspects by Case ID
router.get('/case/:caseId', async (req, res) => {
  try {
    const caseId = parseInt(req.params.caseId, 10);
    const store = db.getStore();
    const matching = store.suspects.filter(s => s.case_id === caseId);

    const sql = `SELECT * FROM SUSPECT WHERE CASE_ID = :case_id ORDER BY SUSPECT_ID`;
    logSql('SELECT', sql, { case_id: caseId }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'SUSPECT');

    res.json(matching);
  } catch (err) {
    console.error('Get case suspects error:', err);
    res.status(500).json({ error: 'Failed to fetch suspects for case' });
  }
});

// POST /api/suspects - Add suspect
router.post('/', async (req, res) => {
  try {
    const {
      case_id,
      name,
      gender = 'Unspecified',
      criminal_history = 'None',
      street = '',
      city = '',
      state = '',
      pincode = '',
      phone = '',
      email = '',
      involvement_type = 'Primary Accused',
      arrest_status = 'At Large',
      charges = 'IT Act Sec 66'
    } = req.body;

    if (!case_id || !name) {
      return res.status(400).json({ error: 'case_id and name are mandatory.' });
    }

    const suspectId = db.getNextId('suspect_id');

    const newSuspect = {
      suspect_id: suspectId,
      case_id: parseInt(case_id, 10),
      name,
      gender: gender || 'Unspecified',
      criminal_history: criminal_history || 'None',
      street: street || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      phone: phone || '',
      email: email || '',
      involvement_type: involvement_type || 'Primary Accused',
      arrest_status: arrest_status || 'At Large',
      charges: charges || 'IT Act Sec 66'
    };

    const store = db.getStore();
    store.suspects.push(newSuspect);

    const sql = `INSERT INTO SUSPECT (
      SUSPECT_ID, CASE_ID, NAME, GENDER, CRIMINAL_HISTORY, STREET, CITY, STATE, PINCODE, PHONE, EMAIL, INVOLVEMENT_TYPE, ARREST_STATUS, CHARGES
    ) VALUES (
      :suspect_id, :case_id, :name, :gender, :criminal_history, :street, :city, :state, :pincode, :phone, :email, :involvement_type, :arrest_status, :charges
    )`;

    logSql('INSERT', sql, {
      suspect_id: suspectId,
      case_id: newSuspect.case_id,
      name,
      gender: newSuspect.gender,
      criminal_history: newSuspect.criminal_history,
      city: newSuspect.city,
      involvement_type: newSuspect.involvement_type,
      arrest_status: newSuspect.arrest_status,
      charges: newSuspect.charges
    }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'SUSPECT');

    res.status(201).json({
      success: true,
      suspect_id: suspectId,
      id: suspectId,
      ...newSuspect
    });
  } catch (err) {
    console.error('Create suspect error:', err);
    res.status(500).json({ error: 'Failed to record suspect' });
  }
});

// PUT /api/suspects/:id - Update suspect arrest status & charges
router.put('/:id', async (req, res) => {
  try {
    const suspectId = parseInt(req.params.id, 10);
    const { arrest_status, charges, involvement_type } = req.body;

    const store = db.getStore();
    const suspect = store.suspects.find(s => s.suspect_id === suspectId);

    if (!suspect) {
      return res.status(404).json({ error: 'Suspect not found' });
    }

    if (arrest_status !== undefined) suspect.arrest_status = arrest_status;
    if (charges !== undefined) suspect.charges = charges;
    if (involvement_type !== undefined) suspect.involvement_type = involvement_type;

    const sql = `UPDATE SUSPECT SET 
      ARREST_STATUS = :arrest_status, 
      CHARGES = :charges, 
      INVOLVEMENT_TYPE = :involvement_type 
      WHERE SUSPECT_ID = :suspect_id`;

    logSql('UPDATE', sql, {
      arrest_status: suspect.arrest_status,
      charges: suspect.charges,
      involvement_type: suspect.involvement_type,
      suspect_id: suspectId
    }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'SUSPECT');

    res.json({ success: true, suspect });
  } catch (err) {
    console.error('Update suspect error:', err);
    res.status(500).json({ error: 'Failed to update suspect status' });
  }
});

module.exports = router;
