const express = require('express');
const router = express.Router();
const { admin, db, collections } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Helper function to serialize Firestore Timestamp
function serializeTimestamp(timestamp) {
  if (!timestamp) return null;
  
  // If it's a Firestore Timestamp
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return {
      seconds: timestamp.seconds,
      nanoseconds: timestamp.nanoseconds,
      _timestamp: true
    };
  }
  
  // If it's already serialized
  if (timestamp.seconds !== undefined) {
    return timestamp;
  }
  
  return timestamp;
}

// Register User
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { uid, email } = req.user;
    
    // Check if user is admin - admins cannot register as voters
    try {
      const userRecord = await admin.auth().getUser(uid);
      const customClaims = userRecord.customClaims;
      
      if (customClaims && customClaims.role === 'admin') {
        return res.status(403).json({ error: 'Administrators cannot register as voters' });
      }
    } catch (adminCheckError) {
      // If admin check fails, continue with registration
      console.warn('Admin check failed, continuing with registration:', adminCheckError.message);
    }
    
    const { 
      firstName, 
      lastName, 
      dateOfBirth, 
      nationalId, 
      address, 
      phoneNumber,
      state,
      district,
      ward,
      constituency,
      lokSabhaConstituency
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !nationalId || !address || !address.trim() || !state || !district) {
      return res.status(400).json({ error: 'Missing required fields. All fields including Address are required.' });
    }

    // Check if user already registered
    const existingUser = await db.collection(collections.VOTER_REGISTRY).doc(uid).get();
    if (existingUser.exists) {
      return res.status(400).json({ error: 'User already registered' });
    }

    // Check for duplicate national ID
    const duplicateId = await db.collection(collections.VOTER_REGISTRY)
      .where('nationalId', '==', nationalId)
      .get();
    
    if (!duplicateId.empty) {
      return res.status(400).json({ error: 'National ID already registered' });
    }

    // Check for duplicate phone number if provided
    if (phoneNumber && phoneNumber.trim()) {
      const duplicatePhone = await db.collection(collections.VOTER_REGISTRY)
        .where('phoneNumber', '==', phoneNumber.trim())
        .get();
      
      if (!duplicatePhone.empty) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    // Validate age (must be 18 or above)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    // Calculate exact age considering month and day
    let exactAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      exactAge--;
    }
    
    if (exactAge < 18) {
      return res.status(400).json({ error: 'You must be at least 18 years old to register' });
    }

    // Create voter record
    const voterData = {
      uid,
      email,
      firstName,
      lastName,
      dateOfBirth,
      nationalId,
      address: address.trim(),
      phoneNumber: phoneNumber || '',
      state: state.trim(),
      district: district.trim(),
      ward: ward ? ward.trim() : '',
      constituency: constituency ? constituency.trim() : '',
      lokSabhaConstituency: lokSabhaConstituency ? lokSabhaConstituency.trim() : '',
      isVerified: false, // Requires admin verification
      isEligible: false,
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      votingHistory: []
    };

    await db.collection(collections.VOTER_REGISTRY).doc(uid).set(voterData);

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'VOTER_REGISTRATION',
      userId: uid,
      email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { nationalId }
    });

    res.status(201).json({ 
      message: 'Registration submitted. Awaiting verification.',
      voter: { ...voterData, uid }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get User Profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { uid, email } = req.user;
    
    // Check if user is admin - admins cannot access profile
    try {
      const userRecord = await admin.auth().getUser(uid);
      const customClaims = userRecord.customClaims;
      
      if (customClaims && customClaims.role === 'admin') {
        return res.status(403).json({ error: 'Administrators cannot access voter profiles' });
      }
    } catch (adminCheckError) {
      // If admin check fails, continue with profile fetch
      console.warn('Admin check failed, continuing with profile fetch:', adminCheckError.message);
    }
    
    const voterDoc = await db.collection(collections.VOTER_REGISTRY).doc(uid).get();
    
    if (!voterDoc.exists) {
      // Return empty profile structure if not registered as voter yet
      return res.json({ 
        voter: {
          uid,
          email,
          firstName: '',
          lastName: '',
          isVerified: false,
          isEligible: false,
          registered: false
        }
      });
    }

    const voterData = voterDoc.data();
    
    // Remove sensitive data
    delete voterData.nationalId;
    
    // Serialize timestamps
    const serializedVoterData = {
      ...voterData,
      registeredAt: serializeTimestamp(voterData.registeredAt),
      updatedAt: serializeTimestamp(voterData.updatedAt)
    };
    
    // Serialize timestamps in voting history if it exists
    if (serializedVoterData.votingHistory && Array.isArray(serializedVoterData.votingHistory)) {
      serializedVoterData.votingHistory = serializedVoterData.votingHistory.map(vote => ({
        ...vote,
        votedAt: serializeTimestamp(vote.votedAt)
      }));
    }
    
    res.json({ voter: serializedVoterData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update Profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Check if user is admin - admins cannot update profile
    try {
      const userRecord = await admin.auth().getUser(uid);
      const customClaims = userRecord.customClaims;
      
      if (customClaims && customClaims.role === 'admin') {
        return res.status(403).json({ error: 'Administrators cannot update voter profiles' });
      }
    } catch (adminCheckError) {
      // If admin check fails, continue with profile update
      console.warn('Admin check failed, continuing with profile update:', adminCheckError.message);
    }
    
    const { address, phoneNumber, state, district, ward, constituency, lokSabhaConstituency } = req.body;

    // Check for duplicate phone number if provided
    if (phoneNumber && phoneNumber.trim()) {
      const duplicatePhone = await db.collection(collections.VOTER_REGISTRY)
        .where('phoneNumber', '==', phoneNumber.trim())
        .get();
      
      // Check if the phone number belongs to another user (not the current user)
      const phoneExists = !duplicatePhone.empty && duplicatePhone.docs.some(doc => doc.id !== uid);
      
      if (phoneExists) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (address) updateData.address = address;
    if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();
    if (state) updateData.state = state.trim();
    if (district) updateData.district = district.trim();
    if (ward) updateData.ward = ward.trim();
    if (constituency !== undefined) updateData.constituency = constituency ? constituency.trim() : '';
    if (lokSabhaConstituency !== undefined) updateData.lokSabhaConstituency = lokSabhaConstituency ? lokSabhaConstituency.trim() : '';

    await db.collection(collections.VOTER_REGISTRY).doc(uid).update(updateData);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Check Voter Status
router.get('/status', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Check if user is admin - admins cannot check voter status
    try {
      const userRecord = await admin.auth().getUser(uid);
      const customClaims = userRecord.customClaims;
      
      if (customClaims && customClaims.role === 'admin') {
        return res.status(403).json({ error: 'Administrators cannot check voter status' });
      }
    } catch (adminCheckError) {
      // If admin check fails, continue with status check
      console.warn('Admin check failed, continuing with status check:', adminCheckError.message);
    }
    
    const voterDoc = await db.collection(collections.VOTER_REGISTRY).doc(uid).get();
    
    if (!voterDoc.exists) {
      return res.json({ 
        registered: false,
        verified: false,
        eligible: false
      });
    }

    const { isVerified, isEligible } = voterDoc.data();
    
    res.json({ 
      registered: true,
      verified: isVerified,
      eligible: isEligible
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

module.exports = router;

