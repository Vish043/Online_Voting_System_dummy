import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { Plus, Calendar, TrendingUp, CheckCircle } from 'lucide-react'

export default function AdminElections() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchElections()
  }, [])

  async function fetchElections() {
    try {
      setLoading(true)
      const res = await adminAPI.getAllElections()
      setElections(res.data.elections)
    } catch (error) {
      console.error('Fetch elections error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(electionId, newStatus) {
    try {
      await adminAPI.updateElectionStatus(electionId, newStatus)
      setMessage({ type: 'success', text: 'Election status updated successfully' })
      await fetchElections()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Update status error:', error)
      setMessage({ type: 'error', text: 'Failed to update election status' })
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Election Management</h1>
          <p style={styles.subtitle}>Create and manage elections</p>
        </div>
        <Link to="/admin/elections/create" className="btn btn-primary">
          <Plus size={18} />
          Create Election
        </Link>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <TrendingUp size={20} />}
          {message.text}
        </div>
      )}

      {/* Elections Grid */}
      {elections.length === 0 ? (
        <div className="card" style={styles.emptyState}>
          <Calendar size={48} style={styles.emptyIcon} />
          <h3>No Elections</h3>
          <p>Create your first election to get started.</p>
          <Link to="/admin/elections/create" className="btn btn-primary" style={styles.createBtn}>
            <Plus size={18} />
            Create Election
          </Link>
        </div>
      ) : (
        <div className="grid grid-2">
          {elections.map((election) => (
            <ElectionCard 
              key={election.id} 
              election={election}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ElectionCard({ election, onStatusChange }) {
  const startDate = election.startDate?.toDate ? 
    new Date(election.startDate.toDate()) : 
    new Date(election.startDate)
  const endDate = election.endDate?.toDate ? 
    new Date(election.endDate.toDate()) : 
    new Date(election.endDate)

  const statusOptions = ['scheduled', 'active', 'completed', 'cancelled']

  return (
    <div className="card" style={styles.electionCard}>
      <div style={styles.cardHeader}>
        <span className={`badge badge-${getStatusColor(election.status)}`}>
          {election.status}
        </span>
        <span style={styles.type}>{election.type}</span>
      </div>

      <h3 style={styles.title}>{election.title}</h3>
      <p style={styles.description}>{election.description}</p>

      <div style={styles.dates}>
        <div style={styles.date}>
          <Calendar size={16} />
          <span>Start: {startDate.toLocaleDateString()}</span>
        </div>
        <div style={styles.date}>
          <Calendar size={16} />
          <span>End: {endDate.toLocaleDateString()}</span>
        </div>
      </div>

      <div style={styles.footer}>
        <select
          value={election.status}
          onChange={(e) => onStatusChange(election.id, e.target.value)}
          style={styles.select}
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
        <Link 
          to={`/elections/${election.id}`}
          className="btn btn-outline"
          style={styles.viewBtn}
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

function getStatusColor(status) {
  const colorMap = {
    scheduled: 'info',
    active: 'success',
    completed: 'info',
    cancelled: 'danger'
  }
  return colorMap[status] || 'info'
}

const styles = {
  container: {
    padding: '2rem 1rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  pageTitle: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  subtitle: {
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
  createBtn: {
    marginTop: '1rem'
  },
  electionCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  type: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    textTransform: 'capitalize'
  },
  title: {
    fontSize: '1.25rem',
    marginBottom: '0.75rem'
  },
  description: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    flex: 1
  },
  dates: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem',
    fontSize: '0.875rem'
  },
  date: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)'
  },
  footer: {
    display: 'flex',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-color)'
  },
  select: {
    flex: 1,
    padding: '0.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    cursor: 'pointer'
  },
  viewBtn: {
    fontSize: '0.875rem',
    padding: '0.5rem 1rem'
  }
}

