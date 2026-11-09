// db.js - Oracle 11g Connection with In-Memory Fallback
// National Cyber Crime Management System

const sqlLogger = require('./sqlLogger');
let oracledb;
try {
  oracledb = require('oracledb');
} catch (e) {
  oracledb = null;
}

const mockData = require('./mockData');

let oraclePool = null;
let oracleConnected = false;

// Deep-clone mock data so we have a mutable in-memory store
const store = {
  otpPool: JSON.parse(JSON.stringify(mockData.otpPool || [])),
  loginUsers: JSON.parse(JSON.stringify(mockData.loginUsers || [])),
  victims: JSON.parse(JSON.stringify(mockData.victims || [])),
  policeDepartments: JSON.parse(JSON.stringify(mockData.policeDepartments || [])),
  investigators: JSON.parse(JSON.stringify(mockData.investigators || [])),
  crimeTypes: JSON.parse(JSON.stringify(mockData.crimeTypes || [])),
  cases: JSON.parse(JSON.stringify(mockData.cases || [])),
  devices: JSON.parse(JSON.stringify(mockData.devices || [])),
  evidence: JSON.parse(JSON.stringify(mockData.evidence || [])),
  suspects: JSON.parse(JSON.stringify(mockData.suspects || [])),
  courts: JSON.parse(JSON.stringify(mockData.courts || [])),
  hearings: JSON.parse(JSON.stringify(mockData.hearings || []))
};

// Next ID trackers for in-memory inserts
const nextIds = {
  victim_id: 1,
  case_id: 2025001,
  device_id: 1,
  evidence_id: 1,
  suspect_id: 1,
  user_id: 1,
  hearing_no: {}  // per-case tracking
};

// Map common table names to store keys
const tableMap = {
  'otp_pool': 'otpPool',
  'otppool': 'otpPool',
  'login': 'loginUsers',
  'login_users': 'loginUsers',
  'loginusers': 'loginUsers',
  'users': 'loginUsers',
  'victims': 'victims',
  'victim': 'victims',
  'police_departments': 'policeDepartments',
  'policedepartments': 'policeDepartments',
  'departments': 'policeDepartments',
  'investigators': 'investigators',
  'investigator': 'investigators',
  'crime_types': 'crimeTypes',
  'crimetypes': 'crimeTypes',
  'cases': 'cases',
  'case': 'cases',
  'cyber_cases': 'cases',
  'devices': 'devices',
  'device': 'devices',
  'evidence': 'evidence',
  'suspects': 'suspects',
  'suspect': 'suspects',
  'courts': 'courts',
  'court': 'courts',
  'hearings': 'hearings',
  'hearing': 'hearings'
};

/**
 * Initialize Oracle connection pool
 */
async function initOracle() {
  if (!oracledb) {
    console.log('⚠️  oracledb module not available. Using in-memory mode.');
    return false;
  }
  try {
    // Try Thick mode if Oracle client binaries exist on PATH
    try {
      oracledb.initOracleClient();
      console.log('🏛️ Oracle Thick Mode initialized successfully.');
    } catch (clientErr) {
      // Thick mode not available or already initialized; continue with default
    }

    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    oraclePool = await oracledb.createPool({
      user: 'system',
      password: 'oracle',
      connectString: 'localhost/XE',
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1
    });

    // Test actual handshake
    const testConn = await oraclePool.getConnection();
    await testConn.close();

    oracleConnected = true;
    console.log('✅ Connected to Oracle 11g XE database');
    return true;
  } catch (err) {
    console.log('⚠️  Oracle 11g Connection Notice:', err.message);
    console.log('📦 Activating Smart In-Memory Database Mode with full Oracle 11g SQL Logging');
    if (oraclePool) {
      try { await oraclePool.close(0); } catch (e) {}
      oraclePool = null;
    }
    oracleConnected = false;
    return false;
  }
}

/**
 * Check if Oracle is connected
 */
function isOracleConnected() {
  return oracleConnected;
}

/**
 * Detect the SQL operation type
 */
function detectOperation(sql) {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  return 'UNKNOWN';
}

/**
 * Extract table name from SQL
 */
function extractTableName(sql) {
  const upper = sql.trim().toUpperCase();
  let match;
  if (upper.startsWith('SELECT')) {
    match = sql.match(/FROM\s+(\w+)/i);
  } else if (upper.startsWith('INSERT')) {
    match = sql.match(/INTO\s+(\w+)/i);
  } else if (upper.startsWith('UPDATE')) {
    match = sql.match(/UPDATE\s+(\w+)/i);
  } else if (upper.startsWith('DELETE')) {
    match = sql.match(/FROM\s+(\w+)/i);
  }
  return match ? match[1].toLowerCase() : null;
}

