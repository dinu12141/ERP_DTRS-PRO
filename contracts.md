# Acumatica Cloud ERP - API Contracts & Integration Plan

## Overview
This document defines the API contracts, data models, and integration strategy for the Acumatica Cloud ERP clone backend implementation.

---

## 1. Mock Data to Replace

### Currently in `mock.js`:
- **Partners**: 3 roofing partner accounts with commission models
- **Contacts**: 3 partner contacts with roles
- **Leads**: 3 leads with scoring system
- **Jobs**: 4 job records with workflow states
- **Crews**: 3 crew profiles with capabilities
- **Schedule**: 3 scheduled dispatches
- **Invoices**: 6 invoices (deposit/progress/final)
- **Inventory**: 4 inventory items
- **KPIs**: Dashboard metrics

All mock data will be replaced with actual MongoDB queries via FastAPI endpoints.

---

## 2. Database Schema (MongoDB Collections)

### 2.1 Partners Collection
```json
{
  "_id": "ObjectId",
  "partnerId": "P001",
  "name": "Summit Roofing Solutions",
  "type": "Roofing Partner",
  "status": "Active|Pending|Inactive",
  "creditLimit": 50000,
  "currentBalance": 12500,
  "commissionModel": "Percentage|Flat Fee",
  "commissionRate": 15,
  "billingMethod": "Net-Deduct|Referral Payout",
  "contactInfo": {
    "email": "contact@summitroofing.com",
    "phone": "(555) 123-4567",
    "address": "123 Main St, Denver, CO 80202"
  },
  "stats": {
    "totalJobs": 47,
    "totalRevenue": 385000
  },
  "createdDate": "2024-01-15",
  "updatedDate": "2024-07-01"
}
```

### 2.2 Contacts Collection
```json
{
  "_id": "ObjectId",
  "contactId": "C001",
  "partnerId": "P001",
  "firstName": "John",
  "lastName": "Anderson",
  "role": "Sales Manager",
  "email": "j.anderson@summitroofing.com",
  "phone": "(555) 123-4567",
  "mobile": "(555) 987-6543",
  "isPrimary": true,
  "createdDate": "2024-01-15"
}
```

### 2.3 Leads Collection
```json
{
  "_id": "ObjectId",
  "leadId": "L001",
  "customerName": "Robert Johnson",
  "address": "234 Maple Dr, Denver, CO 80203",
  "phone": "(555) 111-2222",
  "email": "robert.j@email.com",
  "source": "Website Form|Referral|Phone Call",
  "status": "New|Contacted|Qualified|Lost",
  "scoring": {
    "score": 85,
    "distance": 12.5,
    "roofPitch": "6/12",
    "systemAge": 8
  },
  "estimatedValue": 18500,
  "assignedTo": "Summit Roofing Solutions",
  "notes": "High-priority lead",
  "createdDate": "2024-07-02",
  "updatedDate": "2024-07-02"
}
```

### 2.4 Jobs Collection
```json
{
  "_id": "ObjectId",
  "jobId": "J-2024-001",
  "customerName": "Lisa Anderson",
  "address": "123 Solar St, Denver, CO 80204",
  "partnerId": "P001",
  "status": "Intake|Survey|Permit|Detach|Roofing|Reset|Inspection|Closed",
  "priority": "High|Medium|Low",
  "systemDetails": {
    "systemType": "Solar + Battery|Solar Only",
    "panelBrand": "Tesla Solar",
    "panelCount": 24,
    "inverterBrand": "Enphase IQ8+",
    "inverterCount": 24,
    "rackingType": "IronRidge XR100",
    "batterySystem": "Tesla Powerwall 2",
    "batteryCount": 1,
    "roofPitch": "5/12",
    "roofMaterial": "Asphalt Shingle"
  },
  "estimatedValue": 28500,
  "timeline": {
    "surveyDate": "2024-07-05",
    "permitDate": null,
    "detachDate": null,
    "roofingDate": null,
    "resetDate": null,
    "inspectionDate": null,
    "completionDate": null
  },
  "weather": "Clear|Partly Cloudy|Rain",
  "notes": "Customer wants expedited timeline",
  "createdDate": "2024-06-15",
  "updatedDate": "2024-07-01"
}
```

