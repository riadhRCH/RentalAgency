# Rental Agency Platform

A full-stack rental agency management system built with **NestJS**, **Angular**, and **MongoDB**. Designed for rental agencies, this project centralizes property management, lead workflow, rental agreements, team coordination, and financial transaction tracking.

## Table of Contents

- [Overview](#overview)
- [Philosophy](#philosophy)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Rental Agency Platform helps rental agencies manage properties, capture leads, track rentals and transactions, and coordinate teams from a single mobile-first dashboard.

## Philosophy

- **Mobile-first**: Built for field agents and mobile users.
- **Multi-tenant**: Supports per-agency data separation and user access.
- **Collaborative**: Enables teams to work together while preserving individual ownership.
- **Extensible**: Designed to integrate with external services like Twilio, WhatsApp, Instagram, and payment providers.
- **Secure**: Uses JWT authentication, role-based access, and SMS verification for sensitive operations.

## Core Features

- Authentication and agency-level access control
- Property management with media upload and availability calendars
- Lead tracking and visit scheduling
- Rental contract and payment tracking
- Team member roles, permissions, and KPI reporting
- Transaction management and virtual phone provisioning
- Public property and transaction pages
- Integration-ready architecture for third-party connectors

## Architecture

The project is structured as a monorepo with separate backend and frontend applications.

- `backend/`: NestJS API, MongoDB models, authentication, business modules
- `frontend/`: Angular SPA, mobile-first dashboard, public marketing experience
- `docker-compose.yml`: Local development orchestration with MongoDB

## Tech Stack

- Backend: NestJS 10, TypeScript, Mongoose, JWT, Passport
- Frontend: Angular 21, TypeScript, RxJS, standalone components
- Database: MongoDB 7
- Media: Cloudinary
- SMS: Twilio
- Containerization: Docker

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- Docker Compose (recommended)

### Start with Docker

1. Create or update `.env` with required variables.
2. Run:

```bash
docker-compose up --build
```

This starts:

- Backend API on `http://localhost:3000`
- Frontend app on `http://localhost:8080`

### Local Development

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## API Documentation

### Swagger Setup

To add dynamic API docs via Swagger:

1. Install `@nestjs/swagger` and `swagger-ui-express`.
2. Add Swagger setup in `backend/src/main.ts`.
3. Visit `http://localhost:3000/api/docs`.

### Authentication

- `POST /auth/register` – Register an agency and personnel
- `POST /auth/login` – Authenticate a user
- `GET /auth/me` – Get current user and agencies

### Properties

- `GET /properties/public/:id` – Public property view
- `GET /properties` – List agency properties
- `POST /properties` – Create property
- `PATCH /properties/:id` – Update property
- `DELETE /properties/:id` – Delete property
- `POST /properties/upload` – Upload property media

### Leads

- `GET /leads` – List leads
- `GET /leads/:id` – Get a lead
- `POST /leads` – Create a lead
- `PATCH /leads/:id` – Update a lead
- `DELETE /leads/:id` – Delete a lead

### Rentals

- `GET /rentals` – List rentals
- `GET /rentals/:id` – Get rental details
- `POST /rentals` – Create rental
- `PATCH /rentals/:id` – Update rental
- `PATCH /rentals/:id/close` – Close rental
- `DELETE /rentals/:id` – Delete rental

### Visits

- `GET /visits` – List visit requests
- `GET /visits/:id` – Get visit request
- `PATCH /visits/:id` – Update visit request
- `DELETE /visits/:id` – Delete visit request

### Transactions

- `POST /transactions/public` – Public transaction creation
- `GET /transactions/public/:id` – Public transaction view
- `PATCH /transactions/public/:id` – Update public transaction
- `GET /transactions` – List agency transactions
- `GET /transactions/:id` – Get transaction
- `PATCH /transactions/:id` – Update transaction
- `PATCH /transactions/:id/close` – Close transaction
- `DELETE /transactions/:id` – Delete transaction

### Agencies

- `GET /agencies/stats` – Agency statistics
- `POST /agencies/numbers/provision` – Provision Twilio number
- `GET /agencies/numbers/active` – List active Twilio numbers
- `GET /agencies/settings` – Get agency settings
- `PATCH /agencies/settings` – Update settings
- `GET /agencies/payment-methods` – Get payment methods
- `POST /agencies/payment-methods` – Add payment method
- `PATCH /agencies/payment-methods/:index` – Update payment method
- `DELETE /agencies/payment-methods/:index` – Delete payment method
- `POST /agencies/staff` – Add team member
- `GET /agencies/staff` – List staff members
- `DELETE /agencies/staff/:personnelId` – Remove staff member

### Personnel

- `GET /personnel` – List personnel
- `GET /personnel/:id` – Get personnel details
- `POST /personnel` – Create personnel
- `POST /personnel/public` – Create public personnel
- `PATCH /personnel/:id` – Update personnel
- `DELETE /personnel/:id` – Delete personnel

## Project Structure

- `backend/` – API and business logic
- `frontend/` – Angular app and UX
- `docker-compose.yml` – Local orchestration
- `TODO-1.txt`…`TODO-8.txt` – Feature roadmap

## Environment Variables

### Backend

- `PORT`
- `APP_URL`
- `MONGO_URI`
- `JWT_SECRET`
- `CLOUDINARY_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### Frontend

Update `frontend/src/environments/environment.ts` for `apiBaseUrl`.

## Development

- Backend format: `npm run format`
- Frontend format: `npx prettier --write "src/**/*.ts"`
- Backend dev: `npm run start:dev`
- Frontend dev: `npm start`

## Roadmap

### Recommended priority
1. Mobile Optimization (TODO-5)
2. Permissions & Data Isolation (TODO-6)
3. Landing Page and Personnel Navigation (TODO-2)
4. SMS Verification (TODO-4)
5. Owner Dashboard (TODO-3)
6. Contract Generation (TODO-1)
7. Third-Party Integrations (TODO-7)
8. Future features slot (TODO-8)

## Contributing

1. Fork the repo
2. Create a feature branch
3. Run tests and formatting
4. Open a pull request with clear summary

## License

UNLICENSED

# deployment

# Push the frontend
docker build -t riadh15/rental-agency-frontend:latest .
docker push riadh15/rental-agency-frontend:latest

# Push the backend
docker build -t riadh15/rantal-agency-backend:latest .
docker push riadh15/rantal-agency-backend:latest