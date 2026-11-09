-- =================================================================
-- ORACLE EXPRESS 11g DATABASE SCRIPT
-- NATIONAL CYBER CRIME MANAGEMENT SYSTEM
-- =================================================================
-- Course: Database Management Systems (DBMS)
-- Developed by: Kiran Vata, Sai Dheepak, Kuna Rakesh, Shanmukha Reddy
-- =================================================================

SET DEFINE OFF;
SET ECHO ON;
SET FEEDBACK ON;

-- =================================================================
-- DROP EXISTING OBJECTS (For Clean Re-Installation)
-- =================================================================
BEGIN EXECUTE IMMEDIATE 'DROP TABLE CASE_HEARING CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE EVIDENCE CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE SUSPECT CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE DIGITAL_DEVICE CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE CYBER_CRIME_CASE CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE INVESTIGATOR CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE VICTIM CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE CYBER_CRIME_TYPE CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE POLICE_DEPARTMENT CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE COURT CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE LOGIN CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_USER_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_VICTIM_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_CASE_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_DEVICE_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_EVIDENCE_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_SUSPECT_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- =================================================================
-- 1. LOGIN TABLE
-- =================================================================
CREATE TABLE LOGIN (
    USER_ID NUMBER PRIMARY KEY,
    USERNAME VARCHAR2(50) UNIQUE NOT NULL,
    PASSWORD VARCHAR2(100) NOT NULL,
    ROLE VARCHAR2(20) CHECK (ROLE IN ('Victim', 'Investigator', 'Admin'))
);

-- =================================================================
-- 2. VICTIM TABLE (Includes flattened composite attributes Name & Address)
-- =================================================================
CREATE TABLE VICTIM (
    VICTIM_ID NUMBER PRIMARY KEY,
    USER_ID NUMBER REFERENCES LOGIN(USER_ID),
    FIRST_NAME VARCHAR2(50) NOT NULL,
    MIDDLE_NAME VARCHAR2(50),
    LAST_NAME VARCHAR2(50) NOT NULL,
    DOB DATE NOT NULL,
    GENDER VARCHAR2(15),
    EMAIL VARCHAR2(100),
    PHONE VARCHAR2(15) NOT NULL,
    STREET VARCHAR2(100),
    CITY VARCHAR2(50),
    STATE VARCHAR2(50),
    PINCODE VARCHAR2(10)
);

-- =================================================================
-- 3. POLICE DEPARTMENT TABLE
-- =================================================================
CREATE TABLE POLICE_DEPARTMENT (
    DEPARTMENT_ID NUMBER PRIMARY KEY,
    DEPARTMENT_NAME VARCHAR2(100) NOT NULL,
    CONTACT_NUMBER VARCHAR2(15),
    STREET VARCHAR2(100),
    CITY VARCHAR2(50),
    STATE VARCHAR2(50),
    PINCODE VARCHAR2(10)
);

-- =================================================================
-- 4. INVESTIGATOR TABLE
-- =================================================================
CREATE TABLE INVESTIGATOR (
    INVESTIGATOR_ID NUMBER PRIMARY KEY,
    USER_ID NUMBER REFERENCES LOGIN(USER_ID),
    DEPARTMENT_ID NUMBER REFERENCES POLICE_DEPARTMENT(DEPARTMENT_ID),
    NAME VARCHAR2(100) NOT NULL,
    RANK VARCHAR2(50) NOT NULL,
    EMAIL VARCHAR2(100),
    PHONE VARCHAR2(15) NOT NULL
);

-- =================================================================
-- 5. CYBER CRIME TYPE TABLE
-- =================================================================
CREATE TABLE CYBER_CRIME_TYPE (
    CRIME_TYPE_ID NUMBER PRIMARY KEY,
    CRIME_TYPE_NAME VARCHAR2(100) NOT NULL,
    CATEGORY VARCHAR2(50),
    SEVERITY_LEVEL VARCHAR2(20),
    DESCRIPTION VARCHAR2(500)
);

-- =================================================================
-- 6. CYBER CRIME CASE TABLE (Central Entity)
-- =================================================================
CREATE TABLE CYBER_CRIME_CASE (
    CASE_ID NUMBER PRIMARY KEY,
    VICTIM_ID NUMBER REFERENCES VICTIM(VICTIM_ID),
    INVESTIGATOR_ID NUMBER REFERENCES INVESTIGATOR(INVESTIGATOR_ID),
    CRIME_TYPE_ID NUMBER REFERENCES CYBER_CRIME_TYPE(CRIME_TYPE_ID),
    CASE_TITLE VARCHAR2(150) NOT NULL,
    INCIDENT_DATE DATE NOT NULL,
    REPORTED_DATE DATE DEFAULT SYSDATE,
    COMPLAINT_MODE VARCHAR2(30) DEFAULT 'Online Portal',
    DESCRIPTION VARCHAR2(1000) NOT NULL,
    CASE_STATUS VARCHAR2(30) DEFAULT 'Pending',
    PRIORITY_LEVEL VARCHAR2(20) DEFAULT 'Medium',
    ASSIGNED_DATE DATE
);

