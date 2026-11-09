import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import PublicPortal from './components/PublicPortal.jsx';
import CitizenPortal from './components/CitizenPortal.jsx';
import InvestigatorDashboard from './components/InvestigatorDashboard.jsx';
import NationalEmblemLoader from './components/NationalEmblemLoader.jsx';
import TopNotification from './components/TopNotification.jsx';

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isSlowInternet, setIsSlowInternet] = useState(false);
  const [fontSize, setFontSize] = useState('small'); // 'small' (A-) | 'medium' (A) | 'large' (A+)

  // Active top navigation tab ('home' | 'report' | 'track' | 'suspect' | 'learning' | 'help' | etc.)
  const [activeNavTab, setActiveNavTab] = useState('home');
  const [preselectedCategory, setPreselectedCategory] = useState(null);
  const [pendingRedirectTab, setPendingRedirectTab] = useState(null);

  // Realistic Government Loader State
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderMessage, setLoaderMessage] = useState('Opening National Cyber Crime Portal...');

  // Top Floating Toast Notification State
  const [activeToast, setActiveToast] = useState(null);

  // Initial Website Boot Loader (2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaderVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Universal helper to trigger loader across actions
  const triggerLoader = (message, durationMs = 1200) => {
    setLoaderMessage(message);
    setLoaderVisible(true);
    setTimeout(() => {
      if (!isSlowInternet) {
        setLoaderVisible(false);
      }
    }, durationMs);
  };

  // If slow internet is toggled OFF while loader is stuck, release loader
  useEffect(() => {
    if (!isSlowInternet && loaderVisible) {
      const releaseTimer = setTimeout(() => {
        setLoaderVisible(false);
      }, 800);
      return () => clearTimeout(releaseTimer);
    }
  }, [isSlowInternet]);

  // Dispatch floating top toast notification
  const handleDispatchTopToast = (toastData) => {
    setActiveToast(toastData);
  };

  // Login handler
  const handleLoginSuccess = (user) => {
    const targetTab = pendingRedirectTab || 'overview';
    setPendingRedirectTab(null);
    triggerLoader(`Welcome, ${user.name || user.first_name || user.username || user.mobile_number}. Opening your workspace...`, 1500);
    setLoggedInUser(user);
    setActiveNavTab(targetTab);

    handleDispatchTopToast({
      type: 'verified',
      message: 'Verification successful. Welcome to your official portal.'
    });
  };

  // Logout handler
  const handleLogout = () => {
    triggerLoader('Safely ending your session and logging out...', 1200);
    setTimeout(() => {
      setLoggedInUser(null);
      setActiveNavTab('home');
      setPendingRedirectTab(null);
      handleDispatchTopToast({
        type: 'info',
        title: 'Logged Out',
        message: 'Your secure session has been terminated safely.'
      });
    }, 1000);
  };

  // Master Navigation Handler for Top Header Links
  const handleNavigateTab = (tabId) => {
    console.log('Navigation requested:', tabId, 'LoggedIn:', !!loggedInUser);

    // 1. IF NOT LOGGED IN: Handle Public Access and Auth Safeguards
    if (!loggedInUser) {
      if (tabId === 'home') {
        setActiveNavTab('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (tabId === 'track') {
        // Quick Tracker on Public Page
        setActiveNavTab('track');
        handleDispatchTopToast({
          type: 'info',
          title: 'Track Complaint Status',
          message: 'Enter your 7-digit Case ID below to track status, or log in to view complete case files.'
        });
        const trackerElem = document.getElementById('public-case-tracker');
        if (trackerElem) {
          trackerElem.scrollIntoView({ behavior: 'smooth' });
          const inp = trackerElem.querySelector('input');
          if (inp) inp.focus();
        } else {
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }
        return;
      }

      if (tabId === 'learning' || tabId === 'cyber-safety' || tabId === 'faqs') {
        setActiveNavTab('learning');
        const learnElem = document.getElementById('public-learning-section');
        if (learnElem) {
          learnElem.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 900, behavior: 'smooth' });
        }
        handleDispatchTopToast({
          type: 'info',
          title: 'Learning Corner',
          message: 'Exploring Cyber Hygiene Guidelines, Safe Banking Tips & Citizen FAQs.'
        });
        return;
      }

      if (tabId === 'help' || tabId === 'helpline') {
        setActiveNavTab('helpline');
        handleDispatchTopToast({
          type: 'sent',
          title: 'National Cyber Helpline 1930',
          message: 'Toll-free 24x7 emergency helpline for financial fraud and account freezing within Golden Hour.'
        });
        return;
      }

      if (tabId === 'feedback') {
        handleDispatchTopToast({
          type: 'info',
          title: 'Citizen Portal Feedback',
          message: 'Please log in to submit your feedback or suggestions directly to the Ministry.'
        });
        const loginElem = document.getElementById('login-card-container');
        if (loginElem) loginElem.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // PROTECTED SECTIONS: 'report', 'report-financial', 'report-women', 'report-other', 'suspect', 'suspect-registry', 'suspect-accounts'
      setPendingRedirectTab(tabId);
      let featureName = 'Report a Cyber Crime';
      if (tabId.includes('suspect')) featureName = 'National Suspect Registry & Blocked Mule Accounts';
      if (tabId.includes('women')) featureName = 'Women / Child Cyber Safety Reporting';

      handleDispatchTopToast({
        type: 'invalid',
        title: 'Authentication Required',
        message: `Please log in first to access "${featureName}". Sign in with your registered phone or register a new account.`
      });

      // Smooth scroll to the login card
      const loginElem = document.getElementById('login-card-container');
      if (loginElem) {
        loginElem.scrollIntoView({ behavior: 'smooth' });
        const idInp = loginElem.querySelector('input[type="text"], input[type="tel"]');
        if (idInp) idInp.focus();
      } else {
        window.scrollTo({ top: 200, behavior: 'smooth' });
      }
      return;
    }

    // 2. IF LOGGED IN: Seamless tab switching with instant feedback
    if (tabId === 'home') {
      setActiveNavTab('overview');
      triggerLoader('Opening Dashboard Overview...', 700);
      return;
    }

    if (tabId === 'report' || tabId.startsWith('report-')) {
      setActiveNavTab('report');
      if (tabId === 'report-financial') setPreselectedCategory('1');
      else if (tabId === 'report-women') setPreselectedCategory('2');
      else if (tabId === 'report-other') setPreselectedCategory('3');
      else setPreselectedCategory('1');

      triggerLoader('Opening Cyber Crime Complaint Form...', 800);
      handleDispatchTopToast({
        type: 'sent',
        title: 'Report Cyber Crime',
        message: '3-Step Official Complaint Registration Form loaded.'
      });
      return;
    }

    if (tabId === 'track') {
      setActiveNavTab('cases');
      triggerLoader('Loading My Complaints & Status...', 800);
      handleDispatchTopToast({
        type: 'info',
        title: 'Track Status',
        message: 'Viewing your registered complaints and real-time police investigation logs.'
      });
      return;
    }

    if (tabId === 'suspect' || tabId.startsWith('suspect-')) {
      setActiveNavTab('suspect');
      triggerLoader('Opening National Suspect Intelligence Registry...', 900);
      handleDispatchTopToast({
        type: 'info',
        title: 'National Suspect Data',
        message: 'Displaying verified cyber fraudsters, blocked mule bank accounts, and flagged UPI handles.'
      });
      return;
    }

    if (tabId === 'learning' || tabId === 'cyber-safety' || tabId === 'faqs') {
      setActiveNavTab('learning');
      triggerLoader('Opening Citizen Learning Corner...', 700);
      handleDispatchTopToast({
        type: 'info',
        title: 'Learning Corner',
        message: 'Viewing Cyber Hygiene Best Practices, Golden Hour Protocols & Citizen FAQs.'
      });
      return;
    }

    if (tabId === 'help' || tabId === 'helpline' || tabId === 'feedback') {
      setActiveNavTab('help');
      triggerLoader('Opening Help & Feedback Directory...', 700);
      handleDispatchTopToast({
        type: 'info',
        title: 'Help & Feedback',
        message: 'National Cyber Helpline 1930 contacts & official feedback system.'
      });
      return;
    }

    if (tabId === 'hearings') {
      setActiveNavTab('hearings');
      triggerLoader('Loading Court Hearing Details...', 800);
      return;
    }

    // Default fallback
    setActiveNavTab(tabId);
  };

  return (
    <div className={`app-root font-size-${fontSize}`}>
      {/* 1. Mandatory National Emblem Loader */}
      {loaderVisible && (
        <NationalEmblemLoader
          message={loaderMessage}
          isSlowInternet={isSlowInternet}
        />
      )}

      {/* 2. Top Floating Toast Notification */}
      {activeToast && (
        <TopNotification
          notification={activeToast}
          onDismiss={() => setActiveToast(null)}
        />
      )}

      {/* 3. Official Header with Clean Floating Tricolor Hamburger & Dropdown */}
      <Header
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        isSlowInternet={isSlowInternet}
        onToggleSlowInternet={setIsSlowInternet}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        activeNavTab={activeNavTab}
        onNavigateTab={handleNavigateTab}
      />

      {/* 4. Main Workspace - Strict Role Isolation */}
      <main className="portal-main-area">
        {!loggedInUser ? (
          <PublicPortal
            onLoginSuccess={handleLoginSuccess}
            onTriggerLoader={triggerLoader}
            onDispatchTopToast={handleDispatchTopToast}
            activeNavTab={activeNavTab}
            onNavigateTab={handleNavigateTab}
          />
        ) : loggedInUser.role === 'Victim' ? (
          <CitizenPortal
            user={loggedInUser}
            onTriggerLoader={triggerLoader}
            activeTab={activeNavTab}
            onSelectTab={handleNavigateTab}
            preselectedCategory={preselectedCategory}
            onDispatchTopToast={handleDispatchTopToast}
          />
        ) : (
          <InvestigatorDashboard
            user={loggedInUser}
            onTriggerLoader={triggerLoader}
            activeTab={activeNavTab}
            onSelectTab={handleNavigateTab}
            onDispatchTopToast={handleDispatchTopToast}
          />
        )}
      </main>

      {/* 5. Official Indian Government Footer with Developer Credits */}
      <Footer onOpenDevelopers={() => {
        handleDispatchTopToast({
          type: 'info',
          title: 'Project Engineering Team',
          message: 'Krish Vats, Sai Dheepak, Rakeesh, and Shanmukh (Full-Stack Architecture & Oracle 11g Engineering)'
        });
      }} />
    </div>
  );
}
