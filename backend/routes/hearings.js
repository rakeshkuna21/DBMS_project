// routes/hearings.js - Court Hearing Schedule & Verdict Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// GET /api/hearings - List all hearings
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const sql = `SELECT * FROM CASE_HEARING ORDER BY HEARING_DATE DESC`;
    logSql('SELECT', sql, [], db.isOracleConnected() ? 'oracle' : 'in-memory', 'CASE_HEARING');
    res.json(store.hearings);
  } catch (err) {
    console.error('Get hearings error:', err);
    res.status(500).json({ error: 'Failed to fetch hearings' });
  }
});

// GET /api/hearings/case/:caseId - Hearings for a specific case
router.get('/case/:caseId', async (req, res) => {
  try {
    const caseId = parseInt(req.params.caseId, 10);
    const store = db.getStore();
    const caseHearings = store.hearings.filter(h => h.case_id === caseId);

    const sql = `SELECT h.*, c.COURT_NAME, c.COURT_TYPE, c.LOCATION 
                 FROM CASE_HEARING h 
                 LEFT JOIN COURT c ON h.COURT_ID = c.COURT_ID 
                 WHERE h.CASE_ID = :case_id 
                 ORDER BY h.HEARING_NO ASC`;

    logSql('SELECT', sql, { case_id: caseId }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'CASE_HEARING');

    const enriched = caseHearings.map(h => {
      const court = store.courts.find(c => c.court_id === h.court_id);
      return {
        ...h,
        court_name: court ? court.court_name : 'Designated Cyber Court',
        court_type: court ? court.court_type : 'Sessions Court',
        court_location: court ? court.location : 'Judicial Complex'
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Get case hearings error:', err);
    res.status(500).json({ error: 'Failed to fetch hearings for case' });
  }
});

// POST /api/hearings - Schedule a new court hearing
router.post('/', async (req, res) => {
  try {
    const {
      case_id,
      court_id,
      hearing_date,
      hearing_status = 'Scheduled',
      verdict = null,
      next_hearing_date = null,
      judge_name,
      court_room_no
    } = req.body;

    if (!case_id || !court_id || !hearing_date) {
      return res.status(400).json({ error: 'case_id, court_id, and hearing_date are required.' });
    }

    const numCaseId = parseInt(case_id, 10);
    const hearingNo = db.getNextHearingNo(numCaseId);

    const newHearing = {
      case_id: numCaseId,
      hearing_no: hearingNo,
      court_id: parseInt(court_id, 10),
      hearing_date,
      hearing_status: hearing_status || 'Scheduled',
      verdict: verdict || null,
      next_hearing_date: next_hearing_date || null,
      judge_name: judge_name || 'Hon. Special Cyber Judge',
      court_room_no: court_room_no || 'Room 1A'
    };

    const store = db.getStore();
    store.hearings.push(newHearing);

    // Also update parent case status to 'In Court' if currently 'Under Investigation' or 'Pending'
    const parentCase = store.cases.find(c => c.case_id === numCaseId);
    if (parentCase && parentCase.case_status !== 'Resolved') {
      parentCase.case_status = 'In Court';
    }

    const sql = `INSERT INTO CASE_HEARING (
      CASE_ID, HEARING_NO, COURT_ID, HEARING_DATE, HEARING_STATUS, VERDICT, NEXT_HEARING_DATE, JUDGE_NAME, COURT_ROOM_NO
    ) VALUES (
      :case_id, :hearing_no, :court_id, TO_DATE(:hearing_date, 'YYYY-MM-DD'), :hearing_status, :verdict, 
      ${next_hearing_date ? `TO_DATE(:next_hearing_date, 'YYYY-MM-DD')` : 'NULL'}, :judge_name, :court_room_no
    )`;

    logSql('INSERT', sql, {
      case_id: numCaseId,
      hearing_no: hearingNo,
      court_id: newHearing.court_id,
      hearing_date,
      hearing_status: newHearing.hearing_status,
      verdict: newHearing.verdict,
      next_hearing_date: newHearing.next_hearing_date,
      judge_name: newHearing.judge_name,
      court_room_no: newHearing.court_room_no
    }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'CASE_HEARING');

    res.status(201).json({
      success: true,
      hearing_no: hearingNo,
      ...newHearing
    });
  } catch (err) {
    console.error('Create hearing error:', err);
    res.status(500).json({ error: 'Failed to schedule hearing' });
  }
});

// PUT /api/hearings/:caseId/:hearingNo - Update hearing verdict or status
router.put('/:caseId/:hearingNo', async (req, res) => {
  try {
    const caseId = parseInt(req.params.caseId, 10);
    const hearingNo = parseInt(req.params.hearingNo, 10);
    const { hearing_status, verdict, next_hearing_date } = req.body;

    const store = db.getStore();
    const hearing = store.hearings.find(h => h.case_id === caseId && h.hearing_no === hearingNo);

    if (!hearing) {
      return res.status(404).json({ error: 'Hearing not found' });
    }

    if (hearing_status !== undefined) hearing.hearing_status = hearing_status;
    if (verdict !== undefined) hearing.verdict = verdict;
    if (next_hearing_date !== undefined) hearing.next_hearing_date = next_hearing_date;

    const sql = `UPDATE CASE_HEARING SET 
      HEARING_STATUS = :hearing_status, 
      VERDICT = :verdict, 
      NEXT_HEARING_DATE = ${next_hearing_date ? `TO_DATE(:next_hearing_date, 'YYYY-MM-DD')` : 'NULL'} 
      WHERE CASE_ID = :case_id AND HEARING_NO = :hearing_no`;

    logSql('UPDATE', sql, {
      hearing_status: hearing.hearing_status,
      verdict: hearing.verdict,
      next_hearing_date: hearing.next_hearing_date,
      case_id: caseId,
      hearing_no: hearingNo
    }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'CASE_HEARING');

    res.json({ success: true, hearing });
  } catch (err) {
    console.error('Update hearing error:', err);
    res.status(500).json({ error: 'Failed to update hearing details' });
  }
});

module.exports = router;
