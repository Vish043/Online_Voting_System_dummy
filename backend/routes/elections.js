const express = require('express');
const router = express.Router();
const { admin, db, collections } = require('../config/firebase');
const { verifyToken, verifyVoterEligibility } = require('../middleware/auth');

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

// Helper function to check if voter is eligible for an election
async function checkVoterEligibility(uid, election) {
  try {
    // Get voter data
    const voterDoc = await db.collection(collections.VOTER_REGISTRY).doc(uid).get();
    
    if (!voterDoc.exists) {
      return false;
    }
    
    const voter = voterDoc.data();
    
    // Voter must be verified and eligible
    if (!voter.isVerified || !voter.isEligible) {
      return false;
    }
    
    // Check eligibility based on election type
    const electionType = election.type || 'general';
    const allowedRegions = election.allowedRegions || [];
    
    if (electionType === 'national') {
      // All verified voters are eligible for national elections
      return true;
    } else if (electionType === 'state') {
      // Voter must be in one of the allowed states
      if (!voter.state || allowedRegions.length === 0) {
        return false;
      }
      // Check if voter's state matches
      if (!allowedRegions.includes(voter.state)) {
        return false;
      }
      // If election has a constituency, check if voter's constituency matches
      if (election.constituency && voter.constituency) {
        return election.constituency === voter.constituency;
      }
      // If no constituency specified in election, all voters from the state are eligible
      return true;
    } else if (electionType === 'local') {
      // Voter must match district or ward in allowed regions
      if (!voter.district || !voter.ward || allowedRegions.length === 0) {
        return false;
      }
      // Check if voter's district or ward is in allowed regions
      // allowedRegions can contain district names or ward names
      return allowedRegions.includes(voter.district) || 
             allowedRegions.includes(voter.ward) ||
             allowedRegions.includes(`${voter.district}-${voter.ward}`);
    }
    
    // Default: not eligible
    return false;
  } catch (error) {
    console.error('Error checking voter eligibility:', error);
    return false;
  }
}

// Get All Active Elections (filtered by eligibility)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const now = admin.firestore.Timestamp.now();
    
    // Check if user is admin - admins see all elections
    let isAdmin = false;
    try {
      const userRecord = await admin.auth().getUser(uid);
      const customClaims = userRecord.customClaims;
      isAdmin = customClaims && customClaims.role === 'admin';
    } catch (error) {
      // If check fails, assume not admin
    }
    
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
    
    // Process elections and filter by eligibility
    for (const doc of electionsSnapshot.docs) {
      const electionData = doc.data();
      const electionId = doc.id;
      
      // Filter by dates in memory if needed
      let includeElection = false;
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
        includeElection = electionData.status === 'active' && 
            startDate && startDate <= currentDate && 
            endDate && endDate >= currentDate;
      } else {
        // Already filtered by query
        includeElection = true;
      }
      
      if (includeElection) {
        // If admin, include all elections. Otherwise, check eligibility
        if (isAdmin) {
          elections.push({ id: electionId, ...serializeElection(electionData) });
        } else {
          const eligible = await checkVoterEligibility(uid, { ...electionData, id: electionId });
          if (eligible) {
            elections.push({ id: electionId, ...serializeElection(electionData) });
          }
        }
      }
    }

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

// Get Completed Elections (with approved results)
router.get('/completed', verifyToken, async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    let electionsSnapshot;
    let needsFiltering = false;
    
    try {
      // Try fetching completed elections
      electionsSnapshot = await db.collection(collections.ELECTIONS)
        .where('status', '==', 'completed')
        .where('resultsApproved', '==', true)
        .get();
    } catch (queryError) {
      // If query fails (missing index), fetch completed elections and filter in memory
      console.warn('Complex query failed for completed elections, using fallback:', queryError.message);
      
      try {
        // Try fetching just by status
        electionsSnapshot = await db.collection(collections.ELECTIONS)
          .where('status', '==', 'completed')
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
      
      // Filter by status and resultsApproved in memory if needed
      if (needsFiltering) {
        if (electionData.status === 'completed' && electionData.resultsApproved) {
          elections.push({ id: electionId, ...serializeElection(electionData) });
        }
      } else {
        // Already filtered by query
        elections.push({ id: electionId, ...serializeElection(electionData) });
      }
    });

    // Sort by endDate in descending order (most recent first)
    if (elections.length > 0) {
      elections.sort((a, b) => {
        const dateA = a.endDate?.seconds ? new Date(a.endDate.seconds * 1000) : new Date(0);
        const dateB = b.endDate?.seconds ? new Date(b.endDate.seconds * 1000) : new Date(0);
        return dateB - dateA; // Descending order
      });
    }

    res.json({ elections });
  } catch (error) {
    console.error('Fetch completed elections error:', error);
    res.json({ elections: [] });
  }
});

