import React, { useEffect, useState } from 'react';

/**
 * TopNotification - Floating Toast Notification from Top of Screen
 * Supports 5 visual states:
 * 1. 'sent' / 'OTP sent successfully.'
 * 2. 'invalid' / 'Invalid OTP.'
 * 3. 'expired' / 'OTP expired.'
 * 4. 'resent' / 'OTP resent successfully.'
 * 5. 'verified' / 'Verification successful.'
 */
export default function TopNotification({ notification, onDismiss, onAutoFill }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!notification) return;

    // Play subtle auditory chime for OTP arrival
    if (notification.type === 'sent' || notification.type === 'resent' || notification.otp) {
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
        // Silent fallback if Web Audio is restricted
      }
    }

    // Auto-dismiss after 7 seconds (except if it has OTP code, keep slightly longer)
    const timer = setTimeout(() => {
      onDismiss();
    }, notification.otp ? 9000 : 6000);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const handleCopy = () => {
    if (notification.otp) {
      navigator.clipboard.writeText(notification.otp);
      setCopied(true);
      if (onAutoFill) onAutoFill(notification.otp);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine notification state
  const type = notification.type || (notification.otp ? 'sent' : 'info');

  const getStateConfig = () => {
    switch (type) {
      case 'sent':
        return {
          badgeClass: 'top-toast-sent',
          icon: '📨',
          title: 'OTP Sent Successfully',
          headline: 'Government of India (MHA SMS)',
          borderClass: 'border-saffron'
        };
      case 'invalid':
        return {
          badgeClass: 'top-toast-invalid',
          icon: '⚠️',
          title: 'Invalid OTP',
          headline: 'Verification Alert',
          borderClass: 'border-danger'
        };
      case 'expired':
        return {
          badgeClass: 'top-toast-expired',
          icon: '⏱️',
          title: 'OTP Expired',
          headline: 'Security Session Notice',
          borderClass: 'border-warning'
        };
      case 'resent':
        return {
          badgeClass: 'top-toast-resent',
          icon: '🔄',
          title: 'OTP Resent Successfully',
          headline: 'Government of India (MHA SMS)',
          borderClass: 'border-saffron'
        };
      case 'verified':
        return {
          badgeClass: 'top-toast-verified',
          icon: '✅',
          title: 'Verification Successful',
          headline: 'National Cyber Security Clearance',
          borderClass: 'border-green'
        };
      default:
        return {
          badgeClass: 'top-toast-info',
          icon: 'ℹ️',
          title: notification.title || 'Security Notification',
          headline: 'Government of India',
          borderClass: 'border-green'
        };
    }
  };

  const config = getStateConfig();

  return (
    <aside
      className="top-toast-viewport"
      role="alert"
      aria-live="assertive"
    >
      <div className={`top-toast-card ${config.borderClass}`}>
        <div className="top-toast-header">
          <div className="top-toast-badge-group">
            <span className="top-toast-icon">{config.icon}</span>
            <span className="top-toast-headline">{config.headline}</span>
            <span className={`top-toast-status-pill ${config.badgeClass}`}>{config.title}</span>
          </div>

          <button
            type="button"
            className="top-toast-close"
            onClick={onDismiss}
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>

        <div className="top-toast-body">
          {notification.message ? (
            <p className="top-toast-msg">{notification.message}</p>
          ) : notification.otp ? (
            <div className="top-toast-otp-row">
              <span className="top-toast-otp-text">Your one-time login code is</span>
              <span className="top-toast-otp-number">{notification.otp}</span>
              <span className="top-toast-otp-sub">(Valid for 10 minutes)</span>
            </div>
          ) : (
            <p className="top-toast-msg">Notification processed safely.</p>
          )}

          {notification.mobile && (
            <span className="top-toast-target">
              Sent to: <strong>+91-{notification.mobile}</strong>
            </span>
          )}
        </div>

        {notification.otp && (
          <div className="top-toast-actions">
            <button
              type="button"
              className="btn-top-toast-copy"
              onClick={handleCopy}
            >
              {copied ? '✓ Copied & Auto-filled!' : '📋 Copy & Fill Code'}
            </button>
            <button
              type="button"
              className="btn-top-toast-dismiss"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
