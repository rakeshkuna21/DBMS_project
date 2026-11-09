import React, { useState, useEffect } from 'react';

export default function VerticalMenu({
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
    <div className="vmenu-backdrop" onClick={onClose}>
      <aside className="vmenu-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Main Menu">
        {/* Drawer Header */}
        <div className="vmenu-header">
          <div className="vmenu-header-brand">
            <span className="vmenu-emblem-badge">🇮🇳</span>
            <div>
              <h2 className="vmenu-title">National Cyber Portal</h2>
              <p className="vmenu-subtitle">Ministry of Home Affairs &bull; Gov of India</p>
            </div>
          </div>
          <button className="vmenu-close-btn" onClick={onClose} aria-label="Close menu">
            &times;
          </button>
        </div>

        {/* User Identity Chip */}
        <div className="vmenu-user-chip">
          <div className="vmenu-avatar">
            {loggedInUser ? (loggedInUser.role === 'Investigator' ? '👮' : '👤') : '🏛️'}
          </div>
          <div className="vmenu-user-meta">
            <p className="vmenu-user-name">
              {loggedInUser
                ? (loggedInUser.name || `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || loggedInUser.username)
                : 'Guest Citizen'}
            </p>
            <p className="vmenu-user-role">
              {loggedInUser
                ? (loggedInUser.role === 'Investigator' ? 'Police Officer (Investigator)' : 'Registered Citizen (Victim)')
                : 'Public Access Mode'}
            </p>
          </div>
        </div>

        {/* Navigation Breadcrumb / Back button when deep in a section */}
        {activeSection !== 'menu' && (
          <button className="vmenu-back-btn" onClick={() => setActiveSection('menu')}>
            &larr; Back to Main Menu
          </button>
        )}

        {/* Drawer Body */}
        <div className="vmenu-body">
          {/* ============================================================== */}
          {/* SECTION 1: ROOT MENU LIST                                      */}
          {/* ============================================================== */}
          {activeSection === 'menu' && (
            <ul className="vmenu-list">
              {loggedInUser && (
                <li>
                  <button className="vmenu-item-btn" onClick={() => setActiveSection('profile')}>
                    <span className="vmenu-item-icon">👤</span>
                    <div className="vmenu-item-content">
                      <span className="vmenu-item-title">My Account Details</span>
                      <span className="vmenu-item-desc">View registered profile and contact info</span>
                    </div>
                    <span className="vmenu-item-arrow">&rsaquo;</span>
                  </button>
                </li>
              )}

              <li>
                <button className="vmenu-item-btn" onClick={() => setActiveSection('settings')}>
                  <span className="vmenu-item-icon">⚙️</span>
                  <div className="vmenu-item-content">
                    <span className="vmenu-item-title">Portal Settings</span>
                    <span className="vmenu-item-desc">Adjust font size &amp; test slow internet</span>
                  </div>
                  <span className="vmenu-item-arrow">&rsaquo;</span>
                </button>
              </li>

              <li>
                <button className="vmenu-item-btn" onClick={() => setActiveSection('helpline')}>
                  <span className="vmenu-item-icon">📞</span>
                  <div className="vmenu-item-content">
                    <span className="vmenu-item-title">Cyber Helpline Info</span>
                    <span className="vmenu-item-desc">Emergency Helpline 1930 &amp; state contacts</span>
                  </div>
                  <span className="vmenu-item-arrow">&rsaquo;</span>
                </button>
              </li>

              {/* CRITICAL REQUIREMENT: DEVELOPERS SECTION */}
              <li>
                <button className="vmenu-item-btn vmenu-highlight-btn" onClick={() => setActiveSection('developers')}>
                  <span className="vmenu-item-icon">👨‍💻</span>
                  <div className="vmenu-item-content">
                    <span className="vmenu-item-title">Developers</span>
                    <span className="vmenu-item-desc">Project engineering team credits</span>
                  </div>
                  <span className="vmenu-item-arrow">&rsaquo;</span>
                </button>
              </li>

              <li>
                <button className="vmenu-item-btn" onClick={() => setActiveSection('database')}>
                  <span className="vmenu-item-icon">🗄️</span>
                  <div className="vmenu-item-content">
                    <span className="vmenu-item-title">Database &amp; SQL Inspector</span>
                    <span className="vmenu-item-desc">Live Oracle 11g status and SQL logs</span>
                  </div>
                  <span className="vmenu-item-arrow">&rsaquo;</span>
                </button>
              </li>

              {loggedInUser && (
                <li style={{ marginTop: '16px' }}>
                  <button className="vmenu-item-btn vmenu-logout-btn" onClick={() => { onClose(); onLogout(); }}>
                    <span className="vmenu-item-icon">🚪</span>
                    <div className="vmenu-item-content">
                      <span className="vmenu-item-title">Log Out</span>
                      <span className="vmenu-item-desc">Safely end your current session</span>
                    </div>
                  </button>
                </li>
              )}
            </ul>
          )}

          {/* ============================================================== */}
          {/* SECTION 2: MY ACCOUNT DETAILS                                  */}
          {/* ============================================================== */}
          {activeSection === 'profile' && loggedInUser && (
            <div className="vmenu-subpage">
              <h3 className="vmenu-sub-title">👤 My Account Details</h3>
              <div className="profile-card">
                <div className="profile-row">
                  <span className="p-label">Full Name:</span>
                  <span className="p-val">{loggedInUser.name || `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim()}</span>
                </div>
                <div className="profile-row">
                  <span className="p-label">Registered Mobile:</span>
                  <span className="p-val"><strong>+91 {loggedInUser.mobile_number || loggedInUser.phone}</strong></span>
                </div>
                <div className="profile-row">
                  <span className="p-label">Role:</span>
                  <span className="badge badge-success">{loggedInUser.role}</span>
                </div>
                {loggedInUser.email && (
                  <div className="profile-row">
                    <span className="p-label">Email:</span>
                    <span className="p-val">{loggedInUser.email}</span>
                  </div>
                )}
                {loggedInUser.role === 'Victim' && loggedInUser.city && (
                  <div className="profile-row">
                    <span className="p-label">Location:</span>
                    <span className="p-val">{loggedInUser.street}, {loggedInUser.city}, {loggedInUser.state} - {loggedInUser.pincode}</span>
                  </div>
                )}
                {loggedInUser.role === 'Investigator' && (
                  <>
                    <div className="profile-row">
                      <span className="p-label">Designation:</span>
                      <span className="p-val">{loggedInUser.rank}</span>
                    </div>
                    <div className="profile-row">
                      <span className="p-label">Assigned Cell:</span>
                      <span className="p-val">{loggedInUser.department_name}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 3: PORTAL SETTINGS (FONT SIZE & SLOW INTERNET)         */}
          {/* ============================================================== */}
          {activeSection === 'settings' && (
            <div className="vmenu-subpage">
              <h3 className="vmenu-sub-title">⚙️ Portal Settings</h3>

              <div className="setting-card">
                <label className="setting-label">Text Size (Accessibility):</label>
                <div className="font-size-group">
                  <button
                    className={`btn-font-size ${fontSize === 'small' ? 'active' : ''}`}
                    onClick={() => onChangeFontSize('small')}
                  >
                    A- (Normal)
                  </button>
                  <button
                    className={`btn-font-size ${fontSize === 'medium' ? 'active' : ''}`}
                    onClick={() => onChangeFontSize('medium')}
                  >
                    A (Medium)
                  </button>
                  <button
                    className={`btn-font-size ${fontSize === 'large' ? 'active' : ''}`}
                    onClick={() => onChangeFontSize('large')}
                  >
                    A+ (Large)
                  </button>
                </div>
              </div>

              <div className="setting-card">
                <label className="setting-label">Slow Internet Protection Test:</label>
                <p className="setting-help">
                  Simulates slow or unstable rural internet connectivity. Keeps the rotating National Emblem screen on with safety instructions.
                </p>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isSlowInternet}
                    onChange={(e) => onToggleSlowInternet(e.target.checked)}
                  />
                  <span className="slider"></span>
                  <span className="toggle-label-text">
                    {isSlowInternet ? 'Slow Internet Mode ON' : 'Normal High-Speed Mode'}
                  </span>
                </label>
              </div>

              <div className="setting-card">
                <label className="setting-label">Live SMS Notifications:</label>
                <p className="setting-help">Display on-screen OTP text alerts for instant copy-pasting.</p>
                <span className="badge badge-success">Always Enabled (Active)</span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 4: CYBER HELPLINE INFO (1930)                          */}
          {/* ============================================================== */}
          {activeSection === 'helpline' && (
            <div className="vmenu-subpage">
              <h3 className="vmenu-sub-title">📞 National Cyber Helpline</h3>
              <div className="helpline-banner-card">
                <div className="helpline-number">DIAL 1930</div>
                <p className="helpline-desc">Toll-Free National Helpline for Reporting Financial Cyber Frauds</p>
              </div>

              <div className="helpline-info-list">
                <div className="info-block">
                  <h4>⏱️ The Golden Hour Rule</h4>
                  <p>
                    If you lost money in a UPI, QR code, or credit card scam, call <strong>1930</strong> immediately within 2 hours. Police can freeze the fraud bank account before money is withdrawn!
                  </p>
                </div>
                <div className="info-block">
                  <h4>🌐 Official National Portal</h4>
                  <p>Visit <strong>cybercrime.gov.in</strong> to report all women/child safety issues or state nodal cyber crime incidents.</p>
                </div>
                <div className="info-block">
                  <h4>🏢 Cyberabad Cyber Cell</h4>
                  <p>Contact: 040-27852412 &bull; Gachibowli Road, Hyderabad, Telangana</p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 5: DEVELOPERS (CRITICAL REQUIREMENT)                   */}
          {/* ============================================================== */}
          {activeSection === 'developers' && (
            <div className="vmenu-subpage">
              <h3 className="vmenu-sub-title">👨‍💻 Developers &amp; Project Credits</h3>

              <div className="developers-official-card">
                <div className="dev-header">
                  <span className="dev-trophy">🏆</span>
                  <div>
                    <h4>National Cyber Crime Portal Project Team</h4>
                    <p>Database Management Systems (DBMS) Laboratory</p>
                  </div>
                </div>

                <div className="dev-role-badge">
                  Full-Stack Architecture &amp; Oracle 11g Database Engineering
                </div>

                <p className="dev-intro">
                  This portal was engineered and built end-to-end based on official Indian Government Design Guidelines and relational ER diagram specifications by:
                </p>

                <ul className="developers-list">
                  <li className="developer-item">
                    <span className="dev-dot"></span>
                    <div className="dev-details">
                      <strong>Kiran Vata (Krish Vats)</strong>
                      <span>Lead Full-Stack Architecture &amp; React GovTech UI Engineering</span>
                    </div>
                  </li>
                  <li className="developer-item">
                    <span className="dev-dot"></span>
                    <div className="dev-details">
                      <strong>Sai Dheepak</strong>
                      <span>Backend REST APIs, Express &amp; Passwordless OTP Engine</span>
                    </div>
                  </li>
                  <li className="developer-item">
                    <span className="dev-dot"></span>
                    <div className="dev-details">
                      <strong>Kuna Rakesh (Rakeesh)</strong>
                      <span>Oracle 11g Database Integration, Thick-Client Pooling &amp; DDL Engineering</span>
                    </div>
                  </li>
                  <li className="developer-item">
                    <span className="dev-dot"></span>
                    <div className="dev-details">
                      <strong>Shanmukha Reddy (Shanmukh)</strong>
                      <span>Data Architecture, Forensic Entities &amp; Security Validation</span>
                    </div>
                  </li>
                </ul>

                <div className="dev-footer-note">
                  &copy; 2025 National Cyber Crime Reporting &amp; Management Portal &bull; Government of India (Academic Initiative)
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 6: DATABASE & SQL INSPECTOR                            */}
          {/* ============================================================== */}
          {activeSection === 'database' && (
            <div className="vmenu-subpage">
              <h3 className="vmenu-sub-title">🗄️ Database &amp; SQL Inspector</h3>

              {loadingDb && <p className="loading-hint">Reading Oracle 11g XE status...</p>}

              {dbStatus && (
                <div className="db-status-chip">
                  <span className="db-light"></span>
                  <div>
                    <strong>{dbStatus.databaseMode}</strong>
                    <p>Active Schema: <code>EAC_24037_RAKESH</code> &bull; Port: 1521</p>
                  </div>
                </div>
              )}

              <div className="sql-stream-header">
                <h4>Recent Oracle 11g SQL Logs ({sqlLogs.length})</h4>
                <button className="btn-sm btn-secondary" onClick={fetchDatabaseInfo}>
                  🔄 Refresh
                </button>
              </div>

              {sqlLogs.length === 0 ? (
                <p className="empty-hint">No SQL queries executed in this session yet.</p>
              ) : (
                <div className="sql-vmenu-logs">
                  {sqlLogs.slice(-10).reverse().map((log, idx) => (
                    <div key={idx} className="sql-mini-item">
                      <div className="sql-mini-top">
                        <span className={`badge-op badge-${log.operation?.toLowerCase()}`}>
                          {log.operation}
                        </span>
                        <span className="sql-table-name">{log.entity?.toUpperCase()}</span>
                        <span className="sql-time">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <pre className="sql-mini-code"><code>{log.sql}</code></pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
