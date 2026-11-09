import React, { useState } from 'react';
import FloatingMenuDropdown from './FloatingMenuDropdown.jsx';

export default function Header({
  loggedInUser,
  onLogout,
  isSlowInternet,
  onToggleSlowInternet,
  fontSize,
  onChangeFontSize,
  activeNavTab,
  onNavigateTab
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const isTabActive = (tabName) => {
    if (!activeNavTab) return false;
    if (tabName === 'home') return activeNavTab === 'home' || activeNavTab === 'overview';
    if (tabName === 'report') return activeNavTab === 'report' || activeNavTab.startsWith('report-');
    if (tabName === 'suspect') return activeNavTab === 'suspect' || activeNavTab.startsWith('suspect-');
    if (tabName === 'track') return activeNavTab === 'track' || activeNavTab === 'cases';
    if (tabName === 'learning') return activeNavTab === 'learning' || activeNavTab === 'cyber-safety' || activeNavTab === 'faqs';
    if (tabName === 'help') return activeNavTab === 'help' || activeNavTab === 'helpline' || activeNavTab === 'feedback';
    return activeNavTab === tabName;
  };

  return (
    <header className="site-header-gov">
      {/* 1. TOP OFFICIAL GREEN GOVERNMENT STRIP */}
      <div className="gov-top-strip">
        <div className="gov-strip-inner">
          <div className="gov-strip-left">
            <span className="gov-flag-icon">🇮🇳</span>
            <span className="gov-strip-text">
              GOVERNMENT OF INDIA &bull; MINISTRY OF HOME AFFAIRS (गृह मंत्रालय)
            </span>
          </div>
          <div className="gov-strip-right">
            <span className="gov-toll-free">National Cyber Helpline: <strong>1930</strong> (24x7 Toll Free)</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR (PURE CRISP WHITE) */}
      <div className="gov-main-header">
        <div className="gov-header-inner">
          {/* Left: State Emblem + Title */}
          <div className="gov-brand-cluster">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="State Emblem of India"
              className="gov-emblem-img"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = 'block';
                }
              }}
            />
            {/* Fallback inline SVG */}
            <svg
              className="gov-emblem-fallback"
              style={{ display: 'none', width: '48px', height: '48px' }}
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="42" fill="#FFFFFF" stroke="#1F2937" strokeWidth="4" />
              <circle cx="50" cy="50" r="14" fill="#1F2937" />
            </svg>

            <div className="gov-divider-line"></div>

            <div className="gov-title-stack">
              <span className="gov-title-hindi">राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल</span>
              <h1 className="gov-title-english">National Cyber Crime Reporting Portal</h1>
              <span className="gov-title-sub">Indian Cyber Crime Coordination Centre (I4C)</span>
            </div>
          </div>

          {/* Right: Floating Navigation + Floating User + Floating Hamburger Menu */}
          <div className="gov-header-right">
            {/* FLOATING NAVIGATION (NO BORDER BOXES) */}
            <nav className="gov-floating-nav" aria-label="Main Navigation">
              <a
                href="#home"
                className={`floating-nav-link ${isTabActive('home') ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); if (onNavigateTab) onNavigateTab('home'); }}
              >
                Home
              </a>

              <div className="floating-dropdown-container">
                <button
                  type="button"
                  className={`floating-nav-link dropdown-toggle ${isTabActive('report') ? 'active' : ''}`}
                  onClick={() => toggleDropdown('report')}
                >
                  Report Cyber Crime <span className="caret">▾</span>
                </button>
                {activeDropdown === 'report' && (
                  <div className="floating-dropdown-menu">
                    <a
                      href="#report-all"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('report'); }}
                    >
                      ✍️ File New Cyber Complaint
                    </a>
                    <a
                      href="#report-financial"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('report-financial'); }}
                    >
                      💳 Financial Fraud / UPI Scam
                    </a>
                    <a
                      href="#report-women"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('report-women'); }}
                    >
                      🛡️ Women / Child Cyber Safety
                    </a>
                    <a
                      href="#report-other"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('report-other'); }}
                    >
                      💻 Other Cyber Crime Incidents
                    </a>
                  </div>
                )}
              </div>

              <div className="floating-dropdown-container">
                <button
                  type="button"
                  className={`floating-nav-link dropdown-toggle ${isTabActive('suspect') ? 'active' : ''}`}
                  onClick={() => toggleDropdown('suspect')}
                >
                  Suspect Data <span className="caret">▾</span>
                </button>
                {activeDropdown === 'suspect' && (
                  <div className="floating-dropdown-menu">
                    <a
                      href="#suspect-registry"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('suspect-registry'); }}
                    >
                      🔎 National Suspect Registry
                    </a>
                    <a
                      href="#suspect-accounts"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('suspect-accounts'); }}
                    >
                      🚫 Blocked Mule Bank Accounts &amp; Numbers
                    </a>
                  </div>
                )}
              </div>

              <a
                href="#track"
                className={`floating-nav-link ${isTabActive('track') ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); if (onNavigateTab) onNavigateTab('track'); }}
              >
                Track Status
              </a>

              <div className="floating-dropdown-container">
                <button
                  type="button"
                  className={`floating-nav-link dropdown-toggle ${isTabActive('learning') ? 'active' : ''}`}
                  onClick={() => toggleDropdown('learning')}
                >
                  Learning Corner <span className="caret">▾</span>
                </button>
                {activeDropdown === 'learning' && (
                  <div className="floating-dropdown-menu">
                    <a
                      href="#cyber-safety"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('cyber-safety'); }}
                    >
                      📚 Cyber Hygiene &amp; Safety Tips
                    </a>
                    <a
                      href="#faqs"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('faqs'); }}
                    >
                      ❓ Citizen FAQs &amp; Help
                    </a>
                  </div>
                )}
              </div>

              <div className="floating-dropdown-container">
                <button
                  type="button"
                  className={`floating-nav-link dropdown-toggle ${isTabActive('help') ? 'active' : ''}`}
                  onClick={() => toggleDropdown('help')}
                >
                  Help &amp; Feedback <span className="caret">▾</span>
                </button>
                {activeDropdown === 'help' && (
                  <div className="floating-dropdown-menu">
                    <a
                      href="#helpline"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('helpline'); }}
                    >
                      📞 1930 Helpline Directory
                    </a>
                    <a
                      href="#feedback"
                      onClick={(e) => { e.preventDefault(); setActiveDropdown(null); if (onNavigateTab) onNavigateTab('feedback'); }}
                    >
                      📝 Submit Portal Feedback
                    </a>
                  </div>
                )}
              </div>
            </nav>

            {/* BORDERLESS FLOATING USER TEXT (WHEN LOGGED IN) */}
            {loggedInUser && (
              <div className="floating-user-display" title={loggedInUser.role === 'Investigator' ? 'Police Officer' : 'Citizen'}>
                <span className="floating-user-name">
                  {loggedInUser.name || `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || loggedInUser.mobile_number}
                </span>
                <span className="floating-user-role">
                  ({loggedInUser.role === 'Investigator' ? 'Investigator' : 'Citizen'})
                </span>
              </div>
            )}

            {/* REQUIREMENT 1: CLEAN FLOATING TRICOLOR HAMBURGER ICON (NO BLACK BOX) */}
            <div className="hamburger-relative-wrapper">
              <button
                type="button"
                className={`clean-floating-hamburger ${menuDropdownOpen ? 'active' : ''}`}
                onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
                aria-label="Toggle Portal Menu Dropdown"
                title="Open Portal Options &amp; Settings"
              >
                <div className="floating-tricolor-bars">
                  <span className="ft-bar ft-saffron"></span>
                  <span className="ft-bar ft-white"></span>
                  <span className="ft-bar ft-green"></span>
                </div>
              </button>

              {/* WHITE FLOATING DROPDOWN PANEL DIRECTLY BELOW IT */}
              <FloatingMenuDropdown
                isOpen={menuDropdownOpen}
                onClose={() => setMenuDropdownOpen(false)}
                loggedInUser={loggedInUser}
                onLogout={onLogout}
                isSlowInternet={isSlowInternet}
                onToggleSlowInternet={onToggleSlowInternet}
                fontSize={fontSize}
                onChangeFontSize={onChangeFontSize}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