-- =================================================================
-- 7. DIGITAL DEVICE TABLE
-- =================================================================
CREATE TABLE DIGITAL_DEVICE (
    DEVICE_ID NUMBER PRIMARY KEY,
    CASE_ID NUMBER REFERENCES CYBER_CRIME_CASE(CASE_ID),
    DEVICE_TYPE VARCHAR2(50) NOT NULL,
    BRAND VARCHAR2(50),
    MODEL VARCHAR2(50),
    SERIAL_NO VARCHAR2(50),
    MAC_ADDRESS VARCHAR2(50),
    OPERATING_SYSTEM VARCHAR2(50)
);

-- =================================================================
-- 8. EVIDENCE TABLE
-- =================================================================
CREATE TABLE EVIDENCE (
    EVIDENCE_ID NUMBER PRIMARY KEY,
    CASE_ID NUMBER REFERENCES CYBER_CRIME_CASE(CASE_ID),
    DEVICE_ID NUMBER REFERENCES DIGITAL_DEVICE(DEVICE_ID),
    EVIDENCE_TYPE VARCHAR2(50) NOT NULL,
    FILE_HASH VARCHAR2(128),
    FILE_SIZE VARCHAR2(30),
    COLLECTION_DATE DATE DEFAULT SYSDATE,
    IP_ADDRESS VARCHAR2(45),
    STORAGE_LOCATION VARCHAR2(200)
);

-- =================================================================
-- 9. SUSPECT TABLE (Includes relationship attributes from 'Involves')
-- =================================================================
CREATE TABLE SUSPECT (
    SUSPECT_ID NUMBER PRIMARY KEY,
    CASE_ID NUMBER REFERENCES CYBER_CRIME_CASE(CASE_ID),
    NAME VARCHAR2(100) NOT NULL,
    GENDER VARCHAR2(15),
    CRIMINAL_HISTORY VARCHAR2(500),
    STREET VARCHAR2(100),
    CITY VARCHAR2(50),
    STATE VARCHAR2(50),
    PINCODE VARCHAR2(10),
    PHONE VARCHAR2(15),
    EMAIL VARCHAR2(100),
    INVOLVEMENT_TYPE VARCHAR2(50),
    ARREST_STATUS VARCHAR2(30) DEFAULT 'At Large',
    CHARGES VARCHAR2(200)
);

-- =================================================================
-- 10. COURT TABLE
-- =================================================================
CREATE TABLE COURT (
    COURT_ID NUMBER PRIMARY KEY,
    COURT_NAME VARCHAR2(100) NOT NULL,
    COURT_TYPE VARCHAR2(50),
    LOCATION VARCHAR2(100),
    CONTACT_NO VARCHAR2(15)
);

-- =================================================================
-- 11. CASE HEARING TABLE (Weak Entity with Composite Primary Key)
-- =================================================================
CREATE TABLE CASE_HEARING (
    CASE_ID NUMBER REFERENCES CYBER_CRIME_CASE(CASE_ID),
    HEARING_NO NUMBER,
    COURT_ID NUMBER REFERENCES COURT(COURT_ID),
    HEARING_DATE DATE NOT NULL,
    HEARING_STATUS VARCHAR2(30),
    VERDICT VARCHAR2(200),
    NEXT_HEARING_DATE DATE,
    JUDGE_NAME VARCHAR2(100),
    COURT_ROOM_NO VARCHAR2(20),
    PRIMARY KEY (CASE_ID, HEARING_NO)
);

-- =================================================================
-- SEQUENCES FOR ORACLE 11g AUTO-ID GENERATION
-- =================================================================
CREATE SEQUENCE SEQ_USER_ID START WITH 106 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_VICTIM_ID START WITH 1003 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_CASE_ID START WITH 202404 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_DEVICE_ID START WITH 5003 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_EVIDENCE_ID START WITH 6003 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_SUSPECT_ID START WITH 7003 INCREMENT BY 1 NOCACHE;

-- =================================================================
-- SAMPLE SEED DATA
-- =================================================================

