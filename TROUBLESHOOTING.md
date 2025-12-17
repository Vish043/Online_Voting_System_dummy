# 🔧 Troubleshooting Guide

Common issues and solutions for the Online Voting System.

---

## 🚨 "Failed to update profile"

### Symptoms
- Clicking "Save Changes" in profile page shows error
- Error message: "Failed to update profile"

### Causes & Solutions

#### 1. Backend Not Running

**Check:**
```bash
curl http://localhost:5000/health
```

**If it fails:**
```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ Firebase Admin SDK initialized successfully
🚀 Voting System API running on port 5000
```

#### 2. Not Registered Yet

**You must register before updating profile!**

1. Go to http://localhost:3000/register
2. Fill in registration form (all required fields)
3. Click "Register"
4. Login with your credentials
5. Then you can update profile

#### 3. Backend Environment Not Configured

**Check if `backend/.env` exists:**
```bash
cd backend
ls .env
# or on Windows:
dir .env
```

**If missing:**
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

**Required in `backend/.env`:**
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- JWT_SECRET
- ALLOWED_ORIGINS=http://localhost:3000

#### 4. CORS Error

**Open browser console (F12) and check for:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/...' has been blocked by CORS policy
```

**Fix:** Add frontend URL to backend CORS:
```env
# In backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Then restart backend:
```bash
cd backend
# Ctrl+C to stop
npm run dev
```

---

## 🚨 "Firebase: Error (auth/configuration-not-found)"

### Symptoms
- Frontend won't load
- Login/Register pages show Firebase error
- Browser console shows auth configuration error

### Solution

See **fix-firebase-auth.md** for detailed fix, or quick fix:

