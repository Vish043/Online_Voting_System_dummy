# Backend - Online Voting System API

Node.js + Express + Firebase Admin backend for the Online Voting System.

## 📁 Structure

```
backend/
├── config/           # Configuration files
│   └── firebase.js   # Firebase Admin SDK setup
├── middleware/       # Express middleware
│   └── auth.js       # Authentication middleware
├── routes/           # API routes
│   ├── auth.js       # Authentication endpoints
│   ├── elections.js  # Election endpoints
│   ├── votes.js      # Voting endpoints
│   └── admin.js      # Admin endpoints
├── server.js         # Express server entry point
├── package.json      # Dependencies
└── .env.example      # Environment variables template
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

### 3. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new voter
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `GET /status` - Check voter status

### Elections (`/api/elections`)
- `GET /` - Get active elections
- `GET /upcoming` - Get upcoming elections
- `GET /:id` - Get election details
- `GET /:id/voted` - Check if voted
- `GET /:id/results` - Get results

### Voting (`/api/votes`)
- `POST /` - Cast vote
- `GET /history` - Get voting history
- `POST /verify` - Verify vote

### Admin (`/api/admin`)
- `GET /voters` - List voters
- `POST /voters/:id/verify` - Verify voter
- `POST /elections` - Create election
- `GET /elections` - List all elections
- `PATCH /elections/:id/status` - Update status
- `POST /elections/:id/candidates` - Add candidate
- `GET /statistics` - System statistics
- `GET /audit-logs` - Audit logs
- `POST /set-admin` - Grant admin role

## 🔐 Environment Variables

```env
PORT=5000
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=http://localhost:3000
```

## 🛠️ Dependencies

- **express** - Web framework
- **cors** - CORS middleware
- **helmet** - Security headers
- **firebase-admin** - Firebase Admin SDK
- **express-rate-limit** - Rate limiting
- **dotenv** - Environment variables

## 🔒 Security Features

- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration
- Input validation
- Role-based access control

## 📊 Database Collections

- **voterRegistry** - Voter information
- **elections** - Election details
- **candidates** - Candidate information
- **votes** - Anonymous vote records
- **auditLogs** - System activity logs

## 🚀 Deployment

### Option 1: Firebase Cloud Functions
```bash
firebase deploy --only functions
```

### Option 2: Heroku
```bash
heroku create your-voting-api
git push heroku main
```

### Option 3: Docker
```bash
docker build -t voting-api .
docker run -p 5000:5000 voting-api
```

## 🧪 Testing

```bash
# Health check
curl http://localhost:5000/health

# Test endpoint (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/elections
```

## 📝 Scripts

- `npm run dev` - Start with nodemon (auto-reload)
- `npm start` - Start production server
- `npm test` - Run tests (if configured)

## 🆘 Troubleshooting

**Firebase initialization error:**
- Check FIREBASE_PRIVATE_KEY format (must include \n for newlines)
- Ensure all Firebase env variables are set

**CORS error:**
- Add frontend URL to ALLOWED_ORIGINS

**Port already in use:**
- Change PORT in .env file
- Kill process using port 5000

## 📞 Support

See main README.md in root directory for complete documentation.