/**
 * Get store array from table name
 */
function getStoreForTable(tableName) {
  if (!tableName) return null;
  const key = tableMap[tableName.toLowerCase()];
  return key ? store[key] : null;
}

/**
 * Get store key from table name
 */
function getStoreKey(tableName) {
  if (!tableName) return null;
  return tableMap[tableName.toLowerCase()] || null;
}

/**
 * Parse WHERE clause conditions from SQL and bind params
 * Supports :paramName and positional :1, :2 style binds
 */
function parseWhereConditions(sql, params) {
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+|\s+GROUP\s+|\s+LIMIT\s+|$)/i);
  if (!whereMatch) return null;

  const whereClause = whereMatch[1].trim();
  const conditions = [];

  // Split by AND (simple parser)
  const parts = whereClause.split(/\s+AND\s+/i);
  for (const part of parts) {
    const condMatch = part.trim().match(/(\w+)\s*=\s*:(\w+)/i);
    if (condMatch) {
      const column = condMatch[1].toLowerCase();
      const paramName = condMatch[2];
      let value;
      if (Array.isArray(params)) {
        // positional - try numeric index
        const idx = parseInt(paramName, 10);
        if (!isNaN(idx) && idx >= 1) {
          value = params[idx - 1];
        }
      } else if (params && typeof params === 'object') {
        value = params[paramName] !== undefined ? params[paramName] : params[column];
      }
      conditions.push({ column, value });
    }
  }
  return conditions.length > 0 ? conditions : null;
}

/**
 * Filter array by conditions
 */
function filterByConditions(arr, conditions) {
  if (!conditions || conditions.length === 0) return [...arr];
  return arr.filter(item => {
    return conditions.every(cond => {
      const itemVal = item[cond.column];
      if (itemVal === undefined) {
        // Try camelCase lookup
        const camelKey = cond.column.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        return item[camelKey] !== undefined ? String(item[camelKey]) === String(cond.value) : true;
      }
      return String(itemVal) === String(cond.value);
    });
  });
}

/**
 * Parse SELECT columns from SQL
 */
function parseSelectColumns(sql) {
  const match = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  if (!match) return null;
  const colStr = match[1].trim();
  if (colStr === '*') return null; // all columns
  return colStr.split(',').map(c => c.trim().toLowerCase());
}

/**
 * Parse INSERT columns and values from SQL and params
 */
function parseInsertData(sql, params) {
  const colMatch = sql.match(/\(([^)]+)\)\s+VALUES/i);
  if (!colMatch) return {};

  const columns = colMatch[1].split(',').map(c => c.trim().toLowerCase());
  const data = {};

  // Match value placeholders
  const valMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
  if (!valMatch) return {};

  const placeholders = valMatch[1].split(',').map(v => v.trim());

  for (let i = 0; i < columns.length; i++) {
    const ph = placeholders[i];
    if (!ph) continue;
    const paramMatch = ph.match(/:(\w+)/);
    if (paramMatch) {
      const paramName = paramMatch[1];
      if (Array.isArray(params)) {
        const idx = parseInt(paramName, 10);
        if (!isNaN(idx) && idx >= 1) {
          data[columns[i]] = params[idx - 1];
        } else {
          data[columns[i]] = params[i];
        }
      } else if (params && typeof params === 'object') {
        data[columns[i]] = params[paramName] !== undefined ? params[paramName] : params[columns[i]];
      }
    }
  }
  return data;
}

/**
 * Parse UPDATE SET clause
 */
function parseUpdateData(sql, params) {
  const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
  if (!setMatch) return {};

  const setParts = setMatch[1].split(',');
  const data = {};

  for (const part of setParts) {
    const m = part.trim().match(/(\w+)\s*=\s*:(\w+)/i);
    if (m) {
      const column = m[1].toLowerCase();
      const paramName = m[2];
      if (Array.isArray(params)) {
        const idx = parseInt(paramName, 10);
        if (!isNaN(idx) && idx >= 1) {
          data[column] = params[idx - 1];
        }
      } else if (params && typeof params === 'object') {
        data[column] = params[paramName] !== undefined ? params[paramName] : params[column];
      }
    }
  }
  return data;
}

