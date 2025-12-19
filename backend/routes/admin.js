const express = require('express');
const router = express.Router();
const { admin, db, collections } = require('../config/firebase');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Helper function to convert Firestore Timestamp to serializable format
function serializeTimestamp(timestamp) {
  if (!timestamp) return null;
  
  // If it's a Firestore Timestamp
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return {
      seconds: timestamp.seconds,
      nanoseconds: timestamp.nanoseconds,
      _timestamp: true // Flag to identify as timestamp
    };
  }
  
  // If it's already serialized
  if (timestamp.seconds !== undefined) {
    return timestamp;
  }
  
  return timestamp;
}

// Helper function to serialize election data
function serializeElection(electionData) {
  const serialized = { ...electionData };
  
  if (serialized.startDate) {
    serialized.startDate = serializeTimestamp(serialized.startDate);
  }
  
  if (serialized.endDate) {
    serialized.endDate = serializeTimestamp(serialized.endDate);
  }
  
  if (serialized.createdAt) {
    serialized.createdAt = serializeTimestamp(serialized.createdAt);
  }
  
  return serialized;
}

// All routes require admin privileges
router.use(verifyToken);
router.use(verifyAdmin);

// Get All Voters (for verification)
router.get('/voters', async (req, res) => {
  try {
    const { status } = req.query; // pending, verified, all

    let query = db.collection(collections.VOTER_REGISTRY);

    if (status === 'pending') {
      query = query.where('isVerified', '==', false);
    } else if (status === 'verified') {
      query = query.where('isVerified', '==', true);
    }

    // Try with orderBy first, if it fails due to missing index, fetch without orderBy
    let votersSnapshot;
    try {
      votersSnapshot = await query.orderBy('registeredAt', 'desc').get();
    } catch (orderByError) {
      // If orderBy fails (likely missing index), fetch without orderBy and sort in memory
      console.warn('OrderBy failed, fetching without orderBy:', orderByError.message);
      votersSnapshot = await query.get();
    }

    const voters = [];
    votersSnapshot.forEach(doc => {
      voters.push({ id: doc.id, ...doc.data() });
    });

    // Sort by registeredAt in memory if orderBy failed
    if (voters.length > 0 && voters[0].registeredAt) {
      voters.sort((a, b) => {
        const dateA = a.registeredAt?.toDate ? a.registeredAt.toDate() : 
                     (a.registeredAt?.seconds ? new Date(a.registeredAt.seconds * 1000) : new Date(0));
        const dateB = b.registeredAt?.toDate ? b.registeredAt.toDate() : 
                     (b.registeredAt?.seconds ? new Date(b.registeredAt.seconds * 1000) : new Date(0));
        return dateB - dateA; // Descending order
      });
    }

    res.json({ voters });
  } catch (error) {
    console.error('Fetch voters error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    
    // Check if it's a Firestore index error
    if (error.code === 9 || error.message?.includes('index')) {
      console.error('⚠️  Firestore index required!');
      console.error('The query requires a composite index.');
      console.error('Index needed: voterRegistry collection with isVerified (ASC) and registeredAt (DESC)');
      console.error('Check firestore.indexes.json and deploy it using: firebase deploy --only firestore:indexes');
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch voters',
      details: error.message,
      code: error.code
    });
  }
});

// Verify Voter
router.post('/voters/:voterId/verify', async (req, res) => {
  try {
    const { voterId } = req.params;
    const { isVerified, isEligible } = req.body;

    await db.collection(collections.VOTER_REGISTRY).doc(voterId).update({
      isVerified: isVerified !== undefined ? isVerified : true,
      isEligible: isEligible !== undefined ? isEligible : true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verifiedBy: req.user.uid
    });

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'VOTER_VERIFIED',
      adminId: req.user.uid,
      voterId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Voter verification updated successfully' });
  } catch (error) {
    console.error('Voter verification error:', error);
    res.status(500).json({ error: 'Failed to verify voter' });
  }
});

// Create Election
router.post('/elections', async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      allowedRegions
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const electionData = {
      title,
      description: description || '',
      type: type || 'general',
      startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
      endDate: admin.firestore.Timestamp.fromDate(new Date(endDate)),
      status: 'scheduled',
      allowedRegions: allowedRegions || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
      totalVotes: 0
    };

    const electionRef = await db.collection(collections.ELECTIONS).add(electionData);

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'ELECTION_CREATED',
      adminId: req.user.uid,
      electionId: electionRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { title }
    });

    res.status(201).json({ 
      message: 'Election created successfully',
      electionId: electionRef.id,
      election: { id: electionRef.id, ...electionData }
    });
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ error: 'Failed to create election' });
  }
});

// Update Election Status
router.patch('/elections/:electionId/status', async (req, res) => {
  try {
    const { electionId } = req.params;
    const { status } = req.body;

    const validStatuses = ['scheduled', 'active', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.collection(collections.ELECTIONS).doc(electionId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid
    });

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'ELECTION_STATUS_CHANGED',
      adminId: req.user.uid,
      electionId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { newStatus: status }
    });

    res.json({ message: `Election status updated to ${status}` });
  } catch (error) {
    console.error('Update election status error:', error);
    res.status(500).json({ error: 'Failed to update election status' });
  }
});

