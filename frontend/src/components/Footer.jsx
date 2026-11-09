import React from 'react';

export default function Footer({ onOpenDevelopers }) {
  return (
    <footer className="site-footer-gov">
      {/* 1. TOP GREEN QUICK LINKS BAR */}
      <div className="gov-footer-links-bar">
        <div className="footer-links-inner">
          <a href="#feedback" onClick={(e) => e.preventDefault()}>Feedback</a>
          <span className="footer-sep">|</span>
          <a href="#contact" onClick={(e) => e.preventDefault()}>Contact Us</a>
          <span className="footer-sep">|</span>
          <a href="#faq" onClick={(e) => e.preventDefault()}>FAQ</a>
          <span className="footer-sep">|</span>
          <a href="#policies" onClick={(e) => e.preventDefault()}>Website Policies</a>
          <span className="footer-sep">|</span>
          <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <span className="footer-sep">|</span>
          <a href="#disclaimer" onClick={(e) => e.preventDefault()}>Disclaimer</a>
        </div>
      </div>

      {/* 2. OFFICIAL ACCREDITATION & CREDITS */}
      <div className="gov-footer-bottom">
        <div className="footer-bottom-inner">
          <div className="footer-left-info">
            <p className="footer-agency">
              <strong>National Cyber Crime Reporting Portal (I4C)</strong> &bull; Ministry of Home Affairs, Government of India
            </p>
            <p className="footer-compliance">
              This academic production portal strictly complies with Indian Government Guidelines for Web Sites (GIGW) and Relational ER Architecture.
            </p>
          </div>

          <div className="footer-right-credits">
            <p className="footer-dev-text">
              <strong>Project Engineering:</strong>{' '}
              <button
                type="button"
                className="btn-footer-dev-pill"
                onClick={onOpenDevelopers}
                title="View Team Credits"
              >
                Krish Vats, Sai Dheepak, Rakeesh, and Shanmukh
              </button>
            </p>
            <p className="footer-tech-stack">
              Full-Stack Architecture &amp; Oracle Express 11g XE Engine
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
