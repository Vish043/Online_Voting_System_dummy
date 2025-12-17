import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { Users, Vote, TrendingUp, CheckCircle, Clock, BarChart } from 'lucide-react'

export default function AdminDashboard() {
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
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
  }
}

