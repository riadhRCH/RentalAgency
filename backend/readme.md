# 📞 Call-to-Lead: Intelligent Rental Lead Tracker

## 🚀 Overview
Call-to-Lead is a specialized B2B platform designed for rental agencies to ensure no potential tenant is ever missed. Many agencies lose leads when customers call phone numbers found in listings without a formal tracking system.

This application intercepts incoming calls, records them, and automatically generates a structured Lead in a MongoDB database, allowing agencies to manage their pipeline effectively through a centralized dashboard.

## 🛠 The Solution (V1)
In the current version, the app solves the "Hidden Lead" problem by:
- **Provisioning Virtual Numbers**: Agencies get unique phone numbers to put in their ads.
- **Call Bridging**: When a customer calls, the app records the conversation and bridges the call to the agency's real phone.
- **Automatic Lead Generation**: Immediately upon call completion, a new lead document is created with caller metadata and recording links.
- **Personnel-Centric Identity**: Every person in the system (agent, owner, client) is a single `Personnel` record identified by their phone number.

## 🏗 Solution Architecture
The system is designed around a 4-Layer Architecture.

| Layer | Status | Description |
|---|---|---|
| 1. Telephony/VOIP | ACTIVE | Handles inbound calls, recording, and call routing via Twilio. |
| 2. Backend API | ACTIVE | NestJS application managing business logic, webhooks, and agency accounts. |
| 3. Intelligence/AI | ⏳ TODO | AI-driven transcription and automatic field extraction (Budget, Move-in date). |
| 4. Omni-Channel | ⏳ TODO | Lead ingestion from Instagram, WhatsApp, and Facebook. |

## 💻 Tech Stack (V1)
- **Framework**: NestJS (Backend), Angular (Frontend)
- **Database**: MongoDB via Mongoose
- **Telephony**: Twilio
- **Authentication**: JWT (Personnel-based) + Agency Context Headers

## 🔐 Authentication & Authorization
The system uses a decoupled authentication model where users (Personnel) are independent of the entities they interact with (Agencies).

1.  **Identity (JWT)**: The JWT token contains the `personnelId`. It represents **WHO** the user is.
2.  **Context (Header)**: To perform agency-specific actions (e.g., viewing leads), the client must provide the `X-Agency-ID` header.
3.  **Validation**: The `AgencyGuard` verifies that the authenticated user is either the **Owner** or a **Staff Member** of the requested agency before allowing access.

## 🗄 Database Schemas

### PersonnelSchema
The central identity record for everyone in the system.
```json
{
  "phone": "String (unique, indexed)",
  "firstName": "String",
  "lastName": "String",
  "email": "String",
  "passwordHash": "String (for login)",
  "source": "enum['call', 'manual', 'registration']",
  "status": "enum['active', 'inactive']",
  "lastLoginAt": "Date"
}
```

### RentalAgencySchema
Stores agency configuration and relationships.
```json
{
  "name": "String",
  "ownerId": "ObjectId (ref: Personnel)",
  "staff": [{
    "personnelId": "ObjectId (ref: Personnel)",
    "role": "enum['admin', 'agent']"
  }],
  "activeVirtualNumbers": [{
    "sid": "String",
    "phoneNumber": "String",
    "label": "String"
  }],
  "settings": {
    "forwardingNumber": "String"
  }
}
```

### PropertySchema
Real estate listings belonging to an agency.
```json
{
  "agencyId": "ObjectId (ref: RentalAgency)",
  "reference": "String (unique, auto-generated)",
  "type": "enum['apartment', 'villa', 'house', 'land']",
  "address": "String",
  "ownerId": "ObjectId (ref: Personnel)",
  "price": "Number",
  "status": "enum['available', 'reserved', 'rented', 'sold']"
}
```

### LeadSchema
```json
{
  "agencyId": "ObjectId (ref: RentalAgency)",
  "personnelId": "ObjectId (ref: Personnel)",
  "customerPhone": "String",
  "status": "enum['NEW', 'CONTACTED', 'QUALIFIED', 'LOST']",
  "activities": [{
    "type": "String",
    "recordingUrl": "String",
    "timestamp": "Date"
  }]
}
```

## 🛣 API Endpoints (V1)

### 🔐 Auth
- `POST /auth/register` - Register a new user and their agency.
- `POST /auth/login` - Login with phone and password.
- `GET /auth/me` - Get current profile and list of accessible agencies.

### � Personnel
- `POST /personnel/identify` - Resolve or create a minimal personnel record by phone.
- `GET /personnel/:id/context` - View all roles a person plays (owner of properties, staff at agencies).

### 🏠 Properties (Requires `X-Agency-ID` header)
- `GET /properties` - List agency properties with filters.
- `POST /properties` - Create a new property listing.

### 📥 Lead Management (Requires `X-Agency-ID` header)
- `GET /leads` - Fetch all leads for the agency.
- `GET /leads/:id` - Detailed view of a single lead.
