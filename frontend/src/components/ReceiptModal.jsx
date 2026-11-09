import React from 'react';

export default function ReceiptModal({ caseData, onClose }) {
  if (!caseData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="receipt-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Actions bar (hidden in print) */}
        <div className="receipt-actions-bar no-print">
          <span className="receipt-tag">Official Government of India Acknowledgment</span>
          <div className="receipt-buttons">
            <button className="btn btn-primary btn-print" onClick={handlePrint}>
              🖨️ Print / Save as PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Sheet */}
        <div className="official-receipt-sheet" id="printable-receipt">
          {/* Top Tricolor Strip */}
          <div className="receipt-tricolor">
            <div className="strip-saffron"></div>
            <div className="strip-white"></div>
            <div className="strip-green"></div>
          </div>

          {/* Receipt Header with State Emblem */}
          <div className="receipt-gov-header">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="State Emblem of India"
              className="receipt-emblem-img"
            />
            <div className="receipt-header-titles">
              <h2>सत्यमेव जयते</h2>
              <h1>NATIONAL CYBER CRIME REPORTING PORTAL</h1>
              <h3>MINISTRY OF HOME AFFAIRS &bull; GOVERNMENT OF INDIA</h3>
              <p>Official Acknowledgement of Cyber Crime Complaint</p>
            </div>
            <div className="receipt-qr-placeholder">
              <div className="mock-qr-code">
                <span>CASE #{caseData.case_id}</span>
              </div>
              <small>Digital Verification Seal</small>
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Key Reference Numbers */}
          <div className="receipt-meta-grid">
            <div className="receipt-meta-item">
              <span className="rm-label">Official Complaint Reference No (Case ID):</span>
              <span className="rm-val rm-highlight">#{caseData.case_id}</span>
            </div>
            <div className="receipt-meta-item">
              <span className="rm-label">Date &amp; Time of Filing:</span>
              <span className="rm-val">{caseData.reported_date || new Date().toISOString().split('T')[0]} (IST)</span>
            </div>
            <div className="receipt-meta-item">
              <span className="rm-label">Complaint Filing Mode:</span>
              <span className="rm-val">{caseData.complaint_mode || 'National Online Cyber Portal'}</span>
            </div>
            <div className="receipt-meta-item">
              <span className="rm-label">Current Investigation Status:</span>
              <span className="rm-val status-val">{caseData.case_status || 'Under Investigation'}</span>
            </div>
          </div>

          {/* Section 1: Citizen (Complainant) Details */}
          <div className="receipt-section">
            <h4 className="receipt-section-heading">1. Complainant (Citizen) Details</h4>
            <div className="receipt-details-table">
              <div className="rd-row">
                <span className="rd-key">Full Name:</span>
                <span className="rd-data">{caseData.victim_name || 'Complainant'}</span>
                <span className="rd-key">Contact Phone:</span>
                <span className="rd-data">{caseData.victim_phone || 'Verified via OTP'}</span>
              </div>
              <div className="rd-row">
                <span className="rd-key">Email ID:</span>
                <span className="rd-data">{caseData.victim_email || 'Not Provided'}</span>
                <span className="rd-key">City / State:</span>
                <span className="rd-data">{caseData.victim_city || 'Hyderabad'}, Telangana</span>
              </div>
            </div>
          </div>

          {/* Section 2: Incident Details */}
          <div className="receipt-section">
            <h4 className="receipt-section-heading">2. Incident Details</h4>
            <div className="receipt-details-table">
              <div className="rd-row">
                <span className="rd-key">Crime Category:</span>
                <span className="rd-data"><strong>{caseData.crime_type_name || 'Cyber Financial Fraud'}</strong></span>
                <span className="rd-key">Date of Incident:</span>
                <span className="rd-data">{caseData.incident_date}</span>
              </div>
              <div className="rd-row full-width-row">
                <span className="rd-key">Complaint Title:</span>
                <span className="rd-data">{caseData.case_title}</span>
              </div>
              <div className="rd-row full-width-row">
                <span className="rd-key">Incident Narrative:</span>
                <span className="rd-data desc-data">{caseData.description}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Police Cell & Judicial Schedule */}
          <div className="receipt-section">
            <h4 className="receipt-section-heading">3. Assigned Police Unit &amp; Judicial Adjudication</h4>
            <div className="receipt-details-table">
              <div className="rd-row">
                <span className="rd-key">Jurisdiction Police Cell:</span>
                <span className="rd-data">{caseData.department_name || 'National Cyber Crime Cell - Hyderabad'}</span>
                <span className="rd-key">Assigned Police Officer:</span>
                <span className="rd-data">{caseData.investigator_name || 'Inspector Vikram Rathore'} ({caseData.investigator_rank || 'Circle Inspector'})</span>
              </div>
              <div className="rd-row">
                <span className="rd-key">Next Court Hearing Date:</span>
                <span className="rd-data">
                  {caseData.next_hearing_date
                    ? new Date(caseData.next_hearing_date).toLocaleDateString('en-IN')
                    : 'Awaiting Court Listing'}
                </span>
                <span className="rd-key">Priority Level:</span>
                <span className="rd-data">{caseData.priority_level || 'High'}</span>
              </div>
            </div>
          </div>

          {/* Official Stamp & Sign Off */}
          <div className="receipt-stamp-area">
            <div className="stamp-box">
              <div className="official-seal">
                <span>GOVERNMENT OF INDIA</span>
                <small>CYBER CRIME CELL</small>
                <strong>VERIFIED</strong>
              </div>
            </div>
            <div className="sign-box">
              <p>Electronically generated acknowledgment.</p>
              <p>No physical signature required under Information Technology Act, 2000.</p>
              <strong>National Cyber Crime Reporting Coordination Centre (I4C)</strong>
            </div>
          </div>

          <div className="receipt-footer-notes">
            <p>
              <strong>Important Notice:</strong> For financial fraud, kindly dial toll-free Helpline <strong>1930</strong> immediately. To track progress, visit <code>http://localhost:3000</code> and enter Case ID <strong>#{caseData.case_id}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
