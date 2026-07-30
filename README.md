# 👨‍👩‍👧‍👦 FamLedger - Full-Stack Household Financial Ledger

**FamLedger** is a full-stack household finance mobile application that bridges personal multi-account expense tracking with family financial transparency. It supports personal ledger management, shared family household scoping, interactive analytics, role-based oversight, and automated allowances.

---

## 🛠️ Monorepo Architecture

This repository is organized as a monorepo containing both the backend and frontend services:

```text
FamLedger/
 ├── backend/        # Spring Boot 3 REST API (Java 17, Spring Security, JPA, Resend SMTP)
 ├── frontend/       # React Native Mobile App (Expo SDK 54, TypeScript, Expo Router)
 ├── .gitignore      # Global monorepo rules
 └── README.md       # Project documentation


✨ Key Features
🔐 JWT Authentication & Security: Stateless user authentication using JSON Web Tokens (JWT) with BCrypt password hashing.

👤 Personal & Household Scoping: Manage individual financial accounts or switch to family household mode seamlessly.

👨‍👩‍👧 Role-Based Family Visibility: Dynamic role mapping (PARENT / CHILD) per household with member leaderboards.

📊 Interactive Visual Analytics: Category spending breakdown with color-coded SVG donut charts and category distributions.

📑 Excel Statement Export: Export account transactions directly into .xlsx spreadsheet files to device storage.

⚡ Allowance Automation: Scheduled recurring transfers for children with automated email notifications via Resend SMTP.

🔍 Audit Logs & Integrity: Immutable snapshot history for account transactions and modifications.


🚀 Tech Stack
Frontend (Mobile App)
Framework: React Native with Expo (SDK 54, Expo Router / Tabs)

Language: TypeScript

State & Networking: Axios, React Context API

Graphics & Charts: react-native-svg

Storage & Sharing: expo-file-system, expo-sharing

Backend (REST API)
Language & Runtime: Java 17, Spring Boot 3

Database: PostgreSQL (Hosted on Supabase) via Spring Data JPA

Security: Spring Security, JWT (HS256)

Reporting: Apache POI (Excel generation)

Email Service: Resend SMTP / JavaMail



⚙️ Local Development SetupPrerequisitesJava: JDK 17 or higherNode.js: LTS version (v18+)Expo Go App: Installed on iOS or Android device for mobile testing1. Backend Setup (Spring Boot)Navigate to the backend/ directory:Bashcd backend
Configure Environment Variables in IntelliJ IDEA (Run Configurations $\rightarrow$ Environment Variables) or via your system environment:SPRING_DATASOURCE_URL = jdbc:postgresql://<SUPABASE_HOST>:5432/postgresSPRING_DATASOURCE_USERNAME = postgresSPRING_DATASOURCE_PASSWORD = <YOUR_DATABASE_PASSWORD>JWT_SECRET = <YOUR_32_CHAR_SECRET_KEY>RESEND_API_KEY = <YOUR_RESEND_API_KEY>Build and run the Spring Boot server:Bash./mvnw clean spring-boot:run
(Server starts on http://localhost:8080)2. Frontend Setup (React Native Expo)Open a new terminal and navigate to the frontend/ directory:Bashcd frontend
Install node dependencies:Bashnpm install
Create a .env file inside frontend/:Code snippetEXPO_PUBLIC_API_URL=http://YOUR_LOCAL_WIFI_IP:8080/api
(Replace YOUR_LOCAL_WIFI_IP with your computer's local Wi-Fi IP address, e.g. http://192.168.1.5:8080/api)Start the Expo development server:Bashnpx expo start
Scan the displayed QR code using the Expo Go app on your physical mobile phone.



🔒 Security & Environment Variables
All sensitive parameters (DB credentials, API keys, JWT secret tokens) are decoupled from source control using environment variables.

Root, backend, and frontend .gitignore rules prevent staging .env files and target build directories (/target/, node_modules/).

Refer to .env.example in each directory for required environment variables.
