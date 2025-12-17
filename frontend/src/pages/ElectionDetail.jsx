import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { electionsAPI } from '../services/api'
import { Calendar, Users, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ElectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchElectionDetails()
  }, [id])

  async function fetchElectionDetails() {
    try {
      setLoading(true)
      const [detailsRes, votedRes] = await Promise.all([
        electionsAPI.getById(id),
        electionsAPI.checkVoted(id).catch(() => ({ data: { hasVoted: false } }))
      ])
      setElection(detailsRes.data.election)
      setCandidates(detailsRes.data.candidates)
      setHasVoted(votedRes.data.hasVoted)
    } catch (error) {
      console.error('Fetch election details error:', error)
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

  if (!election) {
    return (
      <div className="container" style={styles.container}>
        <div className="alert alert-error">
          <AlertCircle size={20} />
          Election not found
        </div>
      </div>
    )
  }

  const isActive = election.status === 'active'
  const startDate = election.startDate?.toDate ? new Date(election.startDate.toDate()) : new Date(election.startDate)
  const endDate = election.endDate?.toDate ? new Date(election.endDate.toDate()) : new Date(election.endDate)

  return (
    <div className="container" style={styles.container}>
      <button onClick={() => navigate(-1)} className="btn btn-outline" style={styles.backBtn}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="card" style={styles.electionHeader}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>{election.title}</h1>
            <p style={styles.description}>{election.description}</p>
          </div>
          <span className={`badge ${isActive ? 'badge-success' : 'badge-info'}`} style={styles.statusBadge}>
            {election.status}
          </span>
        </div>

        <div style={styles.electionMeta}>
          <div style={styles.metaItem}>
            <Calendar size={20} />
            <div>
              <small style={styles.metaLabel}>Start Date</small>
              <div>{startDate.toLocaleDateString()}</div>
            </div>
          </div>
          <div style={styles.metaItem}>
            <Calendar size={20} />
            <div>
              <small style={styles.metaLabel}>End Date</small>
              <div>{endDate.toLocaleDateString()}</div>
            </div>
          </div>
          <div style={styles.metaItem}>
            <Users size={20} />
            <div>
              <small style={styles.metaLabel}>Candidates</small>
              <div>{candidates.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Status */}
      {hasVoted && (
        <div className="alert alert-success">
          <CheckCircle size={20} />
          <div>
            <strong>You have already voted in this election</strong>
            <p style={styles.alertText}>Thank you for participating in the democratic process!</p>
          </div>
        </div>
      )}

      {/* Candidates */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Candidates</h2>
        <div className="grid grid-2">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      </section>

      {/* Vote Button */}
      {isActive && !hasVoted && (
        <div style={styles.voteSection}>
          <Link to={`/vote/${election.id}`} className="btn btn-primary" style={styles.voteBtn}>
            Cast Your Vote
          </Link>
        </div>
      )}

      {/* View Results Button */}
      {election.status === 'completed' && (
        <div style={styles.voteSection}>
          <Link to={`/results/${election.id}`} className="btn btn-secondary" style={styles.voteBtn}>
            View Results
          </Link>
        </div>
      )}
    </div>
  )
}

function CandidateCard({ candidate }) {
  return (
    <div className="card" style={styles.candidateCard}>
      {candidate.photoURL && (
        <img src={candidate.photoURL} alt={candidate.name} style={styles.candidatePhoto} />
      )}
      {!candidate.photoURL && (
        <div style={styles.candidatePlaceholder}>
          <Users size={48} />
        </div>
      )}
      <div style={styles.candidateInfo}>
        <h3 style={styles.candidateName}>{candidate.name}</h3>
        <p style={styles.candidateParty}>{candidate.party}</p>
        {candidate.biography && (
          <p style={styles.candidateBio}>{candidate.biography}</p>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem 1rem',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  backBtn: {
    marginBottom: '1.5rem'
  },
  electionHeader: {
    marginBottom: '2rem'
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '1.5rem',
    gap: '1rem'
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  description: {
    color: 'var(--text-secondary)',
    fontSize: '1.125rem'
  },
  statusBadge: {
    fontSize: '0.875rem',
    textTransform: 'capitalize'
  },
  electionMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1.5rem',
    padding: '1.5rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'start',
    gap: '0.75rem'
  },
  metaLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    display: 'block',
    marginBottom: '0.25rem'
  },
  alertText: {
    marginTop: '0.25rem',
    fontSize: '0.875rem'
  },
  section: {
    marginBottom: '2rem'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem'
  },
  candidateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  candidatePhoto: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '1rem'
  },
  candidatePlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    marginBottom: '1rem'
  },
  candidateInfo: {
    width: '100%'
  },
  candidateName: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem'
  },
  candidateParty: {
    color: 'var(--primary-color)',
    fontWeight: 600,
    marginBottom: '0.75rem'
  },
  candidateBio: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    lineHeight: '1.6'
  },
  voteSection: {
    textAlign: 'center',
    padding: '2rem 0'
  },
  voteBtn: {
    fontSize: '1.125rem',
    padding: '0.875rem 2rem'
  }
}