1. Create `frontend/.env` from example:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Get Firebase config from [Firebase Console](https://console.firebase.google.com)

3. Fill in `frontend/.env`:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_API_URL=http://localhost:5000/api
   ```

4. Enable Firebase Authentication:
   - Firebase Console → Authentication → Get Started
   - Enable Email/Password

5. Restart frontend:
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

---

## 🚨 Backend Won't Start

### Symptoms
- `npm run dev` in backend folder shows errors
- Firebase initialization errors
- Port already in use

### Solutions

#### Firebase Init Error

```
❌ Firebase initialization error: Error: The default Firebase app does not exist
```

**Cause:** Missing or incorrect Firebase credentials

**Fix:**
1. Make sure `backend/.env` exists
2. Verify Firebase credentials are correct
3. Check `FIREBASE_PRIVATE_KEY` format (must have quotes and \n)

**Correct format:**
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution 1:** Kill process on port 5000
```bash
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

**Solution 2:** Change port in backend/.env
```env
PORT=5001
```

Also update frontend API URL:
```env
# frontend/.env
VITE_API_URL=http://localhost:5001/api
```

---

## 🚨 Frontend Won't Start

### Port Already in Use

**Solution:** Vite will automatically try next available port (3001, 3002, etc.)

Or specify a different port:
```bash
npm run dev -- --port 3001
```

Update backend CORS:
```env
# backend/.env
ALLOWED_ORIGINS=http://localhost:3001
```

---

## 🚨 "Network Error" or "Failed to Fetch"

### Symptoms
- API calls failing
- "Network Error" in console
- Can't login, register, or fetch data

### Causes & Solutions

#### 1. Backend Not Running
```bash
cd backend
npm run dev
```

#### 2. Wrong API URL

Check `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Must match backend port!

#### 3. Firewall Blocking

- Check Windows Defender / Firewall
- Allow Node.js through firewall
- Try accessing directly: http://localhost:5000/health

---

## 🚨 "Voter not registered" Error

### Symptoms
- Can't vote
- Error: "Voter not registered"
- Can't access certain features

### Solution

You need to complete registration:

1. **Register:**
   - Go to /register
   - Fill in ALL required fields
   - Click Register

2. **Wait for Admin Verification:**
   - Your account needs admin approval
   - Admin must verify you in admin panel

3. **Create First Admin:**
   ```bash
   # Method 1: Firebase Console
   # Go to Authentication → Users → Select your user
   # Custom Claims → Add: {"role": "admin"}
   
   # Method 2: If you have existing admin
   # POST to /api/admin/set-admin with userId
   ```

4. **Admin Verifies You:**
   - Login as admin
   - Go to /admin/voters
   - Find pending voter
   - Click "Approve"

---

## 🚨 "Permission Denied" / Firestore Errors

### Symptoms
- Firestore permission errors
- Can't read/write data
- 403 Forbidden errors

### Solution

Deploy Firestore security rules:

```bash
# From project root
firebase login
firebase init  # Select Firestore (if not done)
firebase deploy --only firestore
```

Make sure `firestore.rules` exists in project root.

---

## 🚨 Can't Vote in Election

### Checklist

- [ ] **Registered?** Go to /register
- [ ] **Verified?** Admin must verify you
- [ ] **Eligible?** Admin must mark you eligible
- [ ] **Election Active?** Check election dates
- [ ] **Already Voted?** Can only vote once

### Debug Steps

1. Check voter status:
   ```
   GET http://localhost:5000/api/auth/status
   ```
   Should return:
   ```json
   {
     "registered": true,
     "verified": true,
     "eligible": true
   }
   ```

2. Check if already voted:
   ```
   GET http://localhost:5000/api/elections/:electionId/voted
   ```

---

## 🚨 Environment Variables Not Working

### Symptoms
- Changed .env but no effect
- Still using default values
- Configuration not loading

### Solutions

1. **Restart the server!** (Most common issue)
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

2. **Check file name:**
   - Must be exactly `.env` (not `.env.txt`)
   - Must be in correct folder (backend/.env or frontend/.env)

3. **Check variable names:**
   - Backend: No prefix needed
   - Frontend: Must start with `VITE_`

4. **No quotes needed** (unless value has spaces):
   ```env
   # Wrong:
   VITE_API_URL="http://localhost:5000/api"
   
   # Right:
   VITE_API_URL=http://localhost:5000/api
   ```

---

## 🚨 Database/Firestore Issues

### "Document not found"

**Cause:** Trying to access non-existent data

**Fix:** Make sure you've:
1. Registered
2. Created elections (if admin)
3. Added candidates to elections

### "Quota Exceeded"

**Cause:** Free tier limits reached

**Fix:**
- Check Firebase Console → Usage
- Optimize queries
- Add indexes
- Upgrade plan if needed

---

## 🔍 General Debugging Steps

### 1. Check All Servers Running

```bash
# Backend should be on port 5000
curl http://localhost:5000/health

# Frontend should be on port 3000
# Open http://localhost:3000 in browser
```

### 2. Check Browser Console (F12)

- Look for red errors
- Check Network tab for failed requests
- Verify API calls are being made

### 3. Check Backend Terminal

- Look for errors
- Check if requests are being received
- Verify Firebase initialization message

### 4. Verify Environment Files

```bash
# Backend
cat backend/.env | grep FIREBASE_PROJECT_ID

# Frontend  
cat frontend/.env | grep VITE_FIREBASE_API_KEY
```

### 5. Test Endpoints Manually

```bash
# Health check
curl http://localhost:5000/health

# With auth (replace TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/elections
```

---

## 📋 Complete Startup Checklist

Run these in order for a clean start:

### Terminal 1 (Backend)
```bash
cd backend
# Check .env exists
ls .env
# Start server
npm run dev
# Wait for: "Firebase Admin SDK initialized successfully"
```

### Terminal 2 (Frontend)
```bash
cd frontend
# Check .env exists
ls .env
# Start server
npm run dev
# Wait for: "Local: http://localhost:3000/"
```

### Browser
```
1. Open http://localhost:3000
2. Press F12 (DevTools)
3. Check Console for errors
4. Check Network tab for failed requests
```

---

## 🆘 Still Stuck?

### Information to Gather

When asking for help, provide:

1. **Which error** exactly (copy full error message)
2. **Browser console** output (F12 → Console)
3. **Backend terminal** output
4. **What you were trying to do**
5. **Steps you've already tried**

### Files to Check

- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration
- `firestore.rules` - Database security rules
- Browser DevTools Console (F12)
- Backend terminal output

---

## 📚 Related Documentation

- **ENV_SETUP_GUIDE.md** - Environment variable setup
- **fix-firebase-auth.md** - Firebase auth issues
- **SETUP_GUIDE.md** - Complete setup guide
- **QUICK_START.md** - Quick 5-minute setup
- **START_HERE.md** - Getting started

---

**Last Updated:** December 17, 2024  
**Status:** Active troubleshooting guide

