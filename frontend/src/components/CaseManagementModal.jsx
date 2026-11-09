import React, { useState, useEffect } from 'react';

export default function CaseManagementModal({ caseData, investigators = [], onClose }) {
  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'suspects' | 'court'
  
  // Data states
  const [devices, setDevices] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [suspects, setSuspects] = useState([]);
  const [courts, setCourts] = useState([]);
  const [hearings, setHearings] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Forms
  const [newDevice, setNewDevice] = useState({
    device_type: 'Smartphone',
    brand: '',
    model: '',
    serial_no: '',
    mac_address: '',
    operating_system: 'Android 14'
  });

  const [newEvidence, setNewEvidence] = useState({
    device_id: '',
    evidence_type: 'Disk Image / Bitstream Copy',
    file_hash: '',
    file_size: '',
    ip_address: '',
    storage_location: ''
  });

  const [newSuspect, setNewSuspect] = useState({
    name: '',
    gender: 'Male',
    criminal_history: 'None',
    city: '',
    state: '',
    phone: '',
    email: '',
    involvement_type: 'Primary Accused',
    arrest_status: 'At Large',
    charges: 'IT Act Sec 66C, 66D & IPC 420'
  });

  const [newHearing, setNewHearing] = useState({
    court_id: '',
    hearing_date: '',
    hearing_status: 'Scheduled',
    verdict: '',
    next_hearing_date: '',
    judge_name: 'Hon. Special Cyber Magistrate',
    court_room_no: 'Room 3C'
  });

  const caseId = caseData.case_id;

  useEffect(() => {
    loadAllCaseEntities();
  }, [caseId]);

  const showNotification = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const loadAllCaseEntities = async () => {
    setLoading(true);
    try {
      const [devRes, evRes, suspRes, courtsRes, hearRes] = await Promise.all([
        fetch(`/api/devices/case/${caseId}`).then(r => r.json()).catch(() => []),
        fetch(`/api/evidence/case/${caseId}`).then(r => r.json()).catch(() => []),
        fetch(`/api/suspects/case/${caseId}`).then(r => r.json()).catch(() => []),
        fetch('/api/courts').then(r => r.json()).catch(() => []),
        fetch(`/api/hearings/case/${caseId}`).then(r => r.json()).catch(() => [])
      ]);

      setDevices(Array.isArray(devRes) ? devRes : []);
      setEvidenceList(Array.isArray(evRes) ? evRes : []);
      setSuspects(Array.isArray(suspRes) ? suspRes : []);
      setCourts(Array.isArray(courtsRes) ? courtsRes : []);
      setHearings(Array.isArray(hearRes) ? hearRes : []);
      
      if (Array.isArray(courtsRes) && courtsRes.length > 0 && !newHearing.court_id) {
        setNewHearing(prev => ({ ...prev, court_id: courtsRes[0].court_id }));
      }
    } catch (err) {
      console.error('Failed to load case entities:', err);
      showNotification('Error loading case entities', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Add Device
  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newDevice.brand || !newDevice.model) {
      showNotification('Brand and model are required', 'danger');
      return;
    }
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDevice, case_id: caseId })
      });
      if (res.ok) {
        showNotification('Digital device logged successfully!');
        setNewDevice({
          device_type: 'Smartphone',
          brand: '',
          model: '',
          serial_no: '',
          mac_address: '',
          operating_system: 'Android 14'
        });
        loadAllCaseEntities();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Failed to add device', 'danger');
      }
    } catch (err) {
      showNotification('Failed to add device', 'danger');
    }
  };

  // Add Evidence
  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!newEvidence.evidence_type) {
      showNotification('Evidence type is required', 'danger');
      return;
    }
    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEvidence, case_id: caseId })
      });
      if (res.ok) {
        showNotification('Forensic evidence recorded successfully!');
        setNewEvidence({
          device_id: '',
          evidence_type: 'Disk Image / Bitstream Copy',
          file_hash: '',
          file_size: '',
          ip_address: '',
          storage_location: ''
        });
        loadAllCaseEntities();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Failed to add evidence', 'danger');
      }
    } catch (err) {
      showNotification('Failed to add evidence', 'danger');
    }
  };

  // Add Suspect
  const handleAddSuspect = async (e) => {
    e.preventDefault();
    if (!newSuspect.name) {
      showNotification('Suspect name is required', 'danger');
      return;
    }
    try {
      const res = await fetch('/api/suspects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSuspect, case_id: caseId })
      });
      if (res.ok) {
        showNotification('Suspect record filed successfully!');
        setNewSuspect({
          name: '',
          gender: 'Male',
          criminal_history: 'None',
          city: '',
          state: '',
          phone: '',
          email: '',
          involvement_type: 'Primary Accused',
          arrest_status: 'At Large',
          charges: 'IT Act Sec 66C, 66D & IPC 420'
        });
        loadAllCaseEntities();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Failed to add suspect', 'danger');
      }
    } catch (err) {
      showNotification('Failed to add suspect', 'danger');
    }
  };

  // Update Suspect
  const handleUpdateSuspect = async (suspectId, arrest_status, charges) => {
    try {
      const res = await fetch(`/api/suspects/${suspectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arrest_status, charges })
      });
      if (res.ok) {
        showNotification('Suspect status updated successfully!');
        loadAllCaseEntities();
      }
    } catch (err) {
      showNotification('Failed to update suspect', 'danger');
    }
  };

  // Add Hearing
  const handleAddHearing = async (e) => {
    e.preventDefault();
    if (!newHearing.court_id || !newHearing.hearing_date) {
      showNotification('Court and hearing date are required', 'danger');
      return;
    }
    try {
      const res = await fetch('/api/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newHearing, case_id: caseId })
      });
      if (res.ok) {
        showNotification('Court hearing scheduled successfully!');
        setNewHearing({
          court_id: courts[0]?.court_id || '',
          hearing_date: '',
          hearing_status: 'Scheduled',
          verdict: '',
          next_hearing_date: '',
          judge_name: 'Hon. Special Cyber Magistrate',
          court_room_no: 'Room 3C'
        });
        loadAllCaseEntities();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Failed to schedule hearing', 'danger');
      }
    } catch (err) {
      showNotification('Failed to schedule hearing', 'danger');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              ⚖️ Case Investigation &amp; Entity Dossier: Case #{caseId}
            </h2>
            <p className="modal-subtitle">
              {caseData.case_title} &bull; Victim: {caseData.victim_name || 'Citizen'} &bull; Status: <strong>{caseData.case_status}</strong>
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {/* Alerts */}
        {msg.text && (
          <div className={`alert alert-${msg.type}`} style={{ margin: '12px 20px 0' }}>
            {msg.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button
            className={`modal-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            💾 Digital Evidence &amp; Devices ({devices.length + evidenceList.length})
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'suspects' ? 'active' : ''}`}
            onClick={() => setActiveTab('suspects')}
          >
            👤 Suspects &amp; Arrests ({suspects.length})
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'court' ? 'active' : ''}`}
            onClick={() => setActiveTab('court')}
          >
            🏛️ Court &amp; Hearings ({hearings.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="modal-body">
          {loading && <div className="loading-spinner">Synchronizing entity data with Oracle 11g...</div>}

          {/* ============================================================== */}
          {/* TAB 1: DIGITAL EVIDENCE & DEVICES                              */}
          {/* ============================================================== */}
          {activeTab === 'evidence' && !loading && (
            <div className="tab-pane">
              {/* Registered Digital Devices */}
              <div className="sub-section">
                <h3 className="sub-title">📱 Registered Digital Devices (DIGITAL_DEVICE)</h3>
                {devices.length === 0 ? (
                  <p className="empty-hint">No hardware devices logged for this case yet.</p>
                ) : (
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Device ID</th>
                        <th>Device Type</th>
                        <th>Make &amp; Model</th>
                        <th>Serial No</th>
                        <th>MAC Address</th>
                        <th>OS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map(d => (
                        <tr key={d.device_id}>
                          <td><strong>#{d.device_id}</strong></td>
                          <td><span className="badge badge-info">{d.device_type}</span></td>
                          <td>{d.brand} {d.model}</td>
                          <td><code>{d.serial_no}</code></td>
                          <td><code>{d.mac_address}</code></td>
                          <td>{d.operating_system}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Add Device Form */}
                <form className="inline-add-box" onSubmit={handleAddDevice}>
                  <h4>+ Register New Seized / Affected Hardware Device</h4>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Device Type</label>
                      <select
                        className="form-select"
                        value={newDevice.device_type}
                        onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                      >
                        <option value="Smartphone">Smartphone</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Desktop PC">Desktop PC</option>
                        <option value="Server / Storage">Server / Storage</option>
                        <option value="Router / Modem">Router / Modem</option>
                        <option value="Smart Card / POS Terminal">Smart Card / POS Terminal</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Brand / Manufacturer</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Apple, Samsung, Dell"
                        value={newDevice.brand}
                        onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Model Name / Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. iPhone 15 Pro, Inspiron 14"
                        value={newDevice.model}
                        onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Serial Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. SN99882233"
                        value={newDevice.serial_no}
                        onChange={(e) => setNewDevice({ ...newDevice, serial_no: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>MAC Address</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 00:1B:44:11:3A:B7"
                        value={newDevice.mac_address}
                        onChange={(e) => setNewDevice({ ...newDevice, mac_address: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Operating System</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Android 14, iOS 17, Windows 11"
                        value={newDevice.operating_system}
                        onChange={(e) => setNewDevice({ ...newDevice, operating_system: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                    + Record Device to Oracle 11g
                  </button>
                </form>
              </div>

              {/* Forensic Evidence Table */}
              <div className="sub-section" style={{ marginTop: '24px' }}>
                <h3 className="sub-title">🔬 Forensic Evidence Vault (EVIDENCE)</h3>
                {evidenceList.length === 0 ? (
                  <p className="empty-hint">No forensic evidence files linked to this case yet.</p>
                ) : (
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Evidence ID</th>
                        <th>Linked Device</th>
                        <th>Evidence Type</th>
                        <th>File Hash (SHA-256 / MD5)</th>
                        <th>Size</th>
                        <th>IP Address</th>
                        <th>Vault Storage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceList.map(e => (
                        <tr key={e.evidence_id}>
                          <td><strong>#{e.evidence_id}</strong></td>
                          <td><span className="badge badge-default">{e.device_details || `Dev #${e.device_id || 'N/A'}`}</span></td>
                          <td><strong>{e.evidence_type}</strong></td>
                          <td><code style={{ fontSize: '0.75rem' }}>{e.file_hash}</code></td>
                          <td>{e.file_size}</td>
                          <td><code>{e.ip_address}</code></td>
                          <td style={{ fontSize: '0.8rem', color: '#475569' }}>{e.storage_location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Add Evidence Form */}
                <form className="inline-add-box" onSubmit={handleAddEvidence}>
                  <h4>+ Attach Forensic Evidence Artifact</h4>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Linked Seized Device</label>
                      <select
                        className="form-select"
                        value={newEvidence.device_id}
                        onChange={(e) => setNewEvidence({ ...newEvidence, device_id: e.target.value })}
                      >
                        <option value="">-- Standalone / Cloud Evidence --</option>
                        {devices.map(d => (
                          <option key={d.device_id} value={d.device_id}>
                            #{d.device_id}: {d.brand} {d.model} ({d.device_type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Evidence Classification</label>
                      <select
                        className="form-select"
                        value={newEvidence.evidence_type}
                        onChange={(e) => setNewEvidence({ ...newEvidence, evidence_type: e.target.value })}
                      >
                        <option value="Disk Image / Bitstream Copy">Disk Image / Bitstream Copy</option>
                        <option value="RAM Dump / Volatile Memory">RAM Dump / Volatile Memory</option>
                        <option value="Transaction Screenshot & APK Log">Transaction Screenshot &amp; APK Log</option>
                        <option value="Network Packet Capture (PCAP)">Network Packet Capture (PCAP)</option>
                        <option value="Call Detail Records (CDR) / IPDR">Call Detail Records (CDR) / IPDR</option>
                        <option value="Server Access Logs & TLS Handshakes">Server Access Logs &amp; TLS Handshakes</option>
                        <option value="Bank Gateway Settlement Export">Bank Gateway Settlement Export</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>File Cryptographic Hash</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb924"
                        value={newEvidence.file_hash}
                        onChange={(e) => setNewEvidence({ ...newEvidence, file_hash: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>File Size</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 1.8 GB"
                        value={newEvidence.file_size}
                        onChange={(e) => setNewEvidence({ ...newEvidence, file_size: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Originating / Gateway IP</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 103.21.244.15"
                        value={newEvidence.ip_address}
                        onChange={(e) => setNewEvidence({ ...newEvidence, ip_address: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Physical / Digital Vault Location</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. /evidence_vault/2024/disk_img.dd"
                        value={newEvidence.storage_location}
                        onChange={(e) => setNewEvidence({ ...newEvidence, storage_location: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                    + Commit Evidence to Oracle 11g
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: SUSPECTS & ARRESTS                                      */}
          {/* ============================================================== */}
          {activeTab === 'suspects' && !loading && (
            <div className="tab-pane">
              <div className="sub-section">
                <h3 className="sub-title">🕵️ Identified Suspects &amp; Interrogations (SUSPECT)</h3>
                {suspects.length === 0 ? (
                  <p className="empty-hint">No suspect records logged for this cyber investigation.</p>
                ) : (
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Suspect ID</th>
                        <th>Name &amp; Alias</th>
                        <th>Involvement</th>
                        <th>Location</th>
                        <th>Arrest Status</th>
                        <th>Statutory Charges</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspects.map(s => (
                        <tr key={s.suspect_id}>
                          <td><strong>#{s.suspect_id}</strong></td>
                          <td>
                            <strong>{s.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {s.gender} &bull; Ph: {s.phone || 'N/A'}
                            </div>
                          </td>
                          <td><span className="badge badge-info">{s.involvement_type}</span></td>
                          <td>{s.city ? `${s.city}, ${s.state}` : 'Unknown Location'}</td>
                          <td>
                            <select
                              className="inline-select"
                              value={s.arrest_status}
                              onChange={(e) => handleUpdateSuspect(s.suspect_id, e.target.value, s.charges)}
                            >
                              <option value="At Large">At Large</option>
                              <option value="Tracked">Tracked</option>
                              <option value="Arrested">Arrested</option>
                              <option value="On Bail">On Bail</option>
                              <option value="Judicial Custody">Judicial Custody</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.8rem', padding: '4px 6px' }}
                              value={s.charges}
                              onChange={(e) => {
                                const newCharges = e.target.value;
                                setSuspects(suspects.map(x => x.suspect_id === s.suspect_id ? { ...x, charges: newCharges } : x));
                              }}
                              onBlur={(e) => handleUpdateSuspect(s.suspect_id, s.arrest_status, e.target.value)}
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-save"
                              onClick={() => handleUpdateSuspect(s.suspect_id, s.arrest_status, s.charges)}
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Add Suspect Form */}
                <form className="inline-add-box" onSubmit={handleAddSuspect}>
                  <h4>+ Register Suspect / Accused Profile</h4>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Suspect Full Name / Known Alias</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Ramesh 'Phisher' Verma"
                        value={newSuspect.name}
                        onChange={(e) => setNewSuspect({ ...newSuspect, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Involvement Role</label>
                      <select
                        className="form-select"
                        value={newSuspect.involvement_type}
                        onChange={(e) => setNewSuspect({ ...newSuspect, involvement_type: e.target.value })}
                      >
                        <option value="Primary Accused">Primary Accused</option>
                        <option value="Accomplice / Handler">Accomplice / Handler</option>
                        <option value="Mule Account Holder">Mule Account Holder</option>
                        <option value="Darknet Facilitator">Darknet Facilitator</option>
                        <option value="SIM Card Vendor (Fraud)">SIM Card Vendor (Fraud)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Arrest Status</label>
                      <select
                        className="form-select"
                        value={newSuspect.arrest_status}
                        onChange={(e) => setNewSuspect({ ...newSuspect, arrest_status: e.target.value })}
                      >
                        <option value="At Large">At Large</option>
                        <option value="Tracked">Tracked</option>
                        <option value="Arrested">Arrested</option>
                        <option value="On Bail">On Bail</option>
                        <option value="Judicial Custody">Judicial Custody</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>City &amp; State</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Jamtara, Jharkhand"
                        value={newSuspect.city}
                        onChange={(e) => setNewSuspect({ ...newSuspect, city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone / VoIP</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 9876543210"
                        value={newSuspect.phone}
                        onChange={(e) => setNewSuspect({ ...newSuspect, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Criminal History &amp; Modus</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Repeat phishing offender"
                        value={newSuspect.criminal_history}
                        onChange={(e) => setNewSuspect({ ...newSuspect, criminal_history: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 3' }}>
                      <label>Applicable Legal Sections (IT Act &amp; BNS/IPC)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. IT Act Sec 66C, 66D &amp; IPC 420"
                        value={newSuspect.charges}
                        onChange={(e) => setNewSuspect({ ...newSuspect, charges: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                    + Record Suspect to Oracle 11g
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: COURT & CASE HEARINGS                                   */}
          {/* ============================================================== */}
          {activeTab === 'court' && !loading && (
            <div className="tab-pane">
              <div className="sub-section">
                <h3 className="sub-title">🏛️ Judicial Hearings &amp; Court Orders (CASE_HEARING)</h3>
                {hearings.length === 0 ? (
                  <p className="empty-hint">No court hearings scheduled for this case yet.</p>
                ) : (
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Hearing #</th>
                        <th>Court</th>
                        <th>Hearing Date</th>
                        <th>Status</th>
                        <th>Judge &amp; Room</th>
                        <th>Interim Verdict / Orders</th>
                        <th>Next Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hearings.map(h => (
                        <tr key={h.hearing_no}>
                          <td><strong>Hearing #{h.hearing_no}</strong></td>
                          <td>
                            <strong>{h.court_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{h.court_location}</div>
                          </td>
                          <td><strong>{new Date(h.hearing_date).toLocaleDateString('en-IN')}</strong></td>
                          <td>
                            <span className={`badge ${h.hearing_status === 'Completed' ? 'badge-success' : 'badge-saffron'}`}>
                              {h.hearing_status}
                            </span>
                          </td>
                          <td>{h.judge_name} ({h.court_room_no})</td>
                          <td>{h.verdict || 'Awaiting Court Proceedings'}</td>
                          <td>
                            {h.next_hearing_date
                              ? new Date(h.next_hearing_date).toLocaleDateString('en-IN')
                              : 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Add Hearing Form */}
                <form className="inline-add-box" onSubmit={handleAddHearing}>
                  <h4>+ Docket Case to Judicial Court Calendar</h4>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Designated Court</label>
                      <select
                        className="form-select"
                        value={newHearing.court_id}
                        onChange={(e) => setNewHearing({ ...newHearing, court_id: e.target.value })}
                        required
                      >
                        {courts.map(c => (
                          <option key={c.court_id} value={c.court_id}>
                            {c.court_name} ({c.location})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Hearing Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={newHearing.hearing_date}
                        onChange={(e) => setNewHearing({ ...newHearing, hearing_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Hearing Status</label>
                      <select
                        className="form-select"
                        value={newHearing.hearing_status}
                        onChange={(e) => setNewHearing({ ...newHearing, hearing_status: e.target.value })}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Adjourned">Adjourned</option>
                        <option value="Verdict Reserved">Verdict Reserved</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Presiding Judge Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Hon. Justice S. Narasimha"
                        value={newHearing.judge_name}
                        onChange={(e) => setNewHearing({ ...newHearing, judge_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Court Room No.</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Room 4B"
                        value={newHearing.court_room_no}
                        onChange={(e) => setNewHearing({ ...newHearing, court_room_no: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Next Hearing Date (Adjournment)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={newHearing.next_hearing_date}
                        onChange={(e) => setNewHearing({ ...newHearing, next_hearing_date: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 3' }}>
                      <label>Judicial Verdict / Directions / Order Summary</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Accused remanded to 14 days judicial custody; Bank ordered to freeze mule account."
                        value={newHearing.verdict}
                        onChange={(e) => setNewHearing({ ...newHearing, verdict: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                    + Docket Hearing to Oracle 11g
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close Dossier</button>
        </div>
      </div>
    </div>
  );
}
