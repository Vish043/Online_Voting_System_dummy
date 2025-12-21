import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Plus, Trash2, Edit2, Save, X, CheckCircle, AlertCircle, User, Building2, MapPin, ArrowLeft } from 'lucide-react'
import { INDIAN_STATES_AND_UTS } from '../../constants/indianStates'
import { getDistrictsByState, getConstituenciesByDistrict, hasVidhanSabhaData, getConstituenciesByState } from '../../constants/constituencies'
import SearchableSelect from '../../components/SearchableSelect'

export default function AdminCandidateTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedElectionTypeFilter, setSelectedElectionTypeFilter] = useState(null)
  const [formData, setFormData] = useState({
    candidateName: '',
    partyName: '',
    partySymbol: '',
    partySymbolType: 'url',
    candidateDescription: '',
    candidatePhoto: '',
    photoType: 'url',
    electionType: '',
    state: '',
    lokSabhaConstituency: '',
    vidhanSabhaConstituency: '',
    district: ''
  })
  const [availableDistricts, setAvailableDistricts] = useState([])
  const [availableConstituencies, setAvailableConstituencies] = useState([])
  const [availableLokSabhaConstituencies, setAvailableLokSabhaConstituencies] = useState([])
  const [partyTemplates, setPartyTemplates] = useState([])

  useEffect(() => {
    fetchTemplates()
    fetchPartyTemplates()
  }, [])

  async function fetchPartyTemplates() {
    try {
      const res = await adminAPI.getPartyTemplates()
      setPartyTemplates(res.data.templates || [])
    } catch (error) {
      console.error('Fetch party templates error:', error)
    }
  }

  // Update Lok Sabha constituencies when state changes
  useEffect(() => {
    if (formData.state) {
      const lokSabhaConstituencies = getConstituenciesByState(formData.state)
      setAvailableLokSabhaConstituencies(lokSabhaConstituencies)
    } else {
      setAvailableLokSabhaConstituencies([])
    }
  }, [formData.state])

  // Update districts and constituencies when state or district changes
  useEffect(() => {
    if (formData.state && hasVidhanSabhaData(formData.state)) {
      const districts = getDistrictsByState(formData.state)
      setAvailableDistricts(districts)
    } else {
      setAvailableDistricts([])
    }
  }, [formData.state])

  useEffect(() => {
    if (formData.state && formData.district && hasVidhanSabhaData(formData.state)) {
      const constituencies = getConstituenciesByDistrict(formData.state, formData.district)
      setAvailableConstituencies(constituencies)
    } else {
      setAvailableConstituencies([])
    }
  }, [formData.state, formData.district])

  async function fetchTemplates() {
    try {
      setLoading(true)
      const res = await adminAPI.getCandidateTemplates()
      setTemplates(res.data.templates || [])
    } catch (error) {
      console.error('Fetch templates error:', error)
      setMessage({ type: 'error', text: 'Failed to load templates' })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      candidateName: '',
      partyName: '',
      partySymbol: '',
      partySymbolType: 'url',
      candidateDescription: '',
      candidatePhoto: '',
      photoType: 'url',
      electionType: selectedElectionTypeFilter || '',
      state: '',
      lokSabhaConstituency: '',
      vidhanSabhaConstituency: '',
      district: ''
    })
    setIsAdding(false)
    setEditingId(null)
  }

  function handleElectionTypeSelect(electionType) {
    setSelectedElectionTypeFilter(electionType)
    setIsAdding(false)
    setEditingId(null)
  }

  function handleBackToSelection() {
    setSelectedElectionTypeFilter(null)
    setIsAdding(false)
    setEditingId(null)
    resetForm()
  }

  // Filter templates based on selected election type
  const filteredTemplates = selectedElectionTypeFilter
    ? templates.filter(t => t.electionType === selectedElectionTypeFilter)
    : []

  // Filter party templates based on election type
  // Mapping: Lok Sabha → National Party, Vidhan Sabha → State Party, Zilla Parishad → Local Party
  const getFilteredPartyTemplates = () => {
    // If no election type is selected, show all party templates
    if (!selectedElectionTypeFilter && !formData.electionType) {
      return partyTemplates
    }
    
    // Get the current election type (from filter or form data)
    const electionType = selectedElectionTypeFilter || formData.electionType
    let partyTypeFilter
    
    // Map election type to party type
    if (electionType === 'Lok Sabha') {
      partyTypeFilter = 'National Party'
    } else if (electionType === 'Vidhan Sabha') {
      partyTypeFilter = 'State Party'
    } else if (electionType === 'Zilla Parishad') {
      partyTypeFilter = 'Local Party'
    } else {
      // Unknown election type, return all
      return partyTemplates
    }
    
    // Filter party templates to only show matching party type
    return partyTemplates.filter(t => t.partyType === partyTypeFilter)
  }

  // Compute filtered party templates (updates when election type or party templates change)
  const filteredPartyTemplates = getFilteredPartyTemplates()

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.candidateName || !formData.partyName || !formData.electionType) {
      setMessage({ type: 'error', text: 'Candidate name, party name, and election type are required' })
      return
    }

    // Validate location fields based on election type
    if (!formData.state) {
      setMessage({ type: 'error', text: 'State is required' })
      return
    }

    if (formData.electionType === 'Lok Sabha' && !formData.lokSabhaConstituency) {
      setMessage({ type: 'error', text: 'Lok Sabha constituency is required' })
      return
    }

    if (formData.electionType === 'Vidhan Sabha' && (!formData.district || !formData.vidhanSabhaConstituency)) {
      setMessage({ type: 'error', text: 'District and Vidhan Sabha constituency are required for Vidhan Sabha elections' })
      return
    }

    if (formData.electionType === 'Zilla Parishad' && !formData.district) {
      setMessage({ type: 'error', text: 'District is required for Zilla Parishad elections' })
      return
    }

    try {
      setMessage({ type: '', text: '' })
      
      // Prepare data (remove UI-only fields)
      const { partySymbolType, photoType, ...submitData } = formData
      
      if (editingId) {
        await adminAPI.updateCandidateTemplate(editingId, submitData)
        setMessage({ type: 'success', text: 'Template updated successfully' })
      } else {
        await adminAPI.createCandidateTemplate(submitData)
        setMessage({ type: 'success', text: 'Template created successfully' })
      }
      
      resetForm()
      await fetchTemplates()
      // Reset form with the selected filter
      if (selectedElectionTypeFilter) {
        setFormData(prev => ({ ...prev, electionType: selectedElectionTypeFilter }))
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Save template error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save template' })
    }
  }

  function handleEdit(template) {
    setFormData({
      candidateName: template.candidateName || '',
      partyName: template.partyName || '',
      partySymbol: template.partySymbol || '',
      partySymbolType: template.partySymbol?.startsWith('data:') ? 'file' : 'url',
      candidateDescription: template.candidateDescription || '',
      candidatePhoto: template.candidatePhoto || '',
      photoType: template.candidatePhoto?.startsWith('data:') ? 'file' : 'url',
      electionType: template.electionType || '',
      state: template.state || '',
      lokSabhaConstituency: template.lokSabhaConstituency || '',
      vidhanSabhaConstituency: template.vidhanSabhaConstituency || '',
      district: template.district || ''
    })
    setEditingId(template.id)
    setIsAdding(true)
  }

  async function handleDelete(templateId) {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      await adminAPI.deleteCandidateTemplate(templateId)
      setMessage({ type: 'success', text: 'Template deleted successfully' })
      await fetchTemplates()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Delete template error:', error)
      setMessage({ type: 'error', text: 'Failed to delete template' })
    }
  }

  function handleFileChange(field, file, type) {
    if (!file) return
    
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
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result }))
    }
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Failed to read file' })
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  // Show election type selection screen if no filter is selected
  if (!selectedElectionTypeFilter) {
    return (
      <div className="container" style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Candidate Templates</h1>
            <p style={styles.subtitle}>Select an election type to manage templates</p>
          </div>
        </div>

        <div style={styles.selectionGrid}>
          <button
            onClick={() => handleElectionTypeSelect('Lok Sabha')}
            className="card"
            style={styles.electionTypeCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <User size={64} style={styles.electionTypeIcon} />
            <h2 style={styles.electionTypeTitle}>Lok Sabha</h2>
            <p style={styles.electionTypeDescription}>
              Manage candidate templates for Lok Sabha (National) elections
            </p>
          </button>

          <button
            onClick={() => handleElectionTypeSelect('Vidhan Sabha')}
            className="card"
            style={styles.electionTypeCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <User size={64} style={styles.electionTypeIcon} />
            <h2 style={styles.electionTypeTitle}>Vidhan Sabha</h2>
            <p style={styles.electionTypeDescription}>
              Manage candidate templates for Vidhan Sabha (State) elections
            </p>
          </button>

          <button
            onClick={() => handleElectionTypeSelect('Zilla Parishad')}
            className="card"
            style={styles.electionTypeCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <User size={64} style={styles.electionTypeIcon} />
            <h2 style={styles.electionTypeTitle}>Zilla Parishad</h2>
            <p style={styles.electionTypeDescription}>
              Manage candidate templates for Zilla Parishad (Local) elections
            </p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={styles.container}>
      <div style={styles.header}>
        <div>
          <button
            onClick={handleBackToSelection}
            className="btn btn-outline"
            style={styles.backButton}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 style={styles.pageTitle}>{selectedElectionTypeFilter} Candidate Templates</h1>
          <p style={styles.subtitle}>Store candidate details for quick reuse in elections</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, electionType: selectedElectionTypeFilter }))
              setIsAdding(true)
            }}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Add Template
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="card" style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2>{editingId ? 'Edit Template' : 'Add New Template'}</h2>
            <button
              onClick={resetForm}
              className="btn btn-outline"
              style={styles.closeBtn}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.row}>
              <div className="input-group">
                <label>Candidate Name *</label>
                <input
                  type="text"
                  value={formData.candidateName}
                  onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                  placeholder="Name"
                  required
                />
              </div>
            <div className="input-group">
              <label>Party Name *</label>
              <SearchableSelect
                name="partyName"
                value={formData.partyName}
                onChange={(e) => {
                  const partyName = e.target.value
                  // Check if the entered value matches a party template
                  const selectedTemplate = filteredPartyTemplates.find(t => t.partyName === partyName)
                  if (selectedTemplate) {
                    // If it's from a template, populate party name and symbol
                    setFormData({
                      ...formData,
                      partyName: selectedTemplate.partyName || '',
                      partySymbol: selectedTemplate.partySymbol || '',
                      partySymbolType: selectedTemplate.partySymbol?.startsWith('data:') ? 'file' : 'url'
                    })
                  } else {
                    // If it's a custom value, just set the party name (clear symbol if it was from a template)
                    setFormData({ 
                      ...formData, 
                      partyName,
                      // Only clear symbol if current symbol was from a template
                      partySymbol: filteredPartyTemplates.some(t => t.partySymbol === formData.partySymbol) ? '' : formData.partySymbol
                    })
                  }
                }}
                options={filteredPartyTemplates.map(t => t.partyName)}
                placeholder="Type party name"
                allowCustom={true}
                required
              />
              {filteredPartyTemplates.length === 0 && (selectedElectionTypeFilter || formData.electionType) && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {selectedElectionTypeFilter === 'Lok Sabha' || formData.electionType === 'Lok Sabha'
                    ? 'No National Party templates available. You can type a custom party name.'
                    : selectedElectionTypeFilter === 'Vidhan Sabha' || formData.electionType === 'Vidhan Sabha'
                    ? 'No State Party templates available. You can type a custom party name.'
                    : 'No Local Party templates available. You can type a custom party name.'}
                </p>
              )}
              {filteredPartyTemplates.length > 0 && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Select from templates to auto-fill party symbol, or type a custom party name.
                </p>
              )}
            </div>
            </div>

            <div className="input-group">
              <label>Candidate Description</label>
              <textarea
                value={formData.candidateDescription}
                onChange={(e) => setFormData({ ...formData, candidateDescription: e.target.value })}
                rows={2}
                placeholder="Brief biography or campaign message"
              />
            </div>

            {/* Candidate Photo */}
            <div className="input-group">
              <label>Candidate Photo</label>
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="photoType"
                      value="url"
                      checked={formData.photoType === 'url'}
                      onChange={(e) => setFormData({ ...formData, photoType: 'url', candidatePhoto: '' })}
                    />
                    <span>URL</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="photoType"
                      value="file"
                      checked={formData.photoType === 'file'}
                      onChange={(e) => setFormData({ ...formData, photoType: 'file', candidatePhoto: '' })}
                    />
                    <span>Upload File</span>
                  </label>
                </div>
              </div>
              {formData.photoType === 'url' ? (
                <input
                  type="url"
                  value={formData.candidatePhoto}
                  onChange={(e) => setFormData({ ...formData, candidatePhoto: e.target.value })}
                  placeholder="https://example.com/candidate-photo.jpg"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileChange('candidatePhoto', file, 'photo')
                    }}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  {formData.candidatePhoto && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img 
                        src={formData.candidatePhoto} 
                        alt="Photo Preview" 
                        style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.25rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, candidatePhoto: '' })}
                        className="btn btn-outline"
                        style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Party Symbol */}
            <div className="input-group">
              <label>Party Symbol</label>
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="partySymbolType"
                      value="url"
                      checked={formData.partySymbolType === 'url'}
                      onChange={(e) => setFormData({ ...formData, partySymbolType: 'url', partySymbol: '' })}
                    />
                    <span>URL</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="partySymbolType"
                      value="file"
                      checked={formData.partySymbolType === 'file'}
                      onChange={(e) => setFormData({ ...formData, partySymbolType: 'file', partySymbol: '' })}
                    />
                    <span>Upload File</span>
                  </label>
                </div>
              </div>
              {formData.partySymbolType === 'url' ? (
                <input
                  type="url"
                  value={formData.partySymbol}
                  onChange={(e) => setFormData({ ...formData, partySymbol: e.target.value })}
                  placeholder="https://example.com/party-symbol.png"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileChange('partySymbol', file, 'symbol')
                    }}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  {formData.partySymbol && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img 
                        src={formData.partySymbol} 
                        alt="Symbol Preview" 
                        style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.25rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, partySymbol: '' })}
                        className="btn btn-outline"
                        style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location Information */}
            <div style={styles.sectionDivider}>
              <h3 style={styles.sectionTitle}>Location Information</h3>
            </div>

            <div className="input-group">
              <label>Election Type *</label>
              <SearchableSelect
                value={formData.electionType}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    electionType: e.target.value,
                    state: '',
                    district: '',
                    lokSabhaConstituency: '',
                    vidhanSabhaConstituency: ''
                  })
                }}
                options={['Lok Sabha', 'Vidhan Sabha', 'Zilla Parishad']}
                placeholder="Select election type..."
                required
                disabled={!!selectedElectionTypeFilter && !editingId}
              />
              {selectedElectionTypeFilter && !editingId && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Election type is set to {selectedElectionTypeFilter} based on your selection
                </p>
              )}
            </div>

            {formData.electionType && (
              <>
                <div className="input-group">
                  <label>State / Union Territory *</label>
                  <SearchableSelect
                    value={formData.state}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        state: e.target.value,
                        district: '',
                        lokSabhaConstituency: '',
                        vidhanSabhaConstituency: ''
                      })
                    }}
                    options={INDIAN_STATES_AND_UTS.map((state) => 
                      `${state.name}${state.type === 'ut' ? ' (UT)' : ''} - ${state.seats} Lok Sabha seats`
                    )}
                    getOptionValue={(option) => {
                      const match = option.match(/^([^(]+?)(?:\s*\(UT\))?\s*-/)
                      return match ? match[1].trim() : option
                    }}
                    placeholder="Select state or union territory..."
                    required
                  />
                </div>

                {/* Lok Sabha - Show only Lok Sabha Constituency */}
                {formData.electionType === 'Lok Sabha' && formData.state && (
                  <div className="input-group">
                    <label>Lok Sabha Constituency *</label>
                    {availableLokSabhaConstituencies.length > 0 ? (
                      <SearchableSelect
                        value={formData.lokSabhaConstituency}
                        onChange={(e) => setFormData({ ...formData, lokSabhaConstituency: e.target.value })}
                        options={availableLokSabhaConstituencies}
                        placeholder="Select Lok Sabha constituency..."
                        required
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.lokSabhaConstituency}
                        onChange={(e) => setFormData({ ...formData, lokSabhaConstituency: e.target.value })}
                        placeholder="Enter Lok Sabha constituency"
                        required
                      />
                    )}
                  </div>
                )}

                {/* Vidhan Sabha - Show District and Vidhan Sabha Constituency */}
                {formData.electionType === 'Vidhan Sabha' && formData.state && (
                  <>
                    <div className="input-group">
                      <label>District *</label>
                      {hasVidhanSabhaData(formData.state) && availableDistricts.length > 0 ? (
                        <SearchableSelect
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value, vidhanSabhaConstituency: '' })}
                          options={availableDistricts}
                          placeholder="Select district..."
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          placeholder="Enter district name"
                          required
                        />
                      )}
                    </div>

                    {formData.state && formData.district && hasVidhanSabhaData(formData.state) && availableConstituencies.length > 0 && (
                      <div className="input-group">
                        <label>Vidhan Sabha Constituency *</label>
                        <SearchableSelect
                          value={formData.vidhanSabhaConstituency}
                          onChange={(e) => setFormData({ ...formData, vidhanSabhaConstituency: e.target.value })}
                          options={availableConstituencies}
                          placeholder="Select Vidhan Sabha constituency..."
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Zilla Parishad - Show only District */}
                {formData.electionType === 'Zilla Parishad' && formData.state && (
                  <div className="input-group">
                    <label>District *</label>
                    {hasVidhanSabhaData(formData.state) && availableDistricts.length > 0 ? (
                      <SearchableSelect
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        options={availableDistricts}
                        placeholder="Select district..."
                        required
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        placeholder="Enter district name"
                        required
                      />
                    )}
                  </div>
                )}
              </>
            )}

            <div style={styles.formActions}>
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                {editingId ? 'Update Template' : 'Create Template'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="grid grid-2" style={styles.templatesGrid}>
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card" style={styles.templateCard}>
            <div style={styles.templateHeader}>
              <div style={styles.templateInfo}>
                {template.candidatePhoto && (
                  <img 
                    src={template.candidatePhoto} 
                    alt={template.candidateName}
                    style={styles.templatePhoto}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <div>
                  <h3 style={styles.templateName}>{template.candidateName}</h3>
                  {template.electionType && (
                    <div style={styles.templateElectionType}>
                      <span style={styles.electionTypeBadge}>{template.electionType}</span>
                    </div>
                  )}
                  <div style={styles.templateParty}>
                    {template.partySymbol && (
                      <img 
                        src={template.partySymbol} 
                        alt="Party symbol"
                        style={styles.partySymbol}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
                    <span>{template.partyName}</span>
                  </div>
                </div>
              </div>
              <div style={styles.templateActions}>
                <button
                  onClick={() => handleEdit(template)}
                  className="btn btn-outline"
                  style={styles.actionBtn}
                  title="Edit template"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="btn btn-danger"
                  style={styles.actionBtn}
                  title="Delete template"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {template.candidateDescription && (
              <p style={styles.templateDescription}>{template.candidateDescription}</p>
            )}

            <div style={styles.templateLocation}>
              {template.state && (
                <div style={styles.locationItem}>
                  <MapPin size={14} />
                  <span><strong>State:</strong> {template.state}</span>
                </div>
              )}
              {template.electionType === 'Lok Sabha' && template.lokSabhaConstituency && (
                <div style={styles.locationItem}>
                  <MapPin size={14} />
                  <span><strong>Lok Sabha:</strong> {template.lokSabhaConstituency}</span>
                </div>
              )}
              {(template.electionType === 'Vidhan Sabha' || template.electionType === 'Zilla Parishad') && template.district && (
                <div style={styles.locationItem}>
                  <MapPin size={14} />
                  <span><strong>District:</strong> {template.district}</span>
                </div>
              )}
              {template.electionType === 'Vidhan Sabha' && template.vidhanSabhaConstituency && (
                <div style={styles.locationItem}>
                  <MapPin size={14} />
                  <span><strong>Vidhan Sabha:</strong> {template.vidhanSabhaConstituency}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && !isAdding && (
        <div className="card" style={styles.emptyState}>
          <User size={48} style={styles.emptyIcon} />
          <h3>No Templates</h3>
          <p>Create your first {selectedElectionTypeFilter.toLowerCase()} candidate template to get started.</p>
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, electionType: selectedElectionTypeFilter }))
              setIsAdding(true)
            }}
            className="btn btn-primary"
            style={styles.addBtn}
          >
            <Plus size={18} />
            Add Template
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem 1rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  backButton: {
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  pageTitle: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: 'var(--text-secondary)'
  },
  selectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    marginTop: '2rem'
  },
  electionTypeCard: {
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '2px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },
  electionTypeIcon: {
    color: 'var(--primary-color)',
    marginBottom: '0.5rem'
  },
  electionTypeTitle: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)'
  },
  electionTypeDescription: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    lineHeight: '1.6'
  },
  formCard: {
    marginBottom: '2rem'
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  closeBtn: {
    padding: '0.5rem'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  sectionDivider: {
    marginTop: '1.5rem',
    marginBottom: '1rem',
    paddingTop: '1.5rem',
    borderTop: '2px solid var(--border-color)'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)'
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem'
  },
  templatesGrid: {
    marginTop: '2rem'
  },
  templateCard: {
    display: 'flex',
    flexDirection: 'column'
  },
  templateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  templateInfo: {
    display: 'flex',
    gap: '1rem',
    flex: 1
  },
  templatePhoto: {
    width: '60px',
    height: '60px',
    borderRadius: '0.5rem',
    objectFit: 'cover'
  },
  templateName: {
    fontSize: '1.25rem',
    marginBottom: '0.25rem'
  },
  templateElectionType: {
    marginBottom: '0.5rem'
  },
  electionTypeBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  templateParty: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)'
  },
  partySymbol: {
    width: '24px',
    height: '24px',
    objectFit: 'contain'
  },
  templateActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  actionBtn: {
    padding: '0.5rem'
  },
  templateDescription: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    fontSize: '0.875rem'
  },
  templateLocation: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-color)'
  },
  locationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem'
  },
  emptyIcon: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem'
  },
  addBtn: {
    marginTop: '1rem'
  }
}

