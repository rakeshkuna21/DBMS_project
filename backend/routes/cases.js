// routes/cases.js - Cyber Crime Case Management Routes
const express = require('express');
const router = express.Router();
const db = require('../db');
const { logSql } = require('../sqlLogger');

// Helper to enrich a case object with related names
function enrichCase(c, store) {
  const victim = store.victims.find(v => v.victim_id === c.victim_id);
  const investigator = store.investigators.find(i => i.investigator_id === c.investigator_id);
  const crimeType = store.crimeTypes.find(ct => ct.crime_type_id === c.crime_type_id);
  const dept = investigator ? store.policeDepartments.find(d => d.department_id === investigator.department_id) : null;
  const nextHearing = store.hearings
    .filter(h => h.case_id === c.case_id && h.hearing_status === 'Scheduled')
    .sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date))[0];

  return {
    ...c,
    victim_name: victim ? `${victim.first_name} ${victim.last_name}` : 'Citizen',
    victim_email: victim ? victim.email : '',
    victim_phone: victim ? victim.phone : '',
    victim_city: victim ? victim.city : '',
    investigator_name: investigator ? investigator.name : 'Unassigned (Cyber Cell)',
    investigator_rank: investigator ? investigator.rank : 'Investigation Officer',
    investigator_phone: investigator ? investigator.phone : '040-27852412',
    department_name: dept ? dept.department_name : 'National Cyber Crime Cell - Hyderabad',
    crime_type_name: crimeType ? crimeType.crime_type_name : 'Online Cyber Fraud',
    crime_category: crimeType ? crimeType.category : 'Financial Fraud',
    severity_level: crimeType ? crimeType.severity_level : 'Medium',
    next_hearing_date: nextHearing ? nextHearing.hearing_date : null
  };
}

// GET /api/cases/stats/summary - Department / Officer KPI Statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const store = db.getStore();
    const investigatorId = req.query.investigator_id ? parseInt(req.query.investigator_id, 10) : null;

    let targetCases = store.cases;
    if (investigatorId) {
      targetCases = targetCases.filter(c => c.investigator_id === investigatorId);
    }

    let total_cases = targetCases.length;
    let active_investigations = targetCases.filter(c => c.case_status === 'Under Investigation' || c.case_status === 'Pending').length;
    let suspects_arrested = 0;
    let upcoming_hearings = 0;

    let statsSql = `SELECT 
      (SELECT COUNT(*) FROM CYBER_CRIME_CASE) AS TOTAL_CASES,
      (SELECT COUNT(*) FROM CYBER_CRIME_CASE WHERE CASE_STATUS IN ('Under Investigation', 'Pending')) AS ACTIVE_INVESTIGATIONS,
      (SELECT COUNT(*) FROM SUSPECT WHERE ARREST_STATUS IN ('Arrested', 'Tracked by Police')) AS SUSPECTS_ARRESTED,
      (SELECT COUNT(*) FROM CASE_HEARING WHERE HEARING_STATUS = 'Scheduled') AS UPCOMING_HEARINGS
      FROM DUAL`;
    let binds = {};

    if (investigatorId) {
      statsSql = `SELECT 
        (SELECT COUNT(*) FROM CYBER_CRIME_CASE WHERE INVESTIGATOR_ID = :invId) AS TOTAL_CASES,
        (SELECT COUNT(*) FROM CYBER_CRIME_CASE WHERE INVESTIGATOR_ID = :invId AND CASE_STATUS IN ('Under Investigation', 'Pending')) AS ACTIVE_INVESTIGATIONS,
        (SELECT COUNT(*) FROM SUSPECT WHERE CASE_ID IN (SELECT CASE_ID FROM CYBER_CRIME_CASE WHERE INVESTIGATOR_ID = :invId)) AS SUSPECTS_ARRESTED,
        (SELECT COUNT(*) FROM CASE_HEARING WHERE CASE_ID IN (SELECT CASE_ID FROM CYBER_CRIME_CASE WHERE INVESTIGATOR_ID = :invId) AND HEARING_STATUS = 'Scheduled') AS UPCOMING_HEARINGS
        FROM DUAL`;
      binds = { invId: investigatorId };
    }

    logSql('SELECT', statsSql, binds, db.isOracleConnected() ? 'oracle' : 'in-memory', 'CYBER_CRIME_CASE');

    if (db.isOracleConnected()) {
      try {
        const oRes = await db.query(statsSql, binds);
        if (oRes.rows && oRes.rows.length > 0) {
          const r = oRes.rows[0];
          total_cases = Number(r.total_cases ?? r.TOTAL_CASES ?? 0);
          active_investigations = Number(r.active_investigations ?? r.ACTIVE_INVESTIGATIONS ?? 0);
          suspects_arrested = Number(r.suspects_arrested ?? r.SUSPECTS_ARRESTED ?? 0);
          upcoming_hearings = Number(r.upcoming_hearings ?? r.UPCOMING_HEARINGS ?? 0);
        }
      } catch (oraErr) {
        console.warn('Oracle stats note:', oraErr.message);
      }
    }

    res.json({
      total_cases,
      active_investigations,
      suspects_arrested,
      upcoming_hearings
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch summary stats' });
  }
});

