// populate_oracle_evidence_hearings.js
// Populates and enriches EVIDENCE, CASE_HEARING, DIGITAL_DEVICE, SUSPECT, and COURT in Oracle Express 11g
// National Cyber Crime Reporting & Management Portal | Schema: EAC_24037_RAKESH

const oracledb = require('./backend/node_modules/oracledb');

try {
  oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
} catch (e) {}

async function run() {
  console.log('====================================================================');
  console.log('  🏛️  ORACLE 11g EVIDENCE & CASE HEARINGS POPULATION & SYNC ENGINE');
  console.log('  Schema: EAC_24037_RAKESH | Database: Oracle Express 11g XE');
  console.log('====================================================================\n');

  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'system',
      password: 'oracle',
      connectString: 'localhost/XE'
    });
    await conn.execute('ALTER SESSION SET CURRENT_SCHEMA = EAC_24037_RAKESH');
    console.log('✅ Connected to Oracle 11g Database.\n');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  // 1. Ensure Courts 1 to 5 exist
  console.log('🏛️ Step 1: Verifying Designated Cyber Crime Courts...');
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
      console.log(`  + Inserted Court: ${c.name}`);
    } else {
      await conn.execute(
        'UPDATE COURT SET COURT_NAME = :name, COURT_TYPE = :type, LOCATION = :loc, CONTACT_NO = :ph WHERE COURT_ID = :id',
        { id: c.id, name: c.name, type: c.type, loc: c.loc, ph: c.ph }
      );
    }
  }

  // 2. Ensure Shrikruth Vishwa's Case #2025005 & Case #2025001 exist
  console.log('\n📋 Step 2: Ensuring Core Cyber Crime Cases exist...');
  const v8 = await conn.execute('SELECT VICTIM_ID FROM VICTIM WHERE PHONE = :ph', { ph: '8341543076' });
  const shrikruthVicId = v8.rows.length > 0 ? v8.rows[0][0] : 8;

  // Case 2025005 (Shrikruth Vishwa)
  const c5Chk = await conn.execute("SELECT CASE_ID FROM CYBER_CRIME_CASE WHERE CASE_TITLE LIKE '%95,000%' OR CASE_ID = 2025005");
  if (c5Chk.rows.length === 0) {
    await conn.execute(
      `INSERT INTO CYBER_CRIME_CASE (
        CASE_ID, VICTIM_ID, INVESTIGATOR_ID, CRIME_TYPE_ID, CASE_TITLE, INCIDENT_DATE, 
        REPORTED_DATE, COMPLAINT_MODE, DESCRIPTION, CASE_STATUS, PRIORITY_LEVEL, ASSIGNED_DATE
      ) VALUES (
        2025005, :vicId, 1, 1, 'cyber thief stolen amount of 95,000/- from my bank account',
        TO_DATE('2026-11-15', 'YYYY-MM-DD'), SYSDATE, 'Online Portal',
        'Unauthorized withdrawal of Rs 95,000/- through fake banking link. Amount siphoned to mule account.',
        'In Court', 'Critical', SYSDATE
      )`,
      { vicId: shrikruthVicId }
    );
    console.log('  + Inserted Case #2025005 (Shrikruth Vishwa - Rs 95,000/- Bank Fraud) with Status: In Court');
  } else {
    const cId = c5Chk.rows[0][0];
    await conn.execute("UPDATE CYBER_CRIME_CASE SET CASE_STATUS = 'In Court' WHERE CASE_ID = :id", { id: cId });
    console.log(`  ✓ Updated Case #${cId} Status to "In Court"`);
  }

  // Case 2025001
  const c1Chk = await conn.execute('SELECT CASE_ID FROM CYBER_CRIME_CASE WHERE CASE_ID = 2025001');
  if (c1Chk.rows.length === 0) {
    await conn.execute(
      `INSERT INTO CYBER_CRIME_CASE (
        CASE_ID, VICTIM_ID, INVESTIGATOR_ID, CRIME_TYPE_ID, CASE_TITLE, INCIDENT_DATE, 
        REPORTED_DATE, COMPLAINT_MODE, DESCRIPTION, CASE_STATUS, PRIORITY_LEVEL, ASSIGNED_DATE
      ) VALUES (
        2025001, 4, 1, 1, 'UPI Phishing QR Code Debit - Rs 48,500 Unauthorized Transfer',
        TO_DATE('2026-11-04', 'YYYY-MM-DD'), SYSDATE - 10, 'Online Portal',
        'Scammer sent a fake payment confirmation QR code claiming to be customer care.',
        'In Court', 'High', SYSDATE - 10
      )`
    );
    console.log('  + Inserted Case #2025001 (UPI Phishing QR Code Debit - Rs 48,500)');
  }

  // 3. Query all cases currently in Oracle
  const allCasesRes = await conn.execute('SELECT CASE_ID, CRIME_TYPE_ID, CASE_TITLE, CASE_STATUS FROM CYBER_CRIME_CASE ORDER BY CASE_ID ASC');
  const caseList = allCasesRes.rows;
  console.log(`\n🔍 Found ${caseList.length} cases in Oracle 11g CYBER_CRIME_CASE table.\n`);

  // Device & Evidence definitions mapped to crime type / case
  const deviceSpecs = [
    { type: 'Mobile Phone', brand: 'Samsung', model: 'Galaxy S23 5G', serial: 'SM-S911B-IND', mac: '9C:B6:D0:14:8A:3E', os: 'Android 14' },
    { type: 'Mobile Phone', brand: 'Apple', model: 'iPhone 14 Pro', serial: 'APL-14P-9821', mac: 'F4:D4:88:5A:21:BC', os: 'iOS 17.4' },
    { type: 'Laptop', brand: 'Dell', model: 'Inspiron 15', serial: 'DL-INSP-2024-X', mac: '00:1A:2B:3C:4D:5E', os: 'Windows 11 Pro' },
    { type: 'Mobile Phone', brand: 'OnePlus', model: 'OnePlus 11 5G', serial: '1P-11-IND-4829', mac: 'E0:DC:FF:33:12:9A', os: 'OxygenOS 14' }
  ];

  let devicesInserted = 0;
  let evidenceInserted = 0;
  let hearingsInserted = 0;
  let suspectsInserted = 0;

  for (let i = 0; i < caseList.length; i++) {
    const [caseId, crimeTypeId, caseTitle, caseStatus] = caseList[i];
    console.log(`📦 Processing Case #${caseId}: "${caseTitle}" (Status: ${caseStatus})`);

    // A. Check / Insert DIGITAL_DEVICE
    let deviceId;
    const devChk = await conn.execute('SELECT DEVICE_ID FROM DIGITAL_DEVICE WHERE CASE_ID = :cid', { cid: caseId });
    if (devChk.rows.length === 0) {
      const devSpec = deviceSpecs[i % deviceSpecs.length];
      const seqDev = await conn.execute('SELECT SEQ_DEVICE_ID.NEXTVAL FROM DUAL');
      deviceId = seqDev.rows[0][0];

      await conn.execute(
        `INSERT INTO DIGITAL_DEVICE (DEVICE_ID, CASE_ID, DEVICE_TYPE, BRAND, MODEL, SERIAL_NO, MAC_ADDRESS, OPERATING_SYSTEM)
         VALUES (:did, :cid, :dtype, :brand, :model, :serial, :mac, :os)`,
        {
          did: deviceId,
          cid: caseId,
          dtype: devSpec.type,
          brand: devSpec.brand,
          model: devSpec.model,
          serial: devSpec.serial,
          mac: devSpec.mac,
          os: devSpec.os
        }
      );
      devicesInserted++;
      console.log(`   📱 Inserted Digital Device #${deviceId}: ${devSpec.brand} ${devSpec.model} (${devSpec.type})`);
    } else {
      deviceId = devChk.rows[0][0];
    }

    // B. Check / Insert EVIDENCE
    const evChk = await conn.execute('SELECT COUNT(*) FROM EVIDENCE WHERE CASE_ID = :cid', { cid: caseId });
    if (evChk.rows[0][0] === 0) {
      // Create primary and secondary evidence records based on crime type
      const isFinancial = crimeTypeId === 1 || String(caseTitle).toLowerCase().includes('bank') || String(caseTitle).toLowerCase().includes('rupees');
      const isSocialOrExtortion = crimeTypeId === 2 || String(caseTitle).toLowerCase().includes('fake') || String(caseTitle).toLowerCase().includes('blackmail');

      const ev1 = {
        type: isFinancial ? 'Bank Account Statement & UTR Debit Log' : (isSocialOrExtortion ? 'Deepfake Morphed Video Forensic Report' : 'WhatsApp Phishing Chat Logs'),
        hash: 'SHA256: 7d4a9f82bc103982e01614798cba991048' + (caseId % 99),
        size: isFinancial ? '4.8 MB' : '48.2 MB',
        ip: '103.241.136.' + ((caseId % 250) + 1),
        loc: `/evidence_vault/${caseId}/primary_forensic_artifact_${caseId}.bin`
      };

      const ev2 = {
        type: isFinancial ? 'Mule Account Beneficiary KYC Dossier' : 'IP Trace & Telecom Subscriber CDR Log',
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
      evidenceInserted++;
      console.log(`   🔒 Inserted Evidence #${ev1Id}: "${ev1.type}" (IP: ${ev1.ip})`);

      const seqEv2 = await conn.execute('SELECT SEQ_EVIDENCE_ID.NEXTVAL FROM DUAL');
      const ev2Id = seqEv2.rows[0][0];
      await conn.execute(
        `INSERT INTO EVIDENCE (EVIDENCE_ID, CASE_ID, DEVICE_ID, EVIDENCE_TYPE, FILE_HASH, FILE_SIZE, COLLECTION_DATE, IP_ADDRESS, STORAGE_LOCATION)
         VALUES (:eid, :cid, :did, :etype, :hash, :fsize, SYSDATE - 1, :ip, :loc)`,
        { eid: ev2Id, cid: caseId, did: deviceId, etype: ev2.type, hash: ev2.hash, fsize: ev2.size, ip: ev2.ip, loc: ev2.loc }
      );
      evidenceInserted++;
      console.log(`   🔒 Inserted Evidence #${ev2Id}: "${ev2.type}" (IP: ${ev2.ip})`);
    }

    // C. Check / Insert SUSPECT
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
        {
          sid: suspId,
          cid: caseId,
          name: suspectNames[sIdx],
          city: cities[sIdx],
          state: states[sIdx],
          astatus: statuses[sIdx]
        }
      );
      suspectsInserted++;
      console.log(`   👤 Inserted Suspect #${suspId}: "${suspectNames[sIdx]}" (Status: ${statuses[sIdx]})`);
    }

    // D. Check / Insert CASE_HEARING
    const hChk = await conn.execute('SELECT COUNT(*) FROM CASE_HEARING WHERE CASE_ID = :cid', { cid: caseId });
    if (hChk.rows[0][0] === 0) {
      const courtId = (i % 5) + 1;
      const hStatus = caseStatus === 'In Court' ? 'Scheduled' : 'Scheduled';
      const verdict = caseStatus === 'In Court' 
        ? 'Charge Sheet submitted by Police. Bank freeze order under Sec 66D IT Act issued to beneficiary bank.' 
        : 'Cognizance taken on Police Investigation Report. Summons issued to intermediary service provider.';

      await conn.execute(
        `INSERT INTO CASE_HEARING (
          CASE_ID, HEARING_NO, COURT_ID, HEARING_DATE, HEARING_STATUS, VERDICT, NEXT_HEARING_DATE, JUDGE_NAME, COURT_ROOM_NO
        ) VALUES (
          :cid, 1, :courtId, SYSDATE + 7, :hStatus, :verdict, SYSDATE + 21, 'Hon. Special Magistrate K. Ramanathan', 'Court Hall No. 3'
        )`,
        {
          cid: caseId,
          courtId: courtId,
          hStatus: hStatus,
          verdict: verdict
        }
      );
      hearingsInserted++;
      console.log(`   ⚖️ Inserted Case Hearing #1: Court #${courtId} | Scheduled Date: SYSDATE+7 | Judge: Hon. K. Ramanathan`);
    }
  }

  await conn.commit();

  // 4. Print Summary Verification
  const dCnt = await conn.execute('SELECT COUNT(*) FROM DIGITAL_DEVICE');
  const eCnt = await conn.execute('SELECT COUNT(*) FROM EVIDENCE');
  const hCnt = await conn.execute('SELECT COUNT(*) FROM CASE_HEARING');
  const sCnt = await conn.execute('SELECT COUNT(*) FROM SUSPECT');
  const cCnt = await conn.execute('SELECT COUNT(*) FROM CYBER_CRIME_CASE');
  const ctCnt = await conn.execute('SELECT COUNT(*) FROM COURT');

  console.log('\n====================================================================');
  console.log('  📊 ORACLE 11g DATABASE LIVE VERIFICATION RESULTS');
  console.log('====================================================================');
  console.log(`  EVIDENCE Rows in Oracle        : ${eCnt.rows[0][0]}  (Newly Added: ${evidenceInserted})`);
  console.log(`  CASE_HEARING Rows in Oracle    : ${hCnt.rows[0][0]}  (Newly Added: ${hearingsInserted})`);
  console.log(`  DIGITAL_DEVICE Rows in Oracle  : ${dCnt.rows[0][0]}  (Newly Added: ${devicesInserted})`);
  console.log(`  SUSPECT Rows in Oracle         : ${sCnt.rows[0][0]}  (Newly Added: ${suspectsInserted})`);
  console.log(`  CYBER_CRIME_CASE Rows in Oracle: ${cCnt.rows[0][0]}`);
  console.log(`  COURT Rows in Oracle           : ${ctCnt.rows[0][0]}`);
  console.log('====================================================================');
  console.log('✨ All tables updated! Go ahead and click "Query" or refresh in Oracle APEX Object Browser!\n');

  await conn.close();
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
