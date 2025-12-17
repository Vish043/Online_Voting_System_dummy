# 🔐 Environment Variables Setup Guide

This guide explains how to configure the `.env` files for both backend and frontend.

---

## 📋 Overview

The project requires two separate `.env` files:
- **Backend**: `backend/.env` - For Node.js API server
- **Frontend**: `frontend/.env` - For React application

---

## 🔧 Backend Environment Setup

### Step 1: Create Backend .env File

```bash
cd backend
cp .env.example .env
```

### Step 2: Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **⚙️ Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file (keep it secure!)

### Step 3: Configure Backend .env

Open `backend/.env` and fill in these values:

```env
PORT=5000
NODE_ENV=development

# From the downloaded JSON file:
FIREBASE_PROJECT_ID=your-project-id                    # "project_id" field
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"  # "private_key" field (keep quotes!)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com    # "client_email" field

# Generate a random secret:
JWT_SECRET=your-generated-secret-here                   # See below for generation

# Your frontend URL:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Generate JWT Secret

Run this command to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as your `JWT_SECRET`.

### Important Notes

⚠️ **FIREBASE_PRIVATE_KEY must keep the quotes!**
- Keep the quotes around the entire key
- The `\n` characters represent newlines (don't replace them)
- Example: `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABCDEF...\n-----END PRIVATE KEY-----\n"`

---

## 🎨 Frontend Environment Setup

### Step 1: Create Frontend .env File

```bash
cd frontend
cp .env.example .env
```

### Step 2: Get Firebase Web Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **⚙️ Settings** → **Project Settings**
4. Scroll to **Your apps** section
5. Click the **Web app** icon (`</>`) or select your existing web app
6. Copy the `firebaseConfig` object values

### Step 3: Configure Frontend .env

Open `frontend/.env` and fill in these values:

```env
# From Firebase Web App Config:
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop

# Backend API URL (local development):
VITE_API_URL=http://localhost:5000/api
```

### Mapping Firebase Config to Environment Variables

```javascript
// Firebase Console shows:
const firebaseConfig = {
  apiKey: "AIza...",              // → VITE_FIREBASE_API_KEY
  authDomain: "proj.firebaseapp.com", // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "your-project",      // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "proj.appspot.com", // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456",    // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc"          // → VITE_FIREBASE_APP_ID
};
```

---

## ✅ Verification Checklist

### Backend (`backend/.env`)
- [ ] PORT set (default: 5000)
- [ ] NODE_ENV set (development or production)
- [ ] FIREBASE_PROJECT_ID matches your Firebase project
- [ ] FIREBASE_PRIVATE_KEY has quotes and \n characters
- [ ] FIREBASE_CLIENT_EMAIL is from service account
- [ ] JWT_SECRET is a long random string (64+ characters)
- [ ] ALLOWED_ORIGINS includes your frontend URL

