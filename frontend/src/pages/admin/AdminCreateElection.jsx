import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function AdminCreateElection() {
  const navigate = useNavigate()
  const [electionData, setElectionData] = useState({
    title: '',
    description: '',
    type: 'general',
    startDate: '',
    endDate: ''
  })
  const [candidates, setCandidates] = useState([
    { name: '', party: '', biography: '', photoURL: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  function handleElectionChange(e) {
    setElectionData({
      ...electionData,
      [e.target.name]: e.target.value
    })
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
    if (!electionData.title || !electionData.startDate || !electionData.endDate) {
      setMessage({ type: 'error', text: 'Please fill in all required election fields' })
      return
    }

    if (new Date(electionData.startDate) >= new Date(electionData.endDate)) {
      setMessage({ type: 'error', text: 'End date must be after start date' })
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

      // Create election
      const electionRes = await adminAPI.createElection(electionData)
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

          <div style={styles.row}>
            <div className="input-group">
              <label htmlFor="type">Election Type *</label>
              <select
                id="type"
                name="type"
                value={electionData.type}
                onChange={handleElectionChange}
                required
              >
                <option value="general">General</option>
                <option value="presidential">Presidential</option>
                <option value="parliamentary">Parliamentary</option>
                <option value="local">Local</option>
                <option value="referendum">Referendum</option>
              </select>
            </div>

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
  }
}

