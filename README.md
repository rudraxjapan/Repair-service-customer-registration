# Calibre Repair — Repair Service Management System

A full-stack Repair Service Management System built with **React + TypeScript + Tailwind CSS** (Web) and **Kotlin + Jetpack Compose + MVVM** (Android), backed by **Firebase Authentication** and **Cloud Firestore**.

---

## Core Features

- **Customer Registration & Profile Management**
  - Captures validated customer details: Full Name, 10-digit Mobile Number, Email Address, Complete Address, City (letters only), and 6-digit PIN Code.
  - Strict owner-only PII isolation enforced in `firestore.rules`.
- **Repair Request Submission & Tracking**
  - Supports categories (`Mobile`, `Laptop`, `Computer`, `Television`, `Refrigerator`, `Washing Machine`, `Other`), device brand/model, problem description, preferred date, and service type (`Home Service` / `Service Center`).
  - Automatically generates a unique tracking ID (`REP-YYYYMMDD-XXXXXX`) and syncs status updates in real time.
- **Role-Based Admin Dashboard**
  - Protected strictly by verified Firebase Auth and the `/admins/{uid}` Firestore registry.
  - Allows administrators to search customers by name/mobile, inspect full ticket & address details, filter by status, and update repair statuses (`Pending`, `Accepted`, `In Progress`, `Completed`, `Cancelled`) with technician notes.
- **Native Android App (`android-app/`)**
  - Built with Kotlin, Jetpack Compose, Material 3, StateFlow MVVM, and Firebase Auth + Firestore real-time listeners.
  - Includes email sign-in/registration, email verification gate, password reset, customer registration, repair submission, request tracking, and admin dashboard.

---

## Repository Structure

```text
├── src/                      # React + TypeScript web application
│   ├── components/           # UI views, forms, auth modal, admin console
│   ├── services/             # Firestore real-time listeners & validated writes
│   ├── types/                # Shared TypeScript interfaces & enums
│   └── utils/                # Blueprint-synchronized input validators
├── android-app/              # Complete Android Studio (Kotlin + Compose) project
├── firestore.rules           # Production Cloud Firestore security rules
├── firebase-blueprint.json   # Data model schema & validation blueprint
├── security_spec.md          # Security invariants & adversarial test cases
└── firestore.rules.test.ts   # Dirty Dozen security rule test matrix
```

---

## Security Architecture

- **Default-Deny Firestore Rules:** Every unmatched path is denied (`allow read, write: if false`).
- **Verified Authentication Gate:** All customer and admin Firestore operations require `request.auth != null && request.auth.token.email_verified == true`.
- **PII Isolation:** Customers can read/write only their own `/customers/{uid}` document and their own `/repairRequests`. Only admins can list all customers or repair tickets.
- **Validation Synchronicity:** Field lengths, types, enums, and regex patterns (`mobileNumber`, `city`, `pinCode`, `preferredDate`) are enforced identically on the Web UI, Android Kotlin validators, and `firestore.rules`.
- **Secrets Excluded:** `firebase-applet-config.json`, `google-services.json`, `local.properties`, and `.env*` files are excluded via `.gitignore`.

---

## Setup Guide (Running Locally)

### 1. Firebase Project Setup
1. Create or open a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication → Sign-in method** for **Email/Password** (and **Google** for the Web app).
3. Enable **Cloud Firestore** and deploy `firestore.rules`.
4. To grant administrator access to an account, create a document in Cloud Firestore:
   - **Collection:** `admins`
   - **Document ID:** `<user-firebase-auth-uid>`
   - **Fields:** `{ "uid": "<user-firebase-auth-uid>", "email": "<admin-email>", "role": "admin" }`

### 2. Web App Setup
1. Copy `firebase-applet-config.example.json` to `firebase-applet-config.json` and fill in your Firebase Web App credentials.
2. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```

### 3. Android App Setup
1. Open the `android-app/` folder in **Android Studio (Ladybug or newer)** with **Gradle JDK 17**.
2. Register Android package `com.repairservice.app` in Firebase Console and place `google-services.json` into `android-app/app/`.
3. Update `FIRESTORE_DATABASE_ID` in `RepairServiceApp.kt` if using a custom database ID (`"(default)"` for standard databases).
4. Run **Build → Build Bundle(s) / APK(s) → Build APK(s)** or run directly on an Android device.