-- Login Users
INSERT INTO LOGIN VALUES (101, 'citizen_ramesh', 'pass123', 'Victim');
INSERT INTO LOGIN VALUES (102, 'insp_vikram', 'police123', 'Investigator');
INSERT INTO LOGIN VALUES (103, 'citizen_priya', 'pass456', 'Victim');
INSERT INTO LOGIN VALUES (104, 'si_lakshmi', 'police456', 'Investigator');
INSERT INTO LOGIN VALUES (105, 'admin_cyber', 'admin123', 'Admin');

-- Police Departments
INSERT INTO POLICE_DEPARTMENT VALUES (1, 'Cyberabad Cyber Crime Cell', '040-27852412', 'Gachibowli Road', 'Hyderabad', 'Telangana', '500032');
INSERT INTO POLICE_DEPARTMENT VALUES (2, 'Delhi Cyber Crime Unit (IFSO)', '011-26241000', 'Mandir Marg', 'New Delhi', 'Delhi', '110001');
INSERT INTO POLICE_DEPARTMENT VALUES (3, 'Maharashtra Cyber Cell', '022-22621855', 'BKC Complex', 'Mumbai', 'Maharashtra', '400051');

-- Cyber Crime Types
INSERT INTO CYBER_CRIME_TYPE VALUES (1, 'UPI & Banking Phishing', 'Financial Fraud', 'High', 'Unauthorized electronic funds transfer via deceptive links');
INSERT INTO CYBER_CRIME_TYPE VALUES (2, 'Social Media Impersonation', 'Identity Theft', 'Medium', 'Creating fake profiles to extort or defame citizens');
INSERT INTO CYBER_CRIME_TYPE VALUES (3, 'Ransomware Attack', 'Malware', 'Critical', 'Encryption of victim data with ransom demands in cryptocurrency');
INSERT INTO CYBER_CRIME_TYPE VALUES (4, 'Online Job Fraud', 'Financial Fraud', 'High', 'Fake job postings demanding registration fees from candidates');
INSERT INTO CYBER_CRIME_TYPE VALUES (5, 'Cyberstalking & Harassment', 'Cyber Harassment', 'Medium', 'Persistent online harassment, threats, or surveillance of individuals');
INSERT INTO CYBER_CRIME_TYPE VALUES (6, 'Data Breach / Unauthorized Access', 'Hacking', 'Critical', 'Unauthorized intrusion into systems to steal sensitive personal or corporate data');

-- Victims
INSERT INTO VICTIM VALUES (1001, 101, 'Ramesh', 'Kumar', 'Sharma', TO_DATE('1990-05-14', 'YYYY-MM-DD'), 'Male', 'ramesh@email.in', '9876543210', '12 MG Road', 'Hyderabad', 'Telangana', '500001');
INSERT INTO VICTIM VALUES (1002, 103, 'Priya', NULL, 'Nair', TO_DATE('1988-11-22', 'YYYY-MM-DD'), 'Female', 'priya.nair@gmail.com', '8765432109', '45 Anna Nagar', 'Chennai', 'Tamil Nadu', '600040');

-- Investigators
INSERT INTO INVESTIGATOR VALUES (201, 102, 1, 'Vikram Rathore', 'Inspector (Cyber Cell)', 'vikram.cyber@gov.in', '9123456789');
INSERT INTO INVESTIGATOR VALUES (202, 104, 2, 'Lakshmi Menon', 'Sub-Inspector (IFSO)', 'lakshmi.ifso@gov.in', '9234567890');

-- Courts
INSERT INTO COURT VALUES (1, 'Metropolitan Sessions Court - Cyber Wing', 'District Sessions', 'Nampally, Hyderabad', '040-23234567');
INSERT INTO COURT VALUES (2, 'Patiala House Court - Cyber Division', 'District Court', 'New Delhi', '011-23384480');

-- Cyber Crime Cases
INSERT INTO CYBER_CRIME_CASE VALUES (202401, 1001, 201, 1, 'Unauthorized UPI Deduction of Rs 45,000', TO_DATE('2025-02-10', 'YYYY-MM-DD'), SYSDATE, 'Online Portal', 'Received fake electricity bill SMS and clicked phishing link. Rs 45,000 debited from SBI account via UPI.', 'Under Investigation', 'High', SYSDATE);
INSERT INTO CYBER_CRIME_CASE VALUES (202402, 1002, 202, 2, 'Instagram Impersonation & Defamation', TO_DATE('2025-03-01', 'YYYY-MM-DD'), SYSDATE, 'Online Portal', 'Fake Instagram profile created using victim photos. Defamatory messages sent to contacts.', 'In Court', 'Medium', SYSDATE);
INSERT INTO CYBER_CRIME_CASE VALUES (202403, 1001, 201, 4, 'Fake TCS Job Offer - Rs 1.2L Lost', TO_DATE('2025-04-15', 'YYYY-MM-DD'), SYSDATE, 'Helpline 1930', 'Received fake TCS offer letter. Paid Rs 1,20,000 as security deposit to fraudulent account.', 'Pending', 'High', NULL);

