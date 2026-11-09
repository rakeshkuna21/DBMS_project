import React, { useEffect, useState } from 'react';

export default function SmsNotification({ sms, onDismiss, onAutoFill }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Play gentle realistic SMS chime via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay disabled; silent fallback
    }
  }, [sms]);

  if (!sms) return null;

  const handleCopy = () => {
    if (sms.otp) {
      navigator.clipboard.writeText(sms.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onAutoFill) onAutoFill(sms.otp);
    }
  };

  return (
    <div className="sms-banner-container" role="status" aria-live="assertive">
      <div className="sms-banner-card">
        <div className="sms-banner-header">
          <div className="sms-sender">
            <span className="sms-sim-icon">📱</span>
            <span className="sms-header-title">GOV-INDIA SMS &bull; Just Now</span>
          </div>
          <button className="sms-close-btn" onClick={onDismiss} title="Dismiss notification">
            &times;
          </button>
        </div>

        <div className="sms-banner-body">
          <p className="sms-text">
            <strong>Government of India (MHA):</strong> Your one-time verification code is{' '}
            <span className="sms-otp-highlight">{sms.otp}</span>. Valid for 10 minutes. Please do not share this OTP with anyone.
          </p>
          {sms.mobile && (
            <p className="sms-phone-tag">Sent to registered mobile: +91 {sms.mobile}</p>
          )}
        </div>

        <div className="sms-banner-actions">
          <button className="btn-sms-copy" onClick={handleCopy}>
            {copied ? '✓ Copied & Filled!' : '📋 Copy & Fill OTP'}
          </button>
          <button className="btn-sms-dismiss" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
