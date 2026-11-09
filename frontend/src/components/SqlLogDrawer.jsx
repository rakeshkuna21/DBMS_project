import React, { useState, useEffect } from 'react';

export default function SqlLogDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    let interval = null;
    if (isOpen) {
      fetchLogs();
      if (autoRefresh) {
        interval = setInterval(fetchLogs, 4000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, autoRefresh]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/sql-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch SQL logs:', err);
    }
  };

  const handleClearLogs = async () => {
    try {
      setLoading(true);
      await fetch('/api/sql-logs', { method: 'DELETE' });
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear SQL logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOpBadgeClass = (op) => {
    switch (op?.toUpperCase()) {
      case 'INSERT': return 'sql-badge-insert';
      case 'SELECT': return 'sql-badge-select';
      case 'UPDATE': return 'sql-badge-update';
      case 'DELETE': return 'sql-badge-delete';
      default: return 'sql-badge-default';
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        className="sql-log-floating-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="View Live Oracle 11g SQL Execution Log"
      >
        <span className="sql-icon">📋</span>
        <span className="sql-label">Oracle 11g SQL Logs ({logs.length})</span>
        <span className="sql-pulse"></span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="sql-drawer-backdrop" onClick={() => setIsOpen(false)}>
          <div className="sql-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="sql-drawer-header">
              <div>
                <h3 className="sql-drawer-title">
                  ⚡ Live Oracle 11g SQL Execution Stream
                </h3>
                <p className="sql-drawer-subtitle">
                  Inspect real-time DML/DDL queries dispatched across all 11 ER Diagram entities
                </p>
              </div>
              <div className="sql-drawer-actions">
                <label className="sql-auto-refresh">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  Live Poll
                </label>
                <button
                  className="btn btn-sm btn-clear"
                  onClick={handleClearLogs}
                  disabled={loading}
                >
                  Clear Logs
                </button>
                <button
                  className="btn-drawer-close"
                  onClick={() => setIsOpen(false)}
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="sql-drawer-body">
              {logs.length === 0 ? (
                <div className="sql-empty-state">
                  <p>No queries executed yet.</p>
                  <p className="sql-empty-sub">
                    Perform an action in the portal (file a complaint, edit a case, add evidence, or schedule a hearing) to view live Oracle 11g SQL commands here!
                  </p>
                </div>
              ) : (
                <div className="sql-logs-list">
                  {logs.map((log, idx) => (
                    <div key={log.id || idx} className="sql-log-item">
                      <div className="sql-log-top">
                        <span className={`sql-op-badge ${getOpBadgeClass(log.operation)}`}>
                          {log.operation}
                        </span>
                        <span className="sql-entity-tag">
                          TABLE: {log.entity?.toUpperCase() || 'ORACLE'}
                        </span>
                        <span className="sql-source-tag">
                          {log.source === 'oracle' ? '🏛️ ORACLE 11g XE' : '⚡ IN-MEMORY ENGINE'}
                        </span>
                        <span className="sql-timestamp">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}
                        </span>
                      </div>

                      <div className="sql-code-box">
                        <pre><code>{log.sql}</code></pre>
                      </div>

                      {log.params && (Array.isArray(log.params) ? log.params.length > 0 : Object.keys(log.params).length > 0) && (
                        <div className="sql-params-box">
                          <span className="params-label">Bind Variables / Parameters:</span>
                          <code>{JSON.stringify(log.params)}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