### 2.5 Crews Collection
```json
{
  "_id": "ObjectId",
  "crewId": "CR001",
  "name": "Alpha Crew",
  "lead": "Carlos Martinez",
  "members": ["Carlos Martinez", "Jake Wilson", "Tony Rivera"],
  "capabilities": ["Detach", "Reset", "Electrical"],
  "vehicle": {
    "vehicleId": "V001",
    "vehicleName": "Truck #1"
  },
  "status": "Available|On Job|Off Duty",
  "currentJob": null
}
```

### 2.6 Schedule Collection
```json
{
  "_id": "ObjectId",
  "scheduleId": "SCH001",
  "jobId": "J-2024-002",
  "crewId": "CR002",
  "date": "2024-07-03",
  "startTime": "08:00",
  "endTime": "16:00",
  "type": "Detach|Reset|Survey|Inspection",
  "status": "Scheduled|In Progress|Completed|Cancelled"
}
```

### 2.7 Invoices Collection
```json
{
  "_id": "ObjectId",
  "invoiceId": "INV-2024-001",
  "jobId": "J-2024-004",
  "customerName": "Tom Bradley",
  "type": "Deposit|Progress|Final",
  "status": "Pending|Paid|Overdue|Cancelled",
  "amount": 21500,
  "paidAmount": 21500,
  "dueDate": "2024-06-20",
  "paidDate": "2024-06-18",
  "createdDate": "2024-06-15"
}
```

### 2.8 Inventory Collection
```json
{
  "_id": "ObjectId",
  "sku": "PANEL-TESLA-400",
  "name": "Tesla Solar Panel 400W",
  "category": "Panels|Inverters|Batteries|Racking",
  "stock": {
    "warehouse": 125,
    "customerBins": 48,
    "truckStock": 12,
    "totalStock": 185
  },
  "reorderPoint": 50,
  "unitCost": 185,
  "status": "In Stock|Low Stock|Out of Stock"
}
```

---

## 3. API Endpoints

### 3.1 CRM Module

#### Partners
- `GET /api/partners` - List all partners (with pagination, search, filter)
- `GET /api/partners/:id` - Get partner details
- `POST /api/partners` - Create new partner
- `PUT /api/partners/:id` - Update partner
- `DELETE /api/partners/:id` - Delete partner

#### Contacts
- `GET /api/contacts` - List all contacts (with pagination, search, filter by partnerId)
- `GET /api/contacts/:id` - Get contact details
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

#### Leads
- `GET /api/leads` - List all leads (with pagination, search, filter by status)
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead (includes scoring recalculation)
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/convert` - Convert lead to job

### 3.2 Job Records Module

- `GET /api/jobs` - List all jobs (with pagination, search, filter by status/priority)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `PUT /api/jobs/:id/status` - Update job workflow status
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/workflow-stats` - Get job counts by workflow stage

### 3.3 Operations Module

#### Crews
- `GET /api/crews` - List all crews
- `GET /api/crews/:id` - Get crew details
- `POST /api/crews` - Create new crew
- `PUT /api/crews/:id` - Update crew
- `DELETE /api/crews/:id` - Delete crew

#### Schedule
- `GET /api/schedule` - List schedule (filter by date, crew, job)
- `GET /api/schedule/:id` - Get schedule details
- `POST /api/schedule` - Create new schedule
- `PUT /api/schedule/:id` - Update schedule
- `DELETE /api/schedule/:id` - Delete schedule

### 3.4 Invoicing Module

