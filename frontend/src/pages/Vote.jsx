import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { electionsAPI, votesAPI } from '../services/api'
import { AlertCircle, CheckCircle, Users, ArrowLeft, Shield } from 'lucide-react'

export default function Vote() {
  const { electionId } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [election, setElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      setError('Administrators cannot vote in elections. Redirecting...')
      setTimeout(() => {
        navigate(`/elections/${electionId}`)
      }, 3000)
    }
  }, [isAdmin, electionId, navigate])

  useEffect(() => {
    fetchElectionData()
  }, [electionId])

  async function fetchElectionData() {
    try {
      setLoading(true)
      const res = await electionsAPI.getById(electionId)
      setElection(res.data.election)
      setCandidates(res.data.candidates)
    } catch (error) {
      console.error('Fetch election error:', error)
      setError('Failed to load election data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitVote() {
    if (!selectedCandidate) {
      return setError('Please select a candidate')
    }

    const confirmed = window.confirm(
      'Are you sure you want to cast your vote? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      setSubmitting(true)
      setError('')
      
      await votesAPI.cast({
        electionId,
        candidateId: selectedCandidate
      })

      setSuccess(true)
      setTimeout(() => {
        navigate(`/elections/${electionId}`)
      }, 3000)
    } catch (error) {
      console.error('Vote submission error:', error)
      setError(error.message || 'Failed to submit vote')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className="container" style={styles.container}>
        <button onClick={() => navigate(-1)} className="btn btn-outline" style={styles.backBtn}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="card" style={styles.header}>
          <Shield size={64} style={{ color: 'var(--warning-color)', marginBottom: '1rem' }} />
          <h1 style={styles.title}>Administrator Access Restricted</h1>
          <p style={styles.description}>
            As an administrator, you cannot vote in elections. This ensures the integrity and fairness of the voting process.
          </p>
          <p style={styles.description}>
            Redirecting you to the election details page...
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container" style={styles.container}>
        <div className="card" style={styles.successCard}>
          <CheckCircle size={64} style={styles.successIcon} />
          <h1 style={styles.successTitle}>Vote Submitted Successfully!</h1>
          <p style={styles.successText}>
            Thank you for participating in {election?.title}. Your vote has been securely recorded.
          </p>
          <p style={styles.successText}>
            You will be redirected to the election details page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={styles.container}>
      <button onClick={() => navigate(-1)} className="btn btn-outline" style={styles.backBtn}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="card" style={styles.header}>
        <h1 style={styles.title}>Cast Your Vote</h1>
        <h2 style={styles.electionTitle}>{election?.title}</h2>
        <p style={styles.description}>
          Select one candidate below to cast your vote. This action is final and cannot be changed.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Important Notice */}
      <div className="alert alert-warning">
        <AlertCircle size={20} />
        <div>
          <strong>Important Notice</strong>
          <ul style={styles.noticeList}>
            <li>You can only vote once in this election</li>
            <li>Your vote is anonymous and cannot be traced back to you</li>
            <li>Once submitted, your vote cannot be changed</li>
            <li>Review your selection carefully before submitting</li>
          </ul>
        </div>
      </div>

      {/* Candidates */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Select a Candidate</h3>
        <div className="grid grid-2">
          {candidates.map((candidate) => (
            <CandidateOption
              key={candidate.id}
              candidate={candidate}
              selected={selectedCandidate === candidate.id}
              onSelect={() => setSelectedCandidate(candidate.id)}
            />
          ))}
        </div>
      </section>

      {/* Submit Button */}
      <div style={styles.submitSection}>
        <button
          onClick={handleSubmitVote}
          className="btn btn-primary"
          style={styles.submitBtn}
          disabled={!selectedCandidate || submitting}
        >
          {submitting ? 'Submitting Vote...' : 'Submit Vote'}
        </button>
      </div>
    </div>
  )
}

function CandidateOption({ candidate, selected, onSelect }) {
  return (
    <div
      className="card"
      style={{
        ...styles.candidateCard,
        ...(selected ? styles.selectedCard : {}),
        cursor: 'pointer'
      }}
      onClick={onSelect}
    >
      <input
        type="radio"
        checked={selected}
        onChange={onSelect}
        style={styles.radio}
      />
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
    marginBottom: '1rem'
  },
  description: {
    color: 'var(--text-secondary)',
    fontSize: '1rem'
  },
  noticeList: {
    marginTop: '0.5rem',
    marginLeft: '1.5rem',
    fontSize: '0.875rem'
  },
  section: {
    marginTop: '2rem',
    marginBottom: '2rem'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    marginBottom: '1.5rem'
  },
  candidateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    transition: 'all 0.3s',
    border: '2px solid transparent'
  },
  selectedCard: {
    border: '2px solid var(--primary-color)',
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    transform: 'scale(1.02)'
  },
  radio: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    width: '20px',
    height: '20px',
    cursor: 'pointer'
  },
  candidatePhoto: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '1rem'
  },
  candidatePlaceholder: {
    width: '100px',
    height: '100px',
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
    fontSize: '1.125rem',
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
  submitSection: {
    textAlign: 'center',
    padding: '2rem 0',
    borderTop: '1px solid var(--border-color)'
  },
  submitBtn: {
    fontSize: '1.125rem',
    padding: '0.875rem 3rem'
  },
  successCard: {
    textAlign: 'center',
    padding: '3rem'
  },
  successIcon: {
    color: 'var(--secondary-color)',
    marginBottom: '1.5rem'
  },
  successTitle: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: 'var(--secondary-color)'
  },
  successText: {
    color: 'var(--text-secondary)',
    fontSize: '1.125rem',
    marginBottom: '1rem'
  }
}