// Get Upcoming Elections (filtered by eligibility)
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const now = admin.firestore.Timestamp.now();
    
    // Check if user is admin - admins see all elections
    let isAdmin = false;
    try {
      const userRecord = await admin.auth().getUser(uid);
      const customClaims = userRecord.customClaims;
      isAdmin = customClaims && customClaims.role === 'admin';
    } catch (error) {
      // If check fails, assume not admin
    }
    
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
    
    // Process elections and filter by eligibility
    for (const doc of electionsSnapshot.docs) {
      const electionData = doc.data();
      const electionId = doc.id;
      
      // Filter by startDate > now if we fetched all elections
      let includeElection = false;
      if (needsSorting) {
        const startDate = electionData.startDate?.toDate ? 
          electionData.startDate.toDate() : 
          (electionData.startDate?.seconds ? 
            new Date(electionData.startDate.seconds * 1000) : 
            null);
        
        // Only include if status is scheduled and startDate is in future
        includeElection = electionData.status === 'scheduled' && startDate && startDate > new Date();
      } else {
        // Already filtered by query
        includeElection = true;
      }
      
      if (includeElection) {
        // If admin, include all elections. Otherwise, check eligibility
        if (isAdmin) {
          elections.push({ id: electionId, ...serializeElection(electionData) });
        } else {
          const eligible = await checkVoterEligibility(uid, { ...electionData, id: electionId });
          if (eligible) {
            elections.push({ id: electionId, ...serializeElection(electionData) });
          }
        }
      }
    }

    // Sort by startDate in memory
    if (elections.length > 0) {
      elections.sort((a, b) => {
        const dateA = a.startDate?.seconds ? new Date(a.startDate.seconds * 1000) : new Date(0);
        const dateB = b.startDate?.seconds ? new Date(b.startDate.seconds * 1000) : new Date(0);
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
      election: { id: electionDoc.id, ...serializeElection(electionData) },
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

// Get Election Results (only for ended elections with admin approval)
router.get('/:electionId/results', verifyToken, async (req, res) => {
  try {
    const { electionId } = req.params;
    const { uid } = req.user;

    const electionDoc = await db.collection(collections.ELECTIONS).doc(electionId).get();

    if (!electionDoc.exists) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const electionData = electionDoc.data();
    const now = admin.firestore.Timestamp.now();

    // Only show results if election has ended
    // Check if election has ended by comparing timestamps
    try {
      const endDate = electionData.endDate;
      if (endDate) {
        // Convert to comparable format if needed
        let endDateTimestamp = endDate;
        if (endDate.toDate && typeof endDate.toDate === 'function') {
          // It's a Firestore Timestamp, use it directly
          endDateTimestamp = endDate;
        } else if (endDate.seconds) {
          // It's a serialized timestamp, convert it
          endDateTimestamp = admin.firestore.Timestamp.fromMillis(endDate.seconds * 1000);
        }
        
        if (endDateTimestamp > now && electionData.status !== 'completed') {
          return res.status(403).json({ error: 'Results not available yet' });
        }
      }
    } catch (dateError) {
      // If date comparison fails, allow access if status is completed
      console.warn('Date comparison error, checking status only:', dateError.message);
      if (electionData.status !== 'completed') {
        return res.status(403).json({ error: 'Results not available yet' });
      }
    }

    // Check if user is admin
    let isAdmin = false;
    try {
      const userRecord = await admin.auth().getUser(uid);
      const customClaims = userRecord.customClaims;
      isAdmin = customClaims && customClaims.role === 'admin';
    } catch (adminCheckError) {
      // If admin check fails, continue as regular user
    }

    // For non-admin users, check if results are approved
    if (!isAdmin && !electionData.resultsApproved) {
      return res.status(403).json({ 
        error: 'Results are pending admin approval',
        resultsApproved: false 
      });
    }

    // Get candidates with vote counts - try with orderBy first, fallback if index missing
    let candidatesSnapshot;
    try {
      candidatesSnapshot = await db.collection(collections.CANDIDATES)
        .where('electionId', '==', electionId)
        .orderBy('voteCount', 'desc')
        .get();
    } catch (orderByError) {
      // If orderBy fails (missing index), fetch without orderBy and sort in memory
      console.warn('OrderBy failed for results, fetching without orderBy:', orderByError.message);
      candidatesSnapshot = await db.collection(collections.CANDIDATES)
        .where('electionId', '==', electionId)
        .get();
    }

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

    // Sort by voteCount in memory if orderBy failed
    if (results.length > 0) {
      results.sort((a, b) => {
        const votesA = a.voteCount || 0;
        const votesB = b.voteCount || 0;
        return votesB - votesA; // Descending order
      });
    }

    // Calculate percentages
    results.forEach(candidate => {
      candidate.percentage = totalVotes > 0 
        ? ((candidate.voteCount / totalVotes) * 100).toFixed(2)
        : 0;
    });

    res.json({ 
      election: { id: electionDoc.id, ...serializeElection(electionData) },
      results,
      totalVotes 
    });
  } catch (error) {
    console.error('Fetch results error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch results',
      details: error.message 
    });
  }
});

module.exports = router;

