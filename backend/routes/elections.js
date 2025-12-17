const express = require('express');
const router = express.Router();
const { admin, db, collections } = require('../config/firebase');
const { verifyToken, verifyVoterEligibility } = require('../middleware/auth');

// Get All Active Elections
router.get('/', verifyToken, async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    const electionsSnapshot = await db.collection(collections.ELECTIONS)
      .where('status', '==', 'active')
      .where('startDate', '<=', now)
      .where('endDate', '>=', now)
      .get();

    const elections = [];
    electionsSnapshot.forEach(doc => {
      elections.push({ id: doc.id, ...doc.data() });
    });

    res.json({ elections });
  } catch (error) {
    console.error('Fetch elections error:', error);
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

// Get Upcoming Elections
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    const electionsSnapshot = await db.collection(collections.ELECTIONS)
      .where('status', '==', 'scheduled')
      .where('startDate', '>', now)
      .orderBy('startDate', 'asc')
      .get();

    const elections = [];
    electionsSnapshot.forEach(doc => {
      elections.push({ id: doc.id, ...doc.data() });
    });

    res.json({ elections });
  } catch (error) {
    console.error('Fetch upcoming elections error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming elections' });
  }
});

// Get Election Details with Candidates
router.get('/:electionId', verifyToken, async (req, res) => {
  try {
    const { electionId } = req.params;

    const electionDoc = await db.collection(collections.ELECTIONS).doc(electionId).get();

    if (!electionDoc.exists) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const electionData = electionDoc.data();

    // Get candidates
    const candidatesSnapshot = await db.collection(collections.CANDIDATES)
      .where('electionId', '==', electionId)
      .orderBy('position', 'asc')
      .get();

    const candidates = [];
    candidatesSnapshot.forEach(doc => {
      candidates.push({ id: doc.id, ...doc.data() });
    });

    res.json({ 
      election: { id: electionDoc.id, ...electionData },
      candidates 
    });
  } catch (error) {
    console.error('Fetch election details error:', error);
    res.status(500).json({ error: 'Failed to fetch election details' });
  }
});

// Check if User Has Voted in Election
router.get('/:electionId/voted', verifyToken, verifyVoterEligibility, async (req, res) => {
  try {
    const { electionId } = req.params;
    const { uid } = req.user;

    // Check vote record (stored with hash for privacy)
    const crypto = require('crypto');
    const voteHash = crypto.createHash('sha256').update(`${uid}-${electionId}`).digest('hex');

    const voteDoc = await db.collection(collections.VOTES).doc(voteHash).get();

    res.json({ hasVoted: voteDoc.exists });
  } catch (error) {
    console.error('Vote check error:', error);
    res.status(500).json({ error: 'Failed to check vote status' });
  }
});

// Get Election Results (only for ended elections)
router.get('/:electionId/results', verifyToken, async (req, res) => {
  try {
    const { electionId } = req.params;

    const electionDoc = await db.collection(collections.ELECTIONS).doc(electionId).get();

    if (!electionDoc.exists) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const electionData = electionDoc.data();
    const now = admin.firestore.Timestamp.now();

    // Only show results if election has ended
    if (electionData.endDate > now && electionData.status !== 'completed') {
      return res.status(403).json({ error: 'Results not available yet' });
    }

    // Get candidates with vote counts
    const candidatesSnapshot = await db.collection(collections.CANDIDATES)
      .where('electionId', '==', electionId)
      .orderBy('voteCount', 'desc')
      .get();

    const results = [];
    let totalVotes = 0;

    candidatesSnapshot.forEach(doc => {
      const candidate = doc.data();
      totalVotes += candidate.voteCount || 0;
      results.push({ 
        id: doc.id, 
        ...candidate,
        percentage: 0 // Will calculate after total
      });
    });

    // Calculate percentages
    results.forEach(candidate => {
      candidate.percentage = totalVotes > 0 
        ? ((candidate.voteCount / totalVotes) * 100).toFixed(2)
        : 0;
    });

    res.json({ 
      election: { id: electionDoc.id, ...electionData },
      results,
      totalVotes 
    });
  } catch (error) {
    console.error('Fetch results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;

