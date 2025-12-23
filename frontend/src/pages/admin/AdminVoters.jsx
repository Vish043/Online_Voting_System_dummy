import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { Search, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft, CheckSquare, Square } from 'lucide-react'

// Helper function to convert Firestore Timestamp to Date
function convertTimestampToDate(timestamp) {
  if (!timestamp) return null;
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it has toDate method (Firestore Timestamp object)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a serialized Firestore Timestamp (from JSON)
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  
  // Try to parse as Date string
  return new Date(timestamp);
}

export default function AdminVoters() {
  const [voters, setVoters] = useState([])
  const [filter, setFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedVoters, setSelectedVoters] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    fetchVoters()
  }, [filter])

  async function fetchVoters() {
    try {
      setLoading(true)
      const res = await adminAPI.getVoters(filter)
      setVoters(res.data.voters)
    } catch (error) {
      console.error('Fetch voters error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(voterId, isVerified, isEligible) {
    try {
      await adminAPI.verifyVoter(voterId, { isVerified, isEligible })
      setMessage({ 
        type: 'success', 
        text: `Voter ${isVerified ? 'verified' : 'rejected'} successfully` 
      })
      await fetchVoters()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Verify voter error:', error)
      setMessage({ type: 'error', text: 'Failed to update voter status' })
    }
  }

  function handleSelectVoter(voterId) {
    const newSelected = new Set(selectedVoters)
    if (newSelected.has(voterId)) {
      newSelected.delete(voterId)
    } else {
      newSelected.add(voterId)
    }
    setSelectedVoters(newSelected)
  }

  function handleSelectAll() {
    const pendingVoters = filteredVoters.filter(v => !v.isVerified)
    if (selectedVoters.size === pendingVoters.length) {
      setSelectedVoters(new Set())
    } else {
      setSelectedVoters(new Set(pendingVoters.map(v => v.id)))
    }
  }

  async function handleBulkVerify(isVerified, isEligible) {
    if (selectedVoters.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one voter' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return
    }

    try {
      setBulkLoading(true)
      const voterIds = Array.from(selectedVoters)
      await adminAPI.bulkVerifyVoters(voterIds, { isVerified, isEligible })
      setMessage({ 
        type: 'success', 
        text: `Successfully ${isVerified ? 'approved' : 'rejected'} ${voterIds.length} voter(s)` 
      })
      setSelectedVoters(new Set())
      await fetchVoters()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Bulk verify error:', error)
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update voters' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } finally {
      setBulkLoading(false)
    }
  }

  const filteredVoters = voters.filter(voter => {
    const searchLower = searchTerm.toLowerCase()
    return (
      voter.firstName?.toLowerCase().includes(searchLower) ||
      voter.lastName?.toLowerCase().includes(searchLower) ||
      voter.email?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="container" style={styles.container}>
      <button onClick={() => navigate('/admin')} className="btn btn-outline" style={styles.backBtn}>
        <ArrowLeft size={18} />
        Back to Admin Dashboard
      </button>
      <h1 style={styles.pageTitle}>Voter Management</h1>
      <p style={styles.subtitle}>Verify voter identities and manage eligibility</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Filters and Search */}
      <div className="card" style={styles.controls}>
        <div style={styles.filters}>
          <button
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setFilter('pending')
              setSelectedVoters(new Set())
            }}
          >
            <Clock size={18} />
            Pending
          </button>
          <button
            className={`btn ${filter === 'verified' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setFilter('verified')
              setSelectedVoters(new Set())
            }}
          >
            <CheckCircle size={18} />
            Verified
          </button>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setFilter('all')
              setSelectedVoters(new Set())
            }}
          >
            All Voters
          </button>
        </div>

        <div style={styles.searchBox}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search voters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {filter === 'pending' && filteredVoters.filter(v => !v.isVerified).length > 0 && (
        <div className="card" style={styles.bulkActions}>
          <div style={styles.bulkActionsLeft}>
            <button
              className="btn btn-outline"
              onClick={handleSelectAll}
              style={styles.selectAllBtn}
            >
              {selectedVoters.size === filteredVoters.filter(v => !v.isVerified).length ? (
                <>
                  <CheckSquare size={18} />
                  Deselect All
                </>
              ) : (
                <>
                  <Square size={18} />
                  Select All
                </>
              )}
            </button>
            <span style={styles.selectedCount}>
              {selectedVoters.size > 0 ? `${selectedVoters.size} selected` : 'No voters selected'}
            </span>
          </div>
          {selectedVoters.size > 0 && (
            <div style={styles.bulkActionsRight}>
              <button
                className="btn btn-secondary"
                onClick={() => handleBulkVerify(true, true)}
                disabled={bulkLoading}
                style={styles.bulkBtn}
              >
                <CheckCircle size={18} />
                Approve Selected ({selectedVoters.size})
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleBulkVerify(false, false)}
                disabled={bulkLoading}
                style={styles.bulkBtn}
              >
                <XCircle size={18} />
                Reject Selected ({selectedVoters.size})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Voters Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : filteredVoters.length === 0 ? (
        <div className="card" style={styles.emptyState}>
          <AlertCircle size={48} style={styles.emptyIcon} />
          <h3>No voters found</h3>
          <p>There are no voters matching your criteria.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {filter === 'pending' && (
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedVoters.size === filteredVoters.filter(v => !v.isVerified).length && filteredVoters.filter(v => !v.isVerified).length > 0}
                        onChange={handleSelectAll}
                        style={styles.checkbox}
                      />
                    </th>
                  )}
                  <th>Name</th>
                  <th>Email</th>
                  <th>Date of Birth</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVoters.map((voter) => (
                  <tr key={voter.id} style={selectedVoters.has(voter.id) ? styles.selectedRow : {}}>
                    {filter === 'pending' && (
                      <td>
                        {!voter.isVerified ? (
                          <input
                            type="checkbox"
                            checked={selectedVoters.has(voter.id)}
                            onChange={() => handleSelectVoter(voter.id)}
                            style={styles.checkbox}
                          />
                        ) : null}
                      </td>
                    )}
                    <td>
                      <strong>{voter.firstName} {voter.lastName}</strong>
                    </td>
                    <td>{voter.email}</td>
                    <td>{voter.dateOfBirth}</td>
                    <td>
                      {voter.registeredAt ? 
                        convertTimestampToDate(voter.registeredAt)?.toLocaleDateString() || 'N/A' : 
                        'N/A'}
                    </td>
                    <td>
                      {voter.isVerified ? (
                        <span className="badge badge-success">Verified</span>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </td>
                    <td>
                      {!voter.isVerified && (
                        <div style={styles.actions}>
                          <button
                            className="btn btn-secondary"
                            style={styles.actionBtn}
                            onClick={() => handleVerify(voter.id, true, true)}
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={styles.actionBtn}
                            onClick={() => handleVerify(voter.id, false, false)}
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      )}
                      {voter.isVerified && voter.isEligible && (
                        <span style={styles.approvedText}>✓ Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem 1rem',
    position: 'relative'
  },
  backBtn: {
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
    color: 'var(--text-secondary)',
    marginBottom: '2rem'
  },
  controls: {
    marginBottom: '2rem'
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap'
  },
  searchBox: {
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-secondary)'
  },
  searchInput: {
    width: '100%',
    padding: '0.625rem 1rem 0.625rem 3rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontSize: '0.875rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem'
  },
  emptyIcon: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem'
  },
  actionBtn: {
    fontSize: '0.75rem',
    padding: '0.375rem 0.75rem'
  },
  approvedText: {
    color: 'var(--secondary-color)',
    fontWeight: 600
  },
  bulkActions: {
    marginBottom: '1rem',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  bulkActionsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  bulkActionsRight: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  selectAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  selectedCount: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem'
  },
  bulkBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  selectedRow: {
    backgroundColor: 'var(--bg-secondary)'
  }
}

