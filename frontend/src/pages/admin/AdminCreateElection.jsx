import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { INDIAN_STATES_AND_UTS } from '../../constants/indianStates'
import { 
  getConstituenciesByState, 
  getDistrictsByState, 
  getConstituenciesByDistrict,
  hasVidhanSabhaData 
} from '../../constants/constituencies'

export default function AdminCreateElection() {
  const navigate = useNavigate()
  const [electionData, setElectionData] = useState({
    title: '',
    description: '',
    type: 'national',
    startDate: '',
    endDate: '',
    constituency: '',
    allowedRegions: [],
    regionHierarchy: { state: '', district: '', ward: '' }
  })
  const [regionInput, setRegionInput] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [candidates, setCandidates] = useState([
    { name: '', party: '', biography: '', photoURL: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  function handleElectionChange(e) {
    const { name, value } = e.target
    setElectionData({
      ...electionData,
      [name]: value,
      // Reset regions when type changes
      ...(name === 'type' && { allowedRegions: [], regionHierarchy: { state: '', district: '', ward: '' }, constituency: '' })
    })
    // Clear district selection when type changes or constituency is cleared
    if (name === 'type' || (name === 'constituency' && value === '')) {
      setSelectedDistrict('')
    }
  }

  function handleRegionHierarchyChange(field, value) {
    setElectionData({
      ...electionData,
      regionHierarchy: {
        ...electionData.regionHierarchy,
        [field]: value
      }
    })
  }

  function addRegion() {
    if (regionInput.trim()) {
      setElectionData({
        ...electionData,
        allowedRegions: [...electionData.allowedRegions, regionInput.trim()]
      })
      setRegionInput('')
    }
  }

  function removeRegion(index) {
    const newAllowedRegions = electionData.allowedRegions.filter((_, i) => i !== index)
    setElectionData({
      ...electionData,
      allowedRegions: newAllowedRegions,
      // Clear constituency if no regions left or if it was a state election
      ...(electionData.type === 'state' && newAllowedRegions.length === 0 ? { constituency: '' } : {})
    })
    // Clear district selection if state is removed
    if (electionData.type === 'state') {
      setSelectedDistrict('')
    }
  }

  function handleCandidateChange(index, field, value) {
    const newCandidates = [...candidates]
    newCandidates[index][field] = value
    setCandidates(newCandidates)
  }

  function addCandidate() {
    setCandidates([...candidates, { name: '', party: '', biography: '', photoURL: '' }])
  }

  function removeCandidate(index) {
    if (candidates.length > 1) {
      const newCandidates = candidates.filter((_, i) => i !== index)
      setCandidates(newCandidates)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Validation
    if (!electionData.title || !electionData.startDate || !electionData.endDate || !electionData.type) {
      setMessage({ type: 'error', text: 'Please fill in all required election fields' })
      return
    }

    if (new Date(electionData.startDate) >= new Date(electionData.endDate)) {
      setMessage({ type: 'error', text: 'End date must be after start date' })
      return
    }

    // Validate regions based on election type
    if (electionData.type === 'state' && electionData.allowedRegions.length === 0) {
      setMessage({ type: 'error', text: 'State elections require at least one allowed region (state name)' })
      return
    }

    if (electionData.type === 'local' && electionData.allowedRegions.length === 0) {
      setMessage({ type: 'error', text: 'Local elections require at least one allowed region (district/ward name)' })
      return
    }

    const validCandidates = candidates.filter(c => c.name && c.party)
    if (validCandidates.length < 2) {
      setMessage({ type: 'error', text: 'Please add at least 2 candidates with name and party' })
      return
    }

    try {
      setLoading(true)
      setMessage({ type: '', text: '' })

      // Prepare election data for API
      const electionPayload = {
        title: electionData.title,
        description: electionData.description,
        type: electionData.type,
        startDate: electionData.startDate,
        endDate: electionData.endDate,
        constituency: electionData.constituency || '',
        allowedRegions: electionData.allowedRegions,
        regionHierarchy: electionData.regionHierarchy
      }

      // Create election
      const electionRes = await adminAPI.createElection(electionPayload)
      const electionId = electionRes.data.electionId

      // Add candidates
      for (const candidate of validCandidates) {
        await adminAPI.addCandidate(electionId, candidate)
      }

      setMessage({ type: 'success', text: 'Election created successfully!' })
      setTimeout(() => {
        navigate('/admin/elections')
      }, 2000)
    } catch (error) {
      console.error('Create election error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to create election' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={styles.container}>
      <button onClick={() => navigate('/admin/elections')} className="btn btn-outline" style={styles.backBtn}>
        <ArrowLeft size={18} />
        Back to Elections
      </button>

      <h1 style={styles.pageTitle}>Create New Election</h1>
      <p style={styles.subtitle}>Set up a new election with candidates</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Election Details */}
        <div className="card" style={styles.section}>
          <h2 style={styles.sectionTitle}>Election Details</h2>

          <div className="input-group">
            <label htmlFor="title">Election Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={electionData.title}
              onChange={handleElectionChange}
              required
              placeholder="e.g., Presidential Election 2024"
            />
          </div>

          <div className="input-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={electionData.description}
              onChange={handleElectionChange}
              rows={3}
              placeholder="Brief description of the election"
            />
          </div>

          <div className="input-group">
            <label htmlFor="type">Election Type *</label>
            <select
              id="type"
              name="type"
              value={electionData.type}
              onChange={handleElectionChange}
              required
              style={styles.typeSelect}
            >
              <option value="national">National (Lok Sabha) - Elects MP</option>
              <option value="state">State (Vidhan Sabha) - Elects MLA</option>
              <option value="local">Local (Municipality/Panchayat) - Elects Councillor/Sarpanch</option>
            </select>
            <div style={styles.typeDescription}>
              {electionData.type === 'national' && (
                <p style={styles.descriptionText}>
                  <strong>Lok Sabha Election:</strong> National-level election where all verified voters are eligible. 
                  Winners become Members of Parliament (MP).
                </p>
              )}
              {electionData.type === 'state' && (
                <p style={styles.descriptionText}>
                  <strong>Vidhan Sabha Election:</strong> State-level election. Only voters from selected states are eligible. 
                  Winners become Members of Legislative Assembly (MLA).
                </p>
              )}
              {electionData.type === 'local' && (
                <p style={styles.descriptionText}>
                  <strong>Municipality/Panchayat Election:</strong> Local-level election. Only voters from selected districts/wards are eligible. 
                  Winners become Councillors (municipal) or Sarpanch (panchayat).
                </p>
              )}
            </div>
          </div>

          {/* Region Configuration */}
          {electionData.type === 'national' ? (
            <div style={styles.regionSection}>
              <h3 style={styles.subsectionTitle}>Select State to View Constituencies</h3>
              <p style={styles.regionHelp}>
                Select a state to see its constituencies in the dropdown below. This will help you select the correct constituency name.
              </p>
              <div>
                <label style={styles.selectLabel}>Select State/UT:</label>
                <select
                  value={regionInput}
                  onChange={(e) => {
                    const selectedState = e.target.value
                    setRegionInput(selectedState)
                    // Automatically update allowedRegions when state is selected
                    if (selectedState) {
                      setElectionData({ 
                        ...electionData, 
                        allowedRegions: [selectedState],
                        constituency: '' // Clear constituency when state changes
                      })
                    } else {
                      setElectionData({ 
                        ...electionData, 
                        allowedRegions: [],
                        constituency: ''
                      })
                    }
                  }}
                  style={styles.stateSelect}
                >
                  <option value="">Choose a state or union territory...</option>
                  {INDIAN_STATES_AND_UTS.map((state) => (
                    <option key={state.name} value={state.name}>
                      {state.name} ({state.seats} seats)
                    </option>
                  ))}
                </select>
                {electionData.allowedRegions.length > 0 && (
                  <div style={styles.selectedStateInfo}>
                    <span className="badge badge-success">
                      Selected: {electionData.allowedRegions[0]}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setElectionData({ ...electionData, allowedRegions: [], constituency: '' })
                        setRegionInput('')
                      }}
                      className="btn btn-outline"
                      style={{ ...styles.addRegionBtn, marginLeft: '0.5rem' }}
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.regionSection}>
              <h3 style={styles.subsectionTitle}>
                {electionData.type === 'state' ? 'Allowed States' : 'Allowed Districts/Wards'}
              </h3>
              <p style={styles.regionHelp}>
                {electionData.type === 'state' 
                  ? 'Add state names. Only voters from these states will be eligible to vote.'
                  : 'Add district or ward names. Only voters from these regions will be eligible to vote.'}
              </p>

              {/* Region Hierarchy (for reference) */}
              <div style={styles.row}>
                {electionData.type === 'local' && (
                  <>
                    <div className="input-group">
                      <label>State (Reference)</label>
                      <input
                        type="text"
                        value={electionData.regionHierarchy.state}
                        onChange={(e) => handleRegionHierarchyChange('state', e.target.value)}
                        placeholder="e.g., Maharashtra"
                      />
                    </div>
                    <div className="input-group">
                      <label>District (Reference)</label>
                      <input
                        type="text"
                        value={electionData.regionHierarchy.district}
                        onChange={(e) => handleRegionHierarchyChange('district', e.target.value)}
                        placeholder="e.g., Mumbai"
                      />
                    </div>
                    <div className="input-group">
                      <label>Ward (Reference)</label>
                      <input
                        type="text"
                        value={electionData.regionHierarchy.ward}
                        onChange={(e) => handleRegionHierarchyChange('ward', e.target.value)}
                        placeholder="e.g., Ward 1"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Add Regions */}
              <div style={styles.addRegionSection}>
                {electionData.type === 'state' ? (
                  <div>
                    <label style={styles.selectLabel}>Select State/UT:</label>
                    <select
                      value={regionInput}
                      onChange={(e) => {
                        const selectedState = e.target.value
                        setRegionInput(selectedState)
                        // Clear district and constituency when state changes
                        setSelectedDistrict('')
                        setElectionData({ 
                          ...electionData, 
                          constituency: '',
                          // Don't update allowedRegions here - let addRegion handle it
                        })
                      }}
                      style={styles.stateSelect}
                    >
                      <option value="">Choose a state or union territory...</option>
                      {INDIAN_STATES_AND_UTS.map((state) => {
                        const vidhanSabhaSeats = state.vidhanSabhaSeats
                        const seatInfo = vidhanSabhaSeats 
                          ? `${vidhanSabhaSeats} Assembly seats`
                          : 'No Assembly'
                        return (
                          <option key={state.name} value={state.name}>
                            {state.name} ({seatInfo})
                          </option>
                        )
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        addRegion()
                        // Clear district selection when state is added
                        setSelectedDistrict('')
                      }}
                      className="btn btn-secondary"
                      style={styles.addRegionBtn}
                      disabled={!regionInput}
                    >
                      <Plus size={16} />
                      Add State
                    </button>
                  </div>
                ) : (
                  <div style={styles.addRegionInput}>
                    <input
                      type="text"
                      value={regionInput}
                      onChange={(e) => setRegionInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRegion())}
                      placeholder="Enter district or ward name (e.g., Mumbai, Ward 1)"
                      style={styles.regionInput}
                    />
                    <button
                      type="button"
                      onClick={addRegion}
                      className="btn btn-secondary"
                      style={styles.addRegionBtn}
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Display Added Regions */}
              {electionData.allowedRegions.length > 0 && (
                <div style={styles.regionsList}>
                  <p style={styles.regionsLabel}>Allowed Regions:</p>
                  <div style={styles.regionsTags}>
                    {electionData.allowedRegions.map((region, index) => (
                      <span key={index} className="badge badge-info" style={styles.regionTag}>
                        {region}
                        <button
                          type="button"
                          onClick={() => removeRegion(index)}
                          style={styles.removeRegionBtn}
                          aria-label="Remove region"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Constituency Name Field - Appears after state selection for national elections, or after district selection for state elections */}
          <div className="input-group">
            <label htmlFor="constituency">Constituency Name *</label>
            {electionData.type === 'national' && electionData.allowedRegions.length === 1 ? (
              // Show dropdown if single state selected for national election
              (() => {
                const selectedState = electionData.allowedRegions[0]
                const constituencies = getConstituenciesByState(selectedState)
                return constituencies.length > 0 ? (
                  <>
                    <select
                      id="constituency"
                      name="constituency"
                      value={electionData.constituency}
                      onChange={handleElectionChange}
                      style={styles.constituencySelect}
                      required
                    >
                      <option value="">-- Select a constituency from {selectedState} --</option>
                      {constituencies.map((constituency) => (
                        <option key={constituency} value={constituency}>
                          {constituency}
                        </option>
                      ))}
                    </select>
                    <small style={styles.helpText}>
                      Showing {constituencies.length} constituencies for {selectedState}. Select one from the dropdown above.
                    </small>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      id="constituency"
                      name="constituency"
                      value={electionData.constituency}
                      onChange={handleElectionChange}
                      placeholder={`Enter constituency name for ${selectedState}`}
                      required
                    />
                    <small style={styles.helpText}>
                      No predefined constituencies found for {selectedState}. Please enter the constituency name manually.
                    </small>
                  </>
                )
              })()
            ) : electionData.type === 'state' && electionData.allowedRegions.length === 1 && hasVidhanSabhaData(electionData.allowedRegions[0]) ? (
              // Show district and constituency dropdowns for state elections with Vidhan Sabha data
              (() => {
                const selectedState = electionData.allowedRegions[0]
                const districts = getDistrictsByState(selectedState)
                const constituencies = selectedDistrict ? getConstituenciesByDistrict(selectedState, selectedDistrict) : []
                
                return (
                  <>
                    {/* District Selection */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={styles.selectLabel}>Select District:</label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value)
                          setElectionData({ ...electionData, constituency: '' }) // Clear constituency when district changes
                        }}
                        style={styles.stateSelect}
                        required
                      >
                        <option value="">-- Select a district --</option>
                        {districts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Constituency Selection */}
                    {selectedDistrict && constituencies.length > 0 ? (
                      <>
                        <select
                          id="constituency"
                          name="constituency"
                          value={electionData.constituency}
                          onChange={handleElectionChange}
                          style={styles.constituencySelect}
                          required
                        >
                          <option value="">-- Select a constituency from {selectedDistrict} --</option>
                          {constituencies.map((constituency) => (
                            <option key={constituency} value={constituency}>
                              {constituency}
                            </option>
                          ))}
                        </select>
                        <small style={styles.helpText}>
                          Showing {constituencies.length} constituencies for {selectedDistrict} district. Select one from the dropdown above.
                        </small>
                      </>
                    ) : selectedDistrict ? (
                      <>
                        <input
                          type="text"
                          id="constituency"
                          name="constituency"
                          value={electionData.constituency}
                          onChange={handleElectionChange}
                          placeholder={`Enter constituency name for ${selectedDistrict}`}
                          required
                        />
                        <small style={styles.helpText}>
                          No predefined constituencies found for {selectedDistrict}. Please enter the constituency name manually.
                        </small>
                      </>
                    ) : (
                      <small style={styles.helpText}>
                        <strong>Step 1:</strong> Select a district above to see its constituencies.
                      </small>
                    )}
                  </>
                )
              })()
            ) : (
              <>
                <input
                  type="text"
                  id="constituency"
                  name="constituency"
                  value={electionData.constituency}
                  onChange={handleElectionChange}
                  placeholder={
                    electionData.type === 'national' ? 'Select a state above first to see constituencies, or enter manually' :
                    electionData.type === 'state' ? 'Select a state above first, or enter constituency name manually (e.g., Mumbai South)' :
                    'e.g., Ward 1, Panchayat Name'
                  }
                  required={electionData.type === 'national' ? false : true}
                />
                {electionData.type === 'national' && (
                  <small style={styles.helpText}>
                    <strong>Step 2:</strong> After selecting a state above, you'll see constituencies in a dropdown, or enter constituency name manually.
                  </small>
                )}
                {electionData.type === 'state' && electionData.allowedRegions.length === 0 && (
                  <small style={styles.helpText}>
                    <strong>Step 1:</strong> Select a state above first. If the state has Vidhan Sabha data, you'll see district and constituency dropdowns.
                  </small>
                )}
              </>
            )}
          </div>

          <div style={styles.row}>

            <div className="input-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={electionData.startDate}
                onChange={handleElectionChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={electionData.endDate}
                onChange={handleElectionChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div className="card" style={styles.section}>
          <div style={styles.candidatesHeader}>
            <h2 style={styles.sectionTitle}>Candidates</h2>
            <button 
              type="button" 
              onClick={addCandidate} 
              className="btn btn-secondary"
            >
              <Plus size={18} />
              Add Candidate
            </button>
          </div>

          <div style={styles.candidatesList}>
            {candidates.map((candidate, index) => (
              <div key={index} className="card" style={styles.candidateCard}>
                <div style={styles.candidateHeader}>
                  <h3 style={styles.candidateNumber}>Candidate {index + 1}</h3>
                  {candidates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCandidate(index)}
                      className="btn btn-danger"
                      style={styles.removeBtn}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div style={styles.row}>
                  <div className="input-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={candidate.name}
                      onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                      placeholder="Candidate name"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Party *</label>
                    <input
                      type="text"
                      value={candidate.party}
                      onChange={(e) => handleCandidateChange(index, 'party', e.target.value)}
                      placeholder="Political party"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Biography</label>
                  <textarea
                    value={candidate.biography}
                    onChange={(e) => handleCandidateChange(index, 'biography', e.target.value)}
                    rows={2}
                    placeholder="Brief biography or campaign message"
                  />
                </div>

                <div className="input-group">
                  <label>Photo URL</label>
                  <input
                    type="url"
                    value={candidate.photoURL}
                    onChange={(e) => handleCandidateChange(index, 'photoURL', e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div style={styles.submitSection}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Creating Election...' : 'Create Election'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem 1rem',
    maxWidth: '900px',
    margin: '0 auto'
  },
  backBtn: {
    marginBottom: '1.5rem'
  },
  pageTitle: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginBottom: '2rem'
  },
  section: {
    marginBottom: '2rem'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  candidatesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  candidatesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  candidateCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '2px dashed var(--border-color)'
  },
  candidateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  candidateNumber: {
    fontSize: '1.125rem',
    color: 'var(--primary-color)'
  },
  removeBtn: {
    padding: '0.5rem',
    fontSize: '0.875rem'
  },
  submitSection: {
    textAlign: 'center',
    padding: '2rem 0'
  },
  submitBtn: {
    fontSize: '1.125rem',
    padding: '0.875rem 3rem'
  },
  typeSelect: {
    fontSize: '1rem',
    padding: '0.75rem'
  },
  typeDescription: {
    marginTop: '0.75rem',
    padding: '1rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem',
    borderLeft: '4px solid var(--primary-color)'
  },
  descriptionText: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    lineHeight: '1.6'
  },
  regionSection: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-color)'
  },
  subsectionTitle: {
    fontSize: '1.125rem',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)'
  },
  regionHelp: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem'
  },
  addRegionSection: {
    marginTop: '1rem'
  },
  addRegionInput: {
    display: 'flex',
    gap: '0.5rem'
  },
  regionInput: {
    flex: 1,
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  addRegionBtn: {
    whiteSpace: 'nowrap'
  },
  regionsList: {
    marginTop: '1rem'
  },
  regionsLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem'
  },
  regionsTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  regionTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem'
  },
  removeRegionBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '1.25rem',
    lineHeight: 1,
    padding: 0,
    marginLeft: '0.25rem',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    width: '20px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  stateSelect: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    marginBottom: '0.75rem',
    cursor: 'pointer'
  },
  constituencySelect: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  helpText: {
    display: 'block',
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic'
  },
  selectedStateInfo: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.75rem',
    gap: '0.5rem'
  }
}

