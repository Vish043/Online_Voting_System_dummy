# 3-Level Election System Implementation Guide

## Overview

This document describes the implementation of India's 3-level election structure (National, State, Local) in the Online Voting System.

## Implementation Status

### ✅ Completed Backend Changes

#### 1. Database Schema Updates

**voterRegistry Collection:**
- ✅ Added `state` (string) - Required field
- ✅ Added `district` (string) - Required field  
- ✅ Added `ward` (string) - Required field

**elections Collection:**
- ✅ Updated `type` enum: `'national' | 'state' | 'local'` (replaces generic 'general')
- ✅ Enhanced `allowedRegions` array for region-based filtering
- ✅ Added `constituency` (string) - Optional constituency name
- ✅ Added `regionHierarchy` (object) - `{ state, district, ward }`

**candidates Collection:**
- ✅ Added `positionTitle` (string) - `'MP' | 'MLA' | 'Councillor' | 'Sarpanch'`

#### 2. Backend API Updates

**Authentication Routes (`/api/auth`):**
- ✅ `POST /register` - Now requires `state`, `district`, `ward` fields
- ✅ `PUT /profile` - Can update region fields

**Election Routes (`/api/elections`):**
- ✅ `GET /` - Filters active elections by voter eligibility
- ✅ `GET /upcoming` - Filters upcoming elections by voter eligibility
- ✅ `GET /completed` - Shows only approved results
- ✅ Added `checkVoterEligibility()` helper function

**Voting Routes (`/api/votes`):**
- ✅ `POST /` - Validates eligibility before allowing vote
- ✅ Region-based eligibility check based on election type

**Admin Routes (`/api/admin`):**
- ✅ `POST /elections` - Enhanced election creation with:
  - Type validation (`national`, `state`, `local`)
  - Region validation based on type
  - Constituency and region hierarchy support
- ✅ `POST /elections/:id/candidates` - Auto-assigns `positionTitle` based on election type:
  - National → 'MP'
  - State → 'MLA'
  - Local → 'Councillor' (default, can be 'Sarpanch')

#### 3. Eligibility Logic

```javascript
if (election.type === 'national') {
  // All verified voters eligible
  return true;
} else if (election.type === 'state') {
  // Voter must be in allowedRegions (states)
  return allowedRegions.includes(voter.state);
} else if (election.type === 'local') {
  // Voter must match district or ward in allowedRegions
  return allowedRegions.includes(voter.district) || 
         allowedRegions.includes(voter.ward) ||
         allowedRegions.includes(`${voter.district}-${voter.ward}`);
}
```

### ✅ Completed Frontend Changes

#### 1. Registration Form (`Register.jsx`)
- ✅ Added `state` field (required)
- ✅ Added `district` field (required)
- ✅ Added `ward` field (required)
- ✅ Added "Region Information" section with clear labels

### 🔄 In Progress / Pending

#### Frontend Updates Needed:

1. **Profile Page (`Profile.jsx`)**
   - [ ] Display region information (state, district, ward)
   - [ ] Allow editing region fields
   - [ ] Show region in profile details

2. **Admin Election Creation (`AdminCreateElection.jsx`)**
   - [ ] Add election type dropdown (National/State/Local)
   - [ ] Dynamic region selectors:
     - National: No regions needed
     - State: State selector(s)
     - Local: State → District → Ward selector
   - [ ] Constituency name field
   - [ ] Region hierarchy display

3. **Elections Page (`Elections.jsx`)**
   - [ ] Add election type filters (National/State/Local tabs)
   - [ ] Show election type badge
   - [ ] Display constituency information

4. **Results Page (`Results.jsx`)**
   - [ ] Display position title (MP/MLA/Councillor/Sarpanch)
   - [ ] Show constituency name
   - [ ] Update winner declaration with position title
   - [ ] Example: "Winner: X becomes MLA of <constituency>"

5. **Election Detail Page (`ElectionDetail.jsx`)**
   - [ ] Show election type and level
   - [ ] Display constituency information
   - [ ] Show eligibility status based on voter's region

6. **Candidate Cards**
   - [ ] Display position title alongside candidate name
   - [ ] Show "Running for MP/MLA/Councillor" badge

## Usage Guide

### For Admins: Creating Elections

#### National Election
```json
{
  "title": "Lok Sabha Election 2025",
  "type": "national",
  "allowedRegions": [],  // Empty - all voters eligible
  "constituency": "Mumbai North",
  "startDate": "2025-04-01T00:00:00Z",
  "endDate": "2025-04-30T23:59:59Z"
}
```

#### State Election
```json
{
  "title": "Maharashtra Vidhan Sabha Election 2025",
  "type": "state",
  "allowedRegions": ["Maharashtra"],  // Only Maharashtra voters
  "constituency": "Mumbai South",
  "startDate": "2025-05-01T00:00:00Z",
  "endDate": "2025-05-31T23:59:59Z"
}
```

