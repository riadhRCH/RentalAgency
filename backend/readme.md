📞 Call-to-Lead: Intelligent Rental Lead Tracker
🚀 Overview
Call-to-Lead is a specialized B2B platform designed for rental agencies to ensure no potential tenant is ever missed. Many agencies lose leads when customers call phone numbers found in listings without a formal tracking system.

This application intercepts incoming calls, records them, and automatically generates a structured Lead in a MongoDB database, allowing agencies to manage their pipeline effectively through a centralized dashboard.

🛠 The Solution (V1)
In the current version, the app solves the "Hidden Lead" problem by:

    Provisioning Virtual Numbers: Agencies get unique phone numbers to put in their ads.

    Call Bridging: When a customer calls, the app records the conversation and bridges the call to the agency's real phone. if smth went wrong it should forward the call to the agency's real phone.

    Automatic Lead Generation: Immediately upon call completion, a new lead document is created with caller metadata and recording links.

    New Caller: A new Lead document is created.

    Returning Caller: The new call (recording + metadata) is pushed into the existing Lead's Activity Array.

    Note: Future versions will include automated AI transcription and data extraction.

🏗 Solution Architecture
The system is designed around a 4-Layer Architecture.
Layer,Status,Description
1. Telephony/VOIP,ACTIVE,"Handles inbound calls, recording, and call routing via Twilio."
2. Backend API,ACTIVE,"NestJS application managing business logic, webhooks, and agency accounts."
3. Intelligence/AI,⏳ TODO,"AI-driven transcription and automatic field extraction (Budget, Move-in date)."
4. Omni-Channel,⏳ TODO,"Lead ingestion from Instagram, WhatsApp, and Facebook."

💻 Tech Stack (V1)
Framework: Angular

Database: MongoDB via Mongoose

Telephony: Twilio (Primary V1 Provider) (in future we migh explore other providers like Telynix, SignalWire, etc)

Authentication: JWT

🗄 Database Schemas
RentalAgencySchema
Stores the identity and configuration of the agency using the platform.
{
  name: String,
  email: String, (unique)
  password: String, (hashed)
  activeVirtualNumbers: [{
    sid: String,      // Twilio SID
    phoneNumber: String,
    label: String     // e.g., "Apartment A Listing"
  }],
  settings: {
    forwardingNumber: String // Where calls are actually sent
  }
}

LeadSchema
The core unit of data representing a potential customer.
{
  agencyId: ObjectId, // Reference to RentalAgency
  customerPhone: String, // Identity Key
  customerName: String,  // Optional (Manual input later)
  
  status: { 
    type: String, 
    enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST'], 
    default: 'NEW' 
  },

  // The Interaction History
  activities: [{
    type: { 
      type: String, 
      enum: ['CALL', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'MANUAL'],
      default: 'CALL'
    },
    timestamp: { type: Date, default: Date.now },
    recordingUrl: String, // Link to the Twilio recording
    duration: Number,    // Call length in seconds
    metadata: Object     // Raw response from Twilio for debugging
  }],

  firstSeen: { type: Date, default: Date.now },
  lastInteraction: { type: Date, default: Date.now },
  tags: [String] 
}

🛣 API Endpoints (V1)
🔐 Auth & Agency Management
POST /auth/register - Create a new agency account.
POST /auth/login - Secure login for agency staff.
POST /agencies/create - Admin endpoint for agency onboarding.

📞 Virtual Number Setup
POST /agencies/numbers/provision - Purchase/Assign a Twilio number to an agency.
GET /agencies/numbers/active - List all active virtual numbers for the logged-in agency.

📥 Lead Management (The Lead Dashboard)
GET /leads - Fetch all leads for the agency (with filtering/pagination).
GET /leads/:id - Detailed view of a single lead + Recording player.
POST /leads - Manual lead creation (for walk-ins or manual entry).
PATCH /leads/:id - Update lead status or add notes.
DELETE /leads/:id - Remove lead.

⚓ Webhooks
POST /webhooks/twilio/inbound - TwiML instructions to record and dial.
POST /webhooks/twilio/completed - Logic to catch call data and save to MongoDB.

🛠 Backend Logic: The "Upsert" Flow
To achieve the "One Client = One Lead" goal, the NestJS service will use an Upsert (Update or Insert) pattern whenever a webhook hits the server:
Incoming Data: Get callerPhone and agencyId.
Find: this.leadModel.findOne({ customerPhone, agencyId }).
Branch:
Existing Lead: Use $push to add the new call object to the activities array and update lastInteraction.
New Lead: Use create() with the initial call as the first item in the activities array.

📝 Roadmap & TODOs
[ ] Omni-Channel Integration: Track leads from Instagram DMs, WhatsApp Business, and FB Messenger.
[ ] AI Extraction: Use Whisper + GPT-4o to automatically fill lead fields from audio.
[ ] Frontend Dashboard: A clean UI for agencies to manage their leads (Next.js/Angular).
[ ] Cost Optimization: Implement Telnyx/SignalWire as alternatives to Twilio.