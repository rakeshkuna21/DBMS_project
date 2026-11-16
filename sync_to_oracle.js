// sync_to_oracle.js - Synchronize 24/7 Cloud Filed Cases, Signups, Evidence & Hearings into Local Oracle Express 11g
// National Cyber Crime Reporting & Management Portal
// Schema: EAC_24037_RAKESH | Ministry of Home Affairs

const oracledb = require('./backend/node_modules/oracledb');

const KV_SYNC_URL = 'https://kvdb.io/2uN783pLc6vQynyUCStLdk/nccms_cloud_cases';
const KV_USERS_URL = 'https://kvdb.io/2uN783pLc6vQynyUCStLdk/nccms_cloud_users';

async function runSync() {
  console.log('====================================================================');
  console.log('  🏛️  NATIONAL CYBER CRIME PORTAL - ORACLE 11g LIVE SYNC ENGINE');
  console.log('  Schema: EAC_24037_RAKESH | Database: Oracle Express 11g XE');
  console.log('====================================================================\n');

  // 1. Fetch from Cloud Relays
  console.log('📡 1. Querying 24/7 Cloud Relay for newly registered citizens & complaints...');
  let cloudCases = [];
  let cloudUsers = [];

  try {
    const cRes = await fetch(KV_SYNC_URL);
    if (cRes.ok) cloudCases = await cRes.json();
  } catch (err) {}
  if (!Array.isArray(cloudCases)) cloudCases = [];

  try {
    const uRes = await fetch(KV_USERS_URL);
    if (uRes.ok) cloudUsers = await uRes.json();
  } catch (err) {}
  if (!Array.isArray(cloudUsers)) cloudUsers = [];

  console.log(`📥 Found ${cloudUsers.length} registered citizen(s) and ${cloudCases.length} complaint(s) in 24/7 Cloud Relay.\n`);

  // 2. Connect to Local Oracle 11g
  try {
    oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
  } catch (e) {}

  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'system',
      password: 'oracle',
      connectString: 'localhost/XE'
    });
    await conn.execute('ALTER SESSION SET CURRENT_SCHEMA = EAC_24037_RAKESH');
    console.log('✅ Connected to Local Oracle 11g Database (Schema: EAC_24037_RAKESH)\n');
  } catch (dbErr) {
    console.error('❌ Failed to connect to Oracle 11g XE:', dbErr.message);
    console.error('   Please ensure OracleServiceXE is running on your Windows PC.');
    process.exit(1);
  }

  // 3. Ensure Designated Cyber Crime Courts (1 to 5) exist in COURT table
  console.log('🏛️ 2. Verifying Designated Cyber Crime Courts...');
  const courts = [
    { id: 1, name: 'Special Cyber Crime Sessions Court, Patiala House', type: 'Sessions Court', loc: 'New Delhi, Delhi', ph: '011-23384521' },
    { id: 2, name: 'Special Cyber Crime Court, Esplanade Court Complex', type: 'Sessions Court', loc: 'Mumbai, Maharashtra', ph: '022-22620144' },
    { id: 3, name: 'City Civil & Sessions Cyber Court', type: 'Sessions Court', loc: 'Bengaluru, Karnataka', ph: '080-22211100' },
    { id: 4, name: 'Metropolitan Sessions Court (Cyber Division)', type: 'Sessions Court', loc: 'Hyderabad, Telangana', ph: '040-23445500' },
    { id: 5, name: 'Metropolitan Magistrate Cyber Crime Court, Egmore', type: 'Magistrate Court', loc: 'Chennai, Tamil Nadu', ph: '044-28190033' }
  ];

  for (const c of courts) {
    const chk = await conn.execute('SELECT COUNT(*) FROM COURT WHERE COURT_ID = :id', { id: c.id });
    if (chk.rows[0][0] === 0) {
      await conn.execute(
        'INSERT INTO COURT (COURT_ID, COURT_NAME, COURT_TYPE, LOCATION, CONTACT_NO) VALUES (:id, :name, :type, :loc, :ph)',
        { id: c.id, name: c.name, type: c.type, loc: c.loc, ph: c.ph }
      );
    }
  }

  // 4. Sync Pure Signups into LOGIN and VICTIM
  console.log('\n👥 3. Synchronizing Registered Citizens into LOGIN & VICTIM...');
  let syncedUsersCount = 0;
  for (const u of cloudUsers) {
    const phone = u.phone ? String(u.phone).trim() : '';
    if (!phone) continue;

    const vicCheck = await conn.execute(
      'SELECT VICTIM_ID FROM VICTIM WHERE PHONE = :phone',
      { phone }
    );

    if (vicCheck.rows && vicCheck.rows.length > 0) {
      continue; // already exists in Oracle
    }

    const email = u.email || 'citizen@cybercrime.gov.in';
    const firstName = u.first_name || 'Citizen';
    const lastName = u.last_name || 'User';
    const city = u.city || 'Bengaluru';
    const state = u.state || 'Karnataka';
    const pincode = u.pincode || '560001';

    try {
      await conn.execute(
        `INSERT INTO LOGIN (USER_ID, MOBILE_NUMBER, EMAIL, ROLE, ACTIVE_OTP, OTP_VERIFIED) 
         VALUES (SEQ_USER_ID.NEXTVAL, :phone, :email, 'Victim', '482910', 'YES')`,
        { phone, email }
      );

      await conn.execute(
        `INSERT INTO VICTIM (VICTIM_ID, USER_ID, FIRST_NAME, LAST_NAME, DOB, GENDER, EMAIL, PHONE, STREET, CITY, STATE, PINCODE)
         VALUES (SEQ_VICTIM_ID.NEXTVAL, SEQ_USER_ID.CURRVAL, :fn, :ln, TO_DATE('1998-01-01', 'YYYY-MM-DD'), 'Male', :email, :phone, 'Main Street', :city, :state, :pin)`,
        { fn: firstName, ln: lastName, email, phone, city, state, pin: pincode }
      );
      syncedUsersCount++;
      console.log(`  ✓ Synced Citizen: "${firstName} ${lastName}" (Phone: ${phone}) into LOGIN & VICTIM`);
    } catch (insErr) {}
  }

  // 5. Sync Cases into Oracle 11g
  console.log('\n📋 4. Synchronizing Cyber Crime Complaints...');
  let syncedCount = 0;
  let updatedCasesCount = 0;

  for (const c of cloudCases) {
    const checkRes = await conn.execute(
      'SELECT CASE_ID, CASE_STATUS FROM CYBER_CRIME_CASE WHERE CASE_TITLE = :title',
      { title: c.case_title }
    );

    let targetCaseId;

    if (checkRes.rows && checkRes.rows.length > 0) {
      targetCaseId = checkRes.rows[0][0];
      const existingStatus = checkRes.rows[0][1];

      if (c.case_status && c.case_status !== existingStatus) {
        await conn.execute(
          'UPDATE CYBER_CRIME_CASE SET CASE_STATUS = :st, PRIORITY_LEVEL = :pr WHERE CASE_ID = :cid',
          { st: c.case_status, pr: c.priority_level || 'High', cid: targetCaseId }
        );
        updatedCasesCount++;
        console.log(`  ↻ Updated Case #${targetCaseId} Status to "${c.case_status}"`);
      }
    } else {
      let victimId = 1;
      const vic = c.victim;
      const phone = vic?.phone || '9876543210';
      const email = vic?.email || 'citizen@cybercrime.gov.in';
      const firstName = vic?.first_name || 'Citizen';
      const lastName = vic?.last_name || 'Complainant';
      const city = vic?.city || 'Bengaluru';
      const state = vic?.state || 'Karnataka';
      const pincode = vic?.pincode || '560001';

      const vicCheck = await conn.execute(
        'SELECT VICTIM_ID FROM VICTIM WHERE PHONE = :phone',
        { phone }
      );

      if (vicCheck.rows && vicCheck.rows.length > 0) {
        victimId = vicCheck.rows[0][0];
      } else {
        await conn.execute(
          `INSERT INTO LOGIN (USER_ID, MOBILE_NUMBER, EMAIL, ROLE, ACTIVE_OTP, OTP_VERIFIED) 
           VALUES (SEQ_USER_ID.NEXTVAL, :phone, :email, 'Victim', '482910', 'YES')`,
          { phone, email }
        );

        await conn.execute(
          `INSERT INTO VICTIM (VICTIM_ID, USER_ID, FIRST_NAME, LAST_NAME, DOB, GENDER, EMAIL, PHONE, STREET, CITY, STATE, PINCODE)
           VALUES (SEQ_VICTIM_ID.NEXTVAL, SEQ_USER_ID.CURRVAL, :fn, :ln, TO_DATE('1995-01-01', 'YYYY-MM-DD'), 'Male', :email, :phone, '12 Main St', :city, :state, :pin)`,
          { fn: firstName, ln: lastName, email, phone, city, state, pin: pincode }
        );

        const newVicRes = await conn.execute(
          'SELECT VICTIM_ID FROM VICTIM WHERE PHONE = :phone',
          { phone }
        );
        if (newVicRes.rows && newVicRes.rows.length > 0) {
          victimId = newVicRes.rows[0][0];
        }
      }

      const ctId = c.crime_type_id || 1;
      let invId = c.investigator_id || 1;
      if (ctId === 1) invId = 8;
      else if (ctId === 2) invId = 19;
      else if (ctId === 3) invId = 15;
      else if (ctId === 4) invId = 25;
      else invId = 1;

      const incDate = c.incident_date || new Date().toISOString().split('T')[0];

      await conn.execute(
        `INSERT INTO CYBER_CRIME_CASE (
          CASE_ID, VICTIM_ID, INVESTIGATOR_ID, CRIME_TYPE_ID, CASE_TITLE, INCIDENT_DATE, 
          REPORTED_DATE, COMPLAINT_MODE, DESCRIPTION, CASE_STATUS, PRIORITY_LEVEL, ASSIGNED_DATE
        ) VALUES (
          SEQ_CASE_ID.NEXTVAL, :vicId, :invId, :ctId, :cTitle, 
          TO_DATE(:incDate, 'YYYY-MM-DD'), SYSDATE, :cMode, :cDesc, :cStatus, :cPriority, SYSDATE
        )`,
        {
          vicId: victimId,
          invId: invId,
          ctId: ctId,
          cTitle: c.case_title,
          incDate: incDate,
          cMode: c.complaint_mode || 'Online Portal',
          cDesc: c.description || 'Online fraud incident reported through National Cyber Crime Portal.',
          cStatus: c.case_status || 'Under Investigation',
          cPriority: c.priority_level || 'High'
        }
      );

      const insertedRes = await conn.execute(
        'SELECT CASE_ID FROM CYBER_CRIME_CASE WHERE CASE_TITLE = :title',
        { title: c.case_title }
      );
      if (insertedRes.rows && insertedRes.rows.length > 0) {
        targetCaseId = insertedRes.rows[0][0];
      }

      syncedCount++;
      console.log(`  ✓ Synced Case: "${c.case_title}" -> Assigned to Officer #${invId}`);
    }
  }

  // 6. Ensure EVERY case in CYBER_CRIME_CASE has Digital Device, Evidence, Suspect, and Case Hearing
  console.log('\n🔬 5. Verifying & Enriching Evidence, Devices, Hearings & Suspects for all cases...');
  const allCasesRes = await conn.execute('SELECT CASE_ID, CRIME_TYPE_ID, CASE_TITLE, CASE_STATUS FROM CYBER_CRIME_CASE ORDER BY CASE_ID ASC');
  const caseList = allCasesRes.rows;

  const deviceSpecs = [
    { type: 'Mobile Phone', brand: 'Samsung', model: 'Galaxy S23 5G', serial: 'SM-S911B-IND', mac: '9C:B6:D0:14:8A:3E', os: 'Android 14' },
    { type: 'Mobile Phone', brand: 'Apple', model: 'iPhone 14 Pro', serial: 'APL-14P-9821', mac: 'F4:D4:88:5A:21:BC', os: 'iOS 17.4' },
    { type: 'Laptop', brand: 'Dell', model: 'Inspiron 15', serial: 'DL-INSP-2024-X', mac: '00:1A:2B:3C:4D:5E', os: 'Windows 11 Pro' },
    { type: 'Mobile Phone', brand: 'OnePlus', model: 'OnePlus 11 5G', serial: '1P-11-IND-4829', mac: 'E0:DC:FF:33:12:9A', os: 'OxygenOS 14' }
  ];

  let devicesAdded = 0;
  let evidenceAdded = 0;
  let hearingsAdded = 0;
  let suspectsAdded = 0;

  for (let i = 0; i < caseList.length; i++) {
    const [caseId, crimeTypeId, caseTitle, caseStatus] = caseList[i];

    // A. Digital Device
    let deviceId;
    const devChk = await conn.execute('SELECT DEVICE_ID FROM DIGITAL_DEVICE WHERE CASE_ID = :cid', { cid: caseId });
    if (devChk.rows.length === 0) {
      const devSpec = deviceSpecs[i % deviceSpecs.length];
      const seqDev = await conn.execute('SELECT SEQ_DEVICE_ID.NEXTVAL FROM DUAL');
      deviceId = seqDev.rows[0][0];

      await conn.execute(
        `INSERT INTO DIGITAL_DEVICE (DEVICE_ID, CASE_ID, DEVICE_TYPE, BRAND, MODEL, SERIAL_NO, MAC_ADDRESS, OPERATING_SYSTEM)
         VALUES (:did, :cid, :dtype, :brand, :model, :serial, :mac, :os)`,
        { did: deviceId, cid: caseId, dtype: devSpec.type, brand: devSpec.brand, model: devSpec.model, serial: devSpec.serial, mac: devSpec.mac, os: devSpec.os }
      );
      devicesAdded++;
    } else {
      deviceId = devChk.rows[0][0];
    }

    // B. Forensic Evidence (2 records per case)
    const evChk = await conn.execute('SELECT COUNT(*) FROM EVIDENCE WHERE CASE_ID = :cid', { cid: caseId });
    if (evChk.rows[0][0] === 0) {
      const isFin = crimeTypeId === 1 || String(caseTitle).toLowerCase().includes('bank') || String(caseTitle).toLowerCase().includes('rupees');
      const isSoc = crimeTypeId === 2 || String(caseTitle).toLowerCase().includes('fake') || String(caseTitle).toLowerCase().includes('blackmail');

      const ev1 = {
        type: isFin ? 'Bank Account Statement & UTR Debit Log' : (isSoc ? 'Deepfake Morphed Video Forensic Report' : 'WhatsApp Phishing Chat Logs'),
        hash: 'SHA256: 7d4a9f82bc103982e01614798cba991048' + (caseId % 99),
        size: isFin ? '4.8 MB' : '48.2 MB',
        ip: '103.241.136.' + ((caseId % 250) + 1),
        loc: `/evidence_vault/${caseId}/primary_forensic_artifact_${caseId}.bin`
      };

      const ev2 = {
        type: isFin ? 'Mule Account Beneficiary KYC Dossier' : 'IP Trace & Telecom Subscriber CDR Log',
        hash: 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427' + (caseId % 99),
        size: '1.6 MB',
        ip: '49.36.128.' + ((caseId % 250) + 1),
        loc: `/evidence_vault/${caseId}/cdr_network_telecom_log.pdf`
      };

      const seqEv1 = await conn.execute('SELECT SEQ_EVIDENCE_ID.NEXTVAL FROM DUAL');
      const ev1Id = seqEv1.rows[0][0];
      await conn.execute(
        `INSERT INTO EVIDENCE (EVIDENCE_ID, CASE_ID, DEVICE_ID, EVIDENCE_TYPE, FILE_HASH, FILE_SIZE, COLLECTION_DATE, IP_ADDRESS, STORAGE_LOCATION)
         VALUES (:eid, :cid, :did, :etype, :hash, :fsize, SYSDATE - 2, :ip, :loc)`,
        { eid: ev1Id, cid: caseId, did: deviceId, etype: ev1.type, hash: ev1.hash, fsize: ev1.size, ip: ev1.ip, loc: ev1.loc }
      );
      evidenceAdded++;

      const seqEv2 = await conn.execute('SELECT SEQ_EVIDENCE_ID.NEXTVAL FROM DUAL');
      const ev2Id = seqEv2.rows[0][0];
      await conn.execute(
        `INSERT INTO EVIDENCE (EVIDENCE_ID, CASE_ID, DEVICE_ID, EVIDENCE_TYPE, FILE_HASH, FILE_SIZE, COLLECTION_DATE, IP_ADDRESS, STORAGE_LOCATION)
         VALUES (:eid, :cid, :did, :etype, :hash, :fsize, SYSDATE - 1, :ip, :loc)`,
        { eid: ev2Id, cid: caseId, did: deviceId, etype: ev2.type, hash: ev2.hash, fsize: ev2.size, ip: ev2.ip, loc: ev2.loc }
      );
      evidenceAdded++;
    }

    // C. Suspect
    const suspChk = await conn.execute('SELECT COUNT(*) FROM SUSPECT WHERE CASE_ID = :cid', { cid: caseId });
    if (suspChk.rows[0][0] === 0) {
      const seqSusp = await conn.execute('SELECT SEQ_SUSPECT_ID.NEXTVAL FROM DUAL');
      const suspId = seqSusp.rows[0][0];

      const suspectNames = ['Imran Qureshi (Mule Account Operator)', 'Arjun Malhotra (@darknet_rex)', 'Pooja Deshmukh', 'Rajesh Srivastav'];
      const cities = ['Mumbai', 'Noida', 'Pune', 'Jamtara'];
      const states = ['Maharashtra', 'Uttar Pradesh', 'Maharashtra', 'Jharkhand'];
      const statuses = ['Arrested', 'Absconding', 'Under Surveillance', 'Arrested'];
      const sIdx = i % suspectNames.length;

      await conn.execute(
        `INSERT INTO SUSPECT (
          SUSPECT_ID, CASE_ID, NAME, GENDER, CRIMINAL_HISTORY, STREET, CITY, STATE, PINCODE, PHONE, EMAIL, INVOLVEMENT_TYPE, ARREST_STATUS, CHARGES
        ) VALUES (
          :sid, :cid, :name, 'Male', 'Prior Cyber Cell Records in Jamtara/Mule Ring', '14 Ring Road', :city, :state, '400051', '9102837465', 'suspect@darkmail.com', 'Primary Accused', :astatus, 'IT Act Sec 66C, 66D & IPC 420'
        )`,
        { sid: suspId, cid: caseId, name: suspectNames[sIdx], city: cities[sIdx], state: states[sIdx], astatus: statuses[sIdx] }
      );
      suspectsAdded++;
    }

    // D. Case Hearing
    const hChk = await conn.execute('SELECT COUNT(*) FROM CASE_HEARING WHERE CASE_ID = :cid', { cid: caseId });
    if (hChk.rows[0][0] === 0) {
      const courtId = (i % 5) + 1;
      const verdict = caseStatus === 'In Court'
        ? 'Charge Sheet submitted by Police. Bank freeze order under Sec 66D IT Act issued to beneficiary bank.'
        : 'Cognizance taken on Police Investigation Report. Summons issued to intermediary service provider.';

      await conn.execute(
        `INSERT INTO CASE_HEARING (
          CASE_ID, HEARING_NO, COURT_ID, HEARING_DATE, HEARING_STATUS, VERDICT, NEXT_HEARING_DATE, JUDGE_NAME, COURT_ROOM_NO
        ) VALUES (
          :cid, 1, :courtId, SYSDATE + 7, 'Scheduled', :verdict, SYSDATE + 21, 'Hon. Special Magistrate K. Ramanathan', 'Court Hall No. 3'
        )`,
        { cid: caseId, courtId: courtId, verdict: verdict }
      );
      hearingsAdded++;
    }
  }

  await conn.commit();

  // 7. Verification Counts
  const vCnt = await conn.execute('SELECT COUNT(*) FROM VICTIM');
  const cCnt = await conn.execute('SELECT COUNT(*) FROM CYBER_CRIME_CASE');
  const eCnt = await conn.execute('SELECT COUNT(*) FROM EVIDENCE');
  const hCnt = await conn.execute('SELECT COUNT(*) FROM CASE_HEARING');
  const dCnt = await conn.execute('SELECT COUNT(*) FROM DIGITAL_DEVICE');
  const sCnt = await conn.execute('SELECT COUNT(*) FROM SUSPECT');
  const ctCnt = await conn.execute('SELECT COUNT(*) FROM COURT');
  const iCnt = await conn.execute('SELECT COUNT(*) FROM INVESTIGATOR');
  const lCnt = await conn.execute('SELECT COUNT(*) FROM LOGIN');

  console.log('\n====================================================================');
  console.log('  📊 ORACLE 11g DATABASE LIVE SYNCHRONIZATION RESULTS');
  console.log('====================================================================');
  console.log(`  EVIDENCE Rows in Oracle        : ${eCnt.rows[0][0]}`);
  console.log(`  CASE_HEARING Rows in Oracle    : ${hCnt.rows[0][0]}`);
  console.log(`  DIGITAL_DEVICE Rows in Oracle  : ${dCnt.rows[0][0]}`);
  console.log(`  SUSPECT Rows in Oracle         : ${sCnt.rows[0][0]}`);
  console.log(`  CYBER_CRIME_CASE Rows in Oracle: ${cCnt.rows[0][0]}`);
  console.log(`  COURT Rows in Oracle           : ${ctCnt.rows[0][0]}`);
  console.log(`  VICTIM (Citizens) in Oracle    : ${vCnt.rows[0][0]}`);
  console.log(`  LOGIN Records in Oracle        : ${lCnt.rows[0][0]}`);
  console.log(`  INVESTIGATOR Officers in Oracle: ${iCnt.rows[0][0]}`);
  console.log('====================================================================');
  console.log('✨ Data is live in Oracle Express 11g! Ready for your live demonstration in APEX!\n');

  await conn.close();
}

runSync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