/**
 * Execute query - Oracle or in-memory
 */
async function query(sql, params = [], options = {}) {
  const operation = detectOperation(sql);
  const tableName = extractTableName(sql);
  const entity = tableName || 'unknown';
  const source = oracleConnected ? 'oracle' : 'in-memory';

  // Log the SQL
  sqlLogger.logSql(operation, sql, params, source, entity);

  if (oracleConnected) {
    // Oracle execution
    let connection;
    try {
      connection = await oraclePool.getConnection();
      try {
        await connection.execute('ALTER SESSION SET CURRENT_SCHEMA = EAC_24037_RAKESH');
      } catch (schemaErr) {
        // Fallback to system schema if EAC_24037_RAKESH is not present
      }
      const result = await connection.execute(sql, params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
        ...options
      });
      if (operation === 'SELECT') {
        const rows = (result.rows || []).map(row => {
          const norm = { ...row };
          for (const [k, v] of Object.entries(row)) {
            norm[k.toLowerCase()] = v;
          }
          return norm;
        });
        return { rows };
      }
      return { rowsAffected: result.rowsAffected || 0, rows: result.rows || [] };
    } finally {
      if (connection) {
        try { await connection.close(); } catch (e) { /* ignore */ }
      }
    }
  }

  // In-memory execution
  return executeInMemory(operation, sql, params, tableName);
}

/**
 * In-memory SQL simulation
 */
function executeInMemory(operation, sql, params, tableName) {
  const storeArr = getStoreForTable(tableName);
  const storeKey = getStoreKey(tableName);

  switch (operation) {
    case 'SELECT': {
      if (!storeArr) return { rows: [] };
      const conditions = parseWhereConditions(sql, params);
      let results = filterByConditions(storeArr, conditions);

      // Handle ORDER BY
      const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i);
      if (orderMatch) {
        const orderCol = orderMatch[1].toLowerCase();
        const direction = (orderMatch[2] || 'ASC').toUpperCase();
        results.sort((a, b) => {
          const aVal = a[orderCol];
          const bVal = b[orderCol];
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return direction === 'ASC' ? 1 : -1;
          if (bVal == null) return direction === 'ASC' ? -1 : 1;
          if (aVal < bVal) return direction === 'ASC' ? -1 : 1;
          if (aVal > bVal) return direction === 'ASC' ? 1 : -1;
          return 0;
        });
      }

      return { rows: results };
    }

    case 'INSERT': {
      if (!storeArr || !storeKey) return { rowsAffected: 0 };
      const data = parseInsertData(sql, params);
      storeArr.push(data);
      return { rowsAffected: 1, insertedData: data };
    }

    case 'UPDATE': {
      if (!storeArr) return { rowsAffected: 0 };
      const conditions = parseWhereConditions(sql, params);
      const updateData = parseUpdateData(sql, params);
      let count = 0;

      for (const item of storeArr) {
        let match = true;
        if (conditions) {
          match = conditions.every(cond => String(item[cond.column]) === String(cond.value));
        }
        if (match) {
          Object.assign(item, updateData);
          count++;
        }
      }
      return { rowsAffected: count };
    }

    case 'DELETE': {
      if (!storeArr || !storeKey) return { rowsAffected: 0 };
      const conditions = parseWhereConditions(sql, params);
      const before = storeArr.length;
      if (conditions) {
        store[storeKey] = storeArr.filter(item => {
          return !conditions.every(cond => String(item[cond.column]) === String(cond.value));
        });
      }
      return { rowsAffected: before - store[storeKey].length };
    }

    default:
      return { rows: [], rowsAffected: 0 };
  }
}

/**
 * Get next sequential ID for a given key
 */
function getNextId(idKey) {
  const id = nextIds[idKey] || 1;
  nextIds[idKey] = id + 1;
  return id;
}

/**
 * Get next hearing number for a case
 */
function getNextHearingNo(caseId) {
  const existing = store.hearings.filter(h => h.case_id === caseId);
  return existing.length > 0 ? Math.max(...existing.map(h => h.hearing_no)) + 1 : 1;
}

/**
 * Get the in-memory store (for direct access in routes when needed)
 */
function getStore() {
  return store;
}

module.exports = {
  initOracle,
  isOracleConnected,
  query,
  getNextId,
  getNextHearingNo,
  getStore,
  getSqlLogs: sqlLogger.getSqlLogs,
  clearSqlLogs: sqlLogger.clearSqlLogs
};