// Add Candidate to Election
router.post('/elections/:electionId/candidates', async (req, res) => {
  try {
    const { electionId } = req.params;
    const {
      name,
      party,
      biography,
      photoURL,
      position
    } = req.body;

    if (!name || !party) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify election exists
    const electionDoc = await db.collection(collections.ELECTIONS).doc(electionId).get();
    
    if (!electionDoc.exists) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const candidateData = {
      electionId,
      name,
      party,
      biography: biography || '',
      photoURL: photoURL || '',
      position: position || 0,
      voteCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid
    };

    const candidateRef = await db.collection(collections.CANDIDATES).add(candidateData);

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'CANDIDATE_ADDED',
      adminId: req.user.uid,
      electionId,
      candidateId: candidateRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { name, party }
    });

    res.status(201).json({ 
      message: 'Candidate added successfully',
      candidateId: candidateRef.id,
      candidate: { id: candidateRef.id, ...candidateData }
    });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

// Get All Elections (including inactive)
router.get('/elections', async (req, res) => {
  try {
    const electionsSnapshot = await db.collection(collections.ELECTIONS)
      .orderBy('createdAt', 'desc')
      .get();

    const elections = [];
    electionsSnapshot.forEach(doc => {
      elections.push({ id: doc.id, ...serializeElection(doc.data()) });
    });

    res.json({ elections });
  } catch (error) {
    console.error('Fetch all elections error:', error);
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

// Get Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { limit = 100, action } = req.query;

    let query = db.collection(collections.AUDIT_LOGS)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (action) {
      query = query.where('action', '==', action);
    }

    const logsSnapshot = await query.get();

    const logs = [];
    logsSnapshot.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    res.json({ logs });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Approve Election Results
router.post('/elections/:electionId/approve-results', async (req, res) => {
  try {
    const { electionId } = req.params;
    const { approved } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid approved field' });
    }

    // Verify election exists
    const electionDoc = await db.collection(collections.ELECTIONS).doc(electionId).get();
    
    if (!electionDoc.exists) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const electionData = electionDoc.data();
    const now = admin.firestore.Timestamp.now();

    // Only allow approval if election has ended
    if (electionData.endDate > now && electionData.status !== 'completed') {
      return res.status(400).json({ error: 'Cannot approve results for ongoing elections' });
    }

    // Update results approval status
    await db.collection(collections.ELECTIONS).doc(electionId).update({
      resultsApproved: approved,
      resultsApprovedAt: admin.firestore.FieldValue.serverTimestamp(),
      resultsApprovedBy: req.user.uid
    });

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: approved ? 'RESULTS_APPROVED' : 'RESULTS_REJECTED',
      adminId: req.user.uid,
      electionId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { 
        electionTitle: electionData.title,
        approved 
      }
    });

    res.json({ 
      message: `Results ${approved ? 'approved' : 'rejected'} successfully`,
      resultsApproved: approved 
    });
  } catch (error) {
    console.error('Approve results error:', error);
    res.status(500).json({ error: 'Failed to update results approval status' });
  }
});

// Get System Statistics
router.get('/statistics', async (req, res) => {
  try {
    // Count total voters
    const votersSnapshot = await db.collection(collections.VOTER_REGISTRY).count().get();
    const totalVoters = votersSnapshot.data().count;

    // Count verified voters
    const verifiedSnapshot = await db.collection(collections.VOTER_REGISTRY)
      .where('isVerified', '==', true)
      .count()
      .get();
    const verifiedVoters = verifiedSnapshot.data().count;

    // Count elections
    const electionsSnapshot = await db.collection(collections.ELECTIONS).count().get();
    const totalElections = electionsSnapshot.data().count;

    // Count active elections
    const now = admin.firestore.Timestamp.now();
    const activeSnapshot = await db.collection(collections.ELECTIONS)
      .where('status', '==', 'active')
      .count()
      .get();
    const activeElections = activeSnapshot.data().count;

    // Count total votes
    const votesSnapshot = await db.collection(collections.VOTES).count().get();
    const totalVotes = votesSnapshot.data().count;

    res.json({
      statistics: {
        totalVoters,
        verifiedVoters,
        pendingVerification: totalVoters - verifiedVoters,
        totalElections,
        activeElections,
        totalVotes
      }
    });
  } catch (error) {
    console.error('Fetch statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Set User as Admin (Super Admin only - requires special custom claim)
router.post('/set-admin', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(userId, { role: 'admin' });

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'ADMIN_ROLE_GRANTED',
      adminId: req.user.uid,
      targetUserId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Admin role granted successfully' });
  } catch (error) {
    console.error('Set admin error:', error);
    res.status(500).json({ error: 'Failed to set admin role' });
  }
});

module.exports = router;

