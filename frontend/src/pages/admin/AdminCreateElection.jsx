import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft, UserCircle, X } from 'lucide-react'
import { INDIAN_STATES_AND_UTS } from '../../constants/indianStates'
import { 
  getConstituenciesByState, 
  getDistrictsByState, 
  getConstituenciesByDistrict,
  hasVidhanSabhaData 
} from '../../constants/constituencies'
import SearchableSelect from '../../components/SearchableSelect'

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
  const [selectedStateForZillaParishad, setSelectedStateForZillaParishad] = useState('')
  const [availableDistrictsForZillaParishad, setAvailableDistrictsForZillaParishad] = useState([])
  const [candidates, setCandidates] = useState([
    { name: '', party: '', biography: '', photoURL: '', photoType: 'url', partySymbol: '', partySymbolType: 'url', partyDescription: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [templates, setTemplates] = useState([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [filteredCandidateTemplates, setFilteredCandidateTemplates] = useState([])
  const [partyTemplates, setPartyTemplates] = useState([])

  // Update available districts when state is selected for Zilla Parishad
  useEffect(() => {
    if (electionData.type === 'local' && selectedStateForZillaParishad) {
      if (hasVidhanSabhaData(selectedStateForZillaParishad)) {
        const districts = getDistrictsByState(selectedStateForZillaParishad)
        setAvailableDistrictsForZillaParishad(districts)
      } else {
        setAvailableDistrictsForZillaParishad([])
      }
    } else {
      setAvailableDistrictsForZillaParishad([])
    }
  }, [selectedStateForZillaParishad, electionData.type])

  // Fetch templates when modal opens
  useEffect(() => {
    if (showTemplateModal) {
      fetchTemplates()
    }
  }, [showTemplateModal])

  // Fetch candidate templates based on election type and constituency
  useEffect(() => {
    if (electionData.type && (electionData.constituency || (electionData.type === 'local' && electionData.allowedRegions.length > 0))) {
      fetchFilteredCandidateTemplates()
    } else {
      setFilteredCandidateTemplates([])
    }
  }, [electionData.type, electionData.constituency, electionData.allowedRegions, electionData.regionHierarchy.district, electionData.regionHierarchy.state, selectedDistrict])

  // Fetch party templates on mount
  useEffect(() => {
    fetchPartyTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      setTemplateLoading(true)
      const res = await adminAPI.getCandidateTemplates()
      setTemplates(res.data.templates || [])
    } catch (error) {
      console.error('Fetch templates error:', error)
      setMessage({ type: 'error', text: 'Failed to load templates' })
    } finally {
      setTemplateLoading(false)
    }
  }

  async function fetchFilteredCandidateTemplates() {
    try {
      const res = await adminAPI.getCandidateTemplates()
      const allTemplates = res.data.templates || []
      
      // Map election type
      let electionTypeFilter = ''
      if (electionData.type === 'national') {
        electionTypeFilter = 'Lok Sabha'
      } else if (electionData.type === 'state') {
        electionTypeFilter = 'Vidhan Sabha'
      } else if (electionData.type === 'local') {
        electionTypeFilter = 'Zilla Parishad'
      }

      // Filter templates based on election type
      let filtered = allTemplates.filter(t => t.electionType === electionTypeFilter)

      // Filter by location based on election type
      if (electionData.type === 'national' && electionData.constituency && electionData.allowedRegions.length > 0) {
        const state = electionData.allowedRegions[0]
        filtered = filtered.filter(t => 
          t.lokSabhaConstituency === electionData.constituency &&
          t.state === state
        )
      } else if (electionData.type === 'state' && electionData.constituency && electionData.allowedRegions.length > 0 && selectedDistrict) {
        const state = electionData.allowedRegions[0]
        filtered = filtered.filter(t => 
          t.vidhanSabhaConstituency === electionData.constituency &&
          t.district === selectedDistrict &&
          t.state === state
        )
      } else if (electionData.type === 'local' && electionData.allowedRegions.length > 0 && electionData.regionHierarchy.state) {
        const district = electionData.allowedRegions[0] // For local, districts are in allowedRegions
        filtered = filtered.filter(t => 
          t.district === district &&
          t.state === electionData.regionHierarchy.state
        )
      }

      setFilteredCandidateTemplates(filtered)
    } catch (error) {
      console.error('Fetch filtered templates error:', error)
      setFilteredCandidateTemplates([])
    }
  }

  async function fetchPartyTemplates() {
    try {
      const res = await adminAPI.getPartyTemplates()
      setPartyTemplates(res.data.templates || [])
    } catch (error) {
      console.error('Fetch party templates error:', error)
    }
  }

  function applyTemplate(template) {
    const newCandidate = {
      name: template.candidateName || '',
      party: template.partyName || '',
      biography: template.candidateDescription || '',
      photoURL: template.candidatePhoto || '',
      photoType: template.candidatePhoto?.startsWith('data:') ? 'file' : 'url',
      partySymbol: template.partySymbol || '',
      partySymbolType: template.partySymbol?.startsWith('data:') ? 'file' : 'url'
    }
    
    setCandidates([...candidates, newCandidate])
    setShowTemplateModal(false)
    setMessage({ type: 'success', text: 'Template applied successfully' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

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
      setSelectedStateForZillaParishad('')
      setAvailableDistrictsForZillaParishad([])
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
    // Check for duplicate candidate name
    if (field === 'name' && value) {
      const duplicateIndex = candidates.findIndex((c, i) => 
        i !== index && c.name && c.name.toLowerCase().trim() === value.toLowerCase().trim()
      )
      if (duplicateIndex !== -1) {
        setMessage({ 
          type: 'error', 
          text: `This candidate "${value}" is already added as Candidate ${duplicateIndex + 1}. Each candidate can only be added once.` 
        })
        setTimeout(() => setMessage({ type: '', text: '' }), 5000)
        return
      }
    }
    
    const newCandidates = [...candidates]
    newCandidates[index][field] = value
    setCandidates(newCandidates)
  }

  function handlePartySymbolTypeChange(index, type) {
    const newCandidates = [...candidates]
    newCandidates[index].partySymbolType = type
    newCandidates[index].partySymbol = '' // Clear symbol when switching type
    setCandidates(newCandidates)
  }

  function handlePartySymbolFileChange(index, file) {
    if (!file) return
    
    const reader = new FileReader()
    reader.onloadend = () => {
      const newCandidates = [...candidates]
      newCandidates[index].partySymbol = reader.result // Base64 data URL
      setCandidates(newCandidates)
    }
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Failed to read file' })
    }
    reader.readAsDataURL(file)
  }

  function handlePhotoTypeChange(index, type) {
    const newCandidates = [...candidates]
    newCandidates[index].photoType = type
    newCandidates[index].photoURL = '' // Clear photo when switching type
    setCandidates(newCandidates)
  }

  function handlePhotoFileChange(index, file) {
    if (!file) return
    
    const reader = new FileReader()
    reader.onloadend = () => {
      const newCandidates = [...candidates]
      newCandidates[index].photoURL = reader.result // Base64 data URL
      setCandidates(newCandidates)
    }
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Failed to read file' })
    }
    reader.readAsDataURL(file)
  }

  function addCandidate() {
    setCandidates([...candidates, { name: '', party: '', biography: '', photoURL: '', photoType: 'url', partySymbol: '', partySymbolType: 'url', partyDescription: '' }])
  }

  function handleCandidateTemplateSelect(index, candidateName) {
    // Check for duplicate candidate name
    if (candidateName) {
      const duplicateIndex = candidates.findIndex((c, i) => 
        i !== index && c.name && c.name.toLowerCase().trim() === candidateName.toLowerCase().trim()
      )
      if (duplicateIndex !== -1) {
        setMessage({ 
          type: 'error', 
          text: `This candidate "${candidateName}" is already added as Candidate ${duplicateIndex + 1}. Each candidate can only be added once.` 
        })
        setTimeout(() => setMessage({ type: '', text: '' }), 5000)
        return
      }
    }

    const selectedTemplate = filteredCandidateTemplates.find(t => t.candidateName === candidateName)
    if (selectedTemplate) {
      // Find party template to get party description
      const partyTemplate = partyTemplates.find(pt => pt.partyName === selectedTemplate.partyName)
      
      const newCandidates = [...candidates]
      newCandidates[index] = {
        name: selectedTemplate.candidateName || '',
        party: selectedTemplate.partyName || '',
        biography: selectedTemplate.candidateDescription || '',
        photoURL: selectedTemplate.candidatePhoto || '',
        photoType: selectedTemplate.candidatePhoto?.startsWith('data:') ? 'file' : 'url',
        partySymbol: selectedTemplate.partySymbol || '',
        partySymbolType: selectedTemplate.partySymbol?.startsWith('data:') ? 'file' : 'url',
        partyDescription: partyTemplate?.partyHistory || ''
      }
      setCandidates(newCandidates)
    } else if (candidateName) {
      // If it's a custom name (not from template), just set the name
      const newCandidates = [...candidates]
      newCandidates[index].name = candidateName
      setCandidates(newCandidates)
    }
  }

  function handlePartyTemplateSelect(index, partyName) {
    const partyTemplate = partyTemplates.find(pt => pt.partyName === partyName)
    if (partyTemplate) {
      const newCandidates = [...candidates]
      newCandidates[index] = {
        ...newCandidates[index],
        party: partyTemplate.partyName || '',
        partySymbol: partyTemplate.partySymbol || '',
        partySymbolType: partyTemplate.partySymbol?.startsWith('data:') ? 'file' : 'url',
        partyDescription: partyTemplate.partyHistory || ''
      }
      setCandidates(newCandidates)
    } else {
      // If not found in templates, just set the party name
      const newCandidates = [...candidates]
      newCandidates[index].party = partyName
      setCandidates(newCandidates)
    }
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

    // Check for duplicate candidate names
    const candidateNames = candidates
      .map(c => c.name?.toLowerCase().trim())
      .filter(name => name)
    const uniqueNames = new Set(candidateNames)
    if (candidateNames.length !== uniqueNames.size) {
      setMessage({ type: 'error', text: 'Duplicate candidates detected. Each candidate can only be added once.' })
      return
    }

    // Validate regions based on election type
    if (electionData.type === 'state' && electionData.allowedRegions.length === 0) {
      setMessage({ type: 'error', text: 'State elections require at least one allowed region (state name)' })
      return
    }

    if (electionData.type === 'local' && electionData.allowedRegions.length === 0) {
      setMessage({ type: 'error', text: 'Zilla Parishad elections require at least one allowed region (district name)' })
      return
    }

    const validCandidates = candidates.filter(c => c.name && c.party)
    if (validCandidates.length < 2) {
      setMessage({ type: 'error', text: 'Please add at least 2 candidates with name and party' })
      return
    }

    // Validate: No two candidates from the same party for the same seat/location
    const partyLocationMap = new Map()
    for (const candidate of validCandidates) {
      // Create a unique key based on party and location (constituency for national/state, district for local)
      let locationKey
      if (electionData.type === 'national' || electionData.type === 'state') {
        locationKey = electionData.constituency || 'unknown'
      } else if (electionData.type === 'local') {
        // For local elections, use the first allowed region (district) as location
        locationKey = electionData.allowedRegions[0] || 'unknown'
      } else {
        locationKey = 'unknown'
      }

      const key = `${candidate.party.toLowerCase().trim()}_${locationKey.toLowerCase().trim()}`
      
      if (partyLocationMap.has(key)) {
        const existingCandidate = partyLocationMap.get(key)
        setMessage({ 
          type: 'error', 
          text: `Error: Multiple candidates from "${candidate.party}" cannot stand for the same seat/location. "${existingCandidate.name}" and "${candidate.name}" are both from the same party.` 
        })
        return
      }
      
      partyLocationMap.set(key, candidate)
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
        // Remove UI-only fields before sending
        const { partySymbolType, photoType, ...candidateData } = candidate
        await adminAPI.addCandidate(electionId, candidateData)
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
              placeholder="e.g., Lok Sabha Election 2024 - Delhi"
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
              <option value="local">Zilla Parishad - Elects Zilla Parishad Member</option>
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
                  <strong>Zilla Parishad Election:</strong> District-level election. Only voters from selected districts are eligible. 
                  Winners become Zilla Parishad Members.
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
                <SearchableSelect
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
                  options={INDIAN_STATES_AND_UTS.map((state) => 
                    `${state.name} (${state.seats} seats)`
                  )}
                  getOptionValue={(option) => {
                    const match = option.match(/^([^(]+?)\s*\(/)
                    return match ? match[1].trim() : option
                  }}
                  placeholder="Choose a state or union territory..."
                />
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
                {electionData.type === 'state' ? 'Allowed States' : 'Allowed Districts'}
              </h3>
              <p style={styles.regionHelp}>
                {electionData.type === 'state' 
                  ? 'Add state names. Only voters from these states will be eligible to vote.'
                  : 'Select a state first, then choose districts. Only voters from selected districts will be eligible to vote.'}
              </p>


              {/* Add Regions */}
              <div style={styles.addRegionSection}>
                {electionData.type === 'state' ? (
                  <div>
                    <label style={styles.selectLabel}>Select State/UT:</label>
                    <SearchableSelect
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
                      options={INDIAN_STATES_AND_UTS.map((state) => {
                        const vidhanSabhaSeats = state.vidhanSabhaSeats
                        const seatInfo = vidhanSabhaSeats 
                          ? `${vidhanSabhaSeats} Assembly seats`
                          : 'No Assembly'
                        return `${state.name} (${seatInfo})`
                      })}
                      getOptionValue={(option) => {
                        const match = option.match(/^([^(]+?)\s*\(/)
                        return match ? match[1].trim() : option
                      }}
                      placeholder="Choose a state or union territory..."
                    />
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
                ) : electionData.type === 'local' ? (
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={styles.selectLabel}>Select State/UT:</label>
                      <SearchableSelect
                        value={selectedStateForZillaParishad}
                        onChange={(e) => {
                          const selectedState = e.target.value
                          setSelectedStateForZillaParishad(selectedState)
                          setRegionInput('') // Clear district input when state changes
                          setElectionData({
                            ...electionData,
                            regionHierarchy: {
                              ...electionData.regionHierarchy,
                              state: selectedState
                            }
                          })
                        }}
                        options={INDIAN_STATES_AND_UTS.map((state) => 
                          `${state.name}${state.type === 'ut' ? ' (UT)' : ''} - ${state.seats} Lok Sabha seats`
                        )}
                        getOptionValue={(option) => {
                          const match = option.match(/^([^(]+?)(?:\s*\(UT\))?\s*-/)
                          return match ? match[1].trim() : option
                        }}
                        placeholder="Choose a state or union territory..."
                      />
                    </div>
                    {selectedStateForZillaParishad && (
                      <div>
                        <label style={styles.selectLabel}>Select District:</label>
                        {availableDistrictsForZillaParishad.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <SearchableSelect
                                value={regionInput}
                                onChange={(e) => {
                                  setRegionInput(e.target.value)
                                }}
                                options={availableDistrictsForZillaParishad}
                                placeholder="Choose a district..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (regionInput) {
                                  addRegion()
                                  setRegionInput('')
                                }
                              }}
                              className="btn btn-secondary"
                              style={styles.addRegionBtn}
                              disabled={!regionInput}
                            >
                              <Plus size={16} />
                              Add District
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <input
                              type="text"
                              value={regionInput}
                              onChange={(e) => setRegionInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRegion())}
                              placeholder="Enter district name (e.g., Mumbai, Pune)"
                              style={{ ...styles.regionInput, flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (regionInput) {
                                  addRegion()
                                  setRegionInput('')
                                }
                              }}
                              className="btn btn-secondary"
                              style={styles.addRegionBtn}
                              disabled={!regionInput}
                            >
                              <Plus size={16} />
                              Add District
                            </button>
                          </div>
                        )}
                        {selectedStateForZillaParishad && availableDistrictsForZillaParishad.length === 0 && (
                          <small style={styles.helpText}>
                            No predefined districts found for {selectedStateForZillaParishad}. Please enter district name manually.
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
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
                    <SearchableSelect
                      id="constituency"
                      name="constituency"
                      value={electionData.constituency}
                      onChange={handleElectionChange}
                      options={constituencies}
                      placeholder={`-- Select a constituency from ${selectedState} --`}
                      required
                    />
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
                      <SearchableSelect
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value)
                          setElectionData({ ...electionData, constituency: '' }) // Clear constituency when district changes
                        }}
                        options={districts}
                        placeholder="-- Select a district --"
                        required
                      />
                    </div>
                    
                    {/* Constituency Selection */}
                    {selectedDistrict && constituencies.length > 0 ? (
                      <>
                        <SearchableSelect
                          id="constituency"
                          name="constituency"
                          value={electionData.constituency}
                          onChange={handleElectionChange}
                          options={constituencies}
                          placeholder={`-- Select a constituency from ${selectedDistrict} --`}
                          required
                        />
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
                    'e.g., Zilla Parishad Constituency Name'
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
                    {filteredCandidateTemplates.length > 0 ? (
                      <SearchableSelect
                        value={candidate.name}
                        onChange={(e) => {
                          const candidateName = e.target.value
                          if (candidateName) {
                            handleCandidateTemplateSelect(index, candidateName)
                          } else {
                            handleCandidateChange(index, 'name', '')
                          }
                        }}
                        options={filteredCandidateTemplates
                          .map(t => t.candidateName)
                          .filter(name => {
                            // Exclude candidate names that are already used in other candidate entries
                            const isUsed = candidates.some((c, i) => 
                              i !== index && 
                              c.name && 
                              c.name.toLowerCase().trim() === name.toLowerCase().trim()
                            )
                            return !isUsed
                          })}
                        placeholder="Select candidate name"
                        allowCustom={true}
                        required
                      />
                    ) : (
                      <input
                        type="text"
                        value={candidate.name}
                        onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                        placeholder="Name"
                        required
                      />
                    )}
                    {filteredCandidateTemplates.length === 0 && electionData.type && (electionData.constituency || electionData.regionHierarchy.district) && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        No candidate templates found for this election type and location. You can type a custom name.
                      </p>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Party *</label>
                    <SearchableSelect
                      value={candidate.party}
                      onChange={(e) => {
                        const partyName = e.target.value
                        if (partyName) {
                          handlePartyTemplateSelect(index, partyName)
                        } else {
                          handleCandidateChange(index, 'party', '')
                        }
                      }}
                      options={partyTemplates.map(t => t.partyName)}
                      placeholder="Type party name"
                      allowCustom={true}
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
                    placeholder="e.g., Experienced leader committed to development and progress"
                  />
                </div>

                <div className="input-group">
                  <label>Candidate Photo</label>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`photoType-${index}`}
                          value="url"
                          checked={candidate.photoType === 'url'}
                          onChange={(e) => handlePhotoTypeChange(index, 'url')}
                        />
                        <span>URL</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`photoType-${index}`}
                          value="file"
                          checked={candidate.photoType === 'file'}
                          onChange={(e) => handlePhotoTypeChange(index, 'file')}
                        />
                        <span>Upload File</span>
                      </label>
                    </div>
                  </div>
                  {candidate.photoType === 'url' ? (
                    <input
                      type="url"
                      value={candidate.photoURL}
                      onChange={(e) => handleCandidateChange(index, 'photoURL', e.target.value)}
                      placeholder="https://example.com/candidate-photo.jpg"
                    />
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            // Validate file size (max 2MB)
                            if (file.size > 2 * 1024 * 1024) {
                              setMessage({ type: 'error', text: 'File size must be less than 2MB' })
                              return
                            }
                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              setMessage({ type: 'error', text: 'Please upload an image file' })
                              return
                            }
                            handlePhotoFileChange(index, file)
                          }
                        }}
                        style={{ marginBottom: '0.5rem' }}
                      />
                      {candidate.photoURL && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <img 
                            src={candidate.photoURL} 
                            alt="Photo Preview" 
                            style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.25rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleCandidateChange(index, 'photoURL', '')}
                            className="btn btn-outline"
                            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {candidate.photoURL && candidate.photoType === 'url' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img 
                        src={candidate.photoURL} 
                        alt="Photo Preview" 
                        onError={(e) => { e.target.style.display = 'none' }}
                        style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.25rem' }}
                      />
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label>Party Symbol</label>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`partySymbolType-${index}`}
                          value="url"
                          checked={candidate.partySymbolType === 'url'}
                          onChange={(e) => handlePartySymbolTypeChange(index, 'url')}
                        />
                        <span>URL</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`partySymbolType-${index}`}
                          value="file"
                          checked={candidate.partySymbolType === 'file'}
                          onChange={(e) => handlePartySymbolTypeChange(index, 'file')}
                        />
                        <span>Upload File</span>
                      </label>
                    </div>
                  </div>
                  {candidate.partySymbolType === 'url' ? (
                    <input
                      type="url"
                      value={candidate.partySymbol}
                      onChange={(e) => handleCandidateChange(index, 'partySymbol', e.target.value)}
                      placeholder="https://example.com/party-symbol.png"
                    />
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            // Validate file size (max 2MB)
                            if (file.size > 2 * 1024 * 1024) {
                              setMessage({ type: 'error', text: 'File size must be less than 2MB' })
                              return
                            }
                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              setMessage({ type: 'error', text: 'Please upload an image file' })
                              return
                            }
                            handlePartySymbolFileChange(index, file)
                          }
                        }}
                        style={{ marginBottom: '0.5rem' }}
                      />
                      {candidate.partySymbol && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <img 
                            src={candidate.partySymbol} 
                            alt="Party Symbol Preview" 
                            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.25rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleCandidateChange(index, 'partySymbol', '')}
                            className="btn btn-outline"
                            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {candidate.partySymbol && candidate.partySymbolType === 'url' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img 
                        src={candidate.partySymbol} 
                        alt="Party Symbol Preview" 
                        onError={(e) => { e.target.style.display = 'none' }}
                        style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.25rem' }}
                      />
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label>Party Description</label>
                  <textarea
                    value={candidate.partyDescription}
                    onChange={(e) => handleCandidateChange(index, 'partyDescription', e.target.value)}
                    rows={3}
                    placeholder="Party history and description"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Selection Modal */}
        {showTemplateModal && (
          <div style={styles.modalOverlay} onClick={() => setShowTemplateModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2>Select Candidate Template</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="btn btn-outline"
                  style={styles.closeBtn}
                >
                  <X size={18} />
                </button>
              </div>
              
              {templateLoading ? (
                <div className="loading-container" style={{ padding: '2rem' }}>
                  <div className="spinner"></div>
                </div>
              ) : templates.length === 0 ? (
                <div style={styles.emptyTemplates}>
                  <UserCircle size={48} style={styles.emptyIcon} />
                  <p>No templates available. Create templates from the dashboard.</p>
                  <Link to="/admin/candidate-templates" className="btn btn-primary">
                    Go to Templates
                  </Link>
                </div>
              ) : (
                <div style={styles.templatesList}>
                  {templates.map((template) => (
                    <div key={template.id} className="card" style={styles.templateCard}>
                      <div style={styles.templateCardHeader}>
                        <div style={styles.templateCardInfo}>
                          {template.candidatePhoto && (
                            <img 
                              src={template.candidatePhoto} 
                              alt={template.candidateName}
                              style={styles.templateCardPhoto}
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          )}
                          <div>
                            <h4>{template.candidateName}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {template.partySymbol && (
                                <img 
                                  src={template.partySymbol} 
                                  alt="Party symbol"
                                  style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                  onError={(e) => { e.target.style.display = 'none' }}
                                />
                              )}
                              <span style={{ color: 'var(--text-secondary)' }}>{template.partyName}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => applyTemplate(template)}
                          className="btn btn-primary"
                          style={styles.applyBtn}
                        >
                          Apply
                        </button>
                      </div>
                      {template.candidateDescription && (
                        <p style={styles.templateCardDesc}>{template.candidateDescription}</p>
                      )}
                      {(template.state || template.district || template.lokSabhaConstituency || template.vidhanSabhaConstituency) && (
                        <div style={styles.templateCardLocation}>
                          {template.state && <span>State: {template.state}</span>}
                          {template.district && <span>District: {template.district}</span>}
                          {template.lokSabhaConstituency && <span>Lok Sabha: {template.lokSabhaConstituency}</span>}
                          {template.vidhanSabhaConstituency && <span>Vidhan Sabha: {template.vidhanSabhaConstituency}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem'
  },
  modalContent: {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '0.5rem',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-color)'
  },
  closeBtn: {
    padding: '0.5rem'
  },
  templatesList: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  templateCard: {
    padding: '1rem'
  },
  templateCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  templateCardInfo: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flex: 1
  },
  templateCardPhoto: {
    width: '50px',
    height: '50px',
    borderRadius: '0.5rem',
    objectFit: 'cover'
  },
  templateCardDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    marginBottom: '0.5rem'
  },
  templateCardLocation: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    paddingTop: '0.5rem',
    borderTop: '1px solid var(--border-color)'
  },
  applyBtn: {
    padding: '0.5rem 1rem'
  },
  emptyTemplates: {
    textAlign: 'center',
    padding: '3rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },
  emptyIcon: {
    color: 'var(--text-secondary)'
  }
}