- `GET /api/invoices` - List all invoices (with pagination, search, filter by status)
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `PUT /api/invoices/:id/payment` - Record payment
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/stats` - Get invoice statistics

### 3.5 Inventory Module

- `GET /api/inventory` - List all inventory items (with pagination, search, filter)
- `GET /api/inventory/:sku` - Get inventory item details
- `POST /api/inventory` - Create new inventory item
- `PUT /api/inventory/:sku` - Update inventory item
- `PUT /api/inventory/:sku/adjust` - Adjust stock levels
- `DELETE /api/inventory/:sku` - Delete inventory item

### 3.6 Dashboard Module

- `GET /api/dashboard/kpis` - Get all KPIs for dashboard
- `GET /api/dashboard/recent-jobs` - Get recent jobs
- `GET /api/dashboard/recent-leads` - Get recent leads
- `GET /api/dashboard/pending-invoices` - Get pending invoices

---

## 4. Frontend Integration Plan

### Files to Update:
1. **Dashboard.jsx** - Replace mock KPIs with API calls
2. **Partners.jsx** - Replace mockPartners with API calls
3. **Contacts.jsx** - Replace mockContacts with API calls
4. **Leads.jsx** - Replace mockLeads with API calls
5. **Jobs.jsx** - Replace mockJobs with API calls
6. **Dispatch.jsx** - Replace mockCrews & mockSchedule with API calls
7. **Invoices.jsx** - Replace mockInvoices with API calls

### API Service Layer
Create `/app/frontend/src/services/api.js`:
```javascript
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const partnersAPI = {
  getAll: () => axios.get(`${API}/partners`),
  getById: (id) => axios.get(`${API}/partners/${id}`),
  create: (data) => axios.post(`${API}/partners`, data),
  update: (id, data) => axios.put(`${API}/partners/${id}`, data),
  delete: (id) => axios.delete(`${API}/partners/${id}`)
};

// Similar for contacts, leads, jobs, crews, schedule, invoices, inventory
```

---

## 5. Business Logic & Rules

### Workflow State Machine (Jobs)
- **Transitions**: Intake → Survey → Permit → Detach → Roofing → Reset → Inspection → Closed
- **Rules**: 
  - Can only move forward in workflow (no backward transitions)
  - Each transition updates timeline dates
  - Certain transitions trigger invoice generation (e.g., Survey → Permit triggers Deposit invoice)

### Lead Scoring Algorithm
```
Score = 100 - (distance_penalty + pitch_penalty + age_penalty)
- distance_penalty: (distance - 10) * 2 (if > 10 miles)
- pitch_penalty: (pitch - 6) * 3 (if > 6/12)
- age_penalty: (age - 10) * 1 (if > 10 years)
```

### Invoice Auto-Generation Triggers
- **Deposit Invoice**: When job status changes to "Permit"
- **Progress Invoice**: When job status changes to "Roofing"
- **Final Invoice**: When job status changes to "Inspection"

### Inventory Management
- **Low Stock Alert**: When totalStock < reorderPoint
- **Auto-deduct**: Deduct from warehouse when job is created (based on BOM)
- **Custody Transfer**: Move between bins using QR code scanning

---

## 6. Authentication & Authorization

### User Roles
- **Admin**: Full access to all modules
- **Manager**: Access to all modules except Settings
- **Crew Lead**: Access to Jobs, Schedule, Inventory (limited)
- **Partner**: Access to assigned Jobs only (via portal)

### JWT-based Authentication
- `/api/auth/login` - Login endpoint
- `/api/auth/register` - Register new user
- `/api/auth/refresh` - Refresh token
- Protected routes require Bearer token in Authorization header

---

## 7. Implementation Priority

### Phase 1 (MVP):
1. ✅ Partners CRUD
2. ✅ Contacts CRUD
3. ✅ Leads CRUD + Scoring
4. ✅ Jobs CRUD + Workflow
5. ✅ Dashboard KPIs

### Phase 2:
6. Crews & Schedule
7. Invoicing with auto-generation
8. Inventory management

### Phase 3:
9. Authentication & Authorization
10. User roles & permissions
11. Audit logs

### Phase 4:
12. Advanced features (RMA, Scrap Wizard, etc.)
13. Customer/Roofer portals
14. Mobile app integration

---

## 8. Testing Strategy

- **Unit Tests**: pytest for business logic functions
- **Integration Tests**: Test API endpoints with test database
- **E2E Tests**: Playwright for frontend flows
- **Load Tests**: Test with 1000+ jobs, partners, invoices

---

## 9. Notes

- All dates stored in ISO 8601 format
- Currency values stored as integers (cents) for precision
- All API responses follow standard format: `{ success: boolean, data: any, error: string }`
- Pagination: `?page=1&limit=50`
- Sorting: `?sort=createdDate&order=desc`
- Search: `?search=searchTerm`