#### Local Election
```json
{
  "title": "Mumbai Municipal Corporation Election",
  "type": "local",
  "allowedRegions": ["Mumbai", "Ward 1", "Ward 2"],  // Specific districts/wards
  "constituency": "Ward 1",
  "regionHierarchy": {
    "state": "Maharashtra",
    "district": "Mumbai",
    "ward": "Ward 1"
  },
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-06-30T23:59:59Z"
}
```

### For Voters: Registration

Voters must provide:
- **State**: e.g., "Maharashtra", "Karnataka", "Delhi"
- **District**: e.g., "Mumbai", "Bangalore", "New Delhi"
- **Ward**: e.g., "Ward 1", "Panchayat Name", "Locality Name"

### Eligibility Examples

**Example 1: National Election**
- Voter: State=Maharashtra, District=Mumbai, Ward=Ward1
- Election: type=national, allowedRegions=[]
- **Result**: ✅ Eligible (all voters eligible for national)

**Example 2: State Election**
- Voter: State=Maharashtra, District=Mumbai, Ward=Ward1
- Election: type=state, allowedRegions=["Maharashtra"]
- **Result**: ✅ Eligible (voter's state matches)

**Example 3: State Election (Different State)**
- Voter: State=Karnataka, District=Bangalore, Ward=Ward1
- Election: type=state, allowedRegions=["Maharashtra"]
- **Result**: ❌ Not Eligible (voter's state doesn't match)

**Example 4: Local Election**
- Voter: State=Maharashtra, District=Mumbai, Ward=Ward1
- Election: type=local, allowedRegions=["Mumbai", "Ward1"]
- **Result**: ✅ Eligible (voter's district/ward matches)

**Example 5: Local Election (Different Ward)**
- Voter: State=Maharashtra, District=Mumbai, Ward=Ward2
- Election: type=local, allowedRegions=["Mumbai", "Ward1"]
- **Result**: ❌ Not Eligible (voter's ward doesn't match)

## Position Titles

| Election Type | Position Title | Representative Of |
|--------------|----------------|------------------|
| `national` | MP (Member of Parliament) | Lok Sabha Constituency |
| `state` | MLA (Member of Legislative Assembly) | Vidhan Sabha Constituency |
| `local` | Councillor | Municipal Ward |
| `local` | Sarpanch | Panchayat (rural) |

## Testing Checklist

### Backend Testing
- [x] Voter registration with region fields
- [x] Election creation with type and regions
- [x] Eligibility check for national elections
- [x] Eligibility check for state elections
- [x] Eligibility check for local elections
- [x] Vote submission with eligibility validation
- [x] Candidate creation with position title

### Frontend Testing
- [ ] Registration form with region fields
- [ ] Profile display and edit with regions
- [ ] Admin election creation form
- [ ] Election filtering by type
- [ ] Results display with position titles
- [ ] Eligibility indicators in UI

## Migration Notes

### Existing Data

If you have existing elections or voters:

1. **Existing Voters**: Need to add `state`, `district`, `ward` fields
   - Can be done via admin panel or direct database update
   - Voters won't be eligible for state/local elections until regions are added

2. **Existing Elections**: 
   - Default `type` to `'general'` (will need manual update)
   - Add `allowedRegions: []` for backward compatibility
   - Update to `'national'`, `'state'`, or `'local'` as needed

3. **Existing Candidates**:
   - Add `positionTitle` based on election type
   - Can be auto-assigned when creating new candidates

## Next Steps

1. Complete frontend Profile page updates
2. Complete admin election creation form
3. Add election type filters to Elections page
4. Update Results page with position titles
5. Add eligibility indicators throughout UI
6. Test end-to-end workflows
7. Update documentation

## API Changes Summary

### New/Modified Endpoints

**POST /api/auth/register**
- **New Required Fields**: `state`, `district`, `ward`
- **Response**: Same as before

**POST /api/admin/elections**
- **New Required Field**: `type` ('national' | 'state' | 'local')
- **New Fields**: `constituency`, `regionHierarchy`
- **Validation**: `allowedRegions` required for state/local elections

**POST /api/admin/elections/:id/candidates**
- **New Field**: `positionTitle` (optional, auto-assigned if not provided)
- **Auto-assignment**: Based on election type

**GET /api/elections**
- **Behavior Change**: Now filters by voter eligibility
- **Admin Override**: Admins see all elections

**GET /api/elections/upcoming**
- **Behavior Change**: Now filters by voter eligibility
- **Admin Override**: Admins see all elections

## Security Considerations

1. **Region Validation**: Server-side validation ensures voters can only vote in eligible elections
2. **Election Type Validation**: Backend validates election type on creation
3. **Eligibility Check**: Performed on both election listing and vote submission
4. **Admin Override**: Admins can see all elections but cannot vote

---

**Last Updated**: December 2025
**Status**: Backend Complete, Frontend In Progress

