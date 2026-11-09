// routes/victims.js - Victim Management Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// GET /api/victims - List all victims
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const sql = `SELECT * FROM VICTIM ORDER BY VICTIM_ID`;
    logSql('SELECT', sql, [], db.isOracleConnected() ? 'oracle' : 'in-memory', 'VICTIM');
    res.json(store.victims);
  } catch (err) {
    console.error('Get victims error:', err);
    res.status(500).json({ error: 'Failed to fetch victims' });
  }
});

// GET /api/victims/:id - Get victim by ID
router.get('/:id', async (req, res) => {
  try {
    const victimId = parseInt(req.params.id, 10);
    const store = db.getStore();
    const victim = store.victims.find(v => v.victim_id === victimId);

    const sql = `SELECT * FROM VICTIM WHERE VICTIM_ID = :victim_id`;
    logSql('SELECT', sql, { victim_id: victimId }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'VICTIM');

    if (!victim) {
      return res.status(404).json({ error: 'Victim not found' });
    }
    res.json(victim);
  } catch (err) {
    console.error('Get victim error:', err);
    res.status(500).json({ error: 'Failed to fetch victim' });
  }
});

// POST /api/victims - Create victim
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      first_name,
      middle_name = null,
      last_name,
      dob,
      gender,
      email,
      phone,
      street,
      city,
      state,
      pincode
    } = req.body;

    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ error: 'First name, last name, and phone are mandatory.' });
    }

    const store = db.getStore();
    const victimId = db.getNextId('victim_id');
    let finalUserId = user_id;

    // If no user_id, auto-generate a LOGIN user for this citizen
    if (!finalUserId) {
      finalUserId = db.getNextId('user_id');
      const generatedUsername = `citizen_${first_name.toLowerCase()}${victimId}`;
      const newLogin = {
        user_id: finalUserId,
        username: generatedUsername,
        password: 'password123',
        role: 'Victim'
      };
      store.loginUsers.push(newLogin);

      const loginSql = `INSERT INTO LOGIN (USER_ID, USERNAME, PASSWORD, ROLE) VALUES (:user_id, :username, :password, 'Victim')`;
      logSql('INSERT', loginSql, { user_id: finalUserId, username: generatedUsername, password: 'password123' }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'LOGIN');
    }

    const newVictim = {
      victim_id: victimId,
      user_id: finalUserId,
      first_name,
      middle_name: middle_name || null,
      last_name,
      dob: dob || '1995-01-01',
      gender: gender || 'Unspecified',
      email: email || '',
      phone,
      street: street || '',
      city: city || '',
      state: state || '',
      pincode: pincode || ''
    };

    store.victims.push(newVictim);

    const victimSql = `INSERT INTO VICTIM (
      VICTIM_ID, USER_ID, FIRST_NAME, MIDDLE_NAME, LAST_NAME, DOB, GENDER, EMAIL, PHONE, STREET, CITY, STATE, PINCODE
    ) VALUES (
      :victim_id, :user_id, :first_name, :middle_name, :last_name, 
      TO_DATE(:dob, 'YYYY-MM-DD'), :gender, :email, :phone, :street, :city, :state, :pincode
    )`;

    logSql('INSERT', victimSql, {
      victim_id: victimId,
      user_id: finalUserId,
      first_name,
      middle_name: middle_name || null,
      last_name,
      dob: newVictim.dob,
      gender: newVictim.gender,
      email: newVictim.email,
      phone,
      street: newVictim.street,
      city: newVictim.city,
      state: newVictim.state,
      pincode: newVictim.pincode
    }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'VICTIM');

    res.status(201).json({
      success: true,
      victim_id: victimId,
      id: victimId,
      ...newVictim
    });
  } catch (err) {
    console.error('Create victim error:', err);
    res.status(500).json({ error: 'Failed to create victim record' });
  }
});

module.exports = router;
