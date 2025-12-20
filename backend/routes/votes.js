const express = require('express');
const router = express.Router();
const { admin, db, collections } = require('../config/firebase');
const { verifyToken, verifyVoterEligibility } = require('../middleware/auth');
const crypto = require('crypto');

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

// Submit Vote
router.post('/', verifyToken, verifyVoterEligibility, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { electionId, candidateId } = req.body;

    // Double-check: Ensure admin cannot vote (additional safeguard)
    try {
      const userRecord = await admin.auth().getUser(uid);
      const customClaims = userRecord.customClaims;
      
      if (customClaims && customClaims.role === 'admin') {
        return res.status(403).json({ error: 'Administrators cannot vote in elections' });
      }
    } catch (adminCheckError) {
      // If admin check fails, continue with vote submission
      console.warn('Admin check failed during vote submission, continuing:', adminCheckError.message);
    }

    if (!electionId || !candidateId) {
      return res.status(400).json({ error: 'Missing electionId or candidateId' });
    }

    // Verify election exists and is active
    const electionDoc = await db.collection(collections.ELECTIONS).doc(electionId).get();
    
    if (!electionDoc.exists) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const electionData = electionDoc.data();
    const now = admin.firestore.Timestamp.now();

    if (electionData.status !== 'active') {
      return res.status(400).json({ error: 'Election is not active' });
    }

    if (electionData.startDate > now) {
      return res.status(400).json({ error: 'Election has not started yet' });
    }

    if (electionData.endDate < now) {
      return res.status(400).json({ error: 'Election has ended' });
    }

    // Check voter eligibility based on election type and regions
    const voterDoc = await db.collection(collections.VOTER_REGISTRY).doc(uid).get();
    if (!voterDoc.exists) {
      return res.status(403).json({ error: 'Voter not registered' });
    }

    const voter = voterDoc.data();
    if (!voter.isVerified || !voter.isEligible) {
      return res.status(403).json({ error: 'Voter not verified or not eligible' });
    }

    const electionType = electionData.type || 'general';
    const allowedRegions = electionData.allowedRegions || [];

    // Check eligibility based on election type
    let isEligible = false;
    if (electionType === 'national') {
      // All verified voters are eligible for national elections
      isEligible = true;
    } else if (electionType === 'state') {
      // Voter must be in one of the allowed states
      if (!voter.state || allowedRegions.length === 0) {
        isEligible = false;
      } else {
        // Check if voter's state matches
        if (!allowedRegions.includes(voter.state)) {
          isEligible = false;
        } else {
          // If election has a constituency, check if voter's constituency matches
          if (electionData.constituency && voter.constituency) {
            isEligible = electionData.constituency === voter.constituency;
          } else {
            // If no constituency specified in election, all voters from the state are eligible
            isEligible = true;
          }
        }
      }
    } else if (electionType === 'local') {
      // Voter must match district or ward in allowed regions
      if (voter.district && voter.ward && allowedRegions.length > 0) {
        isEligible = allowedRegions.includes(voter.district) || 
                     allowedRegions.includes(voter.ward) ||
                     allowedRegions.includes(`${voter.district}-${voter.ward}`);
      }
    }

    if (!isEligible) {
      return res.status(403).json({ 
        error: 'You are not eligible to vote in this election based on your region',
        details: `Election type: ${electionType}, Your region: ${voter.state || 'N/A'}/${voter.district || 'N/A'}/${voter.ward || 'N/A'}/${voter.constituency || 'N/A'}`
      });
    }

    // Verify candidate exists and belongs to this election
    const candidateDoc = await db.collection(collections.CANDIDATES).doc(candidateId).get();
    
    if (!candidateDoc.exists) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const candidateData = candidateDoc.data();
    
    if (candidateData.electionId !== electionId) {
      return res.status(400).json({ error: 'Candidate does not belong to this election' });
    }

    // Check if user has already voted (using hash for privacy)
    const voteHash = crypto.createHash('sha256').update(`${uid}-${electionId}`).digest('hex');
    const existingVote = await db.collection(collections.VOTES).doc(voteHash).get();

    if (existingVote.exists) {
      return res.status(400).json({ error: 'You have already voted in this election' });
    }

    // Use Firestore transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Create vote record (anonymized)
      const voteData = {
        voteHash, // User-election hash (not the actual vote)
        electionId,
        votedAt: admin.firestore.FieldValue.serverTimestamp(),
        verified: true
      };

      transaction.set(db.collection(collections.VOTES).doc(voteHash), voteData);

      // Increment candidate vote count
      const candidateRef = db.collection(collections.CANDIDATES).doc(candidateId);
      transaction.update(candidateRef, {
        voteCount: admin.firestore.FieldValue.increment(1)
      });

      // Update voter's voting history
      const voterRef = db.collection(collections.VOTER_REGISTRY).doc(uid);
      transaction.update(voterRef, {
        votingHistory: admin.firestore.FieldValue.arrayUnion({
          electionId,
          votedAt: admin.firestore.Timestamp.now(),
          electionTitle: electionData.title
        })
      });

      // Create audit log (without revealing the vote)
      const auditLogRef = db.collection(collections.AUDIT_LOGS).doc();
      transaction.set(auditLogRef, {
        action: 'VOTE_CAST',
        userId: uid,
        email,
        electionId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    });

    res.status(201).json({ 
      message: 'Vote cast successfully',
      electionId,
      votedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vote submission error:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Get User's Voting History
router.get('/history', verifyToken, verifyVoterEligibility, async (req, res) => {
  try {
    const { uid } = req.user;

    const voterDoc = await db.collection(collections.VOTER_REGISTRY).doc(uid).get();
    
    if (!voterDoc.exists) {
      return res.status(404).json({ error: 'Voter record not found' });
    }

    const { votingHistory } = voterDoc.data();
    
    // Serialize timestamps in voting history
    const serializedHistory = (votingHistory || []).map(vote => ({
      ...vote,
      votedAt: serializeTimestamp(vote.votedAt)
    }));

    res.json({ votingHistory: serializedHistory });
  } catch (error) {
    console.error('Voting history error:', error);
    res.status(500).json({ error: 'Failed to fetch voting history' });
  }
});

// Verify Vote Receipt (proves vote was counted without revealing choice)
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { electionId } = req.body;

    if (!electionId) {
      return res.status(400).json({ error: 'Missing electionId' });
    }

    const voteHash = crypto.createHash('sha256').update(`${uid}-${electionId}`).digest('hex');
    const voteDoc = await db.collection(collections.VOTES).doc(voteHash).get();

    if (!voteDoc.exists) {
      return res.json({ 
        verified: false,
        message: 'No vote record found for this election'
      });
    }

    const voteData = voteDoc.data();

    res.json({ 
      verified: true,
      votedAt: voteData.votedAt,
      electionId: voteData.electionId,
      message: 'Your vote has been recorded and verified'
    });
  } catch (error) {
    console.error('Vote verification error:', error);
    res.status(500).json({ error: 'Failed to verify vote' });
  }
});

module.exports = router;

