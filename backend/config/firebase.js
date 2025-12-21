const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Two ways to initialize: using service account file or environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
    } else {
      // Using environment variables (recommended for production)
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
    }
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    process.exit(1);
  }
};

initializeFirebase();

// Firestore instance
const db = admin.firestore();

// Collections
const collections = {
  USERS: 'users',
  ELECTIONS: 'elections',
  VOTES: 'votes',
  CANDIDATES: 'candidates',
  AUDIT_LOGS: 'auditLogs',
  VOTER_REGISTRY: 'voterRegistry',
  CANDIDATE_TEMPLATES: 'candidateTemplates',
  PARTY_TEMPLATES: 'partyTemplates'
};

module.exports = {
  admin,
  db,
  collections
};

