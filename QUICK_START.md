# 🚀 Quick Start Guide

Get your Online Voting System running in **5 minutes**!

---

## Prerequisites Check

Before starting, ensure you have:
```bash
# Check Node.js version (need v16+)
node --version

# Check npm
npm --version
```

If not installed, download from: https://nodejs.org/

---

## Step 1: Firebase Setup (2 minutes)

1. **Create Firebase Project**
   - Go to: https://console.firebase.google.com
   - Click "Add project"
   - Name: `voting-system`
   - Click through to create

2. **Enable Authentication**
   - Left menu → Authentication → Get started
   - Select "Email/Password" → Enable → Save

3. **Create Firestore Database**
   - Left menu → Firestore Database → Create database
   - Select "Production mode" → Next
   - Choose your location → Enable

---

## Step 2: Get Firebase Credentials (1 minute)

### For Frontend (Web Config)
1. Project Settings (gear icon) → Your apps
2. Click Web icon (</>)
3. Register app: `voting-web`
4. Copy the `firebaseConfig` object

### For Backend (Service Account)
1. Project Settings → Service accounts
2. Click "Generate new private key"
3. Save the JSON file (keep it secure!)

---

## Step 3: Install & Configure (2 minutes)

```bash
# Navigate to project
cd Online_Voting_System_dummy

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install

# Create environment files
cd ../backend
cp .env.example .env
cd ../frontend
cp .env.example .env
cd ..
```

**Edit `backend/.env` (Backend):**
```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
JWT_SECRET=generate-a-random-secret-here
ALLOWED_ORIGINS=http://localhost:3000
```

**Edit `frontend/.env` (Frontend):**
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5000/api
```

---

## Step 4: Deploy Firestore Rules (1 minute)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select your project, accept defaults)
firebase init

# Deploy rules
firebase deploy --only firestore
```

---

## Step 5: Start the Application (30 seconds)

**Terminal 1 (Backend):**
```bash
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

**Access:** http://localhost:3000

---

## Step 6: Create Admin User

### Option 1: Firebase Console
1. Register a user in the app
2. Firebase Console → Authentication
3. Find your user → Custom claims tab
4. Add: `{"role": "admin"}`

### Option 2: Quick Script
Create `create-admin.js`:
```javascript
const admin = require('firebase-admin');
admin.initializeApp();

admin.auth().setCustomUserClaims('USER_UID_HERE', { role: 'admin' })
  .then(() => console.log('Admin created!'));
```

---

## 🎉 You're Done!

### Test the System

1. **Register**: http://localhost:3000/register
2. **Login**: http://localhost:3000/login
3. **Admin Panel**: http://localhost:3000/admin (after making yourself admin)

### Quick Demo Flow

1. Login as admin
2. Go to `/admin/voters` - verify your user
3. Go to `/admin/elections/create` - create an election
4. Add 2-3 candidates
5. Update election status to "active"
6. Login as regular user
7. Go to `/elections` - vote in the election
8. Admin marks election as "completed"
9. View results at `/results/:electionId`

---

## 🆘 Quick Troubleshooting

**Backend won't start?**
```bash
# Check .env file has all variables
cat .env

# Try with production mode
NODE_ENV=production npm start
```

**Frontend can't connect?**
```bash
# Check backend is running on port 5000
curl http://localhost:5000/health

# Check VITE_API_URL in frontend/.env
cat frontend/.env | grep VITE_API_URL
```

**Can't login?**
```bash
# Check Firebase Auth is enabled
# Check firebaseConfig in frontend/.env
```

**Firestore permission denied?**
```bash
# Redeploy rules
firebase deploy --only firestore:rules
```

---

## 📚 Next Steps

- Read full documentation: `README.md`
- Detailed setup: `SETUP_GUIDE.md`
- Security information: `SECURITY.md`
- Development log: `Task done.md`

---

## 🎯 Common Commands

```bash
# Backend (from project root)
cd backend
npm run dev          # Development mode
npm start            # Production mode

# Frontend (from project root)
cd frontend
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Preview production build

# Firebase (from project root)
firebase deploy --only firestore    # Deploy rules
firebase deploy --only hosting      # Deploy frontend
firebase deploy                     # Deploy everything
```

---

## 📞 Need Help?

- Check `SETUP_GUIDE.md` for detailed instructions
- Check `README.md` for comprehensive documentation
- Open an issue on GitHub
- Review error messages in terminal

---

**Estimated Total Time**: 5-10 minutes  
**Difficulty**: Easy  
**Support**: See full documentation  

Happy Voting! 🗳️

