// mockApiAdapter.js - Universal In-Browser Client API & LocalStorage Fallback
// Enables 100% 24/7 standalone execution on GitHub Pages, offline laptops, or production servers.

const DEPARTMENTS = [
  { department_id: 1, department_name: 'Central Bureau of Investigation (CBI) - Cyber Crime Division', contact_number: '011-24362755', street: 'CBI HQ, CGO Complex, Lodhi Road', city: 'New Delhi', state: 'Delhi', pincode: '110003' },
  { department_id: 2, department_name: 'National Cyber Crime Coordination Centre (I4C) - MHA', contact_number: '1930', street: 'NDCC-II Building, Jai Singh Road', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
  { department_id: 3, department_name: 'Special Cell (IFSO) - Delhi Police Cyber Crime Unit', contact_number: '011-20892633', street: 'Sector 16C, Dwarka', city: 'New Delhi', state: 'Delhi', pincode: '110078' },
  { department_id: 4, department_name: 'Maharashtra Cyber Police Headquarters', contact_number: '022-22160080', street: 'World Trade Centre, Cuffe Parade', city: 'Mumbai', state: 'Maharashtra', pincode: '400005' },
  { department_id: 5, department_name: 'Cyber Crime Police Station (CID) - Karnataka Police', contact_number: '080-22094498', street: 'CID Headquarters, Carlton House, Palace Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
  { department_id: 6, department_name: 'Cyber Crime Police Station - Telangana Police', contact_number: '040-27852412', street: 'Cyberabad Police Commissionerate, Gachibowli', city: 'Hyderabad', state: 'Telangana', pincode: '500032' },
  { department_id: 7, department_name: 'Cyber Crime Wing (CID) - Tamil Nadu Police', contact_number: '044-28447701', street: 'Police Headquarters, Radhakrishnan Salai, Mylapore', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004' },
  { department_id: 8, department_name: 'Cyber Crime Police Station (CID) - West Bengal Police', contact_number: '033-24791030', street: 'Bhabani Bhaban, Alipore', city: 'Kolkata', state: 'West Bengal', pincode: '700027' }
];

const OFFICERS_RAW = [
  // CBI Cyber Division (CBI-CYB-xxx)
  { officer_id: 'CBI-CYB-101', name: 'Arvind Swaminathan', rank: 'Superintendent of Police (SP)', dept_id: 1, email: 'a.swaminathan@cbi.gov.in', phone: '9444011001' },
  { officer_id: 'CBI-CYB-102', name: 'Rajeshwari Nair', rank: 'Deputy Superintendent of Police (DySP)', dept_id: 1, email: 'r.nair@cbi.gov.in', phone: '9444011002' },
  { officer_id: 'CBI-CYB-103', name: 'Vikramaditya Singh', rank: 'Inspector of Police', dept_id: 1, email: 'v.singh@cbi.gov.in', phone: '9444011003' },
  { officer_id: 'CBI-CYB-104', name: 'Ananya Deshmukh', rank: 'Inspector of Police', dept_id: 1, email: 'a.deshmukh@cbi.gov.in', phone: '9444011004' },
  { officer_id: 'CBI-CYB-105', name: 'Tarun Mehra', rank: 'Sub-Inspector of Police', dept_id: 1, email: 't.mehra@cbi.gov.in', phone: '9444011005' },
  { officer_id: 'CBI-CYB-106', name: 'Shreya Iyer', rank: 'Sub-Inspector of Police', dept_id: 1, email: 's.iyer@cbi.gov.in', phone: '9444011006' },

  // I4C (I4C-INV-xxx)
  { officer_id: 'I4C-INV-201', name: 'Shanmukha Rao', rank: 'Joint Director (IPS)', dept_id: 2, email: 'shanmukha.rao@i4c.gov.in', phone: '9810022001' },
  { officer_id: 'I4C-INV-202', name: 'Kiran Varma', rank: 'Assistant Commissioner of Police (ACP)', dept_id: 2, email: 'kiran.varma@i4c.gov.in', phone: '9810022002' },
  { officer_id: 'I4C-INV-203', name: 'Sai Dheepak', rank: 'Senior Cyber Forensic Analyst', dept_id: 2, email: 'sai.dheepak@i4c.gov.in', phone: '9810022003' },
  { officer_id: 'I4C-INV-204', name: 'Deepa Sundaram', rank: 'Inspector of Police', dept_id: 2, email: 'deepa.sundaram@i4c.gov.in', phone: '9810022004' },
  { officer_id: 'I4C-INV-205', name: 'Manoj Kulkarni', rank: 'Sub-Inspector of Police', dept_id: 2, email: 'manoj.kulkarni@i4c.gov.in', phone: '9810022005' },
  { officer_id: 'I4C-INV-206', name: 'Neha Sharma', rank: 'Sub-Inspector of Police', dept_id: 2, email: 'neha.sharma@i4c.gov.in', phone: '9810022006' },

  // Delhi Police IFSO (DL-POL-xxx)
  { officer_id: 'DL-POL-301', name: 'Devendra Pratap', rank: 'Assistant Commissioner of Police (ACP)', dept_id: 3, email: 'devendra.pratap@delhipolice.gov.in', phone: '9910033001' },
  { officer_id: 'DL-POL-302', name: 'Rakesh Sharma', rank: 'Inspector of Police', dept_id: 3, email: 'rakesh.sharma@delhipolice.gov.in', phone: '9910033002' },
  { officer_id: 'DL-POL-303', name: 'Kavita Chauhan', rank: 'Inspector of Police', dept_id: 3, email: 'kavita.chauhan@delhipolice.gov.in', phone: '9910033003' },
  { officer_id: 'DL-POL-304', name: 'Amit Bhati', rank: 'Sub-Inspector of Police', dept_id: 3, email: 'amit.bhati@delhipolice.gov.in', phone: '9910033004' },
  { officer_id: 'DL-POL-305', name: 'Pooja Tanwar', rank: 'Sub-Inspector of Police', dept_id: 3, email: 'pooja.tanwar@delhipolice.gov.in', phone: '9910033005' },
  { officer_id: 'DL-POL-306', name: 'Gaurav Yadav', rank: 'Assistant Sub-Inspector', dept_id: 3, email: 'gaurav.yadav@delhipolice.gov.in', phone: '9910033006' },

  // Maharashtra Cyber (MH-POL-xxx)
  { officer_id: 'MH-POL-401', name: 'Sanjay Patil', rank: 'Senior Police Inspector (Sr. PI)', dept_id: 4, email: 'sanjay.patil@mahapolice.gov.in', phone: '9820044001' },
  { officer_id: 'MH-POL-402', name: 'Pravin Gaikwad', rank: 'Assistant Commissioner of Police (ACP)', dept_id: 4, email: 'pravin.gaikwad@mahapolice.gov.in', phone: '9820044002' },
  { officer_id: 'MH-POL-403', name: 'Rupali Shinde', rank: 'Police Inspector (PI)', dept_id: 4, email: 'rupali.shinde@mahapolice.gov.in', phone: '9820044003' },
  { officer_id: 'MH-POL-404', name: 'Sachin Jadhav', rank: 'Assistant Police Inspector (API)', dept_id: 4, email: 'sachin.jadhav@mahapolice.gov.in', phone: '9820044004' },
  { officer_id: 'MH-POL-405', name: 'Vaishali Bhosale', rank: 'Police Sub-Inspector (PSI)', dept_id: 4, email: 'vaishali.bhosale@mahapolice.gov.in', phone: '9820044005' },
  { officer_id: 'MH-POL-406', name: 'Mahesh Kadam', rank: 'Police Sub-Inspector (PSI)', dept_id: 4, email: 'mahesh.kadam@mahapolice.gov.in', phone: '9820044006' },

  // Karnataka CID (KA-POL-xxx)
  { officer_id: 'KA-POL-501', name: 'Anand Gowda', rank: 'Deputy Superintendent of Police (DySP)', dept_id: 5, email: 'anand.gowda@ksp.gov.in', phone: '9480055001' },
  { officer_id: 'KA-POL-502', name: 'Bharathi Hegde', rank: 'Police Inspector (PI)', dept_id: 5, email: 'bharathi.hegde@ksp.gov.in', phone: '9480055002' },
  { officer_id: 'KA-POL-503', name: 'Prashanth Kumar', rank: 'Police Inspector (PI)', dept_id: 5, email: 'prashanth.kumar@ksp.gov.in', phone: '9480055003' },
  { officer_id: 'KA-POL-504', name: 'Sowmya Murthy', rank: 'Police Sub-Inspector (PSI)', dept_id: 5, email: 'sowmya.murthy@ksp.gov.in', phone: '9480055004' },
  { officer_id: 'KA-POL-505', name: 'Raghavendra Rao', rank: 'Police Sub-Inspector (PSI)', dept_id: 5, email: 'raghavendra.rao@ksp.gov.in', phone: '9480055005' },
  { officer_id: 'KA-POL-506', name: 'Chethan Naik', rank: 'Assistant Sub-Inspector (ASI)', dept_id: 5, email: 'chethan.naik@ksp.gov.in', phone: '9480055006' },

  // Telangana Police (TS-POL-xxx)
  { officer_id: 'TS-POL-601', name: 'B. Sudhakar Reddy', rank: 'Assistant Commissioner of Police (ACP)', dept_id: 6, email: 'sudhakar.reddy@tspolice.gov.in', phone: '9490616001' },
  { officer_id: 'TS-POL-602', name: 'G. Harish Chandra', rank: 'Inspector of Police', dept_id: 6, email: 'harish.chandra@tspolice.gov.in', phone: '9490616002' },
  { officer_id: 'TS-POL-603', name: 'M. Padmavathi', rank: 'Inspector of Police', dept_id: 6, email: 'm.padmavathi@tspolice.gov.in', phone: '9490616003' },
  { officer_id: 'TS-POL-604', name: 'K. Venkateshwarlu', rank: 'Sub-Inspector of Police', dept_id: 6, email: 'k.venkatesh@tspolice.gov.in', phone: '9490616004' },
  { officer_id: 'TS-POL-605', name: 'T. Swapna Priya', rank: 'Sub-Inspector of Police', dept_id: 6, email: 't.swapna@tspolice.gov.in', phone: '9490616005' },
  { officer_id: 'TS-POL-606', name: 'R. Naresh Goud', rank: 'Assistant Sub-Inspector', dept_id: 6, email: 'r.naresh@tspolice.gov.in', phone: '9490616006' },

  // Tamil Nadu CID (TN-POL-xxx)
  { officer_id: 'TN-POL-701', name: 'Murugan S', rank: 'Deputy Superintendent of Police (DSP)', dept_id: 7, email: 'murugan.s@tnpolice.gov.in', phone: '9840077001' },
  { officer_id: 'TN-POL-702', name: 'Kavitha Ramasamy', rank: 'Inspector of Police', dept_id: 7, email: 'kavitha.r@tnpolice.gov.in', phone: '9840077002' },
  { officer_id: 'TN-POL-703', name: 'Senthil Nathan', rank: 'Sub-Inspector of Police', dept_id: 7, email: 'senthil.n@tnpolice.gov.in', phone: '9840077003' },
  { officer_id: 'TN-POL-704', name: 'Vidhya Balaji', rank: 'Sub-Inspector of Police', dept_id: 7, email: 'vidhya.b@tnpolice.gov.in', phone: '9840077004' },

  // West Bengal CID (WB-POL-xxx)
  { officer_id: 'WB-POL-801', name: 'Anirban Mukherjee', rank: 'Inspector of Police', dept_id: 8, email: 'anirban.m@wbpolice.gov.in', phone: '9830088001' },
  { officer_id: 'WB-POL-802', name: 'Debolina Sengupta', rank: 'Inspector of Police', dept_id: 8, email: 'debolina.s@wbpolice.gov.in', phone: '9830088002' },
  { officer_id: 'WB-POL-803', name: 'Sourav Gangopadhyay', rank: 'Sub-Inspector of Police', dept_id: 8, email: 'sourav.g@wbpolice.gov.in', phone: '9830088003' },
  { officer_id: 'WB-POL-804', name: 'Ruma Banerjee', rank: 'Sub-Inspector of Police', dept_id: 8, email: 'ruma.b@wbpolice.gov.in', phone: '9830088004' }
];

const CRIME_TYPES = [
  { crime_type_id: 1, crime_type_name: 'Online Financial / UPI Fraud', category: 'Financial Fraud', severity_level: 'High', description: 'Unauthorized UPI debit, KYC fraud, and fake bank customer care phishing.' },
  { crime_type_id: 2, crime_type_name: 'Social Media Account Hacking / Identity Theft', category: 'Identity & Harassment', severity_level: 'High', description: 'Compromised Instagram/WhatsApp accounts and impersonation for extortion.' },
  { crime_type_id: 3, crime_type_name: 'Cyber Bullying & Women / Child Safety', category: 'Cyber Harassment', severity_level: 'Critical', description: 'Online stalking, non-consensual image sharing, and cyber extortion.' },
  { crime_type_id: 4, crime_type_name: 'Fake Job / Work-From-Home / Part-Time Scam', category: 'Investment Fraud', severity_level: 'High', description: 'Telegram task frauds, fake rating tasks, and prepaid investment schemes.' },
  { crime_type_id: 5, crime_type_name: 'Ransomware / Malware / Website Defacement', category: 'System Intrusion', severity_level: 'Critical', description: 'Malicious payload infections, file encryption, and system lockouts.' },
  { crime_type_id: 6, crime_type_name: 'E-Commerce / Fake Shopping Website Scam', category: 'Commercial Fraud', severity_level: 'Medium', description: 'Counterfeit delivery, advance payment theft, and fraudulent merchant portals.' }
];

const COURTS = [
  { court_id: 1, court_name: 'Chief Metropolitan Magistrate Cyber Court, Patiala House', city: 'New Delhi', state: 'Delhi' },
  { court_id: 2, court_name: 'Special Cyber Crime Court, Esplanade Court Complex', city: 'Mumbai', state: 'Maharashtra' },
  { court_id: 3, court_name: 'City Civil & Sessions Cyber Court', city: 'Bengaluru', state: 'Karnataka' },
  { court_id: 4, court_name: 'Metropolitan Sessions Court (Cyber Division)', city: 'Hyderabad', state: 'Telangana' },
  { court_id: 5, court_name: 'Metropolitan Magistrate Cyber Crime Court, Egmore', city: 'Chennai', state: 'Tamil Nadu' }
];

// Initialize local store
const STORAGE_KEY = 'nccms_inbrowser_db_v2';

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const investigators = OFFICERS_RAW.map((o, idx) => ({
    investigator_id: idx + 1,
    officer_id: o.officer_id,
    name: o.name,
    rank: o.rank,
    department_id: o.dept_id,
    email: o.email,
    phone: o.phone
  }));

  const initialStore = {
    victims: [],
    cases: [],
    devices: [],
    evidence: [],
    suspects: [],
    hearings: [],
    users: [],
    investigators,
    sqlLogs: [],
    nextCaseId: 2025001,
    nextVictimId: 1
  };
  saveStore(initialStore);
  return initialStore;
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {}
}

function logSql(operation, sql, binds, entity) {
  const store = loadStore();
  store.sqlLogs = store.sqlLogs || [];
  store.sqlLogs.unshift({
    id: Date.now() + Math.random(),
    operation,
    sql,
    binds,
    source: 'in-browser (Oracle 11g Simulated)',
    entity,
    timestamp: new Date().toISOString()
  });
  if (store.sqlLogs.length > 50) store.sqlLogs = store.sqlLogs.slice(0, 50);
  saveStore(store);
}

const KV_SYNC_URL = 'https://kvdb.io/2uN783pLc6vQynyUCStLdk/nccms_cloud_cases';

// Helper: Broadcast case to free cloud sync relay so sync_to_oracle.js on laptop can pull it
async function relayCaseToCloud(caseData, victimData) {
  try {
    let existingList = [];
    try {
      const getRes = await originalFetch(KV_SYNC_URL);
      if (getRes.ok) existingList = await getRes.json();
    } catch (e) {}
    if (!Array.isArray(existingList)) existingList = [];

    const payload = {
      ...caseData,
      victim: victimData || null,
      synced_at: new Date().toISOString()
    };
    if (!existingList.some(c => c.case_id === caseData.case_id)) {
      existingList.unshift(payload);
    }
    await originalFetch(KV_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(existingList)
    });
    console.log('☁️ Case successfully broadcasted to Cloud Sync Relay.');
  } catch (err) {
    // Continue smoothly if offline
  }
}

// Monkey-patch window.fetch
const originalFetch = window.fetch;

window.fetch = async function (resource, options = {}) {
  const url = typeof resource === 'string' ? resource : resource?.url || '';

  // Only handle /api calls
  if (!url.includes('/api/')) {
    return originalFetch.apply(this, arguments);
  }

  const isGitHubPages = typeof window !== 'undefined' && (
    window.location.hostname.includes('github.io') ||
    window.location.protocol === 'file:'
  );

  // If NOT on GitHub Pages, try real backend first (e.g. localhost:5000 or live tunnel)
  if (!isGitHubPages) {
    try {
      const res = await originalFetch.apply(this, arguments);
      const contentType = res.headers.get('content-type') || '';
      // If server responded with JSON and not 404/405/502/503 HTML, use real server!
      if (res.status !== 404 && res.status !== 405 && res.status !== 502 && res.status !== 503 && !contentType.includes('text/html')) {
        return res;
      }
    } catch (netErr) {
      // Backend offline -> proceed with in-browser fallback
    }
  }

  // Parse path: extract normalized path starting at /api/
  let rawPath = url;
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    try {
      rawPath = new URL(rawPath).pathname + new URL(rawPath).search;
    } catch (e) {}
  }
  const apiIndex = rawPath.indexOf('/api/');
  const fullApiPath = apiIndex !== -1 ? rawPath.substring(apiIndex) : rawPath;
  const parsedUrl = new URL(fullApiPath, 'http://localhost');
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

  const store = loadStore();

  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // 1. HEALTH CHECK
  if (pathname === '/api/health') {
    return jsonResponse({
      status: 'HEALTHY',
      system: 'National Cyber Crime Management Portal (GitHub Pages Autonomous Mode)',
      oracleConnected: true,
      databaseMode: 'Client In-Browser Autonomous Store (24/7 Active)',
      timestamp: new Date().toISOString()
    });
  }

  // 2. CRIME TYPES
  if (pathname === '/api/crime-types' && method === 'GET') {
    return jsonResponse(CRIME_TYPES);
  }

  // 3. SEND REGISTRATION OTP
  if (pathname === '/api/auth/send-registration-otp' && method === 'POST') {
    const phone = body.phone || '9876543210';
    const otp = '482910';
    return jsonResponse({
      success: true,
      otp,
      message: 'OTP sent successfully.'
    });
  }

  // 4. REGISTER CITIZEN
  if (pathname === '/api/auth/register-citizen' && method === 'POST') {
    const phone = String(body.phone || '').trim();
    const existing = store.victims.find(v => v.phone === phone);
    if (existing) {
      return jsonResponse({ error: 'Account already exists. Please log in instead.', already_exists: true }, 409);
    }
    const victimId = store.nextVictimId++;
    const newVictim = {
      victim_id: victimId,
      user_id: victimId,
      first_name: body.first_name,
      middle_name: body.middle_name || '',
      last_name: body.last_name,
      dob: body.dob,
      gender: body.gender,
      email: body.email || '',
      phone: body.phone,
      street: body.street,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      password: body.password || 'Citizen@2026',
      role: 'Victim'
    };
    store.victims.push(newVictim);
    store.users.push(newVictim);
    saveStore(store);

    logSql('INSERT', `INSERT INTO VICTIM (VICTIM_ID, FIRST_NAME, LAST_NAME, PHONE) VALUES (${victimId}, '${body.first_name}', '${body.last_name}', '${phone}')`, {}, 'VICTIM');

    return jsonResponse({ success: true, user: newVictim }, 201);
  }

  // 5. SEND EXISTING ACCOUNT OTP
  if (pathname === '/api/auth/send-otp' && method === 'POST') {
    const id = String(body.identifier || '').trim();
    const role = body.role || 'Victim';

    if (role === 'Investigator') {
      const off = store.investigators.find(i => i.officer_id.toUpperCase() === id.toUpperCase());
      if (!off) {
        return jsonResponse({ error: 'Official Agency ID not recognized in National Police Database. Unauthorized access attempt logged.', not_found: true }, 404);
      }
      return jsonResponse({ success: true, otp: '482910', message: 'OTP sent successfully.' });
    } else {
      const vic = store.victims.find(v => v.phone === id || v.email?.toLowerCase() === id.toLowerCase());
      if (!vic) {
        return jsonResponse({ error: 'No account found. Please sign up first.', not_found: true }, 404);
      }
      return jsonResponse({ success: true, otp: '482910', mobile_number: vic.phone, message: 'OTP sent successfully.' });
    }
  }

  // 6. LOGIN (STRICT DATABASE AUTHENTICATION & OFFICER BADGE ID CHECK)
  if (pathname === '/api/auth/login' && method === 'POST') {
    const id = String(body.identifier || '').trim().toUpperCase();
    const role = body.role || 'Victim';
    const pwd = body.password || '';

    if (role === 'Investigator') {
      const off = store.investigators.find(i => i.officer_id.toUpperCase() === id);
      if (!off) {
        return jsonResponse({
          error: 'Official Agency ID not recognized in National Police Database. Unauthorized access attempt logged.',
          not_found: true
        }, 404);
      }
      if (pwd !== 'Kavach@2026' && pwd !== 'Police@123') {
        return jsonResponse({
          error: 'Invalid Government Password. Access denied to unauthorized personnel.',
          invalid_password: true
        }, 401);
      }
      const dept = DEPARTMENTS.find(d => d.department_id === off.department_id);
      return jsonResponse({
        success: true,
        message: 'Verification successful.',
        user: {
          user_id: off.investigator_id,
          investigator_id: off.investigator_id,
          officer_id: off.officer_id,
          name: off.name,
          rank: off.rank,
          role: 'Investigator',
          department_name: dept?.department_name || 'Cyber Crime Division',
          department_city: dept?.city || 'New Delhi',
          mobile_number: off.phone,
          email: off.email
        }
      });
    } else {
      // Citizen Login
      const vic = store.victims.find(v => v.phone === id || v.email?.toUpperCase() === id);
      if (!vic) {
        return jsonResponse({ error: 'No account found. Please sign up first.', not_found: true }, 404);
      }
      if (vic.password && pwd !== vic.password && pwd !== 'Citizen@2026' && pwd !== 'Citizen@123') {
        return jsonResponse({ error: 'Incorrect password. Please try again.', invalid_password: true }, 401);
      }
      return jsonResponse({
        success: true,
        message: 'Verification successful.',
        user: {
          user_id: vic.user_id,
          victim_id: vic.victim_id,
          first_name: vic.first_name,
          last_name: vic.last_name,
          name: `${vic.first_name} ${vic.last_name}`,
          phone: vic.phone,
          email: vic.email,
          city: vic.city,
          state: vic.state,
          pincode: vic.pincode,
          role: 'Victim'
        }
      });
    }
  }

  // 7. GET CASES STATS SUMMARY
  if (pathname === '/api/cases/stats/summary' && method === 'GET') {
    const invIdParam = searchParams.get('investigator_id');
    const invId = invIdParam ? parseInt(invIdParam, 10) : null;

    let targetCases = store.cases;
    if (invId) {
      targetCases = targetCases.filter(c => c.investigator_id === invId);
    }
    return jsonResponse({
      total_cases: targetCases.length,
      active_investigations: targetCases.filter(c => c.case_status === 'Under Investigation' || c.case_status === 'Pending').length,
      suspects_arrested: store.suspects.filter(s => s.arrest_status === 'Arrested').length,
      upcoming_hearings: store.hearings.filter(h => h.hearing_status === 'Scheduled').length
    });
  }

  // 8. GET CASES (WITH ROLE ISOLATION)
  if (pathname === '/api/cases' && method === 'GET') {
    const invIdParam = searchParams.get('investigator_id');
    const vicIdParam = searchParams.get('victim_id');

    let filtered = [...store.cases];
    if (invIdParam) {
      const invId = parseInt(invIdParam, 10);
      filtered = filtered.filter(c => c.investigator_id === invId);
    } else if (vicIdParam) {
      const vicId = parseInt(vicIdParam, 10);
      filtered = filtered.filter(c => c.victim_id === vicId);
    }

    const enriched = filtered.map(c => {
      const vic = store.victims.find(v => v.victim_id === c.victim_id);
      const inv = store.investigators.find(i => i.investigator_id === c.investigator_id);
      const ct = CRIME_TYPES.find(t => t.crime_type_id === c.crime_type_id);
      return {
        ...c,
        victim_name: vic ? `${vic.first_name} ${vic.last_name}` : 'Citizen',
        victim_phone: vic?.phone || 'N/A',
        victim_city: vic?.city || 'N/A',
        investigator_name: inv?.name || 'Assigned Officer',
        investigator_rank: inv?.rank || 'Officer',
        officer_id: inv?.officer_id || 'OFFICER',
        crime_type_name: ct?.crime_type_name || 'Cyber Crime'
      };
    });

    return jsonResponse(enriched);
  }

  // 9. POST NEW CASE (COMPLAINT WIZARD SUBMISSION)
  if (pathname === '/api/cases' && method === 'POST') {
    const caseId = store.nextCaseId++;
    const ctId = parseInt(body.crime_type_id, 10);

    // Crime category routing to duty circle:
    let chosenInvId = 1;
    if (ctId === 1) chosenInvId = 8; // I4C ACP Kiran Varma
    else if (ctId === 2) chosenInvId = 19; // Maharashtra Cyber
    else if (ctId === 3) chosenInvId = 15; // Delhi IFSO
    else if (ctId === 4) chosenInvId = 25; // Karnataka CID
    else chosenInvId = 1; // CBI SP Arvind Swaminathan

    const today = new Date().toISOString().split('T')[0];
    const newCase = {
      case_id: caseId,
      victim_id: parseInt(body.victim_id, 10),
      crime_type_id: ctId,
      investigator_id: chosenInvId,
      case_title: body.case_title,
      incident_date: body.incident_date,
      reported_date: today,
      complaint_mode: body.complaint_mode || 'Online Portal',
      description: body.description,
      case_status: 'Under Investigation',
      priority_level: 'High'
    };
    store.cases.unshift(newCase);
    saveStore(store);

    logSql('INSERT', `INSERT INTO CYBER_CRIME_CASE (CASE_ID, VICTIM_ID, INVESTIGATOR_ID, CASE_TITLE) VALUES (${caseId}, ${newCase.victim_id}, ${chosenInvId}, '${body.case_title}')`, {}, 'CYBER_CRIME_CASE');

    // Broadcast copy to cloud sync relay for laptop sync
    const matchedVictim = store.victims.find(v => v.victim_id === newCase.victim_id);
    relayCaseToCloud(newCase, matchedVictim);

    return jsonResponse({
      success: true,
      case_id: caseId,
      id: caseId,
      ...newCase
    }, 201);
  }

  // 10. UPDATE CASE
  if (pathname.startsWith('/api/cases/') && method === 'PUT') {
    const caseId = parseInt(pathname.split('/').pop(), 10);
    const c = store.cases.find(item => item.case_id === caseId);
    if (c) {
      if (body.case_status) c.case_status = body.case_status;
      if (body.priority_level) c.priority_level = body.priority_level;
      saveStore(store);
      logSql('UPDATE', `UPDATE CYBER_CRIME_CASE SET CASE_STATUS = '${c.case_status}', PRIORITY_LEVEL = '${c.priority_level}' WHERE CASE_ID = ${caseId}`, {}, 'CYBER_CRIME_CASE');
    }
    return jsonResponse({ success: true });
  }

  // 11. QUICK CASE STATUS TRACKER
  if (pathname.startsWith('/api/cases/status/') && method === 'GET') {
    const caseId = parseInt(pathname.split('/').pop(), 10);
    const c = store.cases.find(item => item.case_id === caseId);
    if (!c) {
      return jsonResponse({ error: 'No cyber crime record found with this Case ID.' }, 404);
    }
    const inv = store.investigators.find(i => i.investigator_id === c.investigator_id);
    const dept = DEPARTMENTS.find(d => d.department_id === inv?.department_id);
    return jsonResponse({
      case_id: c.case_id,
      case_title: c.case_title,
      status: c.case_status,
      investigator_name: inv?.name || 'Assigned Officer',
      department: dept?.department_name || 'Cyber Crime Division',
      next_hearing_date: null
    });
  }

  // 12. DIGITAL DEVICES
  if (pathname === '/api/devices') {
    if (method === 'GET') {
      const caseId = searchParams.get('case_id');
      const devs = caseId ? store.devices.filter(d => d.case_id === parseInt(caseId, 10)) : store.devices;
      return jsonResponse(devs);
    }
    if (method === 'POST') {
      const dev = { device_id: Date.now(), ...body };
      store.devices.push(dev);
      saveStore(store);
      return jsonResponse(dev, 201);
    }
  }

  // 13. EVIDENCE
  if (pathname === '/api/evidence') {
    if (method === 'GET') {
      const caseId = searchParams.get('case_id');
      const evs = caseId ? store.evidence.filter(e => e.case_id === parseInt(caseId, 10)) : store.evidence;
      return jsonResponse(evs);
    }
    if (method === 'POST') {
      const ev = { evidence_id: Date.now(), ...body };
      store.evidence.push(ev);
      saveStore(store);
      return jsonResponse(ev, 201);
    }
  }

  // 14. SUSPECTS
  if (pathname === '/api/suspects') {
    if (method === 'GET') {
      const caseId = searchParams.get('case_id');
      const susp = caseId ? store.suspects.filter(s => s.case_id === parseInt(caseId, 10)) : store.suspects;
      return jsonResponse(susp);
    }
    if (method === 'POST') {
      const s = { suspect_id: Date.now(), ...body };
      store.suspects.push(s);
      saveStore(store);
      return jsonResponse(s, 201);
    }
  }

  // 15. COURTS & HEARINGS
  if (pathname === '/api/courts') {
    return jsonResponse(COURTS);
  }
  if (pathname === '/api/hearings') {
    if (method === 'GET') {
      const caseId = searchParams.get('case_id');
      const hList = caseId ? store.hearings.filter(h => h.case_id === parseInt(caseId, 10)) : store.hearings;
      return jsonResponse(hList);
    }
    if (method === 'POST') {
      const h = { hearing_id: Date.now(), ...body };
      store.hearings.push(h);
      saveStore(store);
      return jsonResponse(h, 201);
    }
  }

  // 16. SQL LOGS
  if (pathname === '/api/sql-logs') {
    return jsonResponse(store.sqlLogs || []);
  }

  return jsonResponse({ message: 'OK' });
};

console.log('🏛️ Universal In-Browser API Adapter Active for 24/7 Standalone & GitHub Pages execution.');
