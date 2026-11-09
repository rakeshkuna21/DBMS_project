import React from 'react';

export default function NationalEmblemLoader({
  message = "Opening National Cyber Crime Portal...",
  isSlowInternet = false,
  subtext = ""
}) {
  return (
    <div className="emblem-loader-overlay" role="alert" aria-busy="true">
      <div className="emblem-loader-box">
        {/* Animated Double Spinner Ring around Emblem */}
        <div className="emblem-spinner-wrapper">
          <div className="tricolor-spinner-ring"></div>
          
          {/* Official Emblem of India (with inline vector fallback) */}
          <div className="emblem-inner-icon">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="State Emblem of India"
              className="emblem-spinning-img"
              onError={(e) => {
                // If network fails, show dignified inline SVG representation
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            {/* Inline SVG Fallback for 100% offline reliability */}
            <svg
              className="emblem-svg-fallback"
              style={{ display: 'none', width: '80px', height: '80px' }}
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="42" fill="#FFFFFF" stroke="#1F2937" strokeWidth="4" />
              <circle cx="50" cy="50" r="14" fill="#1F2937" />
              <g stroke="#1F2937" strokeWidth="2">
                {[...Array(24)].map((_, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2={50 + 40 * Math.cos((i * 15 * Math.PI) / 180)}
                    y2={50 + 40 * Math.sin((i * 15 * Math.PI) / 180)}
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* National Motto & Authority Title */}
        <h3 className="motto-text">सत्यमेव जयते</h3>
        <p className="govt-text">Government of India | Ministry of Home Affairs</p>

        {/* Dynamic Status Message */}
        <div className="loader-msg-container">
          <div className="loader-dots">
            <span className="dot dot-1"></span>
            <span className="dot dot-2"></span>
            <span className="dot dot-3"></span>
          </div>
          <p className="loader-primary-msg">{message}</p>
        </div>

        {/* Slow Internet Alert if detected or toggled */}
        {isSlowInternet ? (
          <div className="slow-net-alert">
            <span className="slow-net-icon">⚠️</span>
            <div>
              <strong>Your internet connection is slow.</strong>
              <p>Please wait while we safely process your request. Do not refresh the page or press the back button.</p>
            </div>
          </div>
        ) : subtext ? (
          <p className="loader-subtext">{subtext}</p>
        ) : (
          <p className="loader-subtext">Securing safe connection with Government Cyber Database...</p>
        )}
      </div>
    </div>
  );
}
