const express = require('express');
const router = express.Router();
const { admin, db, collections } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Register User
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { 
      firstName, 
      lastName, 
      dateOfBirth, 
      nationalId, 
      address, 
      phoneNumber 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !nationalId) {
      return res.status(400).json({ error: 'Missing required fields' });
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

    // Create voter record
    const voterData = {
      uid,
      email,
      firstName,
      lastName,
      dateOfBirth,
      nationalId,
      address: address || '',
      phoneNumber: phoneNumber || '',
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
    
    res.json({ voter: voterData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update Profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { address, phoneNumber } = req.body;

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (address) updateData.address = address;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

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

