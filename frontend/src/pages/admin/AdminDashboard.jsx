import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { Users, Vote, TrendingUp, CheckCircle, Clock, BarChart, XCircle, AlertCircle, Search, UserCircle, Building2, ArrowLeft } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState(null)
  const [pendingVoters, setPendingVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [votersLoading, setVotersLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchStatistics()
    fetchPendingVoters()
  }, [])

  async function fetchStatistics() {
    try {
      setLoading(true)
      const res = await adminAPI.getStatistics()
      setStatistics(res.data.statistics)
    } catch (error) {
      console.error('Fetch statistics error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPendingVoters() {
    try {
      setVotersLoading(true)
      const res = await adminAPI.getVoters('pending')
      const voters = res.data.voters || []
      setPendingVoters(voters)
      console.log('Pending voters fetched:', voters.length)
    } catch (error) {
      console.error('Fetch pending voters error:', error)
      setPendingVoters([])
    } finally {
      setVotersLoading(false)
    }
  }

  async function handleVerify(voterId, isVerified, isEligible) {
    try {
      await adminAPI.verifyVoter(voterId, { isVerified, isEligible })
      setMessage({ 
        type: 'success', 
        text: `Voter ${isVerified ? 'verified' : 'rejected'} successfully` 
      })
      await fetchPendingVoters()
      await fetchStatistics() // Refresh stats
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Verify voter error:', error)
      setMessage({ type: 'error', text: 'Failed to update voter status' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const filteredVoters = pendingVoters.filter(voter => {
    const searchLower = searchTerm.toLowerCase()
    return (
      voter.firstName?.toLowerCase().includes(searchLower) ||
      voter.lastName?.toLowerCase().includes(searchLower) ||
      voter.email?.toLowerCase().includes(searchLower)
    )
  })

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
          <h1 style={styles.pageTitle}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Manage elections, voters, and system operations</p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-3" style={styles.statsGrid}>
        <StatCard
          icon={<Users size={32} />}
          title="Total Voters"
          value={statistics?.totalVoters || 0}
          color="var(--primary-color)"
        />
        <StatCard
          icon={<CheckCircle size={32} />}
          title="Verified Voters"
          value={statistics?.verifiedVoters || 0}
          color="var(--secondary-color)"
        />
        <StatCard
          icon={<Clock size={32} />}
          title="Pending Verification"
          value={statistics?.pendingVerification || 0}
          color="var(--warning-color)"
        />
        <StatCard
          icon={<Vote size={32} />}
          title="Total Elections"
          value={statistics?.totalElections || 0}
          color="var(--primary-color)"
        />
        <StatCard
          icon={<TrendingUp size={32} />}
          title="Active Elections"
          value={statistics?.activeElections || 0}
          color="var(--secondary-color)"
        />
        <StatCard
          icon={<BarChart size={32} />}
          title="Total Votes Cast"
          value={statistics?.totalVotes || 0}
          color="var(--primary-color)"
        />
      </div>

      {/* Party Statistics */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Party Statistics</h2>
        <div className="grid grid-3" style={styles.statsGrid}>
          <StatCard
            icon={<Building2 size={32} />}
            title="Total Parties"
            value={statistics?.partiesByLevel?.total || 0}
            color="var(--primary-color)"
          />
          <StatCard
            icon={<Building2 size={32} />}
            title="National Parties"
            value={statistics?.partiesByLevel?.national || 0}
            color="var(--primary-color)"
          />
          <StatCard
            icon={<Building2 size={32} />}
            title="State Parties"
            value={statistics?.partiesByLevel?.state || 0}
            color="var(--secondary-color)"
          />
          <StatCard
            icon={<Building2 size={32} />}
            title="Local Parties"
            value={statistics?.partiesByLevel?.local || 0}
            color="var(--warning-color)"
          />
        </div>
      </section>

      {/* Candidate Template Statistics */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Candidate Template Statistics</h2>
        <div className="grid grid-3" style={styles.statsGrid}>
          <StatCard
            icon={<UserCircle size={32} />}
            title="Total Candidates"
            value={statistics?.candidatesByType?.total || 0}
            color="var(--primary-color)"
          />
          <StatCard
            icon={<UserCircle size={32} />}
            title="Lok Sabha Candidates"
            value={statistics?.candidatesByType?.lokSabha || 0}
            color="var(--primary-color)"
          />
          <StatCard
            icon={<UserCircle size={32} />}
            title="Vidhan Sabha Candidates"
            value={statistics?.candidatesByType?.vidhanSabha || 0}
            color="var(--secondary-color)"
          />
          <StatCard
            icon={<UserCircle size={32} />}
            title="Zilla Parishad Candidates"
            value={statistics?.candidatesByType?.zillaParishad || 0}
            color="var(--warning-color)"
          />
        </div>
      </section>

      {/* Pending Voters Verification Section */}
      {(pendingVoters.length > 0 || votersLoading || statistics?.pendingVerification > 0) && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Pending Voter Verifications</h2>
              <p style={styles.sectionSubtitle}>
                {pendingVoters.length > 0 
                  ? `${pendingVoters.length} voter${pendingVoters.length !== 1 ? 's' : ''} waiting for approval`
                  : statistics?.pendingVerification 
                    ? `${statistics.pendingVerification} voter${statistics.pendingVerification !== 1 ? 's' : ''} waiting for approval`
                    : 'Loading pending voters...'}
              </p>
            </div>
            <Link to="/admin/voters" className="btn btn-outline" style={styles.viewAllBtn}>
              View All Voters →
            </Link>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`} style={styles.alert}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {message.text}
            </div>
          )}

          {/* Search Box */}
          {pendingVoters.length > 0 && (
            <div style={styles.searchBox}>
              <Search size={20} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search voters by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          )}

          {/* Pending Voters List */}
          {votersLoading ? (
            <div className="loading-container" style={styles.loadingContainer}>
              <div className="spinner"></div>
            </div>
          ) : filteredVoters.length === 0 && pendingVoters.length === 0 ? (
            <div className="card" style={styles.emptyState}>
              <CheckCircle size={48} style={styles.emptyIcon} />
              <h3>No Pending Verifications</h3>
              <p>All voters have been processed.</p>
            </div>
          ) : filteredVoters.length === 0 && pendingVoters.length > 0 ? (
            <div className="card" style={styles.emptyState}>
              <Search size={48} style={styles.emptyIcon} />
              <h3>No Results Found</h3>
              <p>No voters match your search criteria.</p>
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
                      <th>National ID</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVoters.map((voter) => (
                      <tr key={voter.id || voter.uid}>
                        <td>
                          <strong>{voter.firstName} {voter.lastName}</strong>
                        </td>
                        <td>{voter.email}</td>
                        <td>{voter.dateOfBirth}</td>
                        <td>{voter.nationalId ? '***' + voter.nationalId.slice(-4) : 'N/A'}</td>
                        <td>
                          {voter.registeredAt ? 
                            (() => {
                              const date = voter.registeredAt?.toDate ? 
                                voter.registeredAt.toDate() : 
                                (voter.registeredAt?.seconds ? 
                                  new Date(voter.registeredAt.seconds * 1000) : 
                                  new Date(voter.registeredAt))
                              return date.toLocaleDateString()
                            })() : 
                            'N/A'}
                        </td>
                        <td>
                          <div style={styles.actionButtons}>
                            <button
                              className="btn btn-secondary"
                              style={styles.approveBtn}
                              onClick={() => handleVerify(voter.id || voter.uid, true, true)}
                              title="Approve and verify voter"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              style={styles.rejectBtn}
                              onClick={() => handleVerify(voter.id || voter.uid, false, false)}
                              title="Reject voter"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Quick Actions */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div className="grid grid-2">
          <ActionCard
            title="Manage Voters"
            description="Verify voter identities and manage voter eligibility"
            link="/admin/voters"
            icon={<Users size={40} />}
          />
          <ActionCard
            title="Manage Elections"
            description="Create, update, and monitor elections"
            link="/admin/elections"
            icon={<Vote size={40} />}
          />
          <ActionCard
            title="Create Election"
            description="Set up a new election with candidates"
            link="/admin/elections/create"
            icon={<TrendingUp size={40} />}
          />
          <ActionCard
            title="Audit Logs"
            description="View system activity and security logs"
            link="/admin/audit-logs"
            icon={<BarChart size={40} />}
          />
          <ActionCard
            title="Party Templates"
            description="Store and manage party information and symbols"
            link="/admin/party-templates"
            icon={<Building2 size={40} />}
          />
          <ActionCard
            title="Candidate Templates"
            description="Store and manage reusable candidate information"
            link="/admin/candidate-templates"
            icon={<UserCircle size={40} />}
          />
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="card" style={styles.statCard}>
      <div style={{ ...styles.statIcon, color }}>{icon}</div>
      <div style={styles.statContent}>
        <div style={{ ...styles.statValue, color }}>{value}</div>
        <div style={styles.statTitle}>{title}</div>
      </div>
    </div>
  )
}

function ActionCard({ title, description, link, icon }) {
  return (
    <Link to={link} className="card" style={styles.actionCard}>
      <div style={styles.actionIcon}>{icon}</div>
      <h3 style={styles.actionTitle}>{title}</h3>
      <p style={styles.actionDescription}>{description}</p>
      <span style={styles.actionLink}>Go to {title} →</span>
    </Link>
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
  pageTitle: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: 'var(--text-secondary)'
  },
  statsGrid: {
    marginBottom: '3rem'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  statIcon: {
    flexShrink: 0
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.25rem'
  },
  statTitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  section: {
    marginBottom: '3rem'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem'
  },
  actionCard: {
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.3s',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column'
  },
  actionIcon: {
    color: 'var(--primary-color)',
    marginBottom: '1rem'
  },
  actionTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem'
  },
  actionDescription: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    flex: 1
  },
  actionLink: {
    color: 'var(--primary-color)',
    fontWeight: 600,
    fontSize: '0.875rem'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  sectionSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    marginTop: '0.25rem'
  },
  viewAllBtn: {
    alignSelf: 'flex-start'
  },
  alert: {
    marginBottom: '1.5rem'
  },
  searchBox: {
    position: 'relative',
    marginBottom: '1.5rem'
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
    padding: '0.75rem 1rem 0.75rem 3rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  loadingContainer: {
    padding: '3rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem'
  },
  emptyIcon: {
    color: 'var(--secondary-color)',
    marginBottom: '1rem'
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  approveBtn: {
    fontSize: '0.75rem',
    padding: '0.375rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  rejectBtn: {
    fontSize: '0.75rem',
    padding: '0.375rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  }
}

