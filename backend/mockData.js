// mockData.js - Clean Production State with 44 Official Indian Investigators
// National Cyber Crime Reporting & Management Portal
const crypto = require('crypto');

function hashPwd(p, salt) {
  return crypto.pbkdf2Sync(p, salt, 10000, 64, 'sha512').toString('hex');
}

const DEFAULT_SALT = 'e5a8829f0012bc45df89123049182374';
const DEFAULT_HASH = hashPwd('Kavach@2026', DEFAULT_SALT);

const otpPool = [
  { pool_id: 1, otp_code: '482910', assigned_mobile: null, status: 'AVAILABLE', assigned_at: null },
  { pool_id: 2, otp_code: '739204', assigned_mobile: null, status: 'AVAILABLE', assigned_at: null },
  { pool_id: 3, otp_code: '591827', assigned_mobile: null, status: 'AVAILABLE', assigned_at: null },
  { pool_id: 4, otp_code: '846291', assigned_mobile: null, status: 'AVAILABLE', assigned_at: null },
  { pool_id: 5, otp_code: '309482', assigned_mobile: null, status: 'AVAILABLE', assigned_at: null }
];

const victims = [];
const cases = [];
const devices = [];
const evidence = [];
const hearings = [];

const policeDepartments = [
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
  // CBI Cyber Crime Division (Agency ID: CBI-CYB-xxx)
  { officer_id: 'CBI-CYB-101', name: 'Arvind Swaminathan', rank: 'Superintendent of Police (SP)', dept_id: 1, email: 'a.swaminathan@cbi.gov.in', phone: '9444011001' },
  { officer_id: 'CBI-CYB-102', name: 'Rajeshwari Nair', rank: 'Deputy Superintendent of Police (DySP)', dept_id: 1, email: 'r.nair@cbi.gov.in', phone: '9444011002' },
  { officer_id: 'CBI-CYB-103', name: 'Vikramaditya Singh', rank: 'Inspector of Police', dept_id: 1, email: 'v.singh@cbi.gov.in', phone: '9444011003' },
  { officer_id: 'CBI-CYB-104', name: 'Ananya Deshmukh', rank: 'Inspector of Police', dept_id: 1, email: 'a.deshmukh@cbi.gov.in', phone: '9444011004' },
  { officer_id: 'CBI-CYB-105', name: 'Tarun Mehra', rank: 'Sub-Inspector of Police', dept_id: 1, email: 't.mehra@cbi.gov.in', phone: '9444011005' },
  { officer_id: 'CBI-CYB-106', name: 'Shreya Iyer', rank: 'Sub-Inspector of Police', dept_id: 1, email: 's.iyer@cbi.gov.in', phone: '9444011006' },

  // I4C (Agency ID: I4C-INV-xxx)
  { officer_id: 'I4C-INV-201', name: 'Shanmukha Rao', rank: 'Joint Director (IPS)', dept_id: 2, email: 'shanmukha.rao@i4c.gov.in', phone: '9810022001' },
  { officer_id: 'I4C-INV-202', name: 'Kiran Varma', rank: 'Assistant Commissioner of Police (ACP)', dept_id: 2, email: 'kiran.varma@i4c.gov.in', phone: '9810022002' },
  { officer_id: 'I4C-INV-203', name: 'Sai Dheepak', rank: 'Senior Cyber Forensic Analyst', dept_id: 2, email: 'sai.dheepak@i4c.gov.in', phone: '9810022003' },
  { officer_id: 'I4C-INV-204', name: 'Deepa Sundaram', rank: 'Inspector of Police', dept_id: 2, email: 'deepa.sundaram@i4c.gov.in', phone: '9810022004' },
  { officer_id: 'I4C-INV-205', name: 'Manoj Kulkarni', rank: 'Sub-Inspector of Police', dept_id: 2, email: 'manoj.kulkarni@i4c.gov.in', phone: '9810022005' },
  { officer_id: 'I4C-INV-206', name: 'Neha Sharma', rank: 'Sub-Inspector of Police', dept_id: 2, email: 'neha.sharma@i4c.gov.in', phone: '9810022006' },

  // Delhi Police IFSO (Agency ID: DL-POL-xxx)
  { officer_id: 'DL-POL-301', name: 'Devendra Pratap', rank: 'Assistant Commissioner of Police (ACP)', dept_id: 3, email: 'devendra.pratap@delhipolice.gov.in', phone: '9910033001' },
  { officer_id: 'DL-POL-302', name: 'Rakesh Sharma', rank: 'Inspector of Police', dept_id: 3, email: 'rakesh.sharma@delhipolice.gov.in', phone: '9910033002' },
  { officer_id: 'DL-POL-303', name: 'Kavita Chauhan', rank: 'Inspector of Police', dept_id: 3, email: 'kavita.chauhan@delhipolice.gov.in', phone: '9910033003' },
  { officer_id: 'DL-POL-304', name: 'Amit Bhati', rank: 'Sub-Inspector of Police', dept_id: 3, email: 'amit.bhati@delhipolice.gov.in', phone: '9910033004' },
  { officer_id: 'DL-POL-305', name: 'Pooja Tanwar', rank: 'Sub-Inspector of Police', dept_id: 3, email: 'pooja.tanwar@delhipolice.gov.in', phone: '9910033005' },
  { officer_id: 'DL-POL-306', name: 'Gaurav Yadav', rank: 'Assistant Sub-Inspector', dept_id: 3, email: 'gaurav.yadav@delhipolice.gov.in', phone: '9910033006' },

  // Maharashtra Cyber (Agency ID: MH-POL-xxx)
  { officer_id: 'MH-POL-401', name: 'Sanjay Patil', rank: 'Senior Police Inspector (Sr. PI)', dept_id: 4, email: 'sanjay.patil@mahapolice.gov.in', phone: '9820044001' },
  { officer_id: 'MH-POL-402', name: 'Datta Chavan', rank: 'Police Inspector (PI)', dept_id: 4, email: 'datta.chavan@mahapolice.gov.in', phone: '9820044002' },
  { officer_id: 'MH-POL-403', name: 'Kavita Jadhav', rank: 'Assistant Police Inspector (API)', dept_id: 4, email: 'kavita.jadhav@mahapolice.gov.in', phone: '9820044003' },
  { officer_id: 'MH-POL-404', name: 'Nitin Shinde', rank: 'Police Sub-Inspector (PSI)', dept_id: 4, email: 'nitin.shinde@mahapolice.gov.in', phone: '9820044004' },
  { officer_id: 'MH-POL-405', name: 'Swati Kadam', rank: 'Police Sub-Inspector (PSI)', dept_id: 4, email: 'swati.kadam@mahapolice.gov.in', phone: '9820044005' },
  { officer_id: 'MH-POL-406', name: 'Sachin Gaikwad', rank: 'Assistant Police Inspector (API)', dept_id: 4, email: 'sachin.gaikwad@mahapolice.gov.in', phone: '9820044006' },

  // Karnataka Police CID (Agency ID: KA-POL-xxx)
  { officer_id: 'KA-POL-501', name: 'Anand Gowda', rank: 'Deputy Superintendent of Police (DySP)', dept_id: 5, email: 'anand.gowda@ksp.gov.in', phone: '9480805001' },
  { officer_id: 'KA-POL-502', name: 'Roopa Manjunath', rank: 'Police Inspector (PI)', dept_id: 5, email: 'roopa.manjunath@ksp.gov.in', phone: '9480805002' },
  { officer_id: 'KA-POL-503', name: 'Chethan Kumar', rank: 'Police Inspector (PI)', dept_id: 5, email: 'chethan.kumar@ksp.gov.in', phone: '9480805003' },
  { officer_id: 'KA-POL-504', name: 'Harish Nayak', rank: 'Police Sub-Inspector (PSI)', dept_id: 5, email: 'harish.nayak@ksp.gov.in', phone: '9480805004' },
  { officer_id: 'KA-POL-505', name: 'Divya Hegde', rank: 'Police Sub-Inspector (PSI)', dept_id: 5, email: 'divya.hegde@ksp.gov.in', phone: '9480805005' },

  // Telangana Police (Agency ID: TS-POL-xxx)
  { officer_id: 'TS-POL-601', name: 'Srikanth Reddy', rank: 'Assistant Commissioner of Police (ACP)', dept_id: 6, email: 'srikanth.reddy@tspolice.gov.in', phone: '9490616001' },
  { officer_id: 'TS-POL-602', name: 'Madhava Rao', rank: 'Inspector of Police', dept_id: 6, email: 'madhava.rao@tspolice.gov.in', phone: '9490616002' },
  { officer_id: 'TS-POL-603', name: 'Lavanya Goud', rank: 'Inspector of Police', dept_id: 6, email: 'lavanya.goud@tspolice.gov.in', phone: '9490616003' },
  { officer_id: 'TS-POL-604', name: 'Venkatesh Naidu', rank: 'Sub-Inspector of Police', dept_id: 6, email: 'venkatesh.naidu@tspolice.gov.in', phone: '9490616004' },
  { officer_id: 'TS-POL-605', name: 'Bhavani Prasad', rank: 'Sub-Inspector of Police', dept_id: 6, email: 'bhavani.prasad@tspolice.gov.in', phone: '9490616005' },

  // Tamil Nadu Police (Agency ID: TN-POL-xxx)
  { officer_id: 'TN-POL-701', name: 'S. Muthuswamy', rank: 'Additional SP (Cyber Crime)', dept_id: 7, email: 'muthuswamy.s@tnpolice.gov.in', phone: '9445497001' },
  { officer_id: 'TN-POL-702', name: 'Karthikeyan Balan', rank: 'Inspector of Police', dept_id: 7, email: 'karthikeyan.b@tnpolice.gov.in', phone: '9445497002' },
  { officer_id: 'TN-POL-703', name: 'Meenakshi Sundaram', rank: 'Inspector of Police', dept_id: 7, email: 'meenakshi.s@tnpolice.gov.in', phone: '9445497003' },
  { officer_id: 'TN-POL-704', name: 'Senthil Kumar', rank: 'Sub-Inspector of Police', dept_id: 7, email: 'senthil.k@tnpolice.gov.in', phone: '9445497004' },
  { officer_id: 'TN-POL-705', name: 'Revathi Rajan', rank: 'Sub-Inspector of Police', dept_id: 7, email: 'revathi.r@tnpolice.gov.in', phone: '9445497005' },

  // West Bengal Police (Agency ID: WB-POL-xxx)
  { officer_id: 'WB-POL-801', name: 'Sourav Banerjee', rank: 'Deputy Superintendent of Police (DySP)', dept_id: 8, email: 'sourav.banerjee@wbpolice.gov.in', phone: '9830808001' },
  { officer_id: 'WB-POL-802', name: 'Debojyoti Roy', rank: 'Inspector of Police', dept_id: 8, email: 'debojyoti.roy@wbpolice.gov.in', phone: '9830808002' },
  { officer_id: 'WB-POL-803', name: 'Piyali Ganguly', rank: 'Inspector of Police', dept_id: 8, email: 'piyali.ganguly@wbpolice.gov.in', phone: '9830808003' },
  { officer_id: 'WB-POL-804', name: 'Anirban Ghosh', rank: 'Sub-Inspector of Police', dept_id: 8, email: 'anirban.ghosh@wbpolice.gov.in', phone: '9830808004' },
  { officer_id: 'WB-POL-805', name: 'Rituparna Sen', rank: 'Sub-Inspector of Police', dept_id: 8, email: 'rituparna.sen@wbpolice.gov.in', phone: '9830808005' }
];

