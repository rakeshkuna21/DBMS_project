import React, { useState, useEffect } from 'react';
import CaseManagementModal from './CaseManagementModal.jsx';

const STATUS_OPTIONS = ['Pending', 'Under Investigation', 'In Court', 'Resolved'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export default function InvestigatorDashboard({
  user,
  onTriggerLoader,
  activeTab,
  onSelectTab,
  onDispatchTopToast
}) {
  const [stats, setStats] = useState({
    total_cases: 0,
    active_investigations: 0,
    suspects_arrested: 0,
    upcoming_hearings: 0
  });
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCase, setEditingCase] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [selectedCaseForModal, setSelectedCaseForModal] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchCases();
  }, []);

  const fetchStats = async () => {
    try {
      const url = user?.investigator_id ? `/api/cases/stats/summary?investigator_id=${encodeURIComponent(user.investigator_id)}` : '/api/cases/stats/summary';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch KPI stats:', err);
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const url = user?.investigator_id ? `/api/cases?investigator_id=${encodeURIComponent(user.investigator_id)}` : '/api/cases';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCases(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInlineChange = (caseId, field, value) => {
    setEditingCase(prev => ({
      ...prev,
      [caseId]: {
        ...(prev[caseId] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveCase = async (c) => {
    const edits = editingCase[c.case_id] || {};
    const newStatus = edits.case_status !== undefined ? edits.case_status : c.case_status;
    const newPriority = edits.priority_level !== undefined ? edits.priority_level : c.priority_level;

    setSaveStatus(prev => ({ ...prev, [c.case_id]: 'saving' }));
    onTriggerLoader('Updating case status in Oracle 11g database...', 800);

    try {
      const res = await fetch(`/api/cases/${c.case_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_status: newStatus,
          priority_level: newPriority,
          investigator_id: user?.investigator_id || c.investigator_id
        })
      });

      if (res.ok) {
        setSaveStatus(prev => ({ ...prev, [c.case_id]: 'saved' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [c.case_id]: null }));
        }, 2000);
        fetchCases();
        fetchStats();
      } else {
        setSaveStatus(prev => ({ ...prev, [c.case_id]: 'error' }));
      }
    } catch (err) {
      setSaveStatus(prev => ({ ...prev, [c.case_id]: 'error' }));
    }
  };

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.case_status === statusFilter;
    const matchesSearch =
      c.case_id.toString().includes(searchTerm.trim()) ||
      (c.case_title && c.case_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.victim_name && c.victim_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="investigator-dashboard-container">
      {/* Officer Welcome Header */}
      <div className="officer-hero-banner">
        <div>
          <span className="badge badge-success">
            OFFICIAL LAW ENFORCEMENT DESK &bull; BADGE ID #{user?.officer_id || 'OFFICER'}
          </span>
          <h2 className="officer-title">
            Welcome, {user?.name || 'Officer'} ({user?.rank || 'Investigating Officer'})
          </h2>
          <p className="officer-meta">
            {user?.department_name || 'Cyber Crime Police Cell'} &bull; Duty Circle ID: <strong>{user?.officer_id || 'N/A'}</strong> &bull; Official Mobile: +91 {user?.mobile_number || 'N/A'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-kpi-grid">
        <div className="kpi-card kpi-navy">
          <div className="kpi-icon">📁</div>
          <div className="kpi-info">
            <span className="kpi-num">{stats.total_cases}</span>
            <span className="kpi-label">Total Complaints</span>
          </div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-icon">🔍</div>
          <div className="kpi-info">
            <span className="kpi-num">{stats.active_investigations}</span>
            <span className="kpi-label">Active Investigations</span>
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-icon">🎯</div>
          <div className="kpi-info">
            <span className="kpi-num">{stats.suspects_arrested}</span>
            <span className="kpi-label">Suspects Tracked / Arrested</span>
          </div>
        </div>

        <div className="kpi-card kpi-saffron">
          <div className="kpi-icon">🏛️</div>
          <div className="kpi-info">
            <span className="kpi-num">{stats.upcoming_hearings}</span>
            <span className="kpi-label">Court Hearings Scheduled</span>
          </div>
        </div>
      </div>

      {/* Master Case Management Table */}
      <section className="gov-card">
        <div className="table-filter-toolbar">
          <div>
            <h2 className="section-title">📂 Department Cyber Crime Case Registry</h2>
            <p className="section-subtitle">
              Manage status, log seized digital evidence, register suspects, and docket cases to Court.
            </p>
          </div>

          <div className="toolbar-controls">
            <input
              type="text"
              className="form-input filter-search-input"
              placeholder="Search by Case ID, title, or citizen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="form-select filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="In Court">In Court</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="loading-hint">Loading assigned cases from Oracle 11g database...</p>
        ) : cases.length === 0 ? (
          <div className="empty-cases-box" style={{ padding: '2.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.6rem' }}>🛡️</div>
            <h3 style={{ color: '#1E293B', fontSize: '1.15rem', marginBottom: '0.4rem', fontWeight: '700' }}>
              No Complaints Currently Assigned to Badge #{user?.officer_id || 'OFFICER'}
            </h3>
            <p style={{ color: '#64748B', maxWidth: '580px', margin: '0 auto', fontSize: '0.92rem', lineHeight: '1.6' }}>
              All cases in your jurisdiction are strictly isolated. Once a citizen files a complaint assigned to your duty circle, it will appear here in real-time. Unauthorized officers cannot view or modify your case dossiers.
            </p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="empty-cases-box">
            <p>No complaints match your filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Complaint Title &amp; Details</th>
                  <th>Citizen (Victim)</th>
                  <th>Investigation Stage</th>
                  <th>Priority</th>
                  <th>Assigned Officer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map(c => {
                  const edits = editingCase[c.case_id] || {};
                  const currentStatus = edits.case_status !== undefined ? edits.case_status : c.case_status;
                  const currentPriority = edits.priority_level !== undefined ? edits.priority_level : c.priority_level;
                  const isDirty = edits.case_status !== undefined || edits.priority_level !== undefined;
                  const saveState = saveStatus[c.case_id];

                  return (
                    <tr key={c.case_id}>
                      <td><strong>#{c.case_id}</strong></td>
                      <td>
                        <strong>{c.case_title}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {c.crime_type_name} &bull; Filed: {c.reported_date}
                        </div>
                      </td>
                      <td>
                        <strong>{c.victim_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Ph: {c.victim_phone} &bull; {c.victim_city}
                        </div>
                      </td>
                      <td>
                        <select
                          className="inline-select"
                          value={currentStatus}
                          onChange={(e) => handleInlineChange(c.case_id, 'case_status', e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="inline-select"
                          value={currentPriority}
                          onChange={(e) => handleInlineChange(c.case_id, 'priority_level', e.target.value)}
                        >
                          {PRIORITY_OPTIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className="officer-name-tag">{c.investigator_name}</span>
                      </td>
                      <td className="action-cell">
                        <button
                          className={`btn btn-sm ${isDirty ? 'btn-success' : 'btn-secondary'}`}
                          disabled={!isDirty || saveState === 'saving'}
                          onClick={() => handleSaveCase(c)}
                        >
                          {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? '✓ Saved' : 'Save'}
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ marginLeft: '6px' }}
                          onClick={() => setSelectedCaseForModal(c)}
                        >
                          📂 Manage Case Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Case Management Modal (Evidence, Suspects, Court Hearings) */}
      {selectedCaseForModal && (
        <CaseManagementModal
          caseData={selectedCaseForModal}
          onClose={() => {
            setSelectedCaseForModal(null);
            fetchCases();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
