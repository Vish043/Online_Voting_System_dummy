import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { electionsAPI } from '../services/api'
import { ArrowLeft, TrendingUp, Award, AlertCircle, CheckCircle } from 'lucide-react'

export default function Results() {
  const { electionId } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [election, setElection] = useState(null)
  const [results, setResults] = useState([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingApproval, setPendingApproval] = useState(false)

  useEffect(() => {
    fetchResults()
  }, [electionId])

  async function fetchResults() {
    try {
      setLoading(true)
      setError('')
      setPendingApproval(false)
      const res = await electionsAPI.getResults(electionId)
      setElection(res.data.election)
      setResults(res.data.results)
      setTotalVotes(res.data.totalVotes)
    } catch (error) {
      console.error('Fetch results error:', error)
      if (error.response?.status === 403 && error.response?.data?.resultsApproved === false) {
        setPendingApproval(true)
        setError('Results are pending admin approval. Please check back later.')
      } else {
        setError(error.message || 'Failed to load results')
      }
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

  if (error && !pendingApproval) {
    return (
      <div className="container" style={styles.container}>
        <div className="alert alert-error">
          {error}
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-outline">
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    )
  }

  if (pendingApproval) {
    return (
      <div className="container" style={styles.container}>
        <button onClick={() => navigate(-1)} className="btn btn-outline" style={styles.backBtn}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="card" style={styles.pendingCard}>
          <AlertCircle size={64} style={styles.pendingIcon} />
          <h1 style={styles.pendingTitle}>Results Pending Approval</h1>
          <p style={styles.pendingText}>
            The election results for <strong>{election?.title || 'this election'}</strong> are currently pending admin approval.
          </p>
          <p style={styles.pendingText}>
            Once an administrator reviews and approves the results, they will be made available to all voters.
          </p>
          <p style={styles.pendingSubtext}>
            Please check back later.
          </p>
        </div>
      </div>
    )
  }

  const winner = results[0]

  return (
    <div className="container" style={styles.container}>
      <button onClick={() => navigate(-1)} className="btn btn-outline" style={styles.backBtn}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="card" style={styles.header}>
        <h1 style={styles.title}>Election Results</h1>
        <h2 style={styles.electionTitle}>{election?.title}</h2>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <TrendingUp size={24} />
            <div>
              <div style={styles.statValue}>{totalVotes}</div>
              <div style={styles.statLabel}>Total Votes</div>
            </div>
          </div>
          <div style={styles.statItem}>
            <Award size={24} />
            <div>
              <div style={styles.statValue}>{results.length}</div>
              <div style={styles.statLabel}>Candidates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Card */}
      {winner && (
        <div className="card" style={styles.winnerCard}>
          <div style={styles.winnerBadge}>
            <Award size={24} />
            <span>Winner</span>
          </div>
          <h3 style={styles.winnerName}>{winner.name}</h3>
          <p style={styles.winnerParty}>{winner.party}</p>
          <div style={styles.winnerStats}>
            <div style={styles.winnerStatItem}>
              <div style={styles.winnerStatValue}>{winner.voteCount}</div>
              <div style={styles.winnerStatLabel}>Votes</div>
            </div>
            <div style={styles.winnerStatItem}>
              <div style={styles.winnerStatValue}>{winner.percentage}%</div>
              <div style={styles.winnerStatLabel}>Of Total</div>
            </div>
          </div>
        </div>
      )}

      {/* All Results */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>All Candidates</h3>
        <div style={styles.resultsList}>
          {results.map((candidate, index) => (
            <ResultCard 
              key={candidate.id} 
              candidate={candidate} 
              rank={index + 1}
              totalVotes={totalVotes}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ResultCard({ candidate, rank, totalVotes }) {
  return (
    <div className="card" style={styles.resultCard}>
      <div style={styles.resultHeader}>
        <div style={styles.rankBadge}>#{rank}</div>
        <div style={styles.resultInfo}>
          <h4 style={styles.resultName}>{candidate.name}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            {candidate.partySymbol && (
              <img 
                src={candidate.partySymbol} 
                alt={`${candidate.party} symbol`}
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}
            <p style={styles.resultParty}>{candidate.party}</p>
          </div>
        </div>
      </div>
      <div style={styles.resultStats}>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${candidate.percentage}%`
            }}
          />
        </div>
        <div style={styles.resultNumbers}>
          <span style={styles.resultVotes}>{candidate.voteCount} votes</span>
          <span style={styles.resultPercentage}>{candidate.percentage}%</span>
        </div>
      </div>
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
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: 'var(--primary-color)'
  },
  electionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    padding: '1.5rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--primary-color)'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  winnerCard: {
    textAlign: 'center',
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
    border: '2px solid var(--secondary-color)'
  },
  winnerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--secondary-color)',
    color: 'white',
    borderRadius: '9999px',
    fontWeight: 600,
    marginBottom: '1rem'
  },
  winnerName: {
    fontSize: '1.75rem',
    marginBottom: '0.5rem'
  },
  winnerParty: {
    fontSize: '1.125rem',
    color: 'var(--primary-color)',
    fontWeight: 600,
    marginBottom: '1.5rem'
  },
  winnerStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    padding: '1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '0.5rem'
  },
  winnerStatItem: {
    textAlign: 'center'
  },
  winnerStatValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'var(--secondary-color)',
    marginBottom: '0.25rem'
  },
  winnerStatLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  section: {
    marginTop: '2rem'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem'
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  resultCard: {
    padding: '1.5rem'
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  rankBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.875rem'
  },
  resultInfo: {
    flex: 1
  },
  resultName: {
    fontSize: '1.125rem',
    marginBottom: '0.25rem'
  },
  resultParty: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem'
  },
  resultStats: {
    marginTop: '1rem'
  },
  progressBar: {
    width: '100%',
    height: '24px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '0.5rem'
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--primary-color)',
    transition: 'width 0.5s ease'
  },
  resultNumbers: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem'
  },
  resultVotes: {
    color: 'var(--text-secondary)'
  },
  resultPercentage: {
    fontWeight: 600,
    color: 'var(--primary-color)'
  },
  pendingCard: {
    textAlign: 'center',
    padding: '3rem 2rem',
    maxWidth: '600px',
    margin: '0 auto'
  },
  pendingIcon: {
    color: 'var(--warning-color)',
    marginBottom: '1.5rem'
  },
  pendingTitle: {
    fontSize: '1.75rem',
    marginBottom: '1rem',
    color: 'var(--text-primary)'
  },
  pendingText: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    lineHeight: '1.6'
  },
  pendingSubtext: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    marginTop: '1.5rem'
  }
}

