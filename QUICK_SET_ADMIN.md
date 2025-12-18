# Quick Guide: Set Admin Role

## For Your Account

Based on your user data, run this command:

```bash
cd Online_Voting_System_dummy/backend
node scripts/set-admin.js visalgaonkar2004@gmail.com
```

## Steps:

1. **Open Terminal** in your project folder
2. **Navigate to backend folder:**
   ```bash
   cd Online_Voting_System_dummy/backend
   ```

3. **Run the script:**
   ```bash
   node scripts/set-admin.js visalgaonkar2004@gmail.com
   ```

4. **You should see:**
   ```
   🔍 Looking for user with email: visalgaonkar2004@gmail.com...
   ✅ Found user: visalgaonkar2004@gmail.com (UID: VqknUtn2dcXR2uE7V35hw4wFY7q1)
   ✅ Success! Admin role has been granted to visalgaonkar2004@gmail.com
   ```

5. **Sign out and sign back in** to your app

6. **You should now see "Admin" link** in the navbar!

---

## Important Notes:

- ❌ **Don't modify Firestore documents** - Admin role is NOT stored in Firestore
- ✅ **Admin role is set in Firebase Authentication** via custom claims
- ✅ **The script does this automatically** - you just need to run it
- ✅ **After running, sign out/in** to refresh your token

---

## Troubleshooting:

If you get an error:
- Make sure you're in the `backend` folder
- Make sure your `.env` file has Firebase credentials
- Make sure you've logged into the app at least once

