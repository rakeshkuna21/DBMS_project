# 🏛️ High-Level Architecture (Hybrid 3-Tier Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. FRONTEND WEB PORTAL                      │
│        (React + Vite hosted live on GitHub Pages)               │
│   • Citizen Portal (Report Cyber Crime, Track Case, OTP Login)  │
│   • Officer Desk (Investigator Workflow, Status: "In Court")   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ 24/7 REST Sync
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   2. 24/7 CLOUD SYNC RELAY                      │
│   • Stores new citizen registrations & cyber crime complaints   │
│   • Works across all phones and laptops without static IPs      │
└───────────────────────────────┬─────────────────────────────────┘
                                │ One-Click Bridge (npm run sync-to-oracle)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               3. LOCAL ORACLE 11g XE DATABASE                   │
│             Schema: EAC_24037_RAKESH (APEX Browser)             │
│   • Normalized Relational Tables (LOGIN, VICTIM, CASE, etc.)    │
│   • Auto-Generates: DIGITAL_DEVICE, EVIDENCE, CASE_HEARING      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Key Components & How It Was Built

### 1. Frontend & Client-Side Engine (`React + Vite`)
* **Role-Based Portals**:
  * **Citizen Portal**: Multi-step complaint filing wizard, OTP-based verification, complaint tracking, and judicial court hearings schedule.
  * **Investigator Desk**: Assigned to 44 real police officers across CBI, I4C, Delhi IFSO, and State Cyber Cells. Officers can update case status (e.g., to *"In Court"*).
* **Autonomous In-Browser Adapter (`mockApiAdapter.js`)**:
  * Simulates Oracle 11g SQL queries directly in the browser when running on GitHub Pages.
  * Automatically intercepts status updates: if an officer marks a case as *"In Court"*, it auto-schedules a court hearing with Judge, Courtroom, and Section 66D IT Act freeze orders.

### 2. Real-Time Cloud Relay
* Serves as a 24/7 live bridge between GitHub Pages and your laptop.
* Whenever anyone registers or submits a complaint from their phone or laptop, it broadcasts the payload instantly to the cloud relay.

### 3. Automatic Oracle 11g Sync Worker (`sync_to_oracle.js`)
* Built with Node.js and Oracle’s official `oracledb` C-binary client library connecting directly to `localhost/XE` under schema `EAC_24037_RAKESH`.
* **Automatic Relational Enrichment**: When you run `npm run sync-to-oracle`, it:
  1. Inserts citizens into **`LOGIN`** and **`VICTIM`** using Oracle sequences (`SEQ_USER_ID`, `SEQ_VICTIM_ID`).
  2. Inserts complaints into **`CYBER_CRIME_CASE`** and assigns duty officers based on crime category.
  3. Auto-generates hardware records in **`DIGITAL_DEVICE`** (seized phones/laptops with MAC addresses and OS).
  4. Auto-generates forensic artifacts in **`EVIDENCE`** (SHA-256 hashes, file sizes, IP addresses, vault locations).
  5. Auto-schedules proceedings in **`CASE_HEARING`** (scheduled hearing dates, Judge Hon. K. Ramanathan, Court Hall No. 3).
  6. Auto-tracks primary suspects in **`SUSPECT`** with statutory charges under IT Act Sec 66C/66D & IPC 420.

---

## 🎯 30-Second Viva Pitch for Your Examiner:

> *"Our National Cyber Crime Management System uses a **hybrid 3-tier architecture**. The public-facing portal is deployed live on GitHub Pages for citizens to file complaints 24/7. When complaints or investigations reach the 'In Court' stage, our automated sync engine pulls the data into our local **Oracle 11g Express database**, auto-populating relational tables like **`DIGITAL_DEVICE`**, **`EVIDENCE`** (with SHA-256 digital forensics), and **`CASE_HEARING`** with full foreign-key referential integrity in Oracle APEX Object Browser."*