const loginUsers = OFFICERS_RAW.map((o, idx) => ({
  user_id: 100 + (idx + 1),
  mobile_number: o.phone,
  officer_id: o.officer_id,
  email: o.email,
  role: 'Investigator',
  password_hash: DEFAULT_HASH,
  password_salt: DEFAULT_SALT,
  otp_verified: 'YES',
  created_at: new Date()
}));

const investigators = OFFICERS_RAW.map((o, idx) => ({
  investigator_id: idx + 1,
  user_id: 100 + (idx + 1),
  department_id: o.dept_id,
  officer_id: o.officer_id,
  name: o.name,
  rank: o.rank,
  email: o.email,
  phone: o.phone
}));

const crimeTypes = [
  { crime_type_id: 1, crime_type_name: 'Online Financial / UPI Fraud', category: 'Financial Crime', severity_level: 'High', description: 'Unauthorized money deduction via UPI, Debit/Credit Card, or phishing links' },
  { crime_type_id: 2, crime_type_name: 'Social Media Account Hacking / Impersonation', category: 'Identity Crime', severity_level: 'Medium', description: 'Fake profile creation, account takeover, or morphed photo misuse' },
  { crime_type_id: 3, crime_type_name: 'Cyber Bullying / Women & Child Harassment', category: 'Harassment', severity_level: 'High', description: 'Online threats, stalking, defamation, or blackmail' },
  { crime_type_id: 4, crime_type_name: 'Online Job / Investment Scam', category: 'Cheating', severity_level: 'High', description: 'Fraudulent part-time job offers, task scams, or fake trading apps' }
];

const courts = [
  { court_id: 1, court_name: 'Special Cyber Crime Sessions Court', court_type: 'Sessions Court', location: 'District Court Complex', contact_no: '011-23384521' }
];

const suspects = [];

module.exports = {
  otpPool,
  loginUsers,
  victims,
  policeDepartments,
  investigators,
  crimeTypes,
  cases,
  devices,
  evidence,
  suspects,
  courts,
  hearings
};