// GET /api/cases/status/:caseId - Quick Public Status Tracker
router.get('/status/:caseId', async (req, res) => {
  try {
    const caseId = parseInt(req.params.caseId, 10);
    const store = db.getStore();
    const c = store.cases.find(item => item.case_id === caseId);

    const sql = `SELECT c.CASE_ID, c.CASE_TITLE, c.CASE_STATUS, i.NAME AS INVESTIGATOR_NAME, 
      d.DEPARTMENT_NAME, h.NEXT_HEARING_DATE
      FROM CYBER_CRIME_CASE c
      LEFT JOIN INVESTIGATOR i ON c.INVESTIGATOR_ID = i.INVESTIGATOR_ID
      LEFT JOIN POLICE_DEPARTMENT d ON i.DEPARTMENT_ID = d.DEPARTMENT_ID
      LEFT JOIN CASE_HEARING h ON c.CASE_ID = h.CASE_ID
      WHERE c.CASE_ID = :case_id`;

    logSql('SELECT', sql, { case_id: caseId }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'CYBER_CRIME_CASE');

    if (!c) {
      return res.status(404).json({ error: `Complaint #${caseId} not found in National Cyber Database. Please verify the 6-digit Case ID.` });
    }

    const enriched = enrichCase(c, store);
    res.json({
      case_id: enriched.case_id,
      case_title: enriched.case_title,
      status: enriched.case_status,
      investigator_name: enriched.investigator_name,
      department: enriched.department_name,
      next_hearing_date: enriched.next_hearing_date
    });
  } catch (err) {
    console.error('Status lookup error:', err);
    res.status(500).json({ error: 'Error querying case status' });
  }
});

