import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI, electionsAPI, votesAPI } from '../services/api'
import { Vote, Calendar, CheckCircle, AlertCircle, Clock, TrendingUp, Award } from 'lucide-react'

export default function Dashboard() {
  const { currentUser, isAdmin } = useAuth()
  const [status, setStatus] = useState(null)
  const [elections, setElections] = useState([])
  const [completedElections, setCompletedElections] = useState([])
  const [votingHistory, setVotingHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      
      // Fetch voter status (only for non-admin users)
      if (!isAdmin) {
        try {
          const statusRes = await authAPI.getStatus()
          setStatus(statusRes.data)

          // Fetch voting history if eligible
          if (statusRes.data.eligible) {
            try {
              const historyRes = await votesAPI.getHistory()
              setVotingHistory(historyRes.data.votingHistory)
            } catch (historyError) {
              console.warn('Failed to fetch voting history:', historyError)
            }
          }
        } catch (statusError) {
          // If status check fails, set default status
          console.warn('Failed to fetch voter status:', statusError)
          setStatus({ registered: false, verified: false, eligible: false })
        }
      }

      // Fetch active elections (for both admins and regular users)
      const electionsRes = await electionsAPI.getActive()
      setElections(electionsRes.data.elections)

      // Fetch completed elections with approved results (for non-admin users)
      if (!isAdmin) {
        try {
          const completedRes = await electionsAPI.getCompleted()
          setCompletedElections(completedRes.data.elections || [])
        } catch (completedError) {
          console.warn('Failed to fetch completed elections:', completedError)
          setCompletedElections([])
        }
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
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

  return (
    <div className="container" style={styles.container}>
      <h1 style={styles.pageTitle}>Dashboard</h1>
      <p style={styles.welcome}>
        Welcome, {currentUser?.displayName || currentUser?.email}!
        {isAdmin && <span style={styles.adminBadge}> (Administrator)</span>}
      </p>

      {/* Admin Notice */}
      {isAdmin && (
        <div className="alert alert-info" style={styles.alert}>
          <AlertCircle size={20} />
          <div>
            <strong>Administrator Access</strong>
            <p style={styles.alertText}>
              As an administrator, you can view elections but cannot vote. Use the Admin panel to manage the system.
            </p>
          </div>
        </div>
      )}

      {/* Status Cards - Only show for non-admin users */}
      {!isAdmin && (
        <>
          <div className="grid grid-3" style={styles.statusGrid}>
            <StatusCard
              icon={<CheckCircle size={32} />}
              title="Registration"
              status={status?.registered ? 'Registered' : 'Not Registered'}
              color={status?.registered ? 'success' : 'danger'}
            />
            <StatusCard
              icon={<AlertCircle size={32} />}
              title="Verification"
              status={status?.verified ? 'Verified' : 'Pending'}
              color={status?.verified ? 'success' : 'warning'}
            />
            <StatusCard
              icon={<Vote size={32} />}
              title="Eligibility"
              status={status?.eligible ? 'Eligible' : 'Not Eligible'}
              color={status?.eligible ? 'success' : 'danger'}
            />
          </div>

          {/* Verification Notice */}
          {status?.registered && !status?.verified && (
            <div className="alert alert-warning" style={styles.alert}>
              <AlertCircle size={20} />
              <div>
                <strong>Verification Pending</strong>
                <p style={styles.alertText}>
                  Your voter registration is pending admin verification. You'll be able to vote once your identity is verified.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Active Elections */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Active Elections</h2>
          <Link to="/elections" className="btn btn-outline">
            View All
          </Link>
        </div>

        {elections.length === 0 ? (
          <div className="card" style={styles.emptyState}>
            <Calendar size={48} style={styles.emptyIcon} />
            <h3>No Active Elections</h3>
            <p>There are currently no active elections. Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {elections.slice(0, 4).map((election) => (
              <ElectionCard 
                key={election.id} 
                election={election} 
                eligible={status?.eligible} 
                isAdmin={currentUser && isAdmin}
              />
            ))}
          </div>
        )}
      </section>

      {/* Election Results - Only show for non-admin users */}
      {!isAdmin && completedElections.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Election Results</h2>
            <Link to="/elections?tab=completed" className="btn btn-outline">
              View All Results
            </Link>
          </div>
          <div className="grid grid-2">
            {completedElections.slice(0, 4).map((election) => {
              const endDate = convertTimestampToDate(election.endDate);
              return (
                <div key={election.id} className="card" style={styles.resultCard}>
                  <div style={styles.resultCardHeader}>
                    <h3 style={styles.resultCardTitle}>{election.title}</h3>
                    <span className="badge badge-info">Completed</span>
                  </div>
                  <p style={styles.resultCardDesc}>{election.description}</p>
                  <div style={styles.resultCardFooter}>
                    <div style={styles.resultCardDate}>
                      <Calendar size={16} />
                      <span>Ended: {endDate ? endDate.toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <Link 
                      to={`/results/${election.id}`} 
                      className="btn btn-primary"
                      style={styles.resultCardBtn}
                    >
                      <Award size={16} />
                      View Results
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Voting History - Only show for non-admin users */}
      {!isAdmin && status?.eligible && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Your Voting History</h2>
          {votingHistory.length === 0 ? (
            <div className="card" style={styles.emptyState}>
              <Clock size={48} style={styles.emptyIcon} />
              <h3>No Voting History</h3>
              <p>You haven't cast any votes yet.</p>
            </div>
          ) : (
            <div className="card">
              <div style={styles.historyList}>
                {votingHistory.map((vote, index) => {
                  const votedDate = convertTimestampToDate(vote.votedAt);
                  return (
                    <div key={index} style={styles.historyItem}>
                      <div>
                        <strong>{vote.electionTitle}</strong>
                        <p style={styles.historyDate}>
                          {votedDate ? votedDate.toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <span className="badge badge-success">Voted</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function StatusCard({ icon, title, status, color }) {
  const colorMap = {
    success: 'var(--secondary-color)',
    warning: 'var(--warning-color)',
    danger: 'var(--danger-color)'
  }

  return (
    <div className="card" style={styles.statusCard}>
      <div style={{ ...styles.statusIcon, color: colorMap[color] }}>
        {icon}
      </div>
      <h3 style={styles.statusTitle}>{title}</h3>
      <p style={{ ...styles.statusText, color: colorMap[color] }}>{status}</p>
    </div>
  )
}

// Helper function to convert Firestore Timestamp to Date
function convertTimestampToDate(timestamp) {
  if (!timestamp) return null;
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  
  return new Date(timestamp);
}

function ElectionCard({ election, eligible, isAdmin }) {
  const endDate = convertTimestampToDate(election.endDate);
  
  return (
    <div className="card" style={styles.electionCard}>
      <div style={styles.electionHeader}>
        <h3 style={styles.electionTitle}>{election.title}</h3>
        <span className="badge badge-success">Active</span>
      </div>
      <p style={styles.electionDesc}>{election.description}</p>
      <div style={styles.electionFooter}>
        <div style={styles.electionDate}>
          <Calendar size={16} />
          <span>Ends: {endDate ? endDate.toLocaleDateString() : 'N/A'}</span>
        </div>
        <Link 
          to={`/elections/${election.id}`} 
          className={`btn ${eligible && !isAdmin ? 'btn-primary' : 'btn-outline'}`}
          style={styles.electionBtn}
        >
          {isAdmin ? 'View Details (Admin)' : eligible ? 'Vote Now' : 'View Details'}
        </Link>
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
  welcome: {
    color: 'var(--text-secondary)',
    marginBottom: '2rem'
  },
  adminBadge: {
    color: 'var(--warning-color)',
    fontWeight: 600,
    marginLeft: '0.5rem'
  },
  statusGrid: {
    marginBottom: '2rem'
  },
  statusCard: {
    textAlign: 'center'
  },
  statusIcon: {
    marginBottom: '1rem'
  },
  statusTitle: {
    fontSize: '1rem',
    marginBottom: '0.5rem',
    color: 'var(--text-secondary)'
  },
  statusText: {
    fontSize: '1.125rem',
    fontWeight: 600
  },
  alert: {
    marginBottom: '2rem'
  },
  alertText: {
    marginTop: '0.25rem',
    fontSize: '0.875rem'
  },
  section: {
    marginBottom: '3rem'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  sectionTitle: {
    fontSize: '1.5rem'
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
  electionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '0.75rem'
  },
  electionTitle: {
    fontSize: '1.125rem',
    marginBottom: '0.5rem'
  },
  electionDesc: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    flex: 1
  },
  electionFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-color)'
  },
  electionDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem'
  },
  electionBtn: {
    fontSize: '0.875rem',
    padding: '0.5rem 1rem'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--border-color)'
  },
  historyDate: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem'
  },
  resultCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  resultCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '0.75rem'
  },
  resultCardTitle: {
    fontSize: '1.125rem',
    marginBottom: '0.5rem',
    flex: 1
  },
  resultCardDesc: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    flex: 1
  },
  resultCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-color)',
    marginTop: 'auto'
  },
  resultCardDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem'
  },
  resultCardBtn: {
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }
}

