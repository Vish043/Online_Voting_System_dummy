# 🚀 Online Voting System - Quick Setup Guide

This guide will help you get the Online Voting System up and running quickly.

---

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js (v16 or higher) installed
- ✅ npm or yarn package manager
- ✅ A Firebase account (free tier works)
- ✅ A code editor (VS Code recommended)
- ✅ Terminal/Command Prompt access

---

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter project name: "online-voting-system"
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Select "Email/Password"
4. Enable it and click "Save"

### 1.3 Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location closest to your users
5. Click "Enable"

### 1.4 Get Firebase Web Config
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (</>)
4. Register app name: "voting-web-app"
5. Copy the firebaseConfig object

### 1.5 Get Firebase Admin Credentials
1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Save the JSON file securely (DO NOT commit to git)

---

## Step 2: Backend Setup

### 2.1 Install Dependencies
```bash
# Navigate to project root
cd Online_Voting_System_dummy

# Navigate to backend folder
cd backend

# Install backend dependencies
npm install
```

### 2.2 Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Add your Firebase credentials to `.env`:
```env
PORT=5000
NODE_ENV=development

# From Firebase Admin SDK (service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Generate a random secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Allow frontend origin
ALLOWED_ORIGINS=http://localhost:3000
```

**Tips:**
- The private key must be wrapped in quotes and include \n for newlines
- Generate JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 2.3 Test Backend
```bash
# Make sure you're in the backend directory
npm run dev
```

You should see:
```
🚀 Voting System API running on port 5000
📊 Environment: development
🔒 Security measures active
✅ Firebase Admin SDK initialized successfully
```

---

## Step 3: Frontend Setup

### 3.1 Install Dependencies
```bash
# Navigate to frontend folder (from project root)
cd ../frontend

# Install frontend dependencies
npm install
```

### 3.2 Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env file
nano .env
```

Add your Firebase web config to `.env`:
```env
# From Firebase Web App Config
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# API URL (keep as is for local development)
VITE_API_URL=http://localhost:5000/api
```

### 3.3 Test Frontend
```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## Step 4: Deploy Firebase Rules

### 4.1 Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 4.2 Login to Firebase
```bash
firebase login
```

### 4.3 Initialize Firebase
```bash
# From project root
cd ..  # Go back to project root
firebase init
```

Select:
- ✅ Firestore (rules and indexes)
- ✅ Hosting
- Choose your existing project
- Accept default Firestore rules file: `firestore.rules`
- Accept default Firestore indexes file: `firestore.indexes.json`
- Public directory: `client/dist`
- Configure as SPA: Yes
- Don't overwrite files

### 4.4 Deploy Rules and Indexes
```bash
firebase deploy --only firestore
```

You should see:
```
✔  Deploy complete!
```

---

## Step 5: Run the Application

### 5.1 Start Backend (Terminal 1)
```bash
# From project root
cd backend
npm run dev
```

### 5.2 Start Frontend (Terminal 2)
```bash
# From project root
cd frontend
npm run dev
```

### 5.3 Access the Application
Open your browser and go to: http://localhost:3000

---

## Step 6: Create First Admin User

### Method 1: Using Firebase Console
1. Register a user through the app (http://localhost:3000/register)
2. Go to Firebase Console → Authentication
3. Find your user
4. Click on the user → Custom claims
5. Add: `{"role": "admin"}`

### Method 2: Using Backend (If you already have an admin)
```bash
curl -X POST http://localhost:5000/api/admin/set-admin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_UID_HERE"}'
```

---

## Step 7: Test the System

### As a Regular User:
1. ✅ Register at `/register`
2. ✅ Login at `/login`
3. ✅ View dashboard at `/dashboard`
4. ✅ Wait for admin verification

### As an Admin:
1. ✅ Login with admin account
2. ✅ Go to `/admin`
3. ✅ Verify pending voters at `/admin/voters`
4. ✅ Create election at `/admin/elections/create`
5. ✅ Add candidates to election
6. ✅ Activate election

### Vote in Election:
1. ✅ Go to `/elections`
2. ✅ Select an active election
3. ✅ Click "Vote Now"
4. ✅ Select a candidate
5. ✅ Confirm vote

### View Results:
1. ✅ Admin marks election as completed
2. ✅ Go to `/results/:electionId`
3. ✅ View vote counts and percentages

---

## Troubleshooting

### Backend won't start
**Problem**: Firebase initialization error  
**Solution**: Check your .env file, ensure FIREBASE_PRIVATE_KEY is properly formatted with quotes and \n

### Frontend can't connect to backend
**Problem**: CORS error  
**Solution**: Ensure ALLOWED_ORIGINS in backend .env includes http://localhost:3000

### Can't read/write to Firestore
**Problem**: Permission denied  
**Solution**: Deploy firestore rules: `firebase deploy --only firestore:rules`

### Firebase Authentication not working
**Problem**: Invalid API key  
**Solution**: Double-check VITE_FIREBASE_API_KEY in frontend .env

### Can't vote
**Problem**: User not verified  
**Solution**: Admin must verify user in `/admin/voters`

---

## Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Deploy to Firebase Hosting
```bash
# From project root (go back one directory if you're in frontend)
cd ..
firebase deploy --only hosting
```

### Deploy Backend
Options:
1. **Firebase Cloud Functions** (recommended)
2. **Heroku**
3. **AWS EC2**
4. **Google Cloud Run**
5. **DigitalOcean**

Update `VITE_API_URL` in production `.env` to your backend URL.

---

## Quick Commands Reference

```bash
# Backend
npm run dev          # Start development server
npm start            # Start production server

# Frontend
cd client
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Firebase
firebase login       # Login to Firebase
firebase init        # Initialize Firebase
firebase deploy      # Deploy everything
firebase deploy --only firestore    # Deploy rules only
firebase deploy --only hosting      # Deploy hosting only
```

---

## Environment Variables Checklist

### Backend (backend/.env)
- [ ] PORT
- [ ] NODE_ENV
- [ ] FIREBASE_PROJECT_ID
- [ ] FIREBASE_PRIVATE_KEY
- [ ] FIREBASE_CLIENT_EMAIL
- [ ] JWT_SECRET
- [ ] ALLOWED_ORIGINS

### Frontend (frontend/.env)
- [ ] VITE_FIREBASE_API_KEY
- [ ] VITE_FIREBASE_AUTH_DOMAIN
- [ ] VITE_FIREBASE_PROJECT_ID
- [ ] VITE_FIREBASE_STORAGE_BUCKET
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
- [ ] VITE_FIREBASE_APP_ID
- [ ] VITE_API_URL

---

## Security Checklist Before Production

- [ ] Change all default passwords and secrets
- [ ] Enable Firebase App Check
- [ ] Set up rate limiting appropriately
- [ ] Configure production CORS origins
- [ ] Enable HTTPS only
- [ ] Review and test Firestore security rules
- [ ] Set up monitoring and alerts
- [ ] Backup strategy in place
- [ ] Audit logging enabled
- [ ] Regular security updates scheduled

---

## Support

If you encounter issues:
1. Check the main README.md for detailed documentation
2. Review Firebase Console for errors
3. Check browser console for frontend errors
4. Check backend terminal logs
5. Review Firestore rules and indexes

---

**Setup Time**: Approximately 30-45 minutes  
**Difficulty**: Intermediate  
**Support**: See README.md for detailed help

---

🎉 **Congratulations!** Your Online Voting System is now ready to use!