// GET /api/cases - List cases with strict role-based isolation (?investigator_id=... or ?victim_id=...)
router.get('/', async (req, res) => {
  try {
    const store = db.getStore();
    const victimId = req.query.victim_id ? parseInt(req.query.victim_id, 10) : null;
    const investigatorId = req.query.investigator_id ? parseInt(req.query.investigator_id, 10) : null;

    let resultCases = [];

    if (db.isOracleConnected()) {
      try {
        let sql = `SELECT c.CASE_ID, c.VICTIM_ID, c.INVESTIGATOR_ID, c.CRIME_TYPE_ID, c.CASE_TITLE,
                          TO_CHAR(c.INCIDENT_DATE, 'YYYY-MM-DD') AS INCIDENT_DATE,
                          TO_CHAR(c.REPORTED_DATE, 'YYYY-MM-DD') AS REPORTED_DATE,
                          c.COMPLAINT_MODE, c.DESCRIPTION, c.CASE_STATUS, c.PRIORITY_LEVEL,
                          v.FIRST_NAME, v.LAST_NAME, v.PHONE AS VICTIM_PHONE, v.EMAIL AS VICTIM_EMAIL, v.CITY AS VICTIM_CITY,
                          ct.CRIME_TYPE_NAME, ct.CATEGORY AS CRIME_CATEGORY, ct.SEVERITY_LEVEL,
                          i.NAME AS INVESTIGATOR_NAME, i.RANK AS INVESTIGATOR_RANK, i.OFFICER_ID, i.PHONE AS INVESTIGATOR_PHONE,
                          d.DEPARTMENT_NAME
                   FROM CYBER_CRIME_CASE c
                   LEFT JOIN VICTIM v ON c.VICTIM_ID = v.VICTIM_ID
                   LEFT JOIN CYBER_CRIME_TYPE ct ON c.CRIME_TYPE_ID = ct.CRIME_TYPE_ID
                   LEFT JOIN INVESTIGATOR i ON c.INVESTIGATOR_ID = i.INVESTIGATOR_ID
                   LEFT JOIN POLICE_DEPARTMENT d ON i.DEPARTMENT_ID = d.DEPARTMENT_ID`;
        const binds = {};

        if (investigatorId) {
          sql += ` WHERE c.INVESTIGATOR_ID = :invId`;
          binds.invId = investigatorId;
        } else if (victimId) {
          sql += ` WHERE c.VICTIM_ID = :vicId`;
          binds.vicId = victimId;
        }

        sql += ` ORDER BY c.CASE_ID DESC`;

        logSql('SELECT', sql, binds, 'oracle', 'CYBER_CRIME_CASE');
        const oRes = await db.query(sql, binds);

        if (oRes.rows) {
          resultCases = oRes.rows.map(r => ({
            case_id: r.case_id ?? r.CASE_ID,
            victim_id: r.victim_id ?? r.VICTIM_ID,
            investigator_id: r.investigator_id ?? r.INVESTIGATOR_ID,
            crime_type_id: r.crime_type_id ?? r.CRIME_TYPE_ID,
            case_title: r.case_title ?? r.CASE_TITLE,
            incident_date: r.incident_date ?? r.INCIDENT_DATE,
            reported_date: r.reported_date ?? r.REPORTED_DATE,
            complaint_mode: r.complaint_mode ?? r.COMPLAINT_MODE,
            description: r.description ?? r.DESCRIPTION,
            case_status: r.case_status ?? r.CASE_STATUS,
            priority_level: r.priority_level ?? r.PRIORITY_LEVEL,
            victim_name: (r.first_name || r.FIRST_NAME) ? `${r.first_name || r.FIRST_NAME} ${r.last_name || r.LAST_NAME || ''}`.trim() : 'Citizen',
            victim_phone: r.victim_phone ?? r.VICTIM_PHONE ?? '',
            victim_email: r.victim_email ?? r.VICTIM_EMAIL ?? '',
            victim_city: r.victim_city ?? r.VICTIM_CITY ?? '',
            crime_type_name: r.crime_type_name ?? r.CRIME_TYPE_NAME ?? 'Cyber Crime',
            crime_category: r.crime_category ?? r.CRIME_CATEGORY ?? 'General Cyber Crime',
            severity_level: r.severity_level ?? r.SEVERITY_LEVEL ?? 'Medium',
            investigator_name: r.investigator_name ?? r.INVESTIGATOR_NAME ?? 'Unassigned Officer',
            investigator_rank: r.investigator_rank ?? r.INVESTIGATOR_RANK ?? 'Inspector of Police',
            investigator_phone: r.investigator_phone ?? r.INVESTIGATOR_PHONE ?? '1930',
            officer_id: r.officer_id ?? r.OFFICER_ID ?? '',
            department_name: r.department_name ?? r.DEPARTMENT_NAME ?? 'National Cyber Crime Coordination Centre (I4C)'
          }));
        }
      } catch (oraErr) {
        console.warn('Oracle GET cases fallback:', oraErr.message);
      }
    }

    if (resultCases.length === 0) {
      let filtered = [...store.cases];
      if (investigatorId) {
        filtered = filtered.filter(c => c.investigator_id === investigatorId);
      } else if (victimId) {
        filtered = filtered.filter(c => c.victim_id === victimId);
      }
      resultCases = filtered.map(c => enrichCase(c, store));
    }

    res.json(resultCases);
  } catch (err) {
    console.error('Get cases error:', err);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// GET /api/cases/:id - Single case details
router.get('/:id', async (req, res) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const store = db.getStore();
    const c = store.cases.find(item => item.case_id === caseId);

    const sql = `SELECT * FROM CYBER_CRIME_CASE WHERE CASE_ID = :case_id`;
    logSql('SELECT', sql, { case_id: caseId }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'CYBER_CRIME_CASE');

    if (!c) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(enrichCase(c, store));
  } catch (err) {
    console.error('Get case error:', err);
    res.status(500).json({ error: 'Failed to fetch case details' });
  }
});

// POST /api/cases - Report a new cyber crime (Strict Officer Assignment)
router.post('/', async (req, res) => {
  try {
    const {
      victim_id,
      crime_type_id,
      case_title,
      incident_date,
      description,
      complaint_mode = 'Online Portal',
      priority_level = 'High'
    } = req.body;

    if (!victim_id || !crime_type_id || !case_title || !incident_date || !description) {
      return res.status(400).json({ error: 'Please fill in all mandatory case fields.' });
    }

    const newCaseId = db.getNextId('case_id');
    const today = new Date().toISOString().split('T')[0];

    const store = db.getStore();

    // Map crime categories to designated agency duty officers:
    // 1: Online Financial / UPI Fraud -> I4C Officer (ACP Kiran Varma, investigator_id: 8, I4C-INV-202)
    // 2: Social Media Hacking -> Maharashtra Cyber (Sr. PI Sanjay Patil, investigator_id: 19, MH-POL-401)
    // 3: Cyber Bullying / Women Safety -> Delhi Police IFSO (Inspector Kavita Chauhan, investigator_id: 15, DL-POL-303)
    // 4: Job / Investment Scam -> Karnataka CID (DySP Anand Gowda, investigator_id: 25, KA-POL-501)
    // Other -> CBI Cyber Division (SP Arvind Swaminathan, investigator_id: 1, CBI-CYB-101)
    const cTypeId = parseInt(crime_type_id, 10);
    let chosenInvId = 1;

    if (cTypeId === 1) chosenInvId = 8;
    else if (cTypeId === 2) chosenInvId = 19;
    else if (cTypeId === 3) chosenInvId = 15;
    else if (cTypeId === 4) chosenInvId = 25;
    else chosenInvId = 1;

    // Verify chosen officer exists in store / Oracle
    const assignedOfficer = store.investigators.find(i => i.investigator_id === chosenInvId) || store.investigators[0];
    const finalInvId = assignedOfficer ? assignedOfficer.investigator_id : 1;

    const newCase = {
      case_id: newCaseId,
      victim_id: parseInt(victim_id, 10),
      investigator_id: finalInvId,
      crime_type_id: cTypeId,
      case_title,
      incident_date,
      reported_date: today,
      complaint_mode: complaint_mode || 'Online Portal',
      description,
      case_status: 'Under Investigation',
      priority_level: priority_level || 'High',
      assigned_date: today
    };

    store.cases.unshift(newCase);

    const sql = `INSERT INTO CYBER_CRIME_CASE (
      CASE_ID, VICTIM_ID, INVESTIGATOR_ID, CRIME_TYPE_ID, CASE_TITLE, INCIDENT_DATE, 
      REPORTED_DATE, COMPLAINT_MODE, DESCRIPTION, CASE_STATUS, PRIORITY_LEVEL, ASSIGNED_DATE
    ) VALUES (
      :case_id, :victim_id, :investigator_id, :crime_type_id, :case_title, 
      TO_DATE(:incident_date, 'YYYY-MM-DD'), SYSDATE, :complaint_mode, :description, 'Under Investigation', :priority_level, SYSDATE
    )`;

    const binds = {
      case_id: newCaseId,
      victim_id: newCase.victim_id,
      investigator_id: newCase.investigator_id,
      crime_type_id: newCase.crime_type_id,
      case_title,
      incident_date,
      complaint_mode: newCase.complaint_mode,
      description,
      priority_level: newCase.priority_level
    };

    logSql('INSERT', sql, binds, db.isOracleConnected() ? 'oracle' : 'in-memory', 'CYBER_CRIME_CASE');

    if (db.isOracleConnected()) {
      try {
        await db.query(sql, binds);
      } catch (oraErr) {
        console.warn('Oracle Case insert note:', oraErr.message);
      }
    }

    res.status(201).json({
      success: true,
      case_id: newCaseId,
      id: newCaseId,
      ...enrichCase(newCase, store)
    });
  } catch (err) {
    console.error('Create case error:', err);
    res.status(500).json({ error: 'Failed to record complaint.' });
  }
});

// PUT /api/cases/:id - Update case status & priority
router.put('/:id', async (req, res) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const { case_status, priority_level, investigator_id } = req.body;

    const store = db.getStore();
    const c = store.cases.find(item => item.case_id === caseId);

    if (!c) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (case_status !== undefined) c.case_status = case_status;
    if (priority_level !== undefined) c.priority_level = priority_level;
    if (investigator_id !== undefined) {
      c.investigator_id = investigator_id ? parseInt(investigator_id, 10) : null;
    }

    const sql = `UPDATE CYBER_CRIME_CASE SET 
      CASE_STATUS = :case_status, 
      PRIORITY_LEVEL = :priority_level, 
      INVESTIGATOR_ID = :investigator_id 
      WHERE CASE_ID = :case_id`;

    logSql('UPDATE', sql, {
      case_status: c.case_status,
      priority_level: c.priority_level,
      investigator_id: c.investigator_id,
      case_id: caseId
    }, db.isOracleConnected() ? 'oracle' : 'in-memory', 'CYBER_CRIME_CASE');

    if (db.isOracleConnected()) {
      try {
        await db.query(sql, {
          case_status: c.case_status,
          priority_level: c.priority_level,
          investigator_id: c.investigator_id,
          case_id: caseId
        });
      } catch (oraErr) {
        console.warn('Oracle Case update note:', oraErr.message);
      }
    }

    res.json({ success: true, case: enrichCase(c, store) });
  } catch (err) {
    console.error('Update case error:', err);
    res.status(500).json({ error: 'Failed to update case.' });
  }
});

module.exports = router;
