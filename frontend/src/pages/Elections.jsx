import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { electionsAPI } from '../services/api'
import { Calendar, Clock, TrendingUp, Award } from 'lucide-react'

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

export default function Elections() {
  const [activeElections, setActiveElections] = useState([])
  const [upcomingElections, setUpcomingElections] = useState([])
  const [completedElections, setCompletedElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')

  useEffect(() => {
    fetchElections()
  }, [])

  async function fetchElections() {
    try {
      setLoading(true)
      const [activeRes, upcomingRes, completedRes] = await Promise.all([
        electionsAPI.getActive(),
        electionsAPI.getUpcoming(),
        electionsAPI.getCompleted().catch(() => ({ data: { elections: [] } }))
      ])
      setActiveElections(activeRes.data.elections)
      setUpcomingElections(upcomingRes.data.elections)
      setCompletedElections(completedRes.data.elections)
    } catch (error) {
      console.error('Fetch elections error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  const elections = tab === 'active' ? activeElections : 
                   tab === 'upcoming' ? upcomingElections : 
                   completedElections

  return (
    <div className="container" style={styles.container}>
      <h1 style={styles.pageTitle}>Elections</h1>
      <p style={styles.subtitle}>Browse and participate in elections</p>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{...styles.tab, ...(tab === 'active' ? styles.activeTab : {})}}
          onClick={() => setTab('active')}
        >
          <TrendingUp size={18} />
          Active ({activeElections.length})
        </button>
        <button
          style={{...styles.tab, ...(tab === 'upcoming' ? styles.activeTab : {})}}
          onClick={() => setTab('upcoming')}
        >
          <Clock size={18} />
          Upcoming ({upcomingElections.length})
        </button>
        <button
          style={{...styles.tab, ...(tab === 'completed' ? styles.activeTab : {})}}
          onClick={() => setTab('completed')}
        >
          <Award size={18} />
          Results ({completedElections.length})
        </button>
      </div>

      {/* Elections Grid */}
      {elections.length === 0 ? (
        <div className="card" style={styles.emptyState}>
          <Calendar size={48} style={styles.emptyIcon} />
          <h3>No {tab} Elections</h3>
          <p>There are currently no {tab} elections.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {elections.map((election) => (
            <ElectionCard 
              key={election.id} 
              election={election} 
              isActive={tab === 'active'} 
              isCompleted={tab === 'completed'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ElectionCard({ election, isActive, isCompleted }) {
  const startDate = convertTimestampToDate(election.startDate);
  const endDate = convertTimestampToDate(election.endDate);

  return (
    <div className="card" style={styles.electionCard}>
      <div style={styles.cardHeader}>
        <span className={`badge ${isActive ? 'badge-success' : isCompleted ? 'badge-info' : 'badge-info'}`}>
          {isActive ? 'Active' : isCompleted ? 'Completed' : 'Upcoming'}
        </span>
        <span style={styles.electionType}>{election.type}</span>
      </div>

      <h3 style={styles.electionTitle}>{election.title}</h3>
      <p style={styles.electionDesc}>{election.description}</p>

      <div style={styles.dates}>
        <div style={styles.date}>
          <Calendar size={16} />
          <div>
            <small style={styles.dateLabel}>Start Date</small>
            <div>{startDate ? startDate.toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
        <div style={styles.date}>
          <Calendar size={16} />
          <div>
            <small style={styles.dateLabel}>End Date</small>
            <div>{endDate ? endDate.toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <Link 
          to={`/elections/${election.id}`} 
          className="btn btn-outline" 
          style={styles.viewBtn}
        >
          View Details
        </Link>
        {isCompleted && election.resultsApproved && (
          <Link 
            to={`/results/${election.id}`} 
            className="btn btn-primary" 
            style={styles.resultsBtn}
          >
            <Award size={16} />
            View Results
          </Link>
        )}
      </div>
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
  tabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '2px solid var(--border-color)'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px',
    transition: 'all 0.2s'
  },
  activeTab: {
    color: 'var(--primary-color)',
    borderBottom: '3px solid var(--primary-color)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem'
  },
  emptyIcon: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem'
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
  electionType: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    textTransform: 'capitalize'
  },
  electionTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.75rem'
  },
  electionDesc: {
    color: 'var(--text-secondary)',
    marginBottom: '1.5rem',
    flex: 1
  },
  dates: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem'
  },
  date: {
    display: 'flex',
    alignItems: 'start',
    gap: '0.5rem'
  },
  dateLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.75rem'
  },
  viewBtn: {
    flex: 1
  },
  footer: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto'
  },
  resultsBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1
  }
}

