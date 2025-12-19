import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { FileText, Filter, AlertCircle } from 'lucide-react'

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

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('')
  const [limit, setLimit] = useState(100)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
  }, [filter, limit])

  async function fetchAuditLogs() {
    try {
      setLoading(true)
      const res = await adminAPI.getAuditLogs(limit, filter)
      setLogs(res.data.logs)
    } catch (error) {
      console.error('Fetch audit logs error:', error)
    } finally {
      setLoading(false)
    }
  }

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'VOTER_REGISTRATION', label: 'Voter Registration' },
    { value: 'VOTER_VERIFIED', label: 'Voter Verified' },
    { value: 'ELECTION_CREATED', label: 'Election Created' },
    { value: 'ELECTION_STATUS_CHANGED', label: 'Election Status Changed' },
    { value: 'CANDIDATE_ADDED', label: 'Candidate Added' },
    { value: 'VOTE_CAST', label: 'Vote Cast' },
    { value: 'ADMIN_ROLE_GRANTED', label: 'Admin Role Granted' }
  ]

  return (
    <div className="container" style={styles.container}>
      <h1 style={styles.pageTitle}>Audit Logs</h1>
      <p style={styles.subtitle}>System activity and security monitoring</p>

      {/* Filters */}
      <div className="card" style={styles.filters}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <Filter size={16} />
              Action Type
            </label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={styles.select}
            >
              {actionTypes.map(action => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <FileText size={16} />
              Results Limit
            </label>
            <select 
              value={limit} 
              onChange={(e) => setLimit(parseInt(e.target.value))}
              style={styles.select}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="card" style={styles.emptyState}>
          <AlertCircle size={48} style={styles.emptyIcon} />
          <h3>No audit logs found</h3>
          <p>There are no audit logs matching your criteria.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={styles.timestamp}>
                      {log.timestamp ? 
                        convertTimestampToDate(log.timestamp)?.toLocaleString() || 'N/A' : 
                        'N/A'}
                    </td>
                    <td>
                      <span className={`badge badge-${getActionColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td>{log.email || log.userId || 'System'}</td>
                    <td style={styles.details}>
                      {renderDetails(log)}
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

function formatAction(action) {
  return action.replace(/_/g, ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getActionColor(action) {
  const colorMap = {
    VOTER_REGISTRATION: 'info',
    VOTER_VERIFIED: 'success',
    ELECTION_CREATED: 'success',
    ELECTION_STATUS_CHANGED: 'warning',
    CANDIDATE_ADDED: 'info',
    VOTE_CAST: 'success',
    ADMIN_ROLE_GRANTED: 'warning'
  }
  return colorMap[action] || 'info'
}

function renderDetails(log) {
  const details = []
  
  if (log.electionId) {
    details.push(`Election: ${log.electionId.substring(0, 8)}...`)
  }
  
  if (log.details) {
    if (log.details.title) {
      details.push(`Title: ${log.details.title}`)
    }
    if (log.details.name) {
      details.push(`Name: ${log.details.name}`)
    }
    if (log.details.party) {
      details.push(`Party: ${log.details.party}`)
    }
    if (log.details.newStatus) {
      details.push(`Status: ${log.details.newStatus}`)
    }
  }
  
  return details.length > 0 ? details.join(', ') : 'N/A'
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
  filters: {
    marginBottom: '2rem'
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  select: {
    padding: '0.625rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem'
  },
  emptyIcon: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem'
  },
  timestamp: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap'
  },
  details: {
    fontSize: '0.875rem',
    maxWidth: '300px',
    wordWrap: 'break-word'
  }
}

