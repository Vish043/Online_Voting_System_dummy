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

// Bulk Verify Voters
router.post('/voters/bulk-verify', async (req, res) => {
  try {
    const { voterIds, isVerified, isEligible } = req.body;

    if (!Array.isArray(voterIds) || voterIds.length === 0) {
      return res.status(400).json({ error: 'voterIds must be a non-empty array' });
    }

    const batch = db.batch();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const adminId = req.user.uid;

    // Update all voters in batch
    voterIds.forEach(voterId => {
      const voterRef = db.collection(collections.VOTER_REGISTRY).doc(voterId);
      batch.update(voterRef, {
        isVerified: isVerified !== undefined ? isVerified : true,
        isEligible: isEligible !== undefined ? isEligible : true,
        verifiedAt: timestamp,
        verifiedBy: adminId
      });
    });

    // Commit batch update
    await batch.commit();

    // Log audit for bulk action
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'BULK_VOTER_VERIFIED',
      adminId: adminId,
      voterIds: voterIds,
      count: voterIds.length,
      isVerified,
      isEligible,
      timestamp: timestamp
    });

    res.json({ 
      message: `Successfully ${isVerified ? 'verified' : 'rejected'} ${voterIds.length} voter(s)`,
      count: voterIds.length
    });
  } catch (error) {
    console.error('Bulk voter verification error:', error);
    res.status(500).json({ error: 'Failed to verify voters' });
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
      allowedRegions,
      constituency,
      regionHierarchy
    } = req.body;

    if (!title || !startDate || !endDate || !type) {
      return res.status(400).json({ error: 'Missing required fields: title, startDate, endDate, and type are required' });
    }

    // Validate election type
    const validTypes = ['national', 'state', 'local'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid election type. Must be one of: ${validTypes.join(', ')}` });
    }

    // Validate allowedRegions based on type
    if (type === 'state' && (!allowedRegions || allowedRegions.length === 0)) {
      return res.status(400).json({ error: 'State elections require at least one allowed region (state)' });
    }
    if (type === 'local' && (!allowedRegions || allowedRegions.length === 0)) {
      return res.status(400).json({ error: 'Local elections require at least one allowed region (district/ward)' });
    }

    const electionData = {
      title,
      description: description || '',
      type: type, // 'national', 'state', or 'local'
      startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
      endDate: admin.firestore.Timestamp.fromDate(new Date(endDate)),
      status: 'scheduled',
      allowedRegions: allowedRegions || (type === 'national' ? [] : []),
      constituency: constituency || '',
      regionHierarchy: regionHierarchy || {}, // { state, district, ward }
      resultsApproved: false,
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
      partySymbol,
      position,
      positionTitle
    } = req.body;

    if (!name || !party) {
      return res.status(400).json({ error: 'Missing required fields: name and party are required' });
    }

    // Verify election exists
    const electionDoc = await db.collection(collections.ELECTIONS).doc(electionId).get();
    
    if (!electionDoc.exists) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const electionData = electionDoc.data();
    const electionType = electionData.type || 'general';
    
    // Check if a candidate from the same party already exists in this election
    const existingCandidatesSnapshot = await db.collection(collections.CANDIDATES)
      .where('electionId', '==', electionId)
      .where('party', '==', party)
      .get();

    if (!existingCandidatesSnapshot.empty) {
      const existingCandidate = existingCandidatesSnapshot.docs[0].data();
      return res.status(400).json({ 
        error: `A candidate from "${party}" (${existingCandidate.name}) already exists in this election. Only one candidate per party is allowed per seat/location.` 
      });
    }
    
    // Determine position title based on election type if not provided
    let finalPositionTitle = positionTitle;
    if (!finalPositionTitle) {
      if (electionType === 'national') {
        finalPositionTitle = 'MP';
      } else if (electionType === 'state') {
        finalPositionTitle = 'MLA';
      } else if (electionType === 'local') {
        finalPositionTitle = 'Councillor'; // Default, can be 'Sarpanch' for panchayat
      } else {
        finalPositionTitle = 'Representative';
      }
    }

    const candidateData = {
      electionId,
      name,
      party,
      biography: biography || '',
      photoURL: photoURL || '',
      partySymbol: partySymbol || '',
      position: position || 0,
      positionTitle: finalPositionTitle, // 'MP', 'MLA', 'Councillor', or 'Sarpanch'
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

    // Count parties by level
    const partyTemplatesSnapshot = await db.collection(collections.PARTY_TEMPLATES).get();
    const partiesByLevel = {
      national: 0,
      state: 0,
      local: 0,
      total: partyTemplatesSnapshot.size
    };
    partyTemplatesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.partyType === 'National Party') {
        partiesByLevel.national++;
      } else if (data.partyType === 'State Party') {
        partiesByLevel.state++;
      } else if (data.partyType === 'Local Party') {
        partiesByLevel.local++;
      }
    });

    // Count candidates by type
    const candidateTemplatesSnapshot = await db.collection(collections.CANDIDATE_TEMPLATES).get();
    const candidatesByType = {
      lokSabha: 0,
      vidhanSabha: 0,
      zillaParishad: 0,
      total: candidateTemplatesSnapshot.size
    };
    candidateTemplatesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.electionType === 'Lok Sabha') {
        candidatesByType.lokSabha++;
      } else if (data.electionType === 'Vidhan Sabha') {
        candidatesByType.vidhanSabha++;
      } else if (data.electionType === 'Zilla Parishad') {
        candidatesByType.zillaParishad++;
      }
    });

    res.json({
      statistics: {
        totalVoters,
        verifiedVoters,
        pendingVerification: totalVoters - verifiedVoters,
        totalElections,
        activeElections,
        totalVotes,
        partiesByLevel,
        candidatesByType
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

// Party Templates Management

// Get all party templates
router.get('/party-templates', async (req, res) => {
  try {
    const templatesSnapshot = await db.collection(collections.PARTY_TEMPLATES)
      .orderBy('createdAt', 'desc')
      .get();

    const templates = [];
    templatesSnapshot.forEach(doc => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        ...data,
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt)
      });
    });

    res.json({ templates });
  } catch (error) {
    console.error('Get party templates error:', error);
    res.status(500).json({ error: 'Failed to fetch party templates' });
  }
});

// Create party template
router.post('/party-templates', async (req, res) => {
  try {
    const {
      partyName,
      partyType,
      partySymbol,
      partyHistory
    } = req.body;

    if (!partyName || !partyType) {
      return res.status(400).json({ error: 'Party name and party type are required' });
    }

    const templateData = {
      partyName,
      partyType,
      partySymbol: partySymbol || '',
      partyHistory: partyHistory || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid
    };

    const templateRef = await db.collection(collections.PARTY_TEMPLATES).add(templateData);

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'PARTY_TEMPLATE_CREATED',
      adminId: req.user.uid,
      templateId: templateRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { partyName }
    });

    res.status(201).json({
      message: 'Party template created successfully',
      templateId: templateRef.id,
      template: { id: templateRef.id, ...templateData }
    });
  } catch (error) {
    console.error('Create party template error:', error);
    res.status(500).json({ error: 'Failed to create party template' });
  }
});

// Update party template
router.put('/party-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const {
      partyName,
      partyType,
      partySymbol,
      partyHistory
    } = req.body;

    const templateDoc = await db.collection(collections.PARTY_TEMPLATES).doc(templateId).get();
    
    if (!templateDoc.exists) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (partyName) updateData.partyName = partyName;
    if (partyType !== undefined) updateData.partyType = partyType;
    if (partySymbol !== undefined) updateData.partySymbol = partySymbol;
    if (partyHistory !== undefined) updateData.partyHistory = partyHistory;

    await db.collection(collections.PARTY_TEMPLATES).doc(templateId).update(updateData);

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'PARTY_TEMPLATE_UPDATED',
      adminId: req.user.uid,
      templateId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { partyName }
    });

    res.json({ message: 'Party template updated successfully' });
  } catch (error) {
    console.error('Update party template error:', error);
    res.status(500).json({ error: 'Failed to update party template' });
  }
});

// Delete party template
router.delete('/party-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;

    const templateDoc = await db.collection(collections.PARTY_TEMPLATES).doc(templateId).get();
    
    if (!templateDoc.exists) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await db.collection(collections.PARTY_TEMPLATES).doc(templateId).delete();

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'PARTY_TEMPLATE_DELETED',
      adminId: req.user.uid,
      templateId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Party template deleted successfully' });
  } catch (error) {
    console.error('Delete party template error:', error);
    res.status(500).json({ error: 'Failed to delete party template' });
  }
});

// Candidate Templates Management

// Get all candidate templates
router.get('/candidate-templates', async (req, res) => {
  try {
    const templatesSnapshot = await db.collection(collections.CANDIDATE_TEMPLATES)
      .orderBy('createdAt', 'desc')
      .get();

    const templates = [];
    templatesSnapshot.forEach(doc => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        ...data,
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt)
      });
    });

    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create candidate template
router.post('/candidate-templates', async (req, res) => {
  try {
    const {
      candidateName,
      partyName,
      partySymbol,
      candidateDescription,
      candidatePhoto,
      electionType,
      state,
      lokSabhaConstituency,
      vidhanSabhaConstituency,
      district
    } = req.body;

    if (!candidateName || !partyName || !electionType) {
      return res.status(400).json({ error: 'Candidate name, party name, and election type are required' });
    }

    const templateData = {
      candidateName,
      partyName,
      partySymbol: partySymbol || '',
      candidateDescription: candidateDescription || '',
      candidatePhoto: candidatePhoto || '',
      electionType,
      state: state || '',
      lokSabhaConstituency: lokSabhaConstituency || '',
      vidhanSabhaConstituency: vidhanSabhaConstituency || '',
      district: district || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid
    };

    const templateRef = await db.collection(collections.CANDIDATE_TEMPLATES).add(templateData);

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'CANDIDATE_TEMPLATE_CREATED',
      adminId: req.user.uid,
      templateId: templateRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { candidateName, partyName }
    });

    res.status(201).json({
      message: 'Template created successfully',
      templateId: templateRef.id,
      template: { id: templateRef.id, ...templateData }
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update candidate template
router.put('/candidate-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const {
      candidateName,
      partyName,
      partySymbol,
      candidateDescription,
      candidatePhoto,
      electionType,
      state,
      lokSabhaConstituency,
      vidhanSabhaConstituency,
      district
    } = req.body;

    const templateDoc = await db.collection(collections.CANDIDATE_TEMPLATES).doc(templateId).get();
    
    if (!templateDoc.exists) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (candidateName) updateData.candidateName = candidateName;
    if (partyName) updateData.partyName = partyName;
    if (partySymbol !== undefined) updateData.partySymbol = partySymbol;
    if (candidateDescription !== undefined) updateData.candidateDescription = candidateDescription;
    if (candidatePhoto !== undefined) updateData.candidatePhoto = candidatePhoto;
    if (electionType !== undefined) updateData.electionType = electionType;
    if (state !== undefined) updateData.state = state;
    if (lokSabhaConstituency !== undefined) updateData.lokSabhaConstituency = lokSabhaConstituency;
    if (vidhanSabhaConstituency !== undefined) updateData.vidhanSabhaConstituency = vidhanSabhaConstituency;
    if (district !== undefined) updateData.district = district;

    await db.collection(collections.CANDIDATE_TEMPLATES).doc(templateId).update(updateData);

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'CANDIDATE_TEMPLATE_UPDATED',
      adminId: req.user.uid,
      templateId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { candidateName, partyName }
    });

    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete candidate template
router.delete('/candidate-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;

    const templateDoc = await db.collection(collections.CANDIDATE_TEMPLATES).doc(templateId).get();
    
    if (!templateDoc.exists) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await db.collection(collections.CANDIDATE_TEMPLATES).doc(templateId).delete();

    // Log audit
    await db.collection(collections.AUDIT_LOGS).add({
      action: 'CANDIDATE_TEMPLATE_DELETED',
      adminId: req.user.uid,
      templateId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;

