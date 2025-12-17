# Online Voting System

A secure, government-grade online voting platform built with React, Node.js, Express, and Firebase.

## 🚀 Features

### Security
- **Military-grade encryption**: End-to-end encryption for all data
- **Firebase Authentication**: Secure user authentication
- **Anonymous voting**: Votes cannot be traced back to individual voters
- **Voter verification**: Multi-step identity verification process
- **Rate limiting**: Protection against DDoS attacks
- **Audit logs**: Complete system activity tracking

### Core Functionality
- **User Registration**: Secure voter registration with identity verification
- **Election Management**: Create and manage multiple elections
- **Real-time Voting**: Cast votes in active elections
- **Results Dashboard**: View election results after polls close
- **Admin Panel**: Comprehensive admin tools for election management
- **Voter History**: Track participation in past elections

### User Roles
- **Voters**: Register, get verified, and vote in elections
- **Admins**: Manage voters, create elections, add candidates, monitor system

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern UI library
- **React Router**: Client-side routing
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client
- **Lucide React**: Icon library
- **CSS3**: Custom styling with CSS variables

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **Firebase Admin SDK**: Backend Firebase integration
- **Helmet**: Security middleware
- **Express Rate Limit**: API rate limiting
- **CORS**: Cross-origin resource sharing

### Database & Authentication
- **Firebase Authentication**: User authentication
- **Cloud Firestore**: NoSQL database
- **Firebase Hosting**: Static site hosting

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Online_Voting_System_dummy
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Add your Firebase credentials to .env
# You'll need:
# - Firebase Project ID
# - Firebase Private Key
# - Firebase Client Email
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Add your Firebase web config to .env
```

### 4. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Download service account key (for backend)
5. Get web app config (for frontend)

### 5. Deploy Firestore Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select your project)
firebase init

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

## 🚀 Running the Application

### Development Mode

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

### Deploy to Firebase Hosting

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Firebase (from project root)
cd ..
firebase deploy --only hosting
```

## 📁 Project Structure

```
Online_Voting_System_dummy/
├── backend/                   # Backend API
│   ├── config/               # Backend configuration
│   │   └── firebase.js       # Firebase Admin setup
│   ├── middleware/           # Express middleware
│   │   └── auth.js           # Authentication middleware
│   ├── routes/               # API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── elections.js      # Election routes
│   │   ├── votes.js          # Voting routes
│   │   └── admin.js          # Admin routes
│   ├── server.js             # Express server
│   ├── package.json          # Backend dependencies
│   └── .env.example          # Environment variables template
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts
│   │   ├── pages/            # Page components
│   │   │   ├── admin/       # Admin pages
│   │   │   └── ...          # User pages
│   │   ├── services/         # API services
│   │   ├── config/           # Configuration
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json          # Frontend dependencies
│   └── .env.example          # Environment variables template
├── firebase.json             # Firebase config
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore indexes
└── README.md
```

## 🔐 Security Features

### Authentication & Authorization
- Firebase Authentication for user management
- Custom JWT tokens for API authentication
- Role-based access control (voter/admin)
- Token verification on all protected routes

### Vote Anonymity
- Votes stored with cryptographic hashes
- No direct link between voter and vote choice
- One-way hashing prevents reverse lookup
- Vote receipt verification without revealing choice

### Data Protection
- Firestore security rules enforce access control
- HTTPS-only communication
- Input validation and sanitization
- SQL injection prevention
- XSS protection with Helmet.js

### Audit Trail
- Complete logging of all system actions
- Immutable audit logs
- Timestamp and user tracking
- IP address logging for security analysis

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new voter
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/status` - Check voter status

### Elections
- `GET /api/elections` - Get active elections
- `GET /api/elections/upcoming` - Get upcoming elections
- `GET /api/elections/:id` - Get election details
- `GET /api/elections/:id/voted` - Check if voted
- `GET /api/elections/:id/results` - Get election results

### Voting
- `POST /api/votes` - Cast a vote
- `GET /api/votes/history` - Get voting history
- `POST /api/votes/verify` - Verify vote receipt

### Admin
- `GET /api/admin/voters` - Get all voters
- `POST /api/admin/voters/:id/verify` - Verify voter
- `POST /api/admin/elections` - Create election
- `PATCH /api/admin/elections/:id/status` - Update election status
- `POST /api/admin/elections/:id/candidates` - Add candidate
- `GET /api/admin/statistics` - Get system statistics
- `GET /api/admin/audit-logs` - Get audit logs

## 👥 User Guide

### For Voters

1. **Register**: Create an account with email and password
2. **Complete Profile**: Provide personal information and national ID
3. **Wait for Verification**: Admin must verify your identity
4. **Browse Elections**: View active and upcoming elections
5. **Cast Vote**: Select your candidate and submit
6. **Verify Vote**: Confirm your vote was recorded
7. **View History**: Track your voting participation

### For Admins

1. **Access Admin Panel**: Navigate to `/admin` (requires admin role)
2. **Verify Voters**: Review and approve voter registrations
3. **Create Elections**: Set up new elections with dates
4. **Add Candidates**: Add candidates to elections
5. **Manage Status**: Activate, complete, or cancel elections
6. **Monitor System**: View statistics and audit logs

## 🔧 Configuration

### Environment Variables

**Backend (backend/.env):**
```env
PORT=5000
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend (frontend/.env):**
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5000/api
```

## 📊 Database Schema

### Collections

**voterRegistry**
- uid, email, firstName, lastName
- dateOfBirth, nationalId, address, phoneNumber
- isVerified, isEligible, registeredAt
- votingHistory[]

**elections**
- title, description, type
- startDate, endDate, status
- allowedRegions[], totalVotes
- createdAt, createdBy

**candidates**
- electionId, name, party
- biography, photoURL, position
- voteCount, createdAt

**votes**
- voteHash (SHA-256 of uid-electionId)
- electionId, votedAt, verified

**auditLogs**
- action, userId, email
- timestamp, details, ipAddress

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client
npm test
```

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Authentication Error**
   - Verify your Firebase credentials
   - Check if Authentication is enabled in Firebase Console

2. **CORS Error**
   - Add your frontend URL to ALLOWED_ORIGINS in backend .env
   - Check CORS configuration in server.js

3. **Firestore Permission Denied**
   - Deploy firestore.rules: `firebase deploy --only firestore:rules`
   - Verify user authentication token

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Clear cache: `npm cache clean --force`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🔒 Security Disclosure

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

## 📞 Support

For support, email support@example.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Firebase for authentication and database
- React community for excellent libraries
- All contributors to this project

---

**Made with ❤️ for Democracy**

