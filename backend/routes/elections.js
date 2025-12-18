const express = require('express');
const router = express.Router();
const { admin, db, collections } = require('../config/firebase');
const { verifyToken, verifyVoterEligibility } = require('../middleware/auth');

// Get All Active Elections
router.get('/', verifyToken, async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    let electionsSnapshot;
    let needsFiltering = false;
    
    try {
      // Try the full query with all filters (requires composite index)
      electionsSnapshot = await db.collection(collections.ELECTIONS)
        .where('status', '==', 'active')
        .where('startDate', '<=', now)
        .where('endDate', '>=', now)
        .get();
    } catch (queryError) {
      // If query fails (missing index), fetch active elections and filter in memory
      console.warn('Complex query failed for active elections, using fallback:', queryError.message);
      console.warn('Error code:', queryError.code);
      
      try {
        // Try fetching just by status
        electionsSnapshot = await db.collection(collections.ELECTIONS)
          .where('status', '==', 'active')
          .get();
        needsFiltering = true;
      } catch (statusError) {
        // If that also fails, fetch all and filter in memory
        console.warn('Status query failed, fetching all elections:', statusError.message);
        electionsSnapshot = await db.collection(collections.ELECTIONS).get();
        needsFiltering = true;
      }
    }

    const elections = [];
    electionsSnapshot.forEach(doc => {
      const electionData = doc.data();
      const electionId = doc.id;
      
      // Filter by dates in memory if needed
      if (needsFiltering) {
        const startDate = electionData.startDate?.toDate ? 
          electionData.startDate.toDate() : 
          (electionData.startDate?.seconds ? 
            new Date(electionData.startDate.seconds * 1000) : 
            null);
        const endDate = electionData.endDate?.toDate ? 
          electionData.endDate.toDate() : 
          (electionData.endDate?.seconds ? 
            new Date(electionData.endDate.seconds * 1000) : 
            null);
        const currentDate = new Date();
        
        // Only include if status is active and dates are valid
        if (electionData.status === 'active' && 
            startDate && startDate <= currentDate && 
            endDate && endDate >= currentDate) {
          elections.push({ id: electionId, ...electionData });
        }
      } else {
        // Already filtered by query
        elections.push({ id: electionId, ...electionData });
      }
    });

    res.json({ elections });
  } catch (error) {
    console.error('Fetch elections error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    
    // Check if it's a Firestore index error
    if (error.code === 9 || error.message?.includes('index')) {
      console.error('⚠️  Firestore index required!');
      console.error('Index needed: elections collection with status (ASC), endDate (ASC), startDate (ASC)');
    }
    
    // Return empty array instead of error to prevent UI breakage
    res.json({ elections: [] });
  }
});

// Get Upcoming Elections
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    let electionsSnapshot;
    let needsSorting = false;
    
    try {
      // Try with orderBy first (requires index)
      electionsSnapshot = await db.collection(collections.ELECTIONS)
        .where('status', '==', 'scheduled')
        .where('startDate', '>', now)
        .orderBy('startDate', 'asc')
        .get();
    } catch (orderByError) {
      // If orderBy fails (missing index), fetch without orderBy and sort in memory
      console.warn('OrderBy failed for upcoming elections, fetching without orderBy:', orderByError.message);
      console.warn('Error code:', orderByError.code);
      
      try {
        // Try fetching all scheduled elections and filter in memory
        electionsSnapshot = await db.collection(collections.ELECTIONS)
          .where('status', '==', 'scheduled')
          .get();
        needsSorting = true;
      } catch (fetchError) {
        // If that also fails, try fetching all elections
        console.warn('Filtered fetch failed, fetching all elections:', fetchError.message);
        electionsSnapshot = await db.collection(collections.ELECTIONS).get();
        needsSorting = true;
      }
    }

    const elections = [];
    electionsSnapshot.forEach(doc => {
      const electionData = doc.data();
      const electionId = doc.id;
      
      // Filter by startDate > now if we fetched all elections
      if (needsSorting) {
        const startDate = electionData.startDate?.toDate ? 
          electionData.startDate.toDate() : 
          (electionData.startDate?.seconds ? 
            new Date(electionData.startDate.seconds * 1000) : 
            null);
        
        // Only include if status is scheduled and startDate is in future
        if (electionData.status === 'scheduled' && startDate && startDate > new Date()) {
          elections.push({ id: electionId, ...electionData });
        }
      } else {
        // Already filtered by query
        elections.push({ id: electionId, ...electionData });
      }
    });

    // Sort by startDate in memory
    if (elections.length > 0) {
      elections.sort((a, b) => {
        const dateA = a.startDate?.toDate ? a.startDate.toDate() : 
                     (a.startDate?.seconds ? new Date(a.startDate.seconds * 1000) : new Date(0));
        const dateB = b.startDate?.toDate ? b.startDate.toDate() : 
                     (b.startDate?.seconds ? new Date(b.startDate.seconds * 1000) : new Date(0));
        return dateA - dateB; // Ascending order
      });
    }

    res.json({ elections });
  } catch (error) {
    console.error('Fetch upcoming elections error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    // Check if it's a Firestore index error
    if (error.code === 9 || error.message?.includes('index')) {
      console.error('⚠️  Firestore index required!');
      console.error('Index needed: elections collection with status (ASC) and startDate (ASC)');
      console.error('Create index in Firebase Console or run: firebase deploy --only firestore:indexes');
    }
    
    // Return empty array instead of error to prevent UI breakage
    res.json({ elections: [] });
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

    // Get candidates - try with orderBy first, fallback if index missing
    let candidatesSnapshot;
    try {
      candidatesSnapshot = await db.collection(collections.CANDIDATES)
        .where('electionId', '==', electionId)
        .orderBy('position', 'asc')
        .get();
    } catch (orderByError) {
      // If orderBy fails, fetch without orderBy and sort in memory
      console.warn('OrderBy failed for candidates, fetching without orderBy:', orderByError.message);
      candidatesSnapshot = await db.collection(collections.CANDIDATES)
        .where('electionId', '==', electionId)
        .get();
    }

    const candidates = [];
    candidatesSnapshot.forEach(doc => {
      candidates.push({ id: doc.id, ...doc.data() });
    });

    // Sort by position in memory if orderBy failed
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const posA = a.position || 0;
        const posB = b.position || 0;
        return posA - posB; // Ascending order
      });
    }

    res.json({ 
      election: { id: electionDoc.id, ...electionData },
      candidates 
    });
  } catch (error) {
    console.error('Fetch election details error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ 
      error: 'Failed to fetch election details',
      details: error.message
    });
  }
});

// Check if User Has Voted in Election
router.get('/:electionId/voted', verifyToken, async (req, res) => {
  try {
    const { electionId } = req.params;
    const { uid } = req.user;

    // Check if voter is registered (optional check - don't block if not registered)
    const voterDoc = await db.collection(collections.VOTER_REGISTRY).doc(uid).get();
    if (!voterDoc.exists) {
      // User not registered yet, return hasVoted: false
      return res.json({ hasVoted: false, registered: false });
    }

    // Check vote record (stored with hash for privacy)
    const crypto = require('crypto');
    const voteHash = crypto.createHash('sha256').update(`${uid}-${electionId}`).digest('hex');

    const voteDoc = await db.collection(collections.VOTES).doc(voteHash).get();

    res.json({ hasVoted: voteDoc.exists, registered: true });
  } catch (error) {
    console.error('Vote check error:', error);
    // Return false instead of error to prevent UI breakage
    res.json({ hasVoted: false, registered: false });
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