### Frontend (`frontend/.env`)
- [ ] All VITE_FIREBASE_* variables set
- [ ] VITE_FIREBASE_API_KEY starts with "AIza"
- [ ] VITE_FIREBASE_PROJECT_ID matches backend
- [ ] VITE_API_URL points to backend (http://localhost:5000/api for local)

---

## 🧪 Testing Configuration

### Test Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ Firebase Admin SDK initialized successfully
🚀 Voting System API running on port 5000
```

If you see errors:
- Check FIREBASE_PRIVATE_KEY format (quotes and \n)
- Verify all Firebase credentials are correct
- Make sure Firebase project exists

### Test Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in browser.

Check browser console (F12):
- ✅ No Firebase initialization errors
- ✅ No CORS errors when calling API

---

## 🚀 Production Configuration

### Backend Production .env

```env
PORT=5000
NODE_ENV=production  # ← Change to production!

FIREBASE_PROJECT_ID=your-production-project-id
FIREBASE_PRIVATE_KEY="your-production-key"
FIREBASE_CLIENT_EMAIL=your-production-email

JWT_SECRET=different-secret-for-production  # Use a different secret!

# Add your production frontend URL:
ALLOWED_ORIGINS=https://your-app.web.app,https://yourdomain.com
```

### Frontend Production .env

```env
# Same Firebase config (or use production Firebase project)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Change to production backend URL:
VITE_API_URL=https://your-backend-url.com/api
# Examples:
# VITE_API_URL=https://your-api.herokuapp.com/api
# VITE_API_URL=https://us-central1-project.cloudfunctions.net/api
```

---

## 🔒 Security Best Practices

### DO ✅
- Keep `.env` files in `.gitignore` (already configured)
- Use different secrets for development and production
- Rotate JWT_SECRET periodically
- Use environment-specific Firebase projects
- Store production secrets in your hosting platform's secret management

### DON'T ❌
- Never commit `.env` files to git
- Never share your private key
- Never use same JWT_SECRET in dev and prod
- Never expose backend `.env` in frontend code
- Never hardcode credentials in source code

---

## 🆘 Common Issues

### "Firebase initialization error"

**Problem**: Backend won't start

**Solutions**:
1. Check `FIREBASE_PRIVATE_KEY` has quotes: `"-----BEGIN..."`
2. Verify `\n` characters are present (don't replace with actual newlines)
3. Ensure no extra spaces or line breaks
4. Verify project ID matches your Firebase project

### "CORS error" in frontend

**Problem**: Frontend can't connect to backend

**Solutions**:
1. Add frontend URL to `ALLOWED_ORIGINS` in backend
2. Restart backend server after changing `.env`
3. Check `VITE_API_URL` points to correct backend URL

### "Invalid API key" in frontend

**Problem**: Firebase authentication fails

**Solutions**:
1. Verify `VITE_FIREBASE_API_KEY` is correct
2. Check Firebase Authentication is enabled in Firebase Console
3. Verify all other Firebase config variables

### Environment variables not updating

**Problem**: Changes to `.env` not taking effect

**Solutions**:
1. Restart the development server
2. For frontend, you may need to rebuild: `npm run build`
3. Check for typos in variable names
4. Ensure variables start with `VITE_` for frontend

---

## 📝 Quick Reference

### Backend Variables

| Variable | Source | Example |
|----------|--------|---------|
| PORT | Your choice | `5000` |
| NODE_ENV | Environment | `development` or `production` |
| FIREBASE_PROJECT_ID | Service account JSON | `my-voting-system` |
| FIREBASE_PRIVATE_KEY | Service account JSON | `"-----BEGIN PRIVATE KEY-----\n..."` |
| FIREBASE_CLIENT_EMAIL | Service account JSON | `firebase-adminsdk-abc@proj.iam...` |
| JWT_SECRET | Generate random | 64+ character random string |
| ALLOWED_ORIGINS | Frontend URLs | `http://localhost:3000,https://...` |

### Frontend Variables

| Variable | Source | Example |
|----------|--------|---------|
| VITE_FIREBASE_API_KEY | Firebase web config | `AIzaSyXXXXXX...` |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase web config | `project.firebaseapp.com` |
| VITE_FIREBASE_PROJECT_ID | Firebase web config | `my-voting-system` |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase web config | `project.appspot.com` |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Firebase web config | `123456789` |
| VITE_FIREBASE_APP_ID | Firebase web config | `1:123:web:abc` |
| VITE_API_URL | Backend URL | `http://localhost:5000/api` |

---

## 🎯 Next Steps

After configuring both `.env` files:

1. ✅ Test backend: `cd backend && npm run dev`
2. ✅ Test frontend: `cd frontend && npm run dev`
3. ✅ Open http://localhost:3000
4. ✅ Try registering a user
5. ✅ Check Firebase Console for new user

---

## 📞 Need Help?

- Backend not starting? Check Firebase credentials
- Frontend errors? Check browser console (F12)
- CORS errors? Check ALLOWED_ORIGINS
- Still stuck? Review SETUP_GUIDE.md

---

**Last Updated**: December 17, 2024  
**Files**: `backend/.env.example`, `frontend/.env.example`  

🔐 **Keep your `.env` files secure and never commit them to git!**

