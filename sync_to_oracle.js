// sync_to_oracle.js - Synchronize 24/7 Cloud Filed Cases & Signups into Local Oracle Express 11g
// National Cyber Crime Reporting & Management Portal
// Schema: EAC_24037_RAKESH | Ministry of Home Affairs

const oracledb = require('./backend/node_modules/oracledb');

const KV_SYNC_URL = 'https://kvdb.io/2uN783pLc6vQynyUCStLdk/nccms_cloud_cases';
const KV_USERS_URL = 'https://kvdb.io/2uN783pLc6vQynyUCStLdk/nccms_cloud_users';

async function runSync() {
  console.log('====================================================================');
  console.log('  🏛️  ORACLE 11g LIVE DATA SYNCHRONIZATION WORKER');
  console.log('  Target Schema: EAC_24037_RAKESH | Database: Oracle Express 11g XE');
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

  // 3. Sync Pure Signups into LOGIN and VICTIM
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
      console.log(`  ✓ Synced Registered Citizen: "${firstName} ${lastName}" (Phone: ${phone}) into Oracle 11g`);
    } catch (insErr) {
      // Continue smoothly
    }
  }

  // 4. Sync Cases into Oracle 11g
  let syncedCount = 0;
  let skippedCount = 0;

  for (const c of cloudCases) {
    // Check if case title already exists in Oracle
    const checkRes = await conn.execute(
      'SELECT CASE_ID FROM CYBER_CRIME_CASE WHERE CASE_TITLE = :title',
      { title: c.case_title }
    );

    if (checkRes.rows && checkRes.rows.length > 0) {
      skippedCount++;
      continue;
    }

    // Determine / create Victim
    let victimId = 1;
    const vic = c.victim;
    const phone = vic?.phone || '9876543210';
    const email = vic?.email || 'citizen@cybercrime.gov.in';
    const firstName = vic?.first_name || 'Citizen';
    const lastName = vic?.last_name || 'Complainant';
    const city = vic?.city || 'Bengaluru';
    const state = vic?.state || 'Karnataka';
    const pincode = vic?.pincode || '560001';

    // Check existing victim
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

    // Insert Case into CYBER_CRIME_CASE
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
        TO_DATE(:incDate, 'YYYY-MM-DD'), SYSDATE, :cMode, :cDesc, 'Under Investigation', 'High', SYSDATE
      )`,
      {
        vicId: victimId,
        invId: invId,
        ctId: ctId,
        cTitle: c.case_title,
        incDate: incDate,
        cMode: c.complaint_mode || 'Online Portal',
        cDesc: c.description || 'Online fraud incident reported through National Cyber Crime Portal.'
      }
    );

    syncedCount++;
    console.log(`  ✓ Synced Case: "${c.case_title}" -> Assigned to Officer #${invId} in Oracle 11g`);
  }

  await conn.commit();

  // Print Database Status
  const vCnt = await conn.execute('SELECT COUNT(*) FROM VICTIM');
  const cCnt = await conn.execute('SELECT COUNT(*) FROM CYBER_CRIME_CASE');
  const iCnt = await conn.execute('SELECT COUNT(*) FROM INVESTIGATOR');

  console.log('\n====================================================================');
  console.log('  📊 SYNCHRONIZATION RESULTS');
  console.log('====================================================================');
  console.log(`  Newly Synced Citizens      : ${syncedUsersCount}`);
  console.log(`  Newly Synced Complaints    : ${syncedCount}`);
  console.log(`  Already Existing (Skipped) : ${skippedCount}`);
  console.log(`  Total Citizens in Oracle   : ${vCnt.rows[0][0]}`);
  console.log(`  Total Cases in Oracle      : ${cCnt.rows[0][0]}`);
  console.log(`  Total Officers in Oracle   : ${iCnt.rows[0][0]}`);
  console.log('====================================================================');
  console.log('✨ Data is live in Oracle Express 11g! Ready to show to Mam in APEX/SQL*Plus.\n');

  await conn.close();
}

runSync();
