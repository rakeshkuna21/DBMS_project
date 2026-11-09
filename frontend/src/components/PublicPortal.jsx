import React, { useState, useEffect } from 'react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh'
];

// Helper: generate 6-character alphanumeric captcha
const generateCaptchaCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let str = '';
  for (let i = 0; i < 6; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
};

export default function PublicPortal({
  onLoginSuccess,
  onTriggerLoader,
  onDispatchTopToast,
  activeNavTab,
  onNavigateTab
}) {
  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState('signin');
  // Role: 'Victim' | 'Investigator'
  const [loginRole, setLoginRole] = useState('Victim');

  // Sign In State (Strict Database Authentication)
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Mobile or Email
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState(generateCaptchaCode);
  const [captchaInput, setCaptchaInput] = useState('');

  // New Citizen Sign Up State (Multi-Step with Duplicate Account Prevention)
  const [regStep, setRegStep] = useState(1);
  const [regForm, setRegForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    password: '',
    street: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: ''
  });
  const [regOtp, setRegOtp] = useState('');
  const [regError, setRegError] = useState('');
  const [regIsDuplicate, setRegIsDuplicate] = useState(false);

  // Quick Case Tracker State
  const [caseSearchId, setCaseSearchId] = useState('');
  const [caseResult, setCaseResult] = useState(null);
  const [caseSearchError, setCaseSearchError] = useState('');
  const [caseSearchLoading, setCaseSearchLoading] = useState(false);

  // Awareness Crime Types
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [crimeTypesLoading, setCrimeTypesLoading] = useState(true);

  useEffect(() => {
    fetchCrimeTypes();
  }, []);

  const fetchCrimeTypes = async () => {
    setCrimeTypesLoading(true);
    try {
      const res = await fetch('/api/crime-types');
      if (res.ok) {
        const data = await res.json();
        setCrimeTypes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch crime types:', err);
    } finally {
      setCrimeTypesLoading(false);
    }
  };

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput('');
  };

  // Field Validations
  const isValidMobile = (num) => /^[6-9]\d{9}$/.test(String(num).trim());
  const isValidEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(em).trim());
  const isValidPincode = (pin) => /^\d{6}$/.test(String(pin).trim());
  const isLettersOnly = (text) => /^[A-Za-z\s]+$/.test(String(text).trim());
  const isValidPastDate = (dateStr) => {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    const today = new Date();
    return selected < today;
  };

  // =========================================================================
  // 1. GET OTP FOR EXISTING ACCOUNT (REQUIREMENT 3: STRICT DATABASE VALIDATION)
  // =========================================================================
  const handleGetOtp = async (e) => {
    if (e) e.preventDefault();
    setSignInError('');

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setSignInError('Please enter your registered mobile number or email.');
      return;
    }

    setSignInLoading(true);
    onTriggerLoader('Validating account in National Cyber Database...', 1000);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, role: loginRole })
      });
      const data = await res.json();

      if (res.status === 404 || data.not_found) {
        // REQUIREMENT 3: Exact message for non-existent account
        const msg = 'No account found. Please sign up first.';
        setSignInError(msg);
        if (onDispatchTopToast) {
          onDispatchTopToast({ type: 'invalid', message: msg });
        }
        return;
      }

      if (res.ok && data.success) {
        setOtpSent(true);
        // REQUIREMENT 2: Floating toast notification from top of screen
        if (onDispatchTopToast) {
          onDispatchTopToast({
            type: 'sent',
            otp: data.otp,
            mobile: data.mobile_number || cleanId,
            message: 'OTP sent successfully.'
          });
        }
      } else {
        setSignInError(data.error || 'Failed to dispatch OTP from Database.');
      }
    } catch (err) {
      setSignInError('Cannot connect to authentication server. Please verify database.');
    } finally {
      setSignInLoading(false);
    }
  };

  // =========================================================================
  // 2. LOGIN SUBMISSION (REQUIREMENT 3: STRICT PASSWORD & DATABASE AUTH)
  // =========================================================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setSignInError('');

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setSignInError('Please enter your mobile number or email.');
      return;
    }

    if (!loginPassword) {
      setSignInError('Please enter your account password.');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setSignInError('Invalid Captcha. Please enter the characters displayed in the image box.');
      refreshCaptcha();
      return;
    }

    setSignInLoading(true);
    onTriggerLoader('Verifying credentials against National Database...', 1200);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          password: loginPassword,
          otp: otp.trim(),
          role: loginRole
        })
      });
      const data = await res.json();

      // Non-existent account
      if (res.status === 404 || data.not_found) {
        const msg = data.error || (loginRole === 'Investigator'
          ? 'Official Agency ID not recognized in National Police Database. Unauthorized access attempt logged.'
          : 'No account found. Please sign up first.');
        setSignInError(msg);
        if (onDispatchTopToast) {
          onDispatchTopToast({ type: 'invalid', message: msg });
        }
        refreshCaptcha();
        return;
      }

      // Incorrect password
      if (res.status === 401 && data.invalid_password) {
        const msg = data.error || (loginRole === 'Investigator'
          ? 'Invalid Government Password. Access denied to unauthorized personnel.'
          : 'Incorrect password. Please try again.');
        setSignInError(msg);
        if (onDispatchTopToast) {
          onDispatchTopToast({ type: 'invalid', message: msg });
        }
        refreshCaptcha();
        return;
      }

      // Invalid OTP
      if (res.status === 401 && data.invalid_otp) {
        const msg = 'Invalid OTP.';
        setSignInError(msg);
        if (onDispatchTopToast) {
          onDispatchTopToast({ type: 'invalid', message: msg });
        }
        refreshCaptcha();
        return;
      }

      // Successful Genuine Login
      if (res.ok && data.success) {
        if (onDispatchTopToast) {
          onDispatchTopToast({
            type: 'verified',
            message: 'Verification successful.'
          });
        }
        onLoginSuccess(data.user);
      } else {
        setSignInError(data.error || 'Authentication rejected by database.');
        refreshCaptcha();
      }
    } catch (err) {
      setSignInError('Database verification failed. Please try again.');
      refreshCaptcha();
    } finally {
      setSignInLoading(false);
    }
  };

  // =========================================================================
  // 3. SIGN-UP MULTI-STEP WITH DUPLICATE CHECK (REQUIREMENT 4)
  // =========================================================================
  const isStep1Valid =
    isLettersOnly(regForm.first_name) &&
    isLettersOnly(regForm.last_name) &&
    isValidPastDate(regForm.dob) &&
    regForm.gender;

  const isStep2Valid =
    isValidMobile(regForm.phone) &&
    isValidEmail(regForm.email) &&
    regForm.password &&
    regForm.password.length >= 6 &&
    regForm.street.trim().length >= 4 &&
    regForm.city.trim().length >= 2 &&
    regForm.state &&
    isValidPincode(regForm.pincode);

  const handleRegNextStep1 = () => {
    if (!isStep1Valid) return;
    onTriggerLoader('Saving identity details and proceeding...', 800);
    setRegStep(2);
  };

  // Check duplicate and send registration OTP
  const handleRegNextStep2 = async () => {
    if (!isStep2Valid) return;
    setRegError('');
    setRegIsDuplicate(false);
    onTriggerLoader('Checking National Cyber Registry for existing accounts...', 1200);

    try {
      const res = await fetch('/api/auth/send-reg-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: regForm.phone.trim(),
          email: regForm.email.trim()
        })
      });
      const data = await res.json();

      // REQUIREMENT 4: Duplicate Account Detection
      if (res.status === 409 || data.already_exists) {
        const msg = 'Account already exists. Please log in instead.';
        setRegError(msg);
        setRegIsDuplicate(true);
        if (onDispatchTopToast) {
          onDispatchTopToast({ type: 'invalid', message: msg });
        }
        return;
      }

      if (res.ok && data.success) {
        // Notification for OTP sent
        if (onDispatchTopToast) {
          onDispatchTopToast({
            type: 'sent',
            otp: data.otp,
            mobile: regForm.phone,
            message: 'OTP sent successfully.'
          });
        }
        setRegStep(3);
      } else {
        setRegError(data.error || 'Failed to dispatch verification OTP.');
      }
    } catch (err) {
      setRegError('Failed to communicate with authentication server.');
    }
  };

  // Complete Registration & Save to Database
  const handleRegComplete = async () => {
    if (regOtp.trim().length !== 6) {
      setRegError('Please enter the complete 6-digit OTP code.');
      return;
    }
    setRegError('');
    onTriggerLoader('Registering account into National Cyber Database...', 1400);

    try {
      const res = await fetch('/api/auth/register-citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...regForm,
          otp: regOtp.trim()
        })
      });
      const data = await res.json();

      if (res.status === 409 || data.already_exists) {
        const msg = 'Account already exists. Please log in instead.';
        setRegError(msg);
        setRegIsDuplicate(true);
        if (onDispatchTopToast) {
          onDispatchTopToast({ type: 'invalid', message: msg });
        }
        return;
      }

      if (res.status === 401) {
        const msg = 'Invalid OTP.';
        setRegError(msg);
        if (onDispatchTopToast) {
          onDispatchTopToast({ type: 'invalid', message: msg });
        }
        return;
      }

      if (res.ok && data.success) {
        if (onDispatchTopToast) {
          onDispatchTopToast({
            type: 'verified',
            message: 'Verification successful.'
          });
        }
        onLoginSuccess(data.user);
      } else {
        setRegError(data.error || 'Failed to complete registration.');
      }
    } catch (err) {
      setRegError('Network error during account registration.');
    }
  };

  // Quick Case Tracker Search
  const handleCaseSearch = async (e) => {
    e.preventDefault();
    if (!caseSearchId.trim()) return;
    setCaseSearchError('');
    setCaseResult(null);
    setCaseSearchLoading(true);
    onTriggerLoader(`Querying National Database for Complaint #${caseSearchId}...`, 1200);

    try {
      const res = await fetch(`/api/cases/status/${caseSearchId.trim()}`);
      const data = await res.json();
      if (res.ok) {
        setCaseResult(data);
      } else {
        setCaseSearchError(data.error || 'Complaint record not found in National Database.');
      }
    } catch (err) {
      setCaseSearchError('Error connecting to Case Registry.');
    } finally {
      setCaseSearchLoading(false);
    }
  };

  return (
    <div className="public-portal-container">
      {/* ==================================================================== */}
      {/* 1. HERO TRICOLOR BANNER SECTION (INDIAN FLAG THEME - ZERO BLUE)      */}
      {/* ==================================================================== */}
      <section className="gov-hero-banner">
        <div className="gov-hero-inner">
          <div className="gov-hero-badge">
            <span className="ghb-dot"></span>
            <span>24x7 Citizen Cyber Protection Portal</span>
          </div>
          <h2 className="gov-hero-title">
            Filing Cyber Crime Complaints Made Simple &amp; Secure
          </h2>
          <p className="gov-hero-subtitle">
            Report online financial scams, UPI frauds, unauthorized transactions, identity theft, and cyber harassment directly to law enforcement authorities.
          </p>

          <div className="gov-hero-stats-strip">
            <div className="gh-stat-item">
              <span className="gh-stat-num">1930</span>
              <span className="gh-stat-label">National Toll-Free Helpline</span>
            </div>
            <div className="gh-stat-divider"></div>
            <div className="gh-stat-item">
              <span className="gh-stat-num">2 Hours</span>
              <span className="gh-stat-label">Golden Hour Fraud Freeze Rule</span>
            </div>
            <div className="gh-stat-divider"></div>
            <div className="gh-stat-item">
              <span className="gh-stat-num">100%</span>
              <span className="gh-stat-label">Database Encrypted &amp; Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* LOGIN & SIGNUP VIEWPORT                                              */}
      {/* ==================================================================== */}
      <section className="gov-login-viewport" id="login-card-container">
        {activeNavTab && !['home', 'track', 'learning', 'helpline'].includes(activeNavTab) && (
          <div className="gov-auth-notice-banner animate-slide-down">
            <span className="gan-icon">🔒</span>
            <span className="gan-text">
              <strong>Official Login Required:</strong> Please enter your registered credentials or register a new account below to file a cyber complaint or access restricted databases.
            </span>
          </div>
        )}

        <div className="official-login-card">
          {/* Top Center Circular User Icon Badge (Saffron/Green tint - NO BLUE) */}
          <div className="login-user-icon-ring">
            <svg
              className="login-user-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EA580C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>

          <h2 className="official-login-title">
            {authMode === 'signup' ? 'New Citizen Registration' : loginRole === 'Investigator' ? 'Officer Portal • Law Enforcement' : 'Citizen Portal Login'}
          </h2>

          {/* Floating Text Switch: Citizen Portal | Officer Portal | New Citizen Registration */}
          <div className="floating-auth-switch">
            <button
              type="button"
              className={`fas-btn ${authMode === 'signin' && loginRole === 'Victim' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signin');
                setLoginRole('Victim');
                setSignInError('');
                setOtpSent(false);
              }}
            >
              Citizen Portal
            </button>
            <span className="fas-sep">|</span>
            <button
              type="button"
              className={`fas-btn ${authMode === 'signin' && loginRole === 'Investigator' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signin');
                setLoginRole('Investigator');
                setSignInError('');
                setOtpSent(false);
              }}
            >
              Officer Portal
            </button>
            <span className="fas-sep">|</span>
            <button
              type="button"
              className={`fas-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setLoginRole('Victim');
                setRegStep(1);
                setSignInError('');
                setRegError('');
                setRegIsDuplicate(false);
              }}
            >
              New Citizen Registration
            </button>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* SIGN IN FORM (STRICT DATABASE AUTHENTICATION)                       */}
          {/* ------------------------------------------------------------------ */}
          {authMode === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="official-login-form">
              {signInError && (
                <div className="gov-alert-danger animate-shake">
                  <span className="alert-icon">⚠️</span>
                  <span>{signInError}</span>
                  {signInError.includes('sign up first') && loginRole === 'Victim' && (
                    <button
                      type="button"
                      className="btn-switch-signup-inline"
                      onClick={() => {
                        setAuthMode('signup');
                        setRegStep(1);
                        setSignInError('');
                      }}
                    >
                      Sign Up &rarr;
                    </button>
                  )}
                </div>
              )}

              {/* ROW 1: Identity Credential Input */}
              {loginRole === 'Victim' ? (
                /* CITIZEN ROW 1: Mobile Number or Email + Get OTP */
                <div className="login-row-1">
                  <div className="floating-input-group flex-1">
                    <input
                      type="text"
                      id="mobileNumber"
                      className="floating-input"
                      placeholder=" "
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                    />
                    <label htmlFor="mobileNumber" className="floating-label">
                      Registered Mobile Number or Email
                    </label>
                  </div>

                  <button
                    type="button"
                    className="btn-saffron-get-otp"
                    disabled={!loginIdentifier.trim() || signInLoading}
                    onClick={handleGetOtp}
                    title="Generate OTP from Oracle Database"
                  >
                    {signInLoading && !otpSent ? 'Sending...' : 'Get OTP'}
                  </button>
                </div>
              ) : (
                /* OFFICER ROW 1: Official Agency Badge ID */
                <div className="login-row-1">
                  <div className="floating-input-group w-full">
                    <input
                      type="text"
                      id="officerBadgeId"
                      className="floating-input uppercase-text"
                      placeholder=" "
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                    />
                    <label htmlFor="officerBadgeId" className="floating-label">
                      Official Agency / Police Badge ID (e.g. CBI-CYB-101, I4C-INV-201)
                    </label>
                  </div>
                </div>
              )}

              {/* ROW 2: Password Input */}
              <div className="login-row-password">
                <div className="floating-input-group w-full relative-pwd-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="loginPassword"
                    className="floating-input"
                    placeholder=" "
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="loginPassword" className="floating-label">
                    {loginRole === 'Investigator' ? 'Official Government Password' : 'Password'}
                  </label>
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>

              {/* ROW 3: Optional OTP Input (CITIZENS ONLY) */}
              {loginRole === 'Victim' && (
                <div className="login-row-2">
                  <div className="floating-input-group w-full">
                    <input
                      type="text"
                      id="loginOtp"
                      className="floating-input"
                      maxLength={6}
                      placeholder=" "
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                    <label htmlFor="loginOtp" className="floating-label">
                      OTP (Optional if Password entered)
                    </label>
                  </div>
                  {otpSent && (
                    <p className="otp-live-notice">
                      ✅ OTP sent! Check the top toast notification for your code.
                    </p>
                  )}
                </div>
              )}

              {/* ROW 4: Side-by-Side Captcha */}
              <div className="login-row-3-captcha">
                <div className="captcha-display-box" title="Security Captcha">
                  <div className="captcha-pattern-bg">
                    <span className="captcha-text-render">{captchaCode}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-captcha-refresh"
                    onClick={refreshCaptcha}
                    title="Change Captcha Text"
                  >
                    ↻
                  </button>
                </div>

                <div className="floating-input-group flex-1">
                  <input
                    type="text"
                    id="captchaInput"
                    className="floating-input uppercase-text"
                    maxLength={6}
                    placeholder=" "
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                  />
                  <label htmlFor="captchaInput" className="floating-label">
                    Captcha
                  </label>
                </div>
              </div>

              {/* ROW 5: Centered India Green [Login] Button */}
              <div className="login-row-4-submit">
                <button
                  type="submit"
                  className="btn-gov-login"
                  disabled={
                    !loginIdentifier.trim() ||
                    !loginPassword.trim() ||
                    captchaInput.trim().length < 4 ||
                    signInLoading
                  }
                >
                  {signInLoading ? 'Verifying...' : loginRole === 'Investigator' ? 'Officer Login' : 'Citizen Login'}
                </button>
              </div>

              {loginRole === 'Investigator' ? (
                <div style={{ marginTop: '14px', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.82rem', color: '#475569', textAlign: 'left', lineHeight: '1.4' }}>
                  <strong>🔒 Restricted Law Enforcement Portal:</strong> Cyber police officer accounts are pre-commissioned by Ministry / State Cyber Police Cells across CBI, I4C, Delhi, Maharashtra, Karnataka, Telangana, Tamil Nadu, and West Bengal duty circles. Public registration is restricted to citizens only.
                </div>
              ) : (
                <div className="login-footer-hint">
                  <span>Direct Access via Oracle 11g Database</span>
                  <span className="dot-sep">&bull;</span>
                  <span>Encrypted Authentication</span>
                </div>
              )}
            </form>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* SIGN UP FORM (DUPLICATE PREVENTION & STRICT VALIDATION)            */}
          {/* ------------------------------------------------------------------ */}
          {authMode === 'signup' && (
            <div className="official-signup-form">
              <p style={{ fontSize: '0.85rem', color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '6px 12px', borderRadius: '6px', marginBottom: '14px', textAlign: 'center', fontWeight: '500' }}>
                🇮🇳 Official Citizen Registration &bull; File and track cyber complaints with law enforcement
              </p>
              <div className="signup-stepper">
                <span className={`st-step ${regStep >= 1 ? 'active' : ''}`}>1. Personal</span>
                <span className="st-arrow">&rarr;</span>
                <span className={`st-step ${regStep >= 2 ? 'active' : ''}`}>2. Contact &amp; Password</span>
                <span className="st-arrow">&rarr;</span>
                <span className={`st-step ${regStep >= 3 ? 'active' : ''}`}>3. Verify OTP</span>
              </div>

              {regError && (
                <div className="gov-alert-danger animate-shake">
                  <span className="alert-icon">⚠️</span>
                  <span>{regError}</span>
                  {regIsDuplicate && (
                    <button
                      type="button"
                      className="btn-switch-signup-inline"
                      onClick={() => {
                        setAuthMode('signin');
                        setLoginIdentifier(regForm.phone || regForm.email);
                        setSignInError('');
                        setRegError('');
                      }}
                    >
                      Log In &rarr;
                    </button>
                  )}
                </div>
              )}

              {/* STEP 1: Personal Details */}
              {regStep === 1 && (
                <div className="reg-pane animate-fade-in">
                  <div className="floating-input-group mb-4">
                    <input
                      type="text"
                      id="regFirst"
                      className="floating-input"
                      placeholder=" "
                      value={regForm.first_name}
                      onChange={(e) => setRegForm({ ...regForm, first_name: e.target.value })}
                      required
                    />
                    <label htmlFor="regFirst" className="floating-label">First Name *</label>
                  </div>

                  <div className="floating-input-group mb-4">
                    <input
                      type="text"
                      id="regLast"
                      className="floating-input"
                      placeholder=" "
                      value={regForm.last_name}
                      onChange={(e) => setRegForm({ ...regForm, last_name: e.target.value })}
                      required
                    />
                    <label htmlFor="regLast" className="floating-label">Last Name *</label>
                  </div>

                  <div className="floating-input-group mb-4">
                    <input
                      type="date"
                      id="regDob"
                      className="floating-input"
                      placeholder=" "
                      value={regForm.dob}
                      onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                      required
                    />
                    <label htmlFor="regDob" className="floating-label">Date of Birth *</label>
                  </div>

                  <div className="floating-input-group mb-4">
                    <select
                      id="regGender"
                      className="floating-input"
                      value={regForm.gender}
                      onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Transgender">Transgender</option>
                    </select>
                    <label htmlFor="regGender" className="floating-label">Gender *</label>
                  </div>

                  <div className="reg-actions-row">
                    <button
                      type="button"
                      className="btn-gov-login"
                      disabled={!isStep1Valid}
                      onClick={handleRegNextStep1}
                    >
                      Next: Contact &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Contact, Password & Duplicate Validation */}
              {regStep === 2 && (
                <div className="reg-pane animate-fade-in">
                  <div className="floating-input-group mb-4">
                    <input
                      type="tel"
                      id="regPhone"
                      className="floating-input"
                      maxLength={10}
                      placeholder=" "
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value.replace(/\D/g, '') })}
                      required
                    />
                    <label htmlFor="regPhone" className="floating-label">10-Digit Mobile Number *</label>
                  </div>

                  <div className="floating-input-group mb-4">
                    <input
                      type="email"
                      id="regEmail"
                      className="floating-input"
                      placeholder=" "
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      required
                    />
                    <label htmlFor="regEmail" className="floating-label">Email ID (Unique) *</label>
                  </div>

                  <div className="floating-input-group mb-4">
                    <input
                      type="password"
                      id="regPassword"
                      className="floating-input"
                      placeholder=" "
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      required
                    />
                    <label htmlFor="regPassword" className="floating-label">Create Password (Min 6 chars) *</label>
                  </div>

                  <div className="floating-input-group mb-4">
                    <input
                      type="text"
                      id="regStreet"
                      className="floating-input"
                      placeholder=" "
                      value={regForm.street}
                      onChange={(e) => setRegForm({ ...regForm, street: e.target.value })}
                      required
                    />
                    <label htmlFor="regStreet" className="floating-label">Street Address *</label>
                  </div>

                  <div className="floating-input-group mb-4">
                    <input
                      type="text"
                      id="regCity"
                      className="floating-input"
                      placeholder=" "
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      required
                    />
                    <label htmlFor="regCity" className="floating-label">City *</label>
                  </div>

                  <div className="floating-input-group mb-4">
                    <select
                      id="regState"
                      className="floating-input"
                      value={regForm.state}
                      onChange={(e) => setRegForm({ ...regForm, state: e.target.value })}
                      required
                    >
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <label htmlFor="regState" className="floating-label">State / UT *</label>
                  </div>

                  <div className="floating-input-group mb-4">
                    <input
                      type="text"
                      id="regPincode"
                      className="floating-input"
                      maxLength={6}
                      placeholder=" "
                      value={regForm.pincode}
                      onChange={(e) => setRegForm({ ...regForm, pincode: e.target.value.replace(/\D/g, '') })}
                      required
                    />
                    <label htmlFor="regPincode" className="floating-label">6-Digit Pincode *</label>
                  </div>

                  <div className="reg-actions-row">
                    <button
                      type="button"
                      className="btn-reg-back"
                      onClick={() => setRegStep(1)}
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      className="btn-gov-login"
                      disabled={!isStep2Valid}
                      onClick={handleRegNextStep2}
                    >
                      Get OTP &amp; Continue &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: OTP Verification & Creation */}
              {regStep === 3 && (
                <div className="reg-pane animate-fade-in">
                  <p className="reg-otp-msg">
                    We sent a 6-digit OTP to <strong>+91-{regForm.phone}</strong>. Enter it below to activate your citizen account in the National Database.
                  </p>

                  <div className="floating-input-group mb-4">
                    <input
                      type="text"
                      id="regOtpInput"
                      className="floating-input"
                      maxLength={6}
                      placeholder=" "
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                    <label htmlFor="regOtpInput" className="floating-label">6-Digit OTP *</label>
                  </div>

                  <div className="reg-actions-row">
                    <button
                      type="button"
                      className="btn-reg-back"
                      onClick={() => setRegStep(2)}
                    >
                      &larr; Change Details
                    </button>
                    <button
                      type="button"
                      className="btn-gov-login"
                      disabled={regOtp.trim().length !== 6}
                      onClick={handleRegComplete}
                    >
                      Verify &amp; Create Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. QUICK CASE STATUS TRACKER                                         */}
      {/* ==================================================================== */}
      <section className="gov-card-container" id="public-case-tracker">
        <div className="gov-content-card">
          <div className="gcc-header">
            <span className="gcc-badge">CASE TRACKER</span>
            <h3 className="gcc-title">Check Complaint Status in National Database</h3>
            <p className="gcc-sub">
              Enter your official Case ID (e.g. 2025001) to view the assigned investigating officer, station, and court hearing dates.
            </p>
          </div>

          <form onSubmit={handleCaseSearch} className="case-tracker-row">
            <div className="floating-input-group flex-1">
              <input
                type="text"
                id="searchCaseInput"
                className="floating-input"
                placeholder=" "
                value={caseSearchId}
                onChange={(e) => setCaseSearchId(e.target.value.replace(/\D/g, ''))}
                required
              />
              <label htmlFor="searchCaseInput" className="floating-label">
                Complaint / Case ID
              </label>
            </div>

            <button
              type="submit"
              className="btn-gov-search"
              disabled={!caseSearchId.trim() || caseSearchLoading}
            >
              {caseSearchLoading ? 'Searching...' : 'Track Status'}
            </button>
          </form>

          {caseSearchError && (
            <div className="gov-alert-danger mt-3">
              <span className="alert-icon">⚠️</span>
              <span>{caseSearchError}</span>
            </div>
          )}

          {caseResult && (
            <div className="case-result-dossier animate-slide-down">
              <div className="crd-top">
                <div>
                  <span className="crd-case-id">CASE #{caseResult.case_id}</span>
                  <h4 className="crd-case-title">{caseResult.case_title}</h4>
                </div>
                <span className={`crd-status-pill ${caseResult.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                  {caseResult.status}
                </span>
              </div>

              <div className="crd-grid">
                <div className="crd-cell">
                  <span className="crd-label">Assigned Officer:</span>
                  <span className="crd-val">{caseResult.investigator_name || 'Duty Cyber Crime Investigator'}</span>
                </div>
                <div className="crd-cell">
                  <span className="crd-label">Department / Station:</span>
                  <span className="crd-val">{caseResult.department || 'National Cyber Crime Coordination Centre (I4C)'}</span>
                </div>
                <div className="crd-cell">
                  <span className="crd-label">Next Court Hearing:</span>
                  <span className="crd-val">
                    {caseResult.next_hearing_date
                      ? new Date(caseResult.next_hearing_date).toLocaleDateString('en-IN')
                      : 'Under Investigation / Pending Listing'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. CRIME CATEGORIES AWARENESS                                        */}
      {/* ==================================================================== */}
      <section className="gov-card-container" id="public-learning-section">
        <div className="gov-content-card">
          <div className="gcc-header">
            <span className="gcc-badge">CITIZEN AWARENESS</span>
            <h3 className="gcc-title">Reportable Cyber Crime Categories</h3>
            <p className="gcc-sub">
              Official categories recognized under the Indian Information Technology Act and Bharatiya Nyaya Sanhita.
            </p>
          </div>

          {crimeTypesLoading ? (
            <p className="loading-note">Querying categories from Oracle 11g database...</p>
          ) : (
            <div className="crime-types-grid">
              {crimeTypes.map((ct) => (
                <div key={ct.crime_type_id} className="crime-type-card">
                  <div className="ctc-top">
                    <h4 className="ctc-title">{ct.crime_type_name}</h4>
                    <span className="ctc-category">{ct.category || 'Cyber Crime'}</span>
                  </div>
                  <p className="ctc-desc">{ct.description}</p>
                  <div className="ctc-bottom">
                    <span className="ctc-severity">Severity: <strong>{ct.severity_level || 'High'}</strong></span>
                    <span className="ctc-tag">IT Act 2000</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
