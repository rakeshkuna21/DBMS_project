// sqlLogger.js - SQL Logging Module for National Cyber Crime Management System

let sqlLogs = [];
let nextLogId = 1;

/**
 * Log a SQL operation with full details.
 * @param {string} operation - INSERT, SELECT, UPDATE, DELETE
 * @param {string} sql - The SQL statement
 * @param {Array|Object} params - Parameters passed with the query
 * @param {string} source - 'oracle' or 'in-memory'
 * @param {string} entity - The entity/table being operated on
 */
function logSql(operation, sql, params, source, entity) {
  const entry = {
    id: nextLogId++,
    timestamp: new Date().toISOString(),
    operation: operation.toUpperCase(),
    sql,
    params: params || [],
    source,
    entity: entity || 'unknown'
  };
  sqlLogs.push(entry);
  return entry;
}

/**
 * Get all SQL logs.
 * @returns {Array} All logged SQL operations
 */
function getSqlLogs() {
  return [...sqlLogs];
}

/**
 * Clear all SQL logs.
 */
function clearSqlLogs() {
  sqlLogs = [];
  nextLogId = 1;
}

module.exports = {
  logSql,
  getSqlLogs,
  clearSqlLogs
};
