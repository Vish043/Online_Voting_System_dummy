const { admin } = require('../config/firebase');

// Verify Firebase ID Token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify Admin Role
const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check custom claims for admin role
    const userRecord = await admin.auth().getUser(req.user.uid);
    const customClaims = userRecord.customClaims;

    if (customClaims && customClaims.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify Voter Eligibility
const verifyVoterEligibility = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is verified and eligible to vote
    const { db, collections } = require('../config/firebase');
    const voterDoc = await db.collection(collections.VOTER_REGISTRY).doc(req.user.uid).get();

    if (!voterDoc.exists) {
      return res.status(403).json({ error: 'Voter not registered' });
    }

    const voterData = voterDoc.data();
    
    if (!voterData.isVerified) {
      return res.status(403).json({ error: 'Voter identity not verified' });
    }

    if (!voterData.isEligible) {
      return res.status(403).json({ error: 'Voter not eligible' });
    }

    req.voter = voterData;
    next();
  } catch (error) {
    console.error('Voter eligibility check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyVoterEligibility
};

