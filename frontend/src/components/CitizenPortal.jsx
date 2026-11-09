import React, { useState, useEffect } from 'react';
import ReceiptModal from './ReceiptModal.jsx';

const COMPLAINT_MODES = ['Online Portal', 'Helpline 1930', 'Police Station Visit', 'Email'];
const DEVICE_TYPES = ['Mobile Phone', 'Laptop', 'Desktop PC', 'Tablet', 'Other Device'];
const OPERATING_SYSTEMS = ['Android 14', 'Android 13 / Earlier', 'iOS (Apple iPhone)', 'Windows 11', 'Windows 10', 'macOS (MacBook)', 'Other'];

export default function CitizenPortal({
  user,
  onTriggerLoader,
  activeTab: externalTab,
  onSelectTab,
  preselectedCategory,
  onDispatchTopToast
}) {
  const [activeTab, setActiveTab] = useState(externalTab || 'overview');
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [allHearings, setAllHearings] = useState([]);

  // Suspect Intelligence State
  const [suspectsList, setSuspectsList] = useState([]);
  const [suspectSearch, setSuspectSearch] = useState('');
  const [suspectFilter, setSuspectFilter] = useState('ALL');
  const [suspectsLoading, setSuspectsLoading] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Feedback State
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState('5');

  // Selected Case for Receipt Modal
  const [receiptCase, setReceiptCase] = useState(null);

  // New Complaint Form State (3 Steps)
  const [complaintStep, setComplaintStep] = useState(1);
  const [incidentData, setIncidentData] = useState({
    case_title: '',
    crime_type_id: '',
    incident_date: '',
    complaint_mode: 'Online Portal',
    description: ''
  });
  const [deviceData, setDeviceData] = useState({
    device_type: 'Mobile Phone',
    brand: '',
    model: '',
    operating_system: 'Android 14',
    serial_no: ''
  });
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');

  const victimId = user?.victim_id || user?.user_id || 1;

  // Sync external tab prop if parent updates it
  useEffect(() => {
    if (externalTab) {
      setActiveTab(externalTab);
    }
  }, [externalTab]);

  // Sync preselectedCategory if user chose specific option in dropdown
  useEffect(() => {
    if (preselectedCategory) {
      setIncidentData(prev => ({ ...prev, crime_type_id: String(preselectedCategory) }));
    }
  }, [preselectedCategory]);

  useEffect(() => {
    fetchCrimeTypes();
    fetchMyCases();
    fetchSuspects();
  }, [victimId]);

  const switchTab = (newTab) => {
    setActiveTab(newTab);
    if (onSelectTab) {
      onSelectTab(newTab);
    }
  };

  const fetchCrimeTypes = async () => {
    try {
      const res = await fetch('/api/crime-types');
      if (res.ok) {
        const data = await res.json();
        setCrimeTypes(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0 && !incidentData.crime_type_id) {
          setIncidentData(prev => ({ ...prev, crime_type_id: data[0].crime_type_id.toString() }));
        }
      }
    } catch (err) {
      console.error('Failed to load crime types:', err);
    }
  };

  const fetchMyCases = async () => {
    setCasesLoading(true);
    try {
      const res = await fetch(`/api/cases?victim_id=${victimId}`);
      if (res.ok) {
        const data = await res.json();
        const casesList = Array.isArray(data) ? data : [];
        setMyCases(casesList);

        // Fetch hearings for each case
        const hearingPromises = casesList.map(c =>
          fetch(`/api/hearings/case/${c.case_id}`).then(r => r.json()).catch(() => [])
        );
        const results = await Promise.all(hearingPromises);
        setAllHearings(results.flat());
      }
    } catch (err) {
      console.error('Failed to fetch citizen cases:', err);
    } finally {
      setCasesLoading(false);
    }
  };

  const fetchSuspects = async () => {
    setSuspectsLoading(true);
    try {
      const res = await fetch('/api/suspects');
      if (res.ok) {
        const data = await res.json();
        setSuspectsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load suspects:', err);
    } finally {
      setSuspectsLoading(false);
    }
  };

  // Validations
  const isValidPastDate = (dateStr) => {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    const today = new Date();
    return selected <= today;
  };

  const isStep1Valid =
    incidentData.case_title.trim().length >= 6 &&
    incidentData.crime_type_id &&
    isValidPastDate(incidentData.incident_date) &&
    incidentData.description.trim().length >= 15;

  const isStep2Valid =
    deviceData.device_type &&
    deviceData.brand.trim().length >= 2 &&
    deviceData.model.trim().length >= 2 &&
    deviceData.operating_system;

  const handleNextStep1 = () => {
    if (!isStep1Valid) return;
    if (onTriggerLoader) onTriggerLoader('Moving to phone/computer details...', 900);
    setComplaintStep(2);
  };

  const handleNextStep2 = () => {
    if (!isStep2Valid) return;
    if (onTriggerLoader) onTriggerLoader('Preparing summary for final submission...', 900);
    setComplaintStep(3);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!declarationChecked) return;
    setSubmitError('');
    if (onTriggerLoader) onTriggerLoader('Submitting your complaint to National Database...', 1500);

    try {
      const casePayload = {
        victim_id: victimId,
        crime_type_id: parseInt(incidentData.crime_type_id, 10),
        case_title: incidentData.case_title.trim(),
        incident_date: incidentData.incident_date,
        complaint_mode: incidentData.complaint_mode,
        description: incidentData.description.trim(),
        priority_level: 'High'
      };

      const caseRes = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(casePayload)
      });
      const newCase = await caseRes.json();

      if (!caseRes.ok) {
        throw new Error(newCase.error || 'Failed to file case.');
      }

      const assignedCaseId = newCase.case_id || newCase.id;

      // Submit Device
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: assignedCaseId,
          ...deviceData
        })
      });

      setSubmitSuccessMsg(`Complaint registered successfully! Your official Complaint Number (Case ID) is #${assignedCaseId}.`);
      setIncidentData({
        case_title: '',
        crime_type_id: crimeTypes[0]?.crime_type_id?.toString() || '1',
        incident_date: '',
        complaint_mode: 'Online Portal',
        description: ''
      });
      setDeviceData({
        device_type: 'Mobile Phone',
        brand: '',
        model: '',
        operating_system: 'Android 14',
        serial_no: ''
      });
      setDeclarationChecked(false);
      setComplaintStep(1);

      await fetchMyCases();
      switchTab('cases');

      if (onDispatchTopToast) {
        onDispatchTopToast({
          type: 'verified',
          title: 'Complaint Registered',
          message: `Official Acknowledgement Number #${assignedCaseId} generated in Oracle 11g.`
        });
      }

      // Auto open receipt for citizen
      setReceiptCase(newCase);
    } catch (err) {
      setSubmitError(err.message || 'Error recording complaint.');
    }
  };

  // Filter suspects
  const filteredSuspects = suspectsList.filter(s => {
    const q = suspectSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.account_no && s.account_no.toLowerCase().includes(q)) ||
      (s.upi_id && s.upi_id.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (suspectFilter === 'MULE') return s.account_no || s.involvement_type?.includes('Mule');
    if (suspectFilter === 'FROZEN') return s.arrest_status?.includes('Frozen');
    if (suspectFilter === 'HIGH') return s.risk_level?.includes('High') || s.risk_level?.includes('Severe');
    return true;
  });

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    if (onDispatchTopToast) {
      onDispatchTopToast({
        type: 'verified',
        title: 'Feedback Received',
        message: 'Thank you for your valuable feedback. Your remarks have been logged securely.'
      });
    }
  };

  return (
    <div className="citizen-portal-container">
      {/* Citizen Navigation Sub-Tabs */}
      <nav className="citizen-subnav" aria-label="Citizen Portal Navigation">
        <button
          type="button"
          className={`subnav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => switchTab('overview')}
        >
          🏠 Overview &amp; Helpline 1930
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => switchTab('report')}
        >
          ✍️ Report a Cyber Crime
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeTab === 'cases' ? 'active' : ''}`}
          onClick={() => switchTab('cases')}
        >
          📋 My Complaints &amp; Status ({myCases.length})
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeTab === 'suspect' ? 'active' : ''}`}
          onClick={() => switchTab('suspect')}
        >
          🔎 National Suspect Registry
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeTab === 'hearings' ? 'active' : ''}`}
          onClick={() => switchTab('hearings')}
        >
          🏛️ Court Hearings ({allHearings.length})
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeTab === 'learning' ? 'active' : ''}`}
          onClick={() => switchTab('learning')}
        >
          📚 Learning Corner &amp; Tips
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeTab === 'help' ? 'active' : ''}`}
          onClick={() => switchTab('help')}
        >
          📞 Help &amp; Feedback
        </button>
      </nav>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & HELPLINE 1930                                      */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="tab-view-content">
          <div className="helpline-hero-box">
            <div className="hh-left">
              <span className="hh-badge">NATIONAL CYBER HELPLINE</span>
              <h2 className="hh-dial">DIAL 1930</h2>
              <p className="hh-sub">Financial Cyber Frauds Emergency Assistance &bull; Available 24x7 Toll Free</p>
            </div>
            <div className="hh-right">
              <p>
                If money was debited from your bank account or UPI in an online fraud within the last 2 hours, call <strong>1930</strong> immediately to freeze the money in the scammer's mule bank account!
              </p>
              <button
                type="button"
                className="btn btn-primary btn-report-now"
                onClick={() => switchTab('report')}
              >
                + Report a Cyber Crime Online &rarr;
              </button>
            </div>
          </div>

          <div className="portal-guidance-grid">
            <div className="guide-card">
              <span className="guide-icon">1️⃣</span>
              <h3>Fill Incident Details</h3>
              <p>State what happened, the fraud date, financial amount lost, and transaction ID.</p>
            </div>
            <div className="guide-card">
              <span className="guide-icon">2️⃣</span>
              <h3>Add Phone or Computer Info</h3>
              <p>Mention the device make, model, and operating system used during the event.</p>
            </div>
            <div className="guide-card">
              <span className="guide-icon">3️⃣</span>
              <h3>Get Official Case Receipt</h3>
              <p>Receive your Government Case Acknowledgement Number with a downloadable PDF-style receipt.</p>
            </div>
            <div className="guide-card">
              <span className="guide-icon">4️⃣</span>
              <h3>Track Police Action</h3>
              <p>Track which police officer is handling your file and view upcoming judicial court dates.</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: REPORT A CYBER CRIME (3-STEP GUIDED FORM)                     */}
      {/* ==================================================================== */}
      {activeTab === 'report' && (
        <section className="gov-card">
          <h2 className="section-title">✍️ Report a Cyber Crime to Police Department</h2>
          <p className="section-subtitle">
            Please provide accurate details of the online fraud or harassment you experienced. Your information is securely encrypted and submitted directly to the Cyber Crime Police Cell.
          </p>

          {/* Stepper Indicators */}
          <div className="form-stepper-row">
            <div className={`step-node ${complaintStep >= 1 ? 'active' : ''} ${complaintStep > 1 ? 'done' : ''}`}>
              <span className="sn-circle">{complaintStep > 1 ? '✓' : '1'}</span>
              <span className="sn-text">Incident Details</span>
            </div>
            <div className="step-bar"></div>
            <div className={`step-node ${complaintStep >= 2 ? 'active' : ''} ${complaintStep > 2 ? 'done' : ''}`}>
              <span className="sn-circle">{complaintStep > 2 ? '✓' : '2'}</span>
              <span className="sn-text">Phone or Computer Used</span>
            </div>
            <div className="step-bar"></div>
            <div className={`step-node ${complaintStep >= 3 ? 'active' : ''}`}>
              <span className="sn-circle">3</span>
              <span className="sn-text">Review &amp; Submit</span>
            </div>
          </div>

          {submitError && <div className="alert alert-danger">{submitError}</div>}
          {submitSuccessMsg && <div className="alert alert-success">{submitSuccessMsg}</div>}

          {/* STEP 1: INCIDENT DETAILS */}
          {complaintStep === 1 && (
            <div className="form-step-pane">
              <div className="form-group">
                <label className="field-label">
                  Short Title of Complaint <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lost Rs 45,000 in Fake Electricity Bill SMS Scam"
                  value={incidentData.case_title}
                  onChange={(e) => setIncidentData({ ...incidentData, case_title: e.target.value })}
                  required
                />
                {incidentData.case_title && incidentData.case_title.trim().length < 6 && (
                  <p className="field-error-msg">Please write a clear title describing what happened (at least 6 characters).</p>
                )}
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="field-label">
                    Category of Crime <span className="req-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={incidentData.crime_type_id}
                    onChange={(e) => setIncidentData({ ...incidentData, crime_type_id: e.target.value })}
                    required
                  >
                    {crimeTypes.map((ct) => (
                      <option key={ct.crime_type_id} value={ct.crime_type_id}>
                        {ct.crime_type_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">
                    Date When Crime Happened <span className="req-star">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    max={new Date().toISOString().split('T')[0]}
                    value={incidentData.incident_date}
                    onChange={(e) => setIncidentData({ ...incidentData, incident_date: e.target.value })}
                    required
                  />
                  {incidentData.incident_date && !isValidPastDate(incidentData.incident_date) && (
                    <p className="field-error-msg">Date cannot be in the future.</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="field-label">
                    How are you reporting? <span className="req-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={incidentData.complaint_mode}
                    onChange={(e) => setIncidentData({ ...incidentData, complaint_mode: e.target.value })}
                  >
                    {COMPLAINT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="field-label">
                  Explain What Happened (Simple Words) <span className="req-star">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Describe how the fraud occurred, including phone numbers of callers, fake website links, or transaction IDs..."
                  value={incidentData.description}
                  onChange={(e) => setIncidentData({ ...incidentData, description: e.target.value })}
                  required
                />
                <span className="form-instruction">
                  At least 15 characters. {incidentData.description.length} / 15 entered.
                </span>
              </div>

              <div className="step-actions-row">
                <div></div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!isStep1Valid}
                  onClick={handleNextStep1}
                >
                  Next: Phone or Computer Used &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PHONE OR COMPUTER USED */}
          {complaintStep === 2 && (
            <div className="form-step-pane">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="field-label">
                    Device You Were Using <span className="req-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={deviceData.device_type}
                    onChange={(e) => setDeviceData({ ...deviceData, device_type: e.target.value })}
                  >
                    {DEVICE_TYPES.map((dt) => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">
                    Device Brand / Make <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Samsung, Apple, Dell, HP"
                    value={deviceData.brand}
                    onChange={(e) => setDeviceData({ ...deviceData, brand: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="field-label">
                    Device Model Name <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Galaxy S21, iPhone 14, Inspiron 15"
                    value={deviceData.model}
                    onChange={(e) => setDeviceData({ ...deviceData, model: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">
                    Operating System <span className="req-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={deviceData.operating_system}
                    onChange={(e) => setDeviceData({ ...deviceData, operating_system: e.target.value })}
                  >
                    {OPERATING_SYSTEMS.map((os) => (
                      <option key={os} value={os}>{os}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">
                    Serial Number / IMEI (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Found in phone settings or invoice"
                    value={deviceData.serial_no}
                    onChange={(e) => setDeviceData({ ...deviceData, serial_no: e.target.value })}
                  />
                </div>
              </div>

              <div className="step-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setComplaintStep(1)}>
                  &larr; Back to Incident Details
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!isStep2Valid}
                  onClick={handleNextStep2}
                >
                  Next: Review &amp; Submit &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & SUBMIT */}
          {complaintStep === 3 && (
            <div className="form-step-pane">
              <div className="review-summary-card">
                <h3 className="sub-title">📋 Summary of Your Report</h3>

                <div className="review-group">
                  <h4>Complaint Overview:</h4>
                  <p><strong>Title:</strong> {incidentData.case_title}</p>
                  <p><strong>Crime Category:</strong> {crimeTypes.find(c => c.crime_type_id.toString() === incidentData.crime_type_id)?.crime_type_name || 'Cyber Crime'}</p>
                  <p><strong>Incident Date:</strong> {incidentData.incident_date}</p>
                  <p><strong>Description:</strong> {incidentData.description}</p>
                </div>

                <div className="review-group">
                  <h4>Device Information:</h4>
                  <p>
                    <strong>{deviceData.device_type}:</strong> {deviceData.brand} {deviceData.model} ({deviceData.operating_system})
                  </p>
                </div>
              </div>

              <div className="declaration-checkbox-box">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={declarationChecked}
                    onChange={(e) => setDeclarationChecked(e.target.checked)}
                  />
                  <span>
                    I hereby declare that the information provided above is true and accurate to the best of my knowledge under Section 66 of the Information Technology Act, 2000.
                  </span>
                </label>
              </div>

              <div className="step-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setComplaintStep(2)}>
                  &larr; Change Device Info
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-submit-complaint"
                  disabled={!declarationChecked}
                  onClick={handleSubmitComplaint}
                >
                  ✓ Submit Complaint &amp; Get Official Receipt &rarr;
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: MY COMPLAINTS & STATUS (TRACK STATUS)                         */}
      {/* ==================================================================== */}
      {activeTab === 'cases' && (
        <section className="gov-card">
          <div className="title-with-action">
            <div>
              <h2 className="section-title">📋 My Reported Cyber Complaints</h2>
              <p className="section-subtitle">Real-time status of complaints filed from your mobile number.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => switchTab('report')}>
              + Report Another Crime
            </button>
          </div>

          {casesLoading ? (
            <p className="loading-hint">Loading your complaints from Government records...</p>
          ) : myCases.length === 0 ? (
            <div className="empty-cases-box">
              <p>You have not filed any cyber crime complaints yet.</p>
              <button className="btn btn-primary" onClick={() => switchTab('report')} style={{ marginTop: '12px' }}>
                Report a Cyber Crime Now
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Complaint Title</th>
                    <th>Crime Category</th>
                    <th>Investigation Status</th>
                    <th>Assigned Police Officer</th>
                    <th>Date Filed</th>
                    <th>Official Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {myCases.map(c => (
                    <tr key={c.case_id}>
                      <td><strong>#{c.case_id}</strong></td>
                      <td>
                        <strong>{c.case_title}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Mode: {c.complaint_mode}
                        </div>
                      </td>
                      <td><span className="badge badge-default">{c.crime_type_name}</span></td>
                      <td>
                        <span className={`badge ${
                          c.case_status === 'Resolved' ? 'badge-success' :
                          c.case_status === 'In Court' ? 'badge-saffron' :
                          c.case_status === 'Under Investigation' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {c.case_status}
                        </span>
                      </td>
                      <td>
                        <strong>{c.investigator_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {c.investigator_rank} &bull; Ph: {c.investigator_phone || '040-27852412'}
                        </div>
                      </td>
                      <td>{c.reported_date}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setReceiptCase(c)}
                        >
                          📄 Download Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: NATIONAL SUSPECT REGISTRY & BLOCKED MULE ACCOUNTS             */}
      {/* ==================================================================== */}
      {activeTab === 'suspect' && (
        <section className="gov-card">
          <div className="title-with-action">
            <div>
              <h2 className="section-title">🔎 National Suspect Registry &amp; Blocked Mule Data</h2>
              <p className="section-subtitle">
                Official registry of verified cyber criminals, frozen mule bank accounts, and flagged UPI identifiers maintained under I4C.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={fetchSuspects}
            >
              🔄 Refresh Database
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="suspect-toolbar">
            <div className="suspect-search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-input suspect-search-input"
                placeholder="Search suspect name, mobile, frozen bank account, UPI ID, or location..."
                value={suspectSearch}
                onChange={(e) => setSuspectSearch(e.target.value)}
              />
              {suspectSearch && (
                <button type="button" className="btn-clear-search" onClick={() => setSuspectSearch('')}>
                  &times;
                </button>
              )}
            </div>

            <div className="suspect-filter-pills">
              <button
                type="button"
                className={`filter-pill ${suspectFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSuspectFilter('ALL')}
              >
                All Suspects ({suspectsList.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${suspectFilter === 'MULE' ? 'active' : ''}`}
                onClick={() => setSuspectFilter('MULE')}
              >
                🚫 Mule Bank Accounts
              </button>
              <button
                type="button"
                className={`filter-pill ${suspectFilter === 'FROZEN' ? 'active' : ''}`}
                onClick={() => setSuspectFilter('FROZEN')}
              >
                ❄️ Frozen under 1930
              </button>
              <button
                type="button"
                className={`filter-pill ${suspectFilter === 'HIGH' ? 'active' : ''}`}
                onClick={() => setSuspectFilter('HIGH')}
              >
                ⚠️ High Risk
              </button>
            </div>
          </div>

          {suspectsLoading ? (
            <p className="loading-hint">Querying National Suspect Intelligence Registry...</p>
          ) : filteredSuspects.length === 0 ? (
            <div className="empty-cases-box">
              <p>No suspects found matching "{suspectSearch}".</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Suspect ID</th>
                    <th>Suspect Name &amp; Role</th>
                    <th>Fraudulent Contact / UPI</th>
                    <th>Mule Bank Account</th>
                    <th>City / State</th>
                    <th>Legal Charges</th>
                    <th>Enforcement Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuspects.map(s => (
                    <tr key={s.suspect_id}>
                      <td><strong>#{s.suspect_id}</strong></td>
                      <td>
                        <strong>{s.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {s.involvement_type}
                        </div>
                      </td>
                      <td>
                        <div>📱 +91-{s.phone}</div>
                        {s.upi_id && (
                          <div style={{ fontSize: '0.78rem', color: '#b45309', fontFamily: 'monospace' }}>
                            UPI: {s.upi_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#1e293b' }}>
                          {s.account_no || 'Pending Bank Subpoena'}
                        </span>
                      </td>
                      <td>{s.city}, {s.state}</td>
                      <td>
                        <span className="badge badge-default" style={{ fontSize: '0.72rem' }}>
                          {s.charges}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          s.arrest_status?.includes('Frozen') ? 'badge-warning' :
                          s.arrest_status?.includes('Custody') || s.arrest_status?.includes('Arrested') ? 'badge-success' : 'badge-danger'
                        }`}>
                          {s.arrest_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: MY COURT HEARING DATES                                        */}
      {/* ==================================================================== */}
      {activeTab === 'hearings' && (
        <section className="gov-card">
          <h2 className="section-title">🏛️ My Court Hearing Dates &amp; Judicial Orders</h2>
          <p className="section-subtitle">
            Dates scheduled by the designated Cyber Special Magistrate for recovery and prosecution of your cases.
          </p>

          {allHearings.length === 0 ? (
            <div className="empty-cases-box">
              <p>No court hearings have been scheduled for your complaints yet.</p>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                Once the police completes investigation and files the chargesheet, hearing dates will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Hearing #</th>
                    <th>Designated Court</th>
                    <th>Hearing Date</th>
                    <th>Court Status</th>
                    <th>Judge &amp; Room</th>
                    <th>Interim Verdict / Orders</th>
                    <th>Next Hearing</th>
                  </tr>
                </thead>
                <tbody>
                  {allHearings.map((h, i) => (
                    <tr key={i}>
                      <td><strong>#{h.case_id}</strong></td>
                      <td>Hearing #{h.hearing_no}</td>
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
                      <td>{h.verdict || 'Awaiting Court Listing'}</td>
                      <td>
                        {h.next_hearing_date ? new Date(h.next_hearing_date).toLocaleDateString('en-IN') : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: LEARNING CORNER & CYBER HYGIENE TIPS                          */}
      {/* ==================================================================== */}
      {activeTab === 'learning' && (
        <div className="tab-view-content">
          <section className="gov-card">
            <h2 className="section-title">📚 Citizen Cyber Hygiene &amp; Safety Guidelines</h2>
            <p className="section-subtitle">
              Essential precautions issued by the Ministry of Home Affairs to protect citizens against digital fraud.
            </p>

            <div className="safety-cards-grid">
              <div className="safety-card card-alert-saffron">
                <span className="sc-icon">⏱️</span>
                <h3>Golden Hour Banking Fraud Rule</h3>
                <p>
                  Call <strong>1930</strong> within <strong>2 hours</strong> of an unauthorized transaction. The National Cyber Crime Reporting Portal notifies nodal officers across all Indian banks to freeze mule accounts before fraudsters can withdraw your funds at ATMs.
                </p>
              </div>

              <div className="safety-card card-alert-green">
                <span className="sc-icon">🔒</span>
                <h3>Safe UPI Practices</h3>
                <p>
                  <strong>Remember:</strong> You NEVER need to enter your UPI PIN to RECEIVE money. Entering your PIN always debits money from your account. If a buyer insists on sending a QR code to receive payment, it is 100% a scam.
                </p>
              </div>

              <div className="safety-card card-alert-blue">
                <span className="sc-icon">📱</span>
                <h3>Malicious APK Warnings</h3>
                <p>
                  Never install apps sent as <code>.apk</code> files on WhatsApp or SMS (e.g., fake electricity bill update, courier tracking, reward point redemptions). Only download apps from official stores (Google Play or Apple App Store).
                </p>
              </div>

              <div className="safety-card card-alert-purple">
                <span className="sc-icon">⚖️</span>
                <h3>"Digital Arrest" Extortion Advisory</h3>
                <p>
                  Police officers, CBI, or judges <strong>never</strong> conduct investigations via Skype or WhatsApp video calls, and <strong>never</strong> demand money into "RBI safe custody accounts". If threatened with digital arrest, disconnect immediately and dial 1930.
                </p>
              </div>
            </div>

            {/* Citizen FAQs Accordion */}
            <h3 className="section-title" style={{ marginTop: '2rem' }}>❓ Frequently Asked Questions (FAQs)</h3>
            <div className="faq-accordion-list">
              {[
                {
                  q: 'What is the Golden Hour in cyber crime reporting?',
                  a: 'The Golden Hour refers to the first 2 hours after a fraudulent transaction occurs. Reporting via 1930 during this window allows banks to freeze the money in the recipient account before cash withdrawal.'
                },
                {
                  q: 'Can I file a complaint anonymously without sharing my identity?',
                  a: 'Yes, complaints related to child abuse material, women harassment, or sensitive blackmail can be reported confidentially under the Women & Child Cyber Safety section.'
                },
                {
                  q: 'What documents should I keep ready before reporting financial fraud?',
                  a: 'Keep your bank transaction reference number (UTR/RRN), screenshot of debit SMS or UPI receipt, fraudster\'s phone number or UPI ID, and your bank account details.'
                },
                {
                  q: 'How can I check the progress of my complaint?',
                  a: 'Go to the "My Complaints & Status" tab in this portal to view the assigned investigating officer, phone number, and police status in real time.'
                }
              ].map((faq, idx) => (
                <div key={idx} className="faq-item">
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-toggle-icon">{openFaq === idx ? '▲' : '▼'}</span>
                  </button>
                  {openFaq === idx && (
                    <div className="faq-answer-pane">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: HELP & CITIZEN FEEDBACK                                       */}
      {/* ==================================================================== */}
      {activeTab === 'help' && (
        <div className="tab-view-content">
          <section className="gov-card">
            <h2 className="section-title">📞 National Cyber Helpline 1930 &amp; Directory</h2>
            <p className="section-subtitle">
              Reach out to designated police nodal authorities and state cyber headquarters.
            </p>

            <div className="helpline-directory-grid">
              <div className="hd-card hd-card-highlight">
                <span className="hd-badge">TOLL-FREE 24x7</span>
                <h3>National Financial Fraud Helpline</h3>
                <div className="hd-number">1930</div>
                <p>Operational across all 28 States and 8 Union Territories</p>
              </div>

              <div className="hd-card">
                <span className="hd-badge">EMAIL</span>
                <h3>Official Nodal Grievance Email</h3>
                <div className="hd-mail">cybercrime-mha@gov.in</div>
                <p>Response within 24–48 working hours for escalated cases</p>
              </div>
            </div>

            {/* Citizen Feedback Form */}
            <h3 className="section-title" style={{ marginTop: '2.5rem' }}>📝 Submit Portal Feedback</h3>
            <p className="section-subtitle">Help the Ministry improve portal accessibility and ease of use.</p>

            {feedbackSent ? (
              <div className="alert alert-success">
                ✓ Thank you! Your feedback has been recorded safely in the Government audit registry.
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                <div className="form-group">
                  <label className="field-label">How would you rate your portal experience?</label>
                  <select
                    className="form-select"
                    value={feedbackRating}
                    onChange={(e) => setFeedbackRating(e.target.value)}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Excellent - Fast and Clear</option>
                    <option value="4">⭐⭐⭐⭐ Very Good</option>
                    <option value="3">⭐⭐⭐ Satisfactory</option>
                    <option value="2">⭐⭐ Needs Improvement</option>
                    <option value="1">⭐ Poor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">Your Comments / Suggestions</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Tell us what you liked or how we can make cyber reporting easier for citizens..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                  Submit Citizen Feedback &rarr;
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      {/* Downloadable Official Receipt Modal */}
      {receiptCase && (
        <ReceiptModal
          caseData={receiptCase}
          onClose={() => setReceiptCase(null)}
        />
      )}
    </div>
  );
}