-- Digital Devices
INSERT INTO DIGITAL_DEVICE VALUES (5001, 202401, 'Smartphone', 'Samsung', 'Galaxy S23', 'SN99887766', '00:1B:44:11:3A:B7', 'Android 14');
INSERT INTO DIGITAL_DEVICE VALUES (5002, 202402, 'Laptop', 'HP', 'Pavilion 15', 'HP2024X1234', '00:1A:2B:3C:4D:5E', 'Windows 11');

-- Evidence
INSERT INTO EVIDENCE VALUES (6001, 202401, 5001, 'Transaction Screenshot & APK Log', 'e3b0c44298fc1c149afbf4c8996fb924', '2.4 MB', SYSDATE, '103.21.244.0', '/evidence_vault/202401/apk_log.bin');
INSERT INTO EVIDENCE VALUES (6002, 202402, 5002, 'Browser History & Chat Logs', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', '15.7 MB', SYSDATE, '49.36.128.11', '/evidence_vault/202402/chat_export.zip');

-- Suspects
INSERT INTO SUSPECT VALUES (7001, 202401, 'Unknown Jamtara Operator (Tracked via Mule A/C)', 'Male', 'Repeat Offender - Phishing Ring', 'Sector 4', 'Jamtara', 'Jharkhand', '815351', '8899001122', 'fraudster@darkmail.com', 'Primary Accused', 'Tracked', 'IT Act Sec 66C, 66D & IPC 420');
INSERT INTO SUSPECT VALUES (7002, 202402, 'Arjun Malhotra', 'Male', 'First Offence', '78 Lajpat Nagar', 'New Delhi', 'Delhi', '110024', '7788990011', NULL, 'Primary Accused', 'Arrested', 'IT Act Sec 66C, IPC 500');

-- Case Hearings
INSERT INTO CASE_HEARING VALUES (202401, 1, 1, TO_DATE('2025-03-05', 'YYYY-MM-DD'), 'Completed', 'Pending Bank Nodal Freeze Report', TO_DATE('2025-03-20', 'YYYY-MM-DD'), 'Hon. Justice S. Narasimha', 'Room 4B');
INSERT INTO CASE_HEARING VALUES (202401, 2, 1, TO_DATE('2025-03-20', 'YYYY-MM-DD'), 'Scheduled', NULL, TO_DATE('2025-04-10', 'YYYY-MM-DD'), 'Hon. Justice S. Narasimha', 'Room 4B');
INSERT INTO CASE_HEARING VALUES (202402, 1, 2, TO_DATE('2025-04-01', 'YYYY-MM-DD'), 'Completed', 'Accused remanded to judicial custody', TO_DATE('2025-04-15', 'YYYY-MM-DD'), 'Hon. Justice M. Krishnan', 'Room 2A');

COMMIT;

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================
SELECT 'LOGIN' AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM LOGIN
UNION ALL SELECT 'VICTIM', COUNT(*) FROM VICTIM
UNION ALL SELECT 'POLICE_DEPARTMENT', COUNT(*) FROM POLICE_DEPARTMENT
UNION ALL SELECT 'INVESTIGATOR', COUNT(*) FROM INVESTIGATOR
UNION ALL SELECT 'CYBER_CRIME_TYPE', COUNT(*) FROM CYBER_CRIME_TYPE
UNION ALL SELECT 'CYBER_CRIME_CASE', COUNT(*) FROM CYBER_CRIME_CASE
UNION ALL SELECT 'DIGITAL_DEVICE', COUNT(*) FROM DIGITAL_DEVICE
UNION ALL SELECT 'EVIDENCE', COUNT(*) FROM EVIDENCE
UNION ALL SELECT 'SUSPECT', COUNT(*) FROM SUSPECT
UNION ALL SELECT 'COURT', COUNT(*) FROM COURT
UNION ALL SELECT 'CASE_HEARING', COUNT(*) FROM CASE_HEARING;

-- =================================================================
-- END OF SCRIPT
-- =================================================================
EXIT;
