# Online Voting System - Complete Project Overview

## 📋 Table of Contents
1. [Project Introduction](#project-introduction)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Core Features](#core-features)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Project Structure](#project-structure)
7. [Security Features](#security-features)
8. [API Documentation](#api-documentation)
9. [Database Schema](#database-schema)
10. [User Workflows](#user-workflows)
11. [Recent Enhancements](#recent-enhancements)
12. [Setup & Deployment](#setup--deployment)

---

## 🎯 Project Introduction

The **Online Voting System** is a secure, government-grade digital voting platform designed to facilitate democratic elections with transparency, security, and accessibility. Built with modern web technologies, the system ensures voter anonymity, prevents fraud, and provides comprehensive administrative controls.

### Key Objectives
- **Secure Voting**: Implement military-grade security measures to protect voter data and votes
- **Voter Anonymity**: Ensure votes cannot be traced back to individual voters
- **Accessibility**: Enable voting from anywhere, at any time
- **Transparency**: Provide real-time results and complete audit trails
- **Administrative Control**: Comprehensive tools for election management

---

## 🏗️ Architecture Overview

The system follows a **client-server architecture** with clear separation between frontend and backend:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React Frontend│ ◄─────► │  Express Backend│ ◄─────► │  Firebase Cloud │
│   (Port 3000)   │  HTTP   │   (Port 5000)   │  SDK    │   (Firestore)   │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                           │                           │
         │                           │                           │
    Firebase Auth              Firebase Admin              Cloud Functions
```

### Architecture Layers

1. **Presentation Layer (Frontend)**
   - React 18 with functional components and hooks
   - React Router for client-side navigation
   - Context API for state management
   - Responsive UI with modern CSS

2. **Application Layer (Backend)**
   - Express.js RESTful API
   - Authentication middleware
   - Role-based access control
   - Rate limiting and security headers

3. **Data Layer (Firebase)**
   - Firestore NoSQL database
   - Firebase Authentication
   - Cloud Storage (for candidate photos)
   - Security rules for data access

---

## 🛠️ Technology Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI library for building interactive interfaces |
| **React Router DOM** | 6.21.0 | Client-side routing and navigation |
| **Vite** | 5.0.8 | Fast build tool and development server |
| **Axios** | 1.6.2 | HTTP client for API requests |
| **Firebase** | 10.7.1 | Client-side Firebase SDK for authentication |
| **Lucide React** | 0.294.0 | Modern icon library |
| **date-fns** | 3.0.0 | Date utility library |
| **recharts** | 2.10.3 | Chart library for data visualization |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 16+ | JavaScript runtime environment |
| **Express** | 4.18.2 | Web application framework |
| **Firebase Admin SDK** | 12.0.0 | Server-side Firebase integration |
| **Helmet** | 7.1.0 | Security middleware for HTTP headers |
| **express-rate-limit** | 7.1.5 | Rate limiting middleware |
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **dotenv** | 16.3.1 | Environment variable management |
| **bcryptjs** | 2.4.3 | Password hashing |
| **jsonwebtoken** | 9.0.2 | JWT token generation |
| **uuid** | 9.0.1 | Unique identifier generation |
| **crypto** | 1.0.1 | Cryptographic functions |

### Database & Infrastructure
- **Cloud Firestore**: NoSQL document database
- **Firebase Authentication**: User authentication service
- **Firebase Hosting**: Static site hosting
- **Firebase Security Rules**: Database access control

---

## ✨ Core Features

### For Voters

#### 1. **User Registration & Authentication**
- Email/password authentication via Firebase
- Secure account creation
- Password reset functionality
- Session management

#### 2. **Voter Registration**
- Complete profile creation with:
  - Personal information (name, DOB, address)
  - National ID verification
  - Contact details
- Registration status tracking
- Admin verification workflow

#### 3. **Election Browsing**
- **Active Elections Tab**: View currently ongoing elections
- **Upcoming Elections Tab**: See scheduled future elections
- **Results Tab**: Browse completed elections with approved results
- Election details including:
  - Title, description, and type
  - Start and end dates
  - Candidate information
  - Current status

#### 4. **Voting Process**
- Secure vote casting interface
- Candidate selection with photos and biographies
- One vote per election enforcement
- Vote confirmation and receipt
- Anonymous voting (votes cannot be traced to voters)

#### 5. **Results Viewing**
- View election results after admin approval
- Results include:
  - Winner announcement
  - Vote counts per candidate
  - Percentage calculations
  - Visual charts and statistics
- Access from multiple locations:
  - Dashboard results section
  - Elections page "Results" tab
  - Individual election detail pages

#### 6. **Dashboard Features**
- Registration status overview
- Verification status tracking
- Active elections display
- Voting history
- Recent election results (up to 4)
- Quick navigation to key features

#### 7. **Voting History**
- Track all elections participated in
- View voting dates
- Election titles and details
- Participation statistics

### For Administrators

#### 1. **Admin Authentication**
- Dedicated admin login page (`/admin/login`)
- Role-based access control via Firebase Custom Claims
- Admin role assignment via script or Firebase Console

#### 2. **Voter Management**
- View all registered voters
- Filter by verification status:
  - All voters
  - Pending verification
  - Verified voters
  - Rejected voters
- **Voter Verification**:
  - Review voter profiles
  - Approve or reject registrations
  - Set eligibility status
  - Process verification directly from dashboard

#### 3. **Election Management**
- **Create Elections**:
  - Set title, description, and type
  - Configure start and end dates
  - Define allowed regions
  - Set initial status
- **Manage Elections**:
  - View all elections (active, scheduled, completed)
  - Update election status (scheduled → active → completed)
  - Add candidates to elections
  - Edit election details
- **Results Approval**:
  - Preview election results
  - Approve results for public viewing
  - Control when results become visible to voters

#### 4. **Candidate Management**
- Add candidates to elections
- Candidate information includes:
  - Name and party affiliation
  - Biography
  - Photo upload
  - Position/order in ballot

#### 5. **System Monitoring**
- **Dashboard Statistics**:
  - Total voters count
  - Verified voters count
  - Active elections count
  - Total votes cast
  - Recent activity overview
- **Audit Logs**:
  - Complete system activity tracking
  - User actions logging
  - Timestamp and IP address tracking
  - Action types (VOTER_REGISTRATION, VOTE_CAST, etc.)
  - Filterable and searchable logs

#### 6. **Admin Restrictions**
- Admins **cannot** vote in elections
- Admins **cannot** have voter profiles
- Admins **can** access dashboard (read-only for elections)
- Admins have full access to admin panel features

---

## 👥 User Roles & Permissions

### Voter Role (Default)
**Capabilities:**
- ✅ Register account
- ✅ Create voter profile
- ✅ View active/upcoming elections
- ✅ Cast votes in active elections
- ✅ View approved election results
- ✅ Access voting history
- ✅ View dashboard

**Restrictions:**
- ❌ Cannot access admin panel
- ❌ Cannot create/manage elections
- ❌ Cannot verify other voters

### Admin Role (Custom Claim: `role: 'admin'`)
**Capabilities:**
- ✅ Access admin dashboard
- ✅ Verify/reject voter registrations
- ✅ Create and manage elections
- ✅ Add candidates to elections
- ✅ Update election statuses
- ✅ Approve election results
- ✅ View system statistics
- ✅ Access audit logs
- ✅ View all elections (read-only)

**Restrictions:**
- ❌ Cannot vote in elections
- ❌ Cannot create voter profile
- ❌ Cannot access voter-specific pages (Profile, Vote)

**Access Points:**
- Admin login: `/admin/login`
- Admin dashboard: `/admin`
- Admin routes are protected by `AdminRoute` component

---

## 📁 Project Structure

```
Online_Voting_System_dummy/
│
├── backend/                          # Backend API Server
│   ├── config/
│   │   └── firebase.js               # Firebase Admin SDK configuration
│   ├── middleware/
│   │   └── auth.js                   # Authentication & authorization middleware
│   ├── routes/
│   │   ├── auth.js                   # Authentication endpoints
│   │   ├── elections.js              # Election management endpoints
│   │   ├── votes.js                  # Voting endpoints
│   │   └── admin.js                  # Admin-only endpoints
│   ├── scripts/
│   │   └── set-admin.js              # Script to assign admin role
│   ├── server.js                     # Express server entry point
│   ├── package.json                  # Backend dependencies
│   └── .env                          # Environment variables (not in repo)
│
├── frontend/                         # React Frontend Application
│   ├── public/
│   │   └── vote-icon.svg            # Public assets
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx           # Navigation component
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx      # Authentication context provider
│   │   ├── pages/
│   │   │   ├── admin/               # Admin-only pages
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminVoters.jsx
│   │   │   │   ├── AdminElections.jsx
│   │   │   │   ├── AdminCreateElection.jsx
│   │   │   │   └── AdminAuditLogs.jsx
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Login.jsx            # User login
│   │   │   ├── Register.jsx         # User registration
│   │   │   ├── Dashboard.jsx        # User dashboard
│   │   │   ├── Elections.jsx        # Elections listing
│   │   │   ├── ElectionDetail.jsx   # Election details
│   │   │   ├── Vote.jsx             # Voting interface
│   │   │   ├── Results.jsx          # Results display
│   │   │   ├── Profile.jsx          # User profile
│   │   │   └── NotFound.jsx          # 404 page
│   │   ├── services/
│   │   │   └── api.js               # API service functions
│   │   ├── config/
│   │   │   └── firebase.js          # Firebase client configuration
│   │   ├── App.jsx                   # Main app component with routing
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # Global styles
│   ├── index.html                    # HTML template
│   ├── vite.config.js                # Vite configuration
│   ├── package.json                  # Frontend dependencies
│   └── .env                          # Environment variables (not in repo)
│
├── firebase.json                     # Firebase project configuration
├── firestore.rules                   # Firestore security rules
├── firestore.indexes.json            # Firestore composite indexes
├── README.md                         # Main project documentation
├── Overview.md                       # This file - complete project overview
├── SETUP_GUIDE.md                    # Setup instructions
├── SET_ADMIN_GUIDE.md                # Admin role assignment guide
└── LICENSE                           # Project license
```

---

## 🔒 Security Features

### 1. **Authentication & Authorization**
- **Firebase Authentication**: Industry-standard authentication service
- **JWT Tokens**: Custom tokens for API authentication
- **Role-Based Access Control**: Admin vs Voter role separation
- **Token Verification**: All protected routes verify tokens
- **Session Management**: Secure session handling

### 2. **Vote Anonymity**
- **Cryptographic Hashing**: Votes stored with SHA-256 hash of `uid-electionId`
- **No Direct Link**: Votes cannot be traced back to individual voters
- **One-Way Hashing**: Prevents reverse lookup of voter identity
- **Vote Receipt Verification**: Voters can verify their vote was counted without revealing choice

### 3. **Data Protection**
- **Firestore Security Rules**: Database-level access control
- **HTTPS-Only**: All communication encrypted in transit
- **Input Validation**: Server-side validation of all inputs
- **SQL Injection Prevention**: Parameterized queries (Firestore handles this)
- **XSS Protection**: Helmet.js security headers
- **CORS Configuration**: Restricted cross-origin requests

### 4. **Rate Limiting**
- **API Rate Limiting**: 100 requests per 15 minutes (production)
- **Development Mode**: 1000 requests per 15 minutes
- **Health Check Exclusion**: `/health` endpoint excluded
- **DDoS Protection**: Prevents abuse and brute force attacks

### 5. **Audit Trail**
- **Complete Logging**: All system actions logged
- **Immutable Logs**: Audit logs cannot be modified
- **Timestamp Tracking**: Every action has precise timestamp
- **User Tracking**: Actions linked to user IDs and emails
- **IP Address Logging**: Security analysis and fraud detection
- **Action Types**: Categorized logging (VOTER_REGISTRATION, VOTE_CAST, etc.)

### 6. **Vote Integrity**
- **One Vote Per Election**: Enforced at database level
- **Election Status Validation**: Votes only accepted during active elections
- **Voter Eligibility Check**: Only verified, eligible voters can vote
- **Vote Hash Uniqueness**: Prevents duplicate voting attempts

---

## 🎯 API Documentation

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-api-domain.com/api`

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new voter account.
- **Body**: `{ email, password, firstName, lastName, dateOfBirth, nationalId, address, phoneNumber }`
- **Response**: `{ message, user }`
- **Status**: 201 Created

#### `GET /api/auth/profile`
Get current user's profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ profile }`
- **Status**: 200 OK
- **Note**: Returns 403 for admin users

#### `PUT /api/auth/profile`
Update user profile.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ firstName, lastName, dateOfBirth, nationalId, address, phoneNumber }`
- **Response**: `{ message, profile }`
- **Status**: 200 OK
- **Note**: Returns 403 for admin users

#### `GET /api/auth/status`
Check voter registration and verification status.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ registered, verified, eligible }`
- **Status**: 200 OK
- **Note**: Returns 403 for admin users

### Election Endpoints

#### `GET /api/elections`
Get all active elections.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ elections: [...] }`
- **Status**: 200 OK

#### `GET /api/elections/upcoming`
Get all upcoming elections.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ elections: [...] }`
- **Status**: 200 OK

#### `GET /api/elections/completed`
Get completed elections with approved results.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ elections: [...] }`
- **Status**: 200 OK

#### `GET /api/elections/:electionId`
Get election details with candidates.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ election, candidates: [...] }`
- **Status**: 200 OK

#### `GET /api/elections/:electionId/voted`
Check if user has voted in this election.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ hasVoted: boolean, registered: boolean }`
- **Status**: 200 OK

#### `GET /api/elections/:electionId/results`
Get election results.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ results: [...], election, totalVotes }`
- **Status**: 200 OK
- **Note**: Returns 403 if results not approved (for non-admin users)

### Voting Endpoints

#### `POST /api/votes`
Cast a vote in an election.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ electionId, candidateId }`
- **Response**: `{ message, voteReceipt }`
- **Status**: 201 Created
- **Note**: Returns 403 for admin users

#### `GET /api/votes/history`
Get user's voting history.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ votingHistory: [...] }`
- **Status**: 200 OK

#### `POST /api/votes/verify`
Verify vote receipt.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ electionId }`
- **Response**: `{ verified: boolean }`
- **Status**: 200 OK

### Admin Endpoints

#### `GET /api/admin/voters`
Get all voters (with optional filtering).
- **Headers**: `Authorization: Bearer <token>` (Admin only)
- **Query Params**: `?status=all|pending|verified|rejected`
- **Response**: `{ voters: [...] }`
- **Status**: 200 OK

#### `POST /api/admin/voters/:voterId/verify`
Verify or reject a voter.
- **Headers**: `Authorization: Bearer <token>` (Admin only)
- **Body**: `{ isVerified: boolean, isEligible: boolean }`
- **Response**: `{ message, voter }`
- **Status**: 200 OK

#### `GET /api/admin/elections`
Get all elections (admin view).
- **Headers**: `Authorization: Bearer <token>` (Admin only)
- **Response**: `{ elections: [...] }`
- **Status**: 200 OK

#### `POST /api/admin/elections`
Create a new election.
- **Headers**: `Authorization: Bearer <token>` (Admin only)
- **Body**: `{ title, description, type, startDate, endDate, allowedRegions }`
- **Response**: `{ message, election }`
- **Status**: 201 Created

#### `PATCH /api/admin/elections/:electionId/status`
Update election status.
- **Headers**: `Authorization: Bearer <token>` (Admin only)
- **Body**: `{ status: 'scheduled'|'active'|'completed'|'cancelled' }`
- **Response**: `{ message, election }`
- **Status**: 200 OK

#### `POST /api/admin/elections/:electionId/candidates`
Add a candidate to an election.
- **Headers**: `Authorization: Bearer <token>` (Admin only)
- **Body**: `{ name, party, biography, photoURL, position }`
- **Response**: `{ message, candidate }`
- **Status**: 201 Created

#### `POST /api/admin/elections/:electionId/approve-results`
Approve election results for public viewing.
- **Headers**: `Authorization: Bearer <token>` (Admin only)
- **Body**: `{ approved: boolean }`
- **Response**: `{ message, election }`
- **Status**: 200 OK

#### `GET /api/admin/statistics`
Get system statistics.
- **Headers**: `Authorization: Bearer <token>` (Admin only)
- **Response**: `{ totalVoters, verifiedVoters, activeElections, totalVotes, ... }`
- **Status**: 200 OK

#### `GET /api/admin/audit-logs`
Get system audit logs.
- **Headers**: `Authorization: Bearer <token>` (Admin only)
- **Query Params**: `?limit=100&action=VOTE_CAST`
- **Response**: `{ logs: [...] }`
- **Status**: 200 OK

---

## 🗄️ Database Schema

### Collections

#### `voterRegistry`
Stores voter registration information.

```javascript
{
  uid: string,                    // Firebase Auth UID
  email: string,                    // User email
  firstName: string,                // First name
  lastName: string,                 // Last name
  dateOfBirth: string,              // Date of birth (YYYY-MM-DD)
  nationalId: string,               // National ID number
  address: string,                  // Physical address
  phoneNumber: string,              // Phone number
  isVerified: boolean,              // Admin verification status
  isEligible: boolean,              // Eligibility status
  registeredAt: Timestamp,         // Registration timestamp
  updatedAt: Timestamp,            // Last update timestamp
  votingHistory: Array<{           // Voting history
    electionId: string,
    electionTitle: string,
    votedAt: Timestamp
  }>
}
```

#### `elections`
Stores election information.

```javascript
{
  title: string,                    // Election title
  description: string,              // Election description
  type: string,                     // Election type (e.g., "Presidential")
  startDate: Timestamp,            // Election start date
  endDate: Timestamp,              // Election end date
  status: string,                   // 'scheduled' | 'active' | 'completed' | 'cancelled'
  allowedRegions: Array<string>,   // Allowed voting regions
  totalVotes: number,               // Total votes cast
  resultsApproved: boolean,        // Whether results are approved for public viewing
  createdAt: Timestamp,            // Creation timestamp
  createdBy: string                 // Admin UID who created it
}
```

#### `candidates`
Stores candidate information for elections.

```javascript
{
  electionId: string,               // Reference to election
  name: string,                     // Candidate name
  party: string,                    // Party affiliation
  biography: string,                // Candidate biography
  photoURL: string,                 // Candidate photo URL
  position: number,                 // Position on ballot
  voteCount: number,                // Number of votes received
  createdAt: Timestamp             // Creation timestamp
}
```

#### `votes`
Stores vote records (anonymous).

```javascript
{
  voteHash: string,                 // SHA-256 hash of (uid-electionId)
  electionId: string,               // Election reference
  candidateId: string,              // Candidate reference
  votedAt: Timestamp,               // Vote timestamp
  verified: boolean                 // Vote verification status
}
```

#### `auditLogs`
Stores system audit trail.

```javascript
{
  action: string,                   // Action type (VOTER_REGISTRATION, VOTE_CAST, etc.)
  userId: string,                   // User UID
  email: string,                   // User email
  timestamp: Timestamp,             // Action timestamp
  details: {                        // Action-specific details
    // Varies by action type
  },
  ipAddress: string                 // User IP address
}
```

### Indexes

The following composite indexes are required in Firestore:

1. **elections** collection:
   - `status` (ASC), `endDate` (ASC), `startDate` (ASC)
   - `status` (ASC), `startDate` (ASC)
   - `status` (ASC), `resultsApproved` (ASC)

2. **candidates** collection:
   - `electionId` (ASC), `voteCount` (DESC)

3. **voterRegistry** collection:
   - `isVerified` (ASC), `registeredAt` (DESC)

---

## 🔄 User Workflows

### Voter Registration & Voting Workflow

```
1. User Registration
   ├── Create Firebase Auth account (email/password)
   └── Redirect to profile completion

2. Profile Completion
   ├── Fill personal information
   ├── Submit national ID
   └── Submit for admin verification

3. Admin Verification
   ├── Admin reviews profile
   ├── Admin approves/rejects
   └── Voter receives status update

4. Election Participation
   ├── Browse active elections
   ├── View election details
   ├── Cast vote (if eligible)
   └── Receive vote confirmation

5. Results Viewing
   ├── Wait for election completion
   ├── Wait for admin approval
   └── View results (if approved)
```

### Admin Election Management Workflow

```
1. Create Election
   ├── Fill election details
   ├── Set dates and regions
   └── Save election (status: scheduled)

2. Add Candidates
   ├── Select election
   ├── Add candidate information
   └── Upload candidate photo

3. Activate Election
   ├── Change status to 'active'
   └── Election becomes available for voting

4. Monitor Voting
   ├── View statistics
   ├── Check audit logs
   └── Monitor voter participation

5. Complete Election
   ├── Change status to 'completed'
   ├── Review results
   ├── Approve results (if valid)
   └── Results become visible to voters
```

### Voter Verification Workflow

```
1. Voter Submits Registration
   └── Status: Pending Verification

2. Admin Reviews Registration
   ├── Check personal information
   ├── Verify national ID
   └── Review eligibility

3. Admin Decision
   ├── Approve → isVerified: true, isEligible: true
   ├── Reject → isVerified: false, isEligible: false
   └── Update voter status

4. Voter Notification
   └── Status updated in dashboard
```

---

## 🆕 Recent Enhancements

### 1. **Admin Role Management**
- ✅ Dedicated admin login page (`/admin/login`)
- ✅ Script-based admin role assignment (`npm run set-admin`)
- ✅ Firebase Custom Claims integration
- ✅ Role-based route protection

### 2. **Admin Restrictions**
- ✅ Admins cannot vote in elections
- ✅ Admins cannot create voter profiles
- ✅ Admins redirected from voter-specific pages
- ✅ Admin-specific dashboard view

### 3. **Voter Verification from Dashboard**
- ✅ Admin can verify voters directly from dashboard
- ✅ Filter voters by verification status
- ✅ Bulk verification capabilities
- ✅ Real-time status updates

### 4. **Results Approval System**
- ✅ Admin can approve/reject election results
- ✅ Results only visible after approval
- ✅ Preview results before approval
- ✅ Results tab in Elections page
- ✅ Results section in Dashboard

### 5. **Completed Elections View**
- ✅ New `/api/elections/completed` endpoint
- ✅ "Results" tab in Elections page
- ✅ Dashboard results section
- ✅ Direct results access from election cards

### 6. **Timestamp Serialization**
- ✅ Consistent date handling across frontend/backend
- ✅ Firestore Timestamp serialization
- ✅ Date display improvements
- ✅ Cross-browser compatibility

### 7. **Error Handling & Fallbacks**
- ✅ Fallback logic for missing Firestore indexes
- ✅ In-memory sorting when queries fail
- ✅ Graceful error handling
- ✅ User-friendly error messages

### 8. **Rate Limiting Improvements**
- ✅ Development-friendly rate limits
- ✅ Health check exclusion
- ✅ Retry mechanism for 429 errors
- ✅ Better error messaging

---

## 🚀 Setup & Deployment

### Prerequisites
- Node.js v16 or higher
- npm or yarn package manager
- Firebase account and project
- Git (for version control)

### Initial Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Online_Voting_System_dummy
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Firebase credentials
npm run dev  # Development mode
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Firebase web config
npm run dev  # Development mode
```

#### 4. Firebase Configuration
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Download service account key (for backend)
5. Get web app config (for frontend)
6. Deploy Firestore rules: `firebase deploy --only firestore`

#### 5. Set Admin Role
```bash
cd backend
npm run set-admin <admin-email>
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5000/api
```

### Deployment

#### Backend Deployment
- Deploy to services like Heroku, Railway, or AWS
- Set environment variables in hosting platform
- Ensure Firebase credentials are properly configured

#### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to hosting service
# Or use Firebase Hosting:
firebase deploy --only hosting
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set secure JWT secret
- [ ] Enable Firebase security rules
- [ ] Deploy Firestore indexes
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Enable HTTPS
- [ ] Test all user workflows
- [ ] Verify admin access

---

## 📊 System Statistics

The system tracks various metrics:
- Total registered voters
- Verified voters count
- Active elections
- Total votes cast
- System uptime
- Recent activity

---

## 🔍 Troubleshooting

### Common Issues

1. **Firestore Index Errors**
   - Deploy indexes: `firebase deploy --only firestore:indexes`
   - Or create manually via Firebase Console

2. **Authentication Errors**
   - Verify Firebase credentials
   - Check Firebase Authentication is enabled
   - Ensure correct project ID

3. **CORS Errors**
   - Add frontend URL to `ALLOWED_ORIGINS`
   - Check backend CORS configuration

4. **Admin Access Issues**
   - Verify custom claims are set
   - User must sign out and sign back in
   - Check Firebase Console for role assignment

---

## 📝 License

This project is licensed under the ISC License.

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

For support and questions:
- Check documentation files in project root
- Review troubleshooting guides
- Open an issue on GitHub

---

**Made with ❤️ for Democracy**

*Last Updated: December 2025*

