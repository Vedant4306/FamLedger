# 👨‍👩‍👧‍👦 FamLedger - Full-Stack Household Financial Ledger

**FamLedger** is a full-stack household finance mobile application that bridges personal multi-account expense tracking with family financial transparency.

It supports:

- 💰 Personal ledger management
- 👨‍👩‍👧 Shared family household finance
- 📊 Interactive spending analytics
- 🔐 Secure role-based access
- ⚡ Automated recurring allowances
- 📄 Excel statement exports
- 📝 Immutable audit logging

---

# 📂 Monorepo Architecture

```text
FamLedger/
├── backend/        # Spring Boot 3 REST API (Java 17, Spring Security, JPA)
├── frontend/       # React Native Mobile App (Expo SDK 54, TypeScript)
├── .gitignore      # Global monorepo rules
└── README.md       # Project documentation
```

---

# ✨ Features

## 🔐 Authentication & Security

- JWT-based stateless authentication
- BCrypt password hashing
- Spring Security integration
- Protected REST APIs

---

## 👤 Personal & Household Accounts

- Personal financial accounts
- Shared household mode
- Multiple account management
- Household switching

---

## 👨‍👩‍👧 Role-Based Family Management

- Parent / Child permissions
- Household member management
- Family leaderboards
- Controlled financial visibility

---

## 📊 Interactive Analytics

- Category-wise spending insights
- SVG donut charts
- Color-coded expense visualization
- Spending distribution reports

---

## 📄 Excel Statement Export

- Export transactions to `.xlsx`
- Device storage download
- Generated using Apache POI

---

## ⚡ Automated Allowances

- Scheduled recurring transfers
- Parent-to-child allowance automation
- Email notifications using Resend SMTP

---

## 📝 Audit Logs

- Immutable transaction history
- Modification snapshots
- Financial integrity tracking

---

# 🚀 Tech Stack

## 📱 Frontend

| Technology | Description |
|------------|-------------|
| React Native | Mobile Application |
| Expo SDK 54 | Development Framework |
| Expo Router | Navigation |
| TypeScript | Language |
| Axios | API Communication |
| React Context API | State Management |
| react-native-svg | Charts & Graphics |
| expo-file-system | File Storage |
| expo-sharing | File Sharing |

---

## ⚙️ Backend

| Technology | Description |
|------------|-------------|
| Java 17 | Programming Language |
| Spring Boot 3 | REST API |
| Spring Security | Authentication & Authorization |
| Spring Data JPA | ORM |
| PostgreSQL (Supabase) | Database |
| JWT (HS256) | Authentication |
| Apache POI | Excel Generation |
| JavaMail + Resend SMTP | Email Service |

---

# ⚙️ Local Development Setup

## Prerequisites

- Java JDK 17+
- Node.js v18+
- npm
- Expo Go (Android/iOS)
- PostgreSQL (Supabase)

---

# 1️⃣ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Configure the following environment variables:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://<SUPABASE_HOST>:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<YOUR_DATABASE_PASSWORD>

JWT_SECRET=<YOUR_32_CHARACTER_SECRET>

RESEND_API_KEY=<YOUR_RESEND_API_KEY>
```

Run the Spring Boot application:

```bash
./mvnw clean spring-boot:run
```

Backend runs at:

```
http://localhost:8080
```

---

# 2️⃣ Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the frontend folder:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_WIFI_IP:8080/api
```

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:8080/api
```

Start the Expo development server:

```bash
npx expo start
```

Then:

- Open **Expo Go**
- Scan the generated QR code
- The application will launch on your mobile device

---

# 🔒 Environment Variables

Sensitive credentials are **never committed** to source control.

The following are configured using environment variables:

- Database credentials
- JWT Secret
- Resend API Key
- API URLs

The repository's `.gitignore` excludes:

```text
node_modules/
target/
.env
```

Each service includes an `.env.example` file containing the required configuration.

---

# 📁 Project Structure

```text
FamLedger
│
├── backend
│   ├── src
│   ├── pom.xml
│   └── ...
│
├── frontend
│   ├── app
│   ├── components
│   ├── assets
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

# 📌 Highlights

- 🔐 Secure JWT Authentication
- 👨‍👩‍👧 Household Finance Management
- 💳 Multi-Account Ledger
- 📊 Expense Analytics
- 📄 Excel Statement Export
- ⚡ Automated Allowances
- 📧 Email Notifications
- 📝 Audit Logging
- 📱 Cross-platform Mobile App
- ☁️ PostgreSQL hosted on Supabase

---

## 👨‍💻 Built With

- Java 17
- Spring Boot 3
- Spring Security
- PostgreSQL (Supabase)
- React Native
- Expo SDK 54
- TypeScript
- Apache POI
- Resend SMTP
- JWT Authentication

---
