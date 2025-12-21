# How to Set Admin Role (When Custom Claims Not Visible in Firebase Console)

Custom claims are not always visible in the Firebase Console UI. Here are **3 easy methods** to set admin role:

---

## Method 1: Using the Script (Easiest - Recommended) ⭐

### Step 1: Get Your User Email
1. Register/login to your app first
2. Note your email address

### Step 2: Run the Script
Open your terminal in the **backend** folder and run:

```bash
cd Online_Voting_System_dummy/backend
node scripts/set-admin.js your-email@example.com
```

**Example:**
```bash
node scripts/set-admin.js admin@test.com
```

### Step 3: Sign Out and Sign Back In
1. Sign out of your app
2. Sign back in
3. You should now see the "Admin" link in the navbar!

---

## Method 2: Using Firebase CLI

### Step 1: Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Get Your User UID
1. Go to Firebase Console → Authentication → Users
2. Find your user and copy the **UID** (the long string)

### Step 4: Set Admin Role
Create a file `set-admin-cli.js`:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userId = 'YOUR_USER_UID_HERE';

admin.auth().setCustomUserClaims(userId, { role: 'admin' })
  .then(() => {
    console.log('✅ Admin role set successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

Run it:
```bash
node set-admin-cli.js
```

---

## Method 3: Using Backend API (If you have another admin)

If you already have an admin user, you can use the API endpoint:

### Step 1: Get Your User UID
1. Go to Firebase Console → Authentication → Users
2. Find your user and copy the **UID**

### Step 2: Get Admin Token
Login as the existing admin and get the auth token from browser DevTools → Application → Local Storage

### Step 3: Call the API
```bash
curl -X POST http://localhost:5000/api/admin/set-admin \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_UID"}'
```

Or use Postman/Thunder Client:
- **URL**: `POST http://localhost:5000/api/admin/set-admin`
- **Headers**: 
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "userId": "YOUR_USER_UID"
  }
  ```

---

## Method 4: Direct Firebase Console (If Available)

Some Firebase projects show custom claims. Try this:

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Select your project: `online-voting-system-de435`
3. Click **"Authentication"** → **"Users"**
4. Find your user and **click on it**
5. Look for **"Custom claims"** section (might be at the bottom)
6. If you see it, click **"Edit"** and add:
   ```json
   {"role": "admin"}
   ```
7. Click **"Save"**

**Note**: This section might not be visible in all Firebase Console versions.

---

## Quick Troubleshooting

### ❌ Script says "user not found"?
- Make sure the user has registered/logged in at least once
- Check the email is correct (case-sensitive)
- The user must exist in Firebase Authentication

### ❌ Still can't access admin after setting role?
1. **Sign out completely** from your app
2. **Sign back in** (this refreshes the token)
3. Check browser console for errors
4. Try clearing browser cache

### ❌ Script gives Firebase initialization error?
- Make sure your `.env` file in `backend` folder has all Firebase credentials
- Check that `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, and `FIREBASE_CLIENT_EMAIL` are set

### ✅ How to verify admin role is set?
After running the script and signing back in:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `localStorage` and look for Firebase auth tokens
4. Or check if you see "Admin" link in navbar

---

## Recommended: Use Method 1 (The Script)

The script is the easiest method. Just run:

```bash
cd Online_Voting_System_dummy/backend
node scripts/set-admin.js your-email@example.com
```

Then sign out and sign back in! 🎉