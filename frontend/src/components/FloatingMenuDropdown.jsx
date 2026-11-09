import React, { useState, useEffect, useRef } from 'react';

/**
 * FloatingMenuDropdown - Modern SaaS-style White Floating Dropdown Panel
 * Directly positioned below the Indian Flag Hamburger Icon
 */
export default function FloatingMenuDropdown({
  isOpen,
  onClose,
  loggedInUser,
  onLogout,
  isSlowInternet,
  onToggleSlowInternet,
  fontSize,
  onChangeFontSize
}) {
  const [activeSection, setActiveSection] = useState('menu'); // 'menu' | 'profile' | 'settings' | 'helpline' | 'developers' | 'database'
  const [dbStatus, setDbStatus] = useState(null);
  const [sqlLogs, setSqlLogs] = useState([]);
  const [loadingDb, setLoadingDb] = useState(false);

  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fetch DB info if Database Inspector section opened
  useEffect(() => {
    if (isOpen && activeSection === 'database') {
      fetchDatabaseInfo();
    }
  }, [isOpen, activeSection]);

  const fetchDatabaseInfo = async () => {
    setLoadingDb(true);
    try {
      const [healthRes, logsRes] = await Promise.all([
        fetch('/api/health').then(r => r.json()).catch(() => ({})),
        fetch('/api/sql-logs').then(r => r.json()).catch(() => [])
      ]);
      setDbStatus(healthRes);
      setSqlLogs(Array.isArray(logsRes) ? logsRes : []);
    } catch (err) {
      console.error('Failed to fetch DB info:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="floating-menu-panel"
      role="menu"
      aria-label="Government Portal Menu"
    >
      {/* 1. Header with Identity */}
      <div className="fmenu-header">
        <div className="fmenu-user-brief">
          <div className="fmenu-avatar">
            {loggedInUser ? (loggedInUser.role === 'Investigator' ? '👮' : '👤') : '🏛️'}
          </div>
          <div className="fmenu-user-text">
            <span className="fmenu-user-name">
              {loggedInUser
                ? (loggedInUser.name || `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || loggedInUser.mobile_number)
                : 'National Cyber Portal'}
            </span>
            <span className="fmenu-user-role">
              {loggedInUser
                ? (loggedInUser.role === 'Investigator' ? 'Police Investigator' : 'Registered Citizen')
                : 'MHA &bull; Government of India'}
            </span>
          </div>
        </div>

        {activeSection !== 'menu' && (
          <button
            type="button"
            className="fmenu-back-btn"
            onClick={() => setActiveSection('menu')}
            title="Back to options"
          >
            &larr; Back
          </button>
        )}
      </div>

      <div className="fmenu-divider"></div>

      {/* 2. Menu Navigation Options */}
      {activeSection === 'menu' && (
        <div className="fmenu-list">
          {loggedInUser && (
            <button
              type="button"
              className="fmenu-item"
              onClick={() => setActiveSection('profile')}
            >
              <span className="fmenu-item-icon">👤</span>
              <div className="fmenu-item-info">
                <span className="fmenu-item-title">Account Details</span>
                <span className="fmenu-item-sub">View registered ID &amp; contact</span>
              </div>
              <span className="fmenu-item-chevron">&rsaquo;</span>
            </button>
          )}

          <button
            type="button"
            className="fmenu-item"
            onClick={() => setActiveSection('settings')}
          >
            <span className="fmenu-item-icon">⚙️</span>
            <div className="fmenu-item-info">
              <span className="fmenu-item-title">Portal Settings</span>
              <span className="fmenu-item-sub">Font size &amp; slow internet test</span>
            </div>
            <span className="fmenu-item-chevron">&rsaquo;</span>
          </button>

          <button
            type="button"
            className="fmenu-item"
            onClick={() => setActiveSection('helpline')}
          >
            <span className="fmenu-item-icon">📞</span>
            <div className="fmenu-item-info">
              <span className="fmenu-item-title">Cyber Helpline 1930</span>
              <span className="fmenu-item-sub">Golden Hour fraud freeze advisory</span>
            </div>
            <span className="fmenu-item-chevron">&rsaquo;</span>
          </button>

          <button
            type="button"
            className="fmenu-item fmenu-highlight"
            onClick={() => setActiveSection('developers')}
          >
            <span className="fmenu-item-icon">👨‍💻</span>
            <div className="fmenu-item-info">
              <span className="fmenu-item-title">Developers</span>
              <span className="fmenu-item-sub">Krish Vats, Sai Dheepak, Rakeesh, Shanmukh</span>
            </div>
            <span className="fmenu-item-chevron">&rsaquo;</span>
          </button>

          <button
            type="button"
            className="fmenu-item"
            onClick={() => setActiveSection('database')}
          >
            <span className="fmenu-item-icon">🗄️</span>
            <div className="fmenu-item-info">
              <span className="fmenu-item-title">Database &amp; SQL Inspector</span>
              <span className="fmenu-item-sub">Live Oracle 11g XE status &amp; logs</span>
            </div>
            <span className="fmenu-item-chevron">&rsaquo;</span>
          </button>

          {loggedInUser && (
            <>
              <div className="fmenu-divider"></div>
              <button
                type="button"
                className="fmenu-item fmenu-logout"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
              >
                <span className="fmenu-item-icon">🚪</span>
                <div className="fmenu-item-info">
                  <span className="fmenu-item-title">Log Out</span>
                  <span className="fmenu-item-sub">End current secure session</span>
                </div>
              </button>
            </>
          )}
        </div>
      )}

      {/* Sub-view: Profile */}
      {activeSection === 'profile' && loggedInUser && (
        <div className="fmenu-subview">
          <h4 className="fmenu-sub-title">My Account Profile</h4>
          <div className="fmenu-profile-card">
            <div className="fmenu-prop-row">
              <span className="fprop-label">User ID:</span>
              <span className="fprop-val">#{loggedInUser.user_id}</span>
            </div>
            <div className="fmenu-prop-row">
              <span className="fprop-label">Phone:</span>
              <span className="fprop-val">+91 {loggedInUser.mobile_number}</span>
            </div>
            {loggedInUser.email && (
              <div className="fmenu-prop-row">
                <span className="fprop-label">Email:</span>
                <span className="fprop-val">{loggedInUser.email}</span>
              </div>
            )}
            <div className="fmenu-prop-row">
              <span className="fprop-label">Role:</span>
              <span className="fprop-badge">{loggedInUser.role}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view: Portal Settings */}
      {activeSection === 'settings' && (
        <div className="fmenu-subview">
          <h4 className="fmenu-sub-title">Portal Accessibility Settings</h4>

          {/* Font Scaling */}
          <div className="fmenu-setting-group">
            <label className="fsetting-label">Text Size (Font Scaling):</label>
            <div className="fsetting-font-buttons">
              <button
                type="button"
                className={`btn-font-pill ${fontSize === 'small' ? 'active' : ''}`}
                onClick={() => onChangeFontSize('small')}
              >
                A- (Normal)
              </button>
              <button
                type="button"
                className={`btn-font-pill ${fontSize === 'medium' ? 'active' : ''}`}
                onClick={() => onChangeFontSize('medium')}
              >
                A (Medium)
              </button>
              <button
                type="button"
                className={`btn-font-pill ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => onChangeFontSize('large')}
              >
                A+ (Large)
              </button>
            </div>
          </div>

          {/* Slow Internet Toggle */}
          <div className="fmenu-setting-group">
            <label className="fsetting-label">Slow Network Simulation:</label>
            <p className="fsetting-sub">
              Simulates slow 2G/rural connectivity with persistent National Emblem protection.
            </p>
            <label className="fmenu-switch">
              <input
                type="checkbox"
                checked={isSlowInternet}
                onChange={(e) => onToggleSlowInternet(e.target.checked)}
              />
              <span className="fswitch-slider"></span>
              <span className="fswitch-label">
                {isSlowInternet ? 'Slow Mode Active (ON)' : 'High-Speed Normal (OFF)'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Sub-view: Helpline 1930 */}
      {activeSection === 'helpline' && (
        <div className="fmenu-subview">
          <h4 className="fmenu-sub-title">📞 National Cyber Helpline</h4>
          <div className="fmenu-helpline-card">
            <span className="fhl-number">DIAL 1930</span>
            <p className="fhl-desc">Toll-Free National Helpline for Financial Frauds</p>
          </div>
          <div className="fhl-info-text">
            <strong>⏱️ Golden Hour Rule:</strong> Report financial scams within 2 hours of transaction to freeze fraud mule accounts before money withdrawal.
          </div>
        </div>
      )}

      {/* Sub-view: Developers */}
      {activeSection === 'developers' && (
        <div className="fmenu-subview">
          <h4 className="fmenu-sub-title">👨‍💻 Developers &amp; Project Credits</h4>
          <div className="fmenu-dev-badge">Full-Stack Architecture &amp; Oracle 11g Engineering</div>
          <ul className="fmenu-dev-list">
            <li>
              <strong>Krish Vats</strong>
              <span>Lead Full-Stack Architecture &amp; GovTech React UI</span>
            </li>
            <li>
              <strong>Sai Dheepak</strong>
              <span>Backend REST APIs, Express &amp; Security Verification</span>
            </li>
            <li>
              <strong>Rakeesh</strong>
              <span>Oracle 11g Database Integration &amp; Thick-Mode DDL</span>
            </li>
            <li>
              <strong>Shanmukh</strong>
              <span>Data Architecture, Forensic Entities &amp; ER Modeling</span>
            </li>
          </ul>
        </div>
      )}

      {/* Sub-view: Database & SQL Inspector */}
      {activeSection === 'database' && (
        <div className="fmenu-subview">
          <h4 className="fmenu-sub-title">🗄️ Database &amp; SQL Inspector</h4>
          <div className="fmenu-db-status">
            <span className="fdb-dot"></span>
            <div>
              <strong>{dbStatus?.databaseMode || 'Oracle 11g XE'}</strong>
              <p>Active Schema: <code>EAC_24037_RAKESH</code></p>
            </div>
          </div>

          <div className="fmenu-sql-logs-container">
            <span className="fsql-title">Recent Executed SQL Statements:</span>
            {loadingDb ? (
              <p className="fsql-loading">Fetching live SQL audit logs...</p>
            ) : sqlLogs.length === 0 ? (
              <p className="fsql-empty">No queries executed yet.</p>
            ) : (
              <div className="fsql-list">
                {sqlLogs.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="fsql-item">
                    <span className={`fsql-tag ${log.operation?.toLowerCase()}`}>{log.operation}</span>
                    <code className="fsql-code">{log.sql}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
