import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Plus, Trash2, Edit2, Save, X, CheckCircle, AlertCircle, Building2, ArrowLeft } from 'lucide-react'
import SearchableSelect from '../../components/SearchableSelect'

export default function AdminPartyTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedPartyTypeFilter, setSelectedPartyTypeFilter] = useState(null)
  const [formData, setFormData] = useState({
    partyName: '',
    partyType: '',
    partySymbol: '',
    partySymbolType: 'url',
    partyHistory: ''
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      setLoading(true)
      const res = await adminAPI.getPartyTemplates()
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
      partyName: '',
      partyType: selectedPartyTypeFilter || '',
      partySymbol: '',
      partySymbolType: 'url',
      partyHistory: ''
    })
    setIsAdding(false)
    setEditingId(null)
  }

  function handlePartyTypeSelect(partyType) {
    setSelectedPartyTypeFilter(partyType)
    setIsAdding(false)
    setEditingId(null)
  }

  function handleBackToSelection() {
    setSelectedPartyTypeFilter(null)
    setIsAdding(false)
    setEditingId(null)
    resetForm()
  }

  // Filter templates based on selected party type
  const filteredTemplates = selectedPartyTypeFilter
    ? templates.filter(t => t.partyType === selectedPartyTypeFilter)
    : []

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.partyName || !formData.partyType) {
      setMessage({ type: 'error', text: 'Party name and party type are required' })
      return
    }

    try {
      setMessage({ type: '', text: '' })
      
      // Prepare data (remove UI-only fields)
      const { partySymbolType, ...submitData } = formData
      
      if (editingId) {
        await adminAPI.updatePartyTemplate(editingId, submitData)
        setMessage({ type: 'success', text: 'Template updated successfully' })
      } else {
        await adminAPI.createPartyTemplate(submitData)
        setMessage({ type: 'success', text: 'Template created successfully' })
      }
      
      resetForm()
      await fetchTemplates()
      // Reset form with the selected filter
      if (selectedPartyTypeFilter) {
        setFormData(prev => ({ ...prev, partyType: selectedPartyTypeFilter }))
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Save template error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save template' })
    }
  }

  function handleEdit(template) {
    setFormData({
      partyName: template.partyName || '',
      partyType: template.partyType || '',
      partySymbol: template.partySymbol || '',
      partySymbolType: template.partySymbol?.startsWith('data:') ? 'file' : 'url',
      partyHistory: template.partyHistory || ''
    })
    setEditingId(template.id)
    setIsAdding(true)
  }

  async function handleDelete(templateId) {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      await adminAPI.deletePartyTemplate(templateId)
      setMessage({ type: 'success', text: 'Template deleted successfully' })
      await fetchTemplates()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Delete template error:', error)
      setMessage({ type: 'error', text: 'Failed to delete template' })
    }
  }

  function handleFileChange(file) {
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
      setFormData(prev => ({ ...prev, partySymbol: reader.result }))
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

  // Show party type selection screen if no filter is selected
  if (!selectedPartyTypeFilter) {
    return (
      <div className="container" style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Party Templates</h1>
            <p style={styles.subtitle}>Select a party type to manage templates</p>
          </div>
        </div>

        <div style={styles.selectionGrid}>
          <button
            onClick={() => handlePartyTypeSelect('National Party')}
            className="card"
            style={styles.partyTypeCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Building2 size={64} style={styles.partyTypeIcon} />
            <h2 style={styles.partyTypeTitle}>National Party</h2>
            <p style={styles.partyTypeDescription}>
              Manage templates for national-level political parties
            </p>
          </button>

          <button
            onClick={() => handlePartyTypeSelect('State Party')}
            className="card"
            style={styles.partyTypeCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Building2 size={64} style={styles.partyTypeIcon} />
            <h2 style={styles.partyTypeTitle}>State Party</h2>
            <p style={styles.partyTypeDescription}>
              Manage templates for state-level political parties
            </p>
          </button>

          <button
            onClick={() => handlePartyTypeSelect('Local Party')}
            className="card"
            style={styles.partyTypeCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Building2 size={64} style={styles.partyTypeIcon} />
            <h2 style={styles.partyTypeTitle}>Local Party</h2>
            <p style={styles.partyTypeDescription}>
              Manage templates for local-level political parties
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
          <h1 style={styles.pageTitle}>{selectedPartyTypeFilter} Templates</h1>
          <p style={styles.subtitle}>Store party information for quick reuse</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, partyType: selectedPartyTypeFilter }))
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
            <div className="input-group">
              <label>Party Name *</label>
              <input
                type="text"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                placeholder="Party name"
                required
              />
            </div>

            <div className="input-group">
              <label>Party Type *</label>
              <SearchableSelect
                value={formData.partyType}
                onChange={(e) => setFormData({ ...formData, partyType: e.target.value })}
                options={['National Party', 'State Party', 'Local Party']}
                placeholder="Select party type..."
                required
                disabled={!!selectedPartyTypeFilter && !editingId}
              />
              {selectedPartyTypeFilter && !editingId && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Party type is set to {selectedPartyTypeFilter} based on your selection
                </p>
              )}
            </div>

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
                      if (file) handleFileChange(file)
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
              {formData.partySymbol && formData.partySymbolType === 'url' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img 
                    src={formData.partySymbol} 
                    alt="Symbol Preview" 
                    onError={(e) => { e.target.style.display = 'none' }}
                    style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.25rem' }}
                  />
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Party History</label>
              <textarea
                value={formData.partyHistory}
                onChange={(e) => setFormData({ ...formData, partyHistory: e.target.value })}
                rows={4}
                placeholder="Enter party history, ideology, or background information"
              />
            </div>

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
                {template.partySymbol && (
                  <img 
                    src={template.partySymbol} 
                    alt="Party symbol"
                    style={styles.partySymbol}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <div>
                  <h3 style={styles.templateName}>{template.partyName}</h3>
                  {template.partyType && (
                    <div style={styles.templatePartyType}>
                      <span style={styles.partyTypeBadge}>{template.partyType}</span>
                    </div>
                  )}
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

            {template.partyHistory && (
              <p style={styles.templateHistory}>{template.partyHistory}</p>
            )}
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && !isAdding && (
        <div className="card" style={styles.emptyState}>
          <Building2 size={48} style={styles.emptyIcon} />
          <h3>No Templates</h3>
          <p>Create your first {selectedPartyTypeFilter.toLowerCase()} template to get started.</p>
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, partyType: selectedPartyTypeFilter }))
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
  partyTypeCard: {
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
  partyTypeIcon: {
    color: 'var(--primary-color)',
    marginBottom: '0.5rem'
  },
  partyTypeTitle: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)'
  },
  partyTypeDescription: {
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
    flex: 1,
    alignItems: 'center'
  },
  partySymbol: {
    width: '60px',
    height: '60px',
    borderRadius: '0.5rem',
    objectFit: 'contain',
    border: '1px solid var(--border-color)',
    padding: '0.5rem'
  },
  templateName: {
    fontSize: '1.25rem',
    marginBottom: '0.25rem'
  },
  templatePartyType: {
    marginBottom: '0.5rem'
  },
  partyTypeBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'var(--secondary-color)',
    color: 'white',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  templateActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  actionBtn: {
    padding: '0.5rem'
  },
  templateHistory: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    marginTop: 'auto'
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

