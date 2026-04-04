🏡 DOGHMANI Homes & Estates

DOGHMANI Homes & Estates is a modern digital real estate platform designed to provide a premium property rental experience combined with a powerful internal CRM for real estate agencies.

The platform will deliver a luxury brand experience, immersive 3D interactions, and a fully integrated property management CRM, enabling agencies to manage properties, clients, visits, transactions, and documents in one unified system.

The goal is to combine:

✨ Premium interactive design

🧠 Powerful real estate CRM

🏠 Advanced property search

📊 Operational management for agents

📱 Modern responsive web application

🎨 Brand Identity

Brand name:
DOGHMANI Homes & Estates

Design philosophy

The application should feel:

Premium

Elegant

Modern

Minimalistic

High-end real estate oriented

The logo uses:

Black background

Silver metallic typography

The interface should reflect a luxury real estate brand identity.

✨ Design & Interaction Vision

The application will include:

🎥 Modern UI/UX

Smooth page transitions

Micro-interactions

Interactive property cards

Scroll-based animations

Parallax effects

🧊 3D & Visual Effects

Possible technologies:

WebGL

Three.js

GSAP animations

Interactive backgrounds

💡 Logo Animation

The landing page will feature a premium animated logo reveal inspired by:

AI Orb effect
https://www.unicorn.studio/remix/CX3zvB6l52wg1wNDmYoD

Glow effect
https://www.unicorn.studio/remix/bptHXyZ7R92J3JQbmtCf

Combined animation concept
https://www.unicorn.studio/edit/1LTy5CPNwd25V26BFUa1?template=true

The idea is to create a silver energy glow around the brand text, producing a luxury futuristic entrance animation.

🧱 Tech Stack

Minimal technical choices for now:

Frontend

Angular

Backend

NestJS

Database

MongoDB

🌍 Main Application Areas

The application contains two main parts:

1️⃣ Public Real Estate Platform

Accessible to visitors and potential tenants.

2️⃣ Internal CRM

Accessible only to the agency team.

🏠 Public Website Pages
1️⃣ Home Page

The Home Page is the brand's digital showroom.

Sections

Hero Section

Logo animation

Catch phrase

Search bar

Background 3D animation

Featured Properties

Highlight premium listings

Property Categories

Apartments

Villas

Houses

Land

How It Works

Simple explanation of renting process

Agency Presentation

About DOGHMANI Homes & Estates

Testimonials

Client reviews

Call To Action

Browse properties

Contact agent

Footer

contact info

social links

legal pages

🔎 Property Search Page

This page allows users to discover rental properties.

Features

Search by:

Location

Property type

Budget

Surface area

Number of rooms

Availability

Interactive Map

Map with markers

Property clusters

Hover preview cards

Advanced Filters

Price range

Property size

Furnished / unfurnished

Property status

Results Layout

Grid view with:

Image preview

Price

Address

Surface

Quick actions

🏡 Property Details Page

This is the most important page of the platform.

It must feel premium and immersive.

Sections

Property Gallery

High resolution photos

Video

Virtual tour (future feature)

Property Overview

Information includes:

Property reference

Type

Address

Surface area

Price

Availability

Description

Location Map

GPS coordinates

Neighborhood view

Property Features

Example:

Rooms

Bathrooms

Floor

Parking

Garden

Furnishing

Owner Information

Agent contact card.

Visit Request

Users can:

Request a visit

Send a message

Schedule appointment

Similar Properties

Recommendations based on:

location

price

type

📅 Visit Booking

Users can request a visit.

Fields:

preferred date

preferred time

contact details

message

The visit is automatically created inside the CRM system.

🧑‍💼 CRM System

The platform includes a complete internal CRM for the real estate agency.

Its goal is to centralize all operations. 

cahier_des_charges_crm_immobili…

👥 User Roles
Administrator

Full access:

user management

statistics

configuration

Real Estate Agent

Access to:

properties

clients

visits

transactions

📊 CRM Modules
Dashboard

Overview:

active properties

scheduled visits

ongoing transactions

performance metrics

🏘 Property Management

Each property contains the following information: 

cahier_des_charges_crm_immobili…

type Property = {
  id: string
  reference: string
  type: "apartment" | "villa" | "house" | "land"
  address: string
  gpsLocation: {
    lat: number
    lng: number
  }
  surface: number
  price: number
  description: string
  photos: string[]
  videos?: string[]
  status: "available" | "reserved" | "sold" | "rented"
  ownerId: string
}

Features:

Add property

Edit property

Upload photos

Manage availability

👤 Client Management

Each client profile contains: 

cahier_des_charges_crm_immobili…

type Client = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  budget: number
  desiredPropertyType: string
  desiredLocation: string
  visitHistory: string[]
  status: "new" | "interested" | "visit" | "negotiation" | "rented"
}

Features:

create client

track client status

see visit history

👤 Owner Management
type Owner = {
  id: string
  name: string
  phone: string
  email: string
  properties: string[]
}
📅 Visit Management

Visit information includes: 

cahier_des_charges_crm_immobili…

type Visit = {
  id: string
  propertyId: string
  clientId: string
  agentId: string
  date: Date
  notes?: string
}

Agents can:

schedule visits

edit visits

add visit feedback

💰 Transactions

Transactions track property deals. 

cahier_des_charges_crm_immobili…

type Transaction = {
  id: string
  type: "sale" | "rental"
  propertyId: string
  clientId: string
  finalPrice: number
  commission: number
  status: "in-progress" | "signed" | "completed"
}
📄 Document Management

Documents stored in the CRM: 

cahier_des_charges_crm_immobili…

Examples:

sale mandate

rental contract

property title

administrative documents

signed contracts

type Document = {
  id: string
  name: string
  type: string
  propertyId?: string
  clientId?: string
  url: string
}
📅 Agenda & Reminders

Agents have a calendar for:

visits

meetings

reminders

📈 Statistics

CRM analytics include:

properties rented

visits performed

conversion rates

agent performance

🔐 Security

The system includes:

authentication

role based access

secure data storage

automatic data backup 

cahier_des_charges_crm_immobili…

🧭 Implementation Roadmap
Step 1 — Landing Experience

Goal:

Create a premium homepage with:

animated logo

3D background

luxury real estate design

hero search bar

featured properties

This step focuses entirely on design and branding.

Step 2 — Property Listing System

Implement:

property search page

filtering system

property cards

map integration

Step 3 — Property Details Experience

Build the immersive property page including:

image gallery

property info

map

contact agent

visit booking

Step 4 — CRM Core

Implement backend modules:

properties

clients

owners

visits

Step 5 — CRM Dashboard

Create:

statistics

upcoming visits

performance indicators

Step 6 — Transactions & Documents

Add:

contract management

commission tracking

document storage

🚀 Long-Term Vision

Future features may include:

AI property recommendations

virtual property tours

automated visit scheduling

predictive pricing analysis

tenant scoring

mobile app

📌 Project Goal

DOGHMANI Homes & Estates aims to become a modern digital real estate platform combining:

luxury brand experience

smart property discovery

powerful agency management tools

## Docker Setup

Run the full stack with Docker Compose:

```bash
copy .env.docker.example .env
docker compose up --build
```

Services:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3000`
- MongoDB: internal `mongo:27017`

Notes:

- The frontend image builds the Angular app and serves it with Nginx.
- The backend image builds the NestJS app and runs `npm run start:prod`.
- The compose stack provisions a MongoDB container automatically.
- Fill in the Twilio and Cloudinary values in the root `.env` file before using those features.
