# Customer & Partner Portals Implementation

## Overview
This document describes the implementation of Section 7 - Customer & Partner Portals, including authentication, portal UIs, Stripe integration, and notifications.

## Components Created

### Backend Components

#### 1. Authentication System (`backend/app/routers/auth.py`)
- JWT-based authentication with bcrypt password hashing
- User roles: `admin`, `manager`, `crew_lead`, `partner`, `homeowner`
- Endpoints:
  - `POST /auth/register` - Register new user
  - `POST /auth/login` - Login and get JWT token
  - `GET /auth/me` - Get current authenticated user

#### 2. Portal Endpoints (`backend/app/routers/portals.py`)
- **Homeowner Portal Endpoints:**
  - `GET /portals/homeowner/jobs` - Get homeowner's jobs
  - `GET /portals/homeowner/jobs/{job_id}` - Get specific job
  - `GET /portals/homeowner/documents` - Get documents
  - `GET /portals/homeowner/invoices` - Get invoices
  - `POST /portals/homeowner/payments/create-intent` - Create payment intent

- **Roofer Portal Endpoints:**
  - `GET /portals/roofer/dashboard` - Get dashboard stats
  - `GET /portals/roofer/jobs` - Get roofer's jobs
  - `POST /portals/roofer/jobs/{job_id}/roof-complete` - Mark roof complete

- **Notifications:**
  - `GET /portals/notifications` - Get user notifications
  - `PUT /portals/notifications/{id}/read` - Mark notification as read

#### 3. Stripe Integration (`backend/app/routers/stripe_payments.py`)
- `POST /payments/create-intent` - Create Stripe payment intent
- `POST /payments/webhook` - Handle Stripe webhook events
- Automatically updates invoice status on successful payment

#### 4. Data Models (`backend/app/models/schemas.py`)
Added new models:
- `User` - User authentication model
- `UserRole` - Enum for user roles
- `PortalDocument` - Document model for portal
- `PaymentIntent` - Payment intent tracking
- `Notification` - Notification model

### Frontend Components

#### 1. Authentication Context (`frontend/src/contexts/AuthContext.jsx`)
- React context for managing authentication state
- Provides `login`, `logout`, `user`, `token`, `isAuthenticated`
- Automatically handles token storage and API headers

#### 2. Login Page (`frontend/src/pages/Login.jsx`)
- Login form with email/password
- Redirects based on user role after login

#### 3. Protected Route Component (`frontend/src/components/ProtectedRoute.jsx`)
- Route guard for protected routes
- Role-based access control
- Redirects to login if not authenticated

#### 4. Homeowner Portal (`frontend/src/pages/HomeownerPortal.jsx`)
Features:
- **Timeline Tab**: Visual timeline of job progress with milestones
- **Document Center Tab**: View and download job-related documents
- **Payments Tab**: Pay invoices using Stripe integration
- Real-time notifications display

#### 5. Roofer Portal (`frontend/src/pages/RooferPortal.jsx`)
Features:
- **Dashboard**: Stats cards showing:
  - Total Jobs
  - Active Jobs
  - Roof Complete Jobs
  - Ready for Reset Jobs
- **Jobs List**: View all assigned jobs with status badges
- **"Roof Complete" Button**: Action button to mark roof work as complete
- Real-time notifications display

#### 6. App Router Updates (`frontend/src/App.js`)
- Added portal routes with authentication protection
- Role-based route access
- Integrated AuthProvider and Toaster

## Authentication Flow

1. User logs in via `/login`
2. Backend validates credentials and returns JWT token
3. Token stored in localStorage and added to API request headers
4. Protected routes check authentication and role
5. Portal routes redirect based on user role:
   - `homeowner` → `/portal/homeowner`
   - `partner` → `/portal/roofer`
   - `admin/manager/crew_lead` → Main app dashboard

## Stripe Integration

### Setup Required
1. Add Stripe keys to environment variables:
   - `STRIPE_SECRET_KEY` - Backend secret key
   - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Frontend publishable key

2. Configure webhook endpoint in Stripe dashboard:
   - URL: `https://your-domain.com/payments/webhook`
   - Events: `payment_intent.succeeded`

### Payment Flow
1. Homeowner views invoice in portal
2. Clicks "Pay" button
3. Frontend creates payment intent via `/payments/create-intent`
4. Stripe Elements form collects card details
5. Payment confirmed via Stripe API
6. Webhook updates invoice status automatically

## Notifications System

- Notifications created when:
  - Roof is marked complete (notifies admin)
  - Job status changes
  - Documents uploaded
  - Payments received

- Displayed in portal headers with badge count
- Can be marked as read

## Database Collections

New Firestore collections:
- `users` - User accounts with roles
- `portal_documents` - Documents accessible in portals
- `payment_intents` - Stripe payment intent tracking
- `notifications` - User notifications

## Dependencies Added

### Backend (`backend/requirements.txt`)
- `stripe>=8.0.0`

### Frontend (`frontend/package.json`)
- `@stripe/stripe-js`: ^2.4.0
- `@stripe/react-stripe-js`: ^2.4.0

## Environment Variables Needed

### Backend
```
JWT_SECRET_KEY=your-secret-key-change-in-production
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend
```
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Usage

### Creating a Homeowner User
```python
# Via API
POST /auth/register
{
  "email": "homeowner@example.com",
  "password": "password123",
  "role": "homeowner",
  "customerId": "customer_id_from_customers_collection",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Creating a Roofer/Partner User
```python
POST /auth/register
{
  "email": "roofer@example.com",
  "password": "password123",
  "role": "partner",
  "partnerId": "partner_id_from_partners_collection",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

## Testing

1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && yarn start`
3. Navigate to `/login`
4. Login with homeowner or partner credentials
5. Access respective portal

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API endpoints
- Customer/Partner data isolation (users can only see their own data)


