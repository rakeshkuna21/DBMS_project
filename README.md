# 🏛️ National Cyber Crime Reporting & Management Portal

> Ministry of Home Affairs | Government of India (Academic Production Portal)

🌐 **Live 24/7 Web Portal:** [https://rakeshkuna21.github.io/DBMS_project/](https://rakeshkuna21.github.io/DBMS_project/)

## Course: Database Management Systems (DBMS)
**Project Engineers:** Krish Vats, Sai Dheepak, Rakeesh, and Shanmukh

---

## 📋 Project Overview

A full-stack web application for managing cyber crime complaints, investigations, evidence tracking, suspect management, and court hearing scheduling. Built with a professional Indian Government design system (GovTech UI/UX).

---

## 🏛️ High-Level Architecture (Hybrid 3-Tier Architecture)

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

### 🛠️ Key Components & How It Was Built
1. **Frontend & Client-Side Engine (`React + Vite`)**:
   - **Citizen Portal**: Multi-step complaint filing wizard, OTP-based verification, complaint tracking, and judicial court hearings schedule.
   - **Investigator Desk**: Assigned to 44 real police officers across CBI, I4C, Delhi IFSO, and State Cyber Cells. Officers can update case status (e.g., to *"In Court"*).
   - **Autonomous In-Browser Adapter (`mockApiAdapter.js`)**: Simulates Oracle 11g SQL queries directly in the browser when running on GitHub Pages. Intercepts status updates: if an officer marks a case as *"In Court"*, it auto-schedules a court hearing with Judge, Courtroom, and Section 66D IT Act freeze orders.
2. **Real-Time Cloud Relay**:
   - Serves as a 24/7 live bridge between GitHub Pages and your laptop. Whenever anyone registers or submits a complaint from their phone or laptop, it broadcasts the payload instantly to the cloud relay.
3. **Automatic Oracle 11g Sync Worker (`sync_to_oracle.js`)**:
   - Built with Node.js and Oracle’s official `oracledb` C-binary client library connecting directly to `localhost/XE` under schema `EAC_24037_RAKESH`.
   - **Automatic Relational Enrichment**: When you run `npm run sync-to-oracle`, it:
     - Inserts citizens into **`LOGIN`** and **`VICTIM`** using Oracle sequences (`SEQ_USER_ID`, `SEQ_VICTIM_ID`).
     - Inserts complaints into **`CYBER_CRIME_CASE`** and assigns duty officers based on crime category.
     - Auto-generates hardware records in **`DIGITAL_DEVICE`** (seized phones/laptops with MAC addresses and OS).
     - Auto-generates forensic artifacts in **`EVIDENCE`** (SHA-256 hashes, file sizes, IP addresses, vault locations).
     - Auto-schedules proceedings in **`CASE_HEARING`** (scheduled hearing dates, Judge Hon. K. Ramanathan, Court Hall No. 3).
     - Auto-tracks primary suspects in **`SUSPECT`** with statutory charges under IT Act Sec 66C/66D & IPC 420.

### 🎯 30-Second Viva Pitch for Your Examiner:
> *"Our National Cyber Crime Management System uses a **hybrid 3-tier architecture**. The public-facing portal is deployed live on GitHub Pages for citizens to file complaints 24/7. When complaints or investigations reach the 'In Court' stage, our automated sync engine pulls the data into our local **Oracle 11g Express database**, auto-populating relational tables like **`DIGITAL_DEVICE`**, **`EVIDENCE`** (with SHA-256 digital forensics), and **`CASE_HEARING`** with full foreign-key referential integrity in Oracle APEX Object Browser."*

## 🗃️ Database Architecture (11 Entities)

| # | Entity | Description |
|---|--------|-------------|
| 1 | LOGIN | User authentication with role-based access |
| 2 | VICTIM | Citizen who filed the complaint |
| 3 | POLICE_DEPARTMENT | Cyber crime investigation units |
| 4 | INVESTIGATOR | Officers assigned to cases |
| 5 | CYBER_CRIME_TYPE | Classification of cyber crimes |
| 6 | CYBER_CRIME_CASE | Central case entity |
| 7 | DIGITAL_DEVICE | Devices involved in the crime |
| 8 | EVIDENCE | Digital forensic evidence |
| 9 | SUSPECT | Persons of interest |
| 10 | COURT | Courts handling cyber cases |
| 11 | CASE_HEARING | Weak entity - hearing schedule |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | Oracle Express 11g (with in-memory fallback) |
| Styling | Custom CSS (Indian GovTech Design System) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Oracle Express 11g (optional - system works without it)

### Installation & Run

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Start backend server (port 5000)
cd ../backend
npm start

# 4. Start frontend dev server (port 3000)
cd ../frontend
npm run dev
```

Then open **http://localhost:3000** in your browser.

### Oracle Database Setup (Optional)

If you have Oracle Express 11g installed:

```bash
# Connect to SQL*Plus and run the setup script
sqlplus system/oracle@localhost/XE @oracle_setup.sql
```

The system will automatically detect and connect to Oracle. If Oracle is offline, it seamlessly falls back to an in-memory data store with pre-populated sample data.

## 🔐 Law Enforcement Officer Credentials

Officer accounts are pre-commissioned by Ministry / State Cyber Police Cells across 8 agencies:

| Agency | Duty Circle Badge ID | Officer Name & Rank | Password |
| :--- | :--- | :--- | :--- |
| **CBI Cyber Division** | `CBI-CYB-101` | SP Arvind Swaminathan | `Kavach@2026` |
| **CBI Cyber Division** | `CBI-CYB-102` | DSP Rajeshwari Deshmukh | `Kavach@2026` |
| **I4C National Cyber Cell** | `I4C-INV-201` | DCP Rajesh Kumar | `Kavach@2026` |
| **I4C National Cyber Cell** | `I4C-INV-202` | ACP Kiran Varma | `Kavach@2026` |
| **Delhi Police IFSO** | `DL-POL-301` | ACP Rakesh Sharma | `Kavach@2026` |
| **Maharashtra Cyber Police** | `MH-POL-401` | Sr. PI Sanjay Patil | `Kavach@2026` |
| **Karnataka CID Cyber Division**| `KA-POL-501` | DySP Anand Gowda | `Kavach@2026` |
| **Telangana Cyber Crime PS** | `TS-POL-601` | ACP B. Sudhakar Reddy | `Kavach@2026` |
| **Tamil Nadu CID Cyber Wing** | `TN-POL-701` | DSP Murugan S | `Kavach@2026` |
| **West Bengal Cyber Cell** | `WB-POL-801` | Insp. Anirban Mukherjee | `Kavach@2026` |

> **Citizen Sign Up:** Citizens can self-register using the **"New Citizen Registration"** tab with mobile number and SMS OTP. Officer accounts are restricted and pre-commissioned.

## 📱 Application Views

### View 1: Public Portal
- Role-based login (Citizen / Investigator)
- Quick case status tracker (search by Case ID)
- Cyber crime awareness cards

### View 2: Citizen Portal
- File new cyber crime complaint (multi-step form)
- View my reported cases and hearing schedule

### View 3: Investigator Dashboard
- KPI summary cards (Total Cases, Active Investigations, etc.)
- Case management table with inline editing
- Manage case entities: Evidence, Suspects, Court Hearings

## 📋 SQL Log Viewer
Click the "📋 SQL Logs" button (bottom-right) to see all Oracle SQL queries generated by the application in real-time.

---

*This is an academic project built for DBMS coursework. Not for production government use.*
