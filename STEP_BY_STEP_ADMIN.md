# Step-by-Step: How to Make Yourself Admin

## ✅ You DON'T Need to Change Anything Manually!

The script does everything automatically. Just follow these steps:

---

## Step 1: Open Terminal

1. Open **PowerShell** or **Command Prompt**
2. Navigate to your project folder

---

## Step 2: Go to Backend Folder

Type this command and press Enter:

```bash
cd "C:\Users\Vishal\OneDrive\Desktop\Online_voting_System(Dummy)\Online_Voting_System_dummy\backend"
```

Or if you're already in the project folder:

```bash
cd Online_Voting_System_dummy/backend
```

---

## Step 3: Run the Script

Type this command and press Enter:

```bash
node scripts/set-admin.js visalgaonkar2004@gmail.com
```

**Replace `visalgaonkar2004@gmail.com` with YOUR email if different**

---

## Step 4: Wait for Success Message

You should see:

```
🔍 Looking for user with email: visalgaonkar2004@gmail.com...
✅ Found user: visalgaonkar2004@gmail.com (UID: VqknUtn2dcXR2uE7V35hw4wFY7q1)
✅ Success! Admin role has been granted to visalgaonkar2004@gmail.com

📝 Next steps:
   1. The user must sign out and sign back in to refresh their token
   2. After signing back in, they will have admin access
   3. They can access: http://localhost:5173/admin/login
```

---

## Step 5: Sign Out and Sign Back In

1. Go to your app in the browser
2. Click **"Logout"** button
3. Click **"Login"** or **"Sign In"**
4. Enter your email and password
5. After logging in, you should see **"Admin"** link in the navbar!

---

## That's It! 🎉

You don't need to:
- ❌ Change anything in Firebase Console
- ❌ Modify Firestore documents
- ❌ Edit any code files
- ❌ Change database values

The script does everything automatically!

---

## Troubleshooting

### ❌ "User not found" error?
- Make sure you've logged into the app at least once
- Check the email is correct (case-sensitive)

### ❌ "Firebase initialization error"?
- Make sure your `backend/.env` file exists
- Check it has `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

### ❌ Still don't see "Admin" link?
- Make sure you **signed out and signed back in**
- Check browser console for errors
- Try clearing browser cache

---

## Quick Copy-Paste Commands

If you're in the project root:

```bash
cd Online_Voting_System_dummy/backend
node scripts/set-admin.js visalgaonkar2004@gmail.com
```

Then sign out and sign back in to your app!

