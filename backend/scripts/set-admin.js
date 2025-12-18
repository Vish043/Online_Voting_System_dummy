/**
 * Script to set a user as admin
 * 
 * Usage:
 *   node scripts/set-admin.js <user-email>
 * 
 * Example:
 *   node scripts/set-admin.js admin@example.com
 */

require('dotenv').config();
const { admin } = require('../config/firebase');

async function setAdmin(email) {
  try {
    if (!email) {
      console.error('❌ Error: Please provide a user email');
      console.log('\nUsage: node scripts/set-admin.js <user-email>');
      console.log('Example: node scripts/set-admin.js admin@example.com\n');
      process.exit(1);
    }

    console.log(`\n🔍 Looking for user with email: ${email}...`);

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    console.log(`✅ Found user: ${userRecord.email} (UID: ${userRecord.uid})`);

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
    
    console.log(`\n✅ Success! Admin role has been granted to ${email}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. The user must sign out and sign back in to refresh their token`);
    console.log(`   2. After signing back in, they will have admin access`);
    console.log(`   3. They can access: http://localhost:5173/admin/login\n`);
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`\n❌ Error: User with email "${email}" not found`);
      console.log('\n💡 Make sure the user has registered/logged in at least once.\n');
    } else {
      console.error('\n❌ Error setting admin role:', error.message);
    }
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
setAdmin(email);

