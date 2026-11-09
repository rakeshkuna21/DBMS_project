// viva_demo_server.js - 1-Click Interactive Live Viva Demonstration Server
// National Cyber Crime Reporting & Management Portal
// Schema: EAC_24037_RAKESH | Oracle Express 11g Thick Mode

const http = require('http');
const { spawn } = require('child_process');

async function getNgrokUrl() {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const tunnel = json.tunnels?.[0];
          resolve(tunnel?.public_url || 'https://mosaic-jimmy-ground.ngrok-free.dev');
        } catch (e) {
          resolve('https://mosaic-jimmy-ground.ngrok-free.dev');
        }
      });
    }).on('error', () => {
      resolve('https://mosaic-jimmy-ground.ngrok-free.dev');
    });
  });
}

async function startVivaMode() {
  console.clear();
  console.log('\x1b[32m%s\x1b[0m', '========================================================================');
  console.log('\x1b[1m%s\x1b[0m', '  🏛️  NATIONAL CYBER CRIME PORTAL — LIVE COLLEGE VIVA MODE');
  console.log('  Ministry of Home Affairs | Government of India');
  console.log('  Project Engineers: Krish Vats, Sai Dheepak, Rakeesh, Shanmukh');
  console.log('\x1b[32m%s\x1b[0m', '========================================================================\n');

  console.log('🔍 1. Verifying Local Oracle 11g XE Database Connection...');
  try {
    const oracledb = require('./backend/node_modules/oracledb');
    try {
      oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
    } catch (e) {}

    const conn = await oracledb.getConnection({
      user: 'system',
      password: 'oracle',
      connectString: 'localhost/XE'
    });
    await conn.execute('ALTER SESSION SET CURRENT_SCHEMA = EAC_24037_RAKESH');
    const r1 = await conn.execute('SELECT COUNT(*) FROM INVESTIGATOR');
    const r2 = await conn.execute('SELECT COUNT(*) FROM CYBER_CRIME_CASE');
    console.log(`  ✅ Oracle 11g XE Thick Mode: CONNECTED`);
    console.log(`  📦 Schema: EAC_24037_RAKESH (Officers: ${r1.rows[0][0]}, Cases: ${r2.rows[0][0]})\n`);
    await conn.close();
  } catch (err) {
    console.warn('  ⚠️ Oracle Note:', err.message);
  }

  console.log('🌐 2. Fetching Live Public HTTPS Gateway Link...');
  const publicUrl = await getNgrokUrl();

  console.log('\x1b[33m%s\x1b[0m', '========================================================================');
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', `  👉 LIVE URL FOR MAM & CLASSMATES (OPEN ON MOBILE PHONE):`);
  console.log(`     ${publicUrl}`);
  console.log('\x1b[33m%s\x1b[0m', '========================================================================\n');

  console.log('📋 STEP-BY-STEP LIVE DEMO PLAN FOR "MAM":');
  console.log('  1. Ask Mam to open the URL above on her smartphone.');
  console.log('  2. Mam can register as a citizen or test Officer Badge ID: CBI-CYB-101 (Password: Kavach@2026).');
  console.log('  3. When Mam files a complaint, watch it write directly into Oracle 11g in real time!');
  console.log('  4. Switch to your Oracle 11g APEX (http://localhost:8080/apex) or SQL*Plus:');
  console.log('     Run: SELECT CASE_ID, CASE_TITLE, REPORTED_DATE FROM CYBER_CRIME_CASE;\n');
  console.log('🟢 Listening for live submissions from mobile phones... (Press Ctrl+C to stop)\n');
}

startVivaMode();
