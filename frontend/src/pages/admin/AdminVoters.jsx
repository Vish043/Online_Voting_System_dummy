import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Search, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

export default function AdminVoters() {
  const [voters, setVoters] = useState([])
  const [filter, setFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

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
            onClick={() => setFilter('pending')}
          >
            <Clock size={18} />
            Pending
          </button>
          <button
            className={`btn ${filter === 'verified' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('verified')}
          >
            <CheckCircle size={18} />
            Verified
          </button>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
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
                  <tr key={voter.id}>
                    <td>
                      <strong>{voter.firstName} {voter.lastName}</strong>
                    </td>
                    <td>{voter.email}</td>
                    <td>{voter.dateOfBirth}</td>
                    <td>
                      {voter.registeredAt ? 
                        new Date(voter.registeredAt.toDate()).toLocaleDateString() : 
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
    padding: '2rem 1rem'
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
  }
}

