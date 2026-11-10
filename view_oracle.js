// view_oracle.js - Quick Terminal Viewer for Oracle 11g Data
// Schema: EAC_24037_RAKESH | Ministry of Home Affairs Cyber Crime Portal

const oracledb = require('./backend/node_modules/oracledb');

async function viewData() {
  console.log('========================================================================================');
  console.log('  🏛️  ORACLE 11g LIVE DATABASE INSPECTOR (Schema: EAC_24037_RAKESH)');
  console.log('========================================================================================\n');

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
    console.log('✅ Connected to Oracle 11g XE successfully!\n');
  } catch (err) {
    console.error('❌ Could not connect to Oracle 11g:', err.message);
    process.exit(1);
  }

  try {
    // 1. Cases Table
    console.log('📂 [TABLE: CYBER_CRIME_CASE] - Registered Complaints:');
    const casesRes = await conn.execute(`
      SELECT c.CASE_ID, c.CASE_TITLE, c.CASE_STATUS, c.PRIORITY_LEVEL, 
             TO_CHAR(c.REPORTED_DATE, 'YYYY-MM-DD') AS R_DATE,
             i.NAME AS OFFICER_NAME, i.OFFICER_ID
      FROM CYBER_CRIME_CASE c
      LEFT JOIN INVESTIGATOR i ON c.INVESTIGATOR_ID = i.INVESTIGATOR_ID
      ORDER BY c.CASE_ID DESC
    `);

    if (!casesRes.rows || casesRes.rows.length === 0) {
      console.log('   (No cases recorded in Oracle yet. Run "npm run sync-to-oracle" to pull from cloud.)\n');
    } else {
      console.table(casesRes.rows.map(r => ({
        'Case ID': r[0],
        'Complaint Title': r[1],
        'Status': r[2],
        'Priority': r[3],
        'Reported Date': r[4],
        'Assigned Officer': `${r[5]} (${r[6]})`
      })));
    }

    // 2. Victims Table
    console.log('\n👤 [TABLE: VICTIM] - Registered Citizens:');
    const vicRes = await conn.execute(`
      SELECT VICTIM_ID, FIRST_NAME || ' ' || LAST_NAME AS FULL_NAME, PHONE, EMAIL, CITY, STATE 
      FROM VICTIM
      ORDER BY VICTIM_ID DESC
    `);

    if (vicRes.rows && vicRes.rows.length > 0) {
      console.table(vicRes.rows.map(r => ({
        'Victim ID': r[0],
        'Citizen Name': r[1],
        'Phone Number': r[2],
        'Email Address': r[3],
        'Location': `${r[4]}, ${r[5]}`
      })));
    }

    // 3. Officers Count
    const offRes = await conn.execute('SELECT COUNT(*) FROM INVESTIGATOR');
    console.log(`\n👮 Total Official Police Officers in Registry: ${offRes.rows[0][0]}`);

    console.log('\n========================================================================================');
    console.log('✨ All records displayed above are stored physically in Oracle 11g Express Edition.');
    console.log('========================================================================================\n');
  } catch (qErr) {
    console.error('Error querying Oracle tables:', qErr.message);
  } finally {
    await conn.close();
  }
}

viewData();
